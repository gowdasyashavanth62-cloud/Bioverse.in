import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const leaf = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));
const LEAF_NAMES = leaf.structures.map(s => s.name);
const LEAF_IDS = leaf.structures.map(s => s.id);
const TOTAL = leaf.structures.length; // 6

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openLeafMismatchMode() {
  const utils = render(<DiagramGame diagram={leaf} />);
  fireEvent.click(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" }));
  return utils;
}

// Resolves one label's judgement by trying "Correct" first, then falling
// back to "Mismatched" if that was wrong — the same trial-and-error a real
// student would do, no internal state access needed.
function resolveLabel(container, name) {
  const chip = container.querySelector(`button[aria-label='Check label "${name}"']`);
  expect(chip).toBeTruthy();
  fireEvent.click(chip);
  fireEvent.click(screen.getByText("✓ Correct"));
  if (screen.queryByText(/that label was right/i)) return "was-correct";
  fireEvent.click(screen.getByText("✗ Mismatched"));
  expect(screen.getByText(/that label was mismatched/i)).toBeInTheDocument();
  return "was-mismatched";
}

describe("STEP 18D — Leaf Cross Section Mismatch Mode: rendering", () => {
  it("Leaf Cross Section opens from Diagram Center", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("Leaf Cross Section"));
    expect(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" })).toBeInTheDocument();
  });

  it("Mismatch Mode opens and LeafCrossSectionSVG renders", () => {
    const { container } = openLeafMismatchMode();
    expect(container.querySelector("svg").getAttribute("aria-label")).toMatch(/leaf/i);
  });

  it("exactly 6 challenge entries participate, one per structure", () => {
    const { container } = openLeafMismatchMode();
    expect(TOTAL).toBe(6);
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    LEAF_NAMES.forEach(name => {
      expect(container.querySelector(`button[aria-label='Check label "${name}"']`)).toBeTruthy();
    });
  });
});

describe("STEP 18D — Leaf Cross Section Mismatch Mode: challenge validity", () => {
  it("every structure participates exactly once and every label is used exactly once (valid permutation)", () => {
    const { container } = openLeafMismatchMode();
    const chips = Array.from(container.querySelectorAll('button[aria-label^="Check label"]'));
    expect(chips).toHaveLength(TOTAL);
    const labelNames = chips.map(c => c.getAttribute("aria-label").match(/Check label "(.+)"/)[1]);
    expect(new Set(labelNames).size).toBe(TOTAL); // every label appears exactly once
    LEAF_NAMES.forEach(n => expect(labelNames.includes(n)).toBe(true)); // every structure's label present
  });

  it("the challenge contains both correctly-matched and mismatched relationships (never all one type)", () => {
    // buildMismatchChallenge guarantees a mix within every single generated
    // challenge (mismatchCount is always 2..n-1) — so probe all 6 items
    // within ONE session, not across independent fresh-mount sessions
    // (which would just be 6 unrelated random draws and could flake).
    const { container } = openLeafMismatchMode();
    let sawCorrect = false, sawMismatched = false;
    for (const name of LEAF_NAMES) {
      const chip = container.querySelector(`button[aria-label='Check label "${name}"']`);
      fireEvent.click(chip);
      fireEvent.click(screen.getByText("✓ Correct"));
      if (screen.queryByText(/that label was right/i)) {
        sawCorrect = true;
      } else {
        sawMismatched = true;
        fireEvent.click(screen.getByText("✗ Mismatched")); // resolve it so the next probe starts clean
      }
    }
    expect(sawCorrect).toBe(true);
    expect(sawMismatched).toBe(true);
  });

  it("challenge references only dg3 structure names, never foreign-diagram structures", () => {
    const { container } = openLeafMismatchMode();
    const chips = Array.from(container.querySelectorAll('button[aria-label^="Check label"]'));
    const labelNames = chips.map(c => c.getAttribute("aria-label").match(/Check label "(.+)"/)[1]);
    labelNames.forEach(n => expect(LEAF_NAMES.includes(n)).toBe(true));
    ["Nucleus", "Mitochondria", "Aorta", "Left Ventricle", "Vena Cava"].forEach(foreign => {
      expect(labelNames.includes(foreign)).toBe(false);
    });
  });
});

