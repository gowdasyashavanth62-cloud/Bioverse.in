import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const dna = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg4"));
const DNA_NAMES = dna.structures.map(s => s.name);
const DNA_IDS = dna.structures.map(s => s.id);
const TOTAL = dna.structures.length; // 7

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openDnaLabelMode() {
  const utils = render(<DiagramGame diagram={dna} />);
  fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
  return utils;
}

function makeDataTransfer() {
  const store = {};
  return { setData: (k, v) => { store[k] = v; }, getData: (k) => store[k] || "" };
}

describe("STEP 18J — DNA Double Helix Label Mode: data / rendering", () => {
  it("DNA Double Helix opens from Diagram Center", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("DNA Double Helix"));
    expect(screen.getByRole("button", { name: "🏷 Label the Diagram" })).toBeInTheDocument();
  });

  it("Label Mode opens and DNADoubleHelixSVG renders", () => {
    const { container } = openDnaLabelMode();
    expect(container.querySelector("svg").getAttribute("aria-label")).toMatch(/dna/i);
  });

  it("exactly 7 label challenges exist, drawn from diagram.structures, no legacy labels dependency", () => {
    openDnaLabelMode();
    expect(TOTAL).toBe(7);
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    DNA_NAMES.forEach(name => expect(screen.getByText(name)).toBeInTheDocument());
    expect(dna.labels).toBeUndefined();
  });

  it("all 7 normalized target IDs are exposed in the SVG, with no duplicates", () => {
    const { container } = openDnaLabelMode();
    expect(new Set(DNA_IDS).size).toBe(TOTAL);
    DNA_IDS.forEach(id => expect(container.querySelector(`#${id}`)).toBeTruthy());
  });
});

