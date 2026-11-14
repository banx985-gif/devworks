// Local notifications with on/off switches (Aaron's 8 Nov series rule 2; built first for BOTWORKS Milestone 38, any
// series game). Content-free: the game says which kinds it has, writes the lines and decides what is worth a nudge;
// this file plans them (the daily cap, the quiet hours, the switches) and hands them to the phone or the browser.
// Nothing leaves the device: no server, no personal data.
//
// Planning (pure, tested in Node):
//   planNotifications(wanted, { now, enabled(kind), maxPerDay = 3, quietFrom = 22, quietTo = 8, minDelayMs = 60000 })
//     wanted: [{ kind, at (ms), title, body, open }] → the ones to schedule, sorted by time: switched-off kinds dropped,
//     anything in the quiet hours (10 pm – 8 am local) moved to 8 am, at most maxPerDay on any one day (earliest kept),
//     at most one of each kind.
//   outOfQuiet(at, from, to) → the time moved out of the quiet hours.
//
// Delivery (LocalNotify):
//   const ln = new LocalNotify({ bridge, kinds: ['comeBack', …], channel: { id, name, description }, icon })
//   ln.platform            'native' (the app: Capacitor Local Notifications) · 'web' (the Notification API) · 'none'
//   await ln.permission()  'granted' · 'denied' · 'prompt' · 'unsupported'
//   await ln.request()     asks the phone / browser (call it only after the game's own friendly question) → granted?
//   await ln.schedule(list) replaces everything waiting with the planned list (cancelAll first)
//   await ln.cancel(kind)  cancels the waiting ones of one kind; ln.cancelAll()
//   ln.onOpen(fn)          fn({ kind, open }) when the player taps one (in the app, also the tap that launched it)
// The web skips quietly where notifications aren't allowed: every call resolves, nothing throws.
export const NOTIFY_RULES = { maxPerDay: 3, quietFrom: 22, quietTo: 8 };

export function outOfQuiet(at, from = NOTIFY_RULES.quietFrom, to = NOTIFY_RULES.quietTo) {
  const d = new Date(at);
  const h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  if (h >= from) {
    d.setDate(d.getDate() + 1);
    d.setHours(to, 0, 0, 0);
    return d.getTime();
  }
  if (h < to) {
    d.setHours(to, 0, 0, 0);
    return d.getTime();
  }
  return at;
}

const dayKey = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export function planNotifications(wanted, { now = Date.now(), enabled = () => true, maxPerDay = NOTIFY_RULES.maxPerDay, quietFrom = NOTIFY_RULES.quietFrom, quietTo = NOTIFY_RULES.quietTo, minDelayMs = 60000 } = {}) {
  const seen = new Set();
  const items = (wanted ?? [])
    .filter((w) => w && w.kind && Number.isFinite(w.at) && enabled(w.kind))
    .map((w) => ({ ...w, at: outOfQuiet(Math.max(now + minDelayMs, w.at), quietFrom, quietTo) }))
    .sort((a, b) => a.at - b.at)
    .filter((w) => !seen.has(w.kind) && seen.add(w.kind));
  const perDay = new Map();
  const out = [];
  for (const w of items) {
    const k = dayKey(w.at);
    const n = perDay.get(k) ?? 0;
    if (n >= maxPerDay) continue;
    perDay.set(k, n + 1);
    out.push(w);
  }
  return out;
}

export class LocalNotify {
  constructor({ bridge = null, win = globalThis.window, kinds = [], channel = { id: 'reminders', name: 'Reminders', description: 'Short reminders from the game' }, icon = null } = {}) {
    this.bridge = bridge;
    this.win = win;
    this.kinds = [...kinds];
    this.channel = channel;
    this.icon = icon;
    this.listeners = [];
    this.timers = new Map(); // web: kind → setTimeout id
    this.scheduled = []; // the list last handed over (tests, debug)
    this.platform = bridge?.isNative && bridge.plugin('LocalNotifications') ? 'native' : win && 'Notification' in win ? 'web' : 'none';
    this._channelMade = false;
    if (this.platform === 'native') {
      bridge.listen('LocalNotifications', 'localNotificationActionPerformed', (e) => this._opened(e?.notification?.extra ?? {}));
    } else if (this.platform === 'web') {
      // Shown through the service worker (phone browsers): its notificationclick posts { type: 'notify:open', data }.
      win.navigator?.serviceWorker?.addEventListener?.('message', (e) => e.data?.type === 'notify:open' && this._opened(e.data.data ?? {}));
    }
  }

