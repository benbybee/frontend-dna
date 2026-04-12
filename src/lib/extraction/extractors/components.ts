import type { Page } from "playwright-core";
import type { ComponentTokens } from "../types";

export async function extractComponents(page: Page): Promise<ComponentTokens> {
  return page.evaluate(() => {
    // ── Helpers ──────────────────────────────────────────────────────
    function getStyles(el: Element) {
      const s = getComputedStyle(el);
      return {
        background: s.backgroundColor,
        color: s.color,
        padding: s.padding,
        borderRadius: s.borderRadius,
        border: s.border,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        fontFamily: s.fontFamily,
        lineHeight: s.lineHeight,
        boxShadow: s.boxShadow,
        cursor: s.cursor,
        textTransform: s.textTransform,
        letterSpacing: s.letterSpacing,
        transition: s.transition,
      };
    }

    function isVisible(el: Element): boolean {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0"
      );
    }

    function classifyButtonVariant(s: ReturnType<typeof getStyles>): string {
      const bg = s.background;
      const border = s.border;
      // Transparent/none background = ghost or outline
      if (bg === "rgba(0, 0, 0, 0)" || bg === "transparent") {
        if (border && border !== "none" && !border.includes("0px")) {
          return "outline";
        }
        return "ghost";
      }
      return "primary";
    }

    // ── Buttons ─────────────────────────────────────────────────────
    const buttonEls = document.querySelectorAll(
      'button, a[role="button"], [class*="btn"], [class*="button"], input[type="submit"]'
    );
    const seenButtonStyles = new Set<string>();
    const buttons: ComponentTokens["buttons"] = [];

    for (const el of Array.from(buttonEls).slice(0, 30)) {
      if (!isVisible(el)) continue;
      const styles = getStyles(el);
      const key = `${styles.background}|${styles.color}|${styles.borderRadius}|${styles.border}`;
      if (seenButtonStyles.has(key)) continue;
      seenButtonStyles.add(key);

      const variant = classifyButtonVariant(styles);
      buttons.push({
        variant,
        selector: el.tagName.toLowerCase() + (el.className ? `.${el.className.split(" ")[0]}` : ""),
        default: styles,
        text: (el.textContent || "").trim().substring(0, 40),
      });
    }

    // ── Cards ───────────────────────────────────────────────────────
    const cardEls = document.querySelectorAll(
      '[class*="card"], [class*="Card"], article, [class*="feature"], [class*="pricing"], [class*="panel"]'
    );
    const seenCardStyles = new Set<string>();
    const cards: ComponentTokens["cards"] = [];

    for (const el of Array.from(cardEls).slice(0, 20)) {
      if (!isVisible(el)) continue;
      const styles = getStyles(el);
      const key = `${styles.background}|${styles.borderRadius}|${styles.boxShadow}|${styles.border}`;
      if (seenCardStyles.has(key)) continue;
      seenCardStyles.add(key);

      cards.push({
        selector: el.tagName.toLowerCase() + (el.className ? `.${el.className.split(" ")[0]}` : ""),
        styles,
      });
    }

    // ── Inputs ──────────────────────────────────────────────────────
    const inputEls = document.querySelectorAll(
      "input[type='text'], input[type='email'], input[type='password'], input[type='search'], input[type='url'], input[type='tel'], input[type='number'], textarea, select"
    );
    const seenInputStyles = new Set<string>();
    const inputs: ComponentTokens["inputs"] = [];

    for (const el of Array.from(inputEls).slice(0, 10)) {
      if (!isVisible(el)) continue;
      const styles = getStyles(el);
      const key = `${styles.border}|${styles.borderRadius}|${styles.background}`;
      if (seenInputStyles.has(key)) continue;
      seenInputStyles.add(key);

      const inputEl = el as HTMLInputElement;
      inputs.push({
        type: inputEl.type || el.tagName.toLowerCase(),
        selector: el.tagName.toLowerCase() + (el.className ? `.${el.className.split(" ")[0]}` : ""),
        default: styles,
        placeholder: inputEl.placeholder || "",
      });
    }

    // ── Navigation ──────────────────────────────────────────────────
    let nav: ComponentTokens["nav"] = null;
    const navEl =
      document.querySelector("nav") ||
      document.querySelector("header") ||
      document.querySelector('[role="navigation"]');

    if (navEl && isVisible(navEl)) {
      const navStyles = getComputedStyle(navEl);
      const navLink = navEl.querySelector("a");
      const navCta = navEl.querySelector("button") || navEl.querySelector('a[class*="cta"], a[class*="btn"]');

      nav = {
        position: navStyles.position,
        background: navStyles.backgroundColor,
        backdropFilter: navStyles.backdropFilter || "none",
        height: navStyles.height,
        borderBottom: navStyles.borderBottom,
        linkStyles: navLink ? getStyles(navLink) : {},
        ctaStyles: navCta ? getStyles(navCta) : undefined,
      };
    }

    return { buttons, cards, inputs, nav };
  });
}