describe("STEP 18J — DNA Double Helix Label Mode: correctness", () => {
  it("every DNA structure can be correctly matched (desktop drag-drop-equivalent)", () => {
    DNA_IDS.forEach(id => {
      const { container, unmount } = openDnaLabelMode();
      const name = dna.structures.find(s => s.id === id).name;
      const dt = makeDataTransfer();
      fireEvent.dragStart(screen.getByText(name), { dataTransfer: dt });
      fireEvent.dragOver(container.querySelector(`#${id}`), { dataTransfer: dt });
      fireEvent.drop(container.querySelector(`#${id}`), { dataTransfer: dt });
      expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
      unmount();
    });
  });

  it("correct match locks the structure and produces success feedback", () => {
    const { container } = openDnaLabelMode();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Hydrogen Bond"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#hydrogenBond"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#hydrogenBond"), { dataTransfer: dt });
    expect(screen.getByText(/Hydrogen Bond — correct!/)).toBeInTheDocument();
    expect(screen.queryByText("Hydrogen Bond")).not.toBeInTheDocument(); // removed from bank once locked
  });

  it("incorrect match gives error feedback, does not lock, does not increment progress, and allows retry", () => {
    const { container } = openDnaLabelMode();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Adenine"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#thymine"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#thymine"), { dataTransfer: dt });
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText("Adenine")).toBeInTheDocument(); // still in bank

    fireEvent.dragStart(screen.getByText("Adenine"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#adenine"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#adenine"), { dataTransfer: dt });
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
  });

  it("more incorrect combinations (Phosphate→Deoxyribose, Hydrogen Bond→Cytosine) are rejected without locking or double-counting", () => {
    const { container } = openDnaLabelMode();
    const dt = makeDataTransfer();

    fireEvent.dragStart(screen.getByText("Phosphate"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#deoxyribose"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#deoxyribose"), { dataTransfer: dt });
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText("Phosphate")).toBeInTheDocument();

    fireEvent.dragStart(screen.getByText("Hydrogen Bond"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#cytosine"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#cytosine"), { dataTransfer: dt });
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText("Hydrogen Bond")).toBeInTheDocument();
  });
});

describe("STEP 18J — DNA Double Helix Label Mode: full completion / XP / reset", () => {
  it("completes all 7 structures, reaches 7/7, shows completion, correct score, XP = 55 from diagram.xpReward", () => {
    const { container } = openDnaLabelMode();
    const dt = makeDataTransfer();
    DNA_IDS.forEach(id => {
      const name = dna.structures.find(s => s.id === id).name;
      fireEvent.dragStart(screen.getByText(name), { dataTransfer: dt });
      fireEvent.dragOver(container.querySelector(`#${id}`), { dataTransfer: dt });
      fireEvent.drop(container.querySelector(`#${id}`), { dataTransfer: dt });
    });
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText(/All labels placed/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}\\/${TOTAL}`))).toBeInTheDocument();
    expect(dna.xpReward).toBe(55);
    const strong = container.querySelector("strong");
    const xp = Number(strong.textContent);
    expect(xp).toBe(55);
    expect(xp).toBeLessThanOrEqual(dna.xpReward);
  });

  it("Play Again resets progress/score/structures and generates a fresh session, with no duplicate-count leakage", () => {
    const { container } = openDnaLabelMode();
    const dt = makeDataTransfer();
    DNA_IDS.forEach(id => {
      const name = dna.structures.find(s => s.id === id).name;
      fireEvent.dragStart(screen.getByText(name), { dataTransfer: dt });
      fireEvent.dragOver(container.querySelector(`#${id}`), { dataTransfer: dt });
      fireEvent.drop(container.querySelector(`#${id}`), { dataTransfer: dt });
    });
    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    DNA_NAMES.forEach(name => expect(screen.getByText(name)).toBeInTheDocument());
  });
});

describe("STEP 18J — DNA Double Helix Label Mode: randomization", () => {
  it("multiple fresh sessions can produce different label bank orders", () => {
    const orders = [];
    for (let i = 0; i < 15; i++) {
      const { container, unmount } = openDnaLabelMode();
      const order = Array.from(container.querySelectorAll("[draggable='true']")).map(el => el.textContent);
      orders.push(order.join("|"));
      unmount();
    }
    expect(new Set(orders).size).toBeGreaterThan(1);
  });
});

describe("STEP 18J — DNA Double Helix Label Mode: mobile/tap-equivalent interaction", () => {
  it("tap a label then tap the correct structure locks it (correct mobile matching)", () => {
    const { container } = openDnaLabelMode();
    fireEvent.click(screen.getByText("Guanine"));
    fireEvent.click(container.querySelector("#guanine"));
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.queryByText("Guanine")).not.toBeInTheDocument();
  });

  it("tap a label then tap the wrong structure gives retry feedback (incorrect mobile matching)", () => {
    const { container } = openDnaLabelMode();
    fireEvent.click(screen.getByText("Cytosine"));
    fireEvent.click(container.querySelector("#phosphate"));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText("Cytosine")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cytosine"));
    fireEvent.click(container.querySelector("#cytosine"));
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
  });

  it("completes a full session via the mobile/tap-equivalent flow", () => {
    const { container } = openDnaLabelMode();
    DNA_IDS.forEach(id => {
      const name = dna.structures.find(s => s.id === id).name;
      fireEvent.click(screen.getByText(name));
      fireEvent.click(container.querySelector(`#${id}`));
    });
    expect(screen.getByText(`${TOTAL} / ${TOTAL} Labels`)).toBeInTheDocument();
  });
});

describe("STEP 18J — DNA Double Helix Label Mode: responsive", () => {
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
      const { container, unmount } = openDnaLabelMode();
      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");

      fireEvent.click(screen.getByText("Deoxyribose"));
      fireEvent.click(container.querySelector("#deoxyribose"));
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

describe("STEP 18J — accessibility", () => {
  it("labels and completion state remain accessible (real draggable/clickable elements, real buttons)", () => {
    const { container } = openDnaLabelMode();
    const dt = makeDataTransfer();
    DNA_IDS.forEach(id => {
      const name = dna.structures.find(s => s.id === id).name;
      fireEvent.dragStart(screen.getByText(name), { dataTransfer: dt });
      fireEvent.dragOver(container.querySelector(`#${id}`), { dataTransfer: dt });
      fireEvent.drop(container.querySelector(`#${id}`), { dataTransfer: dt });
    });
    expect(screen.getByText("Play Again").tagName).toBe("BUTTON");
  });
});

describe("STEP 18J — data isolation", () => {
  it("does not display Animal Cell, Human Heart, or Leaf Cross Section labels", () => {
    openDnaLabelMode();
    ["Nucleus", "Mitochondria", "Left Ventricle", "Aorta", "Vena Cava", "Epidermis", "Stoma", "Vascular Bundle"].forEach(name => {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    });
  });

  it("switching diagrams away from DNA Label Mode and back starts with fresh, non-leaked state", () => {
    const { container, unmount } = openDnaLabelMode();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Adenine"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#adenine"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#adenine"), { dataTransfer: dt });
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
    unmount();

    const leaf = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));
    render(<DiagramGame diagram={leaf} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.queryByText("Adenine")).not.toBeInTheDocument();
    expect(screen.getByText("0 / 6 Labels")).toBeInTheDocument();
  });
});

