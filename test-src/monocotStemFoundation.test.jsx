import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, DIAGRAM_SVG_COMPONENTS, normalizeDiagram } from "./AppUnderTest.jsx";

const raw = DIAGRAM_DATA.find(d => d.id === "dg12");
const dg12 = normalizeDiagram(raw);

const EXPECTED = [
  ["epidermis", "Epidermis"], ["hypodermis", "Hypodermis"], ["groundTissue", "Ground Tissue"],
  ["vascularBundle", "Vascular Bundle"], ["bundleSheath", "Bundle Sheath"], ["phloem", "Phloem"],
  ["waterCavity", "Water-containing Cavity"], ["protoxylem", "Protoxylem"], ["metaxylem", "Metaxylem"],
];
const EXPECTED_IDS = EXPECTED.map(([id]) => id);

const EXPECTED_POINTS = [
  "The epidermis forms the outermost layer of the monocot stem.",
  "The hypodermis is made up of sclerenchymatous cells and provides mechanical strength.",
  "The ground tissue is large and parenchymatous and is not differentiated into distinct cortex, endodermis, pericycle and pith regions.",
  "Numerous vascular bundles are scattered throughout the ground tissue.",
  "Peripheral vascular bundles are generally smaller than those located towards the centre.",
  "Each vascular bundle is surrounded by a sclerenchymatous bundle sheath.",
  "The vascular bundles are conjoint and closed because cambium is absent.",
  "Phloem parenchyma is absent in the vascular bundles of the monocot stem.",
  "Water-containing cavities occur within the vascular bundles.",
];

let consoleErrorSpy;
beforeEach(() => { consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => { consoleErrorSpy.mockRestore(); cleanup(); });

// Parse "translate(x y) rotate(deg) scale(s)" produced by MonocotStemSVG.
function parseBundleTransform(t) {
  const m = /translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\) scale\(([-\d.]+)\)/.exec(t || "");
  return m ? { x: +m[1], y: +m[2], rot: +m[3], s: +m[4] } : null;
}
const dist = (x, y) => Math.hypot(x - 50, y - 50);
// local (lx, ly) in a bundle's frame -> global viewBox coords
function toGlobal(b, lx, ly) {
  const r = (b.rot * Math.PI) / 180;
  return [b.x + b.s * (lx * Math.cos(r) - ly * Math.sin(r)), b.y + b.s * (lx * Math.sin(r) + ly * Math.cos(r))];
}
function bundlesOf(container) {
  return Array.from(container.querySelectorAll("#vascularBundle circle")).map(c => parseBundleTransform(c.getAttribute("transform")));
}

