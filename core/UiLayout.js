// Reads the device safe area (notch, home bar) from CSS env() and converts it to logical canvas units.
// Uses a hidden probe element whose padding is set to env(safe-area-inset-*).
// In an Android app (Capacitor 8 SystemBars, insetsHandling "css") the real system-bar sizes also arrive as the CSS
// variables --safe-area-inset-* on <html> (older Android WebViews report env() as 0): the bigger of the two is used.
// The insets are re-read by themselves when either changes (the bars appear / hide, the Fold is opened) — no window
// resize is needed — and onChange(fn) is told (BOTWORKS Milestone 37).
export class UiLayout {
  // forceInsets: { top, right, bottom, left } CSS px to use instead of the device's (a debug stand-in for a notch and
  // home bar, so the safe-area pass can be checked on any screen — Milestone 21).
  constructor(renderer, { probe = null, forceInsets = null } = {}) {
    this.renderer = renderer;
    this.forceInsets = forceInsets;
    this.probe = probe || UiLayout.createProbe();
    this.cssInsets = { top: 0, right: 0, bottom: 0, left: 0 }; // CSS pixels, whole viewport
    this.insets = { top: 0, right: 0, bottom: 0, left: 0 }; // logical units, from canvas edges
    this.safeRect = { x: 0, y: 0, w: renderer.width, h: renderer.height };
    this.listeners = [];
    this.refresh();
    this.watch();
  }

  // Called (with this layout) whenever the insets change on their own.
  onChange(fn) {
    this.listeners.push(fn);
    return this;
  }

  // Re-read the insets when the probe's padding (env) or the <html> style (the app's variables) changes.
  watch() {
    if (typeof window === 'undefined' || this.forceInsets) return;
    const again = () => {
      const before = JSON.stringify(this.cssInsets);
      this.refresh();
      if (JSON.stringify(this.cssInsets) !== before) for (const fn of this.listeners) fn(this);
    };
    try {
      if (window.ResizeObserver) new ResizeObserver(again).observe(this.probe, { box: 'border-box' });
      if (window.MutationObserver) new MutationObserver(again).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    } catch {
      /* an old browser: resizes still refresh */
    }
  }

  // The app's injected inset variable (CSS px), 0 when absent.
  static cssVar(side) {
    if (typeof document === 'undefined') return 0;
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--safe-area-inset-${side}`)) || 0;
  }

  static createProbe() {
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'width:0',
      'height:0',
      'visibility:hidden',
      'pointer-events:none',
      'padding-top:env(safe-area-inset-top, 0px)',
      'padding-right:env(safe-area-inset-right, 0px)',
      'padding-bottom:env(safe-area-inset-bottom, 0px)',
      'padding-left:env(safe-area-inset-left, 0px)',
    ].join(';');
    document.body.appendChild(el);
    return el;
  }

  // Call after every renderer resize.
  refresh() {
    const cs = getComputedStyle(this.probe);
    this.cssInsets = this.forceInsets
      ? { top: 0, right: 0, bottom: 0, left: 0, ...this.forceInsets }
      : {
          top: Math.max(parseFloat(cs.paddingTop) || 0, UiLayout.cssVar('top')),
          right: Math.max(parseFloat(cs.paddingRight) || 0, UiLayout.cssVar('right')),
          bottom: Math.max(parseFloat(cs.paddingBottom) || 0, UiLayout.cssVar('bottom')),
          left: Math.max(parseFloat(cs.paddingLeft) || 0, UiLayout.cssVar('left')),
        };

    // The canvas may be letterboxed away from the notch; only the part of an inset
    // that actually overlaps the canvas matters.
    const r = this.renderer;
    const vp = r.viewport;
    const box = r.cssBox;
    const s = r.scale || 1;
    this.insets = {
      top: Math.max(0, this.cssInsets.top - box.y) / s,
      left: Math.max(0, this.cssInsets.left - box.x) / s,
      bottom: Math.max(0, this.cssInsets.bottom - (vp.h - box.y - box.h)) / s,
      right: Math.max(0, this.cssInsets.right - (vp.w - box.x - box.w)) / s,
    };
    this.safeRect = {
      x: this.insets.left,
      y: this.insets.top,
      w: r.width - this.insets.left - this.insets.right,
      h: r.height - this.insets.top - this.insets.bottom,
    };
  }

  // Place a w×h box against an edge/corner of the safe area, with a margin.
  // anchor: 'top-left' | 'top' | 'top-right' | 'left' | 'center' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right'
  anchor(anchor, w, h, margin = 0) {
    const sr = this.safeRect;
    const parts = anchor.split('-');
    const v = parts.length === 2 ? parts[0] : anchor === 'top' || anchor === 'bottom' ? anchor : 'center';
    const hz = parts.length === 2 ? parts[1] : anchor === 'left' || anchor === 'right' ? anchor : 'center';
    let x = sr.x + (sr.w - w) / 2;
    let y = sr.y + (sr.h - h) / 2;
    if (hz === 'left') x = sr.x + margin;
    if (hz === 'right') x = sr.x + sr.w - w - margin;
    if (v === 'top') y = sr.y + margin;
    if (v === 'bottom') y = sr.y + sr.h - h - margin;
    return { x, y, w, h };
  }
}