describe("STEP 18J — source-level reusability check", () => {
  it("LabelMode and DNADoubleHelixSVG contain no dg4/DNA-name-specific or dg1/dg2/dg3-specific conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const dnaNames = ["Adenine", "Thymine", "Guanine", "Cytosine", "Phosphate", "Deoxyribose", "Hydrogen Bond"];

    const lmStart = source.indexOf("function LabelMode(");
    const lmEnd = source.indexOf("function DiagramGame(", lmStart) > lmStart
      ? source.indexOf("function DiagramGame(", lmStart)
      : source.indexOf("function MismatchMode(", lmStart);
    expect(lmStart).toBeGreaterThan(-1);
    const lmBody = source.slice(lmStart, lmEnd);
    dnaNames.forEach(n => expect(lmBody.includes(n)).toBe(false));
    expect(lmBody.includes('diagram.id === "dg4"')).toBe(false);
    expect(lmBody.includes('diagram.id === "dg1"')).toBe(false);
    expect(lmBody.includes('diagram.id === "dg2"')).toBe(false);
    expect(lmBody.includes('diagram.id === "dg3"')).toBe(false);
    expect(source.includes("function DNADoubleHelixLabelMode")).toBe(false);
    expect(source.includes("function DNALabelMode")).toBe(false);

    const svgStart = source.indexOf("function DNADoubleHelixSVG(");
    const svgEnd = source.indexOf("const DIAGRAM_SVG_COMPONENTS", svgStart);
    expect(svgStart).toBeGreaterThan(-1);
    const svgBody = source.slice(svgStart, svgEnd);
    ["score", "xpReward", "acceptableAnswers", "placed", "bank"].forEach(term => {
      expect(svgBody.includes(term)).toBe(false);
    });
  });
});

describe("STEP 18J — regression", () => {
  const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
  const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
  const leaf = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));

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

  it("Leaf Cross Section Label Mode still passes", () => {
    const { container } = render(<DiagramGame diagram={leaf} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText("0 / 6 Labels")).toBeInTheDocument();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Stoma"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#stoma"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#stoma"), { dataTransfer: dt });
    expect(screen.getByText("1 / 6 Labels")).toBeInTheDocument();
  });

  it("DNA Explore Mode (Step 18I) still passes", () => {
    const { container } = render(<DiagramGame diagram={dna} />);
    fireEvent.click(container.querySelector("#adenine"));
    expect(screen.getByText("Adenine")).toBeInTheDocument();
  });

  it("DNA foundation data (Step 18H) remains intact", () => {
    expect(dna.title).toBe("DNA Double Helix");
    expect(dna.xpReward).toBe(55);
    expect(dna.structures.length).toBe(7);
  });

  it("no console errors across a full DNA Double Helix Label session", () => {
    const { container } = openDnaLabelMode();
    const dt = makeDataTransfer();
    DNA_IDS.forEach(id => {
      const name = dna.structures.find(s => s.id === id).name;
      fireEvent.dragStart(screen.getByText(name), { dataTransfer: dt });
      fireEvent.dragOver(container.querySelector(`#${id}`), { dataTransfer: dt });
      fireEvent.drop(container.querySelector(`#${id}`), { dataTransfer: dt });
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
