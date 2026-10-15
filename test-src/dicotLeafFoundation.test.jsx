import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DIAGRAM_DATA, DIAGRAM_SVG_COMPONENTS, normalizeDiagram } from "./AppUnderTest.jsx";

const raw = DIAGRAM_DATA.find(d => d.id === "dg13");
const dg13 = normalizeDiagram(raw);

const EXPECTED = [
  ["upperEpidermis", "Upper Epidermis"], ["palisadeParenchyma", "Palisade Parenchyma"],
  ["spongyParenchyma", "Spongy Parenchyma"], ["airSpace", "Intercellular Air Space"],
  ["vascularBundle", "Vascular Bundle"], ["xylem", "Xylem"], ["phloem", "Phloem"],
  ["lowerEpidermis", "Lower Epidermis"], ["stoma", "Stoma"],
];
const IDS = EXPECTED.map(([id]) => id);

let spy;
beforeEach(() => { spy = vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => { spy.mockRestore(); cleanup(); });

describe("Dicot Leaf (dg13) -- registration and specification", () => {
  it("exists with the exact title, chapter, category, level, XP and SVG registry reference", () => {
    expect(raw).toBeTruthy();
    expect(dg13.title).toBe("T.S. of a Dicot Leaf");
    expect(dg13.chapter).toBe("Ch 6 Anatomy of Flowering Plants");
    expect(dg13.category).toBe("Plant Anatomy");
    expect(dg13.level).toBe("1st PU");
    expect(dg13.xpReward).toBe(65);
    expect(dg13.image).toEqual({ type: "svg", component: "dicotLeaf" });
    expect(typeof DIAGRAM_SVG_COMPONENTS.dicotLeaf).toBe("function");
    expect(dg13.description.toLowerCase()).toMatch(/transverse section/);
  });

  it("has exactly the 9 specified structures, in order, with unique ids and exact names", () => {
    expect(dg13.structures.map(s => s.id)).toEqual(IDS);
    expect(dg13.structures.map(s => s.name)).toEqual(EXPECTED.map(([, n]) => n));
    expect(new Set(IDS).size).toBe(9);
  });

  it("has 9 important points covering dorsiventral anatomy, cuticle/stomata, mesophyll, palisade, spongy, bundle sheath, xylem/phloem orientation, guard cells and air spaces", () => {
    expect(dg13.importantPoints.length).toBe(9);
    const t = dg13.importantPoints.join(" ").toLowerCase();
    ["dorsiventral", "cuticle", "mesophyll", "palisade", "spongy", "bundle sheath", "xylem", "phloem", "guard cells", "air spaces"].forEach(w => expect(t).toContain(w));
  });

  it("every structure follows the schema (positions 0-100, text fields, canonical name accepted)", () => {
    dg13.structures.forEach(s => {
      ["shortDescription", "explanation"].forEach(k => expect(s[k].length).toBeGreaterThan(15));
      [s.position, s.labelPosition].forEach(p => {
        expect(p.xPct).toBeGreaterThanOrEqual(0); expect(p.xPct).toBeLessThanOrEqual(100);
        expect(p.yPct).toBeGreaterThanOrEqual(0); expect(p.yPct).toBeLessThanOrEqual(100);
      });
      expect(s.quiz.acceptableAnswers).toContain(s.name.toLowerCase());
    });
    const flat = dg13.structures.flatMap(s => s.quiz.acceptableAnswers);
    expect(new Set(flat).size).toBe(flat.length);
  });

  it("label positions are unique and sit on the left/right edge, clear of the section", () => {
    const keys = dg13.structures.map(s => `${s.labelPosition.xPct}|${s.labelPosition.yPct}`);
    expect(new Set(keys).size).toBe(9);
    dg13.structures.forEach(s => expect([3, 97]).toContain(s.labelPosition.xPct));
  });

  it("xylem is placed above (upper side of) phloem, as in a real dicot leaf bundle", () => {
    const y = id => dg13.structures.find(s => s.id === id).position.yPct;
    expect(y("xylem")).toBeLessThan(y("phloem"));
    expect(y("upperEpidermis")).toBeLessThan(y("palisadeParenchyma"));
    expect(y("palisadeParenchyma")).toBeLessThan(y("spongyParenchyma"));
    expect(y("spongyParenchyma")).toBeLessThan(y("lowerEpidermis"));
  });
});

describe("Dicot Leaf (dg13) -- SVG rendering and interaction", () => {
  it("renders one clickable group per structure id, with an accessible label", () => {
    const Svg = DIAGRAM_SVG_COMPONENTS.dicotLeaf;
    const { container } = render(<Svg selectedId={null} onSelectStructure={() => {}} />);
    const svg = container.querySelector("svg");
    expect(svg.getAttribute("aria-label")).toMatch(/dicot leaf/i);
    IDS.forEach(id => expect(container.querySelectorAll(`[data-structure-id="${id}"]`).length).toBe(1));
  });

  it("clicking each group selects exactly that structure", () => {
    const Svg = DIAGRAM_SVG_COMPONENTS.dicotLeaf;
    const onSelect = vi.fn();
    const { container } = render(<Svg selectedId={null} onSelectStructure={onSelect} />);
    IDS.forEach(id => {
      onSelect.mockClear();
      fireEvent.click(container.querySelector(`[data-structure-id="${id}"]`));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(id);
    });
  });

  it("the stoma has two guard cells and a pore; the leaf has palisade columns, spongy cells and air spaces", () => {
    const Svg = DIAGRAM_SVG_COMPONENTS.dicotLeaf;
    const { container } = render(<Svg selectedId={null} onSelectStructure={() => {}} />);
    expect(container.querySelectorAll('[data-structure-id="stoma"] path').length).toBe(2);
    expect(container.querySelectorAll('[data-structure-id="stoma"] line').length).toBe(1);
    expect(container.querySelectorAll('[data-structure-id="palisadeParenchyma"] rect[rx]').length).toBeGreaterThanOrEqual(12);
    expect(container.querySelectorAll('[data-structure-id="spongyParenchyma"] ellipse').length).toBeGreaterThanOrEqual(15);
    expect(container.querySelectorAll('[data-structure-id="airSpace"] ellipse').length).toBeGreaterThanOrEqual(5);
  });

  it("selected, locked and flash states change the rendering without throwing", () => {
    const Svg = DIAGRAM_SVG_COMPONENTS.dicotLeaf;
    const { container } = render(<Svg selectedId="xylem" lockedIds={new Set(["phloem"])} flashId="stoma" flashType="wrong" onSelectStructure={() => {}} />);
    expect(container.querySelector('[data-structure-id="xylem"]').style.filter).toMatch(/245,158,11/);
    expect(container.querySelector('[data-structure-id="phloem"]').style.filter).toMatch(/16,185,129/);
    expect(container.querySelector('[data-structure-id="stoma"]').style.filter).toMatch(/239,68,68/);
  });

  it("DiagramGame loads dg13 in Explore, showing a structure's info after selection", () => {
    const { container, getByText } = render(<DiagramGame diagram={dg13} />);
    fireEvent.click(container.querySelector('[data-structure-id="stoma"]'));
    expect(getByText(dg13.structures.find(s => s.id === "stoma").explanation)).toBeTruthy();
  });
});

describe("Dicot Leaf (dg13) -- earlier diagrams unchanged", () => {
  it("DIAGRAM_DATA holds dg1..dg13 in order; dg3 (Leaf Cross Section) and dg12 are untouched", () => {
    expect(DIAGRAM_DATA.map(d => d.id)).toEqual(Array.from({ length: 13 }, (_, i) => `dg${i + 1}`));
    expect(DIAGRAM_DATA.find(d => d.id === "dg3").structures.length).toBe(6);
    expect(DIAGRAM_DATA.find(d => d.id === "dg12").structures.length).toBe(9);
    expect(DIAGRAM_DATA.find(d => d.id === "dg12").image.component).toBe("monocotStem");
  });
});
