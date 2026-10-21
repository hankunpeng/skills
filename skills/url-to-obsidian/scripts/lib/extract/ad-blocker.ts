export const BLOCKED_AD_URL_PATTERNS: string[] = [
  "*://*.doubleclick.net/*",
  "*://*.googlesyndication.com/*",
  "*://*.googleadservices.com/*",
  "*://*.googletagservices.com/*",
  "*://*.adservice.google.com/*",
  "*://*.ezoic.net/*",
  "*://*.ezojs.com/*",
  "*://*.ezodn.com/*",
  "*://*.ezoic.com/*",
  "*://*.humix.com/*",
  "*://*.open.video/*",
  "*://*.video-meta.open.video/*",
  "*://*.adthrive.com/*",
  "*://*.raptive.com/*",
  "*://*.mediavine.com/*",
  "*://*.freestar.com/*",
  "*://*.pubfig.com/*",
  "*://*.playwire.com/*",
  "*://*.connatix.com/*",
  "*://*.primis.tech/*",
  "*://*.anyclip.com/*",
  "*://*.vidoomy.com/*",
  "*://*.ex.co/*",
  "*://*.taboola.com/*",
  "*://*.outbrain.com/*",
  "*://*.mgid.com/*",
  "*://*.revcontent.com/*",
  "*://*.zergnet.com/*",
  "*://*.criteo.com/*",
  "*://*.criteo.net/*",
  "*://*.rubiconproject.com/*",
  "*://*.pubmatic.com/*",
  "*://*.openx.net/*",
  "*://*.casalemedia.com/*",
  "*://*.adnxs.com/*",
  "*://*.smartadserver.com/*",
  "*://*.adsrvr.org/*",
  "*://*.amazon-adsystem.com/*",
  "*://*.moatads.com/*",
  "*://*.doubleverify.com/*",
  "*://*.adsafeprotected.com/*",
  "*://*.carbonads.com/*",
  "*://*.buysellads.com/*",
  "*://*.ethicalads.io/*",
];

export const AD_DOM_SELECTORS: string[] = [
  // Google Ads / AdSense / GPT
  "ins.adsbygoogle",
  ".adsbygoogle",
  ".google-ad",
  ".adsense",
  "[id^='div-gpt-ad']",
  "[data-google-query-id]",
  "[data-ad]",
  "[data-ads]",
  "[data-ad-slot]",
  "[data-ad-client]",
  "[data-ad-unit]",
  "[data-ad-region]",
  "[data-ad-name]",
  // Ezoic / Humix / Open.Video
  "[id^='ezoic-']",
  "[id*='ezoic']",
  "[class*='ezoic']",
  "[data-ez-ph-id]",
  "[data-ezscrex]",
  ".cf_monitor",
  "div.code-block",
  "[id*='humix']",
  "[class*='humix']",
  "[data-shadow-host*='humix']",
  "[data-shadow-host*='ov-']",
  "[data-shadow-host*='ezoic']",
  "a[href*='open.video']",
  "img[src*='open.video']",
  // Raptive / AdThrive / Mediavine / Freestar / Playwire
  "[class*='adthrive']",
  "[id*='adthrive']",
  "[class*='raptive']",
  "[id*='raptive']",
  "[class*='mediavine']",
  "[id*='mediavine']",
  "[class*='freestar']",
  "[id*='freestar']",
  "[data-freestar-ad]",
  "[class*='playwire']",
  "[id*='playwire']",
  // Outstream / Floating Video Ad Players
  "[id*='connatix']",
  "[class*='connatix']",
  "cnx",
  "[id*='primis']",
  "[class*='primis']",
  "[id*='anyclip']",
  "[class*='anyclip']",
  // Native Ad & Recommendation Widgets
  "[id*='taboola']",
  "[class*='taboola']",
  "[id*='outbrain']",
  "[class*='outbrain']",
  ".OUTBRAIN",
  "[data-widget-id*='outbrain']",
  "[id*='mgid']",
  "[class*='mgid']",
  "[class*='revcontent']",
  "[id*='zergnet']",
  "[class*='zergnet']",
  // Developer / Tech Blog Ad Networks (Carbon, BuySellAds, EthicalAds)
  "#carbonads",
  ".carbon-ads",
  "[id*='carbonads']",
  "[class*='carbonads']",
  "[data-ea-publisher]",
  "[data-ea-type]",
  ".ethical-ads",
  "[class*='bsa-']",
  "[id^='bsap_']",
  // Generic Ad Containers & Tracking Pixels
  ".ad",
  ".ads",
  ".advert",
  ".advertisement",
  ".ad-container",
  ".ad-wrapper",
  ".ad-slot",
  ".ad-unit",
  ".ad-banner",
  ".ad-box",
  ".ad-block",
  ".ad-label",
  ".ad-placeholder",
  ".dfp-ad",
  ".sponsored",
  ".sponsored-content",
  ".sponsor-banner",
  ".promo-banner",
  "[aria-label='advertisement' i]",
  "[aria-label='sponsored' i]",
  "img[width='1'][height='1']",
  "img[src*='pixel']",
  "img[src*='tracking']",
  "img[src*='analytics']",
  // Article bottom prev/next navigation widgets (e.g. LearnCpp)
  ".prevnext",
];

