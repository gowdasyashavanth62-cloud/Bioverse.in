import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DIAGRAM_DATA, normalizeDiagram, DIAGRAM_SVG_COMPONENTS } from "./AppUnderTest.jsx";

const REQUIRED_STRUCTURE_IDS = [
  "leftAtrium", "rightAtrium", "leftVentricle", "rightVentricle",
  "aorta", "pulmonaryArtery", "venaCava",
];

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

describe("STEP 11 — Human Heart (dg2) normalized data", () => {
  const raw = DIAGRAM_DATA.find(d => d.id === "dg2");
  const heart = normalizeDiagram(raw);

  it("dg2 exists in DIAGRAM_DATA", () => {
    expect(raw).toBeTruthy();
  });

  it("uses the svg image type registered as humanHeart", () => {
    expect(heart.image.type).toBe("svg");
    expect(heart.image.component).toBe("humanHeart");
  });

  it("the SVG registry contains humanHeart", () => {
    expect(DIAGRAM_SVG_COMPONENTS.humanHeart).toBeTruthy();
    expect(typeof DIAGRAM_SVG_COMPONENTS.humanHeart).toBe("function");
  });

  it("already has normalized structures (bypasses legacy label-array normalization)", () => {
    // normalizeDiagram returns `d` unchanged whenever `d.structures` exists —
    // confirming dg2 was upgraded to the same schema dg1 uses, not just
    // auto-converted from the old `labels` shape at read time.
    expect(raw.structures).toBeTruthy();
    expect(heart.structures).toBe(raw.structures);
  });

  it("has exactly the 7 required structures", () => {
    expect(heart.structures).toHaveLength(7);
    const ids = heart.structures.map(s => s.id).sort();
    expect(ids).toEqual([...REQUIRED_STRUCTURE_IDS].sort());
  });

  it("every structure has a stable, unique id and a name", () => {
    const ids = heart.structures.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    heart.structures.forEach(s => {
      expect(typeof s.id).toBe("string");
      expect(s.id.length).toBeGreaterThan(0);
      expect(typeof s.name).toBe("string");
      expect(s.name.length).toBeGreaterThan(0);
    });
  });

  it("every structure has position and labelPosition", () => {
    heart.structures.forEach(s => {
      expect(s.position).toBeTruthy();
      expect(typeof s.position.xPct).toBe("number");
      expect(typeof s.position.yPct).toBe("number");
      expect(s.labelPosition).toBeTruthy();
      expect(typeof s.labelPosition.xPct).toBe("number");
      expect(typeof s.labelPosition.yPct).toBe("number");
    });
  });

  it("every structure has quiz.acceptableAnswers", () => {
    heart.structures.forEach(s => {
      expect(Array.isArray(s.quiz?.acceptableAnswers)).toBe(true);
      expect(s.quiz.acceptableAnswers.length).toBeGreaterThan(0);
      expect(s.quiz.acceptableAnswers[0]).toBe(s.name.toLowerCase());
    });
  });

  it("has its own xpReward, independent of Animal Cell's", () => {
    expect(typeof heart.xpReward).toBe("number");
    expect(heart.xpReward).toBeGreaterThan(0);
    const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
    expect(animalCell.xpReward).toBe(50); // untouched
  });

  it("has concise Important Points", () => {
    expect(Array.isArray(heart.importantPoints)).toBe(true);
    expect(heart.importantPoints.length).toBeGreaterThan(0);
    heart.importantPoints.forEach(p => expect(typeof p).toBe("string"));
  });

  it("uses plain metadata (level/chapter/category) without syllabus/DB dependency", () => {
    expect(typeof heart.level).toBe("string");
    expect(typeof heart.category).toBe("string");
    // chapter is a plain filter tag, not required to resolve against anything.
  });

  it("appears correctly in the Diagram Center picker with its own distinct XP badge", async () => {
    const { DiagramCenter } = await import("./AppUnderTest.jsx");
    const { render, screen, within } = await import("@testing-library/react");
    render(<DiagramCenter />);
    const title = screen.getByText("Human Heart");
    const card = title.closest("div").parentElement;
    expect(within(card).getByText("Human Anatomy · 7 labels")).toBeInTheDocument();
    expect(within(card).getByText("+60 XP")).toBeInTheDocument(); // distinct from Animal Cell's +50 XP
  });
});

