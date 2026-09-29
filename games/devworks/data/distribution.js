// Distribution (Milestone 26, bible §31): the physical → digital shift, how each game is sold, Early Access and the
// studio's own digital storefront (F32 Storefront Ops). Plain data only; the rules are src/systems/distribution.js.
// Every number is a placeholder (plan review B), listed in the build log.
export const DISTRIBUTION = {
  // The market's physical share by calendar year (the rest is digital), straight lines between the points.
  physicalByYear: [
    [1, 85],
    [5, 72],
    [10, 48],
    [15, 26],
    [20, 15],
  ],
  // Release modes (Balanced is the standard mix every game had before: no change to its sales or costs).
  //   sales × (physical% × reach.physical + digital% × reach.digital)
  //   curve: the launch spike × spike and the long tail × tail (the parts then add up to 1 again); the tail lasts
  //          tailDays × as long
  //   pressing (paid at release) = the scope's cost a day × pressDays × physical% ÷ 100
  //   each copy: the physical ones (physical% × reach.physical of the sales) cost physCopyPct% more of the price to
  //          make and ship; digital-first keeps netPct% more of each copy (no shop margin)
  modes: {
    retail: { name: 'Retail-heavy', short: 'Retail', reach: { physical: 1.2, digital: 0.6 }, curve: { spike: 1.3, tail: 0.7, tailDays: 0.85 }, pressDays: 14, physCopyPct: 12, netPct: 0, line: 'Boxes in shops: a big launch while players buy boxes; pressing and shipping cost, and it fades faster.' },
    balanced: { name: 'Balanced', short: 'Balanced', reach: { physical: 1, digital: 1 }, curve: { spike: 1, tail: 1, tailDays: 1 }, pressDays: 0, physCopyPct: 0, netPct: 0, line: 'Some boxes, some downloads: the standard mix.' },
    digital: { name: 'Digital-first', short: 'Digital', reach: { physical: 0.25, digital: 1.25 }, curve: { spike: 0.85, tail: 1.4, tailDays: 1.3 }, pressDays: 0, physCopyPct: 0, netPct: 10, line: 'Downloads: nothing to press, more of each sale kept and a long tail — but few players while boxes rule.' },
    earlyAccess: { name: 'Early Access', short: 'Early Access', reach: { physical: 0.25, digital: 1.25 }, curve: { spike: 0.85, tail: 1.4, tailDays: 1.3 }, pressDays: 0, physCopyPct: 0, netPct: 10, line: 'Sell it unfinished: early money and bug reports now, the full (digital) launch later.' },
  },
  // Early Access: an original / sequel / spin-off on open platforms only (no certification), from unlockYear. While
  // in it the game sells a slow trickle (a pool of salesPct% of a full launch, poolDays long) at pricePct% of the
  // price; each month end bugFixPct% of its bugs are fixed (player feedback). After okMonths each extra month costs
  // trustPerMonth Fan Trust; at maxMonths it launches on its own. Full launch: early buyers don't buy again
  // (fullLaunchPct% of the normal launch sales), and launching with more than buggyBugs bugs costs buggyTrust.
  earlyAccess: { unlockYear: 3, salesPct: 30, poolDays: 300, pricePct: 70, bugFixPct: 30, okMonths: 6, maxMonths: 12, trustPerMonth: 2, buggyBugs: 3, buggyTrust: 5, fullLaunchPct: 80, types: ['original', 'sequel', 'spinoff'] },
  // Own storefront (F32 Storefront Ops: Year 15 + BUS6). While open, share% of your games' digital copies sell there,
  // share = min(capPct, digital% × takePct ÷ 100): on those you also keep the platform store's cut. Your consoles'
  // third-party games pay thirdPartyPerThousand × (install base ÷ 1,000) × share ÷ 100 a month through it. It costs
  // opCost a month while open. It sells no copies of its own: every game still reaches players through platforms.
  storefront: { facility: 'F32', capPct: 25, takePct: 30, opCost: 2000, thirdPartyPerThousand: 60 },
  icon: 'business_ui_13',
};
export const modeById = (id) => DISTRIBUTION.modes[id] ?? null;
