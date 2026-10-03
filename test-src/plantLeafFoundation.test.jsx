import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DIAGRAM_DATA, DIAGRAM_SVG_COMPONENTS, normalizeDiagram } from "./AppUnderTest.jsx";

const raw3 = DIAGRAM_DATA.find(d => d.id === "dg3");
const dg3 = normalizeDiagram(raw3);
const EXPECTED_NAMES = ["Epidermis", "Palisade Layer", "Spongy Layer", "Vascular Bundle", "Guard Cell", "Stoma"];

describe("Leaf Cross Section (dg3) — data", () => {
  it("exists and uses the normalized schema (has structures[])", () => {
    expect(raw3).toBeTruthy();
    expect(Array.isArray(raw3.structures)).toBe(true);
    expect(dg3.structures).toBe(raw3.structures); // normalizeDiagram passes through already-normalized data unchanged
  });

  it("has the correct id, title, category", () => {
    expect(dg3.id).toBe("dg3");
    expect(dg3.title).toBe("Leaf Cross Section");
    expect(dg3.category).toBe("Plant Anatomy");
  });

  it("has exactly 6 structures with unique ids", () => {
    expect(dg3.structures.length).toBe(6);
    const ids = dg3.structures.map(s => s.id);
    expect(new Set(ids).size).toBe(6);
  });

  it("contains all 6 expected structure names", () => {
    const names = dg3.structures.map(s => s.name);
    EXPECTED_NAMES.forEach(name => expect(names).toContain(name));
  });

  it("every structure has shortDescription, explanation, position, labelPosition, and non-empty acceptableAnswers", () => {
    dg3.structures.forEach(s => {
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

  it("has non-empty importantPoints and a positive xpReward", () => {
    expect(Array.isArray(dg3.importantPoints)).toBe(true);
    expect(dg3.importantPoints.length).toBeGreaterThan(0);
    expect(typeof dg3.xpReward).toBe("number");
    expect(dg3.xpReward).toBeGreaterThan(0);
  });

  it("dg3.image references the leafCrossSection SVG component", () => {
    expect(dg3.image).toEqual({ type: "svg", component: "leafCrossSection" });
  });
});

describe("Leaf Cross Section (dg3) — SVG renderer", () => {
  it("LeafCrossSectionSVG is registered under 'leafCrossSection'", () => {
    expect(DIAGRAM_SVG_COMPONENTS.leafCrossSection).toBeTruthy();
  });

  it("renders with a valid viewBox and no console errors", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.leafCrossSection;
    const { container } = render(<Comp />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
  });

  it("represents all 6 normalized structure ids as identifiable SVG groups", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.leafCrossSection;
    const { container } = render(<Comp />);
    const expectedIds = dg3.structures.map(s => s.id);
    expectedIds.forEach(id => {
      expect(container.querySelector(`#${id}`)).toBeTruthy();
    });
  });

  it("highlights the group matching selectedId", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.leafCrossSection;
    const { container } = render(<Comp selectedId="stoma" />);
    const el = container.querySelector("#stoma");
    expect(el.getAttribute("style")).toContain("drop-shadow(0 0 4.5px rgba(245,158,11");
  });

  it("accepts the full generic interaction prop set without throwing", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.leafCrossSection;
    const onSelectStructure = () => {};
    const onDropStructure = () => {};
    expect(() =>
      render(
        <Comp
          selectedId="epidermis"
          onSelectStructure={onSelectStructure}
          lockedIds={new Set(["guardCell"])}
          flashId="vascularBundle"
          flashType="correct"
          onDropStructure={onDropStructure}
          dropEnabled={true}
        />
      )
    ).not.toThrow();
  });
});

describe("Leaf Cross Section (dg3) — integrity of other diagrams", () => {
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

  it("dg5, dg6 are now normalized too (upgraded outside this step's scope)", () => {
    // dg5 (Flower Structure) and dg6 (Ecosystem Pyramid) were upgraded to
    // the normalized `structures` schema in the DG5+DG6 SVG Integration
    // step — each is covered by its own dedicated test suite now
    // (flowerStructure.test.jsx, ecosystemPyramid.test.jsx), not here.
    ["dg5", "dg6"].forEach(id => {
      const raw = DIAGRAM_DATA.find(d => d.id === id);
      expect(raw).toBeTruthy();
      expect(Array.isArray(raw.structures)).toBe(true);
    });
  });
});

describe("Leaf Cross Section (dg3) — reusability / source check", () => {
  it("uses the generic normalizeDiagram (no separate dg3 transformation pipeline)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    expect(source.includes("function normalizeLeafDiagram")).toBe(false);
    expect((source.match(/function normalizeDiagram\(/g) || []).length).toBe(1);
  });

  it("LeafCrossSectionSVG is a pure renderer with no game logic", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function LeafCrossSectionSVG(");
    expect(start).toBeGreaterThan(-1);
    const nextFnStart = source.indexOf("\nfunction ", start + 1);
    const body = source.slice(start, nextFnStart);
    ["score", "xpReward", "acceptableAnswers", "questionIndex", "choiceIds", 'diagram.id === "dg3"']
      .forEach(term => expect(body.includes(term)).toBe(false));
  });
});
