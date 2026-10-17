import React, { useState } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup, act, screen } from "@testing-library/react";
import { BackNav, useBackLayer, useAppBackSync, bnMakeSnap, Modal, Confirm, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const settle = (ms = 40) => act(async () => { await new Promise(r => setTimeout(r, ms)); });
const goBack = async () => { act(() => { window.history.back(); }); await settle(); };
const goForward = async () => { act(() => { window.history.forward(); }); await settle(); };
const click = async (el) => { fireEvent.click(el); await settle(); };

let loggedIn = true;
function Harness({ withModal = true }) {
  const [page, setPage] = useState("dashboard");
  const [chapter, setChapter] = useState(null);
  const [open, setOpen] = useState(false);
  useAppBackSync(bnMakeSnap("dashboard", page, chapter, "1st PU"), (s) => {
    if (!s || s.screen !== "dashboard" || !loggedIn) return false;
    setPage(s.page); setChapter(s.chapter || null); return true;
  });
  useBackLayer(open, () => setOpen(false));
  return (
    <div>
      <div data-testid="state">{page}|{chapter ? chapter.id : "-"}|{open ? "open" : "closed"}</div>
      <button onClick={() => setPage("dashboard")}>go-dashboard</button>
      <button onClick={() => setPage("notes")}>go-notes</button>
      <button onClick={() => { setPage("syllabus"); setChapter(null); }}>go-syllabus</button>
      <button onClick={() => setChapter({ id: "c1", chapter_name: "Cell" })}>open-chapter</button>
      <button onClick={() => setChapter(null)}>chapter-back-button</button>
      <button onClick={() => setOpen(true)}>open-drawer</button>
      <button onClick={() => setOpen(false)}>close-drawer</button>
    </div>
  );
}
const st = () => screen.getByTestId("state").textContent;
const btn = (n) => screen.getByText(n);

beforeEach(() => { loggedIn = true; BackNav.reset(); BackNav.exitWindowMs = 120; });
afterEach(() => { cleanup(); document.querySelectorAll("[data-testid='bv-exit-hint']").forEach(e => e.remove()); });

async function mountReady() { render(<Harness />); await settle(); }

describe("Back navigation -- nested screens", () => {
  it("steps back through nested screens in order, then stops at the root", async () => {
    await mountReady();
    expect(st()).toBe("dashboard|-|closed");
    await click(btn("go-notes"));
    await click(btn("go-syllabus"));
    await click(btn("open-chapter"));
    expect(st()).toBe("syllabus|c1|closed");
    await goBack(); expect(st()).toBe("syllabus|-|closed");
    await goBack(); expect(st()).toBe("notes|-|closed");
    await goBack(); expect(st()).toBe("dashboard|-|closed");
    expect(BackNav.idx).toBe(1);
  });

  it("Forward re-applies the screen that Back left", async () => {
    await mountReady();
    await click(btn("go-notes"));
    await goBack(); expect(st()).toBe("dashboard|-|closed");
    await goForward(); expect(st()).toBe("notes|-|closed");
  });
});

describe("Back navigation -- overlays", () => {
  it("Back closes an open overlay first and keeps the parent screen", async () => {
    await mountReady();
    await click(btn("go-notes"));
    await click(btn("open-drawer"));
    expect(st()).toBe("notes|-|open");
    await goBack(); expect(st()).toBe("notes|-|closed");
    await goBack(); expect(st()).toBe("dashboard|-|closed");
  });

  it("closing an overlay with its own button removes its history entry (no stale entry)", async () => {
    await mountReady();
    await click(btn("go-notes"));
    const idxBefore = BackNav.idx;
    await click(btn("open-drawer"));
    expect(BackNav.idx).toBe(idxBefore + 1);
    await click(btn("close-drawer"));
    expect(BackNav.idx).toBe(idxBefore);
    await goBack(); expect(st()).toBe("dashboard|-|closed");   // one Back, not two
  });

  it("navigating while an overlay is open never leaves Back stuck on the closed overlay", async () => {
    await mountReady();
    await click(btn("open-drawer"));
    await click(btn("go-notes"));
    await click(btn("close-drawer"));
    expect(st()).toBe("notes|-|closed");
    await goBack(); expect(st()).toBe("dashboard|-|closed");
  });

  it("Modal and Confirm components close via Back", async () => {
    const onClose = vi.fn(), onCancel = vi.fn();
    function M() { const [m, setM] = useState(false); const [c, setC] = useState(false);
      useAppBackSync(bnMakeSnap("dashboard", "x", null, ""), () => true);
      return <div><button onClick={() => setM(true)}>open-modal</button>{m && <Modal title="T" onClose={() => { onClose(); setM(false); setC(true); }}>body</Modal>}{c && <Confirm message="sure" onConfirm={() => {}} onCancel={() => { onCancel(); setC(false); }} />}</div>; }
    render(<M />); await settle();
    await click(screen.getByText("open-modal"));
    expect(screen.getByText("body")).toBeTruthy();
    await goBack(); expect(onClose).toHaveBeenCalledTimes(1); expect(screen.queryByText("body")).toBeNull();
    expect(screen.getByText("sure")).toBeTruthy();
    await goBack(); expect(onCancel).toHaveBeenCalledTimes(1); expect(screen.queryByText("sure")).toBeNull();
  });

  it("an overlay opened while sitting on the root sentinel does not make Back show the exit hint", async () => {
    await mountReady();
    await goBack();                                       // at root, hint shown
    await click(btn("open-drawer"));
    await goBack(); expect(st()).toBe("dashboard|-|closed");
    expect(BackNav.idx).toBe(1);
  });

  it("DiagramCenter: Back leaves an opened diagram and returns to the list", async () => {
    function W() { useAppBackSync(bnMakeSnap("dashboard", "diagrams", null, ""), () => true); return <DiagramCenter />; }
    const title = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg13")).title;
    render(<W />); await settle();
    await click(screen.getByText(title));
    expect(screen.queryByText(/Back/)).toBeTruthy();
    await goBack();
    expect(screen.getByText(title)).toBeTruthy();                  // list shown again
    expect(screen.queryByText("Study Mode")).toBeNull();           // game view gone
  });
});

describe("Back navigation -- history loops and duplicates", () => {
  it("toggling between two screens does not grow history", async () => {
    await mountReady();
    for (let i = 0; i < 5; i++) { await click(btn("go-notes")); await click(btn("go-dashboard")); }
    expect(BackNav.idx).toBeLessThanOrEqual(1);
  });

  it("an in-app back button pops history instead of pushing, so system Back does not return to the closed screen", async () => {
    await mountReady();
    await click(btn("go-syllabus"));
    await click(btn("open-chapter"));
    const idx = BackNav.idx;
    await click(btn("chapter-back-button"));
    expect(st()).toBe("syllabus|-|closed");
    expect(BackNav.idx).toBe(idx - 1);
    await goBack(); expect(st()).toBe("dashboard|-|closed");   // not the chapter again
  });

  it("selecting the current screen again adds nothing", async () => {
    await mountReady();
    await click(btn("go-notes")); const idx = BackNav.idx;
    await click(btn("go-notes"));
    expect(BackNav.idx).toBe(idx);
  });

  it("skips entries that are not valid any more (e.g. signed-out screens) while stepping back", async () => {
    await mountReady();
    await click(btn("go-notes")); await click(btn("go-syllabus"));
    loggedIn = false;                                     // every dashboard entry now rejected
    BackNav.exitWindowMs = 1500;
    await goBack(); await settle(100);
    expect(BackNav.idx).toBe(0);                          // walked down to the root sentinel, no loop
  });
});

describe("Back navigation -- root screen", () => {
  it("Back at the root shows an exit hint and stays on the screen; the guard re-arms afterwards", async () => {
    await mountReady();
    await goBack();
    expect(BackNav.idx).toBe(0);
    expect(st()).toBe("dashboard|-|closed");
    expect(document.querySelector("[data-testid='bv-exit-hint']")).toBeTruthy();
    await settle(220);                                    // exit window elapsed
    expect(BackNav.idx).toBe(1);                          // guard entry restored: next Back is guarded again
    expect(document.querySelector("[data-testid='bv-exit-hint']")).toBeNull();
  });

  it("navigating after the hint keeps working", async () => {
    await mountReady();
    await goBack();
    await click(btn("go-notes"));
    expect(BackNav.idx).toBe(2);                          // dashboard entry restored above the root, then notes
    await goBack(); expect(st()).toBe("dashboard|-|closed");
  });
});

describe("Back navigation -- refresh / direct open", () => {
  it("a refresh keeps the current entry and does not add duplicates; unknown lower entries still work", async () => {
    await mountReady();
    await click(btn("go-notes"));
    const saved = window.history.state, idxBefore = BackNav.idx;
    cleanup();
    BackNav.ready = false; BackNav.entries = []; BackNav.idx = 0; BackNav.pending = true;   // fresh page load, history kept
    expect(saved.bv).toBe(1);
    render(<Harness />); await settle();
    expect(BackNav.idx).toBe(idxBefore);
    expect(window.history.state.idx).toBe(idxBefore);
  });

  it("a fresh open (no history state) creates only the root sentinel and one app entry", async () => {
    await mountReady();
    expect(BackNav.idx).toBe(1);
    expect(window.history.state.idx).toBe(1);
    expect(BackNav.entries[0].t).toBe("root");
  });

  it("ignores popstate for entries that are not BioVerse's (leaving the app is left to the browser)", async () => {
    await mountReady();
    act(() => { window.dispatchEvent(new PopStateEvent("popstate", { state: null })); });
    expect(st()).toBe("dashboard|-|closed");
    expect(BackNav.idx).toBe(1);
  });
});

describe("Back navigation -- listener hygiene", () => {
  it("removes its popstate listener on unmount", async () => {
    const add = vi.spyOn(window, "addEventListener"), rem = vi.spyOn(window, "removeEventListener");
    await mountReady(); cleanup();
    const added = add.mock.calls.filter(c => c[0] === "popstate").length;
    const removed = rem.mock.calls.filter(c => c[0] === "popstate").length;
    expect(added).toBeGreaterThan(0); expect(removed).toBe(added);
    add.mockRestore(); rem.mockRestore();
  });

  it("does not intercept keyboard events", async () => {
    await mountReady();
    const ev = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
    window.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });
});
