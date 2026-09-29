import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const stem = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg10"));
const STEM_IDS = stem.structures.map(s => s.id);
const TOTAL = stem.structures.length; // 10
const CANONICAL_ORDER = stem.structures.map(s => s.name);

function makeDataTransfer() {
  const store = {};
  return {
    setData: (k, v) => { store[k] = v; },
    getData: (k) => store[k] || "",
    effectAllowed: null,
  };
}

function nameOf(id) {
  return stem.structures.find(s => s.id === id).name;
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
  const utils = render(<DiagramGame diagram={stem} />);
  fireEvent.click(screen.getByText("🏷 Label the Diagram"));
  return utils;
}

function placeAllCorrectly(container) {
  const dt = makeDataTransfer();
  STEM_IDS.forEach(id => {
    const chip = screen.getByText(nameOf(id));
    const group = container.querySelector(`#${id}`);
    fireEvent.dragStart(chip, { dataTransfer: dt });
    fireEvent.dragOver(group, { dataTransfer: dt });
    fireEvent.drop(group, { dataTransfer: dt });
  });
}

describe("Dicot Stem (dg10) Label Mode -- loads via Diagram Center, uses the generic mode", () => {
  it("T.S. of a Dicot Stem -> Label the Diagram loads through Diagram Center", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("T.S. of a Dicot Stem"));
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
  });

  it("shows exactly 10 labels, matching the normalized structure names", () => {
    openLabelMode();
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    CANONICAL_ORDER.forEach(name => expect(screen.getByText(name)).toBeInTheDocument());
  });

  it("all 10 normalized structure ids are represented as SVG drop targets, no duplicates", () => {
    expect(new Set(STEM_IDS).size).toBe(TOTAL);
    const { container } = openLabelMode();
    STEM_IDS.forEach(id => {
      expect(container.querySelectorAll(`#${id}`).length).toBe(1);
    });
  });
});

