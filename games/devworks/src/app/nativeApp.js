// DEVWORKS as an Android app (Milestone 41a; BOTWORKS src/app/NativeApp.js is the pattern): real ads from AdMob and
// purchases from Google Play, through the shared core/ parts (AdMobProvider, PlayBillingProvider, AdConsent,
// GoogleConsent). In a web browser none of this runs (the web build keeps the pretend store with ?debug=1, no ads
// otherwise). The back button and pausing in the background stay DEVWORKS's own (Milestone 40m, unchanged).
//
// The ad ids are data/app.js AD_IDS — Google's official TEST ids until the real ones are pasted there (one switch,
// `test`). The store says "unavailable" until the app and its products are on Google Play.
//
// Consent: Google's consent service is asked first. Where Google's rules apply (EU, UK…) Google's own form is the only
// question and ads start only if Google says they may; everywhere else the game's own ads & privacy question. No answer
// from Google (offline) = no ads until it answers, unless this phone already answered on an earlier launch.
import { AdMobProvider } from '../../../../core/AdMobProvider.js';
import { PlayBillingProvider } from '../../../../core/PlayBillingProvider.js';
import { AdConsent } from '../../../../core/AdConsent.js';
import { GoogleConsent } from '../../../../core/GoogleConsent.js';
import { PRODUCTS } from '../../data/monetisation.js';
import { APP_TEXT, APP_RULES, AD_IDS, CONSENT_TEST } from '../../data/app.js';

function combine(ads, store) {
  return {
    id: `${ads.id}+${store.id}`,
    available: (kind) => ads.available(kind),
    show: (kind, id) => ads.show(kind, id),
    getProducts: (keys) => store.getProducts(keys),
    purchase: (key) => store.purchase(key),
    finish: (txId) => store.finish(txId),
    pending: () => store.pending(),
    restore: () => store.restore(),
    status: () => store.status(),
  };
}

//   setupNativeApp({ bridge, monetisation, dialog, accent }) → null on the web; in the app
//   { consent, google, ads, store, askConsent(force) } (askConsent settles once the question is over)
export function setupNativeApp({ bridge, monetisation, dialog, accent }) {
  if (!bridge?.isNative) return null;
  const consent = new AdConsent({ key: APP_RULES.consentKey });
  const ads = new AdMobProvider({ bridge, consent: () => consent.value, ids: AD_IDS, testing: AD_IDS.test });
  const store = new PlayBillingProvider({ bridge, products: PRODUCTS });
  const google = new GoogleConsent({ bridge, test: CONSENT_TEST.on && AD_IDS.test ? CONSENT_TEST : null });
  monetisation.setProvider(combine(ads, store));
  let busy = null;

  const fromGoogle = (info) => consent.set({ source: 'google', given: !!info?.canRequestAds, personalised: true });
  const startAds = () => consent.value.given && ads.init();
  function ownQuestion() {
    return new Promise((done) => {
      const pick = (personalised) => () => (consent.set({ personalised }), startAds(), done());
      dialog.show({
        title: APP_TEXT.consentTitle,
        body: APP_TEXT.consentBody,
        dismissible: false,
        buttons: [
          { id: 'yes', label: APP_TEXT.consentPersonal, accent, onTap: pick(true) },
          { id: 'npa', label: APP_TEXT.consentNonPersonal, accent, onTap: pick(false) },
        ],
      });
    });
  }
  async function ask(force) {
    const info = await google.check();
    if (!info) {
      if (consent.answered) startAds();
      return;
    }
    if (google.applies(info)) {
      let now = info;
      if (force && info.status === 'OBTAINED') now = (await google.showPrivacyOptions()) ?? info;
      else if (info.status === 'REQUIRED') now = (await google.showForm()) ?? info;
      if (now.status !== 'REQUIRED') fromGoogle(now);
      if (consent.value.source === 'google') startAds();
      return;
    }
    if (consent.value.source === 'google') consent.set({ source: 'google', given: false });
    if (!consent.answered || !consent.value.given || force) return ownQuestion();
    startAds();
  }
  function askConsent(force = false) {
    if (!busy) busy = ask(force).finally(() => (busy = null));
    return busy;
  }
  return { consent, google, ads, store, askConsent };
}
