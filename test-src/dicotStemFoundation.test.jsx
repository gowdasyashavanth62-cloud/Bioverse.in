import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { DIAGRAM_DATA, DIAGRAM_SVG_COMPONENTS, normalizeDiagram } from "./AppUnderTest.jsx";

const raw10 = DIAGRAM_DATA.find(d => d.id === "dg10");
const dg10 = normalizeDiagram(raw10);
const DicotStemSVG = DIAGRAM_SVG_COMPONENTS.dicotStem;

const EXPECTED_IDS = [
  "epidermis", "hypodermis", "cortex", "endodermis", "pericycle",
  "phloem", "cambium", "xylem", "medullaryRay", "pith",
];

// ── Registration ────────────────────────────────────────────────────────
describe("Dicot Stem (dg10) — registration", () => {
  it("exists and uses the normalized schema (has structures[])", () => {
    expect(raw10).toBeTruthy();
    expect(Array.isArray(raw10.structures)).toBe(true);
    expect(dg10.structures).toBe(raw10.structures); // already-normalized data passes through unchanged
  });

  it("has the correct id, title, level, chapter, category", () => {
    expect(dg10.id).toBe("dg10");
    expect(dg10.title).toBe("T.S. of a Dicot Stem");
    expect(dg10.level).toBe("1st PU");
    expect(dg10.chapter).toBe("Ch 6 Anatomy of Flowering Plants");
    expect(dg10.category).toBe("Plant Anatomy");
  });

  it("has a non-empty description mentioning it is a transverse section of a dicot stem", () => {
    expect(typeof dg10.description).toBe("string");
    expect(dg10.description.length).toBeGreaterThan(20);
    expect(dg10.description.toLowerCase()).toMatch(/transverse section/);
    expect(dg10.description.toLowerCase()).toMatch(/dicotyledonous stem|dicot stem/);
  });
});

// ── XP ──────────────────────────────────────────────────────────────────
describe("Dicot Stem (dg10) — XP", () => {
  it("xpReward is exactly 63 (proportional to its 10 structures, consistent with the other anatomy diagrams)", () => {
    expect(dg10.xpReward).toBe(63);
  });

  it("is not arbitrarily inflated relative to neighbouring anatomy diagrams", () => {
    const dg8 = DIAGRAM_DATA.find(d => d.id === "dg8"); // 11 structures, 60 XP
    const dg9 = DIAGRAM_DATA.find(d => d.id === "dg9"); // 9 structures, 65 XP
    expect(dg10.xpReward).toBeGreaterThanOrEqual(dg8.xpReward);
    expect(dg10.xpReward).toBeLessThanOrEqual(dg9.xpReward);
  });
});

// ── Important Points ───────────────────────────────────────────────────
describe("Dicot Stem (dg10) — Important Points", () => {
  it("has 7–9 concise important points", () => {
    expect(Array.isArray(dg10.importantPoints)).toBe(true);
    expect(dg10.importantPoints.length).toBeGreaterThanOrEqual(7);
    expect(dg10.importantPoints.length).toBeLessThanOrEqual(9);
    dg10.importantPoints.forEach(p => {
      expect(typeof p).toBe("string");
      expect(p.length).toBeGreaterThan(10);
    });
  });

  it("covers the key dicot-stem concepts using textbook terminology", () => {
    const joined = dg10.importantPoints.join(" ").toLowerCase();
    ["epidermis", "hypodermis", "cortex", "endodermis", "pericycle",
     "xylem", "phloem", "cambium", "medullary ray", "pith", "endarch", "ring"]
      .forEach(term => expect(joined).toMatch(term));
  });

  it("does not borrow dicot-root-only structure names (casparian strips, epiblema, lateral root) — DG10 is a stem, not a root", () => {
    // A brief contrastive mention of DG9's exarch xylem ("the reverse of
    // the exarch xylem seen in a dicot root") is legitimate, useful
    // pedagogy — not terminology bleed. What must NOT appear is content
    // borrowed from the root's own structure set.
    const joined = dg10.importantPoints.join(" ").toLowerCase();
    ["casparian", "epiblema", "lateral root"].forEach(term => {
      expect(joined).not.toMatch(term);
    });
  });
});