describe("STEP 18D — Leaf Cross Section Mismatch Mode: correctness", () => {
  it("correctly identifying a matched label as Correct increments progress and locks it", () => {
    let found = false;
    outer:
    for (let attempt = 0; attempt < 6 && !found; attempt++) {
      for (const name of LEAF_NAMES) {
        const { container, unmount } = openLeafMismatchMode();
        const chip = container.querySelector(`button[aria-label='Check label "${name}"']`);
        fireEvent.click(chip);
        fireEvent.click(screen.getByText("✓ Correct"));
        if (screen.queryByText(/that label was right/i)) {
          found = true;
          expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
          expect(chip.textContent.startsWith("✓")).toBe(true); // locked
          unmount();
          break outer;
        }
        unmount();
      }
    }
    expect(found).toBe(true);
  });

  it("correctly identifying a mismatched label increments progress and locks it", () => {
    let found = false;
    outer:
    for (let attempt = 0; attempt < 6 && !found; attempt++) {
      for (const name of LEAF_NAMES) {
        const { container, unmount } = openLeafMismatchMode();
        const chip = container.querySelector(`button[aria-label='Check label "${name}"']`);
        fireEvent.click(chip);
        fireEvent.click(screen.getByText("✗ Mismatched"));
        if (screen.queryByText(/that label was mismatched/i)) {
          found = true;
          expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
          expect(chip.textContent.startsWith("✓")).toBe(true);
          unmount();
          break outer;
        }
        unmount();
      }
    }
    expect(found).toBe(true);
  });

  it("an incorrect classification gives error feedback, does not increment progress, and allows retry", () => {
    let sawWrong = false;
    outer:
    for (let attempt = 0; attempt < 6 && !sawWrong; attempt++) {
      for (const name of LEAF_NAMES) {
        const { container, unmount } = openLeafMismatchMode();
        const chip = container.querySelector(`button[aria-label='Check label "${name}"']`);
        fireEvent.click(chip);
        fireEvent.click(screen.getByText("✓ Correct"));
        if (screen.queryByText(/Not quite/i)) {
          sawWrong = true;
          expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
          expect(screen.getByText("✗ Mismatched")).toBeInTheDocument(); // retry still available
          fireEvent.click(screen.getByText("✗ Mismatched"));
          expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
          unmount();
          break outer;
        }
        unmount();
      }
    }
    expect(sawWrong).toBe(true);
  });

  it("an already-resolved label cannot be re-checked to corrupt progress", () => {
    const { container } = openLeafMismatchMode();
    const name = LEAF_NAMES[0];
    resolveLabel(container, name);
    const progressBefore = screen.getByText(/Labels Checked/).textContent;
    const chip = container.querySelector(`button[aria-label='Check label "${name}"']`);
    fireEvent.click(chip); // attempt to reopen a locked/checked label
    expect(screen.getByText(progressBefore)).toBeInTheDocument(); // unchanged
  });
});

describe("STEP 18D — Leaf Cross Section Mismatch Mode: full completion / XP / Play Again", () => {
  it("completes all 6 classifications, reaches 6/6, correct score, XP capped at 45", () => {
    const { container } = openLeafMismatchMode();
    LEAF_NAMES.forEach(name => resolveLabel(container, name));
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}\\/${TOTAL}`))).toBeInTheDocument();
    const strong = container.querySelector("strong");
    const xp = Number(strong.textContent);
    expect(xp).toBe(45);
    expect(xp).toBeLessThanOrEqual(leaf.xpReward);
  });

  it("Play Again resets progress/score/locked state and generates a fresh valid challenge", () => {
    const { container } = openLeafMismatchMode();
    LEAF_NAMES.forEach(name => resolveLabel(container, name));
    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    LEAF_NAMES.forEach(name => {
      expect(container.querySelector(`button[aria-label='Check label "${name}"']`)).toBeTruthy();
    });
  });
});

describe("STEP 18D — Leaf Cross Section Mismatch Mode: randomization", () => {
  it("multiple fresh sessions produce multiple distinct valid arrangements", () => {
    const arrangements = [];
    for (let i = 0; i < 12; i++) {
      const { container, unmount } = openLeafMismatchMode();
      const order = Array.from(container.querySelectorAll('button[aria-label^="Check label"]'))
        .map(b => b.getAttribute("aria-label"));
      arrangements.push(order.join("|"));
      unmount();
    }
    expect(new Set(arrangements).size).toBeGreaterThan(1);
  });
});

describe("STEP 18D — Leaf Cross Section Mismatch Mode: mobile/tap-equivalent", () => {
  it("mobile tap-select label + tap Correct/Mismatched works, including incorrect handling and completion", () => {
    const { container } = openLeafMismatchMode();
    // Tap-based selection is identical to click in this codebase (no
    // separate touch handler exists) — same interaction path validated here.
    LEAF_NAMES.forEach(name => resolveLabel(container, name));
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
  });
});

describe("STEP 18D — Leaf Cross Section Mismatch Mode: responsive", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "laptop/tablet", width: 1024, expectGrid: true },
    { label: "mobile", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): no horizontal overflow, SVG + controls usable`, () => {
      setWidth(width);
      const { container, unmount } = openLeafMismatchMode();
      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");

      const chip = container.querySelector(`button[aria-label='Check label "${LEAF_NAMES[0]}"']`);
      fireEvent.click(chip);
      expect(screen.getByText("✓ Correct")).toBeInTheDocument();

      const badWidths = Array.from(container.querySelectorAll("[style]")).filter(el => {
        const w = el.style.width;
        return w && /^\d+(\.\d+)?px$/.test(w) && parseFloat(w) > width;
      });
      expect(badWidths).toHaveLength(0);

      unmount();
      setWidth(1280);
    });
  });
});

