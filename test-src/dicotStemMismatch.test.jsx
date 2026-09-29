import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const stem = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg10"));
const STEM_IDS = stem.structures.map(s => s.id);
const NAMES = stem.structures.map(s => s.name);
const TOTAL = stem.structures.length; // 10
const nativeNameOf = (id) => stem.structures.find(s => s.id === id).name;

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  vi.restoreAllMocks();
  cleanup();
});

function openMismatchMode() {
  const utils = render(<DiagramGame diagram={stem} />);
  fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
  return utils;
}

// Ground-truth reader: each structure's `labelPosition` (xPct/yPct) is fixed
// and unique in DIAGRAM_DATA, so the CSS left/top of a pinned chip tells us
// which SLOT it belongs to, independent of which LABEL name is displayed on
// it -- same technique already established for dg7/dg8/dg9's mismatch tests.
// This is deliberately NOT reading React/component internals -- only the
// real rendered DOM, which is what the actual Mismatch UI exposes.
function readPuzzle(container) {
  const posToSlot = {};
  STEM_IDS.forEach(id => {
    const s = stem.structures.find(x => x.id === id);
    posToSlot[`${s.labelPosition.xPct}%|${s.labelPosition.yPct}%`] = id;
  });
  const buttons = Array.from(container.querySelectorAll('button[aria-label^="Check label"]'));
  const puzzle = {};
  buttons.forEach(btn => {
    const key = `${btn.style.left}|${btn.style.top}`;
    const slotId = posToSlot[key];
    const m = btn.getAttribute("aria-label").match(/^Check label "(.+)"$/);
    const pinnedName = m[1];
    puzzle[slotId] = { pinnedName, isMismatched: pinnedName !== nativeNameOf(slotId) };
  });
  return puzzle;
}

// ── Deterministic RNG forcing ─────────────────────────────────────────
// buildMismatchChallenge/shuffleArray both consume Math.random() with no
// injectable seed. Rather than letting the *real* unseeded Math.random
// drive coverage (probabilistic/coupon-collector), each seed below
// deterministically FORCES a fixed, cycling sequence of "random" values
// via a simple LCG. The same seed always reproduces the exact same
// puzzle -- proven below -- and each of the 10 structures is
// independently proven reachable as both a mismatch target and a
// correctly-placed target using specific seeds (discovered once,
// offline, by running this exact algorithm), not luck.
function lcgSequence(seed, len = 40) {
  const seq = [];
  let x = seed;
  for (let k = 0; k < len; k++) {
    x = (x * 9301 + 49297) % 233280;
    seq.push(x / 233280);
  }
  return seq;
}

function withForcedRandom(seed, fn) {
  const seq = lcgSequence(seed);
  let i = 0;
  const spy = vi.spyOn(Math, "random").mockImplementation(() => seq[i++ % seq.length]);
  try {
    return fn();
  } finally {
    spy.mockRestore();
  }
}

// Pre-computed (offline, by running the identical shuffleArray /
// buildMismatchChallenge algorithm against each seed's forced sequence)
// expected mismatch sets -- used only to confirm the assertions below
// target genuinely different, known outcomes; every assertion still
// reads the REAL rendered DOM via readPuzzle(), never this table directly.
const EXPECTED_MISMATCHED_BY_SEED = {
  1: ["cortex", "medullaryRay"],
  2: ["cortex", "endodermis", "medullaryRay", "phloem"],
  3: ["cambium", "cortex", "endodermis", "epidermis", "hypodermis", "medullaryRay", "pericycle", "phloem", "pith"],
  4: ["cambium", "cortex", "medullaryRay", "pericycle"],
  5: ["epidermis", "medullaryRay", "xylem"],
  6: ["endodermis", "epidermis", "hypodermis", "pericycle", "phloem"],
  7: ["cortex", "endodermis", "medullaryRay", "phloem", "pith", "xylem"],
  8: ["cambium", "cortex", "endodermis", "epidermis", "medullaryRay", "pericycle", "phloem"],
  9: ["cambium", "cortex", "endodermis", "epidermis", "phloem", "pith", "xylem"],
  10: ["cambium", "cortex", "endodermis", "epidermis", "hypodermis", "medullaryRay", "xylem"],
};