describe("Monocot Stem (dg12) -- registration and frozen specification", () => {
  it("exists with the exact title, chapter, category, XP and SVG registry reference", () => {
    expect(raw).toBeTruthy();
    expect(dg12.title).toBe("T.S. of a Monocot Stem");
    expect(dg12.chapter).toBe("Ch 6 Anatomy of Flowering Plants");
    expect(dg12.category).toBe("Plant Anatomy");
    expect(dg12.level).toBe("1st PU");
    expect(dg12.xpReward).toBe(65);
    expect(dg12.image).toEqual({ type: "svg", component: "monocotStem" });
    expect(typeof DIAGRAM_SVG_COMPONENTS.monocotStem).toBe("function");
    expect(dg12.description.toLowerCase()).toMatch(/transverse section/);
  });

  it("has EXACTLY the 9 specified structures, in order, with the exact ids and names", () => {
    expect(dg12.structures.length).toBe(9);
    expect(dg12.structures.map(s => s.id)).toEqual(EXPECTED_IDS);
    expect(dg12.structures.map(s => s.name)).toEqual(EXPECTED.map(([, n]) => n));
    expect(new Set(EXPECTED_IDS).size).toBe(9);
  });

  it("creates no structures for the concept-only terms (conjoint, collateral, closed, sclerenchymatous, parenchymatous, scattered, peripheral bundles, secondary growth, phloem parenchyma)", () => {
    const forbidden = ["conjoint", "collateral", "closed", "sclerenchym", "parenchym", "scattered", "peripheral", "secondary", "cambium", "cortex", "pith", "pericycle", "endodermis", "xylem" ];
    dg12.structures.forEach(s => {
      forbidden.forEach(f => {
        if (f === "xylem") return; // protoxylem / metaxylem are required targets
        expect(s.id.toLowerCase()).not.toContain(f);
        expect(s.name.toLowerCase()).not.toContain(f);
      });
    });
    expect(dg12.structures.some(s => s.id === "xylem")).toBe(false);
    expect(dg12.structures.some(s => /phloem parenchyma/i.test(s.name))).toBe(false);
  });

  it("has EXACTLY the 9 frozen important points, verbatim", () => {
    expect(dg12.importantPoints.length).toBe(9);
    expect(dg12.importantPoints).toEqual(EXPECTED_POINTS);
  });

  it("teaches the concept-only terms through descriptions / explanations, not extra targets", () => {
    const text = (dg12.description + " " + dg12.structures.map(s => s.explanation).join(" ")).toLowerCase();
    ["conjoint", "closed", "cambium", "scattered", "sclerenchymatous", "parenchymatous"].forEach(w => expect(text).toContain(w));
  });

  it("every structure follows the frozen schema (positions in 0-100, text fields, quiz answers incl. canonical name)", () => {
    dg12.structures.forEach(s => {
      ["shortDescription", "explanation"].forEach(k => {
        expect(typeof s[k]).toBe("string");
        expect(s[k].length).toBeGreaterThan(15);
      });
      [s.position, s.labelPosition].forEach(p => {
        expect(p.xPct).toBeGreaterThanOrEqual(0); expect(p.xPct).toBeLessThanOrEqual(100);
        expect(p.yPct).toBeGreaterThanOrEqual(0); expect(p.yPct).toBeLessThanOrEqual(100);
      });
      expect(s.quiz.acceptableAnswers).toContain(s.name.toLowerCase());
    });
  });

  it("quiz answers are the canonical names plus only obvious equivalent wording (no broad synonyms)", () => {
    const a = Object.fromEntries(dg12.structures.map(s => [s.id, s.quiz.acceptableAnswers]));
    expect(a.epidermis).toEqual(["epidermis"]);
    expect(a.hypodermis).toEqual(["hypodermis"]);
    expect(a.groundTissue).toEqual(["ground tissue"]);
    expect(a.vascularBundle).toEqual(["vascular bundle", "vascular bundles"]);
    expect(a.bundleSheath).toEqual(["bundle sheath"]);
    expect(a.phloem).toEqual(["phloem"]);
    expect(a.waterCavity).toEqual(["water-containing cavity", "water containing cavity", "water cavity"]);
    expect(a.protoxylem).toEqual(["protoxylem", "proto xylem"]);
    expect(a.metaxylem).toEqual(["metaxylem", "meta xylem"]);
    const flat = Object.values(a).flat();
    expect(new Set(flat).size).toBe(flat.length);
  });

  it("label positions are all unique and every label sits on the edge of the figure (clear of the section)", () => {
    const labels = dg12.structures.map(s => `${s.labelPosition.xPct}|${s.labelPosition.yPct}`);
    expect(new Set(labels).size).toBe(9);
    dg12.structures.forEach(s => {
      const { xPct, yPct } = s.labelPosition;
      expect(xPct <= 10 || xPct >= 90 || yPct <= 8 || yPct >= 92).toBe(true);
    });
  });
});

