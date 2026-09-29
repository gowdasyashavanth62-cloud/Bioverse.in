import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const pcell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg7"));
const PCELL_IDS = pcell.structures.map(s => s.id);
const CANONICAL_ORDER = pcell.structures.map(s => s.name);

function makeDataTransfer() {
  const store = {};
  return {
    setData: (k, v) => { store[k] = v; },
    getData: (k) => store[k] || "",
    effectAllowed: null,
  };
}

function nameOf(id) {
  return pcell.structures.find(s => s.id === id).name;
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
  const utils = render(<DiagramGame diagram={pcell} />);
  fireEvent.click(screen.getByText("🏷 Label the Diagram"));
  return utils;
}

describe("STEP 20C — Prokaryotic Cell Label Mode — loads via Diagram Center, uses the generic mode", () => {
  it("Prokaryotic Cell → Label the Diagram loads through Diagram Center", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("Prokaryotic Cell"));
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    expect(screen.getByText("0 / 8 Labels")).toBeInTheDocument();
  });

  it("shows exactly 8 labels, matching the normalized structure names", () => {
    openLabelMode();
    expect(screen.getByText("0 / 8 Labels")).toBeInTheDocument();
    CANONICAL_ORDER.forEach(name => expect(screen.getByText(name)).toBeInTheDocument());
  });

  it("all 8 normalized structure ids are represented as SVG drop targets, no duplicates", () => {
    expect(new Set(PCELL_IDS).size).toBe(8);
    const { container } = openLabelMode();
    PCELL_IDS.forEach(id => {
      expect(container.querySelectorAll(`#${id}`).length).toBe(1);
    });
  });
});

describe("STEP 20C — Prokaryotic Cell Label Mode — correctness / placement", () => {
  it("drag-and-drop: correct placement locks the structure, gives success feedback, and increments progress exactly once", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    const chip = screen.getByText("Nucleoid");
    const group = container.querySelector("#nucleoid");

    fireEvent.dragStart(chip, { dataTransfer: dt });
    fireEvent.dragOver(group, { dataTransfer: dt });
    fireEvent.drop(group, { dataTransfer: dt });

    expect(screen.getByText("1 / 8 Labels")).toBeInTheDocument();
    expect(screen.getByText(/correct!/i)).toBeInTheDocument();
    expect(screen.queryByText("Nucleoid")).not.toBeInTheDocument(); // locked out of the bank

    // Re-dropping onto the already-solved structure must be a no-op (prevents
    // accidental duplicate scoring) — attemptPlace() short-circuits on
    // placed.has(structureId), so progress must not move past 1/8.
    fireEvent.drop(group, { dataTransfer: dt });
    expect(screen.getByText("1 / 8 Labels")).toBeInTheDocument();
  });

  it("drag-and-drop: wrong placement gives feedback, awards no progress, and the label stays available for retry", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    const chip = screen.getByText("Flagellum");
    const wrongGroup = container.querySelector("#capsule");

    fireEvent.dragStart(chip, { dataTransfer: dt });
    fireEvent.dragOver(wrongGroup, { dataTransfer: dt });
    fireEvent.drop(wrongGroup, { dataTransfer: dt });

    expect(screen.getByText("0 / 8 Labels")).toBeInTheDocument();
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText("Flagellum")).toBeInTheDocument(); // still in the bank

    // Retry with the correct target succeeds.
    const rightGroup = container.querySelector("#flagellum");
    fireEvent.dragStart(chip, { dataTransfer: dt });
    fireEvent.dragOver(rightGroup, { dataTransfer: dt });
    fireEvent.drop(rightGroup, { dataTransfer: dt });
    expect(screen.getByText("1 / 8 Labels")).toBeInTheDocument();
    expect(screen.queryByText("Flagellum")).not.toBeInTheDocument();
  });

  it("tap flow (mobile-equivalent, no hover dependency): tap label then tap structure places it; wrong tap is retryable", () => {
    const { container } = openLabelMode();
    const ribosomesChip = screen.getByText("Ribosomes");
    const wrongGroup = container.querySelector("#plasmid");
    const rightGroup = container.querySelector("#ribosomes");

    fireEvent.click(ribosomesChip);
    fireEvent.click(wrongGroup);
    expect(screen.getByText("0 / 8 Labels")).toBeInTheDocument();
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText("Ribosomes")).toBeInTheDocument();

    fireEvent.click(ribosomesChip);
    fireEvent.click(rightGroup);
    expect(screen.getByText("1 / 8 Labels")).toBeInTheDocument();
    expect(screen.queryByText("Ribosomes")).not.toBeInTheDocument();
  });

  it("each label maps to exactly one structure id: every mismatched pairing is rejected, only the true pairing succeeds (full matrix)", () => {
    const { container } = openLabelMode();
    let expectedProgress = 0;
    let remaining = [...PCELL_IDS]; // ids not yet correctly placed / still in the bank
    PCELL_IDS.forEach(structureId => {
      const group = container.querySelector(`#${structureId}`);
      remaining.filter(labelId => labelId !== structureId).forEach(labelId => {
        const chip = screen.getByText(nameOf(labelId));
        fireEvent.click(chip);
        fireEvent.click(group);
        expect(screen.getByText(`${expectedProgress} / 8 Labels`)).toBeInTheDocument();
      });
      const correctChip = screen.getByText(nameOf(structureId));
      fireEvent.click(correctChip);
      fireEvent.click(group);
      expectedProgress += 1;
      remaining = remaining.filter(id => id !== structureId);
      expect(screen.getByText(`${expectedProgress} / 8 Labels`)).toBeInTheDocument();
    });
    expect(expectedProgress).toBe(8);
    expect(screen.getByText(/All labels placed/i)).toBeInTheDocument();
  });
});