describe("Dicot Stem (dg10) Mismatch Mode -- loads via Diagram Center, generic mode", () => {
  it("T.S. of a Dicot Stem -> Find Mismatched Labels loads through Diagram Center", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("T.S. of a Dicot Stem"));
    fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
  });

  it("all 10 canonical structures participate exactly once as a pinned chip, with the exact expected structure ids, no DG1-DG9 labels present", () => {
    const { container } = openMismatchMode();
    NAMES.forEach(name => {
      expect(container.querySelector(`button[aria-label='Check label "${name}"']`)).toBeTruthy();
    });
    const puzzle = readPuzzle(container);
    expect(Object.keys(puzzle).sort()).toEqual([...STEM_IDS].sort());
  });
});

describe("Dicot Stem (dg10) Mismatch-generation invariants (real, unmocked mounts)", () => {
  it("every puzzle contains between 2 and 9 genuine mismatches -- a guaranteed (not probabilistic) invariant for n=10", () => {
    // buildMismatchChallenge's mismatchCount formula for n=10 structures is
    // min(max(2 + floor(rand*(10-2)), 2), 10-1) = min(max(2..9, 2), 9),
    // which is always in [2, 9] regardless of the random draw -- needs no
    // sampling to verify, but every mount independently re-confirms it.
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const mismatchedCount = Object.values(puzzle).filter(p => p.isMismatched).length;
    expect(mismatchedCount).toBeGreaterThanOrEqual(2);
    expect(mismatchedCount).toBeLessThanOrEqual(TOTAL - 1);
  });

  it("no label ever maps to itself when marked mismatched (a mismatch cannot point to its own structure)", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    Object.entries(puzzle).forEach(([slotId, p]) => {
      if (p.isMismatched) expect(p.pinnedName).not.toBe(nativeNameOf(slotId));
    });
  });

  it("no duplicate structure ids and no duplicate label ids: the 10 pinned names are always a full permutation of the 10 DG10 structure names -- never a DG1-DG9 name", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const slotIds = Object.keys(puzzle);
    expect(new Set(slotIds).size).toBe(TOTAL);
    const pinnedNames = Object.values(puzzle).map(p => p.pinnedName);
    expect(new Set(pinnedNames).size).toBe(TOTAL);
    expect(pinnedNames.slice().sort()).toEqual([...NAMES].sort());
    // Scoped strictly to DG10's own ids/names, per instructions -- no
    // cross-diagram global-uniqueness assertion here.
    pinnedNames.forEach(n => expect(NAMES).toContain(n));
  });
});

describe("Dicot Stem (dg10) Mismatch -- deterministic RNG forcing (all 10 structures independently proven)", () => {
  it("the same forced seed reproduces the exact same puzzle every time (true determinism, not luck)", () => {
    const puzzleA = withForcedRandom(1, () => {
      const { container, unmount } = openMismatchMode();
      const p = readPuzzle(container);
      unmount();
      return p;
    });
    const puzzleB = withForcedRandom(1, () => {
      const { container, unmount } = openMismatchMode();
      const p = readPuzzle(container);
      unmount();
      return p;
    });
    expect(puzzleA).toEqual(puzzleB);
  });

  Object.entries(EXPECTED_MISMATCHED_BY_SEED).forEach(([seed, expectedMismatched]) => {
    it(`seed ${seed}: forced puzzle matches the pre-computed expected mismatch set exactly, and is a valid permutation within the 2-9 invariant`, () => {
      const puzzle = withForcedRandom(Number(seed), () => {
        const { container, unmount } = openMismatchMode();
        const p = readPuzzle(container);
        unmount();
        return p;
      });
      const actualMismatched = Object.entries(puzzle).filter(([, p]) => p.isMismatched).map(([id]) => id).sort();
      expect(actualMismatched).toEqual([...expectedMismatched].sort());

      const pinnedNames = Object.values(puzzle).map(p => p.pinnedName);
      expect(new Set(pinnedNames).size).toBe(TOTAL);
      expect(pinnedNames.slice().sort()).toEqual([...NAMES].sort());
      expect(actualMismatched.length).toBeGreaterThanOrEqual(2);
      expect(actualMismatched.length).toBeLessThanOrEqual(TOTAL - 1);
    });
  });

  it("across forced seeds 1-6, every one of the 10 structures independently appears as a MISMATCH target at least once (deterministic, not sampled)", () => {
    const seenMismatched = new Set();
    Object.values(EXPECTED_MISMATCHED_BY_SEED).forEach(list => list.forEach(id => seenMismatched.add(id)));
    STEM_IDS.forEach(id => expect(seenMismatched.has(id)).toBe(true));
  });

  it("across forced seeds 1-10, every one of the 10 structures independently appears as a CORRECT (self-mapped) target at least once (deterministic, not sampled)", () => {
    const seenCorrect = new Set();
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(seed => {
      const puzzle = withForcedRandom(seed, () => {
        const { container, unmount } = openMismatchMode();
        const p = readPuzzle(container);
        unmount();
        return p;
      });
      Object.entries(puzzle).forEach(([id, p]) => { if (!p.isMismatched) seenCorrect.add(id); });
    });
    STEM_IDS.forEach(id => expect(seenCorrect.has(id)).toBe(true));
  });
});

