import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, DIAGRAM_SVG_COMPONENTS, normalizeDiagram } from "./AppUnderTest.jsx";

const raw = DIAGRAM_DATA.find(d => d.id === "dg11");
const dg11 = normalizeDiagram(raw);

const EXPECTED = [
  ["rootHair", "Root hair"], ["epidermis", "Epidermis"], ["cortex", "Cortex"],
  ["endodermis", "Endodermis"], ["pericycle", "Pericycle"], ["phloem", "Phloem"],
  ["protoxylem", "Protoxylem"], ["metaxylem", "Metaxylem"], ["pith", "Pith"],
];
const EXPECTED_IDS = EXPECTED.map(([id]) => id);

const EXPECTED_POINTS = [
  "The outermost layer of the monocot root is the epidermis, with root hairs arising from epidermal cells.",
  "The cortex consists of several layers of parenchymatous cells.",
  "The innermost layer of the cortex is the endodermis.",
  "The pericycle lies immediately inside the endodermis.",
  "The vascular bundles of the monocot root are radial.",
  "Monocot roots generally have more than six xylem bundles, making the xylem polyarch.",
  "The xylem is exarch, with protoxylem toward the outside and metaxylem toward the centre.",
  "The pith is large and well developed in the monocot root.",
  "Monocotyledonous roots do not undergo secondary growth.",
];

