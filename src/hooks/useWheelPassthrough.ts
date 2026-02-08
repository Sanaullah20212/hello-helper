import { RefObject, useEffect } from "react";

/**
 * When a horizontally scrollable carousel is under the cursor, browsers often
 * translate mouse-wheel vertical delta into horizontal scrolling.
 *
 * This hook prevents that and forwards the wheel to the page (window) vertical scroll.
 */
export function useWheelPassthrough(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // If user is pinch-zooming (trackpad + ctrl), don't interfere.
      if (e.ctrlKey) return;

      // Forward vertical scrolling to the page and stop the carousel from consuming the wheel.
      if (e.deltaY !== 0) {
        e.preventDefault();
        e.stopPropagation();
        window.scrollBy({ top: e.deltaY, left: 0, behavior: "auto" });
      }
    };

    // Must be passive:false, otherwise preventDefault won't work.
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ref]);
}
