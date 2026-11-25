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

export type MarkdownFlavor = "gfm" | "ofm";
export type CalloutAlertType = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION" | "FAQ";

const H3_TITLE_MARKER = "__AD_PURE_H3__ ";
const CALLOUT_END_MARKER = "__AD_PURE_CALLOUT_END__";
const WEB_CALLOUT_CONTAINERS = [
  "div.markdown-alert",
  "div.admonition",
  "div.theme-admonition",
  "div.callout",
  "aside.callout",
  "div.custom-block.tip",
  "div.custom-block.warning",
  "div.custom-block.danger",
  "div.custom-block.info",
  "div.custom-block.note",
].join(", ");
const WEB_CALLOUT_TITLES = [
  ".markdown-alert-title",
  ".admonition-heading",
  ".admonition-title",
  ".custom-block-title",
  ".callout-title",
].join(", ");

function resolveCalloutAlertType(
  noteElement: Element,
  titleText: string,
): CalloutAlertType {
  const className = noteElement.className || "";
  if (/^Q:/i.test(titleText) || /\b(?:faq|question)\b/i.test(className)) {
    return "FAQ";
  }
  if (/^(?:caution|danger)\b/i.test(titleText) || /\b(?:markdown-alert-caution|caution|danger)\b/i.test(className)) {
    return "CAUTION";
  }
  if (/\b(?:cpp-lightredbackground|markdown-alert-warning|warning)\b/i.test(className) || /^warning\b/i.test(titleText)) {
    return "WARNING";
  }
  if (/\b(?:cpp-lightgreenbackground|markdown-alert-tip|tip|hint)\b/i.test(className) || /^(?:best practice|tip|hint)\b/i.test(titleText)) {
    return "TIP";
  }
  if (/\b(?:markdown-alert-important|important)\b/i.test(className) || /^(?:rule|key insight|important)\b/i.test(titleText)) {
    return "IMPORTANT";
  }
  return "NOTE";
}

