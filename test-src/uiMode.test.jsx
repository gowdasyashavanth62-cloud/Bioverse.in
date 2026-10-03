import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, renderHook, act } from "@testing-library/react";
import { ProfileView, useUiMode, UI_MODES, UI_MODE_STORAGE_KEY } from "./AppUnderTest.jsx";

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  try { window.localStorage.clear(); } catch {}
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

describe("useUiMode -- state + persistence", () => {
  it("defaults to BioVision on first launch (no saved preference)", () => {
    const { result } = renderHook(() => useUiMode());
    expect(result.current[0]).toBe(UI_MODES.BIOVISION);
    expect(result.current[0]).toBe("biovision");
  });

  it("reads an existing valid 'current' preference from localStorage on mount", () => {
    window.localStorage.setItem(UI_MODE_STORAGE_KEY, "current");
    const { result } = renderHook(() => useUiMode());
    expect(result.current[0]).toBe(UI_MODES.CURRENT);
  });

  it("reads an existing valid 'biovision' preference from localStorage on mount", () => {
    window.localStorage.setItem(UI_MODE_STORAGE_KEY, "biovision");
    const { result } = renderHook(() => useUiMode());
    expect(result.current[0]).toBe(UI_MODES.BIOVISION);
  });

  it("an invalid/corrupted stored value falls back safely to BioVision", () => {
    window.localStorage.setItem(UI_MODE_STORAGE_KEY, "some-garbage-value");
    const { result } = renderHook(() => useUiMode());
    expect(result.current[0]).toBe(UI_MODES.BIOVISION);
  });

  it("an empty-string stored value falls back safely to BioVision", () => {
    window.localStorage.setItem(UI_MODE_STORAGE_KEY, "");
    const { result } = renderHook(() => useUiMode());
    expect(result.current[0]).toBe(UI_MODES.BIOVISION);
  });

  it("switching to Current persists to localStorage under the namespaced key", () => {
    const { result } = renderHook(() => useUiMode());
    act(() => result.current[1](UI_MODES.CURRENT));
    expect(result.current[0]).toBe(UI_MODES.CURRENT);
    expect(window.localStorage.getItem(UI_MODE_STORAGE_KEY)).toBe("current");
  });

  it("a fresh hook instance (simulating reopening the app) still reads back 'current' after the app was closed", () => {
    const first = renderHook(() => useUiMode());
    act(() => first.result.current[1](UI_MODES.CURRENT));
    first.unmount();

    const second = renderHook(() => useUiMode());
    expect(second.result.current[0]).toBe(UI_MODES.CURRENT);
  });

  it("switching back to BioVision persists correctly too", () => {
    window.localStorage.setItem(UI_MODE_STORAGE_KEY, "current");
    const { result } = renderHook(() => useUiMode());
    expect(result.current[0]).toBe(UI_MODES.CURRENT);
    act(() => result.current[1](UI_MODES.BIOVISION));
    expect(result.current[0]).toBe(UI_MODES.BIOVISION);
    expect(window.localStorage.getItem(UI_MODE_STORAGE_KEY)).toBe("biovision");
  });

  it("calling setUiMode with a garbage value never persists it -- it safely coerces to BioVision", () => {
    const { result } = renderHook(() => useUiMode());
    act(() => result.current[1]("nonsense"));
    expect(result.current[0]).toBe(UI_MODES.BIOVISION);
    expect(window.localStorage.getItem(UI_MODE_STORAGE_KEY)).toBe("biovision");
  });
});