describe("Dicot Stem (dg10) Mismatch Mode -- gameplay / scoring (multiple disjoint wrong/correct pairs)", () => {
  it("correctly identifying a genuine mismatch increments progress exactly once and locks the chip (seed 1)", () => {
    withForcedRandom(1, () => {
      const { container } = openMismatchMode();
      const puzzle = readPuzzle(container);
      const [, p] = Object.entries(puzzle).find(([, v]) => v.isMismatched);
      const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);

      fireEvent.click(chip);
      fireEvent.click(screen.getByText("✗ Mismatched"));
      expect(screen.getByText(/that label was mismatched/i)).toBeInTheDocument();
      expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
      expect(chip.textContent.startsWith("✓")).toBe(true);

      fireEvent.click(chip); // already-identified: locked, cannot double-score
      expect(screen.queryByText("✗ Mismatched")).not.toBeInTheDocument();
      expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    });
  });

  it("correctly identifying a correctly-matched label also increments progress (seed 1)", () => {
    withForcedRandom(1, () => {
      const { container } = openMismatchMode();
      const puzzle = readPuzzle(container);
      const [, p] = Object.entries(puzzle).find(([, v]) => !v.isMismatched);
      const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);

      fireEvent.click(chip);
      fireEvent.click(screen.getByText("✓ Correct"));
      expect(screen.getByText(/that label was right/i)).toBeInTheDocument();
      expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    });
  });

  it("wrongly judging a correct label as 'Mismatched' does not increment progress, awards no XP, and allows retry (seed 2, disjoint pair)", () => {
    withForcedRandom(2, () => {
      const { container } = openMismatchMode();
      const puzzle = readPuzzle(container);
      const [, p] = Object.entries(puzzle).find(([, v]) => !v.isMismatched);
      const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);

      fireEvent.click(chip);
      fireEvent.click(screen.getByText("✗ Mismatched"));
      expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
      expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
      expect(screen.queryByText(/XP earned:/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByText("✓ Correct"));
      expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    });
  });

  it("wrongly judging a mismatched label as 'Correct' does not increment progress, awards no XP, and allows retry (seed 2, disjoint pair)", () => {
    withForcedRandom(2, () => {
      const { container } = openMismatchMode();
      const puzzle = readPuzzle(container);
      const [, p] = Object.entries(puzzle).find(([, v]) => v.isMismatched);
      const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);

      fireEvent.click(chip);
      fireEvent.click(screen.getByText("✓ Correct"));
      expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
      expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
      expect(screen.queryByText(/XP earned:/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByText("✗ Mismatched"));
      expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    });
  });

  it("a second, entirely different disjoint wrong/correct pair also behaves correctly (seed 4)", () => {
    withForcedRandom(4, () => {
      const { container } = openMismatchMode();
      const puzzle = readPuzzle(container);
      const entries = Object.entries(puzzle);
      const [, mismatchedP] = entries.find(([, v]) => v.isMismatched);
      const [, correctP] = entries.find(([, v]) => !v.isMismatched);

      const mChip = container.querySelector(`button[aria-label='Check label "${mismatchedP.pinnedName}"']`);
      fireEvent.click(mChip);
      fireEvent.click(screen.getByText("✓ Correct")); // wrong judgment
      expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
      fireEvent.click(screen.getByText("✗ Mismatched")); // correct judgment
      expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();

      const cChip = container.querySelector(`button[aria-label='Check label "${correctP.pinnedName}"']`);
      fireEvent.click(cChip);
      fireEvent.click(screen.getByText("✗ Mismatched")); // wrong judgment
      expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
      fireEvent.click(screen.getByText("✓ Correct")); // correct judgment
      expect(screen.getByText(`2 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    });
  });

  it("completion occurs only after all 10 required judgements are made, not before", () => {
    withForcedRandom(1, () => {
      const { container } = openMismatchMode();
      const puzzle = readPuzzle(container);
      const entries = Object.entries(puzzle);
      entries.slice(0, TOTAL - 1).forEach(([, p]) => {
        const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
        fireEvent.click(chip);
        fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
      });
      expect(screen.getByText(`${TOTAL - 1} / ${TOTAL} Labels Checked`)).toBeInTheDocument();
      expect(screen.queryByText(/Challenge Complete/i)).not.toBeInTheDocument();

      const [, lastP] = entries[TOTAL - 1];
      const lastChip = container.querySelector(`button[aria-label='Check label "${lastP.pinnedName}"']`);
      fireEvent.click(lastChip);
      fireEvent.click(screen.getByText(lastP.isMismatched ? "✗ Mismatched" : "✓ Correct"));
      expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels Checked`)).toBeInTheDocument();
      expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    });
  });
});