function markCalloutContainer(
  noteElement: Element,
  titleElement: Element,
): void {
  const titleText = (titleElement.textContent || "").trim();
  if (!titleText || titleText.startsWith("__AD_PURE_")) {
    return;
  }

  noteElement.setAttribute("data-ad-pure-callout", "1");
  const alertType = resolveCalloutAlertType(noteElement, titleText);
  titleElement.textContent = `__AD_PURE_CALLOUT_START_${alertType}__ ${titleText}`;

  const endMarker = noteElement.ownerDocument.createElement("p");
  endMarker.textContent = CALLOUT_END_MARKER;
  noteElement.appendChild(endMarker);
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
    if (noteElement.closest("[data-ad-pure-callout]")) {
      return;
    }
    const titleElement = noteElement.querySelector("p.cpp-note-title");
    if (!titleElement) {
      return;
    }
    markCalloutContainer(noteElement, titleElement);
  });

  // Standard web callout/admonition containers (GitHub alerts, Docusaurus, VitePress, MkDocs)
  document.querySelectorAll(WEB_CALLOUT_CONTAINERS).forEach((noteElement) => {
    if (noteElement.closest("[data-ad-pure-callout]")) {
      return;
    }
    const titleElement = noteElement.querySelector(WEB_CALLOUT_TITLES);
    if (!titleElement) {
      return;
    }
    markCalloutContainer(noteElement, titleElement);
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

function isRedundantTitle(type: string, title: string): boolean {
  return title.trim().toLowerCase() === type.toLowerCase();
}

function formatCalloutBlocks(markdown: string, flavor: MarkdownFlavor): string {
  const startRegex =
    /^\\?_\\?_AD\\?_PURE\\?_CALLOUT\\?_START\\?_(NOTE|TIP|IMPORTANT|WARNING|CAUTION|FAQ)\\?_\\?_[ \t]+(.+)$/m;
  const endRegex = /^\\?_\\?_AD\\?_PURE\\?_CALLOUT\\?_END\\?_\\?_[ \t]*$/m;

  let current = markdown;
  while (true) {
    const startMatch = startRegex.exec(current);
    if (!startMatch || startMatch.index === undefined) {
      break;
    }

    const alertType = startMatch[1] as CalloutAlertType;
    const title = startMatch[2].trim();
    const afterStartIndex = startMatch.index + startMatch[0].length;
    const rest = current.slice(afterStartIndex);
    const endMatch = endRegex.exec(rest);

    let bodyContent = "";
    let trailingContent = rest;
    if (endMatch && endMatch.index !== undefined) {
      bodyContent = rest.slice(0, endMatch.index).trim();
      trailingContent = rest.slice(endMatch.index + endMatch[0].length);
    }

    const quotedBody = bodyContent
      ? bodyContent
          .split("\n")
          .map((line) => (line.trim() ? `> ${line}` : ">"))
          .join("\n")
      : "";

    let replacement: string;
    if (flavor === "ofm") {
      const headerLine =
        !title || isRedundantTitle(alertType, title)
          ? `> [!${alertType}]`
          : `> [!${alertType}] ${title}`;
      replacement = quotedBody
        ? `\n\n${headerLine}\n${quotedBody}\n\n`
        : `\n\n${headerLine}\n\n`;
    } else {
      const gfmType = alertType === "FAQ" ? "NOTE" : alertType;
      const headerLine = `> [!${gfmType}]`;
      const titleLine = title && !isRedundantTitle(gfmType, title) ? `> **${title}**` : "";
      if (titleLine && quotedBody) {
        replacement = `\n\n${headerLine}\n${titleLine}\n>\n${quotedBody}\n\n`;
      } else if (titleLine) {
        replacement = `\n\n${headerLine}\n${titleLine}\n\n`;
      } else if (quotedBody) {
        replacement = `\n\n${headerLine}\n${quotedBody}\n\n`;
      } else {
        replacement = `\n\n${headerLine}\n\n`;
      }
    }

    current = current.slice(0, startMatch.index) + replacement + trailingContent;
  }

  return current.replace(/^\\?_\\?_AD\\?_PURE\\?_CALLOUT\\?_END\\?_\\?_[ \t]*$/gm, "");
}

function normalizeExistingCallouts(markdown: string, flavor: MarkdownFlavor): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const result: string[] = [];
  let inFence = false;
  let fenceChar = "";
  let fenceLen = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceChar = marker[0];
        fenceLen = marker.length;
      } else if (marker[0] === fenceChar && marker.length >= fenceLen) {
        inFence = false;
      }
      result.push(line);
      continue;
    }

    if (inFence) {
      result.push(line);
      continue;
    }

    if (flavor === "gfm") {
      const match = line.match(/^>[ \t]*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|FAQ)\](?:[ \t]+([^\n]+))?$/i);
      if (match) {
        const rawType = match[1].toUpperCase();
        const gfmType = rawType === "FAQ" ? "NOTE" : rawType;
        const rawTitle = (match[2] ?? "").trim();
        const cleanTitle = rawTitle.replace(/^\*\*([^*]+)\*\*$/, "$1").trim();

        result.push(`> [!${gfmType}]`);
        if (cleanTitle && !isRedundantTitle(gfmType, cleanTitle)) {
          result.push(`> **${cleanTitle}**`);
          const nextLine = lines[i + 1];
          if (nextLine !== undefined && /^>[ \t]*\S/.test(nextLine)) {
            result.push(">");
          }
        }
        continue;
      }
    } else {
      const match = line.match(/^>[ \t]*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|FAQ)\][ \t]*$/i);
      if (match && i + 1 < lines.length) {
        const titleMatch = lines[i + 1].match(/^>[ \t]*\*\*([^*\n]+)\*\*[ \t]*$/);
        if (titleMatch) {
          const type = match[1].toUpperCase();
          const title = titleMatch[1].trim();
          result.push(`> [!${type}] ${title}`);
          i += 1;
          if (i + 1 < lines.length && /^>[ \t]*$/.test(lines[i + 1])) {
            i += 1;
          }
          continue;
        }
      }
    }

    result.push(line);
  }

  return result.join("\n");
}

export function normalizeCalloutsForFlavor(
  markdown: string,
  flavor: MarkdownFlavor = "gfm",
): string {
  return normalizeExistingCallouts(formatCalloutBlocks(markdown, flavor), flavor);
}

export function purifyMarkdownAds(
  markdown: string,
  options: { flavor?: MarkdownFlavor } = {},
): string {
  const flavor = options.flavor ?? "gfm";
  const withHeadingsAndCallouts = normalizeCalloutsForFlavor(
    markdown
      .replace(/\r\n/g, "\n")
      .replace(/^\\?_\\?_AD\\?_PURE\\?_H3\\?_\\?_\s+(.+)$/gm, "### $1"),
    flavor,
  );
  const blocks = withHeadingsAndCallouts.split(/\n{2,}/);
  const filteredBlocks = blocks.filter((block) => !isMarkdownAdBlock(block));

  return filteredBlocks
    .join("\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
