import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { DIAGRAM_DATA, DIAGRAM_SVG_COMPONENTS, normalizeDiagram } from "./AppUnderTest.jsx";

const raw9 = DIAGRAM_DATA.find(d => d.id === "dg9");
const dg9 = normalizeDiagram(raw9);
const DicotRootSVG = DIAGRAM_SVG_COMPONENTS.dicotRoot;

const EXPECTED_IDS = [
  "epidermis", "cortex", "endodermis", "pericycle", "xylem",
  "phloem", "cambium", "pith", "lateralRoot",
];

// ── Registration ────────────────────────────────────────────────────────
describe("Dicot Root (dg9) — registration", () => {
  it("exists and uses the normalized schema (has structures[])", () => {
    expect(raw9).toBeTruthy();
    expect(Array.isArray(raw9.structures)).toBe(true);
    expect(dg9.structures).toBe(raw9.structures); // already-normalized data passes through unchanged
  });

  it("has the correct id, title, level, chapter, category", () => {
    expect(dg9.id).toBe("dg9");
    expect(dg9.title).toBe("T.S. of a Dicot Root");
    expect(dg9.level).toBe("1st PU");
    expect(dg9.chapter).toBe("Ch 6 Anatomy of Flowering Plants");
    expect(dg9.category).toBe("Plant Anatomy");
  });

  it("has a non-empty description mentioning it is a transverse section of a dicot root", () => {
    expect(typeof dg9.description).toBe("string");
    expect(dg9.description.length).toBeGreaterThan(20);
    expect(dg9.description.toLowerCase()).toMatch(/transverse section/);
    expect(dg9.description.toLowerCase()).toMatch(/dicot root/);
  });
});

// ── XP ──────────────────────────────────────────────────────────────────
describe("Dicot Root (dg9) — XP", () => {
  it("xpReward is exactly 65", () => {
    expect(dg9.xpReward).toBe(65);
  });
});

// ── Important Points ───────────────────────────────────────────────────
describe("Dicot Root (dg9) — Important Points", () => {
  it("has 7–9 concise important points", () => {
    expect(Array.isArray(dg9.importantPoints)).toBe(true);
    expect(dg9.importantPoints.length).toBeGreaterThanOrEqual(7);
    expect(dg9.importantPoints.length).toBeLessThanOrEqual(9);
    dg9.importantPoints.forEach(p => {
      expect(typeof p).toBe("string");
      expect(p.length).toBeGreaterThan(10);
    });
  });

  it("covers the key dicot-root concepts", () => {
    const joined = dg9.importantPoints.join(" ").toLowerCase();
    ["epidermis", "cortex", "endodermis", "pericycle", "xylem", "phloem", "cambium", "pith", "lateral root"]
      .forEach(term => expect(joined).toMatch(term));
  });
});

// ── Structure count and ids ─────────────────────────────────────────────
describe("Dicot Root (dg9) — structure count and ids", () => {
  it("has exactly 9 structures", () => {
    expect(dg9.structures.length).toBe(9);
  });

  it("has exactly the expected structure ids, no more, no less", () => {
    const ids = dg9.structures.map(s => s.id).sort();
    expect(ids).toEqual([...EXPECTED_IDS].sort());
  });

  it("has no duplicate structure ids", () => {
    const ids = dg9.structures.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses the exact canonical ids (not renamed variants)", () => {
    EXPECTED_IDS.forEach(id => {
      expect(dg9.structures.find(s => s.id === id)).toBeTruthy();
    });
    // guards against common rename drift mentioned in the spec
    ["epidermalLayer", "xylemVessels", "phloemTissue"].forEach(bad => {
      expect(dg9.structures.find(s => s.id === bad)).toBeFalsy();
    });
  });
});

