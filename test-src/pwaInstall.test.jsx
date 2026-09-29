import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import InstallPrompt from "../src/pwa/InstallPrompt.jsx";
import { isStandaloneMode, isIOSNoPromptBrowser } from "../src/pwa/usePWAInstall.js";

function mockMatchMedia(matchesStandalone) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query === "(display-mode: standalone)" ? matchesStandalone : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function mockUserAgent(ua) {
  Object.defineProperty(window.navigator, "userAgent", { value: ua, configurable: true });
}

function fireBeforeInstallPrompt() {
  const evt = new Event("beforeinstallprompt", { cancelable: true });
  evt.prompt = vi.fn();
  evt.userChoice = Promise.resolve({ outcome: "accepted" });
  window.dispatchEvent(evt);
  return evt;
}

describe("PWA install experience", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockMatchMedia(false);
    mockUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36");
    Object.defineProperty(window.navigator, "standalone", { value: undefined, configurable: true });
    Object.defineProperty(window.navigator, "maxTouchPoints", { value: 0, configurable: true });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("A/D/E: manifest config carries correct app identity, standalone display, and start URL", async () => {
    // Manifest is generated at build time by vite-plugin-pwa (not importable in jsdom),
    // so we assert against the vite.config.ts manifest source of truth.
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const cfgPath = path.default.resolve(path.default.dirname(fileURLToPath(import.meta.url)), "../vite.config.ts");
    const src = fs.readFileSync(cfgPath, "utf-8");
    expect(src).toContain('name: "BioVerse"');
    expect(src).toContain('short_name: "BioVerse"');
    expect(src).toContain('display: "standalone"');
    expect(src).toContain('start_url: "/"');
  });

  it("F: required 192 and 512 icons (including maskable) exist on disk", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const dir = path.default.resolve(path.default.dirname(fileURLToPath(import.meta.url)), "../public/icons");
    const files = fs.readdirSync(dir);
    expect(files).toEqual(
      expect.arrayContaining([
        "icon-192.png",
        "icon-512.png",
        "maskable-icon-192.png",
        "maskable-icon-512.png",
      ])
    );
  });

  it("I: install button/banner appears only after beforeinstallprompt fires", async () => {
    render(<InstallPrompt />);
    expect(screen.queryByTestId("pwa-install-banner")).toBeNull();

    act(() => {
      fireBeforeInstallPrompt();
    });

    await waitFor(() => expect(screen.getByTestId("pwa-install-banner")).toBeInTheDocument());
    expect(screen.getByTestId("pwa-install-button")).toBeInTheDocument();
  });

  it("clicking Install triggers the native prompt and hides the banner on acceptance", async () => {
    render(<InstallPrompt />);
    let evt;
    act(() => {
      evt = fireBeforeInstallPrompt();
    });
    await waitFor(() => screen.getByTestId("pwa-install-button"));

    await act(async () => {
      screen.getByTestId("pwa-install-button").click();
      await Promise.resolve();
    });

    expect(evt.prompt).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByTestId("pwa-install-banner")).toBeNull());
    expect(window.localStorage.getItem("bioverse_pwa_installed")).toBe("true");
  });

  it("J: install banner does NOT appear when already running in standalone mode", () => {
    mockMatchMedia(true);
    render(<InstallPrompt />);
    expect(screen.queryByTestId("pwa-install-banner")).toBeNull();
  });

  it("K: appinstalled event clears install UI and persists installed state", async () => {
    render(<InstallPrompt />);
    act(() => fireBeforeInstallPrompt());
    await waitFor(() => screen.getByTestId("pwa-install-banner"));

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    await waitFor(() => expect(screen.queryByTestId("pwa-install-banner")).toBeNull());
    expect(window.localStorage.getItem("bioverse_pwa_installed")).toBe("true");
  });

  it("L: dismissing the prompt hides it and it does not reappear within the cooldown", async () => {
    const first = render(<InstallPrompt />);
    act(() => fireBeforeInstallPrompt());
    await waitFor(() => screen.getByTestId("pwa-install-banner"));

    act(() => {
      screen.getByTestId("pwa-install-dismiss").click();
    });

    await waitFor(() => expect(screen.queryByTestId("pwa-install-banner")).toBeNull());
    expect(window.localStorage.getItem("bioverse_pwa_install_dismissed_at")).toBeTruthy();
    first.unmount();

    // Re-render (simulating navigation) — should stay hidden even if the
    // browser were to re-offer installability within the cooldown window.
    render(<InstallPrompt />);
    act(() => fireBeforeInstallPrompt());
    expect(screen.queryAllByTestId("pwa-install-banner").length).toBe(0);
  });

  it("M: fresh user with no localStorage state sees no banner until browser signals installability", () => {
    render(<InstallPrompt />);
    expect(screen.queryByTestId("pwa-install-banner")).toBeNull();
  });

  it("N: a user marked installed in a prior session does not see the banner again", () => {
    window.localStorage.setItem("bioverse_pwa_installed", "true");
    render(<InstallPrompt />);
    act(() => fireBeforeInstallPrompt());
    expect(screen.queryByTestId("pwa-install-banner")).toBeNull();
  });

  it("iOS/Safari: shows an Add to Home Screen hint instead of a broken install button", () => {
    mockUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15");
    render(<InstallPrompt />);
    expect(screen.getByTestId("pwa-install-banner")).toBeInTheDocument();
    expect(screen.queryByTestId("pwa-install-button")).toBeNull();
    expect(screen.getByText(/Add to Home Screen/i)).toBeInTheDocument();
  });

  it("browsers without beforeinstallprompt/iOS support show no broken install UI", () => {
    // Plain desktop Firefox-style UA, no beforeinstallprompt fired.
    mockUserAgent("Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0");
    render(<InstallPrompt />);
    expect(screen.queryByTestId("pwa-install-banner")).toBeNull();
  });

  it("isStandaloneMode reflects display-mode media query", () => {
    mockMatchMedia(true);
    expect(isStandaloneMode()).toBe(true);
    mockMatchMedia(false);
    expect(isStandaloneMode()).toBe(false);
  });

  it("isIOSNoPromptBrowser detects iPhone/iPad UAs only", () => {
    mockUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)");
    expect(isIOSNoPromptBrowser()).toBe(true);
    mockUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0");
    expect(isIOSNoPromptBrowser()).toBe(false);
  });

  it("O: PWA install state does not leak into unrelated localStorage keys", () => {
    render(<InstallPrompt />);
    act(() => fireBeforeInstallPrompt());
    const keysBefore = Object.keys(window.localStorage);
    act(() => {
      screen.getByTestId("pwa-install-dismiss")?.click();
    });
    const keysAfter = Object.keys(window.localStorage);
    const newKeys = keysAfter.filter((k) => !keysBefore.includes(k));
    expect(newKeys.every((k) => k.startsWith("bioverse_pwa_"))).toBe(true);
  });
});
