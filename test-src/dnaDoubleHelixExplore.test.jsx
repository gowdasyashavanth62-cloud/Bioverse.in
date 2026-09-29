import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram, DIAGRAM_SVG_COMPONENTS } from "./AppUnderTest.jsx";

const dna = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg4"));
const DNA_IDS = dna.structures.map(s => s.id);

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

describe("STEP 18I — DNA Double Helix Explore Mode", () => {
  it("DNA Double Helix opens from Diagram Center and defaults to Explore", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("DNA Double Helix"));
    expect(screen.getByRole("button", { name: "🔍 Explore" })).toBeInTheDocument();
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
  });

  it("uses DNADoubleHelixSVG (registered, not a placeholder or another diagram's renderer)", () => {
    const { container } = render(<DiagramGame diagram={dna} />);
    const svg = container.querySelector("svg");
    expect(svg.getAttribute("aria-label")).toMatch(/dna/i);
    expect(DIAGRAM_SVG_COMPONENTS[dna.image.component]).toBeTruthy();
  });

  it("all 7 structures are represented as selectable SVG groups, each with a unique id", () => {
    const { container } = render(<DiagramGame diagram={dna} />);
    expect(DNA_IDS.length).toBe(7);
    expect(new Set(DNA_IDS).size).toBe(7);
    DNA_IDS.forEach(id => {
      const g = container.querySelector(`#${id}`);
      expect(g).toBeTruthy();
      expect(g.tagName.toLowerCase()).toBe("g");
    });
  });

  [
    ["adenine", "Adenine"],
    ["thymine", "Thymine"],
    ["guanine", "Guanine"],
    ["cytosine", "Cytosine"],
    ["phosphate", "Phosphate"],
    ["deoxyribose", "Deoxyribose"],
    ["hydrogenBond", "Hydrogen Bond"],
  ].forEach(([id, name]) => {
    it(`selecting ${name} updates selectedId and shows its normalized info`, () => {
      const { container } = render(<DiagramGame diagram={dna} />);
      const target = dna.structures.find(s => s.id === id);
      fireEvent.click(container.querySelector(`#${id}`));
      expect(screen.getByText(target.name)).toBeInTheDocument();
      expect(screen.getByText(target.shortDescription)).toBeInTheDocument();
      expect(screen.getByText(target.explanation)).toBeInTheDocument();
      expect(screen.getByText("Selected")).toBeInTheDocument();
      const group = container.querySelector(`#${id}`);
      expect(group.getAttribute("style")).toContain("drop-shadow(0 0 4.5px rgba(245,158,11,0.95))");
    });
  });

  it("switching selection (Adenine → Thymine → Guanine) updates the panel each time, no stale info", () => {
    const { container } = render(<DiagramGame diagram={dna} />);
    const adenine = dna.structures.find(s => s.id === "adenine");
    const thymine = dna.structures.find(s => s.id === "thymine");
    const guanine = dna.structures.find(s => s.id === "guanine");

    fireEvent.click(container.querySelector("#adenine"));
    expect(screen.getByText(adenine.name)).toBeInTheDocument();

    fireEvent.click(container.querySelector("#thymine"));
    expect(screen.getByText(thymine.name)).toBeInTheDocument();
    expect(screen.queryByText(adenine.shortDescription)).not.toBeInTheDocument();

    fireEvent.click(container.querySelector("#guanine"));
    expect(screen.getByText(guanine.name)).toBeInTheDocument();
    expect(screen.queryByText(thymine.shortDescription)).not.toBeInTheDocument();
  });

  it("switching across categories (Phosphate → Deoxyribose → Hydrogen Bond) updates the panel correctly", () => {
    const { container } = render(<DiagramGame diagram={dna} />);
    const phosphate = dna.structures.find(s => s.id === "phosphate");
    const deoxyribose = dna.structures.find(s => s.id === "deoxyribose");
    const hydrogenBond = dna.structures.find(s => s.id === "hydrogenBond");

    fireEvent.click(container.querySelector("#phosphate"));
    expect(screen.getByText(phosphate.name)).toBeInTheDocument();

    fireEvent.click(container.querySelector("#deoxyribose"));
    expect(screen.getByText(deoxyribose.name)).toBeInTheDocument();
    expect(screen.queryByText(phosphate.explanation)).not.toBeInTheDocument();

    fireEvent.click(container.querySelector("#hydrogenBond"));
    expect(screen.getByText(hydrogenBond.name)).toBeInTheDocument();
    expect(screen.queryByText(deoxyribose.explanation)).not.toBeInTheDocument();
  });

  it("hover gives a subtle (non-selected) visual state distinct from click-selection", () => {
    const { container } = render(<DiagramGame diagram={dna} />);
    const group = container.querySelector("#cytosine");
    fireEvent.mouseEnter(group);
    expect(group.getAttribute("style")).toContain("drop-shadow(0 0 2.5px rgba(245,158,11,0.5))");
    fireEvent.mouseLeave(group);
    fireEvent.click(group);
    expect(group.getAttribute("style")).toContain("drop-shadow(0 0 4.5px rgba(245,158,11,0.95))");
  });

  it("tap (click event, mobile-equivalent) selects a structure just like desktop click", () => {
    const { container } = render(<DiagramGame diagram={dna} />);
    const target = dna.structures.find(s => s.id === "guanine");
    fireEvent.click(container.querySelector("#guanine"));
    expect(screen.getByText(target.name)).toBeInTheDocument();
    expect(screen.getByText(target.explanation)).toBeInTheDocument();
  });

  it("Clear selection returns Explore to its empty state", () => {
    const { container } = render(<DiagramGame diagram={dna} />);
    fireEvent.click(container.querySelector("#thymine"));
    fireEvent.click(screen.getByText("Clear selection"));
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
  });

  it("switching diagrams away from DNA and back does not leak prior selection state", () => {
    const { container, unmount } = render(<DiagramGame diagram={dna} />);
    fireEvent.click(container.querySelector("#adenine"));
    expect(screen.getByText("Adenine")).toBeInTheDocument();
    unmount();

    const leaf = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));
    const { unmount: unmountLeaf } = render(<DiagramGame diagram={leaf} />);
    expect(screen.queryByText("Adenine")).not.toBeInTheDocument();
    unmountLeaf();

    render(<DiagramGame diagram={dna} />);
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
  });

  it("does not display Animal Cell, Human Heart, or Leaf Cross Section data", () => {
    render(<DiagramGame diagram={dna} />);
    expect(screen.queryByText("Nucleus")).not.toBeInTheDocument();
    expect(screen.queryByText("Left Ventricle")).not.toBeInTheDocument();
    expect(screen.queryByText("Aorta")).not.toBeInTheDocument();
    expect(screen.queryByText("Epidermis")).not.toBeInTheDocument();
    expect(screen.queryByText("Stoma")).not.toBeInTheDocument();
  });
});

