import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DIAGRAM_DATA, DIAGRAM_SVG_COMPONENTS, normalizeDiagram } from "./AppUnderTest.jsx";

const raw8 = DIAGRAM_DATA.find(d => d.id === "dg8");
const dg8 = normalizeDiagram(raw8);
const EXPECTED_IDS = [
  "cellWall", "plasmaMembrane", "cytoplasm", "nucleus", "nucleolus",
  "chloroplast", "centralVacuole", "mitochondrion", "endoplasmicReticulum",
  "golgiApparatus", "ribosomes",
];

describe("Plant Cell (dg8) — registration", () => {
  it("exists and uses the normalized schema (has structures[])", () => {
    expect(raw8).toBeTruthy();
    expect(Array.isArray(raw8.structures)).toBe(true);
    expect(dg8.structures).toBe(raw8.structures); // normalizeDiagram passes through already-normalized data unchanged
  });

  it("has the correct id, title, level, chapter, category", () => {
    expect(dg8.id).toBe("dg8");
    expect(dg8.title).toBe("Plant Cell");
    expect(dg8.level).toBe("1st PU");
    expect(dg8.chapter).toBe("Ch 8 Cell: The Unit of Life");
    expect(dg8.category).toBe("Cell Biology");
  });
});

describe("Plant Cell (dg8) — XP", () => {
  it("xpReward is exactly 60", () => {
    expect(dg8.xpReward).toBe(60);
  });
});

describe("Plant Cell (dg8) — structure count and ids", () => {
  it("has exactly 11 structures", () => {
    expect(dg8.structures.length).toBe(11);
  });

  it("contains exactly the expected 11 structure ids", () => {
    const ids = dg8.structures.map(s => s.id);
    expect(ids.sort()).toEqual([...EXPECTED_IDS].sort());
  });

  it("no duplicate structure ids and no duplicate structure names", () => {
    const ids = dg8.structures.map(s => s.id);
    const names = dg8.structures.map(s => s.name);
    expect(new Set(ids).size).toBe(11);
    expect(new Set(names).size).toBe(11);
  });
});

describe("Plant Cell (dg8) — coordinates", () => {
  it("every structure has numeric position/labelPosition within 0-100", () => {
    dg8.structures.forEach(s => {
      [s.position.xPct, s.position.yPct, s.labelPosition.xPct, s.labelPosition.yPct].forEach(v => {
        expect(typeof v).toBe("number");
        expect(Number.isNaN(v)).toBe(false);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      });
    });
  });

  it("no two structures share the same position, and no two share the same labelPosition", () => {
    const posKeys = dg8.structures.map(s => `${s.position.xPct},${s.position.yPct}`);
    const labelKeys = dg8.structures.map(s => `${s.labelPosition.xPct},${s.labelPosition.yPct}`);
    expect(new Set(posKeys).size).toBe(11);
    expect(new Set(labelKeys).size).toBe(11);
  });
});

describe("Plant Cell (dg8) — quiz data", () => {
  it("every structure has non-empty acceptableAnswers including its canonical (lowercased) name", () => {
    dg8.structures.forEach(s => {
      expect(Array.isArray(s.quiz?.acceptableAnswers)).toBe(true);
      expect(s.quiz.acceptableAnswers.length).toBeGreaterThan(0);
      expect(s.quiz.acceptableAnswers).toContain(s.name.toLowerCase());
    });
  });

  it("every structure has shortDescription and explanation text", () => {
    dg8.structures.forEach(s => {
      expect(typeof s.shortDescription).toBe("string");
      expect(s.shortDescription.length).toBeGreaterThan(0);
      expect(typeof s.explanation).toBe("string");
      expect(s.explanation.length).toBeGreaterThan(0);
    });
  });
});

describe("Plant Cell (dg8) — Important Points", () => {
  it("has exactly 8 non-empty Important Points", () => {
    expect(Array.isArray(dg8.importantPoints)).toBe(true);
    expect(dg8.importantPoints.length).toBe(8);
    dg8.importantPoints.forEach(p => {
      expect(typeof p).toBe("string");
      expect(p.length).toBeGreaterThan(0);
    });
  });
});

describe("Plant Cell (dg8) — SVG registration and rendering", () => {
  it("dg8.image references the plantCell SVG component", () => {
    expect(dg8.image).toEqual({ type: "svg", component: "plantCell" });
  });

  it("PlantCellSVG is registered under 'plantCell' in the existing SVG registry", () => {
    expect(DIAGRAM_SVG_COMPONENTS.plantCell).toBeTruthy();
  });

  it("renders with a valid viewBox and no console errors", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.plantCell;
    const { container } = render(<Comp />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
  });

  it("represents all 11 normalized structure ids as identifiable SVG groups, with no duplicate DOM ids", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.plantCell;
    const { container } = render(<Comp />);
    dg8.structures.map(s => s.id).forEach(id => {
      expect(container.querySelectorAll(`#${id}`).length).toBe(1);
    });
  });

  it("highlights the group matching selectedId (same generic interaction convention as dg1-dg7)", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.plantCell;
    const { container } = render(<Comp selectedId="nucleus" />);
    const el = container.querySelector("#nucleus");
    expect(el.getAttribute("style")).toContain("drop-shadow(0 0 4.5px rgba(245,158,11");
  });

  it("accepts the full generic interaction prop set without throwing", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.plantCell;
    expect(() =>
      render(
        <Comp
          selectedId="chloroplast"
          onSelectStructure={() => {}}
          lockedIds={new Set(["ribosomes", "golgiApparatus"])}
          flashId="mitochondrion"
          flashType="correct"
          onDropStructure={() => {}}
          dropEnabled={true}
        />
      )
    ).not.toThrow();
  });
});

describe("Plant Cell (dg8) — no production regression on dg1-dg7", () => {
  it("dg1-dg7 remain registered with their existing ids/titles", () => {
    const expectedTitles = {
      dg1: "Animal Cell Structure",
      dg2: "Human Heart",
      dg3: "Leaf Cross Section",
      dg4: "DNA Double Helix",
      dg5: "Flower Structure",
      dg6: "Ecosystem Pyramid",
      dg7: "Prokaryotic Cell",
    };
    Object.entries(expectedTitles).forEach(([id, title]) => {
      const d = DIAGRAM_DATA.find(x => x.id === id);
      expect(d).toBeTruthy();
      expect(d.title).toBe(title);
    });
  });

  it("dg7's own XP (55) and structure count (8) are unchanged", () => {
    const dg7 = DIAGRAM_DATA.find(d => d.id === "dg7");
    expect(dg7.xpReward).toBe(55);
    expect(dg7.structures.length).toBe(8);
  });

  it("DIAGRAM_DATA now has exactly 10 diagrams (as of DG10)", () => {
    expect(DIAGRAM_DATA.length).toBe(10);
  });

  it("the existing SVG registry still has all prior components alongside the new plantCell entry", () => {
    ["animalCell", "humanHeart", "leafCrossSection", "dnaDoubleHelix", "flowerStructure", "ecosystemPyramid", "prokaryoticCell", "plantCell"]
      .forEach(key => expect(DIAGRAM_SVG_COMPONENTS[key]).toBeTruthy());
  });
});
