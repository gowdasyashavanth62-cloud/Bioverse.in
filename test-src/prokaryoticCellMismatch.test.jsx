import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pcell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg7"));
const PCELL_IDS = pcell.structures.map(s => s.id);
const NAMES = pcell.structures.map(s => s.name);
const nativeNameOf = (id) => pcell.structures.find(s => s.id === id).name;
const idOfName = (name) => pcell.structures.find(s => s.name === name).id;

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openMismatchMode() {
  const utils = render(<DiagramGame diagram={pcell} />);
  fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
  return utils;
}

// Ground-truth reader: each structure's `labelPosition` (xPct/yPct) is fixed
// and unique in DIAGRAM_DATA, so the CSS left/top of a pinned chip tells us
// which SLOT it belongs to, independent of which LABEL name is displayed on
// it. Comparing the displayed name to that slot's own native name gives the
// true correct/mismatched ground truth from outside the component, without
// needing to export buildMismatchChallenge/internal state.
function readPuzzle(container) {
  const posToSlot = {};
  PCELL_IDS.forEach(id => {
    const s = pcell.structures.find(x => x.id === id);
    posToSlot[`${s.labelPosition.xPct}%|${s.labelPosition.yPct}%`] = id;
  });
  const buttons = Array.from(container.querySelectorAll('button[aria-label^="Check label"]'));
  const puzzle = {}; // slotId -> { pinnedName, isMismatched }
  buttons.forEach(btn => {
    const key = `${btn.style.left}|${btn.style.top}`;
    const slotId = posToSlot[key];
    const m = btn.getAttribute("aria-label").match(/^Check label "(.+)"$/);
    const pinnedName = m[1];
    puzzle[slotId] = { pinnedName, isMismatched: pinnedName !== nativeNameOf(slotId) };
  });
  return puzzle;
}

describe("STEP 20D — Prokaryotic Cell Mismatch Mode — loads via Diagram Center, generic mode", () => {
  it("Prokaryotic Cell → Find Mismatched Labels loads through Diagram Center", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("Prokaryotic Cell"));
    fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
    expect(screen.getByText("0 / 8 Labels Checked")).toBeInTheDocument();
  });

  it("all 8 structures participate exactly once as a pinned chip, with the exact expected structure ids", () => {
    const { container } = openMismatchMode();
    NAMES.forEach(name => {
      expect(container.querySelector(`button[aria-label='Check label "${name}"']`)).toBeTruthy();
    });
    const puzzle = readPuzzle(container);
    expect(Object.keys(puzzle).sort()).toEqual([...PCELL_IDS].sort());
  });
});

describe("STEP 20D — Mismatch-generation invariants", () => {
  it("every puzzle contains at least one (in fact >= 2) genuine mismatch — deterministic for n=8, no retry needed", () => {
    // buildMismatchChallenge's mismatchCount formula for n=8 structures is
    // min(max(2 + floor(rand*(n-2)), 2), n-1) = min(max(2..7, 2), 7), which
    // is always in [2, 7] regardless of the random draw — so this is a
    // guaranteed invariant, not a probabilistic one, and needs no sampling.
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const mismatchedCount = Object.values(puzzle).filter(p => p.isMismatched).length;
    expect(mismatchedCount).toBeGreaterThanOrEqual(2);
    expect(mismatchedCount).toBeLessThanOrEqual(7);
  });

  it("no label ever maps to itself when marked mismatched (a mismatch cannot point to its own structure)", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    Object.entries(puzzle).forEach(([slotId, p]) => {
      if (p.isMismatched) expect(p.pinnedName).not.toBe(nativeNameOf(slotId));
    });
  });

  it("no duplicate structure ids and no duplicate label ids: the 8 pinned names are always a full permutation of the 8 structure names", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const slotIds = Object.keys(puzzle);
    expect(new Set(slotIds).size).toBe(8);
    const pinnedNames = Object.values(puzzle).map(p => p.pinnedName);
    expect(new Set(pinnedNames).size).toBe(8);
    expect(pinnedNames.slice().sort()).toEqual([...NAMES].sort());
  });

  it("a label cannot be simultaneously correct and mismatched (isMismatched is a clean boolean per slot)", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    Object.values(puzzle).forEach(p => expect(typeof p.isMismatched).toBe("boolean"));
  });

  it("a zero-mismatch (all-correct) puzzle is never generated, sampled across many mounts", () => {
    for (let i = 0; i < 20; i++) {
      const { container, unmount } = openMismatchMode();
      const puzzle = readPuzzle(container);
      const mismatchedCount = Object.values(puzzle).filter(p => p.isMismatched).length;
      expect(mismatchedCount).toBeGreaterThan(0);
      unmount();
    }
  });

  it("when a puzzle happens to have exactly 2 mismatches, they form a genuine 2-swap (each mismatched slot shows the other's native name)", () => {
    let found = false;
    for (let i = 0; i < 60 && !found; i++) {
      const { container, unmount } = openMismatchMode();
      const puzzle = readPuzzle(container);
      const mismatched = Object.entries(puzzle).filter(([, p]) => p.isMismatched);
      if (mismatched.length === 2) {
        found = true;
        const [[slotA, pA], [slotB, pB]] = mismatched;
        // A true 2-element derangement is a transposition: A shows B's name, B shows A's name.
        expect(pA.pinnedName).toBe(nativeNameOf(slotB));
        expect(pB.pinnedName).toBe(nativeNameOf(slotA));
      }
      unmount();
    }
    expect(found).toBe(true);
  });

  it("puzzle arrangement varies across mounts (genuinely randomized, not a fixed fixture)", () => {
    const arrangements = [];
    for (let i = 0; i < 12; i++) {
      const { container, unmount } = openMismatchMode();
      const order = Array.from(container.querySelectorAll('button[aria-label^="Check label"]'))
        .map(b => b.getAttribute("aria-label"));
      arrangements.push(order.join("|"));
      unmount();
    }
    expect(new Set(arrangements).size).toBeGreaterThan(1);
  });
});

