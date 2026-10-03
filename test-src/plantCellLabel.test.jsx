import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const plant = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg8"));
const PLANT_IDS = plant.structures.map(s => s.id);
const TOTAL = plant.structures.length; // 11
const CANONICAL_ORDER = plant.structures.map(s => s.name);

function makeDataTransfer() {
  const store = {};
  return {
    setData: (k, v) => { store[k] = v; },
    getData: (k) => store[k] || "",
    effectAllowed: null,
  };
}

function nameOf(id) {
  return plant.structures.find(s => s.id === id).name;
}

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openLabelMode() {
  const utils = render(<DiagramGame diagram={plant} />);
  fireEvent.click(screen.getByText("🏷 Label the Diagram"));
  return utils;
}

describe("Plant Cell (dg8) Label Mode — loads via Diagram Center, uses the generic mode", () => {
  it("Plant Cell → Label the Diagram loads through Diagram Center", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("Plant Cell"));
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
  });

  it("shows exactly 11 labels, matching the normalized structure names", () => {
    openLabelMode();
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    CANONICAL_ORDER.forEach(name => expect(screen.getByText(name)).toBeInTheDocument());
  });

  it("all 11 normalized structure ids are represented as SVG drop targets, no duplicates", () => {
    expect(new Set(PLANT_IDS).size).toBe(TOTAL);
    const { container } = openLabelMode();
    PLANT_IDS.forEach(id => {
      expect(container.querySelectorAll(`#${id}`).length).toBe(1);
    });
  });
});

describe("Plant Cell (dg8) Label Mode — correctness / placement", () => {
  it("drag-and-drop: correct placement locks the structure, gives success feedback, and increments progress exactly once", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    const chip = screen.getByText("Nucleus");
    const group = container.querySelector("#nucleus");

    fireEvent.dragStart(chip, { dataTransfer: dt });
    fireEvent.dragOver(group, { dataTransfer: dt });
    fireEvent.drop(group, { dataTransfer: dt });

    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText(/correct!/i)).toBeInTheDocument();
    expect(screen.queryByText("Nucleus")).not.toBeInTheDocument(); // locked out of the bank

    // Re-dropping onto the already-solved structure must be a no-op —
    // attemptPlace() short-circuits on placed.has(structureId), preventing
    // duplicate scoring.
    fireEvent.drop(group, { dataTransfer: dt });
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
  });

  it("drag-and-drop: wrong placement gives feedback, awards no progress, does not falsely mark the structure correct, and the label stays available for retry", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    const chip = screen.getByText("Ribosomes");
    const wrongGroup = container.querySelector("#cellWall");

    fireEvent.dragStart(chip, { dataTransfer: dt });
    fireEvent.dragOver(wrongGroup, { dataTransfer: dt });
    fireEvent.drop(wrongGroup, { dataTransfer: dt });

    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText("Ribosomes")).toBeInTheDocument(); // still in the bank, not consumed

    // Retry with the correct target succeeds.
    const rightGroup = container.querySelector("#ribosomes");
    fireEvent.dragStart(chip, { dataTransfer: dt });
    fireEvent.dragOver(rightGroup, { dataTransfer: dt });
    fireEvent.drop(rightGroup, { dataTransfer: dt });
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.queryByText("Ribosomes")).not.toBeInTheDocument();
  });

  it("wrong attempts do not produce an XP-earned message (precise, not a broad /XP/i match)", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Golgi Apparatus"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#nucleus"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#nucleus"), { dataTransfer: dt });
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.queryByText(/XP earned:/i)).not.toBeInTheDocument();
  });

  it("tap flow (mobile-equivalent, no hover dependency): tap label then tap structure places it; wrong tap is retryable", () => {
    const { container } = openLabelMode();
    const chloroplastChip = screen.getByText("Chloroplast");
    const wrongGroup = container.querySelector("#mitochondrion");
    const rightGroup = container.querySelector("#chloroplast");

    fireEvent.click(chloroplastChip);
    fireEvent.click(wrongGroup);
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText("Chloroplast")).toBeInTheDocument();

    fireEvent.click(chloroplastChip);
    fireEvent.click(rightGroup);
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.queryByText("Chloroplast")).not.toBeInTheDocument();
  });

  it("each label maps to exactly one structure id: every mismatched pairing (located by accessible chip text, not position) is rejected, only the true pairing succeeds (full matrix)", () => {
    const { container } = openLabelMode();
    let expectedProgress = 0;
    let remaining = [...PLANT_IDS]; // ids not yet correctly placed / still in the bank
    PLANT_IDS.forEach(structureId => {
      const group = container.querySelector(`#${structureId}`);
      remaining.filter(labelId => labelId !== structureId).forEach(labelId => {
        const chip = screen.getByText(nameOf(labelId));
        fireEvent.click(chip);
        fireEvent.click(group);
        expect(screen.getByText(`${expectedProgress} / ${TOTAL} Labels`)).toBeInTheDocument();
      });
      const correctChip = screen.getByText(nameOf(structureId));
      fireEvent.click(correctChip);
      fireEvent.click(group);
      expectedProgress += 1;
      remaining = remaining.filter(id => id !== structureId);
      expect(screen.getByText(`${expectedProgress} / ${TOTAL} Labels`)).toBeInTheDocument();
    });
    expect(expectedProgress).toBe(TOTAL);
    expect(screen.getByText(/All labels placed/i)).toBeInTheDocument();
  });
});

