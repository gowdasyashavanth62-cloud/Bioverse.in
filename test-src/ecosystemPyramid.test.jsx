import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram, DIAGRAM_SVG_COMPONENTS } from "./AppUnderTest.jsx";

const eco = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg6"));
const ECO_NAMES = eco.structures.map(s => s.name);
const ECO_IDS = eco.structures.map(s => s.id);
const TOTAL = eco.structures.length; // 5

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function open(mode) {
  const label = {
    label: "🏷 Label the Diagram",
    mismatch: "🔀 Find Mismatched Labels",
    identify: "❓ Identify the Structure",
    exam: "📝 Exam Challenge",
    points: "⭐ Important Points",
  }[mode];
  const utils = render(<DiagramGame diagram={eco} />);
  if (label) fireEvent.click(screen.getByRole("button", { name: label }));
  return utils;
}

function makeDataTransfer() {
  const store = {};
  return { setData: (k, v) => { store[k] = v; }, getData: (k) => store[k] || "" };
}

describe("Ecosystem Pyramid (dg6) — foundation", () => {
  it("is normalized with exactly 5 structures, no duplicate IDs, and a positive xpReward", () => {
    expect(eco.structures.length).toBe(5);
    expect(new Set(ECO_IDS).size).toBe(5);
    expect(eco.xpReward).toBeGreaterThan(0);
    expect(eco.labels).toBeUndefined();
  });

  it("EcosystemPyramidSVG is registered under 'ecosystemPyramid' and renders with all 5 structure IDs, no duplicates", () => {
    expect(DIAGRAM_SVG_COMPONENTS.ecosystemPyramid).toBeTruthy();
    expect(eco.image).toEqual({ type: "svg", component: "ecosystemPyramid" });
    const Comp = DIAGRAM_SVG_COMPONENTS.ecosystemPyramid;
    const { container } = render(<Comp />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    ECO_IDS.forEach(id => expect(container.querySelector(`#${id}`)).toBeTruthy());
  });

  it("EcosystemPyramidSVG is a pure renderer with no game logic", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function EcosystemPyramidSVG(");
    expect(start).toBeGreaterThan(-1);
    const end = source.indexOf("const DIAGRAM_SVG_COMPONENTS", start);
    const body = source.slice(start, end);
    ["score", "xpReward", "acceptableAnswers", "questionIndex", "choiceIds"].forEach(term => {
      expect(body.includes(term)).toBe(false);
    });
  });
});

describe("Ecosystem Pyramid (dg6) — Explore Mode", () => {
  it("renders the actual SVG (not a placeholder) and structures are selectable with an info panel", () => {
    const { container } = open("explore");
    expect(container.querySelector("svg").getAttribute("aria-label")).toMatch(/ecosystem/i);
    expect(screen.queryByText(/needs an SVG diagram/)).not.toBeInTheDocument();
    const target = eco.structures.find(s => s.id === "decomposers");
    fireEvent.click(container.querySelector("#decomposers"));
    expect(screen.getByText(target.name)).toBeInTheDocument();
    expect(screen.getByText(target.explanation)).toBeInTheDocument();
  });
});

describe("Ecosystem Pyramid (dg6) — Label Mode", () => {
  it("renders the actual SVG, supports correct desktop drag/drop and mobile tap-equivalent placement", () => {
    const { container } = open("label");
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.queryByText(/needs an SVG diagram/)).not.toBeInTheDocument();
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();

    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Producers"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#producers"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#producers"), { dataTransfer: dt });
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Decomposers"));
    fireEvent.click(container.querySelector("#decomposers"));
    expect(screen.getByText(`2 / ${TOTAL} Labels`)).toBeInTheDocument();
  });
});