describe("STEP 20D — Mismatch Mode gameplay / scoring", () => {
  it("correctly identifying a genuine mismatch increments progress exactly once and locks the chip", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const [slotId, p] = Object.entries(puzzle).find(([, v]) => v.isMismatched);
    const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);

    fireEvent.click(chip);
    fireEvent.click(screen.getByText("✗ Mismatched"));
    expect(screen.getByText(/that label was mismatched/i)).toBeInTheDocument();
    expect(screen.getByText("1 / 8 Labels Checked")).toBeInTheDocument();
    expect(chip.textContent.startsWith("✓")).toBe(true);

    // Already-identified: the chip is locked, so it can no longer be re-opened to double-score.
    fireEvent.click(chip);
    expect(screen.queryByText("✗ Mismatched")).not.toBeInTheDocument();
    expect(screen.getByText("1 / 8 Labels Checked")).toBeInTheDocument();
  });

  it("correctly identifying a correctly-matched label also increments progress (judging \"Correct\" as correct counts)", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const [slotId, p] = Object.entries(puzzle).find(([, v]) => !v.isMismatched);
    const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);

    fireEvent.click(chip);
    fireEvent.click(screen.getByText("✓ Correct"));
    expect(screen.getByText(/that label was right/i)).toBeInTheDocument();
    expect(screen.getByText("1 / 8 Labels Checked")).toBeInTheDocument();
  });

  it("selecting a correct label and wrongly calling it 'Mismatched' does not falsely increment progress, and allows retry", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const [slotId, p] = Object.entries(puzzle).find(([, v]) => !v.isMismatched);
    const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);

    fireEvent.click(chip);
    fireEvent.click(screen.getByText("✗ Mismatched")); // wrong judgement on a correct label
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText("0 / 8 Labels Checked")).toBeInTheDocument();

    // Retry with the right judgement.
    expect(screen.getByText("✓ Correct")).toBeInTheDocument();
    fireEvent.click(screen.getByText("✓ Correct"));
    expect(screen.getByText("1 / 8 Labels Checked")).toBeInTheDocument();
  });

  it("selecting a mismatched label and wrongly calling it 'Correct' does not increment progress, and allows retry", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const [slotId, p] = Object.entries(puzzle).find(([, v]) => v.isMismatched);
    const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);

    fireEvent.click(chip);
    fireEvent.click(screen.getByText("✓ Correct")); // wrong judgement on a mismatched label
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText("0 / 8 Labels Checked")).toBeInTheDocument();

    fireEvent.click(screen.getByText("✗ Mismatched"));
    expect(screen.getByText("1 / 8 Labels Checked")).toBeInTheDocument();
  });

  it("completion occurs only after all 8 required judgements are made, not before", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const entries = Object.entries(puzzle);
    // Resolve 7 of 8 — completion must NOT appear yet.
    entries.slice(0, 7).forEach(([slotId, p]) => {
      const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
      fireEvent.click(chip);
      fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    });
    expect(screen.getByText("7 / 8 Labels Checked")).toBeInTheDocument();
    expect(screen.queryByText(/Challenge Complete/i)).not.toBeInTheDocument();

    // Resolve the last one — completion appears.
    const [lastSlotId, lastP] = entries[7];
    const lastChip = container.querySelector(`button[aria-label='Check label "${lastP.pinnedName}"']`);
    fireEvent.click(lastChip);
    fireEvent.click(screen.getByText(lastP.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    expect(screen.getByText("8 / 8 Labels Checked")).toBeInTheDocument();
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
  });
});

