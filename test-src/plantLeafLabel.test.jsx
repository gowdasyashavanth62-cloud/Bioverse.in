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

function openLeafLabelMode() {
  const utils = render(<DiagramGame diagram={leaf} />);
  fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
  return utils;
}

function makeDataTransfer() {
  const store = {};
  return { setData: (k, v) => { store[k] = v; }, getData: (k) => store[k] || "" };
}

describe("STEP 18C — Leaf Cross Section Label Mode: data / rendering", () => {
  it("Leaf Cross Section opens from Diagram Center", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("Leaf Cross Section"));
    expect(screen.getByRole("button", { name: "🏷 Label the Diagram" })).toBeInTheDocument();
  });

  it("Label Mode opens and LeafCrossSectionSVG renders", () => {
    const { container } = openLeafLabelMode();
    expect(container.querySelector("svg").getAttribute("aria-label")).toMatch(/leaf/i);
  });

  it("exactly 6 label challenges exist, drawn from diagram.structures", () => {
    openLeafLabelMode();
    expect(TOTAL).toBe(6);
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    LEAF_NAMES.forEach(name => expect(screen.getByText(name)).toBeInTheDocument());
  });
});

describe("STEP 18C — Leaf Cross Section Label Mode: correctness", () => {
  it("every Leaf Cross Section structure can be correctly matched (desktop drag-drop)", () => {
    LEAF_IDS.forEach(id => {
      const { container, unmount } = openLeafLabelMode();
      const name = leaf.structures.find(s => s.id === id).name;
      const dt = makeDataTransfer();
      fireEvent.dragStart(screen.getByText(name), { dataTransfer: dt });
      fireEvent.dragOver(container.querySelector(`#${id}`), { dataTransfer: dt });
      fireEvent.drop(container.querySelector(`#${id}`), { dataTransfer: dt });
      expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
      unmount();
    });
  });

  it("correct match locks the structure and produces success feedback", () => {
    const { container } = openLeafLabelMode();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Stoma"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#stoma"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#stoma"), { dataTransfer: dt });
    expect(screen.getByText(/Stoma — correct!/)).toBeInTheDocument();
    expect(screen.queryByText("Stoma")).not.toBeInTheDocument(); // removed from bank once locked
  });

  it("incorrect match gives error feedback, does not lock, does not increment progress, and allows retry", () => {
    const { container } = openLeafLabelMode();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Palisade Layer"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#vascularBundle"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#vascularBundle"), { dataTransfer: dt });
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText("Palisade Layer")).toBeInTheDocument(); // still in bank

    // Retry with the correct structure.
    fireEvent.dragStart(screen.getByText("Palisade Layer"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#palisadeLayer"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#palisadeLayer"), { dataTransfer: dt });
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
  });

  it("more incorrect combinations (Epidermis→Stoma, Guard Cell→Spongy Layer) are rejected without locking", () => {
    const { container } = openLeafLabelMode();
    const dt = makeDataTransfer();

    fireEvent.dragStart(screen.getByText("Epidermis"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#stoma"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#stoma"), { dataTransfer: dt });
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText("Epidermis")).toBeInTheDocument();

    fireEvent.dragStart(screen.getByText("Guard Cell"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#spongyLayer"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#spongyLayer"), { dataTransfer: dt });
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText("Guard Cell")).toBeInTheDocument();
  });
});

describe("STEP 18C — Leaf Cross Section Label Mode: full completion / XP / Play Again", () => {
  it("completes all 6 structures, reaches 6/6, shows completion, correct score, XP capped at 45", () => {
    const { container } = openLeafLabelMode();
    const dt = makeDataTransfer();
    LEAF_IDS.forEach(id => {
      const name = leaf.structures.find(s => s.id === id).name;
      fireEvent.dragStart(screen.getByText(name), { dataTransfer: dt });
      fireEvent.dragOver(container.querySelector(`#${id}`), { dataTransfer: dt });
      fireEvent.drop(container.querySelector(`#${id}`), { dataTransfer: dt });
    });
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText(/All labels placed/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}\\/${TOTAL}`))).toBeInTheDocument();
    const strong = container.querySelector("strong");
    const xp = Number(strong.textContent);
    expect(xp).toBe(45); // leaf.xpReward, exact at 6/6
    expect(xp).toBeLessThanOrEqual(leaf.xpReward);
  });

  it("Play Again resets progress/score/structures and generates a fresh session", () => {
    const { container } = openLeafLabelMode();
    const dt = makeDataTransfer();
    LEAF_IDS.forEach(id => {
      const name = leaf.structures.find(s => s.id === id).name;
      fireEvent.dragStart(screen.getByText(name), { dataTransfer: dt });
      fireEvent.dragOver(container.querySelector(`#${id}`), { dataTransfer: dt });
      fireEvent.drop(container.querySelector(`#${id}`), { dataTransfer: dt });
    });
    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    LEAF_NAMES.forEach(name => expect(screen.getByText(name)).toBeInTheDocument());
  });
});

describe("STEP 18C — Leaf Cross Section Label Mode: randomization", () => {
  it("multiple fresh sessions can produce different label bank orders", () => {
    const orders = [];
    for (let i = 0; i < 15; i++) {
      const { container, unmount } = openLeafLabelMode();
      const order = Array.from(container.querySelectorAll("[draggable='true']")).map(el => el.textContent);
      orders.push(order.join("|"));
      unmount();
    }
    expect(new Set(orders).size).toBeGreaterThan(1);
  });
});

describe("STEP 18C — Leaf Cross Section Label Mode: mobile/tap-equivalent interaction", () => {
  it("tap a label then tap the correct structure locks it (correct mobile matching)", () => {
    const { container } = openLeafLabelMode();
    fireEvent.click(screen.getByText("Vascular Bundle"));
    fireEvent.click(container.querySelector("#vascularBundle"));
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.queryByText("Vascular Bundle")).not.toBeInTheDocument();
  });

  it("tap a label then tap the wrong structure gives retry feedback (incorrect mobile matching)", () => {
    const { container } = openLeafLabelMode();
    fireEvent.click(screen.getByText("Guard Cell"));
    fireEvent.click(container.querySelector("#epidermis"));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText("Guard Cell")).toBeInTheDocument();

    // Retry correctly.
    fireEvent.click(screen.getByText("Guard Cell"));
    fireEvent.click(container.querySelector("#guardCell"));
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
  });
});