describe("Plant Cell (dg8) Label Mode — completion & XP", () => {
  it("all 11 correct placements reach 11/11 and show the completion state", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    PLANT_IDS.forEach(id => {
      const chip = screen.getByText(nameOf(id));
      const group = container.querySelector(`#${id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText(/All labels placed/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
  });

  it("XP reward is 60, and completion awards exactly 60 via the existing generic xpEarned calculation (not a new scoring system)", () => {
    expect(DIAGRAM_DATA.find(d => d.id === "dg8").xpReward).toBe(60);
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    PLANT_IDS.forEach(id => {
      const chip = screen.getByText(nameOf(id));
      const group = container.querySelector(`#${id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });
    // Precise assertion — deliberately not a broad /XP/i regex, which would
    // also match unrelated text like "Explore" (contains the substring "xp").
    const xpLine = screen.getByText(/XP earned:/);
    expect(xpLine.parentElement.textContent).toContain("XP earned: 60");
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getAllByText("60").length).toBe(1); // shown exactly once, not accumulating
  });

  it("post-completion: no remaining interaction surface exists to double-score or double-award XP", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    PLANT_IDS.forEach(id => {
      const chip = screen.getByText(nameOf(id));
      const group = container.querySelector(`#${id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();

    // The label bank is fully emptied (every chip locked/removed), so there
    // is no remaining draggable surface to re-trigger attemptPlace().
    expect(container.querySelectorAll("[draggable='true']").length).toBe(0);
    CANONICAL_ORDER.forEach(name => expect(screen.queryByText(name)).not.toBeInTheDocument());
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
    expect(screen.getAllByText("60").length).toBe(1);
  });

  it("Play Again resets to the correct initial state (0/11, fresh bank) with no leftover XP/progress", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    PLANT_IDS.forEach(id => {
      const chip = screen.getByText(nameOf(id));
      const group = container.querySelector(`#${id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels`)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.queryByText(/All labels placed/i)).not.toBeInTheDocument();
    expect(screen.queryByText("60")).not.toBeInTheDocument();
    CANONICAL_ORDER.forEach(name => expect(screen.getByText(name)).toBeInTheDocument());

    // Label interaction is available again after reset.
    const dt2 = makeDataTransfer();
    const chip = screen.getByText("Cell Wall");
    const group = container.querySelector("#cellWall");
    fireEvent.dragStart(chip, { dataTransfer: dt2 });
    fireEvent.dragOver(group, { dataTransfer: dt2 });
    fireEvent.drop(group, { dataTransfer: dt2 });
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
  });
});

describe("Plant Cell (dg8) Label Mode — state isolation / no leakage", () => {
  it("label progress does not leak between diagrams (fresh instance starts at 0)", () => {
    const { container: c1, unmount: unmount1 } = openLabelMode();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Cell Wall"), { dataTransfer: dt });
    fireEvent.dragOver(c1.querySelector("#cellWall"), { dataTransfer: dt });
    fireEvent.drop(c1.querySelector("#cellWall"), { dataTransfer: dt });
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
    unmount1();

    const prokaryotic = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg7"));
    render(<DiagramGame diagram={prokaryotic} />);
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    expect(screen.getByText("0 / 8 Labels")).toBeInTheDocument();
  });

  it("label progress does not leak between modes: switching away from and back to Label Mode resets it (generic remount behavior)", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Central Vacuole"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#centralVacuole"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#centralVacuole"), { dataTransfer: dt });
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();

    fireEvent.click(screen.getByText("🔍 Explore"));
    expect(screen.queryByText(new RegExp(`^\\d+ / ${TOTAL} Labels$`))).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText("Central Vacuole")).toBeInTheDocument();
  });
});

describe("Plant Cell (dg8) Label Mode — responsive layout", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "mobile", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): no horizontal overflow, SVG stays contained, labels/progress remain visible and drop targets reachable`, () => {
      setWidth(width);
      const { container, unmount } = openLabelMode();
      expect(container.querySelector("svg")).toBeTruthy();

      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");

      // Drop target reachable + progress readable at this width (tap flow,
      // which is what mobile/touch-equivalent interaction actually uses).
      fireEvent.click(screen.getByText("Nucleolus"));
      fireEvent.click(container.querySelector("#nucleolus"));
      expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();

      const badWidths = Array.from(container.querySelectorAll("[style]")).filter(el => {
        const w = el.style.width;
        return w && /^\d+(\.\d+)?px$/.test(w) && parseFloat(w) > width;
      });
      expect(badWidths).toHaveLength(0);

      unmount();
      setWidth(1280);
    });
  });

  it("completion UI remains usable at 390px mobile width", () => {
    setWidth(390);
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    PLANT_IDS.forEach(id => {
      const chip = screen.getByText(nameOf(id));
      const group = container.querySelector(`#${id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });
    expect(screen.getByText(/All labels placed/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play Again" })).toBeInTheDocument();
    setWidth(1280);
  });
});