// ── Per-structure field integrity ───────────────────────────────────────
describe("Dicot Root (dg9) — every structure has complete, valid fields", () => {
  dg9.structures.forEach(s => {
    describe(`structure "${s.id}"`, () => {
      it("has a non-empty name", () => {
        expect(typeof s.name).toBe("string");
        expect(s.name.length).toBeGreaterThan(0);
      });

      it("has a concise shortDescription", () => {
        expect(typeof s.shortDescription).toBe("string");
        expect(s.shortDescription.length).toBeGreaterThan(5);
      });

      it("has a useful explanation, longer than the shortDescription", () => {
        expect(typeof s.explanation).toBe("string");
        expect(s.explanation.length).toBeGreaterThan(s.shortDescription.length);
      });

      it("has a valid position {xPct, yPct} within 0–100", () => {
        expect(s.position).toBeTruthy();
        expect(typeof s.position.xPct).toBe("number");
        expect(typeof s.position.yPct).toBe("number");
        expect(s.position.xPct).toBeGreaterThanOrEqual(0);
        expect(s.position.xPct).toBeLessThanOrEqual(100);
        expect(s.position.yPct).toBeGreaterThanOrEqual(0);
        expect(s.position.yPct).toBeLessThanOrEqual(100);
      });

      it("has a valid labelPosition {xPct, yPct} within 0–100", () => {
        expect(s.labelPosition).toBeTruthy();
        expect(typeof s.labelPosition.xPct).toBe("number");
        expect(typeof s.labelPosition.yPct).toBe("number");
        expect(s.labelPosition.xPct).toBeGreaterThanOrEqual(0);
        expect(s.labelPosition.xPct).toBeLessThanOrEqual(100);
        expect(s.labelPosition.yPct).toBeGreaterThanOrEqual(0);
        expect(s.labelPosition.yPct).toBeLessThanOrEqual(100);
      });

      it("has quiz.acceptableAnswers as a non-empty array of lowercase strings", () => {
        expect(s.quiz).toBeTruthy();
        expect(Array.isArray(s.quiz.acceptableAnswers)).toBe(true);
        expect(s.quiz.acceptableAnswers.length).toBeGreaterThan(0);
        s.quiz.acceptableAnswers.forEach(a => {
          expect(typeof a).toBe("string");
          expect(a).toBe(a.toLowerCase());
        });
      });
    });
  });
});

