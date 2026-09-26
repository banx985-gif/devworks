// The Roster (Milestone 2), from the Staff button: one card per worker — portrait, name, role, level, Energy /
// Morale bars and what they are doing now (core/ui/StaffCard). Drag scrolls; tap a card for the staff detail.
// The studio keeps running behind it at the top bar's speed.
import { THEME, font } from '../../../../core/Theme.js';
import { ScrollList } from '../../../../core/ui/ScrollList.js';
import { drawStaffCard, STAFF_CARD_HEIGHT } from '../../../../core/ui/StaffCard.js';
import { WORK_STATE } from '../../data/studio.js';
import { STATS, ROLES, TIERS, TRAITS } from '../../data/staff.js';
import { STATUS_ICONS } from '../../data/home.js';

const C = THEME.color;
const S = THEME.size;

// What a roster card shows for one worker (shared with tests).
export function staffCardView(world, w) {
  const s = w.staff;
  return {
    title: s.name,
    subtitle: `${ROLES[s.role].name} · Lv ${s.level} · ${TIERS[s.tier].name}`,
    portraitKey: s.art,
    xp: { value: s.xp, max: world.staffSystem.xpNeeded(s.level) },
    stats: STATS.map((st) => ({ label: st.label, value: s.stats[st.key] })),
    bars: [
      { label: 'Energy', value: s.energy, max: 100, color: s.status.tired ? C.warn : C.progress },
      { label: 'Morale', value: s.morale, max: 100, color: s.status.stressed ? C.warn : C.good },
    ],
    chips: s.traits.map((t) => ({ label: TRAITS[t]?.name ?? t })),
    icons: [s.status.tired && STATUS_ICONS.tired, s.status.stressed && STATUS_ICONS.stressed].filter(Boolean),
    footer: `Now: ${world.stateLine(w, WORK_STATE[w.phase].line)}`,
  };
}

export function createRosterScreen({ renderer, layout, assets, world, topBar, openStaff }) {
  const W = renderer.width;
  const headRect = () => {
    const t = topBar.rect();
    return { x: layout.safeRect.x + 32, y: t.y + t.h + 20, w: layout.safeRect.w - 64, h: 90 };
  };
  const listRect = () => {
    const h = headRect();
    const sr = layout.safeRect;
    return { x: sr.x + 24, y: h.y + h.h + 10, w: sr.w - 48, h: sr.y + sr.h - 24 - (h.y + h.h + 10) };
  };
  const list = new ScrollList({
    getRect: listRect,
    itemHeight: STAFF_CARD_HEIGHT,
    gap: 20,
    renderItem: (ctx, w, r) => drawStaffCard(ctx, r, staffCardView(world, w), assets),
  });

  return {
    list,
    enter() {
      list.setItems([...world.workers]);
      list.scrollY = 0;
    },
    // Screen rect of a worker's card (tests).
    cardRect(id) {
      const i = list.items.findIndex((w) => w.id === id);
      return i < 0 ? null : list.itemRect(i);
    },
    onDragStart(p) {
      list.beginDrag(p);
    },
    onDrag(p) {
      list.drag(p);
    },
    onDragEnd(p) {
      list.endDrag(p);
    },
    onUp(p) {
      list.endDrag(p);
    },
    onTap(p) {
      if (topBar.handleTap(p)) return;
      const hit = list.itemAt(p);
      if (hit) openStaff(hit.item.id);
    },
    render(ctx) {
      const h = headRect();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.text;
      ctx.font = font(S.title, true);
      ctx.fillText('Staff', h.x, h.y + h.h / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = C.textMuted;
      ctx.font = font(S.body);
      ctx.fillText(`${world.workers.length} in the team · tap a card for details`, h.x + h.w, h.y + h.h / 2, W * 0.6);
      list.render(ctx);
      topBar.render(ctx);
    },
  };
}
