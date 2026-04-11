import type { Page } from "playwright-core";
import type { AssetTokens } from "../types";

export async function extractAssets(page: Page): Promise<AssetTokens> {
  return page.evaluate(() => {
    // Favicon
    const faviconLink =
      document.querySelector('link[rel="icon"]') ||
      document.querySelector('link[rel="shortcut icon"]');
    const favicon = faviconLink
      ? (faviconLink as HTMLLinkElement).href
      : null;

    // OG Image
    const ogMeta = document.querySelector('meta[property="og:image"]');
    const ogImage = ogMeta
      ? (ogMeta as HTMLMetaElement).content
      : null;

    // Logos — look for images in header/nav areas
    const logos: string[] = [];
    const headerImgs = document.querySelectorAll(
      "header img, nav img, [class*='logo'] img, img[class*='logo'], [id*='logo'] img, img[id*='logo']"
    );
    for (const img of Array.from(headerImgs)) {
      const src = (img as HTMLImageElement).src;
      if (src) logos.push(src);
    }

    // Also check for SVG logos
    const svgLogos = document.querySelectorAll(
      "header svg, nav svg, [class*='logo'] svg"
    );
    for (const svg of Array.from(svgLogos)) {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      if (svgStr.length < 5000) {
        // Only capture small SVGs (likely logos)
        logos.push(`data:image/svg+xml,${encodeURIComponent(svgStr)}`);
      }
    }

    return {
      favicon,
      ogImage,
      logos: [...new Set(logos)],
    };
  });
}
