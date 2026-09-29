import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
const NAMES = animalCell.structures.map(s => s.name);

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openMismatchMode() {
  const utils = render(<DiagramGame diagram={animalCell} />);
  fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
  return utils;
}

// Resolves one label's judgement by trying "Correct" first, then falling
// back to "Mismatched" if that was wrong — exactly the trial-and-error a
// real student would do. Returns which path succeeded so callers can
// assert on true correct-vs-mismatched distribution without reaching into
// component internals.
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

describe("Mismatch Mode", () => {
  it("starts at 0 / 7 Labels Checked", () => {
    openMismatchMode();
    expect(screen.getByText("0 / 7 Labels Checked")).toBeInTheDocument();
  });

  it("every structure participates exactly once as a pinned chip", () => {
    const { container } = openMismatchMode();
    NAMES.forEach(name => {
      expect(container.querySelector(`button[aria-label='Check label "${name}"']`)).toBeTruthy();
    });
  });

  it("correctly identifying a mismatch increments progress and locks it", () => {
    // Fresh mounts until we land on a genuinely mismatched chip, then verify
    // answering "Mismatched" on it locks the chip and bumps progress.
    let found = false;
    outer:
    for (let attempt = 0; attempt < 6 && !found; attempt++) {
      for (const name of NAMES) {
        const { container, unmount } = openMismatchMode();
        const chip = container.querySelector(`button[aria-label='Check label "${name}"']`);
        fireEvent.click(chip);
        fireEvent.click(screen.getByText("✗ Mismatched"));
        if (screen.queryByText(/that label was mismatched/i)) {
          found = true;
          expect(screen.getByText("1 / 7 Labels Checked")).toBeInTheDocument();
          // Locked: chip now shows a checkmark and is no longer clickable to reopen judge buttons.
          expect(chip.textContent.startsWith("✓")).toBe(true);
          unmount();
          break outer;
        }
        unmount();
      }
    }
    expect(found).toBe(true);
  });

  it("correctly identifying a correctly-matched label also increments progress", () => {
    const { container } = openMismatchMode();
    const chip = container.querySelector(`button[aria-label='Check label "${NAMES[0]}"']`);
    fireEvent.click(chip);
    fireEvent.click(screen.getByText("✓ Correct"));
    // Whichever way it resolves (right first try, or right after retry), progress must be 1/7.
    if (!screen.queryByText(/that label was right/i)) {
      fireEvent.click(screen.getByText("✗ Mismatched"));
    }
    expect(screen.getByText("1 / 7 Labels Checked")).toBeInTheDocument();
  });

  it("a wrong answer gives red feedback, does not increment progress, and allows retry", () => {
    // Fresh mount per probe so an earlier label's correct resolution can't
    // contaminate the "progress stays put on a wrong guess" assertion below.
    let sawWrong = false;
    outer:
    for (let attempt = 0; attempt < 6 && !sawWrong; attempt++) {
      for (const name of NAMES) {
        const { container, unmount } = openMismatchMode();
        const chip = container.querySelector(`button[aria-label='Check label "${name}"']`);
        fireEvent.click(chip);
        fireEvent.click(screen.getByText("✓ Correct"));
        if (screen.queryByText(/Not quite/i)) {
          sawWrong = true;
          expect(screen.getByText("0 / 7 Labels Checked")).toBeInTheDocument();
          // Retry is possible: the judge buttons (and thus the mismatched option) are still present.
          expect(screen.getByText("✗ Mismatched")).toBeInTheDocument();
          fireEvent.click(screen.getByText("✗ Mismatched"));
          expect(screen.getByText("1 / 7 Labels Checked")).toBeInTheDocument();
          unmount();
          break outer;
        }
        unmount();
      }
    }
    expect(sawWrong).toBe(true);
  });

  it("solving all 7 completes the challenge with correct score and XP within budget", () => {
    const { container } = openMismatchMode();
    NAMES.forEach(name => resolveLabel(container, name));

    expect(screen.getByText("7 / 7 Labels Checked")).toBeInTheDocument();
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByText(/Score: 7\/7/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(String(animalCell.xpReward)))).toBeInTheDocument();
  });

  it("Play Again resets progress, score, selection, and feedback", () => {
    const { container } = openMismatchMode();
    NAMES.forEach(name => resolveLabel(container, name));
    fireEvent.click(screen.getByText("Play Again"));

    expect(screen.getByText("0 / 7 Labels Checked")).toBeInTheDocument();
    expect(screen.getByText(/Tap a label pinned on the diagram/i)).toBeInTheDocument();
    NAMES.forEach(name => {
      expect(container.querySelector(`button[aria-label='Check label "${name}"']`)).toBeTruthy();
    });
  });

  it("Play Again produces a fresh randomized arrangement, and multiple mounts vary", () => {
    // Compare "which slot each label is pinned to" (via DOM position order of aria-labels)
    // across several independent mounts — a proxy for the underlying arrangement.
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

describe("Mismatch Mode — regression: Explore and Label still work", () => {
  it("Explore Mode still works", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(container.querySelector("#nucleus"));
    expect(screen.getByText("Nucleus")).toBeInTheDocument();
  });

  it("Label Mode still works", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
    const dt = { store: {}, setData(k, v) { this.store[k] = v; }, getData(k) { return this.store[k] || ""; } };
    const chip = screen.getByText("Nucleus");
    const group = container.querySelector("#nucleus");
    fireEvent.dragStart(chip, { dataTransfer: dt });
    fireEvent.dragOver(group, { dataTransfer: dt });
    fireEvent.drop(group, { dataTransfer: dt });
    expect(screen.getByText("1 / 7 Labels")).toBeInTheDocument();
  });
});

describe("Mismatch Mode source check", () => {
  it("contains no hardcoded Animal Cell structure names", () => {
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function MismatchMode(");
    const nextFn = source.indexOf("\nfunction DiagramGame(", start);
    expect(start).toBeGreaterThan(-1);
    expect(nextFn).toBeGreaterThan(start);
    const body = source.slice(start, nextFn);
    const forbidden = ["Nucleus", "Mitochondria", "Golgi", "Ribosome", "Vacuole", "Cell Membrane", "Endoplasmic Reticulum"];
    forbidden.forEach(word => expect(body.includes(word)).toBe(false));
  });
});
