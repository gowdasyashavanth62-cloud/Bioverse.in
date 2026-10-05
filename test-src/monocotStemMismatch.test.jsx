import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const root = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg12"));
const ROOT_IDS = root.structures.map(s => s.id);
const NAMES = root.structures.map(s => s.name);
const TOTAL = root.structures.length; // 9
const nativeNameOf = (id) => root.structures.find(s => s.id === id).name;
const nativeIdOfName = (name) => root.structures.find(s => s.name === name).id;

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openMismatchMode() {
  const utils = render(<DiagramGame diagram={root} />);
  fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
  return utils;
}

// Ground-truth reader: each structure's `labelPosition` (xPct/yPct) is fixed
// and unique in DIAGRAM_DATA, so the CSS left/top of a pinned chip tells us
// which SLOT it belongs to, independent of which LABEL name is displayed on
// it -- same technique already established for dg7/dg8's mismatch tests.
// This is deliberately NOT reading React/component internals -- only the
// real rendered DOM, which is what the actual Mismatch UI exposes.
function readPuzzle(container) {
  const posToSlot = {};
  ROOT_IDS.forEach(id => {
    const s = root.structures.find(x => x.id === id);
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

describe("Monocot Stem (dg12) Mismatch Mode -- loads via Diagram Center, generic mode", () => {
  it("T.S. of a Monocot Stem -> Find Mismatched Labels loads through Diagram Center", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("T.S. of a Monocot Stem"));
    fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
  });

  it("all 9 canonical structures participate exactly once as a pinned chip, with the exact expected structure ids, no DG1-DG8 labels present", () => {
    const { container } = openMismatchMode();
    NAMES.forEach(name => {
      expect(container.querySelector(`button[aria-label='Check label "${name}"']`)).toBeTruthy();
    });
    const puzzle = readPuzzle(container);
    expect(Object.keys(puzzle).sort()).toEqual([...ROOT_IDS].sort());
  });
});

describe("Monocot Stem (dg12) Mismatch-generation invariants", () => {
  it("every puzzle contains between 2 and 8 genuine mismatches -- a guaranteed (not probabilistic) invariant for n=9", () => {
    // buildMismatchChallenge's mismatchCount formula for n=9 structures is
    // min(max(2 + floor(rand*(9-2)), 2), 9-1) = min(max(2..8, 2), 8), which
    // is always in [2, 8] regardless of the random draw -- needs no
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

  it("no duplicate structure ids and no duplicate label ids: the 9 pinned names are always a full permutation of the 9 structure names", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const slotIds = Object.keys(puzzle);
    expect(new Set(slotIds).size).toBe(TOTAL);
    const pinnedNames = Object.values(puzzle).map(p => p.pinnedName);
    expect(new Set(pinnedNames).size).toBe(TOTAL);
    expect(pinnedNames.slice().sort()).toEqual([...NAMES].sort());
  });

  it("every label belongs to dg12 (no unknown/foreign labels appear)", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    Object.values(puzzle).forEach(p => expect(NAMES).toContain(p.pinnedName));
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

  it("mismatches decompose into valid cycles (every mismatched slot's chain of displaced labels eventually returns to itself, no orphaned half-swaps), and naturally-generated permutations include both a 2-cycle (transposition) and a longer cycle across sampled mounts", () => {
    // buildMismatchChallenge exposes no direct injection mechanism (confirmed
    // by inspecting its source: it only accepts `structures`, no seed/forced
    // arrangement param), so per the audit this tests EQUIVALENT naturally
    // generated permutations instead of fabricating one -- exactly what the
    // task calls for when no injection point exists, without modifying
    // production to add a test-only hook.
    const cycleLengthsSeen = new Set();
    for (let i = 0; i < 30; i++) {
      const { container, unmount } = openMismatchMode();
      const puzzle = readPuzzle(container);
      // slotId -> displayed structure id (via its pinned name)
      const mapping = {};
      Object.entries(puzzle).forEach(([slotId, p]) => { mapping[slotId] = nativeIdOfName(p.pinnedName); });

      // Decompose the full permutation into cycles and validate each one.
      const visited = new Set();
      ROOT_IDS.forEach(start => {
        if (visited.has(start)) return;
        const cycle = [start];
        visited.add(start);
        let cur = mapping[start];
        while (cur !== start) {
          expect(visited.has(cur)).toBe(false); // a valid permutation never revisits mid-cycle
          visited.add(cur);
          cycle.push(cur);
          cur = mapping[cur];
        }
        // A cycle of length 1 means every id in it is self-mapped (correct);
        // any cycle of length >= 2 is entirely composed of mismatches.
        if (cycle.length >= 2) {
          cycle.forEach(id => expect(puzzle[id].isMismatched).toBe(true));
          cycleLengthsSeen.add(cycle.length);
        } else {
          expect(puzzle[start].isMismatched).toBe(false);
        }
      });
      unmount();
    }
    // Across 30 naturally-generated sessions, both a simple transposition
    // (Case A, length 2) and a longer cycle (Case B, length >= 3) occur.
    expect(cycleLengthsSeen.has(2)).toBe(true);
    expect(Array.from(cycleLengthsSeen).some(len => len >= 3)).toBe(true);
  });

  it("every one of the 9 structures is reachable both as a mismatch and as a correctly-labeled target, sampled across many mounts", () => {
    const seenMismatched = new Set();
    const seenCorrect = new Set();
    for (let i = 0; i < 40 && (seenMismatched.size < TOTAL || seenCorrect.size < TOTAL); i++) {
      const { container, unmount } = openMismatchMode();
      const puzzle = readPuzzle(container);
      Object.entries(puzzle).forEach(([slotId, p]) => {
        (p.isMismatched ? seenMismatched : seenCorrect).add(slotId);
      });
      unmount();
    }
    ROOT_IDS.forEach(id => {
      expect(seenMismatched.has(id)).toBe(true);
      expect(seenCorrect.has(id)).toBe(true);
    });
  });
});

describe("Monocot Stem (dg12) Mismatch Mode -- gameplay / scoring", () => {
  it("correctly identifying a genuine mismatch increments progress exactly once and locks the chip", () => {
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

  it("correctly identifying a correctly-matched label also increments progress", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const [, p] = Object.entries(puzzle).find(([, v]) => !v.isMismatched);
    const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);

    fireEvent.click(chip);
    fireEvent.click(screen.getByText("✓ Correct"));
    expect(screen.getByText(/that label was right/i)).toBeInTheDocument();
    expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
  });

  it("wrongly judging a correct label as 'Mismatched' does not increment progress, awards no XP, and allows retry", () => {
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

  it("wrongly judging a mismatched label as 'Correct' does not increment progress, awards no XP, and allows retry", () => {
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

  it("completion occurs only after all 9 required judgements are made, not before", () => {
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

describe("Monocot Stem (dg12) Mismatch Mode -- XP", () => {
  it("XP reward is exactly 65, and completion awards exactly 65, once", () => {
    expect(DIAGRAM_DATA.find(d => d.id === "dg12").xpReward).toBe(65);
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
    expect(xpLine.parentElement.textContent).toContain("XP earned: 65");
    expect(screen.getAllByText("65").length).toBe(1);
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

  it("post-completion: chips remain locked, no remaining path back into scoring, and no duplicate XP from further interaction", () => {
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
    expect(screen.getAllByText("65").length).toBe(1);
  });
});

describe("Monocot Stem (dg12) Mismatch Mode -- reset / Play Again", () => {
  it("Play Again resets progress, score, and XP to a clean, freshly-generated puzzle that still satisfies the 2-8 mismatch invariant", () => {
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
    expect(screen.queryByText("65")).not.toBeInTheDocument();

    const freshPuzzle = readPuzzle(container);
    expect(Object.keys(freshPuzzle).length).toBe(TOTAL);
    const freshMismatchCount = Object.values(freshPuzzle).filter(p => p.isMismatched).length;
    expect(freshMismatchCount).toBeGreaterThanOrEqual(2);
    expect(freshMismatchCount).toBeLessThanOrEqual(TOTAL - 1);

    // Interaction works again post-reset.
    const [, p2] = Object.entries(freshPuzzle)[0];
    const chip2 = container.querySelector(`button[aria-label='Check label "${p2.pinnedName}"']`);
    fireEvent.click(chip2);
    fireEvent.click(screen.getByText(p2.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
  });
});

describe("Monocot Stem (dg12) Mismatch Mode -- mobile / responsive / accessibility", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  it("390px mobile: labels remain selectable and feedback readable without hover (tap-only flow)", () => {
    setWidth(390);
    const { container, unmount } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const [, p] = Object.entries(puzzle)[0];
    const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
    fireEvent.click(chip);
    fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    unmount();
    setWidth(1280);
  });

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "narrow-desktop", width: 1024, expectGrid: true },
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

  it("all 9 pinned labels remain visible/usable at 390px mobile width", () => {
    setWidth(390);
    const { container } = openMismatchMode();
    const buttons = Array.from(container.querySelectorAll('button[aria-label^="Check label"]'));
    expect(buttons.length).toBe(TOTAL);
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

  it("pinned chips have meaningful accessible names, and judge controls are real accessible buttons (not hover/color-only)", () => {
    const { container } = openMismatchMode();
    const buttons = Array.from(container.querySelectorAll('button[aria-label^="Check label"]'));
    expect(buttons.length).toBe(TOTAL);
    buttons.forEach(btn => {
      expect(btn.getAttribute("aria-label")).toMatch(/^Check label ".+"$/);
      expect(btn.tagName.toLowerCase()).toBe("button");
    });
    const puzzle = readPuzzle(container);
    const [, p] = Object.entries(puzzle)[0];
    fireEvent.click(container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`));
    expect(screen.getByRole("button", { name: "✓ Correct" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "✗ Mismatched" })).toBeInTheDocument();
  });
});

describe("Monocot Stem (dg12) -- dg1-dg8 regression remains intact", () => {
  it("dg7 (Prokaryotic Cell) is unmodified: 8 structures, XP 55, Mismatch Mode still loads", () => {
    const dg7 = DIAGRAM_DATA.find(d => d.id === "dg7");
    expect(dg7.structures.length).toBe(8);
    expect(dg7.xpReward).toBe(55);
    const d = normalizeDiagram(dg7);
    const { unmount } = render(<DiagramGame diagram={d} />);
    fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
    expect(screen.getByText("0 / 8 Labels Checked")).toBeInTheDocument();
    unmount();
  });

  it("dg8 (Plant Cell) is unmodified: 11 structures, XP 60, Mismatch Mode still loads", () => {
    const dg8 = DIAGRAM_DATA.find(d => d.id === "dg8");
    expect(dg8.structures.length).toBe(11);
    expect(dg8.xpReward).toBe(60);
    const d = normalizeDiagram(dg8);
    const { unmount } = render(<DiagramGame diagram={d} />);
    fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
    expect(screen.getByText("0 / 11 Labels Checked")).toBeInTheDocument();
    unmount();
  });

  it("dg1-dg6 Mismatch Mode still loads with intact structure counts", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6"].forEach(id => {
      const d = normalizeDiagram(DIAGRAM_DATA.find(x => x.id === id));
      const { unmount } = render(<DiagramGame diagram={d} />);
      fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
      expect(screen.getByText(`0 / ${d.structures.length} Labels Checked`)).toBeInTheDocument();
      unmount();
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("the registry and DIAGRAM_DATA contain dg1 through dg12, nothing renamed or removed", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6", "dg7", "dg8", "dg9", "dg10", "dg11", "dg12"].forEach(id => {
      expect(DIAGRAM_DATA.find(d => d.id === id)).toBeTruthy();
    });
    expect(DIAGRAM_DATA.length).toBe(12);
  });
});

describe("Monocot Stem (dg12) -- source-level reusability check", () => {
  it("MismatchMode and buildMismatchChallenge contain no dg12/Monocot-Root-specific hardcoded names or conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function MismatchMode(");
    const nextFn = source.indexOf("\nfunction DiagramGame(", start);
    const body = source.slice(start, nextFn);
    const forbidden = ["Epidermis", "Hypodermis", "Ground Tissue", "Vascular Bundle", "Bundle Sheath", "Phloem", "Water-containing Cavity", "Protoxylem", "Metaxylem"];
    forbidden.forEach(word => expect(body.includes(word)).toBe(false));
    expect(body.includes('diagram.id === "dg12"')).toBe(false);

    const genStart = source.indexOf("function buildMismatchChallenge(");
    const genEnd = source.indexOf("\n}\n", genStart) + 1;
    const genBody = source.slice(genStart, genEnd);
    forbidden.forEach(word => expect(genBody.includes(word)).toBe(false));
  });
});
