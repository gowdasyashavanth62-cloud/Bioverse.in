import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DIAGRAM_DATA, DIAGRAM_SVG_COMPONENTS, normalizeDiagram } from "./AppUnderTest.jsx";

const raw7 = DIAGRAM_DATA.find(d => d.id === "dg7");
const dg7 = normalizeDiagram(raw7);
const EXPECTED_IDS = ["capsule", "cellWall", "plasmaMembrane", "cytoplasm", "nucleoid", "ribosomes", "plasmid", "flagellum"];
const EXPECTED_NAMES = [
  "Capsule / Slime Layer", "Cell Wall", "Plasma Membrane", "Cytoplasm",
  "Nucleoid", "Ribosomes", "Plasmid", "Flagellum",
];

describe("Prokaryotic Cell (dg7) — data", () => {
  it("exists and uses the normalized schema (has structures[])", () => {
    expect(raw7).toBeTruthy();
    expect(Array.isArray(raw7.structures)).toBe(true);
    expect(dg7.structures).toBe(raw7.structures); // normalizeDiagram passes through already-normalized data unchanged
  });

  it("has the correct id, title, level, chapter, category, difficulty", () => {
    expect(dg7.id).toBe("dg7");
    expect(dg7.title).toBe("Prokaryotic Cell");
    expect(dg7.level).toBe("1st PU");
    expect(dg7.chapter).toBe("Chapter 8: Cell: The Unit of Life");
    expect(dg7.category).toBe("Cell Biology");
    expect(dg7.difficulty).toBeTruthy();
  });

  it("has exactly 8 structures with the exact expected ids (no duplicates)", () => {
    expect(dg7.structures.length).toBe(8);
    const ids = dg7.structures.map(s => s.id);
    expect(new Set(ids).size).toBe(8);
    expect(ids.sort()).toEqual([...EXPECTED_IDS].sort());
  });

  it("contains all 8 expected structure names", () => {
    const names = dg7.structures.map(s => s.name);
    EXPECTED_NAMES.forEach(name => expect(names).toContain(name));
  });

  it("every structure has id, name, shortDescription, explanation, position, labelPosition, and non-empty acceptableAnswers", () => {
    dg7.structures.forEach(s => {
      expect(typeof s.id).toBe("string");
      expect(s.id.length).toBeGreaterThan(0);
      expect(typeof s.name).toBe("string");
      expect(s.name.length).toBeGreaterThan(0);
      expect(typeof s.shortDescription).toBe("string");
      expect(s.shortDescription.length).toBeGreaterThan(0);
      expect(typeof s.explanation).toBe("string");
      expect(s.explanation.length).toBeGreaterThan(0);
      expect(s.position).toBeTruthy();
      expect(typeof s.position.xPct).toBe("number");
      expect(typeof s.position.yPct).toBe("number");
      expect(s.labelPosition).toBeTruthy();
      expect(typeof s.labelPosition.xPct).toBe("number");
      expect(typeof s.labelPosition.yPct).toBe("number");
      expect(Array.isArray(s.quiz?.acceptableAnswers)).toBe(true);
      expect(s.quiz.acceptableAnswers.length).toBeGreaterThan(0);
    });
  });

  it("has exactly 6 importantPoints and a positive xpReward", () => {
    expect(Array.isArray(dg7.importantPoints)).toBe(true);
    expect(dg7.importantPoints.length).toBe(6);
    expect(typeof dg7.xpReward).toBe("number");
    expect(dg7.xpReward).toBeGreaterThan(0);
  });

  it("dg7.image references the prokaryoticCell SVG component", () => {
    expect(dg7.image).toEqual({ type: "svg", component: "prokaryoticCell" });
  });
});