describe("Dicot Stem (dg10) Label Mode -- correctness / placement", () => {
  it("drag-and-drop: correct placement locks the structure, gives success feedback, and increments progress exactly once", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    const chip = screen.getByText("Xylem");
    const group = container.querySelector("#xylem");

    fireEvent.dragStart(chip, { dataTransfer: dt });
    fireEvent.dragOver(group, { dataTransfer: dt });
    fireEvent.drop(group, { dataTransfer: dt });

    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText(/correct!/i)).toBeInTheDocument();
    expect(screen.queryByText("Xylem")).not.toBeInTheDocument(); // locked out of the bank

    // Re-dropping onto the already-solved structure must be a no-op --
    // attemptPlace() short-circuits on placed.has(structureId), preventing
    // duplicate scoring.
    fireEvent.drop(group, { dataTransfer: dt });
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
  });

  it("drag-and-drop: wrong placement gives feedback, awards no progress, does not falsely mark the structure correct, and the label stays available for retry", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    const chip = screen.getByText("Pith");
    const wrongGroup = container.querySelector("#epidermis");

    fireEvent.dragStart(chip, { dataTransfer: dt });
    fireEvent.dragOver(wrongGroup, { dataTransfer: dt });
    fireEvent.drop(wrongGroup, { dataTransfer: dt });

    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText("Pith")).toBeInTheDocument(); // still in the bank, not consumed
    expect(screen.getByText("Epidermis")).toBeInTheDocument(); // wrong target itself also not falsely locked

    // Retry with the correct target succeeds.
    const rightGroup = container.querySelector("#pith");
    fireEvent.dragStart(chip, { dataTransfer: dt });
    fireEvent.dragOver(rightGroup, { dataTransfer: dt });
    fireEvent.drop(rightGroup, { dataTransfer: dt });
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.queryByText("Pith")).not.toBeInTheDocument();
  });

  it("wrong attempts do not produce an XP-earned message (precise, not a broad /XP/i match)", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Cambium"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#cortex"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#cortex"), { dataTransfer: dt });
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.queryByText(/XP earned:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+\s*xp\b/i)).not.toBeInTheDocument();
  });

  it("tap flow (mobile-equivalent, no hover dependency): tap label then tap structure places it; wrong tap is retryable", () => {
    const { container } = openLabelMode();
    const phloemChip = screen.getByText("Phloem");
    const wrongGroup = container.querySelector("#xylem");
    const rightGroup = container.querySelector("#phloem");

    fireEvent.click(phloemChip);
    fireEvent.click(wrongGroup);
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText("Phloem")).toBeInTheDocument();

    fireEvent.click(phloemChip);
    fireEvent.click(rightGroup);
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.queryByText("Phloem")).not.toBeInTheDocument();
  });

  it("wrong-then-correct flow, repeated across several structurally different structures, including the 6-bundle-group ones (phloem/cambium/xylem/pericycle)", () => {
    const { container } = openLabelMode();
    const cases = [
      { wrongId: "epidermis", targetId: "cortex" },
      { wrongId: "endodermis", targetId: "pericycle" },
      { wrongId: "xylem", targetId: "phloem" },
      { wrongId: "cambium", targetId: "medullaryRay" },
      { wrongId: "hypodermis", targetId: "pith" },
    ];
    let expectedProgress = 0;
    cases.forEach(({ wrongId, targetId }) => {
      const targetGroup = container.querySelector(`#${targetId}`);
      // 1. choose an incorrect label
      const wrongChip = screen.getByText(nameOf(wrongId));
      fireEvent.click(wrongChip);
      // 2. verify it is rejected
      fireEvent.click(targetGroup);
      expect(screen.getByText(`${expectedProgress} / ${TOTAL} Labels`)).toBeInTheDocument();
      expect(screen.getByText(nameOf(wrongId))).toBeInTheDocument();
      // 3. choose the correct label
      const correctChip = screen.getByText(nameOf(targetId));
      fireEvent.click(correctChip);
      // 4. verify the target is accepted
      fireEvent.click(targetGroup);
      expectedProgress += 1;
      expect(screen.getByText(`${expectedProgress} / ${TOTAL} Labels`)).toBeInTheDocument();
      expect(screen.queryByText(nameOf(targetId))).not.toBeInTheDocument();
    });
  });

  it("each label maps to exactly one structure id: every mismatched pairing (located by accessible chip text, not position) is rejected, only the true pairing succeeds (full matrix)", () => {
    const { container } = openLabelMode();
    let expectedProgress = 0;
    let remaining = [...STEM_IDS]; // ids not yet correctly placed / still in the bank
    STEM_IDS.forEach(structureId => {
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

describe("Dicot Stem (dg10) Label Mode -- completion & XP", () => {
  it("all 10 correct placements reach 10/10 and show the completion state", () => {
    const { container } = openLabelMode();
    placeAllCorrectly(container);
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText(/All labels placed/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
  });

  it("XP reward is 63, and completion awards exactly 63 via the existing generic xpEarned calculation (not a new scoring system)", () => {
    expect(DIAGRAM_DATA.find(d => d.id === "dg10").xpReward).toBe(63);
    const { container } = openLabelMode();
    placeAllCorrectly(container);
    // Precise assertion -- deliberately not a broad /XP/i regex, which would
    // also match unrelated text like "Explore" (contains the substring "xp").
    const xpLine = screen.getByText(/XP earned:/);
    expect(xpLine.parentElement.textContent).toContain("XP earned: 63");
    expect(screen.getByText("63")).toBeInTheDocument();
    expect(screen.getAllByText("63").length).toBe(1); // shown exactly once, not accumulating
  });

  it("before completion the XP reward is absent; only appears once full completion is reached", () => {
    const { container } = openLabelMode();
    expect(screen.queryByText(/XP earned:/i)).not.toBeInTheDocument();
    // Place 9 of 10 correctly -- still not complete.
    const dt = makeDataTransfer();
    STEM_IDS.slice(0, TOTAL - 1).forEach(id => {
      const chip = screen.getByText(nameOf(id));
      const group = container.querySelector(`#${id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });
    expect(screen.getByText(`${TOTAL - 1} / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.queryByText(/XP earned:/i)).not.toBeInTheDocument();
    // The 10th and final correct placement completes it.
    const lastId = STEM_IDS[TOTAL - 1];
    const chip = screen.getByText(nameOf(lastId));
    const group = container.querySelector(`#${lastId}`);
    fireEvent.dragStart(chip, { dataTransfer: dt });
    fireEvent.dragOver(group, { dataTransfer: dt });
    fireEvent.drop(group, { dataTransfer: dt });
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
    const xpLine = screen.getByText(/XP earned:/);
    expect(xpLine.parentElement.textContent).toContain("XP earned: 63");
  });

  it("post-completion: no remaining interaction surface exists to double-score or double-award XP", () => {
    const { container } = openLabelMode();
    placeAllCorrectly(container);
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText("63")).toBeInTheDocument();

    // The label bank is fully emptied (every chip locked/removed), so there
    // is no remaining draggable surface to re-trigger attemptPlace().
    expect(container.querySelectorAll("[draggable='true']").length).toBe(0);
    CANONICAL_ORDER.forEach(name => expect(screen.queryByText(name)).not.toBeInTheDocument());
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
    expect(screen.getAllByText("63").length).toBe(1);

    // Even attempting a drop directly on an already-locked structure group
    // (bypassing the now-empty bank) cannot alter the score or XP.
    const dt = makeDataTransfer();
    dt.setData("text/plain", "xylem");
    fireEvent.drop(container.querySelector("#xylem"), { dataTransfer: dt });
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getAllByText("63").length).toBe(1);
  });

  it("Play Again resets to the correct initial state (0/10, fresh bank) with no leftover XP/progress", () => {
    const { container } = openLabelMode();
    placeAllCorrectly(container);
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels`)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.queryByText(/All labels placed/i)).not.toBeInTheDocument();
    expect(screen.queryByText("63")).not.toBeInTheDocument();
    CANONICAL_ORDER.forEach(name => expect(screen.getByText(name)).toBeInTheDocument());

    // Label interaction is available again after reset.
    const dt2 = makeDataTransfer();
    const chip = screen.getByText("Epidermis");
    const group = container.querySelector("#epidermis");
    fireEvent.dragStart(chip, { dataTransfer: dt2 });
    fireEvent.dragOver(group, { dataTransfer: dt2 });
    fireEvent.drop(group, { dataTransfer: dt2 });
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();

    // A fresh session can be completed again in full.
    STEM_IDS.filter(id => id !== "epidermis").forEach(id => {
      const c = screen.getByText(nameOf(id));
      const g = container.querySelector(`#${id}`);
      fireEvent.dragStart(c, { dataTransfer: dt2 });
      fireEvent.dragOver(g, { dataTransfer: dt2 });
      fireEvent.drop(g, { dataTransfer: dt2 });
    });
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText("63")).toBeInTheDocument();
  });
});

describe("Dicot Stem (dg10) Label Mode -- state isolation / no leakage", () => {
  it("label progress does not leak between diagrams (fresh instance starts at 0)", () => {
    const { container: c1, unmount: unmount1 } = openLabelMode();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Epidermis"), { dataTransfer: dt });
    fireEvent.dragOver(c1.querySelector("#epidermis"), { dataTransfer: dt });
    fireEvent.drop(c1.querySelector("#epidermis"), { dataTransfer: dt });
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
    unmount1();

    const dicotRoot = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg9"));
    render(<DiagramGame diagram={dicotRoot} />);
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    expect(screen.getByText("0 / 9 Labels")).toBeInTheDocument();
  });

  it("label progress does not leak between modes: switching away from and back to Label Mode resets it (generic remount behavior)", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Cortex"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#cortex"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#cortex"), { dataTransfer: dt });
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();

    fireEvent.click(screen.getByText("🔍 Explore"));
    expect(screen.queryByText(new RegExp(`^\\d+ / ${TOTAL} Labels$`))).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText("Cortex")).toBeInTheDocument();
  });
});