describe("ProfileView -- Appearance / Interface Style selector", () => {
  const noop = () => {};

  it("renders an Appearance section with both Interface Style options", () => {
    render(<ProfileView user={{}} uiMode="biovision" onUiModeChange={noop} />);
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByText("Interface Style")).toBeInTheDocument();
    expect(screen.getByText("BioVision-style UI")).toBeInTheDocument();
    expect(screen.getByText("Current BioVerse UI")).toBeInTheDocument();
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("shows BioVision as selected when uiMode is 'biovision'", () => {
    render(<ProfileView user={{}} uiMode="biovision" onUiModeChange={noop} />);
    const bioBtn = screen.getByRole("button", { name: /BioVision-style UI/ });
    const curBtn = screen.getByRole("button", { name: /Current BioVerse UI/ });
    expect(bioBtn).toHaveAttribute("aria-pressed", "true");
    expect(curBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("shows Current as selected when uiMode is 'current'", () => {
    render(<ProfileView user={{}} uiMode="current" onUiModeChange={noop} />);
    const bioBtn = screen.getByRole("button", { name: /BioVision-style UI/ });
    const curBtn = screen.getByRole("button", { name: /Current BioVerse UI/ });
    expect(bioBtn).toHaveAttribute("aria-pressed", "false");
    expect(curBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("treats a missing/undefined uiMode prop as BioVision selected (safe default in the view itself)", () => {
    render(<ProfileView user={{}} onUiModeChange={noop} />);
    const bioBtn = screen.getByRole("button", { name: /BioVision-style UI/ });
    expect(bioBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking 'Current BioVerse UI' calls onUiModeChange with 'current'", () => {
    const onChange = vi.fn();
    render(<ProfileView user={{}} uiMode="biovision" onUiModeChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Current BioVerse UI/ }));
    expect(onChange).toHaveBeenCalledWith("current");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("clicking 'BioVision-style UI' calls onUiModeChange with 'biovision'", () => {
    const onChange = vi.fn();
    render(<ProfileView user={{}} uiMode="current" onUiModeChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /BioVision-style UI/ }));
    expect(onChange).toHaveBeenCalledWith("biovision");
  });

  it("does not crash or throw when onUiModeChange is not provided", () => {
    render(<ProfileView user={{}} uiMode="biovision" />);
    expect(() => fireEvent.click(screen.getByRole("button", { name: /Current BioVerse UI/ }))).not.toThrow();
  });

  it("the selector uses real, keyboard-reachable <button> elements, not clickable divs", () => {
    render(<ProfileView user={{}} uiMode="biovision" onUiModeChange={noop} />);
    expect(screen.getByRole("button", { name: /BioVision-style UI/ }).tagName.toLowerCase()).toBe("button");
    expect(screen.getByRole("button", { name: /Current BioVerse UI/ }).tagName.toLowerCase()).toBe("button");
  });

  it("selection state is exposed via a real 'aria-pressed' attribute and visible text, not color alone", () => {
    render(<ProfileView user={{}} uiMode="biovision" onUiModeChange={noop} />);
    const bioBtn = screen.getByRole("button", { name: /BioVision-style UI/ });
    expect(bioBtn).toHaveAttribute("aria-pressed", "true");
    expect(bioBtn.textContent).toContain("✓ Selected");
  });

  it("is clearly distinct from any light/dark/theme-color setting: no such controls are introduced alongside it", () => {
    const { container } = render(<ProfileView user={{}} uiMode="biovision" onUiModeChange={noop} />);
    expect(screen.queryByText(/dark mode/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/light mode/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/theme colour/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/theme color/i)).not.toBeInTheDocument();
  });

  it("does not otherwise change ProfileView's existing behavior (Personal Information section still renders)", () => {
    render(<ProfileView user={{ full_name: "Test Student" }} uiMode="biovision" onUiModeChange={noop} />);
    expect(screen.getByText("Personal Information")).toBeInTheDocument();
    expect(screen.getByText("Edit Profile")).toBeInTheDocument();
  });
});

describe("Engine purity -- UI mode is presentation-only", () => {
  it("useUiMode never touches Supabase (no sb.* calls in its body)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function useUiMode(");
    const end = source.indexOf("\n}\n", start) + 1;
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);
    expect(body.includes("sb.")).toBe(false);
    expect(body.includes("supabase")).toBe(false);
  });
});