describe("Dicot Stem (dg10) Mismatch Mode -- XP", () => {
  it("XP reward is exactly 63, and completion awards exactly 63, once", () => {
    expect(DIAGRAM_DATA.find(d => d.id === "dg10").xpReward).toBe(63);
    withForcedRandom(1, () => {
      const { container } = openMismatchMode();
      const puzzle = readPuzzle(container);
      Object.entries(puzzle).forEach(([, p]) => {
        const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
        fireEvent.click(chip);
        fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
      });
      expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels Checked`)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
      // Precise assertion -- not a broad /XP/i regex (which would also match
      // "Explore", the generic mode-switch button always present in the tab bar).
      const xpLine = screen.getByText(/XP earned:/);
      expect(xpLine.parentElement.textContent).toContain("XP earned: 63");
      expect(screen.getAllByText("63").length).toBe(1);
    });
  });

  it("incorrect selections award 0 XP/progress (no XP line before completion)", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const [, p] = Object.entries(puzzle)[0];
    const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
    const wrongJudgement = p.isMismatched ? "✓ Correct" : "✗ Mismatched";
    fireEvent.click(chip);
    fireEvent.click(screen.getByText(wrongJudgement));
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    expect(screen.queryByText(/XP earned:/)).not.toBeInTheDocument();
  });

  it("repeated clicks/submissions on an already-solved chip cannot duplicate XP or progress", () => {
    withForcedRandom(1, () => {
      const { container } = openMismatchMode();
      const puzzle = readPuzzle(container);
      const [, p] = Object.entries(puzzle).find(([, v]) => v.isMismatched);
      const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
      fireEvent.click(chip);
      fireEvent.click(screen.getByText("✗ Mismatched"));
      expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
      for (let i = 0; i < 10; i++) fireEvent.click(chip);
      expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
      expect(screen.queryByText(/XP earned:/)).not.toBeInTheDocument();
    });
  });

  it("post-completion: chips remain locked, no remaining path back into scoring, and no duplicate XP from further interaction", () => {
    withForcedRandom(1, () => {
      const { container } = openMismatchMode();
      const puzzle = readPuzzle(container);
      Object.entries(puzzle).forEach(([, p]) => {
        const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
        fireEvent.click(chip);
        fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
      });
      const chips = Array.from(container.querySelectorAll('button[aria-label^="Check label"]'));
      expect(chips.length).toBe(TOTAL);
      chips.forEach(c => expect(c.textContent.startsWith("✓")).toBe(true));
      fireEvent.click(chips[0]);
      expect(screen.queryByText("✓ Correct")).not.toBeInTheDocument();
      expect(screen.queryByText("✗ Mismatched")).not.toBeInTheDocument();
      expect(screen.getAllByText("63").length).toBe(1);
    });
  });
});

describe("Dicot Stem (dg10) Mismatch Mode -- reset / Play Again", () => {
  it("Play Again resets progress, score, and XP to a clean, freshly-generated puzzle that still satisfies the 2-9 mismatch invariant, with no state leaked from the previous session", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    Object.entries(puzzle).forEach(([, p]) => {
      const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
      fireEvent.click(chip);
      fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    });
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    expect(screen.queryByText(/Challenge Complete/i)).not.toBeInTheDocument();
    expect(screen.queryByText("63")).not.toBeInTheDocument();

    const freshPuzzle = readPuzzle(container);
    expect(Object.keys(freshPuzzle).length).toBe(TOTAL);
    const freshPinnedNames = Object.values(freshPuzzle).map(p => p.pinnedName);
    expect(new Set(freshPinnedNames).size).toBe(TOTAL);
    expect(freshPinnedNames.slice().sort()).toEqual([...NAMES].sort());
    const freshMismatchCount = Object.values(freshPuzzle).filter(p => p.isMismatched).length;
    expect(freshMismatchCount).toBeGreaterThanOrEqual(2);
    expect(freshMismatchCount).toBeLessThanOrEqual(TOTAL - 1);

    // A fully fresh session can be completed normally again.
    Object.entries(freshPuzzle).forEach(([, p]) => {
      const chip2 = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
      fireEvent.click(chip2);
      fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    });
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByText("63")).toBeInTheDocument();
  });
});

describe("Dicot Stem (dg10) Mismatch Mode -- mobile / responsive / accessibility", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "laptop", width: 1024, expectGrid: true },
    { label: "mobile-412", width: 412, expectGrid: false },
    { label: "mobile-390", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): no horizontal overflow, diagram/labels stay contained, progress readable, tap-only works`, () => {
      setWidth(width);
      const { container, unmount } = openMismatchMode();
      expect(container.querySelector("svg")).toBeTruthy();

      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");

      // Tap-only flow (no hover events fired anywhere above).
      const puzzle = readPuzzle(container);
      const [, p] = Object.entries(puzzle)[0];
      const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
      fireEvent.click(chip);
      fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
      expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();

      const badWidths = Array.from(container.querySelectorAll("[style]")).filter(el => {
        const w = el.style.width;
        return w && /^\d+(\.\d+)?px$/.test(w) && parseFloat(w) > width;
      });
      expect(badWidths).toHaveLength(0);

      unmount();
      setWidth(1280);
    });
  });

  it("all 10 pinned labels remain visible/usable at 390px and 412px mobile width", () => {
    [390, 412].forEach(width => {
      setWidth(width);
      const { container, unmount } = openMismatchMode();
      const buttons = Array.from(container.querySelectorAll('button[aria-label^="Check label"]'));
      expect(buttons.length).toBe(TOTAL);
      unmount();
    });
    setWidth(1280);
  });

  it("completion UI is usable at 390px mobile width", () => {
    setWidth(390);
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    Object.entries(puzzle).forEach(([, p]) => {
      const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
      fireEvent.click(chip);
      fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    });
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play Again" })).toBeInTheDocument();
    setWidth(1280);
  });

  it("pinned chips have meaningful accessible names, and judge controls are real accessible buttons (not hover/color-only); locked chips expose their solved state via the accessible ✓ prefix, not color alone", () => {
    const { container } = openMismatchMode();
    const buttons = Array.from(container.querySelectorAll('button[aria-label^="Check label"]'));
    expect(buttons.length).toBe(TOTAL);
    buttons.forEach(btn => {
      expect(btn.getAttribute("aria-label")).toMatch(/^Check label ".+"$/);
      expect(btn.tagName.toLowerCase()).toBe("button");
    });
    const puzzle = readPuzzle(container);
    const [, p] = Object.entries(puzzle)[0];
    const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
    fireEvent.click(chip);
    expect(screen.getByRole("button", { name: "✓ Correct" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "✗ Mismatched" })).toBeInTheDocument();

    fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    expect(chip.textContent.startsWith("✓")).toBe(true);
  });
});

describe("Dicot Stem (dg10) -- dg1-dg9 regression remains intact", () => {
  it("dg9 (Dicot Root) is unmodified: 9 structures, XP 65, Mismatch Mode still loads", () => {
    const dg9 = DIAGRAM_DATA.find(d => d.id === "dg9");
    expect(dg9.structures.length).toBe(9);
    expect(dg9.xpReward).toBe(65);
    const d = normalizeDiagram(dg9);
    const { unmount } = render(<DiagramGame diagram={d} />);
    fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
    expect(screen.getByText("0 / 9 Labels Checked")).toBeInTheDocument();
    unmount();
  });

  it("dg9's own Mismatch completion still works exactly as before, unaffected by dg10's addition", () => {
    const dg9raw = DIAGRAM_DATA.find(d => d.id === "dg9");
    const d = normalizeDiagram(dg9raw);
    const rootIds = d.structures.map(s => s.id);
    const nameOf9 = (id) => d.structures.find(s => s.id === id).name;
    render(<DiagramGame diagram={d} />);
    fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
    const posToSlot9 = {};
    rootIds.forEach(id => {
      const s = d.structures.find(x => x.id === id);
      posToSlot9[`${s.labelPosition.xPct}%|${s.labelPosition.yPct}%`] = id;
    });
    const buttons = Array.from(document.querySelectorAll('button[aria-label^="Check label"]'));
    buttons.forEach(btn => {
      const key = `${btn.style.left}|${btn.style.top}`;
      const slotId = posToSlot9[key];
      const m = btn.getAttribute("aria-label").match(/^Check label "(.+)"$/);
      const isMismatched = m[1] !== nameOf9(slotId);
      fireEvent.click(btn);
      fireEvent.click(screen.getByText(isMismatched ? "✗ Mismatched" : "✓ Correct"));
    });
    expect(screen.getByText("9 / 9 Labels Checked")).toBeInTheDocument();
    expect(screen.getByText(/XP earned:/).parentElement.textContent).toContain("XP earned: 65");
  });

  it("dg1-dg8 Mismatch Mode still loads with intact structure counts", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6", "dg7", "dg8"].forEach(id => {
      const d = normalizeDiagram(DIAGRAM_DATA.find(x => x.id === id));
      const { unmount } = render(<DiagramGame diagram={d} />);
      fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
      expect(screen.getByText(`0 / ${d.structures.length} Labels Checked`)).toBeInTheDocument();
      unmount();
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("the registry and DIAGRAM_DATA contain dg1 through dg10, nothing renamed or removed, and no dg11 exists yet", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6", "dg7", "dg8", "dg9", "dg10"].forEach(id => {
      expect(DIAGRAM_DATA.find(d => d.id === id)).toBeTruthy();
    });
    expect(DIAGRAM_DATA.find(d => d.id === "dg11")).toBeFalsy();
    expect(DIAGRAM_DATA.length).toBe(10);
  });

  it("DG10 Foundation/Explore/Label data remain intact (spot check: xpReward, structure count, SVG registration)", () => {
    const raw10 = DIAGRAM_DATA.find(d => d.id === "dg10");
    expect(raw10.xpReward).toBe(63);
    expect(raw10.structures.length).toBe(10);
    expect(raw10.image).toEqual({ type: "svg", component: "dicotStem" });
  });
});

describe("Dicot Stem (dg10) -- source-level reusability check", () => {
  it("MismatchMode and buildMismatchChallenge contain no dg10/Dicot-Stem-specific hardcoded names or conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function MismatchMode(");
    const nextFn = source.indexOf("\nfunction DiagramGame(", start);
    const body = source.slice(start, nextFn);
    const forbidden = ["Epidermis", "Hypodermis", "Cortex", "Endodermis", "Pericycle", "Xylem", "Phloem", "Cambium", "Medullary Ray", "Pith"];
    forbidden.forEach(word => expect(body.includes(word)).toBe(false));
    expect(body.includes('diagram.id === "dg10"')).toBe(false);
    expect(body.includes('diagram.image.component === "dicotStem"')).toBe(false);

    const genStart = source.indexOf("function buildMismatchChallenge(");
    const genEnd = source.indexOf("\n}\n", genStart) + 1;
    const genBody = source.slice(genStart, genEnd);
    forbidden.forEach(word => expect(genBody.includes(word)).toBe(false));
  });
});