describe("Dicot Stem (dg10) Label Mode -- responsive layout", () => {
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
      fireEvent.click(screen.getByText("Pericycle"));
      fireEvent.click(container.querySelector("#pericycle"));
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

  it("all 10 labels remain usable at 390px mobile width, individually", () => {
    setWidth(390);
    STEM_IDS.forEach(id => {
      const { container, unmount } = openLabelMode();
      fireEvent.click(screen.getByText(nameOf(id)));
      fireEvent.click(container.querySelector(`#${id}`));
      expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
      unmount();
    });
    setWidth(1280);
  });

  it("all 10 labels remain usable at 412px mobile width, individually", () => {
    setWidth(412);
    STEM_IDS.forEach(id => {
      const { container, unmount } = openLabelMode();
      fireEvent.click(screen.getByText(nameOf(id)));
      fireEvent.click(container.querySelector(`#${id}`));
      expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
      unmount();
    });
    setWidth(1280);
  });

  it("completion UI remains usable at 390px mobile width", () => {
    setWidth(390);
    const { container } = openLabelMode();
    placeAllCorrectly(container);
    expect(screen.getByText(/All labels placed/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play Again" })).toBeInTheDocument();
    setWidth(1280);
  });
});

describe("Dicot Stem (dg10) Label Mode -- accessibility", () => {
  it("label chips have a meaningful accessible name (their visible structure name) and are draggable/tap-reachable", () => {
    openLabelMode();
    CANONICAL_ORDER.forEach(name => {
      const chip = screen.getByText(name);
      expect(chip.getAttribute("draggable")).toBe("true");
    });
  });

  it("selected label state is visually represented (selected chip styling differs from unselected)", () => {
    openLabelMode();
    const chip = screen.getByText("Endodermis");
    const before = chip.getAttribute("style");
    fireEvent.click(chip);
    const after = chip.getAttribute("style");
    expect(after).not.toBe(before);
  });

  it("completion state text is real, queryable text, and Play Again is a real accessible button", () => {
    const { container } = openLabelMode();
    placeAllCorrectly(container);
    expect(screen.getByText(/All labels placed/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play Again" })).toBeInTheDocument();
  });
});

describe("Dicot Stem (dg10) -- foundation data integrity (unchanged by Label Mode)", () => {
  it("dg10 still has exactly 10 unique structure ids/names, xpReward 63, and acceptableAnswers present", () => {
    const raw10 = DIAGRAM_DATA.find(d => d.id === "dg10");
    expect(raw10.structures.length).toBe(10);
    expect(raw10.xpReward).toBe(63);
    const ids = raw10.structures.map(s => s.id);
    const names = raw10.structures.map(s => s.name);
    expect(new Set(ids).size).toBe(10);
    expect(new Set(names).size).toBe(10);
    raw10.structures.forEach(s => {
      expect(Array.isArray(s.quiz?.acceptableAnswers)).toBe(true);
      expect(s.quiz.acceptableAnswers.length).toBeGreaterThan(0);
    });
  });
});

describe("Dicot Stem (dg10) -- dg1-dg9 regression remains intact", () => {
  it("dg9 (Dicot Root) is unmodified: 9 structures, XP 65, and still loads into Label Mode", () => {
    const dg9 = DIAGRAM_DATA.find(d => d.id === "dg9");
    expect(dg9.structures.length).toBe(9);
    expect(dg9.xpReward).toBe(65);
    const d = normalizeDiagram(dg9);
    const { container, unmount } = render(<DiagramGame diagram={d} />);
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    expect(screen.getByText("0 / 9 Labels")).toBeInTheDocument();
    d.structures.forEach(s => expect(container.querySelector(`#${s.id}`)).toBeTruthy());
    unmount();
  });

  it("dg9's own Label Mode completion still works exactly as before, unaffected by dg10's addition", () => {
    const dg9 = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg9"));
    const dt = makeDataTransfer();
    const { container } = render(<DiagramGame diagram={dg9} />);
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    dg9.structures.forEach(s => {
      const chip = screen.getByText(s.name);
      const group = container.querySelector(`#${s.id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });
    expect(screen.getByText("9 / 9 Labels")).toBeInTheDocument();
    expect(screen.getByText(/XP earned:/).parentElement.textContent).toContain("XP earned: 65");
  });

  it("dg1-dg8 Label Mode still loads with intact structure counts", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6", "dg7", "dg8"].forEach(id => {
      const d = normalizeDiagram(DIAGRAM_DATA.find(x => x.id === id));
      const { container, unmount } = render(<DiagramGame diagram={d} />);
      fireEvent.click(screen.getByText("🏷 Label the Diagram"));
      expect(screen.getByText(`0 / ${d.structures.length} Labels`)).toBeInTheDocument();
      d.structures.forEach(s => expect(container.querySelector(`#${s.id}`)).toBeTruthy());
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
});

describe("Dicot Stem (dg10) -- source-level reusability check", () => {
  it("LabelMode contains no dg10/Dicot-Stem-specific conditionals or bespoke scoring logic", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function LabelMode(");
    const end = source.indexOf("\n}\n", start) + 1;
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);
    ["Epidermis", "Hypodermis", "Cortex", "Endodermis", "Pericycle", "Xylem", "Phloem", "Cambium", "Medullary Ray", "Pith"]
      .forEach(term => expect(body.includes(term)).toBe(false));
    expect(body.includes('diagram.id === "dg10"')).toBe(false);
    expect(body.includes('diagram.image.component === "dicotStem"')).toBe(false);
  });
});