const H3_TITLE_MARKER = "__AD_PURE_H3__ ";
const CALLOUT_END_MARKER = "__AD_PURE_CALLOUT_END__";

function resolveCalloutAlertType(
  noteElement: Element,
  titleText: string,
): "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "FAQ" {
  const className = noteElement.className || "";
  if (/^Q:/i.test(titleText)) {
    return "FAQ";
  }
  if (/\bcpp-lightgreenbackground\b/i.test(className) || /^(?:best practice|tip)\b/i.test(titleText)) {
    return "TIP";
  }
  if (/\bcpp-lightredbackground\b/i.test(className) || /^(?:warning|caution)\b/i.test(titleText)) {
    return "WARNING";
  }
  if (/^(?:rule|key insight|important)\b/i.test(titleText)) {
    return "IMPORTANT";
  }
  return "NOTE";
}

export function normalizePseudoHeadings(document: Document): void {
  // LearnCpp section titles: <p class="cpp-section"> -> <h2>
  document.querySelectorAll("p.cpp-section").forEach((element) => {
    const h2 = document.createElement("h2");
    h2.innerHTML = element.innerHTML;
    element.replaceWith(h2);
  });

  // LearnCpp callout boxes (<div class="cpp-note">) and FAQ titles (<p class="cpp-note-title">)
  document.querySelectorAll("div.cpp-note").forEach((noteElement) => {
    const titleElement = noteElement.querySelector("p.cpp-note-title");
    if (!titleElement) {
      return;
    }

    const titleText = (titleElement.textContent || "").trim();
    if (!titleText || titleText.startsWith("__AD_PURE_")) {
      return;
    }

    const alertType = resolveCalloutAlertType(noteElement, titleText);
    titleElement.textContent = `__AD_PURE_CALLOUT_START_${alertType}__ ${titleText}`;

    const endMarker = document.createElement("p");
    endMarker.textContent = CALLOUT_END_MARKER;
    noteElement.appendChild(endMarker);
  });

  // Any standalone <p class="cpp-note-title"> not inside div.cpp-note
  document.querySelectorAll("p.cpp-note-title").forEach((element) => {
    const text = (element.textContent || "").trim();
    if (text && !text.startsWith("__AD_PURE_")) {
      element.textContent = `${H3_TITLE_MARKER}${text}`;
    }
  });
}

function isVideoAdPlaylistElement(element: Element): boolean {
  const text = (element.textContent || "").trim();
  if (!text) {
    return false;
  }

  const nowPlayingMatches = text.match(/\b(?:Now Playing|Up Next)\b/gi);
  if (nowPlayingMatches && nowPlayingMatches.length >= 2) {
    return true;
  }

  if (
    element.querySelector("img[src*='open.video'], a[href*='open.video'], [class*='humix']") &&
    /\b(?:Now Playing|Up Next)\b/i.test(text)
  ) {
    return true;
  }

  return false;
}

export function purifyDomAds(document: Document): void {
  for (const selector of AD_DOM_SELECTORS) {
    try {
      document.querySelectorAll(selector).forEach((element) => element.remove());
    } catch {
      // Ignore unsupported selectors in JSDOM.
    }
  }

  // Remove any list or container that represents an injected video ad playlist ("Now Playing" / "Up Next").
  document.querySelectorAll("ol, ul, div, section, aside").forEach((element) => {
    // Only remove the most specific list/container so we don't accidentally remove the article root.
    if (
      element.querySelector("article, main, .entry-content, .post-content, .article-content") ||
      element.matches("article, main, body, #main, #content, .entry-content, .post-content, .article-content")
    ) {
      return;
    }

    if (element.tagName === "OL" || element.tagName === "UL" || element.hasAttribute("data-shadow-host")) {
      if (isVideoAdPlaylistElement(element)) {
        element.remove();
      }
    }
  });
}