describe("STEP 18C — Leaf Cross Section Label Mode: responsive", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "laptop/tablet", width: 1024, expectGrid: true },
    { label: "mobile", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): no horizontal overflow, SVG + label bank usable, tap works`, () => {
      setWidth(width);
      const { container, unmount } = openLeafLabelMode();
      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");

      // Touch-equivalent interaction must work at every width.
      fireEvent.click(screen.getByText("Spongy Layer"));
      fireEvent.click(container.querySelector("#spongyLayer"));
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
});

describe("STEP 18C — data isolation", () => {
  it("does not display Animal Cell or Human Heart labels", () => {
    openLeafLabelMode();
    ["Nucleus", "Mitochondria", "Left Ventricle", "Aorta", "Vena Cava"].forEach(name => {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    });
  });
});

describe("STEP 18C — source-level reusability check", () => {
  it("LabelMode and LeafCrossSectionSVG contain no dg3/leaf-name-specific or dg1/dg2-specific conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const leafNames = ["Epidermis", "Palisade Layer", "Spongy Layer", "Vascular Bundle", "Guard Cell", "Stoma"];

    const lmStart = source.indexOf("function LabelMode(");
    const lmEnd = source.indexOf("function DiagramGame(", lmStart) > lmStart
      ? source.indexOf("function DiagramGame(", lmStart)
      : source.indexOf("function MismatchMode(", lmStart);
    expect(lmStart).toBeGreaterThan(-1);
    const lmBody = source.slice(lmStart, lmEnd);
    leafNames.forEach(n => expect(lmBody.includes(n)).toBe(false));
    expect(lmBody.includes('diagram.id === "dg3"')).toBe(false);
    expect(lmBody.includes('diagram.id === "dg1"')).toBe(false);
    expect(lmBody.includes('diagram.id === "dg2"')).toBe(false);
    expect(source.includes("function LeafCrossSectionLabelMode")).toBe(false);
    expect(source.includes("dg3LabelGame")).toBe(false);

    const svgStart = source.indexOf("function LeafCrossSectionSVG(");
    const svgEnd = source.indexOf("const DIAGRAM_SVG_COMPONENTS", svgStart);
    expect(svgStart).toBeGreaterThan(-1);
    const svgBody = source.slice(svgStart, svgEnd);
    ["score", "xpReward", "acceptableAnswers", "placed", "bank"].forEach(term => {
      expect(svgBody.includes(term)).toBe(false);
    });
  });
});

describe("STEP 18C — regression", () => {
  const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
  const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));

  it("Animal Cell Label Mode still passes", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Nucleus"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#nucleus"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#nucleus"), { dataTransfer: dt });
    expect(screen.getByText("1 / 7 Labels")).toBeInTheDocument();
  });

  it("Human Heart Label Mode still passes", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Aorta"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#aorta"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#aorta"), { dataTransfer: dt });
    expect(screen.getByText("1 / 7 Labels")).toBeInTheDocument();
  });

  it("Animal Cell Explore Mode still passes", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(container.querySelector("#nucleus"));
    expect(screen.getByText("Nucleus")).toBeInTheDocument();
  });

  it("Human Heart Explore Mode still passes", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    fireEvent.click(container.querySelector("#aorta"));
    expect(screen.getByText("Aorta")).toBeInTheDocument();
  });

  it("no console errors across a full Leaf Cross Section Label session", () => {
    const { container } = openLeafLabelMode();
    const dt = makeDataTransfer();
    LEAF_IDS.forEach(id => {
      const name = leaf.structures.find(s => s.id === id).name;
      fireEvent.dragStart(screen.getByText(name), { dataTransfer: dt });
      fireEvent.dragOver(container.querySelector(`#${id}`), { dataTransfer: dt });
      fireEvent.drop(container.querySelector(`#${id}`), { dataTransfer: dt });
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
