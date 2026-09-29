import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DIAGRAM_DATA, DIAGRAM_SVG_COMPONENTS, normalizeDiagram } from "./AppUnderTest.jsx";

const raw4 = DIAGRAM_DATA.find(d => d.id === "dg4");
const dna = normalizeDiagram(raw4);
const EXPECTED_NAMES = ["Adenine", "Thymine", "Guanine", "Cytosine", "Phosphate", "Deoxyribose", "Hydrogen Bond"];

describe("DNA Double Helix (dg4) — data", () => {
  it("exists and uses the normalized schema (has structures[])", () => {
    expect(raw4).toBeTruthy();
    expect(Array.isArray(raw4.structures)).toBe(true);
    expect(dna.structures).toBe(raw4.structures); // normalizeDiagram passes through already-normalized data unchanged
  });

  it("has the correct id and title", () => {
    expect(dna.id).toBe("dg4");
    expect(dna.title).toBe("DNA Double Helix");
  });

  it("has exactly 7 structures with unique ids", () => {
    expect(dna.structures.length).toBe(7);
    const ids = dna.structures.map(s => s.id);
    expect(new Set(ids).size).toBe(7);
  });

  it("contains all 7 expected structure names", () => {
    const names = dna.structures.map(s => s.name);
    EXPECTED_NAMES.forEach(name => expect(names).toContain(name));
  });

  it("every structure has the required normalized fields and non-empty acceptableAnswers", () => {
    dna.structures.forEach(s => {
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

  it("canonical answers are present for every structure", () => {
    const expectedCanonical = {
      adenine: "adenine", thymine: "thymine", guanine: "guanine", cytosine: "cytosine",
      phosphate: "phosphate", deoxyribose: "deoxyribose", hydrogenBond: "hydrogen bond",
    };
    Object.entries(expectedCanonical).forEach(([id, canonical]) => {
      const s = dna.structures.find(x => x.id === id);
      expect(s).toBeTruthy();
      expect(s.quiz.acceptableAnswers).toContain(canonical);
    });
  });

  it("category is Genetics, difficulty is Medium, description exists", () => {
    expect(dna.category).toBe("Genetics");
    expect(dna.difficulty).toBe("Medium");
    expect(typeof dna.description).toBe("string");
    expect(dna.description.length).toBeGreaterThan(0);
  });

  it("has non-empty importantPoints and a diagram-level xpReward", () => {
    expect(Array.isArray(dna.importantPoints)).toBe(true);
    expect(dna.importantPoints.length).toBeGreaterThan(0);
    expect(typeof dna.xpReward).toBe("number");
    expect(dna.xpReward).toBeGreaterThan(0);
    expect(dna.xpReward).toBe(55);
  });

  it("dg4.image references the dnaDoubleHelix SVG component", () => {
    expect(dna.image).toEqual({ type: "svg", component: "dnaDoubleHelix" });
  });
});

describe("DNA Double Helix (dg4) — SVG renderer", () => {
  it("DNADoubleHelixSVG is registered under 'dnaDoubleHelix'", () => {
    expect(DIAGRAM_SVG_COMPONENTS.dnaDoubleHelix).toBeTruthy();
  });

  it("renders with a valid viewBox", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.dnaDoubleHelix;
    const { container } = render(<Comp />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
  });

  it("represents all 7 normalized structure ids as identifiable SVG groups", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.dnaDoubleHelix;
    const { container } = render(<Comp />);
    dna.structures.map(s => s.id).forEach(id => {
      expect(container.querySelector(`#${id}`)).toBeTruthy();
    });
  });

  it("highlights the group matching selectedId", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.dnaDoubleHelix;
    const { container } = render(<Comp selectedId="guanine" />);
    const el = container.querySelector("#guanine");
    expect(el.getAttribute("style")).toContain("drop-shadow(0 0 4.5px rgba(245,158,11");
  });

  it("accepts the full generic interaction prop set without throwing (pure renderer)", () => {
    const Comp = DIAGRAM_SVG_COMPONENTS.dnaDoubleHelix;
    expect(() =>
      render(
        <Comp
          selectedId="phosphate"
          onSelectStructure={() => {}}
          lockedIds={new Set(["thymine"])}
          flashId="cytosine"
          flashType="correct"
          onDropStructure={() => {}}
          dropEnabled={true}
        />
      )
    ).not.toThrow();
  });
});

describe("DNA Double Helix (dg4) — normalization", () => {
  it("normalizeDiagram(dg4) returns dg4 unchanged (already normalized, no dg4-specific branch)", () => {
    expect(normalizeDiagram(raw4)).toBe(raw4);
  });
});

describe("DNA Double Helix (dg4) — data isolation", () => {
  it("does not contain Animal Cell, Human Heart, or Leaf Cross Section structure names", () => {
    const names = dna.structures.map(s => s.name);
    ["Nucleus", "Mitochondria", "Cell Membrane", "Left Atrium", "Aorta", "Vena Cava", "Epidermis", "Stoma", "Vascular Bundle"]
      .forEach(foreign => expect(names.includes(foreign)).toBe(false));
  });
});

describe("DNA Double Helix (dg4) — integrity of other diagrams", () => {
  it("dg1, dg2, dg3 are unchanged", () => {
    const dg1 = DIAGRAM_DATA.find(d => d.id === "dg1");
    const dg2 = DIAGRAM_DATA.find(d => d.id === "dg2");
    const dg3 = DIAGRAM_DATA.find(d => d.id === "dg3");
    expect(dg1.structures.length).toBe(7);
    expect(dg1.xpReward).toBe(50);
    expect(dg2.structures.length).toBe(7);
    expect(dg2.xpReward).toBe(60);
    expect(dg3.structures.length).toBe(6);
    expect(dg3.xpReward).toBe(45);
  });

  it("dg5, dg6 are now normalized too (upgraded outside this step's scope)", () => {
    // dg5 (Flower Structure) and dg6 (Ecosystem Pyramid) were upgraded to
    // the normalized `structures` schema in the DG5+DG6 SVG Integration
    // step — each is covered by its own dedicated test suite now
    // (flowerStructure.test.jsx, ecosystemPyramid.test.jsx), not here.
    ["dg5", "dg6"].forEach(id => {
      const d = DIAGRAM_DATA.find(x => x.id === id);
      expect(d).toBeTruthy();
      expect(Array.isArray(d.structures)).toBe(true);
    });
  });
});

describe("DNA Double Helix (dg4) — reusability / source check", () => {
  it("no DNA-specific game mode or dg4-specific logic exists in generic modes", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");

    ["function DNADoubleHelixExploreMode", "function DNADoubleHelixLabelMode", "function DNADoubleHelixMismatchMode",
     "function DNADoubleHelixIdentifyMode", "function DNADoubleHelixExamMode", "function DNADoubleHelixImportantPoints"]
      .forEach(sig => expect(source.includes(sig)).toBe(false));

    [
      ["function ExploreMode(", "function LabelMode("],
      ["function LabelMode(", "function MismatchMode("],
      ["function MismatchMode(", "function IdentifyMode("],
      ["function IdentifyMode(", "function ExamMode("],
      ["function ExamMode(", "function DiagramGame("],
      ["function ImportantPointsMode(", "function DiagramCenter("],
    ].forEach(([startSig, endSig]) => {
      const start = source.indexOf(startSig);
      let end = source.indexOf(endSig, start);
      if (end === -1) end = source.indexOf("\nfunction ", start + 1);
      expect(start).toBeGreaterThan(-1);
      const body = source.slice(start, end);
      expect(body.includes('diagram.id === "dg4"')).toBe(false);
      ["Adenine", "Thymine", "Guanine", "Cytosine", "Phosphate", "Deoxyribose", "Hydrogen Bond"]
        .forEach(n => expect(body.includes(n)).toBe(false));
    });
  });

  it("DNADoubleHelixSVG is a pure renderer with no game logic", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function DNADoubleHelixSVG(");
    expect(start).toBeGreaterThan(-1);
    const end = source.indexOf("const DIAGRAM_SVG_COMPONENTS", start);
    const body = source.slice(start, end);
    ["score", "xpReward", "acceptableAnswers", "questionIndex", "choiceIds", 'diagram.id === "dg4"']
      .forEach(term => expect(body.includes(term)).toBe(false));
  });
});

describe("DNA Double Helix (dg4) — regression: prior foundations & Leaf modes still pass", () => {
  it("Animal Cell and Human Heart foundation data are unaffected", () => {
    const dg1 = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
    const dg2 = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
    expect(dg1.title).toBe("Animal Cell Structure");
    expect(dg2.title).toBe("Human Heart");
  });

  it("Leaf Cross Section foundation is unaffected", () => {
    const dg3 = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));
    expect(dg3.title).toBe("Leaf Cross Section");
    expect(dg3.structures.length).toBe(6);
    expect(DIAGRAM_SVG_COMPONENTS.leafCrossSection).toBeTruthy();
  });
});
