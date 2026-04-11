import type { Page } from "playwright-core";
import type { MotionTokens } from "../types";

export async function extractMotion(page: Page): Promise<MotionTokens> {
  const domData = await page.evaluate(() => {
    const transitionSet = new Set<string>();
    const durationSet = new Set<string>();
    const easingSet = new Set<string>();

    const elements = document.querySelectorAll("*");
    const sampled = Array.from(elements).slice(0, 500);

    for (const el of sampled) {
      const style = getComputedStyle(el);

      const transition = style.transition;
      if (transition && transition !== "all 0s ease 0s" && transition !== "none") {
        transitionSet.add(transition);
      }

      const duration = style.transitionDuration;
      if (duration && duration !== "0s") {
        durationSet.add(duration);
      }

      const easing = style.transitionTimingFunction;
      if (easing && easing !== "ease") {
        easingSet.add(easing);
      }
    }

    // Extract @keyframes
    const keyframes: { name: string; cssText: string }[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) {
          if (rule instanceof CSSKeyframesRule) {
            keyframes.push({
              name: rule.name,
              cssText: rule.cssText,
            });
          }
        }
      } catch {
        // Cross-origin
      }
    }

    return {
      transitions: Array.from(transitionSet),
      durations: Array.from(durationSet),
      easings: Array.from(easingSet),
      keyframes,
    };
  });

  return domData as MotionTokens;
}
