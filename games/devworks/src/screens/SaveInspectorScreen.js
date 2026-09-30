// The save inspector (Milestone 35, debug only: ?debug=1 → Business → Debug: save inspector). A card list with, for
// each of the four slots and the account file: every stored copy (sequence, save version, size, when, checksum status,
// which one is current), the last §50 boundary saved, and buttons to export the current copy as text (to the
// clipboard and window.__dwExport, for a bug report), import one pasted as text (it becomes the newest copy, after it
// migrates cleanly) and, for testing the fallback, damage the current copy. Also where the saves live (IndexedDB, or
// localStorage after a failed write).
import { THEME } from '../../../../core/Theme.js';
import { createCardListScreen } from '../ui/cardListScreen.js';

const C = THEME.color;
const kb = (n) => `${Math.round((n ?? 0) / 1024)} KB`;
const when = (t) => (t ? new Date(t).toLocaleString('en-GB') : '—');

export function createSaveInspector({ layout, assets, topBar, slots, accountFile, storage, current = () => null, textPrompt, onRestore, onBack }) {
  let info = { slots: [], account: [], loading: true };
  let note = null;
  async function refresh() {
    const ss = slots();
    const out = [];
    for (let i = 0; i < (ss?.count ?? 0); i++) {
      const slot = ss.slot(i);
      let copies = [];
      let peek = null;
      try {
        copies = await slot.list();
        peek = await ss.peek(i);
      } catch (e) {
        peek = { error: e };
      }
      out.push({ i, copies, boundary: peek && !peek.error ? peek.boundary ?? null : null, error: peek?.error ? String(peek.error.message ?? peek.error) : null, studio: peek?.studio?.name ?? null });
    }
    let account = [];
    try {
      account = (await accountFile()?.slot.list()) ?? [];
    } catch {
      account = [];
    }
    info = { slots: out, account, loading: false };
  }
  async function exportCurrent(slot) {
    const copies = await slot.list();
    const cur = copies.find((c) => c.current);
    if (!cur) return (note = 'Nothing to export');
    const record = await storage().get(cur.key);
    const text = JSON.stringify({ devworksSave: 1, key: cur.key, record });
    globalThis.__dwExport = text;
    try {
      await navigator.clipboard?.writeText(text);
      note = `Copied ${kb(text.length)} to the clipboard (also window.__dwExport)`;
    } catch {
      note = `Export ready in window.__dwExport (${kb(text.length)}); the clipboard was not available`;
    }
  }
  const copyLine = (c) => ({ text: `${c.current ? '▶ ' : ''}#${c.slot} seq ${c.seq} · v${c.version ?? '?'} · ${kb(c.bytes)} · ${when(c.savedAt)} · ${c.status}`, color: c.status === 'damaged' ? C.bad : c.current ? C.good : C.textMuted, bold: c.current });
  const base = createCardListScreen({
    layout,
    assets,
    topBar,
    build: () => {
      const st = storage();
      return {
        title: 'Save inspector',
        icon: 'dev_ui_05',
        subtitle: info.loading ? 'Reading the saves…' : `Storage: ${st?.kind ?? '?'}${st?.degraded ? ' — a write failed and went to localStorage' : ''}. ${note ?? ''}`,
        sections: [
          {
            heading: 'Save slots',
            empty: 'No slots.',
            cards: info.slots.map((s) => ({
              id: `slot${s.i}`,
              title: `Slot ${s.i + 1}${s.studio ? `: ${s.studio}` : ''}${current() === s.i ? ' (open now)' : ''}`,
              highlight: current() === s.i,
              lines: [
                ...(s.copies.length ? s.copies.map(copyLine) : [{ text: 'Empty', color: C.textMuted }]),
                { text: s.error ? `Validation: ${s.error}` : `Validation: ${s.copies.length ? 'ok' : '—'}`, color: s.error ? C.bad : C.text },
                { text: `Last boundary: ${s.boundary ? `${s.boundary.label} (day ${s.boundary.day})` : '—'}`, color: C.actionDark },
              ],
              buttons: [
                { id: 'export', label: 'Export', disabled: !s.copies.length, onTap: () => exportCurrent(slots().slot(s.i)).then(refresh) },
                {
                  id: 'import',
                  label: 'Import',
                  accent: C.purple,
                  onTap: () => {
                    const sr = layout.safeRect;
                    textPrompt.open({ rect: { x: sr.x + 40, y: sr.y + sr.h / 2 - 60, w: sr.w - 80, h: 120 }, value: '', maxLength: 20000000, placeholder: 'Paste a save here', onDone: (v) => v && onRestore(s.i, v).then((r) => ((note = r.ok ? `Imported into Slot ${s.i + 1}` : r.why), refresh())) });
                  },
                },
                { id: 'damage', label: 'Damage', accent: C.bad, disabled: !s.copies.length, onTap: () => slots().slot(s.i).damage().then((k) => ((note = k ? `Damaged ${k}: the next load falls back` : 'Nothing to damage'), refresh())) },
              ],
            })),
          },
          {
            heading: 'Account file',
            empty: 'Not written yet.',
            cards: info.account.length ? [{ id: 'account', title: `Account (${accountFile()?.migratedFrom ?? '?'})`, lines: info.account.map(copyLine), buttons: [] }] : [],
          },
        ],
      };
    },
  });
  return {
    ...base,
    refresh,
    get info() {
      return info;
    },
    enter() {
      base.enter();
      note = null;
      info = { ...info, loading: true };
      refresh();
    },
  };
}