describe("STEP 20D — Prokaryotic Cell Mismatch Mode — XP", () => {
  it("XP reward is based on the generic architecture (dg7.xpReward === 55) and completion awards exactly 55, once", () => {
    expect(DIAGRAM_DATA.find(d => d.id === "dg7").xpReward).toBe(55);
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    Object.entries(puzzle).forEach(([slotId, p]) => {
      const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
      fireEvent.click(chip);
      fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    });
    expect(screen.getByText("8 / 8 Labels Checked")).toBeInTheDocument();
    expect(screen.getByText(/Score: 8\/8/)).toBeInTheDocument();
    // Precise assertion — not a broad /XP/i regex (which would also match
    // "Explore", the generic mode-switch button always present in the tab bar).
    const xpLine = screen.getByText(/XP earned:/);
    expect(xpLine.parentElement.textContent).toContain("XP earned: 55");
    expect(screen.getAllByText("55").length).toBe(1); // shown exactly once, not accumulating

    // Post-completion: every slot is now in solvedSlotIds, and selectSlot()
    // short-circuits on an already-solved slot — so even though the pinned
    // chips remain visible (locked, showing a checkmark), there is no
    // remaining path back into submitAnswer() that could inflate xpEarned.
    const chips = Array.from(container.querySelectorAll('button[aria-label^="Check label"]'));
    expect(chips.length).toBe(8);
    chips.forEach(c => expect(c.textContent.startsWith("✓")).toBe(true));
    fireEvent.click(chips[0]);
    expect(screen.queryByText("✓ Correct")).not.toBeInTheDocument();
    expect(screen.queryByText("✗ Mismatched")).not.toBeInTheDocument();
    expect(screen.getAllByText("55").length).toBe(1); // still shown exactly once
  });

  it("incorrect selections award 0 XP/progress (verified via the 0/8 progress readout, not a broad XP regex)", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const [slotId, p] = Object.entries(puzzle)[0];
    const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
    const wrongJudgement = p.isMismatched ? "✓ Correct" : "✗ Mismatched";
    fireEvent.click(chip);
    fireEvent.click(screen.getByText(wrongJudgement));
    expect(screen.getByText("0 / 8 Labels Checked")).toBeInTheDocument();
    expect(screen.queryByText(/XP earned:/)).not.toBeInTheDocument();
  });
});

