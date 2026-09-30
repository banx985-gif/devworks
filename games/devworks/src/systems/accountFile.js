// The account file (Milestone 35, bible §50 "Account save"): one record for the whole account — combos discovered,
// secret discoveries / Prestige Tokens / account flags and records, achievements / Hall of Fame / records, NG+ legacy
// summaries and the staff you have worked with. Four run slots, one account file.
//
// It is a core SaveSlot (rolling copies, a checksum on each, read back after every write), so a write cut off half way
// is never used and a damaged copy falls back to the one before. Before Milestone 35 the account lived in four
// separate records (SAVE.accountKey, secretsAccountKey, achievementsKey, legacyAccountKey): the first load reads them
// into the file (they are left where they were) and from then on only the file is written.
//
//   const acc = createAccountFile({ adapter, key, legacyKeys: { combos: key, … }, version })
//   await acc.load() → { combos, secrets, achievements, legacy } (each null when never saved)
//   acc.set(part, data)   the part's newest data; written at once (writes queue, never overlap). Returns the promise.
//   acc.flush()           resolves when every queued write is done
//   acc.data · acc.slot (the SaveSlot, for the save inspector) · acc.migratedFrom ('file' | 'old keys' | 'new')
import { SaveSlot } from '../../../../core/SaveStore.js';
import { ACCOUNT_PARTS } from './runSave.js';

export function createAccountFile({ adapter, key, legacyKeys = {}, version = 1, rolling = 3, bus = null }) {
  const slot = new SaveSlot({ adapter, key, version, rolling, bus });
  let data = Object.fromEntries(ACCOUNT_PARTS.map((p) => [p, null]));
  let pending = Promise.resolve();
  let migratedFrom = null;
  const write = () => {
    const snap = JSON.parse(JSON.stringify(data));
    pending = pending.then(() => slot.save(snap)).catch((e) => console.error('[DEVWORKS] account file save failed', e));
    return pending;
  };
  return {
    slot,
    get data() {
      return data;
    },
    get migratedFrom() {
      return migratedFrom;
    },
    async load() {
      let d = null;
      try {
        d = await slot.load();
      } catch (e) {
        console.error('[DEVWORKS] account file unreadable, trying the old records', e);
      }
      if (d) {
        data = { ...data, ...d };
        migratedFrom = 'file';
        return data;
      }
      // The four records from before Milestone 35 (left in place; the file is written from them now).
      let any = false;
      for (const p of ACCOUNT_PARTS) {
        if (!legacyKeys[p]) continue;
        try {
          const v = await adapter.get(legacyKeys[p]);
          if (v != null) {
            data[p] = v;
            any = true;
          }
        } catch {
          /* an unreadable old record: that part starts empty */
        }
      }
      migratedFrom = any ? 'old keys' : 'new';
      if (any) await write();
      return data;
    },
    set(part, value) {
      if (!ACCOUNT_PARTS.includes(part)) throw new Error(`Not an account part: ${part}`);
      data[part] = value == null ? null : JSON.parse(JSON.stringify(value));
      return write();
    },
    flush: () => pending,
  };
}
