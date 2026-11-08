// Milestone 40o: typed text on a phone (the core TextPrompt lays a real HTML box over the canvas field). Two phone
// problems, fixed here for DEVWORKS (core untouched):
//   1. In the Android app the phone keyboard makes the window shorter. That is a resize, and the game used to close the
//      box on every resize, so the keyboard dropped straight away and nothing could be typed. Now only a change of
//      WIDTH (turning the phone) closes it, keeping the text. When only the height changes (the keyboard opening or
//      closing) the box stays open, and if the keyboard would cover it, it moves up to sit just above the keyboard.
//   2. The canvas stops the phone's follow-up mouse events (core Input), so tapping away from the box never took the
//      focus off it. Now a finger (or mouse) going down on the game finishes the box, keeping the text.
//   watchTextPrompt({ textPrompt, bus, win })   call once; returns { onResize, onPointerDown } (for tests)
export function watchTextPrompt({ textPrompt, bus, win = globalThis.window }) {
  let width = win?.innerWidth ?? 0;
  const onResize = () => {
    const w = win?.innerWidth ?? width;
    const el = textPrompt.el;
    if (Math.abs(w - width) > 1) {
      width = w;
      el?.blur(); // finishes the box with its text (TextPrompt's blur), then removes it
      textPrompt.close();
      return;
    }
    if (!el) return;
    // Height only (the keyboard): keep it open and in view.
    const vh = win.visualViewport?.height ?? win.innerHeight;
    const vTop = win.visualViewport?.offsetTop ?? 0;
    if (el.dataset.top === undefined) el.dataset.top = el.style.top;
    const h = el.offsetHeight || parseFloat(el.style.height) || 0;
    const top = parseFloat(el.dataset.top);
    const room = vTop + vh - 12; // the bottom of what's visible above the keyboard
    el.style.top = `${Math.max(vTop + 8, Math.min(top, room - h))}px`;
  };
  const onPointerDown = () => {
    if (textPrompt.el && win.document.activeElement === textPrompt.el) textPrompt.el.blur();
  };
  bus.on('renderer:resize', onResize);
  win.visualViewport?.addEventListener('resize', onResize);
  bus.on('input:down', onPointerDown);
  return { onResize, onPointerDown };
}