describe("Monocot Stem (dg12) -- SVG", () => {
  it("MonocotStemSVG renders inline pure SVG (responsive viewBox, accessible, no <image>/<foreignObject>/external href)", () => {
    const { container } = render(<DiagramGame diagram={dg12} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toMatch(/monocot stem/i);
    expect(svg.querySelector("image, foreignObject")).toBeNull();
    expect(svg.outerHTML).not.toMatch(/href="https?:/);
  });

  it("renders exactly one selectable <g> per structure id, and nothing else with those ids", () => {
    const { container } = render(<DiagramGame diagram={dg12} />);
    EXPECTED_IDS.forEach(id => {
      const matches = container.querySelectorAll(`#${id}`);
      expect(matches.length).toBe(1);
      expect(matches[0].tagName.toLowerCase()).toBe("g");
    });
  });

  it("draws NUMEROUS scattered bundles, each with its own sheath, phloem, water cavity, 2 protoxylem and 2 metaxylem", () => {
    const { container } = render(<DiagramGame diagram={dg12} />);
    const n = bundlesOf(container).length;
    expect(n).toBeGreaterThanOrEqual(25);
    expect(container.querySelectorAll("#phloem ellipse").length).toBe(n);
    expect(container.querySelectorAll("#waterCavity circle").length).toBe(n);
    expect(container.querySelectorAll("#bundleSheath > g").length).toBe(n);
    expect(container.querySelectorAll("#protoxylem circle").length).toBe(2 * n);
    expect(container.querySelectorAll("#metaxylem circle").length).toBe(2 * n);
  });

  it("bundles are SCATTERED, not a continuous ring: they span many different distances from the centre, including the centre itself", () => {
    const { container } = render(<DiagramGame diagram={dg12} />);
    const d = bundlesOf(container).map(b => dist(b.x, b.y));
    const bands = [d.filter(r => r < 8), d.filter(r => r >= 8 && r < 16), d.filter(r => r >= 16 && r < 23), d.filter(r => r >= 23 && r < 30), d.filter(r => r >= 30)];
    bands.forEach(b => expect(b.length).toBeGreaterThan(0)); // 5 radial bands populated (DG10 is a single ring)
    expect(Math.max(...d) - Math.min(...d)).toBeGreaterThan(28);
  });

  it("peripheral bundles are smaller than central bundles", () => {
    const { container } = render(<DiagramGame diagram={dg12} />);
    const bs = bundlesOf(container);
    const peripheral = bs.filter(b => dist(b.x, b.y) > 30).map(b => b.s);
    const central = bs.filter(b => dist(b.x, b.y) < 15).map(b => b.s);
    expect(peripheral.length).toBeGreaterThan(0);
    expect(central.length).toBeGreaterThan(0);
    expect(Math.max(...peripheral)).toBeLessThan(Math.min(...central));
  });

  it("bundles do not overlap each other and stay inside the hypodermis", () => {
    const { container } = render(<DiagramGame diagram={dg12} />);
    const bs = bundlesOf(container);
    for (let i = 0; i < bs.length; i++) {
      expect(dist(bs[i].x, bs[i].y) + bs[i].s * 1.2).toBeLessThan(36.7);
      for (let j = i + 1; j < bs.length; j++) {
        expect(Math.hypot(bs[i].x - bs[j].x, bs[i].y - bs[j].y)).toBeGreaterThan((bs[i].s + bs[j].s) * 1.2);
      }
    }
  });

  it("in EVERY bundle phloem is on the outer side and xylem/water cavity on the inner side; protoxylem sits inward of metaxylem's wide vessels", () => {
    const { container } = render(<DiagramGame diagram={dg12} />);
    // "outer" is undefined for the single bundle sitting exactly on the stem's axis, so it is skipped
    bundlesOf(container).filter(b => dist(b.x, b.y) > 3).forEach(b => {
      const phloem = toGlobal(b, 0, -0.52), cavity = toGlobal(b, 0, 0.66), proto = toGlobal(b, 0.18, 0.38), metaL = toGlobal(b, -0.5, 0.02);
      const dPh = dist(...phloem), dCav = dist(...cavity), dPro = dist(...proto);
      expect(dPh).toBeGreaterThan(dPro);
      expect(dPro).toBeGreaterThan(dCav);
      expect(dPh).toBeGreaterThan(dist(...metaL));
    });
  });

  it("is clearly different from DG10: different component, scattered not ringed, no cortex/pith structures", () => {
    const dg10 = DIAGRAM_DATA.find(d => d.id === "dg10");
    expect(DIAGRAM_SVG_COMPONENTS.monocotStem).not.toBe(DIAGRAM_SVG_COMPONENTS.dicotStem);
    expect(dg12.structures.map(s => s.id)).not.toEqual(dg10.structures.map(s => s.id));
    ["cortex", "pith", "cambium", "pericycle", "endodermis"].forEach(id => expect(dg12.structures.some(s => s.id === id)).toBe(false));
  });

  it("every pin sits on its own structure: bundle parts on the featured bundle, ground tissue between bundles, hypodermis/epidermis on their rings", () => {
    const { container } = render(<DiagramGame diagram={dg12} />);
    const bs = bundlesOf(container);
    const pin = (id) => { const s = dg12.structures.find(x => x.id === id); return [s.position.xPct, s.position.yPct]; };
    ["vascularBundle", "bundleSheath", "phloem", "waterCavity", "protoxylem", "metaxylem"].forEach(id => {
      const [px, py] = pin(id);
      const host = bs.find(b => Math.hypot(px - b.x, py - b.y) <= b.s * 1.2);
      expect(host, `${id} pin should lie on a bundle`).toBeTruthy();
    });
    const host = bs.find(b => Math.hypot(pin("vascularBundle")[0] - b.x, pin("vascularBundle")[1] - b.y) <= b.s * 1.2);
    // part-level accuracy within that bundle (local frame -> within 0.25 bundle-units of the drawn element)
    const near = (id, lx, ly, tol) => { const [gx, gy] = toGlobal(host, lx, ly); const [px, py] = pin(id); expect(Math.hypot(gx - px, gy - py)).toBeLessThanOrEqual(host.s * tol); };
    near("phloem", 0, -0.52, 0.3);
    near("waterCavity", 0, 0.66, 0.2);
    near("protoxylem", 0.18, 0.38, 0.12);
    near("metaxylem", 0.5, 0.02, 0.3);
    near("bundleSheath", -0.79, 0.79, 0.1);
    // ground tissue pin is clear of every bundle (sits in the parenchyma)
    const [gx, gy] = pin("groundTissue");
    bs.forEach(b => expect(Math.hypot(gx - b.x, gy - b.y)).toBeGreaterThan(b.s * 1.2));
    expect(dist(gx, gy)).toBeLessThan(36);
    // hypodermis and epidermis pins lie on their drawn rings
    expect(Math.abs(dist(...pin("hypodermis")) - 38.2)).toBeLessThan(1.6);
    expect(Math.abs(dist(...pin("epidermis")) - 41.2)).toBeLessThan(1.6);
  });

  it("zone order from the centre outwards: ground tissue < hypodermis < epidermis", () => {
    const s = (id) => dg12.structures.find(x => x.id === id);
    const r = (id) => dist(s(id).position.xPct, s(id).position.yPct);
    expect(r("groundTissue")).toBeLessThan(r("hypodermis"));
    expect(r("hypodermis")).toBeLessThan(r("epidermis"));
  });
});

describe("Monocot Stem (dg12) -- Diagram Center + all six modes via the generic engine", () => {
  it("loads from Diagram Center and exposes all six modes", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("T.S. of a Monocot Stem"));
    ["🔍 Explore", "🏷 Label the Diagram", "🔀 Find Mismatched Labels", "❓ Identify the Structure", "📝 Exam Challenge", "⭐ Important Points"].forEach(label => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });
  });

  it("Important Points mode shows the 9 frozen points, in order, through the generic ImportantPointsMode", () => {
    const { container } = render(<DiagramGame diagram={dg12} />);
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    expect(container.querySelector("h3").textContent).toContain("Important Points");
    EXPECTED_POINTS.forEach(p => expect(screen.getByText(p)).toBeInTheDocument());
  });

  it("Explore: every structure is selectable and shows its own name", () => {
    EXPECTED.forEach(([id, name]) => {
      const { container, unmount } = render(<DiagramGame diagram={dg12} />);
      fireEvent.click(container.querySelector(`#${id}`));
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
      unmount();
    });
  });

  it("Label: all 9 chips are offered and every structure accepts its own label (structure/label coverage)", () => {
    const { container } = render(<DiagramGame diagram={dg12} />);
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    const store = {}; const dt = { setData: (k, v) => { store[k] = v; }, getData: (k) => store[k] || "", effectAllowed: null };
    EXPECTED.forEach(([id, name]) => {
      const chip = screen.getByText(name);
      const group = container.querySelector(`#${id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });
    expect(screen.getAllByText(/9\s*\/\s*9/).length).toBeGreaterThan(0);
  });

  it("Identify: 9 questions", () => {
    render(<DiagramGame diagram={dg12} />);
    fireEvent.click(screen.getByText("❓ Identify the Structure"));
    expect(screen.getByText(/Question 1 \/ 9/)).toBeInTheDocument();
  });

  it("Exam: opens with 9 questions", () => {
    render(<DiagramGame diagram={dg12} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(/Question 1 \/ 9/)).toBeInTheDocument();
  });

  it("Mismatch: renders one pinned label per structure", () => {
    const { container } = render(<DiagramGame diagram={dg12} />);
    fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
    expect(container.querySelectorAll('button[aria-label^="Check label"]').length).toBe(9);
  });
});

describe("Monocot Stem (dg12) -- no regression to DG1-DG11", () => {
  it("dg9, dg10 and dg11 are unchanged (ids, XP, SVG components)", () => {
    const dg9 = DIAGRAM_DATA.find(d => d.id === "dg9");
    const dg10 = DIAGRAM_DATA.find(d => d.id === "dg10");
    const dg11 = DIAGRAM_DATA.find(d => d.id === "dg11");
    expect(dg9.structures.map(s => s.id)).toEqual(["epidermis", "cortex", "endodermis", "pericycle", "xylem", "phloem", "cambium", "pith", "lateralRoot"]);
    expect([dg9.xpReward, dg9.image.component]).toEqual([65, "dicotRoot"]);
    expect(dg10.structures.length).toBe(10);
    expect([dg10.xpReward, dg10.image.component]).toEqual([63, "dicotStem"]);
    expect(dg11.title).toBe("T.S. of a Monocot Root");
    expect(dg11.structures.map(s => s.id)).toEqual(["rootHair", "epidermis", "cortex", "endodermis", "pericycle", "phloem", "protoxylem", "metaxylem", "pith"]);
    expect([dg11.xpReward, dg11.image.component]).toEqual([65, "monocotRoot"]);
  });

  it("dg1 through dg12 are all present, with unique ids and unique SVG components", () => {
    for (let i = 1; i <= 12; i++) expect(DIAGRAM_DATA.find(d => d.id === `dg${i}`)).toBeTruthy();
    expect(DIAGRAM_DATA.length).toBe(12);
    expect(new Set(DIAGRAM_DATA.map(d => d.id)).size).toBe(12);
    const svgRefs = DIAGRAM_DATA.filter(d => d.image?.type === "svg").map(d => DIAGRAM_SVG_COMPONENTS[d.image.component]);
    expect(new Set(svgRefs).size).toBe(svgRefs.length);
  });
});
