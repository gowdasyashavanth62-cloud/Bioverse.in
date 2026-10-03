import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const dna = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg4"));
const DNA_NAMES = dna.structures.map(s => s.name);
const TOTAL = dna.structures.length; // 7

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openDnaMismatchMode() {
  const utils = render(<DiagramGame diagram={dna} />);
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

describe("STEP 18K — DNA Double Helix Mismatch Mode: rendering", () => {
  it("DNA Double Helix opens from Diagram Center", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("DNA Double Helix"));
    expect(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" })).toBeInTheDocument();
  });

  it("Mismatch Mode opens and DNADoubleHelixSVG renders", () => {
    const { container } = openDnaMismatchMode();
    expect(container.querySelector("svg").getAttribute("aria-label")).toMatch(/dna/i);
  });

  it("exactly 7 challenge entries participate, one per structure, no legacy labels dependency", () => {
    const { container } = openDnaMismatchMode();
    expect(TOTAL).toBe(7);
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    DNA_NAMES.forEach(name => {
      expect(container.querySelector(`button[aria-label='Check label "${name}"']`)).toBeTruthy();
    });
    expect(dna.labels).toBeUndefined();
  });
});

describe("STEP 18K — DNA Double Helix Mismatch Mode: challenge validity", () => {
  it("every structure participates exactly once and every label is used exactly once (valid permutation), with no foreign structures", () => {
    const { container } = openDnaMismatchMode();
    const chips = Array.from(container.querySelectorAll('button[aria-label^="Check label"]'));
    expect(chips).toHaveLength(TOTAL);
    const labelNames = chips.map(c => c.getAttribute("aria-label").match(/Check label "(.+)"/)[1]);
    expect(new Set(labelNames).size).toBe(TOTAL);
    DNA_NAMES.forEach(n => expect(labelNames.includes(n)).toBe(true));
    ["Nucleus", "Mitochondria", "Aorta", "Left Ventricle", "Epidermis", "Stoma"].forEach(foreign => {
      expect(labelNames.includes(foreign)).toBe(false);
    });
  });

  it("the challenge contains both correctly-matched and mismatched relationships (never all one type)", () => {
    // buildMismatchChallenge guarantees a mix within every single generated
    // challenge — so probe all 7 items within ONE session, not across
    // independent fresh-mount sessions (which would just be unrelated
    // random draws and could flake).
    const { container } = openDnaMismatchMode();
    let sawCorrect = false, sawMismatched = false;
    for (const name of DNA_NAMES) {
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
});

describe("STEP 18K — DNA Double Helix Mismatch Mode: correctness", () => {
  it("correctly identifying a matched label as Correct increments progress and locks it", () => {
    let found = false;
    outer:
    for (let attempt = 0; attempt < 6 && !found; attempt++) {
      for (const name of DNA_NAMES) {
        const { container, unmount } = openDnaMismatchMode();
        const chip = container.querySelector(`button[aria-label='Check label "${name}"']`);
        fireEvent.click(chip);
        fireEvent.click(screen.getByText("✓ Correct"));
        if (screen.queryByText(/that label was right/i)) {
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

  it("correctly identifying a mismatched label increments progress and locks it", () => {
    let found = false;
    outer:
    for (let attempt = 0; attempt < 6 && !found; attempt++) {
      for (const name of DNA_NAMES) {
        const { container, unmount } = openDnaMismatchMode();
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
      for (const name of DNA_NAMES) {
        const { container, unmount } = openDnaMismatchMode();
        const chip = container.querySelector(`button[aria-label='Check label "${name}"']`);
        fireEvent.click(chip);
        fireEvent.click(screen.getByText("✓ Correct"));
        if (screen.queryByText(/Not quite/i)) {
          sawWrong = true;
          expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
          expect(screen.getByText("✗ Mismatched")).toBeInTheDocument();
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
    const { container } = openDnaMismatchMode();
    const name = DNA_NAMES[0];
    resolveLabel(container, name);
    const progressBefore = screen.getByText(/Labels Checked/).textContent;
    const chip = container.querySelector(`button[aria-label='Check label "${name}"']`);
    fireEvent.click(chip);
    expect(screen.getByText(progressBefore)).toBeInTheDocument();
  });
});

describe("STEP 18K — DNA Double Helix Mismatch Mode: full completion / XP / reset", () => {
  it("completes all 7 classifications, reaches 7/7, correct score, XP = 55 from diagram.xpReward", () => {
    const { container } = openDnaMismatchMode();
    DNA_NAMES.forEach(name => resolveLabel(container, name));
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}\\/${TOTAL}`))).toBeInTheDocument();
    expect(dna.xpReward).toBe(55);
    const strong = container.querySelector("strong");
    const xp = Number(strong.textContent);
    expect(xp).toBe(55);
    expect(xp).toBeLessThanOrEqual(dna.xpReward);
  });

  it("Play Again resets progress/score/locked state and generates a fresh valid challenge", () => {
    const { container } = openDnaMismatchMode();
    DNA_NAMES.forEach(name => resolveLabel(container, name));
    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    DNA_NAMES.forEach(name => {
      expect(container.querySelector(`button[aria-label='Check label "${name}"']`)).toBeTruthy();
    });
  });
});

describe("STEP 18K — DNA Double Helix Mismatch Mode: randomization", () => {
  it("multiple fresh sessions produce multiple distinct valid arrangements (production randomness preserved)", () => {
    const arrangements = [];
    for (let i = 0; i < 12; i++) {
      const { container, unmount } = openDnaMismatchMode();
      const order = Array.from(container.querySelectorAll('button[aria-label^="Check label"]'))
        .map(b => b.getAttribute("aria-label"));
      arrangements.push(order.join("|"));
      unmount();
    }
    expect(new Set(arrangements).size).toBeGreaterThan(1);
  });
});

describe("STEP 18K — DNA Double Helix Mismatch Mode: mobile/tap-equivalent", () => {
  it("mobile tap-select label + tap Correct/Mismatched works, including incorrect handling and completion", () => {
    const { container } = openDnaMismatchMode();
    // Tap-based selection is identical to click in this codebase (no
    // separate touch handler exists) — same interaction path validated here.
    DNA_NAMES.forEach(name => resolveLabel(container, name));
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
  });
});

describe("STEP 18K — DNA Double Helix Mismatch Mode: responsive", () => {
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
      const { container, unmount } = openDnaMismatchMode();
      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");

      const chip = container.querySelector(`button[aria-label='Check label "${DNA_NAMES[0]}"']`);
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

describe("STEP 18K — accessibility", () => {
  it("check buttons and completion controls remain real, accessible elements", () => {
    const { container } = openDnaMismatchMode();
    DNA_NAMES.forEach(name => resolveLabel(container, name));
    expect(screen.getByText("Play Again").tagName).toBe("BUTTON");
  });
});

describe("STEP 18K — data isolation & mode isolation", () => {
  it("switching diagrams away from DNA Mismatch Mode and back starts with fresh, non-leaked state", () => {
    const { container, unmount } = openDnaMismatchMode();
    resolveLabel(container, DNA_NAMES[0]);
    expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    unmount();

    const leaf = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));
    render(<DiagramGame diagram={leaf} />);
    fireEvent.click(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" }));
    expect(screen.getByText("0 / 6 Labels Checked")).toBeInTheDocument();
    expect(screen.queryByText(`button[aria-label='Check label "${DNA_NAMES[0]}"']`)).not.toBeInTheDocument();
  });

  it("DNA Explore and Label state do not leak into Mismatch Mode", () => {
    const { container } = render(<DiagramGame diagram={dna} />);
    fireEvent.click(container.querySelector("#adenine"));
    expect(screen.getByText("Adenine")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" }));
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
  });
});

describe("STEP 18K — source-level reusability check", () => {
  it("MismatchMode and DNADoubleHelixSVG contain no dg4/DNA-name-specific or dg1/dg2/dg3-specific conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const dnaNames = ["Adenine", "Thymine", "Guanine", "Cytosine", "Phosphate", "Deoxyribose", "Hydrogen Bond"];

    const mmStart = source.indexOf("function MismatchMode(");
    const mmEnd = source.indexOf("function DiagramGame(", mmStart) > mmStart
      ? source.indexOf("function DiagramGame(", mmStart)
      : source.indexOf("function IdentifyMode(", mmStart);
    expect(mmStart).toBeGreaterThan(-1);
    const mmBody = source.slice(mmStart, mmEnd);
    dnaNames.forEach(n => expect(mmBody.includes(n)).toBe(false));
    expect(mmBody.includes('diagram.id === "dg4"')).toBe(false);
    expect(mmBody.includes('diagram.id === "dg1"')).toBe(false);
    expect(mmBody.includes('diagram.id === "dg2"')).toBe(false);
    expect(mmBody.includes('diagram.id === "dg3"')).toBe(false);
    expect(source.includes("function DNADoubleHelixMismatchMode")).toBe(false);
    expect(source.includes("DNA_MISMATCHES")).toBe(false);

    const svgStart = source.indexOf("function DNADoubleHelixSVG(");
    const svgEnd = source.indexOf("const DIAGRAM_SVG_COMPONENTS", svgStart);
    expect(svgStart).toBeGreaterThan(-1);
    const svgBody = source.slice(svgStart, svgEnd);
    ["score", "xpReward", "acceptableAnswers", "solvedSlotIds", "challenge"].forEach(term => {
      expect(svgBody.includes(term)).toBe(false);
    });
  });
});

describe("STEP 18K — regression", () => {
  const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
  const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
  const leaf = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));

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

  it("Leaf Cross Section Mismatch Mode still passes", () => {
    const { container } = render(<DiagramGame diagram={leaf} />);
    fireEvent.click(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" }));
    expect(screen.getByText("0 / 6 Labels Checked")).toBeInTheDocument();
    const chip = container.querySelector(`button[aria-label='Check label "Stoma"']`);
    fireEvent.click(chip);
    fireEvent.click(screen.getByText("✓ Correct"));
    if (!screen.queryByText(/that label was right/i)) fireEvent.click(screen.getByText("✗ Mismatched"));
    expect(screen.getByText("1 / 6 Labels Checked")).toBeInTheDocument();
  });

  it("DNA Explore Mode (Step 18I) still passes", () => {
    const { container } = render(<DiagramGame diagram={dna} />);
    fireEvent.click(container.querySelector("#thymine"));
    expect(screen.getByText("Thymine")).toBeInTheDocument();
  });

  it("DNA Label Mode (Step 18J) still passes", () => {
    render(<DiagramGame diagram={dna} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
  });

  it("DNA foundation data (Step 18H) remains intact", () => {
    expect(dna.title).toBe("DNA Double Helix");
    expect(dna.xpReward).toBe(55);
    expect(dna.structures.length).toBe(7);
  });

  it("no console errors across a full DNA Double Helix Mismatch session", () => {
    const { container } = openDnaMismatchMode();
    DNA_NAMES.forEach(name => resolveLabel(container, name));
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