// ── SVG registration and rendering ──────────────────────────────────────
describe("Dicot Root (dg9) — SVG", () => {
  it("resolves to DicotRootSVG through the existing registry", () => {
    expect(dg9.image).toEqual({ type: "svg", component: "dicotRoot" });
    expect(DIAGRAM_SVG_COMPONENTS.dicotRoot).toBeTruthy();
    expect(DIAGRAM_SVG_COMPONENTS.dicotRoot).toBe(DicotRootSVG);
  });

  it("renders an actual <svg> with viewBox=\"0 0 100 100\"", () => {
    const { container, unmount } = render(<DicotRootSVG />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
    unmount();
  });

  it("renders a <g> element for every one of the 9 structures", () => {
    const { container, unmount } = render(<DicotRootSVG />);
    EXPECTED_IDS.forEach(id => {
      expect(container.querySelector(`#${id}`)).toBeTruthy();
    });
    unmount();
  });

  it("renders the expected structural SVG content (rings, star xylem, phloem patches, lateral root)", () => {
    const { container, unmount } = render(<DicotRootSVG />);
    // epidermis + endodermis are ring boundaries drawn as circles
    expect(container.querySelector("#epidermis circle")).toBeTruthy();
    expect(container.querySelector("#endodermis circle")).toBeTruthy();
    // cortex is a filled circle
    expect(container.querySelector("#cortex circle")).toBeTruthy();
    // xylem is a single star-shaped polygon
    const xylemPolygon = container.querySelector("#xylem polygon");
    expect(xylemPolygon).toBeTruthy();
    expect(xylemPolygon.getAttribute("points").split(" ").length).toBeGreaterThanOrEqual(8);
    // phloem is 4 separate patches between the xylem arms
    expect(container.querySelectorAll("#phloem ellipse").length).toBe(4);
    // cambium is 4 short strips
    expect(container.querySelectorAll("#cambium path").length).toBe(4);
    // pith is a small central circle
    expect(container.querySelector("#pith circle")).toBeTruthy();
    // pericycle is a ring
    expect(container.querySelector("#pericycle circle")).toBeTruthy();
    // lateral root is a path extending outward, plus its tip
    expect(container.querySelector("#lateralRoot path")).toBeTruthy();
    expect(container.querySelector("#lateralRoot ellipse")).toBeTruthy();
    unmount();
  });

  it("introduces no external image dependency (no <image>, no base64, no PNG/JPG/WebP url)", () => {
    const { container, unmount } = render(<DicotRootSVG />);
    expect(container.querySelector("image")).toBeFalsy();
    expect(container.innerHTML).not.toMatch(/data:image\//);
    expect(container.innerHTML).not.toMatch(/\.(png|jpe?g|webp)/i);
    unmount();
  });

  it("clicking a structure calls onSelectStructure with that id, without any prior hover", () => {
    const clicks = [];
    const { container, unmount } = render(
      <DicotRootSVG onSelectStructure={(id) => clicks.push(id)} />
    );
    fireEvent.click(container.querySelector("#xylem"));
    expect(clicks).toEqual(["xylem"]);
    unmount();
  });
});

// ── Normalization ────────────────────────────────────────────────────────
describe("Dicot Root (dg9) — normalizeDiagram", () => {
  it("passes dg9 through normalizeDiagram with structure count and required fields intact", () => {
    const normalized = normalizeDiagram(raw9);
    expect(normalized.structures.length).toBe(9);
    expect(normalized.id).toBe("dg9");
    expect(normalized.image.type).toBe("svg");
    expect(normalized.image.component).toBe("dicotRoot");
    expect(normalized.xpReward).toBe(65);
    normalized.structures.forEach(s => {
      expect(s.id).toBeTruthy();
      expect(s.quiz && Array.isArray(s.quiz.acceptableAnswers)).toBe(true);
    });
  });
});

// ── Regression: DG1–DG8 still present, DG9 additive only ────────────────
describe("Dicot Root (dg9) — regression: prior diagrams untouched", () => {
  it("DG1 through DG8 all still exist", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6", "dg7", "dg8"].forEach(id => {
      expect(DIAGRAM_DATA.find(d => d.id === id)).toBeTruthy();
    });
  });

  it("DIAGRAM_DATA now has exactly 10 diagrams (DG1–DG8 plus DG9, plus the new DG10)", () => {
    expect(DIAGRAM_DATA.length).toBe(10);
  });

  it("dg7's and dg8's own XP and structure counts are unchanged by adding dg9", () => {
    const dg7 = DIAGRAM_DATA.find(d => d.id === "dg7");
    const dg8 = DIAGRAM_DATA.find(d => d.id === "dg8");
    expect(dg7.xpReward).toBe(55);
    expect(dg7.structures.length).toBe(8);
    expect(dg8.xpReward).toBe(60);
    expect(dg8.structures.length).toBe(11);
  });

  it("the existing SVG registry still has every prior component alongside the new dicotRoot entry", () => {
    ["animalCell", "humanHeart", "leafCrossSection", "dnaDoubleHelix", "flowerStructure",
     "ecosystemPyramid", "prokaryoticCell", "plantCell", "dicotRoot"]
      .forEach(key => expect(DIAGRAM_SVG_COMPONENTS[key]).toBeTruthy());
  });
});

// ── Responsive / accessibility foundation ────────────────────────────────
describe("Dicot Root (dg9) — responsive/accessibility foundation", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  afterEach(() => cleanup());

  [
    { label: "mobile", width: 390 },
    { label: "desktop", width: 1440 },
  ].forEach(({ label, width }) => {
    it(`${label} (${width}px): SVG renders with no horizontal overflow, structure data stays accessible`, () => {
      setWidth(width);
      const wrapper = document.createElement("div");
      wrapper.style.width = "100%";
      wrapper.style.maxWidth = `${width}px`;
      document.body.appendChild(wrapper);

      const { container, unmount } = render(<DicotRootSVG />, { container: wrapper });
      const svg = container.querySelector("svg");
      expect(svg).toBeTruthy();
      // percentage-based viewBox sizing means the SVG itself never forces
      // horizontal overflow regardless of viewport width
      expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
      expect(svg.style.width).toBe("100%");

      // structure data (used to render labels/quiz UI in later modes)
      // stays fully accessible regardless of viewport
      expect(dg9.structures.length).toBe(9);
      EXPECTED_IDS.forEach(id => expect(container.querySelector(`#${id}`)).toBeTruthy());

      unmount();
      wrapper.remove();
    });
  });

  it("interactive structures are clickable without requiring a prior hover/mouseenter event (tap-first)", () => {
    const clicks = [];
    const { container, unmount } = render(
      <DicotRootSVG onSelectStructure={(id) => clicks.push(id)} />
    );
    // no fireEvent.mouseEnter anywhere above -- click alone must work
    fireEvent.click(container.querySelector("#pith"));
    expect(clicks).toEqual(["pith"]);
    unmount();
  });
});
