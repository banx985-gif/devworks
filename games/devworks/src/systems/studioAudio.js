// The studio's sound (Milestone 38, bible §48) on core/AudioManager: the §48 sound effects on the game's own events,
// and which of the 8 music tracks plays (data/audio.js MUSIC_RULES), crossfaded when the moment changes.
//
//   createStudioAudio({ bus, audio, clock, projects, world, ending, screen, prestigeNow, settings })
//     audio     a core AudioManager built with data/audio.js SOUNDS / MUSIC (sound only after the first tap)
//     screen()  the router's current screen · prestigeNow() → PROJECT ONE / X in the works
//     settings  core Settings: master / music / sfx (0–100) set the volumes
//   trackNow() → the music id the rules pick now · update() re-checks it (each day, on a screen change)
//   applyVolumes()
import { MUSIC_RULES } from '../../data/audio.js';

export function createStudioAudio({ bus, audio, clock, projects, world, ending = null, screen = () => 'studio', prestigeNow = () => false, settings = null }) {
  let lastRelease = -Infinity;
  let lastConsole = -Infinity;
  const today = () => clock.totalDays;
  const R = MUSIC_RULES;

  function trackNow() {
    const scr = screen();
    if (['ending', 'ngplus'].includes(scr) || ending?.pending || prestigeNow()) return 'music_prestige';
    if (today() - lastConsole < R.consoleLaunchDays) return 'music_console_launch';
    if (projects.jobs.some((j) => (j.data?.crunchLeft ?? 0) > 0)) return 'music_crunch_night';
    if (today() - lastRelease < R.releaseDays) return 'music_release_day';
    if (clock.month === R.awardMonth) return 'music_awards_season';
    if (world.stage >= R.corporateStage) return 'music_corporate_hq';
    if (projects.jobs.length) return 'music_prototype_energy';
    return 'music_office_morning';
  }
  function update() {
    const want = trackNow();
    if (audio.wantedMusic !== want) audio.playMusic(want);
    // Typing at the desks while a game is being made and the clock runs.
    if (projects.jobs.length && !clock.paused && screen() === 'studio') audio.startLoop('sfx_typing', 'typing');
    else audio.stopLoop('typing');
  }
  function applyVolumes() {
    if (!settings) return;
    const m = (settings.get('master') ?? 100) / 100;
    audio.setVolumes({ sfx: m * ((settings.get('sfx') ?? 100) / 100), music: m * 0.6 * ((settings.get('music') ?? 75) / 100) });
  }
  settings?.onChange?.(() => applyVolumes());
  applyVolumes();

  const play = (id) => audio.play(id);
  // §48 sound effects on the game's events.
  const on = (ev, fn) => bus.on(ev, fn);
  on('project:phase', () => play('sfx_marker'));
  on('project:breakthrough', () => play('sfx_breakthrough'));
  on('project:bug', () => play('sfx_bug'));
  on('project:decision', () => play('sfx_bug'));
  on('game:released', () => {
    lastRelease = today();
    play('sfx_launch');
    play('sfx_review');
    update();
  });
  let lastSale = -Infinity;
  on('sales:day', ({ revenue }) => {
    if (revenue > 0 && today() - lastSale >= 7) {
      lastSale = today();
      play('sfx_sales');
    }
  });
  on('award:won', () => play('sfx_award'));
  on('staff:hired', () => play('sfx_recruit'));
  on('engine:complete', () => play('sfx_engine'));
  on('console:launched', () => {
    lastConsole = today();
    play('sfx_console_boot');
    update();
  });
  on('hardware:prototype', () => play('sfx_console_boot'));
  on('console:defects', () => play('sfx_defect'));
  on('facility:bought', () => play('sfx_cash'));
  on('research:complete', () => play('sfx_rp'));
  on('secret:unlocked', () => play('sfx_secret'));
  on('input:tap', () => play('sfx_ui'));
  on('clock:day', () => update());
  on('clock:speed', () => update());
  on('screen:change', () => update());

  return { trackNow, update, applyVolumes, get lastRelease() { return lastRelease; } };
}
