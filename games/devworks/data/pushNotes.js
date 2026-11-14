// Milestone 41b (Aaron's 8 Nov series rule 2; card M41_LAUNCH_READY part M41b): phone / browser notifications, each
// kind with its own switch. DEVWORKS's game clock does NOT run while the game is closed (a save picks up on the same
// day), so no line ever says something finished while away: they are honest reminders about what is next in the game.
// The card's "A review is waiting" kind is skipped for that reason (a game can't finish while you're away).
// core/LocalNotify plans them (at most 3 a day, none 10 pm – 8 am, moved to 8 am) and hands them to the phone
// (Capacitor Local Notifications) or the browser. Scheduled when the player leaves the game, all cancelled on return.
//   afterH: real hours after leaving · open: the screen a tap opens (after loading the studio's own save slot).
export const PUSH_KINDS = [
  {
    id: 'awards',
    label: 'Awards Night next',
    note: 'When an award you can enter is held this month or next in the game',
    afterH: 3,
    open: 'awards',
    lines: [
      (what) => `${what} is next on the calendar. Got a contender ready?`,
      (what) => `Max Marquee is polishing the trophies: ${what} is nearly here.`,
      (what) => `${what} is coming up. Time to make something award-worthy!`,
    ],
  },
  {
    id: 'convention',
    label: 'Convention / show next',
    note: 'When a show month is this month or next in the game',
    afterH: 5,
    open: 'marketing',
    lines: [
      () => 'A big games show is coming up. Book a stand and show off your next hit!',
      () => 'Show season! Fans are queuing for the convention. Will your studio be there?',
    ],
  },
  {
    id: 'comeBack',
    label: 'Come back reminder',
    note: 'Once, after a day away',
    afterH: 24,
    open: 'studio',
    lines: [
      () => "Your team's at their desks — the next hit won't make itself!",
      () => 'Uncle Ray says the coffee is on and the ideas are flowing. Ready to make a game?',
      () => 'Your studio is quiet without you. The team is waiting for the next big idea!',
    ],
  },
];

export const PUSH_TEXT = {
  title: 'DEVWORKS',
  section: 'Notifications',
  master: 'Notifications',
  masterNote: 'Short reminders when something is next in the game. At most 3 a day, never between 10 pm and 8 am.',
  blocked: 'Notifications are blocked for DEVWORKS on this device. Turn them on in the phone’s Settings → Apps → DEVWORKS → Notifications.',
  blockedWeb: 'This browser has blocked notifications for this page. You can allow them in the browser’s site settings.',
  unsupported: 'This browser can’t show notifications, so DEVWORKS skips them.',
  // Uncle Ray's friendly question after the first well-reviewed release or the first award, then the phone's own.
  askTitle: 'Want a nudge now and then?',
  askBody: 'Lovely work, that one! Want me to give you a nudge when Awards Night or a big show is coming up? Only a few a day, and never at night.',
  askAgainBody: 'A trophy! Still happy without nudges? I can let you know when the next awards or show is close. A few a day at most, never at night.',
  yes: 'Yes please',
  notNow: 'Not now',
  channel: { id: 'devworks_reminders', name: 'Studio reminders', description: 'Awards Night and shows coming up, the team waiting' },
};

// A release reviewed at least this well (or the first award) brings Uncle Ray's question.
export const PUSH_RULES = { askReview: 70, showMonths: [3, 7, 11] }; // showMonths = data/marketing.js Convention months