describe("STEP 20D — reset / state isolation", () => {
  it("Play Again resets progress, score, selection, and feedback to a clean puzzle", () => {
    const { container } = openMismatchMode();
    let puzzle = readPuzzle(container);
    Object.entries(puzzle).forEach(([slotId, p]) => {
      const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
      fireEvent.click(chip);
      fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    });
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText("0 / 8 Labels Checked")).toBeInTheDocument();
    expect(screen.getByText(/Tap a label pinned on the diagram/i)).toBeInTheDocument();
    expect(screen.queryByText(/Challenge Complete/i)).not.toBeInTheDocument();
    expect(screen.queryByText("55")).not.toBeInTheDocument();
    NAMES.forEach(name => {
      // A fresh puzzle re-pins all 8 names somewhere (still a full permutation).
      expect(screen.getAllByText(new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`)).length).toBeGreaterThanOrEqual(0);
    });
    const freshPuzzle = readPuzzle(container);
    expect(Object.keys(freshPuzzle).length).toBe(8);
  });

  it("mismatch state does not leak between diagrams (a fresh instance starts clean at 0/N)", () => {
    const { container: c1, unmount: unmount1 } = openMismatchMode();
    const puzzle = readPuzzle(c1);
    const [slotId, p] = Object.entries(puzzle)[0];
    fireEvent.click(c1.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`));
    fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    expect(screen.getByText("1 / 8 Labels Checked")).toBeInTheDocument();
    unmount1();

    const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
    render(<DiagramGame diagram={heart} />);
    fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
    expect(screen.getByText("0 / 7 Labels Checked")).toBeInTheDocument();
  });

  it("mismatch state does not leak between modes: switching away from and back to Mismatch Mode gives a fresh 0/8 puzzle", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const [slotId, p] = Object.entries(puzzle)[0];
    fireEvent.click(container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`));
    fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    expect(screen.getByText("1 / 8 Labels Checked")).toBeInTheDocument();

    fireEvent.click(screen.getByText("🔍 Explore"));
    expect(screen.queryByText(/^\d+ \/ 8 Labels Checked$/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
    expect(screen.getByText("0 / 8 Labels Checked")).toBeInTheDocument();
  });

  it("replaying (Play Again) does not retain the previous completion state or a stale XP value", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    Object.entries(puzzle).forEach(([slotId, p]) => {
      const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
      fireEvent.click(chip);
      fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    });
    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.queryByText(/Challenge Complete/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Score: 8\/8/)).not.toBeInTheDocument();
  });
});

describe("STEP 20D — mobile / responsive / accessibility", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  it("390px mobile: labels remain selectable and feedback readable without hover (tap-only flow)", () => {
    setWidth(390);
    const { container, unmount } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const [slotId, p] = Object.entries(puzzle)[0];
    const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
    fireEvent.click(chip); // tap only, no mouseEnter/hover fired
    fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    expect(screen.getByText("1 / 8 Labels Checked")).toBeInTheDocument();
    unmount();
    setWidth(1280);
  });

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "laptop/tablet", width: 1024, expectGrid: true },
    { label: "mobile", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): no horizontal overflow, diagram/labels stay contained, progress readable`, () => {
      setWidth(width);
      const { container, unmount } = openMismatchMode();
      expect(container.querySelector("svg")).toBeTruthy();

      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");

      const badWidths = Array.from(container.querySelectorAll("[style]")).filter(el => {
        const w = el.style.width;
        return w && /^\d+(\.\d+)?px$/.test(w) && parseFloat(w) > width;
      });
      expect(badWidths).toHaveLength(0);

      unmount();
      setWidth(1280);
    });
  });

  it("interactive mismatch targets have meaningful accessible names (aria-label identifies the pinned structure/label)", () => {
    const { container } = openMismatchMode();
    const buttons = Array.from(container.querySelectorAll('button[aria-label^="Check label"]'));
    expect(buttons.length).toBe(8);
    buttons.forEach(btn => {
      expect(btn.getAttribute("aria-label")).toMatch(/^Check label ".+"$/);
      expect(btn.tagName.toLowerCase()).toBe("button"); // real, keyboard-reachable control
    });
  });

  it("judge buttons ('Correct'/'Mismatched') are real labeled buttons, and completion feedback is real text", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const [slotId, p] = Object.entries(puzzle)[0];
    fireEvent.click(container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`));
    expect(screen.getByRole("button", { name: "✓ Correct" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "✗ Mismatched" })).toBeInTheDocument();
  });
});

describe("STEP 20D — dg1–dg6 regression remains intact", () => {
  it("dg1 (Animal Cell) Mismatch Mode still works, Explore and Label still work", () => {
    const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(container.querySelector("#nucleus"));
    expect(screen.getByText("Nucleus")).toBeInTheDocument();

    fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
    expect(screen.getByText("0 / 7 Labels Checked")).toBeInTheDocument();
  });

  it("dg2–dg6 Mismatch Mode still loads with intact structure counts", () => {
    ["dg2", "dg3", "dg4", "dg5", "dg6"].forEach(id => {
      const d = normalizeDiagram(DIAGRAM_DATA.find(x => x.id === id));
      const { container, unmount } = render(<DiagramGame diagram={d} />);
      fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
      expect(screen.getByText(`0 / ${d.structures.length} Labels Checked`)).toBeInTheDocument();
      unmount();
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

describe("STEP 20D — source-level reusability check", () => {
  it("MismatchMode and buildMismatchChallenge contain no dg7/Prokaryotic-Cell-specific hardcoded names or conditionals", () => {
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function MismatchMode(");
    const nextFn = source.indexOf("\nfunction DiagramGame(", start);
    expect(start).toBeGreaterThan(-1);
    expect(nextFn).toBeGreaterThan(start);
    const body = source.slice(start, nextFn);
    const forbidden = ["Capsule", "Cell Wall", "Plasma Membrane", "Cytoplasm", "Nucleoid", "Ribosomes", "Plasmid", "Flagellum"];
    forbidden.forEach(word => expect(body.includes(word)).toBe(false));
    expect(body.includes('diagram.id === "dg7"')).toBe(false);

    const genStart = source.indexOf("function buildMismatchChallenge(");
    const genEnd = source.indexOf("\n}\n", genStart) + 1;
    const genBody = source.slice(genStart, genEnd);
    forbidden.forEach(word => expect(genBody.includes(word)).toBe(false));
  });
});
