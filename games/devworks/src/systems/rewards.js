// Reward drops (Milestone 40c, Aaron's play-feel notes §4). Saved with the studio; every number in data/rewards.js.
//   gift box (small): a breakthrough (breakthroughChance), a milestone finished on schedule (phaseOnTrackChance)
//   chest (big): a release reviewed releaseReview+, a request target hit ('request:result'), a personal best
//     ('staff:pride', the pride quote)
// At most REWARDS.maxWaiting wait unopened. open(id) rolls the drop's table (seeded) and applies it: Credits, Research
// Points, an Energy / Morale lift for the team, an idea (+N to one stat on the next game started), and from a chest
// also a training voucher (the next course is refunded), a free marketing action (the next one is refunded) or, rarely,
// a Studio Token. Never an unlock, never a Store-only item (bible §2.8).
import { Rng } from '../../../../core/Rng.js';
import { REWARDS as W } from '../../data/rewards.js';

const STAT_NAMES = { gameplay: 'Gameplay', graphics: 'Graphics', story: 'Story', innovation: 'Innovation', polish: 'Polish', audienceFit: 'Audience Fit' };

export function createRewards({ bus, clock, world, business, research, projects, seed = () => 'devworks' }) {
  let s = fresh();
  function fresh() {
    return { drops: [], nextId: 1, rng: null, idea: null, vouchers: 0, freeMarketing: 0, opened: 0, given: { credits: 0, rp: 0, tokens: 0 } };
  }
  const rngNow = () => {
    const r = new Rng(`${seed()}|rewards`);
    if (s.rng != null) r.setState(s.rng);
    return r;
  };
  const roll = (f) => {
    const r = rngNow();
    const out = f(r);
    s.rng = r.getState();
    return out;
  };
  function drop(kind, why) {
    if (s.drops.length >= W.maxWaiting) return null;
    const d = { id: `D${s.nextId++}`, kind, why, day: clock.totalDays };
    s.drops.push(d);
    bus.emit('reward:drop', { drop: d });
    return d;
  }

  bus.on('project:breakthrough', () => roll((r) => r.next() < W.drops.breakthroughChance) && drop('small', 'A breakthrough'));
  bus.on('project:phase', ({ job }) => {
    const v = job && projects.view(job);
    if (v && v.status === 'onTrack' && roll((r) => r.next() < W.drops.phaseOnTrackChance)) drop('small', 'A milestone on schedule');
  });
  bus.on('game:released', ({ record }) => (record?.release?.score ?? 0) >= W.drops.releaseReview && drop('big', `"${record.result.title}" reviewed ${record.release.score}`));
  bus.on('request:result', ({ result }) => result.hit && drop('big', `${result.asker.name}'s request ${result.bonus ? 'beaten' : 'hit'}`));
  bus.on('staff:pride', ({ name }) => drop('big', `${name}'s best work yet`));
  // The idea boost goes into the next game started; vouchers and free marketing pay the next one back.
  bus.on('project:start', ({ job }) => {
    if (!s.idea || !job?.data) return;
    job.data.bonus = { ...(job.data.bonus ?? {}) };
    job.data.bonus[s.idea.stat] = (job.data.bonus[s.idea.stat] ?? 0) + s.idea.points;
    bus.emit('reward:used', { type: 'idea', idea: s.idea, job });
    s.idea = null;
  });
  bus.on('training:start', ({ course }) => {
    if (s.vouchers < 1 || !course?.cost) return;
    s.vouchers--;
    business.economy.add('credits', course.cost, `Training voucher: ${course.name}`, 'rewards');
  });
  bus.on('marketing:run', ({ cost, action }) => {
    if (s.freeMarketing < 1 || !cost) return;
    s.freeMarketing--;
    business.economy.add('credits', cost, `Free marketing: ${action?.name ?? ''}`, 'rewards');
  });

  const scale = () => 1 + W.perYear * Math.max(0, clock.year - 1);
  // Open a drop: one roll on its table, applied now. Returns { drop, items: [{ type, amount, text }] }.
  function open(id) {
    const d = s.drops.find((x) => x.id === id);
    if (!d) return null;
    s.drops = s.drops.filter((x) => x !== d);
    const table = W[d.kind];
    const item = roll((r) => {
      let t = r.next() * table.reduce((a, x) => a + x.weight, 0);
      const it = table.find((x) => (t -= x.weight) <= 0) ?? table[0];
      const stat = it.type === 'idea' ? W.ideaStats[Math.floor(r.next() * W.ideaStats.length)] : null;
      return { ...it, stat };
    });
    let n = item.amount;
    if (item.type === 'credits') {
      n = Math.round(item.amount * scale());
      business.economy.add('credits', n, `Reward ${d.kind === 'big' ? 'chest' : 'box'}`, 'rewards');
      s.given.credits += n;
    } else if (item.type === 'rp') {
      n = Math.round(item.amount * scale());
      research?.system?.addRp?.(n, 'Reward', clock.totalDays);
      s.given.rp += n;
    } else if (item.type === 'energy') {
      for (const st of world.staffSystem.staff) {
        st.energy = Math.min(100, (st.energy ?? 0) + n);
        st.morale = Math.min(100, (st.morale ?? 0) + n);
      }
    } else if (item.type === 'idea') s.idea = { stat: item.stat, points: n };
    else if (item.type === 'voucher') s.vouchers += n;
    else if (item.type === 'marketing') s.freeMarketing += n;
    else if (item.type === 'token') {
      business.economy.add('tokens', n, 'Reward chest', 'rewards');
      s.given.tokens += n;
    }
    s.opened++;
    const text = item.text.replace('{n}', n.toLocaleString('en-GB')).replace('{stat}', STAT_NAMES[item.stat] ?? '');
    const out = { drop: d, items: [{ type: item.type, amount: n, stat: item.stat, text }] };
    bus.emit('reward:opened', out);
    return out;
  }

  return {
    get drops() {
      return s.drops;
    },
    get idea() {
      return s.idea;
    },
    get vouchers() {
      return s.vouchers;
    },
    get freeMarketing() {
      return s.freeMarketing;
    },
    get given() {
      return s.given;
    },
    drop,
    open,
    newGame() {
      s = fresh();
    },
    serialize: () => JSON.parse(JSON.stringify(s)),
    load(data) {
      s = { ...fresh(), ...(data ? JSON.parse(JSON.stringify(data)) : {}) };
    },
  };
}