describe("STEP 18D — source-level reusability check", () => {
  it("MismatchMode and LeafCrossSectionSVG contain no dg3/leaf-name-specific or dg1/dg2-specific conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const leafNames = ["Epidermis", "Palisade Layer", "Spongy Layer", "Vascular Bundle", "Guard Cell", "Stoma"];

    const mmStart = source.indexOf("function MismatchMode(");
    const mmEnd = source.indexOf("function DiagramGame(", mmStart) > mmStart
      ? source.indexOf("function DiagramGame(", mmStart)
      : source.indexOf("function IdentifyMode(", mmStart);
    expect(mmStart).toBeGreaterThan(-1);
    const mmBody = source.slice(mmStart, mmEnd);
    leafNames.forEach(n => expect(mmBody.includes(n)).toBe(false));
    expect(mmBody.includes('diagram.id === "dg3"')).toBe(false);
    expect(mmBody.includes('diagram.id === "dg1"')).toBe(false);
    expect(mmBody.includes('diagram.id === "dg2"')).toBe(false);
    expect(source.includes("function LeafCrossSectionMismatchMode")).toBe(false);
    expect(source.includes("dg3MismatchGame")).toBe(false);

    const svgStart = source.indexOf("function LeafCrossSectionSVG(");
    const svgEnd = source.indexOf("const DIAGRAM_SVG_COMPONENTS", svgStart);
    expect(svgStart).toBeGreaterThan(-1);
    const svgBody = source.slice(svgStart, svgEnd);
    ["score", "xpReward", "acceptableAnswers", "solvedSlotIds", "challenge"].forEach(term => {
      expect(svgBody.includes(term)).toBe(false);
    });
  });
});

describe("STEP 18D — regression", () => {
  const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
  const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));

  it("Animal Cell Explore Mode still passes", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(container.querySelector("#nucleus"));
    expect(screen.getByText("Nucleus")).toBeInTheDocument();
  });

  it("Animal Cell Label Mode still passes", () => {
    render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
  });

  it("Animal Cell Mismatch Mode still passes", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" }));
    expect(screen.getByText("0 / 7 Labels Checked")).toBeInTheDocument();
    const chip = container.querySelector(`button[aria-label='Check label "Nucleus"']`);
    fireEvent.click(chip);
    fireEvent.click(screen.getByText("✓ Correct"));
    if (!screen.queryByText(/that label was right/i)) fireEvent.click(screen.getByText("✗ Mismatched"));
    expect(screen.getByText("1 / 7 Labels Checked")).toBeInTheDocument();
  });

  it("Human Heart Mismatch Mode still passes", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    fireEvent.click(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" }));
    expect(screen.getByText("0 / 7 Labels Checked")).toBeInTheDocument();
    const chip = container.querySelector(`button[aria-label='Check label "Aorta"']`);
    fireEvent.click(chip);
    fireEvent.click(screen.getByText("✓ Correct"));
    if (!screen.queryByText(/that label was right/i)) fireEvent.click(screen.getByText("✗ Mismatched"));
    expect(screen.getByText("1 / 7 Labels Checked")).toBeInTheDocument();
  });

  it("Human Heart Label Mode still passes", () => {
    render(<DiagramGame diagram={heart} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
  });

  it("Leaf Cross Section Explore Mode still passes", () => {
    const { container } = render(<DiagramGame diagram={leaf} />);
    fireEvent.click(container.querySelector("#stoma"));
    expect(screen.getByText("Stoma")).toBeInTheDocument();
  });

  it("Leaf Cross Section Label Mode still passes", () => {
    render(<DiagramGame diagram={leaf} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
  });

  it("no console errors across a full Leaf Cross Section Mismatch session", () => {
    const { container } = openLeafMismatchMode();
    LEAF_NAMES.forEach(name => resolveLabel(container, name));
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
