// DEVWORKS as a phone app (Milestone 41a; studio server standard §3, BOTWORKS M29a–M39): the ad ids, the consent
// question's words and the privacy page. The app's id and name live with the Android project
// (apps/devworks-android/app.json), not here.
export const APP_RULES = {
  consentKey: 'devworks:adConsent', // the first-launch ads & privacy answer, this device only
};

// ======================================================================================================================
//  AD IDS — THE ONE PLACE THEY LIVE (the app code and tools/android-project.mjs both read this block).
//  ⚠ TEST IDS: these are Google's official AdMob TEST ids. They show "Test Ad" banners and never earn money.
//  Before the public release: make the app and the two ad units in AdMob, paste the real ids below, set test: false,
//  then rebuild (tools/build-android.ps1 -Game devworks -Release). Nothing else needs changing.
//  The build check: -Release stops while test is true or any of Google's test ids is still here.
// ======================================================================================================================
export const AD_IDS = {
  test: true, // ⚠ true = Google test ads (no money). Set false only together with the real ids below.
  appId: 'ca-app-pub-3940256099942544~3347511713', // ⚠ TEST — AdMob app id (goes into the Android manifest)
  interstitial: 'ca-app-pub-3940256099942544/1033173712', // ⚠ TEST — the "between screens" ad
  rewarded: 'ca-app-pub-3940256099942544/5224354917', // ⚠ TEST — the "watch for a reward" ad
};

// Google's consent form (EU / UK players, core/GoogleConsent) — ⚠ TEST SETTINGS, on only while AD_IDS.test is true:
// the app pretends to be in Europe so the form can be seen (on an emulator, or a phone listed in devices).
export const CONSENT_TEST = {
  on: AD_IDS.test, // ⚠ TEST — follows AD_IDS.test; never on in a real release
  geography: 'EEA',
  devices: [],
};

// The privacy page (games/devworks/privacy.html, published with the game; Google Play links to it too).
export const PRIVACY_URL = 'https://banx985-gif.github.io/devworks/games/devworks/privacy.html';

export const APP_TEXT = {
  consentTitle: 'Ads and your privacy',
  consentBody: `DEVWORKS is free and shows a few ads: ones you choose to watch for a reward, and an occasional one between screens. The ads come from Google, which may use your phone's advertising ID to pick them.${AD_IDS.test ? ' This version shows Google test ads only.' : ''} You can change this any time in Settings → Privacy.`,
  consentPersonal: 'OK — ads may be picked for me',
  consentNonPersonal: 'OK — general ads only',
  privacyBody: `DEVWORKS keeps your saves on this phone only and has no account. Ads come from Google AdMob${AD_IDS.test ? ' (test ads in this version)' : ''}, which may use your phone's advertising ID. Purchases go through Google Play.`,
  privacyAdsNow: (personalised, source = 'game') => (source === 'google' ? "Now: your answers in Google's consent form" : personalised ? 'Now: ads may be picked for me' : 'Now: general ads only'),
};