describe("Ecosystem Pyramid (dg6) — Mismatch Mode", () => {
  it("renders the actual SVG and generates a checkable challenge covering every structure", () => {
    const { container } = open("mismatch");
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.queryByText(/needs an SVG diagram/)).not.toBeInTheDocument();
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
    ECO_NAMES.forEach(name => {
      expect(container.querySelector(`button[aria-label='Check label "${name}"']`)).toBeTruthy();
    });
  });

  it("correct and incorrect classifications both work", () => {
    const { container } = open("mismatch");
    const chip = container.querySelector(`button[aria-label='Check label "${ECO_NAMES[0]}"']`);
    fireEvent.click(chip);
    fireEvent.click(screen.getByText("✓ Correct"));
    if (screen.queryByText(/Not quite/i)) {
      fireEvent.click(screen.getByText("✗ Mismatched"));
    }
    expect(screen.getByText(`1 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
  });
});

describe("Ecosystem Pyramid (dg6) — Identify Mode", () => {
  it("renders the actual SVG, highlights a target, and presents 4 answer choices with the correct one included", () => {
    const { container } = open("identify");
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.queryByText(/needs an SVG diagram/)).not.toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL}`))).toBeInTheDocument();
    const options = Array.from(container.querySelectorAll("button")).filter(b => ECO_NAMES.includes(b.textContent.trim()));
    expect(options).toHaveLength(4);
    const highlighted = Array.from(container.querySelectorAll("svg g")).find(
      g => g.getAttribute("style")?.includes("drop-shadow(0 0 4.5px rgba(245,158,11")
    );
    expect(highlighted).toBeTruthy();
    expect(ECO_IDS.includes(highlighted.id)).toBe(true);
  });

  it("correct and incorrect answer selection both work", () => {
    const { container } = open("identify");
    const highlighted = Array.from(container.querySelectorAll("svg g")).find(
      g => g.getAttribute("style")?.includes("drop-shadow(0 0 4.5px rgba(245,158,11")
    );
    const target = eco.structures.find(s => s.id === highlighted.id);
    const options = Array.from(container.querySelectorAll("button")).filter(b => ECO_NAMES.includes(b.textContent.trim()));
    const correctBtn = options.find(b => b.textContent.trim() === target.name);
    fireEvent.click(correctBtn);
    expect(screen.getByText("🎯 Correct!")).toBeInTheDocument();
  });
});

describe("Ecosystem Pyramid (dg6) — Exam Challenge", () => {
  it("renders the actual SVG alongside the free-recall input and accepts a canonical answer", () => {
    const { container } = open("exam");
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.queryByText(/needs an SVG diagram/)).not.toBeInTheDocument();
    const input = screen.getByLabelText("Type the structure name");
    const highlighted = Array.from(container.querySelectorAll("svg g")).find(
      g => g.getAttribute("style")?.includes("drop-shadow(0 0 4.5px rgba(245,158,11")
    );
    const target = eco.structures.find(s => s.id === highlighted.id);
    fireEvent.change(input, { target: { value: target.quiz.acceptableAnswers[0] } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
  });
});

describe("Ecosystem Pyramid (dg6) — Important Points", () => {
  it("renders the actual SVG alongside data-driven importantPoints", () => {
    const { container } = open("points");
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.querySelector("svg").getAttribute("aria-label")).toMatch(/ecosystem/i);
    eco.importantPoints.forEach(point => expect(screen.getByText(point)).toBeInTheDocument());
  });
});

describe("Ecosystem Pyramid (dg6) — responsive (390px)", () => {
  it("SVG and mode controls remain usable with no horizontal overflow", () => {
    window.innerWidth = 390;
    window.dispatchEvent(new Event("resize"));
    const { container } = open("label");
    expect(container.querySelector("svg")).toBeTruthy();
    fireEvent.click(screen.getByText("Tertiary Consumers"));
    fireEvent.click(container.querySelector("#tertiaryConsumers"));
    expect(screen.getByText(`1 / ${TOTAL} Labels`)).toBeInTheDocument();
    const badWidths = Array.from(container.querySelectorAll("[style]")).filter(el => {
      const w = el.style.width;
      return w && /^\d+(\.\d+)?px$/.test(w) && parseFloat(w) > 390;
    });
    expect(badWidths).toHaveLength(0);
    window.innerWidth = 1280;
    window.dispatchEvent(new Event("resize"));
  });
});

describe("Ecosystem Pyramid (dg6) — data isolation", () => {
  it("does not display Animal Cell, Human Heart, Leaf, DNA, or Flower structure names", () => {
    open("explore");
    ["Nucleus", "Aorta", "Stoma", "Adenine", "Petal"].forEach(foreign => {
      expect(screen.queryByText(foreign)).not.toBeInTheDocument();
    });
  });
});

describe("Ecosystem Pyramid (dg6) — source-level reusability check", () => {
  it("no generic mode contains dg6/Ecosystem-specific conditionals, and no Ecosystem-specific mode component exists", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    ["EcosystemLabelMode", "EcosystemMismatchMode", "EcosystemIdentifyMode", "EcosystemExamMode", "EcosystemImportantPointsMode"]
      .forEach(sig => expect(source.includes(`function ${sig}`)).toBe(false));
    expect(source.includes('diagram.id === "dg6"')).toBe(false);
    expect(source.includes('diagram.title === "Ecosystem Pyramid"')).toBe(false);
  });
});

describe("Ecosystem Pyramid (dg6) — regression: other diagrams unaffected", () => {
  it("Animal Cell, Human Heart, Leaf, DNA, Flower all still resolve their own SVG renderers", () => {
    const dg1 = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
    const dg2 = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
    const dg3 = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));
    const dg4 = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg4"));
    const dg5 = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg5"));
    [dg1, dg2, dg3, dg4, dg5].forEach(d => expect(DIAGRAM_SVG_COMPONENTS[d.image.component]).toBeTruthy());
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