describe("Plant Cell (dg8) Label Mode — accessibility", () => {
  it("label chips have a meaningful accessible name (their visible structure name) and are draggable/tap-reachable", () => {
    openLabelMode();
    CANONICAL_ORDER.forEach(name => {
      const chip = screen.getByText(name);
      expect(chip.getAttribute("draggable")).toBe("true");
    });
  });

  it("selected label state is visually represented (selected chip styling differs from unselected)", () => {
    openLabelMode();
    const chip = screen.getByText("Endoplasmic Reticulum");
    const before = chip.getAttribute("style");
    fireEvent.click(chip);
    const after = chip.getAttribute("style");
    expect(after).not.toBe(before);
  });

  it("completion state text is real, queryable text, and Play Again is a real accessible button", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    PLANT_IDS.forEach(id => {
      const chip = screen.getByText(nameOf(id));
      const group = container.querySelector(`#${id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });
    expect(screen.getByText(/All labels placed/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play Again" })).toBeInTheDocument();
  });
});

describe("Plant Cell (dg8) — foundation data integrity (unchanged by Label Mode)", () => {
  it("dg8 still has exactly 11 unique structure ids/names, xpReward 60, and acceptableAnswers present", () => {
    const raw8 = DIAGRAM_DATA.find(d => d.id === "dg8");
    expect(raw8.structures.length).toBe(11);
    expect(raw8.xpReward).toBe(60);
    const ids = raw8.structures.map(s => s.id);
    const names = raw8.structures.map(s => s.name);
    expect(new Set(ids).size).toBe(11);
    expect(new Set(names).size).toBe(11);
    raw8.structures.forEach(s => {
      expect(Array.isArray(s.quiz?.acceptableAnswers)).toBe(true);
      expect(s.quiz.acceptableAnswers.length).toBeGreaterThan(0);
    });
  });
});

describe("Plant Cell (dg8) — dg1–dg7 regression remains intact", () => {
  it("dg1 (Animal Cell) Label Mode still completes and awards its own xpReward (50)", () => {
    const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    const dt = makeDataTransfer();
    animalCell.structures.forEach(s => {
      const chip = screen.getByText(s.name);
      const group = container.querySelector(`#${s.id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });
    expect(screen.getByText(`${animalCell.structures.length} / ${animalCell.structures.length} Labels`)).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("dg7 (Prokaryotic Cell) is unmodified: 8 structures, XP 55, and still loads into Label Mode", () => {
    const dg7 = DIAGRAM_DATA.find(d => d.id === "dg7");
    expect(dg7.structures.length).toBe(8);
    expect(dg7.xpReward).toBe(55);
    const d = normalizeDiagram(dg7);
    const { container, unmount } = render(<DiagramGame diagram={d} />);
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    expect(screen.getByText("0 / 8 Labels")).toBeInTheDocument();
    d.structures.forEach(s => expect(container.querySelector(`#${s.id}`)).toBeTruthy());
    unmount();
  });

  it("dg2–dg6 Label Mode still loads with intact structure counts", () => {
    ["dg2", "dg3", "dg4", "dg5", "dg6"].forEach(id => {
      const d = normalizeDiagram(DIAGRAM_DATA.find(x => x.id === id));
      const { container, unmount } = render(<DiagramGame diagram={d} />);
      fireEvent.click(screen.getByText("🏷 Label the Diagram"));
      expect(screen.getByText(`0 / ${d.structures.length} Labels`)).toBeInTheDocument();
      d.structures.forEach(s => expect(container.querySelector(`#${s.id}`)).toBeTruthy());
      unmount();
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

describe("Plant Cell (dg8) — source-level reusability check", () => {
  it("LabelMode contains no dg8/Plant-Cell-specific conditionals or bespoke scoring logic", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function LabelMode(");
    const end = source.indexOf("\n}\n", start) + 1;
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);
    ["Cell Wall", "Plasma Membrane", "Cytoplasm", "Nucleus", "Nucleolus", "Chloroplast",
      "Central Vacuole", "Mitochondrion", "Endoplasmic Reticulum", "Golgi Apparatus", "Ribosomes"]
      .forEach(term => expect(body.includes(term)).toBe(false));
    expect(body.includes('diagram.id === "dg8"')).toBe(false);
    expect(body.includes('diagram.image.component === "plantCell"')).toBe(false);
  });
});
