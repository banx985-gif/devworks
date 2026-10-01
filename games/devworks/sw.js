// DEVWORKS â€” service worker (offline cache for the installed web app).
//
// NETWORK FIRST: when the phone is online it always fetches the newest files
// (so a new build shows up on the next open) and keeps a copy; when offline
// it plays from that copy.
//
// VERSION is stamped automatically by publish.ps1 on every publish. A new
// version makes the phone install this worker fresh and throw away old copies.
//
// This game imports the shared series engine from ../../core/, which sits
// outside this folder. Requests from the game page still pass through this
// worker, so the engine files are cached too.
const VERSION = '20261002-030837';
const CACHE = 'devworks-' + VERSION;

// The page itself + manifest + icons, so the app opens offline straight away.
const CORE = ['./', './index.html', './manifest.webmanifest', './styles/app.css',
  './assets/branding/pwa/icon-192.png', './assets/branding/pwa/icon-512.png'];
// Every code file (game + shared engine) â€” filled in by publish.ps1 so the whole
// game's code is saved on the very first visit. Art is cached the first time the
// game loads it. (Empty when run locally.)
const PRECACHE = ['./src/screens/AchievementsScreens.js', './src/screens/BusinessDealsScreens.js', './src/screens/CatalogueScreen.js', './src/screens/CompeteScreens.js', './src/screens/ConsoleScreen.js', './src/screens/DiscoveryScreen.js', './src/screens/EndingScreen.js', './src/screens/EngineScreen.js', './src/screens/FranchiseArchiveScreen.js', './src/screens/GlobalScreens.js', './src/screens/HardwareScreen.js', './src/screens/IdeaCardsScreen.js', './src/screens/LedgerScreen.js', './src/screens/MarketingScreen.js', './src/screens/NewProjectScreen.js', './src/screens/NgPlusScreen.js', './src/screens/PlatformMarketScreen.js', './src/screens/ProjectBoardScreen.js', './src/screens/ProjectScreen.js', './src/screens/ResearchScreen.js', './src/screens/RosterScreen.js', './src/screens/RouteTestScreen.js', './src/screens/RumourScreen.js', './src/screens/SaveInspectorScreen.js', './src/screens/SettingsScreen.js', './src/screens/SetupScreen.js', './src/screens/SponsorsScreen.js', './src/screens/StaffDetailScreen.js', './src/screens/StoreScreen.js', './src/screens/StudioScreen.js', './src/screens/TestScreen.js', './src/screens/TitleScreen.js', './src/systems/accountFile.js', './src/systems/achievements.js', './src/systems/awards.js', './src/systems/business.js', './src/systems/combos.js', './src/systems/consoles.js', './src/systems/contracts.js', './src/systems/dataCheck.js', './src/systems/distribution.js', './src/systems/elementUnlocks.js', './src/systems/ending.js', './src/systems/engines.js', './src/systems/facilityShop.js', './src/systems/franchises.js', './src/systems/gameProject.js', './src/systems/globalBusiness.js', './src/systems/hardware.js', './src/systems/marketing.js', './src/systems/monetisation.js', './src/systems/ngplus.js', './src/systems/platformMarket.js', './src/systems/prestige.js', './src/systems/publishers.js', './src/systems/recruitment.js', './src/systems/requests.js', './src/systems/research.js', './src/systems/reviews.js', './src/systems/rewards.js', './src/systems/rivals.js', './src/systems/runSave.js', './src/systems/sales.js', './src/systems/secrets.js', './src/systems/sponsors.js', './src/systems/staffCheck.js', './src/systems/stationUnlocks.js', './src/systems/studioAudio.js', './src/systems/studioEvents.js', './src/systems/studioProfile.js', './src/systems/studioWorld.js', './src/systems/support.js', './src/systems/training.js', './src/systems/walkthroughs.js', './src/ui/cardListScreen.js', './src/ui/devPops.js', './src/ui/gameCard.js', './src/ui/ideaInfo.js', './src/ui/liveBuildPanel.js', './src/ui/placeholders.js', './src/ui/rewardArt.js', './src/ui/setupArt.js', './src/ui/studioMenus.js', './src/main.js', './data/achievements.js', './data/artList.js', './data/assets.js', './data/audio.js', './data/awards.js', './data/balance.js', './data/banter.js', './data/combos.js', './data/consoles.js', './data/covers.js', './data/distribution.js', './data/elements.js', './data/ending.js', './data/engines.js', './data/events.js', './data/facilities.js', './data/franchises.js', './data/global.js', './data/guide.js', './data/hardware.js', './data/home.js', './data/marketing.js', './data/monetisation.js', './data/platforms.js', './data/portraits.js', './data/projects.js', './data/publishers.js', './data/recruitment.js', './data/requests.js', './data/research.js', './data/reviews.js', './data/rewards.js', './data/rivals.js', './data/save.js', './data/screens.js', './data/secrets.js', './data/settings.js', './data/setup.js', './data/sponsors.js', './data/staff.js', './data/studio.js', './data/support.js', './styles/app.css', '../../core/ui/BottomBar.js', '../../core/ui/BottomSheet.js', '../../core/ui/Button.js', '../../core/ui/CoachMark.js', '../../core/ui/ContextCard.js', '../../core/ui/CreditsRoll.js', '../../core/ui/HelpArchive.js', '../../core/ui/Kit.js', '../../core/ui/Modal.js', '../../core/ui/ScrollList.js', '../../core/ui/ScrollPanel.js', '../../core/ui/SetupArt.js', '../../core/ui/StaffCard.js', '../../core/ui/StudioSplash.js', '../../core/ui/TextPrompt.js', '../../core/ui/Toast.js', '../../core/ui/TopBar.js', '../../core/AccountRecords.js', '../../core/AchievementSystem.js', '../../core/AdConsent.js', '../../core/AdMobProvider.js', '../../core/AdService.js', '../../core/Agent.js', '../../core/AppShell.js', '../../core/ArtRecolor.js', '../../core/AssetManager.js', '../../core/AssetValidator.js', '../../core/AssignmentSystem.js', '../../core/AudioManager.js', '../../core/Autosave.js', '../../core/BuildFlags.js', '../../core/CachedLayer.js', '../../core/Camera.js', '../../core/CampaignEnding.js', '../../core/CampaignSlots.js', '../../core/CareerRecords.js', '../../core/CharacterMotion.js', '../../core/Clock.js', '../../core/CommerceService.js', '../../core/CompanyRank.js', '../../core/CompetitionPrereqs.js', '../../core/CompetitionSystem.js', '../../core/Completion.js', '../../core/ContractSystem.js', '../../core/DataValidator.js', '../../core/DebugOverlay.js', '../../core/DiscoveryArchive.js', '../../core/EconomySystem.js', '../../core/EntitlementService.js', '../../core/EventBus.js', '../../core/EventSystem.js', '../../core/FacilitySystem.js', '../../core/FakeStoreProvider.js', '../../core/FixedStepLoop.js', '../../core/FloatFeed.js', '../../core/FounderPerks.js', '../../core/FrameGovernor.js', '../../core/GoogleConsent.js', '../../core/GradeEngine.js', '../../core/Grid.js', '../../core/GuideSystem.js', '../../core/Haptics.js', '../../core/HintSystem.js', '../../core/Input.js', '../../core/IsoProjection.js', '../../core/IsoRoom.js', '../../core/JobHistory.js', '../../core/MajorFeedback.js', '../../core/MarketSystem.js', '../../core/NamePicker.js', '../../core/NativeBridge.js', '../../core/NgPlusSystem.js', '../../core/NotificationSystem.js', '../../core/Pathing.js', '../../core/PinchZoom.js', '../../core/PlayBillingProvider.js', '../../core/ProductSystem.js', '../../core/ProjectSystem.js', '../../core/Rankings.js', '../../core/RecruitmentSystem.js', '../../core/Renderer.js', '../../core/ReputationSystem.js', '../../core/ResearchSystem.js', '../../core/ReviewText.js', '../../core/RivalSystem.js', '../../core/Rng.js', '../../core/RunArchive.js', '../../core/SaveManager.js', '../../core/SaveSlots.js', '../../core/SaveStore.js', '../../core/ScreenRouter.js', '../../core/SecretEngine.js', '../../core/Selection.js', '../../core/Settings.js', '../../core/SoundSynth.js', '../../core/SponsorSystem.js', '../../core/SpriteCache.js', '../../core/StaffModel.js', '../../core/StaffSystem.js', '../../core/StorageAdapter.js', '../../core/StoreStub.js', '../../core/SynergyEvaluator.js', '../../core/SystemBack.js', '../../core/Theme.js', '../../core/TrainingSystem.js', '../../core/TrophyCase.js', '../../core/UiLayout.js', '../../core/UnlockActions.js', '../../core/VfxSystem.js', '../../core/WorldGestures.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // One file failing must not block the rest.
      .then((c) => Promise.allSettled(CORE.concat(PRECACHE).map((u) =>
        c.add(new Request(u, { cache: 'reload' })))))
      .catch(() => { /* offline during install: runtime caching will fill in */ })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('devworks-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