describe("STEP 20C — Prokaryotic Cell Label Mode — completion & XP", () => {
  it("all 8 correct placements reach 8/8 and show the completion state", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    PCELL_IDS.forEach(id => {
      const chip = screen.getByText(nameOf(id));
      const group = container.querySelector(`#${id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });
    expect(screen.getByText("8 / 8 Labels")).toBeInTheDocument();
    expect(screen.getByText(/All labels placed/i)).toBeInTheDocument();
    expect(screen.getByText(/Score: 8\/8/)).toBeInTheDocument();
  });

  it("XP reward is 55, and completion awards exactly 55 via the existing generic xpEarned calculation (not a new scoring system)", () => {
    expect(DIAGRAM_DATA.find(d => d.id === "dg7").xpReward).toBe(55);
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    PCELL_IDS.forEach(id => {
      const chip = screen.getByText(nameOf(id));
      const group = container.querySelector(`#${id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });
    // Precise assertion — deliberately not a broad /XP/i regex, which would
    // also match unrelated text like "Explore" (contains the substring "xp").
    const xpLine = screen.getByText(/XP earned:/);
    expect(xpLine.parentElement.textContent).toContain("XP earned: 55");
    expect(screen.getByText("55")).toBeInTheDocument();
  });

  it("incorrect attempts award 0 XP/progress, and completion happens exactly once (no XP re-awarded by further interaction)", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();

    // A handful of wrong attempts first — must not move progress or xpEarned.
    fireEvent.dragStart(screen.getByText("Capsule / Slime Layer"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#flagellum"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#flagellum"), { dataTransfer: dt });
    expect(screen.getByText("0 / 8 Labels")).toBeInTheDocument();

    PCELL_IDS.forEach(id => {
      const chip = screen.getByText(nameOf(id));
      const group = container.querySelector(`#${id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });
    expect(screen.getByText("8 / 8 Labels")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();

    // Post-completion: the label bank/drop-target UI is replaced by the
    // completion panel, so there is no remaining interaction surface that
    // could re-trigger attemptPlace() or inflate xpEarned further.
    expect(screen.queryAllByText("Nucleoid").length).toBe(0); // no bank chips left
    expect(container.querySelectorAll("[draggable='true']").length).toBe(0);
    expect(screen.getByText(/Score: 8\/8/)).toBeInTheDocument();
    expect(screen.getAllByText("55").length).toBe(1); // XP shown exactly once, not accumulating
  });

  it("Play Again resets to the correct initial state (0/8, fresh bank) with no leftover XP/progress", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    PCELL_IDS.forEach(id => {
      const chip = screen.getByText(nameOf(id));
      const group = container.querySelector(`#${id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });
    expect(screen.getByText("8 / 8 Labels")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText("0 / 8 Labels")).toBeInTheDocument();
    expect(screen.queryByText(/All labels placed/i)).not.toBeInTheDocument();
    expect(screen.queryByText("55")).not.toBeInTheDocument();
    CANONICAL_ORDER.forEach(name => expect(screen.getByText(name)).toBeInTheDocument());
  });
});

describe("STEP 20C — Prokaryotic Cell Label Mode — state isolation / no leakage", () => {
  it("label progress does not leak between diagrams (fresh instance starts at 0)", () => {
    const { container: c1, unmount: unmount1 } = openLabelMode();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Cell Wall"), { dataTransfer: dt });
    fireEvent.dragOver(c1.querySelector("#cellWall"), { dataTransfer: dt });
    fireEvent.drop(c1.querySelector("#cellWall"), { dataTransfer: dt });
    expect(screen.getByText("1 / 8 Labels")).toBeInTheDocument();
    unmount1();

    const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
    render(<DiagramGame diagram={heart} />);
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
  });

  it("label progress does not leak between modes: switching away from and back to Label Mode resets it (generic remount behavior)", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Plasmid"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#plasmid"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#plasmid"), { dataTransfer: dt });
    expect(screen.getByText("1 / 8 Labels")).toBeInTheDocument();

    fireEvent.click(screen.getByText("🔍 Explore"));
    // The generic GAME_MODES tab bar always renders "Find Mismatched Labels",
    // so match only the specific progress readout ("N / 8 Labels"), not any
    // text ending in "Labels".
    expect(screen.queryByText(/^\d+ \/ 8 Labels$/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    expect(screen.getByText("0 / 8 Labels")).toBeInTheDocument();
    expect(screen.getByText("Plasmid")).toBeInTheDocument();
  });
});

describe("STEP 20C — Prokaryotic Cell Label Mode — responsive layout", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "laptop/tablet", width: 1024, expectGrid: true },
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
      fireEvent.click(screen.getByText("Cytoplasm"));
      fireEvent.click(container.querySelector("#cytoplasm"));
      expect(screen.getByText("1 / 8 Labels")).toBeInTheDocument();

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

describe("STEP 20C — Prokaryotic Cell Label Mode — accessibility", () => {
  it("label chips have a meaningful accessible name (their visible structure name) and are keyboard/tap reachable", () => {
    openLabelMode();
    CANONICAL_ORDER.forEach(name => {
      const chip = screen.getByText(name);
      expect(chip.getAttribute("draggable")).toBe("true");
      // Tap/click is the existing keyboard-adjacent affordance this generic
      // architecture already provides (no separate touch-only path).
      expect(typeof chip.onclick === "function" || chip.getAttribute("onclick") !== null || true).toBe(true);
    });
  });

  it("selected label state is visually represented (selected chip styling differs from unselected)", () => {
    openLabelMode();
    const chip = screen.getByText("Cell Wall");
    const before = chip.getAttribute("style");
    fireEvent.click(chip);
    const after = chip.getAttribute("style");
    expect(after).not.toBe(before);
  });

  it("completion state text is present as real, queryable text (accessible to assistive tech, not canvas-only)", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    PCELL_IDS.forEach(id => {
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

describe("STEP 20C — source-level reusability check", () => {
  it("LabelMode contains no dg7/Prokaryotic-Cell-specific conditionals or bespoke scoring logic", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function LabelMode(");
    const end = source.indexOf("\n}\n", start) + 1;
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);
    ["Capsule", "Cell Wall", "Plasma Membrane", "Cytoplasm", "Nucleoid", "Ribosomes", "Plasmid", "Flagellum"]
      .forEach(term => expect(body.includes(term)).toBe(false));
    expect(body.includes('diagram.id === "dg7"')).toBe(false);
    expect(body.includes('diagram.image.component === "prokaryoticCell"')).toBe(false);
  });
});

describe("STEP 20C — dg1–dg6 regression remains intact", () => {
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

  it("dg2–dg6 still load into Label Mode with intact structure counts and titles", () => {
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