  // A kind's notification id (Android wants whole numbers): kind number × 10 + 1.
  idOf(kind) {
    const i = this.kinds.indexOf(kind);
    return (i < 0 ? this.kinds.push(kind) - 1 : i) * 10 + 1;
  }

  // A tap that came before the game listened (the one that launched the app) is handed over straight away.
  onOpen(fn) {
    this.listeners.push(fn);
    if (this.pendingOpen) {
      const info = this.pendingOpen;
      this.pendingOpen = null;
      fn(info);
    }
    return this;
  }

  _opened(extra) {
    const info = { kind: extra.kind ?? null, open: extra.open ?? null };
    if (!this.listeners.length) return void (this.pendingOpen = info);
    for (const fn of this.listeners) {
      try {
        fn(info);
      } catch (err) {
        console.error('[LocalNotify] open', err);
      }
    }
  }

  async permission() {
    if (this.platform === 'native') {
      const r = await this.bridge.call('LocalNotifications', 'checkPermissions');
      const d = r?.display;
      return d === 'granted' ? 'granted' : d === 'denied' ? 'denied' : d ? 'prompt' : 'unsupported';
    }
    if (this.platform === 'web') {
      const p = this.win.Notification.permission;
      return p === 'granted' ? 'granted' : p === 'denied' ? 'denied' : 'prompt';
    }
    return 'unsupported';
  }

  async request() {
    try {
      if (this.platform === 'native') return (await this.bridge.call('LocalNotifications', 'requestPermissions'))?.display === 'granted';
      if (this.platform === 'web') return (await this.win.Notification.requestPermission()) === 'granted';
    } catch {
      /* the browser said no, or asks only from a tap: skip quietly */
    }
    return false;
  }

  async schedule(list) {
    await this.cancelAll();
    if (!list?.length || (await this.permission()) !== 'granted') return [];
    this.scheduled = list.map((n) => ({ ...n, id: this.idOf(n.kind) }));
    if (this.platform === 'native') {
      if (!this._channelMade) {
        this._channelMade = true;
        await this.bridge.call('LocalNotifications', 'createChannel', { id: this.channel.id, name: this.channel.name, description: this.channel.description ?? '', importance: 3, visibility: 1 });
      }
      await this.bridge.call('LocalNotifications', 'schedule', {
        notifications: this.scheduled.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          schedule: { at: new Date(n.at), allowWhileIdle: true },
          // Reminders need no to-the-minute timing: never exact (Capacitor 8's plugin would otherwise send the player to
          // Android's "Alarms & reminders" settings when the app has no exact-alarm permission).
          isExactNotification: false,
          channelId: this.channel.id,
          ...(this.icon ? { smallIcon: this.icon } : {}),
          extra: { kind: n.kind, open: n.open ?? null },
        })),
      });
    } else if (this.platform === 'web') {
      for (const n of this.scheduled) {
        const ms = Math.max(0, n.at - Date.now());
        if (ms > 2 ** 31 - 1) continue; // past what a browser timer can wait
        this.timers.set(n.kind, setTimeout(() => this._showWeb(n), ms));
      }
    }
    return this.scheduled;
  }

  async _showWeb(n) {
    this.timers.delete(n.kind);
    const opts = { body: n.body, tag: n.kind, data: { kind: n.kind, open: n.open ?? null }, ...(this.icon ? { icon: this.icon } : {}) };
    try {
      const note = new this.win.Notification(n.title, opts);
      note.onclick = () => {
        try {
          this.win.focus();
        } catch {
          /* fine */
        }
        note.close();
        this._opened(opts.data);
      };
    } catch {
      // Phone browsers show notifications only through the service worker (its notificationclick brings the page back).
      try {
        const reg = await this.win.navigator?.serviceWorker?.ready;
        await reg?.showNotification(n.title, opts);
      } catch {
        /* not allowed here: skip quietly */
      }
    }
  }

  async cancel(kind) {
    this.scheduled = this.scheduled.filter((n) => n.kind !== kind);
    if (this.platform === 'native') return void (await this.bridge.call('LocalNotifications', 'cancel', { notifications: [{ id: this.idOf(kind) }] }));
    clearTimeout(this.timers.get(kind));
    this.timers.delete(kind);
  }

  async cancelAll() {
    this.scheduled = [];
    if (this.platform === 'native') {
      const ids = this.kinds.map((k) => ({ id: this.idOf(k) }));
      if (ids.length) await this.bridge.call('LocalNotifications', 'cancel', { notifications: ids });
      return;
    }
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
  }
}