let consoleErrorSpy;
beforeEach(() => { consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => { consoleErrorSpy.mockRestore(); cleanup(); });

describe("Monocot Root (dg11) -- registration and frozen specification", () => {
  it("exists with the exact title, chapter, category, XP and SVG registry reference", () => {
    expect(raw).toBeTruthy();
    expect(dg11.title).toBe("T.S. of a Monocot Root");
    expect(dg11.chapter).toBe("Ch 6 Anatomy of Flowering Plants");
    expect(dg11.category).toBe("Plant Anatomy");
    expect(dg11.level).toBe("1st PU");
    expect(dg11.xpReward).toBe(65);
    expect(dg11.image).toEqual({ type: "svg", component: "monocotRoot" });
    expect(typeof DIAGRAM_SVG_COMPONENTS.monocotRoot).toBe("function");
    expect(dg11.description.toLowerCase()).toMatch(/transverse section/);
  });

  it("has EXACTLY the 9 specified structures, in order, with the exact ids and names", () => {
    expect(dg11.structures.length).toBe(9);
    expect(dg11.structures.map(s => s.id)).toEqual(EXPECTED_IDS);
    expect(dg11.structures.map(s => s.name)).toEqual(EXPECTED.map(([, n]) => n));
    expect(new Set(EXPECTED_IDS).size).toBe(9);
  });

  it("contains no concept-only structures (Casparian strips, passage cells, stele, bundles, conjunctive tissue, xylem, polyarch, exarch, secondary growth)", () => {
    const forbidden = ["casparian", "passage", "stele", "vascular", "bundle", "conjunctive", "polyarch", "exarch", "secondary", "cambium", "lateral"];
    dg11.structures.forEach(s => {
      forbidden.forEach(f => {
        expect(s.id.toLowerCase()).not.toContain(f);
        expect(s.name.toLowerCase()).not.toContain(f);
      });
    });
    expect(dg11.structures.some(s => s.id === "xylem")).toBe(false); // only protoxylem / metaxylem exist
  });

  it("has EXACTLY the 9 frozen important points, verbatim", () => {
    expect(dg11.importantPoints.length).toBe(9);
    expect(dg11.importantPoints).toEqual(EXPECTED_POINTS);
  });

  it("every structure follows the frozen schema (positions in 0-100, text fields, quiz answers incl. canonical name)", () => {
    dg11.structures.forEach(s => {
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
    const answers = Object.fromEntries(dg11.structures.map(s => [s.id, s.quiz.acceptableAnswers]));
    expect(answers.rootHair).toEqual(["root hair", "root hairs"]);
    expect(answers.epidermis).toEqual(["epidermis", "epiblema"]);
    expect(answers.cortex).toEqual(["cortex"]);
    expect(answers.endodermis).toEqual(["endodermis"]);
    expect(answers.pericycle).toEqual(["pericycle"]);
    expect(answers.phloem).toEqual(["phloem"]);
    expect(answers.protoxylem).toEqual(["protoxylem", "proto xylem"]);
    expect(answers.metaxylem).toEqual(["metaxylem", "meta xylem"]);
    expect(answers.pith).toEqual(["pith"]);
    // no answer may be shared between two structures
    const flat = Object.values(answers).flat();
    expect(new Set(flat).size).toBe(flat.length);
  });

  it("pin positions and label positions are all unique (no overlapping targets or label slots)", () => {
    const pins = dg11.structures.map(s => `${s.position.xPct}|${s.position.yPct}`);
    const labels = dg11.structures.map(s => `${s.labelPosition.xPct}|${s.labelPosition.yPct}`);
    expect(new Set(pins).size).toBe(9);
    expect(new Set(labels).size).toBe(9);
  });
});

describe("Monocot Root (dg11) -- SVG", () => {
  it("MonocotRootSVG renders inline pure SVG (responsive viewBox, accessible, no <image>/<foreignObject>/external href)", () => {
    const { container } = render(<DiagramGame diagram={dg11} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toMatch(/monocot root/i);
    expect(svg.querySelector("image, foreignObject")).toBeNull();
    expect(svg.outerHTML).not.toMatch(/https?:\/\//i.source ? /href="https?:/ : /x/);
  });

  it("renders exactly one selectable <g> per structure id, and nothing else with those ids", () => {
    const { container } = render(<DiagramGame diagram={dg11} />);
    EXPECTED_IDS.forEach(id => {
      const matches = container.querySelectorAll(`#${id}`);
      expect(matches.length).toBe(1);
      expect(matches[0].tagName.toLowerCase()).toBe("g");
    });
  });

  it("is visibly different from DG9: many (polyarch) xylem poles, root hairs, and a large pith", () => {
    const { container } = render(<DiagramGame diagram={dg11} />);
    // 10 xylem poles => more than six, i.e. polyarch
    expect(container.querySelectorAll("#metaxylem circle").length).toBeGreaterThan(6);
    expect(container.querySelectorAll("#protoxylem circle").length).toBeGreaterThan(6);
    // phloem patches alternate with the poles (same count)
    expect(container.querySelectorAll("#phloem circle").length).toBe(container.querySelectorAll("#metaxylem circle").length);
    // root hairs all round the epidermis
    expect(container.querySelectorAll("#rootHair line").length).toBeGreaterThanOrEqual(12);
    // pith radius is large relative to the root (DG9's pith is tiny)
    const pith = container.querySelector("#pith circle");
    expect(Number(pith.getAttribute("r"))).toBeGreaterThanOrEqual(8);
  });

  it("protoxylem lies OUTSIDE metaxylem within each pole (exarch), phloem alternates between poles", () => {
    const { container } = render(<DiagramGame diagram={dg11} />);
    const dist = (el) => Math.hypot(Number(el.getAttribute("cx")) - 50, Number(el.getAttribute("cy")) - 50);
    const proto = Array.from(container.querySelectorAll("#protoxylem circle"));
    const meta = Array.from(container.querySelectorAll("#metaxylem circle"));
    proto.forEach((p, i) => expect(dist(p)).toBeGreaterThan(dist(meta[i])));
    const ang = (el) => (Math.atan2(Number(el.getAttribute("cy")) - 50, Number(el.getAttribute("cx")) - 50) * 180 / Math.PI + 360) % 360;
    const phloem = Array.from(container.querySelectorAll("#phloem circle"));
    phloem.forEach((ph, i) => {
      const a = ang(ph);
      const nearestPole = Math.min(...meta.map(m => { const d = Math.abs(ang(m) - a); return Math.min(d, 360 - d); }));
      expect(nearestPole).toBeGreaterThan(10); // sits between poles, not on one
    });
  });

  it("each structure's pin sits on (or immediately next to) its own drawn element, in the right concentric zone", () => {
    const zone = (id) => { const s = dg11.structures.find(x => x.id === id); return Math.hypot(s.position.xPct - 50, s.position.yPct - 50); };
    expect(zone("pith")).toBeLessThan(6);
    expect(zone("metaxylem")).toBeLessThan(zone("protoxylem"));
    expect(zone("protoxylem")).toBeLessThan(zone("pericycle"));
    expect(zone("pericycle")).toBeLessThan(zone("endodermis") + 0.01);
    expect(zone("endodermis")).toBeLessThan(zone("cortex"));
    expect(zone("cortex")).toBeLessThan(zone("epidermis"));
    expect(zone("epidermis")).toBeLessThan(zone("rootHair"));
    expect(zone("phloem")).toBeGreaterThan(zone("metaxylem") - 0.01);
    expect(zone("phloem")).toBeLessThan(zone("pericycle"));
  });
});

describe("Monocot Root (dg11) -- Diagram Center + all six modes via the generic engine", () => {
  it("loads from Diagram Center and exposes all six modes", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("T.S. of a Monocot Root"));
    ["🔍 Explore", "🏷 Label the Diagram", "🔀 Find Mismatched Labels", "❓ Identify the Structure", "📝 Exam Challenge", "⭐ Important Points"].forEach(label => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });
  });

  it("Important Points mode shows the 9 frozen points, in order, through the generic ImportantPointsMode", () => {
    const { container } = render(<DiagramGame diagram={dg11} />);
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    expect(container.querySelector("h3").textContent).toContain("Important Points");
    EXPECTED_POINTS.forEach(p => expect(screen.getByText(p)).toBeInTheDocument());
  });

  it("Explore: every structure is selectable and shows its own name", () => {
    EXPECTED.forEach(([id, name]) => {
      const { container, unmount } = render(<DiagramGame diagram={dg11} />);
      fireEvent.click(container.querySelector(`#${id}`));
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
      unmount();
    });
  });

  it("Label: all 9 chips are offered and every structure accepts its own label (structure/label coverage)", () => {
    const { container } = render(<DiagramGame diagram={dg11} />);
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

  it("Identify: 9 questions, each a highlighted structure with 4 options including the right name", () => {
    render(<DiagramGame diagram={dg11} />);
    fireEvent.click(screen.getByText("❓ Identify the Structure"));
    expect(screen.getByText(/Question 1 \/ 9/)).toBeInTheDocument();
  });

  it("Exam: opens with 9 questions", () => {
    render(<DiagramGame diagram={dg11} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(/Question 1 \/ 9/)).toBeInTheDocument();
  });

  it("Mismatch: renders one pinned label per structure", () => {
    const { container } = render(<DiagramGame diagram={dg11} />);
    fireEvent.click(screen.getByText("🔀 Find Mismatched Labels"));
    expect(container.querySelectorAll('button[aria-label^="Check label"]').length).toBe(9);
  });
});

describe("Monocot Root (dg11) -- no regression to DG9 / DG10", () => {
  it("dg9 and dg10 are unchanged (counts, ids, XP, SVG components)", () => {
    const dg9 = DIAGRAM_DATA.find(d => d.id === "dg9");
    const dg10 = DIAGRAM_DATA.find(d => d.id === "dg10");
    expect(dg9.title).toBe("T.S. of a Dicot Root");
    expect(dg9.structures.map(s => s.id)).toEqual(["epidermis", "cortex", "endodermis", "pericycle", "xylem", "phloem", "cambium", "pith", "lateralRoot"]);
    expect(dg9.xpReward).toBe(65);
    expect(dg9.image.component).toBe("dicotRoot");
    expect(dg10.title).toBe("T.S. of a Dicot Stem");
    expect(dg10.structures.length).toBe(10);
    expect(dg10.xpReward).toBe(63);
    expect(dg10.image.component).toBe("dicotStem");
    expect(DIAGRAM_SVG_COMPONENTS.monocotRoot).not.toBe(DIAGRAM_SVG_COMPONENTS.dicotRoot);
  });

  it("dg1 through dg11 are all present, with unique ids and unique SVG components", () => {
    for (let i = 1; i <= 11; i++) expect(DIAGRAM_DATA.find(d => d.id === `dg${i}`)).toBeTruthy();
    expect(DIAGRAM_DATA.length).toBe(12);
    const svgRefs = DIAGRAM_DATA.filter(d => d.image?.type === "svg").map(d => DIAGRAM_SVG_COMPONENTS[d.image.component]);
    expect(new Set(svgRefs).size).toBe(svgRefs.length);
  });
});