describe("STEP 18I — DNA Double Helix Explore responsive layout", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "laptop/tablet", width: 1024, expectGrid: true },
    { label: "mobile", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): Explore layout has no horizontal overflow, SVG + panel stay usable`, () => {
      setWidth(width);
      const { container, unmount } = render(<DiagramGame diagram={dna} />);
      expect(container.querySelector("svg")).toBeTruthy();
      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");

      fireEvent.click(container.querySelector("#hydrogenBond"));
      expect(screen.getByText("Hydrogen Bond")).toBeInTheDocument();

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

describe("STEP 18I — normalization / no legacy dependency", () => {
  it("Explore reads diagram.structures, not a legacy labels array", () => {
    expect(Array.isArray(dna.structures)).toBe(true);
    expect(dna.structures.length).toBe(7);
    // The raw legacy shape (before normalization) had a `labels` array; the
    // normalized object Explore actually consumes must not depend on it.
    expect(dna.labels).toBeUndefined();
  });
});

describe("STEP 18I — source-level reusability check", () => {
  it("ExploreMode contains no dg4/DNA-name-specific or dg1/dg2/dg3-specific conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function ExploreMode(");
    const end = source.indexOf("function LabelMode(", start);
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);
    ["Adenine", "Thymine", "Guanine", "Cytosine", "Phosphate", "Deoxyribose", "Hydrogen Bond"]
      .forEach(n => expect(body.includes(n)).toBe(false));
    expect(body.includes('diagram.id === "dg4"')).toBe(false);
    expect(body.includes('diagram.id === "dg1"')).toBe(false);
    expect(body.includes('diagram.id === "dg2"')).toBe(false);
    expect(body.includes('diagram.id === "dg3"')).toBe(false);
    expect((source.match(/function ExploreMode\(/g) || []).length).toBe(1);
    expect(source.includes("function DNAExploreMode")).toBe(false);
    expect(source.includes("function DNADoubleHelixExplore")).toBe(false);
  });

  it("DNADoubleHelixSVG contains no game/mode-specific logic", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function DNADoubleHelixSVG(");
    const end = source.indexOf("const DIAGRAM_SVG_COMPONENTS", start);
    const body = source.slice(start, end);
    ["score", "xpReward", "acceptableAnswers", "questionIndex", "choiceIds"]
      .forEach(term => expect(body.includes(term)).toBe(false));
  });
});

describe("STEP 18I — regression", () => {
  it("Animal Cell Explore Mode still works unmodified", () => {
    const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(container.querySelector("#nucleus"));
    expect(screen.getByText("Nucleus")).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("Human Heart Explore Mode still works unmodified", () => {
    const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
    const { container } = render(<DiagramGame diagram={heart} />);
    fireEvent.click(container.querySelector("#aorta"));
    expect(screen.getByText("Aorta")).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("Leaf Cross Section Explore Mode still works unmodified", () => {
    const leaf = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));
    const { container } = render(<DiagramGame diagram={leaf} />);
    fireEvent.click(container.querySelector("#stoma"));
    expect(screen.getByText("Stoma")).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("DNA foundation data (Step 18H) remains intact", () => {
    expect(dna.title).toBe("DNA Double Helix");
    expect(dna.xpReward).toBe(55);
    expect(DIAGRAM_SVG_COMPONENTS.dnaDoubleHelix).toBeTruthy();
  });
});