// ── Structure count and ids ─────────────────────────────────────────────
describe("Dicot Stem (dg10) — structure count and ids", () => {
  it("has exactly 10 structures (real textbook-named zones, not padded to match DG9's count)", () => {
    expect(dg10.structures.length).toBe(10);
  });

  it("has exactly the expected structure ids, no more, no less", () => {
    const ids = dg10.structures.map(s => s.id).sort();
    expect(ids).toEqual([...EXPECTED_IDS].sort());
  });

  it("has no duplicate structure ids", () => {
    const ids = dg10.structures.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses the exact canonical ids (not renamed variants)", () => {
    EXPECTED_IDS.forEach(id => {
      expect(dg10.structures.find(s => s.id === id)).toBeTruthy();
    });
    // guards against common rename/invented-structure drift
    ["epiblema", "casparianStrip", "bundleSheath", "conjunctiveTissue"].forEach(bad => {
      expect(dg10.structures.find(s => s.id === bad)).toBeFalsy();
    });
  });

  it("does not include dg9's root-only lateralRoot structure", () => {
    expect(dg10.structures.find(s => s.id === "lateralRoot")).toBeFalsy();
  });
});

// ── Textbook-terminology check per structure ────────────────────────────
describe("Dicot Stem (dg10) — textbook-correct names and quiz answers", () => {
  const NAME_BY_ID = {
    epidermis: "Epidermis", hypodermis: "Hypodermis", cortex: "Cortex",
    endodermis: "Endodermis", pericycle: "Pericycle", phloem: "Phloem",
    cambium: "Cambium", xylem: "Xylem", medullaryRay: "Medullary Ray", pith: "Pith",
  };
  Object.entries(NAME_BY_ID).forEach(([id, name]) => {
    it(`"${id}" is named "${name}" (exact NCERT term)`, () => {
      const s = dg10.structures.find(x => x.id === id);
      expect(s.name).toBe(name);
    });
  });

  it("endodermis's quiz accepts the textbook's alternate name 'starch sheath'", () => {
    const s = dg10.structures.find(x => x.id === "endodermis");
    expect(s.quiz.acceptableAnswers).toContain("endodermis");
    expect(s.quiz.acceptableAnswers).toContain("starch sheath");
  });

  it("xylem's explanation correctly states endarch orientation (protoxylem toward pith), not exarch", () => {
    const s = dg10.structures.find(x => x.id === "xylem");
    expect(s.explanation.toLowerCase()).toMatch(/endarch/);
    expect(s.explanation.toLowerCase()).not.toMatch(/exarch(?!\s+xylem found)/);
  });

  it("pericycle's explanation correctly describes semi-lunar patches, not a continuous ring", () => {
    const s = dg10.structures.find(x => x.id === "pericycle");
    expect(s.explanation.toLowerCase()).toMatch(/semi-lunar|crescent/);
  });
});