const AD_LINK_DOMAIN_PATTERN =
  /^https?:\/\/(?:[^/]+\.)?(?:open\.video|humix\.com|doubleclick\.net|googlesyndication\.com|googleadservices\.com|taboola\.com|outbrain\.com|connatix\.com|primis\.tech|adthrive\.com|raptive\.com|mediavine\.com|freestar\.com|carbonads\.com|buysellads\.com)\//i;

function isMarkdownAdBlock(block: string): boolean {
  const trimmed = block.trim();
  if (!trimmed) {
    return false;
  }

  // Standalone ad labels
  if (/^(?:Advertisement|Sponsored|Sponsored Content|Promoted|Ad|广告|赞助内容)$/i.test(trimmed)) {
    return true;
  }

  // Video ad playlist blocks containing multiple "Now Playing" / "Up Next" items or open.video thumbnails
  const nowPlayingCount = (trimmed.match(/\b(?:Now Playing|Up Next)\b/gi) || []).length;
  if (nowPlayingCount >= 2) {
    return true;
  }
  if (nowPlayingCount >= 1 && /(?:open\.video|humix\.com|\b\d{1,2}:\d{2}\b)/i.test(trimmed)) {
    return true;
  }

  // Standalone markdown link or image pointing to a known ad/video-ad domain
  const singleLinkMatch = trimmed.match(/^!?\[[^\]]*\]\((https?:\/\/[^)\s]+)\)$/);
  if (singleLinkMatch && AD_LINK_DOMAIN_PATTERN.test(singleLinkMatch[1])) {
    return true;
  }

  return false;
}

function formatCalloutBlocks(markdown: string): string {
  const startRegex =
    /^\\?_\\?_AD\\?_PURE\\?_CALLOUT\\?_START\\?_(NOTE|TIP|IMPORTANT|WARNING|FAQ)\\?_\\?_[ \t]+(.+)$/m;
  const endRegex = /^\\?_\\?_AD\\?_PURE\\?_CALLOUT\\?_END\\?_\\?_[ \t]*$/m;

  let current = markdown;
  while (true) {
    const startMatch = startRegex.exec(current);
    if (!startMatch || startMatch.index === undefined) {
      break;
    }

    const alertType = startMatch[1];
    const title = startMatch[2].trim();
    const afterStartIndex = startMatch.index + startMatch[0].length;
    const rest = current.slice(afterStartIndex);
    const endMatch = endRegex.exec(rest);
    const headerLine = `> [!${alertType}] ${title}`;

    if (!endMatch || endMatch.index === undefined) {
      current = current.slice(0, startMatch.index) + `\n\n${headerLine}\n\n` + rest;
      continue;
    }

    const bodyContent = rest.slice(0, endMatch.index).trim();
    const quotedBody = bodyContent
      .split("\n")
      .map((line) => (line.trim() ? `> ${line}` : ">"))
      .join("\n");

    const replacement = quotedBody
      ? `\n\n${headerLine}\n${quotedBody}\n\n`
      : `\n\n${headerLine}\n\n`;

    current =
      current.slice(0, startMatch.index) +
      replacement +
      rest.slice(endMatch.index + endMatch[0].length);
  }

  return current.replace(/^\\?_\\?_AD\\?_PURE\\?_CALLOUT\\?_END\\?_\\?_[ \t]*$/gm, "");
}

export function purifyMarkdownAds(markdown: string): string {
  const withHeadingsAndCallouts = formatCalloutBlocks(
    markdown
      .replace(/\r\n/g, "\n")
      .replace(/^\\?_\\?_AD\\?_PURE\\?_H3\\?_\\?_\s+(.+)$/gm, "### $1"),
  );
  const blocks = withHeadingsAndCallouts.split(/\n{2,}/);
  const filteredBlocks = blocks.filter((block) => !isMarkdownAdBlock(block));

  return filteredBlocks
    .join("\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
