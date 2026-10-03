import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const plant = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg8"));
const PLANT_IDS = plant.structures.map(s => s.id);
const NAMES = plant.structures.map(s => s.name);
const TOTAL = plant.structures.length; // 11
const nativeNameOf = (id) => plant.structures.find(s => s.id === id).name;

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openMismatchMode() {
  const utils = render(<DiagramGame diagram={plant} />);
  fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
  return utils;
}

// Ground-truth reader: each structure's `labelPosition` (xPct/yPct) is fixed
// and unique in DIAGRAM_DATA, so the CSS left/top of a pinned chip tells us
// which SLOT it belongs to, independent of which LABEL name is displayed on
// it — same technique already established for dg7's mismatch tests.
function readPuzzle(container) {
  const posToSlot = {};
  PLANT_IDS.forEach(id => {
    const s = plant.structures.find(x => x.id === id);
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

describe("Plant Cell (dg8) Mismatch Mode — loads via Diagram Center, generic mode", () => {
  it("Plant Cell → Find Mismatched Labels loads through Diagram Center", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("Plant Cell"));
    fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
  });

  it("all 11 structures participate exactly once as a pinned chip, with the exact expected structure ids", () => {
    const { container } = openMismatchMode();
    NAMES.forEach(name => {
      expect(container.querySelector(`button[aria-label='Check label "${name}"']`)).toBeTruthy();
    });
    const puzzle = readPuzzle(container);
    expect(Object.keys(puzzle).sort()).toEqual([...PLANT_IDS].sort());
  });
});

describe("Plant Cell (dg8) Mismatch-generation invariants", () => {
  it("every puzzle contains at least one (in fact >= 2) genuine mismatch — deterministic for n=11, no retry needed", () => {
    // buildMismatchChallenge's mismatchCount formula for n=11 structures is
    // min(max(2 + floor(rand*(n-2)), 2), n-1) = min(max(2..10, 2), 10), which
    // is always in [2, 10] regardless of the random draw — a guaranteed
    // invariant, not a probabilistic one, so it needs no sampling.
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

  it("no duplicate structure ids and no duplicate label ids: the 11 pinned names are always a full permutation of the 11 structure names", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const slotIds = Object.keys(puzzle);
    expect(new Set(slotIds).size).toBe(TOTAL);
    const pinnedNames = Object.values(puzzle).map(p => p.pinnedName);
    expect(new Set(pinnedNames).size).toBe(TOTAL);
    expect(pinnedNames.slice().sort()).toEqual([...NAMES].sort());
  });

  it("every label belongs to dg8 (no foreign/unrelated names appear)", () => {
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
});

describe("Plant Cell (dg8) Mismatch Mode — gameplay / scoring", () => {
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

  it("wrongly judging a correct label as 'Mismatched' does not increment progress, and allows retry", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const [, p] = Object.entries(puzzle).find(([, v]) => !v.isMismatched);
    const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);

    fireEvent.click(chip);
    fireEvent.click(screen.getByText("✗ Mismatched"));
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();

    fireEvent.click(screen.getByText("✓ Correct"));
    expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
  });

  it("wrongly judging a mismatched label as 'Correct' does not increment progress, and allows retry", () => {
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    const [, p] = Object.entries(puzzle).find(([, v]) => v.isMismatched);
    const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);

    fireEvent.click(chip);
    fireEvent.click(screen.getByText("✓ Correct"));
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();

    fireEvent.click(screen.getByText("✗ Mismatched"));
    expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
  });

  it("completion occurs only after all 11 required judgements are made, not before", () => {
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

describe("Plant Cell (dg8) Mismatch Mode — XP", () => {
  it("XP reward is exactly 60, and completion awards exactly 60, once", () => {
    expect(DIAGRAM_DATA.find(d => d.id === "dg8").xpReward).toBe(60);
    const { container } = openMismatchMode();
    const puzzle = readPuzzle(container);
    Object.entries(puzzle).forEach(([, p]) => {
      const chip = container.querySelector(`button[aria-label='Check label "${p.pinnedName}"']`);
      fireEvent.click(chip);
      fireEvent.click(screen.getByText(p.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    });
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
    // Precise assertion — not a broad /XP/i regex (which would also match
    // "Explore", the generic mode-switch button always present in the tab bar).
    const xpLine = screen.getByText(/XP earned:/);
    expect(xpLine.parentElement.textContent).toContain("XP earned: 60");
    expect(screen.getAllByText("60").length).toBe(1);
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

  it("post-completion: chips remain locked, and there is no remaining path back into scoring", () => {
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
    expect(screen.getAllByText("60").length).toBe(1);
  });
});

describe("Plant Cell (dg8) Mismatch Mode — reset / Play Again", () => {
  it("Play Again resets progress, score, and XP to a clean, freshly-generated puzzle", () => {
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
    expect(screen.queryByText("60")).not.toBeInTheDocument();
    const freshPuzzle = readPuzzle(container);
    expect(Object.keys(freshPuzzle).length).toBe(TOTAL);

    // Interaction works again post-reset.
    const [, p2] = Object.entries(freshPuzzle)[0];
    const chip2 = container.querySelector(`button[aria-label='Check label "${p2.pinnedName}"']`);
    fireEvent.click(chip2);
    fireEvent.click(screen.getByText(p2.isMismatched ? "✗ Mismatched" : "✓ Correct"));
    expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
  });
});

describe("Plant Cell (dg8) Mismatch Mode — mobile / responsive / accessibility", () => {
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

  it("pinned chips have meaningful accessible names, and judge controls are real accessible buttons", () => {
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

describe("Plant Cell (dg8) — dg1-dg7 regression remains intact", () => {
  it("dg1 (Animal Cell) Mismatch Mode still works", () => {
    const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(container.querySelector("#nucleus"));
    expect(screen.getByText("Nucleus")).toBeInTheDocument();
    fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
    expect(screen.getByText("0 / 7 Labels Checked")).toBeInTheDocument();
  });

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

  it("dg2-dg6 Mismatch Mode still loads with intact structure counts", () => {
    ["dg2", "dg3", "dg4", "dg5", "dg6"].forEach(id => {
      const d = normalizeDiagram(DIAGRAM_DATA.find(x => x.id === id));
      const { unmount } = render(<DiagramGame diagram={d} />);
      fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
      expect(screen.getByText(`0 / ${d.structures.length} Labels Checked`)).toBeInTheDocument();
      unmount();
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

describe("Plant Cell (dg8) — source-level reusability check", () => {
  it("MismatchMode and buildMismatchChallenge contain no dg8/Plant-Cell-specific hardcoded names or conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function MismatchMode(");
    const nextFn = source.indexOf("\nfunction DiagramGame(", start);
    const body = source.slice(start, nextFn);
    const forbidden = ["Cell Wall", "Plasma Membrane", "Nucleolus", "Chloroplast", "Central Vacuole", "Mitochondrion", "Endoplasmic Reticulum", "Golgi Apparatus"];
    forbidden.forEach(word => expect(body.includes(word)).toBe(false));
    expect(body.includes('diagram.id === "dg8"')).toBe(false);

    const genStart = source.indexOf("function buildMismatchChallenge(");
    const genEnd = source.indexOf("\n}\n", genStart) + 1;
    const genBody = source.slice(genStart, genEnd);
    forbidden.forEach(word => expect(genBody.includes(word)).toBe(false));
  });
});