// ── Per-structure field integrity ───────────────────────────────────────
describe("Dicot Stem (dg10) — every structure has complete, valid fields", () => {
  dg10.structures.forEach(s => {
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

  it("no two structures share the exact same labelPosition (readable, non-overlapping labels)", () => {
    const keys = dg10.structures.map(s => `${s.labelPosition.xPct},${s.labelPosition.yPct}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// ── SVG registration and rendering ──────────────────────────────────────
describe("Dicot Stem (dg10) — SVG", () => {
  afterEach(() => cleanup());

  it("resolves to DicotStemSVG through the existing registry", () => {
    expect(dg10.image).toEqual({ type: "svg", component: "dicotStem" });
    expect(DIAGRAM_SVG_COMPONENTS.dicotStem).toBeTruthy();
    expect(DIAGRAM_SVG_COMPONENTS.dicotStem).toBe(DicotStemSVG);
  });

  it("renders an actual <svg> with viewBox=\"0 0 100 100\"", () => {
    const { container } = render(<DicotStemSVG />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
  });

  it("renders a <g> element for every one of the 10 structures", () => {
    const { container } = render(<DicotStemSVG />);
    EXPECTED_IDS.forEach(id => {
      expect(container.querySelector(`#${id}`)).toBeTruthy();
    });
  });

  it("every structure group renders at least one real SVG shape (correspondence between coordinates data and actual artwork)", () => {
    const { container } = render(<DicotStemSVG />);
    EXPECTED_IDS.forEach(id => {
      const group = container.querySelector(`#${id}`);
      const shapeChildren = group.querySelectorAll("circle, path, ellipse, polygon, rect");
      expect(shapeChildren.length).toBeGreaterThan(0);
    });
  });

  it("renders 6 discrete vascular bundles (ring arrangement) for phloem/cambium/xylem/pericycle — the defining stem feature", () => {
    const { container } = render(<DicotStemSVG />);
    expect(container.querySelectorAll("#phloem path").length).toBe(6);
    expect(container.querySelectorAll("#cambium path").length).toBe(6);
    expect(container.querySelectorAll("#xylem path").length).toBe(6);
    expect(container.querySelectorAll("#pericycle path").length).toBe(6);
    expect(container.querySelectorAll("#medullaryRay path").length).toBe(6);
  });

  it("has different visual geometry from DG9: 6 discrete xylem wedges instead of 1 continuous exarch star", () => {
    const { container } = render(<DicotStemSVG />);
    // DG9's xylem is a single <polygon> star; DG10's is 6 separate <path> wedges.
    expect(container.querySelectorAll("#xylem polygon").length).toBe(0);
    expect(container.querySelectorAll("#xylem path").length).toBe(6);
  });

  it("epidermis/hypodermis/cortex/endodermis render as concentric ring boundaries", () => {
    const { container } = render(<DicotStemSVG />);
    expect(container.querySelector("#epidermis circle")).toBeTruthy();
    expect(container.querySelector("#hypodermis circle")).toBeTruthy();
    expect(container.querySelector("#cortex circle")).toBeTruthy();
    expect(container.querySelector("#endodermis circle")).toBeTruthy();
  });

  it("pith renders as a large central circle", () => {
    const { container } = render(<DicotStemSVG />);
    const pith = container.querySelector("#pith circle");
    expect(pith).toBeTruthy();
    expect(Number(pith.getAttribute("r"))).toBeGreaterThan(0);
  });

  it("introduces no external image dependency (no <image>, no base64, no PNG/JPG/WebP url)", () => {
    const { container } = render(<DicotStemSVG />);
    expect(container.querySelector("image")).toBeFalsy();
    expect(container.innerHTML).not.toMatch(/data:image\//);
    expect(container.innerHTML).not.toMatch(/\.(png|jpe?g|webp)/i);
  });

  it("clicking a structure calls onSelectStructure with that id, without any prior hover", () => {
    const clicks = [];
    const { container } = render(<DicotStemSVG onSelectStructure={(id) => clicks.push(id)} />);
    fireEvent.click(container.querySelector("#xylem"));
    expect(clicks).toEqual(["xylem"]);
  });

  it("every one of the 10 structures is independently clickable", () => {
    EXPECTED_IDS.forEach(id => {
      const clicks = [];
      const { container, unmount } = render(<DicotStemSVG onSelectStructure={(clickedId) => clicks.push(clickedId)} />);
      fireEvent.click(container.querySelector(`#${id}`));
      expect(clicks).toEqual([id]);
      unmount();
    });
  });
});

// ── Normalization ────────────────────────────────────────────────────────
describe("Dicot Stem (dg10) — normalizeDiagram", () => {
  it("passes dg10 through normalizeDiagram with structure count and required fields intact", () => {
    const normalized = normalizeDiagram(raw10);
    expect(normalized.structures.length).toBe(10);
    expect(normalized.id).toBe("dg10");
    expect(normalized.image.type).toBe("svg");
    expect(normalized.image.component).toBe("dicotStem");
    expect(normalized.xpReward).toBe(63);
    normalized.structures.forEach(s => {
      expect(s.id).toBeTruthy();
      expect(s.quiz && Array.isArray(s.quiz.acceptableAnswers)).toBe(true);
    });
  });
});

// ── Thumbnail ─────────────────────────────────────────────────────────────
describe("Dicot Stem (dg10) — Diagram Center thumbnail", () => {
  it("DIAGRAM_DATA declares svg-type artwork (not emoji/placeholder) for its card thumbnail", () => {
    expect(dg10.image.type).toBe("svg");
    expect(dg10.image.component).toBe("dicotStem");
  });

  it("its thumbnail component is distinct from every other diagram's (unique artwork, including DG9)", () => {
    const others = DIAGRAM_DATA.filter(d => d.id !== "dg10").map(d => normalizeDiagram(d));
    others.forEach(o => {
      if (o.image?.type === "svg") {
        expect(DIAGRAM_SVG_COMPONENTS[o.image.component]).not.toBe(DicotStemSVG);
      }
    });
  });
});

// ── Regression: DG1–DG9 still present, DG10 additive only ───────────────
describe("Dicot Stem (dg10) — regression: prior diagrams untouched", () => {
  it("DG1 through DG9 all still exist", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6", "dg7", "dg8", "dg9"].forEach(id => {
      expect(DIAGRAM_DATA.find(d => d.id === id)).toBeTruthy();
    });
  });

  it("DIAGRAM_DATA now has exactly 10 diagrams (DG1–DG9 plus the new DG10)", () => {
    expect(DIAGRAM_DATA.length).toBe(10);
  });

  it("DG11 has not been started", () => {
    expect(DIAGRAM_DATA.find(d => d.id === "dg11")).toBeFalsy();
  });

  it("dg8's and dg9's own XP and structure counts are unchanged by adding dg10", () => {
    const dg8 = DIAGRAM_DATA.find(d => d.id === "dg8");
    const dg9 = DIAGRAM_DATA.find(d => d.id === "dg9");
    expect(dg8.xpReward).toBe(60);
    expect(dg8.structures.length).toBe(11);
    expect(dg9.xpReward).toBe(65);
    expect(dg9.structures.length).toBe(9);
  });

  it("dg9's own structure ids/quiz answers are byte-for-byte unchanged", () => {
    const dg9 = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg9"));
    const ids = dg9.structures.map(s => s.id).sort();
    expect(ids).toEqual(["cambium", "cortex", "endodermis", "epidermis", "lateralRoot", "pericycle", "phloem", "pith", "xylem"].sort());
  });

  it("the existing SVG registry still has every prior component alongside the new dicotStem entry", () => {
    ["animalCell", "humanHeart", "leafCrossSection", "dnaDoubleHelix", "flowerStructure",
     "ecosystemPyramid", "prokaryoticCell", "plantCell", "dicotRoot", "dicotStem"]
      .forEach(key => expect(DIAGRAM_SVG_COMPONENTS[key]).toBeTruthy());
  });

  it("DicotRootSVG (DG9) still renders correctly and is unaffected by DicotStemSVG's registration", () => {
    const DicotRootSVG = DIAGRAM_SVG_COMPONENTS.dicotRoot;
    const { container, unmount } = render(<DicotRootSVG />);
    expect(container.querySelector("svg").getAttribute("viewBox")).toBe("0 0 100 100");
    expect(container.querySelectorAll("#phloem ellipse").length).toBe(4); // DG9's own shape, untouched
    unmount();
  });
});

