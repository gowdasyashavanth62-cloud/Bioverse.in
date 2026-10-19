import React, { useState, useRef } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup, act, screen } from "@testing-library/react";
import App, { BackNav, useBackLayer, useAppBackSync, bnMakeSnap, bnNewSid, bnReadSid, sb } from "./AppUnderTest.jsx";

const settle = (ms = 60) => act(async () => { await new Promise(r => setTimeout(r, ms)); });
const goBack = async () => { act(() => { window.history.back(); }); await settle(); };
const click = async (el) => { fireEvent.click(el); await settle(); };
const hint = () => document.querySelector("[data-testid='bv-exit-hint']");

beforeEach(() => {
  BackNav.reset(); BackNav.exitWindowMs = 5000;
  try { window.sessionStorage.clear(); window.localStorage.clear(); } catch {}
  sb._session = null;
});
afterEach(() => { cleanup(); hint() && hint().remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

// ── Harness-level: session isolation + root multi-jump (same hooks the App uses) ──
function Harness() {
  const [page, setPage] = useState("dashboard");
  const [sid, setSid] = useState(() => bnReadSid());
  const sidRef = useRef(sid); sidRef.current = sid;
  useAppBackSync(bnMakeSnap("dashboard", page, null, "", sid), (s) => {
    if (!s || (s.sid || "") !== sidRef.current) return false;
    setPage(s.page); return true;
  });
  return (
    <div>
      <div data-testid="st">{page}</div>
      <button onClick={() => setPage("notes")}>go-notes</button>
      <button onClick={() => setPage("tests")}>go-tests</button>
      <button onClick={() => { setSid(bnNewSid()); setPage("dashboard"); }}>new-session</button>
    </div>
  );
}
const st = () => screen.getByTestId("st").textContent;

describe("history isolation between sign-in sessions", () => {
  it("Back never restores screens from a previous session", async () => {
    render(<Harness />); await settle();
    await click(screen.getByText("go-notes"));
    await click(screen.getByText("go-tests"));
    await click(screen.getByText("new-session"));          // logout/login: new session id
    expect(st()).toBe("dashboard");
    await goBack();                                         // old entries (tests, notes, dashboard) all rejected
    expect(BackNav.idx).toBe(0);
    expect(st()).toBe("dashboard");                         // not "tests" / "notes"
    expect(hint()).toBeTruthy();
  });

  it("within one session Back still works normally", async () => {
    render(<Harness />); await settle();
    await click(screen.getByText("go-notes"));
    await goBack(); expect(st()).toBe("dashboard");
  });

  it("a refresh keeps the session id, so the current session's entries stay valid", async () => {
    const a = bnReadSid(); expect(bnReadSid()).toBe(a);
    const b = bnNewSid(); expect(b).not.toBe(a); expect(bnReadSid()).toBe(b);
  });
});

describe("root jump handling", () => {
  it("a multi-entry jump to the root shows the app's first screen instead of the exit hint", async () => {
    render(<Harness />); await settle();
    await click(screen.getByText("go-notes"));
    await click(screen.getByText("go-tests"));
    expect(BackNav.idx).toBe(3);
    act(() => { window.history.go(-3); }); await settle(80);   // history-menu style jump to the very first entry
    expect(st()).toBe("dashboard");
    expect(hint()).toBeNull();
    expect(BackNav.idx).toBe(1);
    await goBack();                                           // now a normal root Back
    expect(hint()).toBeTruthy(); expect(BackNav.idx).toBe(0);
  });
});

// ── App-level (real App component, mocked network) ──
function mockNetwork() {
  vi.stubGlobal("fetch", vi.fn(async (url) => ({
    ok: true, status: 200,
    json: async () => (String(url).includes("/auth/v1/token") ? { access_token: "tok", user: { id: "u1", email: "x@y.z" } } : []),
    blob: async () => new Blob([]),
  })));
}
const type = (ph, v) => fireEvent.change(screen.getByPlaceholderText(ph), { target: { value: v } });

async function studentLogin(role = "student") {
  vi.spyOn(sb, "getProfile").mockResolvedValue({ id: "u1", role, full_name: "Test User", email: "x@y.z", xp: 0, streak: 0, subscription_plan: "free" });
  await click(screen.getByLabelText("Continue as Student"));
  type("you@email.com", "x@y.z"); type("••••••••", "secret1");
  await click(screen.getByText("Login to BioVerse"));
  await settle(150);
}

describe("App-level Back behaviour (real App, mocked network)", () => {
  it("admin signed in through the student login: Back leaves admin for role selection, not an empty student shell", async () => {
    mockNetwork();
    render(<App />); await settle(100);
    await studentLogin("admin");
    expect(screen.getByText("Login to Admin Panel")).toBeTruthy();     // admin panel (its own login gate) is showing
    await goBack();
    expect(screen.getByText("Welcome to BioVerse")).toBeTruthy();      // role selection
    expect(screen.queryByText("Login to Admin Panel")).toBeNull();
  });

  it("log out then log in again: Back does not land on the earlier session's entries", async () => {
    mockNetwork();
    window.localStorage.setItem("bioverse-ui-mode", "current");   // the classic shell has the Logout button
    render(<App />); await settle(100);
    await studentLogin();
    expect(screen.queryByText("Welcome to BioVerse")).toBeNull();
    await click(screen.getAllByText(/Logout/)[0]);
    expect(screen.getByText("Welcome to BioVerse")).toBeTruthy();
    await studentLogin();
    expect(screen.queryByText("Welcome to BioVerse")).toBeNull();
    await goBack(); await settle(100);
    expect(BackNav.idx).toBe(0);                                      // walked to the root; no old-session entry accepted
    expect(hint()).toBeTruthy();
    expect(screen.queryByText("Welcome to BioVerse")).toBeNull();     // still logged in, not bounced to role selection
  });

  it("admin mobile drawer: Back closes the drawer first and stays in the admin panel", async () => {
    Object.defineProperty(window, "innerWidth", { value: 500, configurable: true, writable: true });
    mockNetwork();
    vi.spyOn(sb, "getProfile").mockResolvedValue({ id: "u1", role: "admin", full_name: "Admin One", email: "a@b.c" });
    render(<App />); await settle(100);
    await click(screen.getByLabelText("Continue as Super Admin"));
    type("admin@bioverse.in", "x@y.z"); type("••••••••", "secret1");
    await click(screen.getByText("Login to Admin Panel"));
    await settle(150);
    const alive = () => BackNav.entries.filter(e => e.t === "layer" && e.alive).length;
    expect(screen.getByText("BioVerse Admin Panel")).toBeTruthy();
    expect(alive()).toBe(1);                                          // admin layer only
    await click(screen.getByText("☰"));
    expect(alive()).toBe(2);                                          // + drawer layer, above it
    await goBack();
    expect(alive()).toBe(1);                                          // drawer closed
    expect(screen.getByText("BioVerse Admin Panel")).toBeTruthy();    // still in admin
    await goBack();
    expect(screen.getByText("Welcome to BioVerse")).toBeTruthy();     // then out of admin
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true, writable: true });
  });
});
