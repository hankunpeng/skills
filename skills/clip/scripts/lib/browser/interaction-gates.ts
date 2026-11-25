import type { WaitForInteractionRequest } from "../adapters/types";
import type { BrowserSession } from "./session";

interface GateSnapshot {
  title: string;
  currentUrl: string;
  bodyText: string;
  hasCloudflareTurnstile: boolean;
  hasCloudflareChallenge: boolean;
  hasRecaptcha: boolean;
  hasRecaptchaIframe: boolean;
  hasHcaptcha: boolean;
  hasHcaptchaIframe: boolean;
}

const MAX_GATE_BODY_TEXT_LENGTH = 800;

export function detectInteractionGateFromSnapshot(snapshot: GateSnapshot): WaitForInteractionRequest | null {
  const text = snapshot.bodyText.toLowerCase();
  const title = snapshot.title.toLowerCase();
  const url = snapshot.currentUrl.toLowerCase();
  const isShortBody = text.trim().length < MAX_GATE_BODY_TEXT_LENGTH;

  if (
    snapshot.hasCloudflareTurnstile ||
    snapshot.hasCloudflareChallenge ||
    url.includes("/cdn-cgi/challenge-platform/") ||
    (isShortBody &&
      (title.includes("just a moment") ||
        text.includes("verify you are human") ||
        text.includes("checking your browser before accessing") ||
        text.includes("enable javascript and cookies to continue")))
  ) {
    return {
      type: "wait_for_interaction",
      kind: "cloudflare",
      provider: "cloudflare",
      reason: "Cloudflare human verification detected",
      prompt: "Please complete the Cloudflare verification in the opened Chrome window. Extraction will continue automatically once the challenge disappears.",
      requiresVisibleBrowser: true,
    };
  }

  if (
    snapshot.hasRecaptcha ||
    snapshot.hasRecaptchaIframe ||
    (isShortBody && text.includes("i'm not a robot"))
  ) {
    return {
      type: "wait_for_interaction",
      kind: "recaptcha",
      provider: "google_recaptcha",
      reason: "Google reCAPTCHA detected",
      prompt: "Please complete the reCAPTCHA verification in the opened Chrome window. Extraction will continue automatically once the challenge disappears.",
      requiresVisibleBrowser: true,
    };
  }

  if (
    snapshot.hasHcaptcha ||
    snapshot.hasHcaptchaIframe
  ) {
    return {
      type: "wait_for_interaction",
      kind: "hcaptcha",
      provider: "hcaptcha",
      reason: "hCaptcha verification detected",
      prompt: "Please complete the hCaptcha verification in the opened Chrome window. Extraction will continue automatically once the challenge disappears.",
      requiresVisibleBrowser: true,
    };
  }

  return null;
}

export async function detectInteractionGate(browser: BrowserSession): Promise<WaitForInteractionRequest | null> {
  const snapshot = await browser.evaluate<GateSnapshot>(`
    (() => {
      const bodyText = (document.body?.innerText ?? "").slice(0, 4000);
      const isShortBody = bodyText.trim().length < ${MAX_GATE_BODY_TEXT_LENGTH};

      const isVisible = (el) => {
        if (!el || !(el instanceof HTMLElement)) return false;
        let curr = el;
        while (curr) {
          const style = window.getComputedStyle(curr);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            Number.parseFloat(style.opacity || "1") === 0
          ) {
            return false;
          }
          curr = curr.parentElement;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width <= 1 || rect.height <= 1) {
          return false;
        }
        if (rect.bottom <= 0 || rect.right <= 0) {
          return false;
        }
        return true;
      };

      const hasVisibleMatch = (selector, filter) =>
        Array.from(document.querySelectorAll(selector)).some(
          (el) => isVisible(el) && (!filter || filter(el))
        );

      const hasNonEmptyValue = (selector) =>
        Array.from(document.querySelectorAll(selector)).some(
          (el) => typeof el.value === "string" && el.value.trim().length > 0
        );

      const isInvisibleRecaptcha = (el) => {
        if (el.closest('.grecaptcha-badge, [data-size="invisible"]')) {
          return true;
        }
        const src = el.getAttribute("src") ?? "";
        return src.includes("size=invisible");
      };

      const isInvisibleHcaptcha = (el) => {
        if (el.closest('[data-size="invisible"]')) {
          return true;
        }
        const src = el.getAttribute("src") ?? "";
        return src.includes("size=invisible");
      };

      const isInvisibleTurnstile = (el) =>
        Boolean(el.closest('[data-size="invisible"], [data-appearance="interaction-only"]'));

      const turnstileSolved = hasNonEmptyValue('[name="cf-turnstile-response"]');
      const recaptchaSolved = hasNonEmptyValue(
        'textarea[name="g-recaptcha-response"], [name="g-recaptcha-response"]'
      );
      const hcaptchaSolved = hasNonEmptyValue(
        'textarea[name="h-captcha-response"], [name="h-captcha-response"]'
      );

      const hasActiveRecaptchaChallenge =
        !recaptchaSolved &&
        hasVisibleMatch(
          'iframe[src*="recaptcha/api2/bframe"], iframe[src*="recaptcha/enterprise/bframe"]'
        );

      const hasVisibleRecaptchaWidget =
        !recaptchaSolved &&
        isShortBody &&
        hasVisibleMatch(
          'iframe[src*="recaptcha/api2/anchor"], iframe[src*="recaptcha/enterprise/anchor"], iframe[title*="reCAPTCHA"], .g-recaptcha',
          (el) => !isInvisibleRecaptcha(el)
        );

      const hasActiveHcaptchaChallenge =
        !hcaptchaSolved &&
        hasVisibleMatch('iframe[src*="hcaptcha.com"][src*="frame=challenge"]');

      const hasVisibleHcaptchaWidget =
        !hcaptchaSolved &&
        isShortBody &&
        hasVisibleMatch(
          '.h-captcha, iframe[title*="hCaptcha"], iframe[src*="hcaptcha.com"]',
          (el) => !isInvisibleHcaptcha(el)
        );

      return {
        title: document.title ?? "",
        currentUrl: window.location.href,
        bodyText,
        hasCloudflareTurnstile:
          !turnstileSolved &&
          isShortBody &&
          hasVisibleMatch(
            '.cf-turnstile, iframe[src*="challenges.cloudflare.com"]',
            (el) => !isInvisibleTurnstile(el)
          ),
        hasCloudflareChallenge: Boolean(
          document.querySelector(
            '#challenge-running, #cf-challenge-running, .challenge-platform, [data-translate="checking_browser"]'
          ) ||
            (isShortBody && document.querySelector("[data-ray]"))
        ),
        hasRecaptcha: hasVisibleRecaptchaWidget,
        hasRecaptchaIframe: hasActiveRecaptchaChallenge || hasVisibleRecaptchaWidget,
        hasHcaptcha: hasVisibleHcaptchaWidget,
        hasHcaptchaIframe: hasActiveHcaptchaChallenge || hasVisibleHcaptchaWidget,
      };
    })()
  `).catch(() => ({
    title: "",
    currentUrl: "",
    bodyText: "",
    hasCloudflareTurnstile: false,
    hasCloudflareChallenge: false,
    hasRecaptcha: false,
    hasRecaptchaIframe: false,
    hasHcaptcha: false,
    hasHcaptchaIframe: false,
  }));

  return detectInteractionGateFromSnapshot(snapshot);
}