// ── Responsive / accessibility foundation ────────────────────────────────
describe("Dicot Stem (dg10) — responsive/accessibility foundation", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  afterEach(() => cleanup());

  [
    { label: "mobile (390px)", width: 390 },
    { label: "mobile (412px)", width: 412 },
    { label: "tablet", width: 820 },
    { label: "laptop", width: 1024 },
    { label: "desktop", width: 1440 },
  ].forEach(({ label, width }) => {
    it(`${label}: SVG renders with no horizontal overflow, structure data stays accessible`, () => {
      setWidth(width);
      const wrapper = document.createElement("div");
      wrapper.style.width = "100%";
      wrapper.style.maxWidth = `${width}px`;
      document.body.appendChild(wrapper);

      const { container, unmount } = render(<DicotStemSVG />, { container: wrapper });
      const svg = container.querySelector("svg");
      expect(svg).toBeTruthy();
      // percentage-based viewBox sizing means the SVG itself never forces
      // horizontal overflow regardless of viewport width
      expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
      expect(svg.style.width).toBe("100%");

      expect(dg10.structures.length).toBe(10);
      EXPECTED_IDS.forEach(id => expect(container.querySelector(`#${id}`)).toBeTruthy());

      unmount();
      wrapper.remove();
    });
  });

  it("has an aria-label describing the diagram for accessibility", () => {
    const { container, unmount } = render(<DicotStemSVG />);
    const svg = container.querySelector("svg");
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toMatch(/dicot stem/i);
    unmount();
  });

  it("interactive structures are clickable without requiring a prior hover/mouseenter event (tap-first)", () => {
    const clicks = [];
    const { container, unmount } = render(<DicotStemSVG onSelectStructure={(id) => clicks.push(id)} />);
    // no fireEvent.mouseEnter anywhere above -- click alone must work
    fireEvent.click(container.querySelector("#pith"));
    expect(clicks).toEqual(["pith"]);
    unmount();
  });
});