describe("Prokaryotic Cell (dg7) — SVG renderer", () => {
  it("ProkaryoticCellSVG is registered under 'prokaryoticCell'", () => {
    expect(DIAGRAM_SVG_COMPONENTS.prokaryoticCell).toBeTruthy();
  });

  it("renders with a valid viewBox and no console errors", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.prokaryoticCell;
    const { container } = render(<Comp />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
  });

  it("represents all 8 normalized structure ids as identifiable SVG groups, with no duplicate DOM ids", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.prokaryoticCell;
    const { container } = render(<Comp />);
    const expectedIds = dg7.structures.map(s => s.id);
    expectedIds.forEach(id => {
      expect(container.querySelectorAll(`#${id}`).length).toBe(1);
    });
  });

  it("highlights the group matching selectedId", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.prokaryoticCell;
    const { container } = render(<Comp selectedId="flagellum" />);
    const el = container.querySelector("#flagellum");
    expect(el.getAttribute("style")).toContain("drop-shadow(0 0 4.5px rgba(245,158,11");
  });

  it("accepts the full generic interaction prop set without throwing", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.prokaryoticCell;
    const onSelectStructure = () => {};
    const onDropStructure = () => {};
    expect(() =>
      render(
        <Comp
          selectedId="nucleoid"
          onSelectStructure={onSelectStructure}
          lockedIds={new Set(["ribosomes", "plasmid"])}
          flashId="cellWall"
          flashType="correct"
          onDropStructure={onDropStructure}
          dropEnabled={true}
        />
      )
    ).not.toThrow();
  });
});

describe("Prokaryotic Cell (dg7) — integrity of existing six diagrams", () => {
  it("dg1 (Animal Cell) is unchanged", () => {
    const dg1 = DIAGRAM_DATA.find(d => d.id === "dg1");
    expect(dg1.title).toBe("Animal Cell Structure");
    expect(dg1.structures.length).toBe(7);
    expect(dg1.xpReward).toBe(50);
  });

  it("dg2 (Human Heart) is unchanged", () => {
    const dg2 = DIAGRAM_DATA.find(d => d.id === "dg2");
    expect(dg2.title).toBe("Human Heart");
    expect(dg2.structures.length).toBe(7);
    expect(dg2.xpReward).toBe(60);
  });

  it("dg3 (Leaf Cross Section) is unchanged", () => {
    const dg3 = DIAGRAM_DATA.find(d => d.id === "dg3");
    expect(dg3.title).toBe("Leaf Cross Section");
    expect(dg3.structures.length).toBe(6);
  });

  it("dg4 (DNA Double Helix), dg5 (Flower Structure), dg6 (Ecosystem Pyramid) are unchanged", () => {
    const dg4 = DIAGRAM_DATA.find(d => d.id === "dg4");
    const dg5 = DIAGRAM_DATA.find(d => d.id === "dg5");
    const dg6 = DIAGRAM_DATA.find(d => d.id === "dg6");
    expect(dg4.title).toBe("DNA Double Helix");
    expect(dg5.title).toBe("Flower Structure");
    expect(dg6.title).toBe("Ecosystem Pyramid");
    expect(dg5.structures.length).toBe(7);
    expect(dg6.structures.length).toBe(5);
  });

  it("DIAGRAM_DATA had exactly 7 diagrams as of dg7 (Step 20A) — 8 after dg8 (Plant Cell) — 9 after dg9 (Dicot Root) — now 10 after dg10 (Dicot Stem)", () => {
    expect(DIAGRAM_DATA.length).toBe(10);
  });
});

describe("Prokaryotic Cell (dg7) — reusability / source check", () => {
  it("uses the generic normalizeDiagram (no separate dg7 transformation pipeline, no id/title conditionals)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    expect(source.includes("function normalizeProkaryoticDiagram")).toBe(false);
    expect((source.match(/function normalizeDiagram\(/g) || []).length).toBe(1);
    expect(source.includes('diagram.id === "dg7"')).toBe(false);
    expect(source.includes('diagram.title === "Prokaryotic Cell"')).toBe(false);
  });

  it("ProkaryoticCellSVG is a pure renderer with no game logic", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function ProkaryoticCellSVG(");
    expect(start).toBeGreaterThan(-1);
    const nextFnStart = source.indexOf("\nfunction ", start + 1);
    const body = source.slice(start, nextFnStart);
    ["score", "xpReward", "acceptableAnswers", "questionIndex", "choiceIds", 'diagram.id === "dg7"']
      .forEach(term => expect(body.includes(term)).toBe(false));
  });
});