describe("STEP 11 — HumanHeartSVG rendering + generic interaction", () => {
  const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));

  it("renders a real inline SVG (not emoji/image) with all 7 structure IDs present", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.getAttribute("viewBox")).toBeTruthy();
    REQUIRED_STRUCTURE_IDS.forEach(id => {
      expect(container.querySelector(`#${id}`)).toBeTruthy();
    });
  });

  it("is responsive (scales via viewBox + 100%/100% sizing, no fixed pixel dimensions)", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    const svg = container.querySelector("svg");
    expect(svg.style.width).toBe("100%");
    expect(svg.style.height).toBe("100%");
  });

  it("generic Explore-style selection works: clicking a structure shows its info via the existing ExploreMode", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    fireEvent.click(container.querySelector("#aorta"));
    expect(screen.getByText("Aorta")).toBeInTheDocument();
    // shortDescription and explanation both legitimately mention "largest
    // artery" — assert against the explanation specifically to avoid an
    // ambiguous match between the two.
    expect(screen.getByText(/arches up from the left ventricle/i)).toBeInTheDocument();
  });

  it("Label Mode already works generically on Human Heart with zero dg2-specific code", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
    heart.structures.forEach(s => expect(screen.getByText(s.name)).toBeInTheDocument());

    const dt = { store: {}, setData(k, v) { this.store[k] = v; }, getData(k) { return this.store[k] || ""; } };
    const chip = screen.getByText("Left Ventricle");
    const group = container.querySelector("#leftVentricle");
    fireEvent.dragStart(chip, { dataTransfer: dt });
    fireEvent.dragOver(group, { dataTransfer: dt });
    fireEvent.drop(group, { dataTransfer: dt });
    expect(screen.getByText("1 / 7 Labels")).toBeInTheDocument();
  });

  it("Exam Challenge already works generically on Human Heart via quiz.acceptableAnswers", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    const targetGroup = Array.from(container.querySelectorAll("svg g")).find(
      g => g.getAttribute("style")?.includes("drop-shadow(0 0 4.5px rgba(245,158,11")
    );
    expect(targetGroup).toBeTruthy();
    const target = heart.structures.find(s => s.id === targetGroup.id);
    fireEvent.change(screen.getByLabelText("Type the structure name"), {
      target: { value: `  ${target.quiz.acceptableAnswers[0].toUpperCase()}  ` },
    });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
  });

  it("highlight states (hover/selected/locked/flash) render without crashing across a full Label session", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    const dt = { store: {}, setData(k, v) { this.store[k] = v; }, getData(k) { return this.store[k] || ""; } };
    heart.structures.forEach(s => {
      const chip = screen.queryByText(s.name);
      if (!chip) return; // already placed
      const group = container.querySelector(`#${s.id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });
    expect(screen.getByText("7 / 7 Labels")).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

describe("STEP 11 — no hardcoded dg2/Human Heart logic in generic components", () => {
  it("ExploreMode/LabelMode/MismatchMode/IdentifyMode/ExamMode contain no dg2 or heart-structure-name conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const components = ["ExploreMode", "LabelMode", "MismatchMode", "IdentifyMode", "ExamMode"];
    const boundaries = [...components, "DiagramGame"];
    const forbiddenNames = ["Left Ventricle", "Right Ventricle", "Left Atrium", "Right Atrium", "Aorta", "Pulmonary Artery", "Vena Cava"];
    components.forEach((name, i) => {
      const start = source.indexOf(`function ${name}(`);
      expect(start).toBeGreaterThan(-1);
      const rest = boundaries.slice(i + 1).map(b => source.indexOf(`function ${b}(`, start)).filter(idx => idx > start);
      const end = Math.min(...rest);
      const body = source.slice(start, end);
      forbiddenNames.forEach(n => expect(body.includes(n)).toBe(false));
      expect(body.includes('diagram.id === "dg2"')).toBe(false);
      expect(body.includes('diagram.id === "dg1"')).toBe(false);
    });
  });

  it("HumanHeartSVG contains no game-mode/scoring logic (rendering/interaction only)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function HumanHeartSVG(");
    const end = source.indexOf("const DIAGRAM_SVG_COMPONENTS", start);
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);
    ["score", "xpReward", "acceptableAnswers", "questionIndex"].forEach(term => {
      expect(body.includes(term)).toBe(false);
    });
  });
});

describe("STEP 11 — Animal Cell regression (must still pass unmodified)", () => {
  const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));

  it("Explore Mode still works", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(container.querySelector("#nucleus"));
    expect(screen.getByText("Nucleus")).toBeInTheDocument();
  });

  it("still has exactly 7 structures and xpReward 50", () => {
    expect(animalCell.structures).toHaveLength(7);
    expect(animalCell.xpReward).toBe(50);
  });

  it("Label Mode still works", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
  });
});
