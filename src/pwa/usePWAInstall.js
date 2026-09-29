// usePWAInstall — isolated PWA install-state hook.
// Does not touch any existing BioVerse feature/state. Safe to import anywhere.
import { useState, useEffect, useCallback } from "react";

const DISMISS_KEY = "bioverse_pwa_install_dismissed_at";
const INSTALLED_KEY = "bioverse_pwa_installed";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function safeGetItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* localStorage unavailable (private mode etc.) — degrade silently */
  }
}

/** True if BioVerse is currently running as an installed/standalone app. */
export function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  const mql =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = typeof navigator !== "undefined" && navigator.standalone === true;
  return Boolean(mql || iosStandalone);
}

/** True if we're on an iOS/Safari-family browser that never fires beforeinstallprompt. */
export function isIOSNoPromptBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return isIOSDevice;
}

function recentlyDismissed() {
  const raw = safeGetItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < DISMISS_COOLDOWN_MS;
}

/**
 * React hook exposing PWA install state + actions.
 * Returns:
 *  - isStandalone: already running installed
 *  - canInstall: beforeinstallprompt is available (Chrome/Edge/Android)
 *  - isIOS: iOS/Safari family (needs manual "Add to Home Screen" instructions)
 *  - showBanner: whether the UI should currently render any install affordance
 *  - install(): trigger native prompt (returns the userChoice outcome)
 *  - dismiss(): user dismissed, suppress banner for the cooldown window
 */
export function usePWAInstallState() {
  const [isStandalone, setIsStandalone] = useState(isStandaloneMode());
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(recentlyDismissed());
  const [justInstalled, setJustInstalled] = useState(safeGetItem(INSTALLED_KEY) === "true");

  useEffect(() => {
    if (isStandaloneMode()) {
      setIsStandalone(true);
      return undefined;
    }

    const mql = window.matchMedia && window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => setIsStandalone(isStandaloneMode());
    if (mql && mql.addEventListener) mql.addEventListener("change", handleDisplayModeChange);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setJustInstalled(true);
      setIsStandalone(true);
      safeSetItem(INSTALLED_KEY, "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      if (mql && mql.removeEventListener) mql.removeEventListener("change", handleDisplayModeChange);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return null;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice && choice.outcome === "accepted") {
      setJustInstalled(true);
      safeSetItem(INSTALLED_KEY, "true");
    } else {
      // Treat an explicit decline in the native dialog like a dismissal.
      safeSetItem(DISMISS_KEY, String(Date.now()));
      setDismissed(true);
    }
    return choice;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    safeSetItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }, []);

  const isIOS = isIOSNoPromptBrowser();
  const canInstall = Boolean(deferredPrompt) && !isStandalone && !justInstalled;
  const showIOSHint = isIOS && !isStandalone && !justInstalled && !dismissed;
  const showBanner = !isStandalone && !justInstalled && !dismissed && (canInstall || showIOSHint);

  return { isStandalone, canInstall, isIOS, showIOSHint, showBanner, install, dismiss };
}
