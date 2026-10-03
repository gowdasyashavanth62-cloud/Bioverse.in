import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const dna = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg4"));
const DNA_NAMES = dna.structures.map(s => s.name);
const TOTAL = dna.structures.length; // 7

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openDnaIdentifyMode() {
  const utils = render(<DiagramGame diagram={dna} />);
  fireEvent.click(screen.getByRole("button", { name: "❓ Identify the Structure" }));
  return utils;
}

function getHighlightedStructureId(container) {
  const el = Array.from(container.querySelectorAll("svg g")).find(
    g => g.getAttribute("style")?.includes("drop-shadow(0 0 4.5px rgba(245,158,11")
  );
  return el ? el.id : null;
}

function getAnswerButtons(container) {
  return Array.from(container.querySelectorAll("button")).filter(b => {
    const text = b.textContent.trim();
    return DNA_NAMES.some(n => text === n || text === `${n}  ✓`);
  });
}

describe("STEP 18L — DNA Double Helix Identify Mode: rendering", () => {
  it("DNA Double Helix opens from Diagram Center", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("DNA Double Helix"));
    expect(screen.getByRole("button", { name: "❓ Identify the Structure" })).toBeInTheDocument();
  });

  it("Identify Mode opens, DNADoubleHelixSVG renders, and a question is displayed", () => {
    const { container } = openDnaIdentifyMode();
    expect(container.querySelector("svg").getAttribute("aria-label")).toMatch(/dna/i);
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL}`))).toBeInTheDocument();
    expect(screen.getByText("❓ What is this structure?")).toBeInTheDocument();
  });
});

describe("STEP 18L — DNA Double Helix Identify Mode: question structure", () => {
  it("first question has exactly 4 choices, 1 correct, 3 distinct distractors, no duplicates, no foreign names", () => {
    const { container } = openDnaIdentifyMode();
    const options = getAnswerButtons(container);
    expect(options).toHaveLength(4);
    const texts = options.map(b => b.textContent.trim());
    expect(new Set(texts).size).toBe(4);
    texts.forEach(t => expect(DNA_NAMES.includes(t)).toBe(true));
    fireEvent.click(options[0]);
    const marked = getAnswerButtons(container).filter(b => b.textContent.includes("✓"));
    expect(marked).toHaveLength(1);
  });

  it("a complete session targets all 7 structures exactly once, with no duplicates, using diagram.structures", () => {
    const { container } = openDnaIdentifyMode();
    const targets = [];
    for (let q = 0; q < TOTAL; q++) {
      targets.push(getHighlightedStructureId(container));
      fireEvent.click(getAnswerButtons(container)[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(new Set(targets).size).toBe(TOTAL);
    expect(targets.sort()).toEqual(dna.structures.map(s => s.id).sort());
    expect(dna.labels).toBeUndefined();
  });

  it("each of the 7 structures can appear as an Identify target across sessions (no flaky one-shot assumption)", () => {
    const seen = new Set();
    for (let i = 0; i < 90 && seen.size < TOTAL; i++) {
      const { container, unmount } = openDnaIdentifyMode();
      seen.add(getHighlightedStructureId(container));
      unmount();
    }
    expect(seen.size).toBe(TOTAL);
  });
});

describe("STEP 18L — DNA Double Helix Identify Mode: correct answers", () => {
  it("correct answer gives positive feedback, increments score/progress, locks choices (checked for every structure via one full pass)", () => {
    const { container } = openDnaIdentifyMode();
    for (let q = 0; q < TOTAL; q++) {
      const options = getAnswerButtons(container);
      const targetId = getHighlightedStructureId(container);
      const target = dna.structures.find(s => s.id === targetId);
      const correctBtn = options.find(b => b.textContent.trim() === target.name);
      fireEvent.click(correctBtn);
      expect(screen.getByText("🎯 Correct!")).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`Score: ${q + 1} / ${TOTAL}`))).toBeInTheDocument();
      getAnswerButtons(container).forEach(b => expect(b).toBeDisabled());
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
  });
});

describe("STEP 18L — DNA Double Helix Identify Mode: wrong answers", () => {
  it("wrong answer gives error feedback, no score increment, reveals correct answer, no resubmission", () => {
    const { container } = openDnaIdentifyMode();
    const options = getAnswerButtons(container);
    const targetId = getHighlightedStructureId(container);
    const target = dna.structures.find(s => s.id === targetId);
    const wrongBtn = options.find(b => b.textContent.trim() !== target.name);
    fireEvent.click(wrongBtn);
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
    const marked = getAnswerButtons(container).filter(b => b.textContent.includes("✓"));
    expect(marked).toHaveLength(1);
    expect(marked[0].textContent.trim().replace("  ✓", "")).toBe(target.name);
    getAnswerButtons(container).forEach(b => expect(b).toBeDisabled());
    const anotherOption = getAnswerButtons(container).find(b => b !== wrongBtn);
    fireEvent.click(anotherOption); // attempt to resubmit
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument(); // unchanged
  });
});

describe("STEP 18L — DNA Double Helix Identify Mode: completion / XP", () => {
  it("perfect 7/7 run completes with score 7/7 and exactly 55 XP (from diagram.xpReward)", () => {
    const { container } = openDnaIdentifyMode();
    expect(dna.xpReward).toBe(55);
    for (let q = 0; q < TOTAL; q++) {
      const options = getAnswerButtons(container);
      const targetId = getHighlightedStructureId(container);
      const target = dna.structures.find(s => s.id === targetId);
      const correctBtn = options.find(b => b.textContent.trim() === target.name);
      fireEvent.click(correctBtn);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
    const strong = container.querySelector("strong");
    expect(Number(strong.textContent)).toBe(55);
  });

  it("a mixed correct/wrong session produces the expected score and XP that never exceeds 55", () => {
    const { container } = openDnaIdentifyMode();
    let score = 0;
    for (let q = 0; q < TOTAL; q++) {
      const options = getAnswerButtons(container);
      const targetId = getHighlightedStructureId(container);
      const target = dna.structures.find(s => s.id === targetId);
      const wrong = q % 2 === 0;
      const btn = wrong
        ? options.find(b => b.textContent.trim() !== target.name)
        : options.find(b => b.textContent.trim() === target.name);
      fireEvent.click(btn);
      if (!wrong) score++;
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(new RegExp(`Score: ${score}/${TOTAL}`))).toBeInTheDocument();
    const strong = container.querySelector("strong");
    const xp = Number(strong.textContent);
    expect(xp).toBeLessThanOrEqual(55);
    expect(xp).toBe(Math.round((dna.xpReward / TOTAL) * score));
  });
});

describe("STEP 18L — DNA Double Helix Identify Mode: Play Again / randomization", () => {
  it("Play Again resets score/progress and generates a fresh question order", () => {
    const { container } = openDnaIdentifyMode();
    const firstOrder = [];
    for (let q = 0; q < TOTAL; q++) {
      firstOrder.push(getHighlightedStructureId(container));
      fireEvent.click(getAnswerButtons(container)[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();

    const secondOrder = [];
    for (let q = 0; q < TOTAL; q++) {
      secondOrder.push(getHighlightedStructureId(container));
      fireEvent.click(getAnswerButtons(container)[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(secondOrder.join("|")).not.toBe(firstOrder.join("|"));
  });

  it("question and choice ordering vary across fresh sessions (production randomness preserved)", () => {
    const questionOrders = [];
    const choiceOrders = [];
    for (let i = 0; i < 15; i++) {
      const { container, unmount } = openDnaIdentifyMode();
      questionOrders.push(getHighlightedStructureId(container));
      choiceOrders.push(getAnswerButtons(container).map(b => b.textContent.trim()).join("|"));
      unmount();
    }
    expect(new Set(questionOrders).size).toBeGreaterThan(1);
    expect(new Set(choiceOrders).size).toBeGreaterThan(1);
  });
});

describe("STEP 18L — DNA Double Helix Identify Mode: mobile/tap-equivalent + accessibility", () => {
  it("tap (click) answer selection, feedback, and full completion all work", () => {
    const { container } = openDnaIdentifyMode();
    for (let q = 0; q < TOTAL; q++) {
      const options = getAnswerButtons(container);
      options.forEach(b => expect(b.tagName.toLowerCase()).toBe("button"));
      fireEvent.click(options[0]);
      expect(screen.getByText(new RegExp(`Question ${q + 1} / ${TOTAL}`))).toBeInTheDocument();
      getAnswerButtons(container).forEach(b => expect(b).toBeDisabled());
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
  });
});

describe("STEP 18L — DNA Double Helix Identify Mode: responsive", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "laptop/tablet", width: 1024, expectGrid: true },
    { label: "mobile", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): no horizontal overflow, SVG + choices usable`, () => {
      setWidth(width);
      const { container, unmount } = openDnaIdentifyMode();
      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");

      const options = getAnswerButtons(container);
      expect(options).toHaveLength(4);
      fireEvent.click(options[0]);

      const badWidths = Array.from(container.querySelectorAll("[style]")).filter(el => {
        const w = el.style.width;
        return w && /^\d+(\.\d+)?px$/.test(w) && parseFloat(w) > width;
      });
      expect(badWidths).toHaveLength(0);

      unmount();
      setWidth(1280);
    });
  });
});

describe("STEP 18L — data isolation & mode isolation", () => {
  it("does not display Animal Cell, Human Heart, or Leaf Cross Section names among answer choices", () => {
    const { container } = openDnaIdentifyMode();
    const texts = getAnswerButtons(container).map(b => b.textContent.trim());
    ["Nucleus", "Mitochondria", "Cell Membrane", "Aorta", "Left Atrium", "Left Ventricle", "Epidermis", "Palisade Layer", "Spongy Layer"]
      .forEach(foreign => expect(texts.includes(foreign)).toBe(false));
  });

  it("switching diagrams away from DNA Identify Mode and back starts with fresh, non-leaked state", () => {
    const { container, unmount } = openDnaIdentifyMode();
    fireEvent.click(getAnswerButtons(container)[0]);
    unmount();

    const leaf = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));
    render(<DiagramGame diagram={leaf} />);
    fireEvent.click(screen.getByRole("button", { name: "❓ Identify the Structure" }));
    expect(screen.getByText(/Question 1 \/ 6 · Score: 0 \/ 6/)).toBeInTheDocument();
  });

  it("DNA Explore/Label/Mismatch state does not leak into Identify Mode", () => {
    const { container } = render(<DiagramGame diagram={dna} />);
    fireEvent.click(container.querySelector("#adenine"));
    expect(screen.getByText("Adenine")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" }));
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "❓ Identify the Structure" }));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
  });
});

describe("STEP 18L — source-level reusability check", () => {
  it("IdentifyMode and DNADoubleHelixSVG contain no dg4/DNA-name-specific or dg1/dg2/dg3-specific conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const dnaNames = ["Adenine", "Thymine", "Guanine", "Cytosine", "Phosphate", "Deoxyribose", "Hydrogen Bond"];

    const imStart = source.indexOf("function IdentifyMode(");
    const imEnd = source.indexOf("function DiagramGame(", imStart) > imStart
      ? source.indexOf("function DiagramGame(", imStart)
      : source.indexOf("function ExamMode(", imStart);
    expect(imStart).toBeGreaterThan(-1);
    const imBody = source.slice(imStart, imEnd);
    dnaNames.forEach(n => expect(imBody.includes(n)).toBe(false));
    expect(imBody.includes('diagram.id === "dg4"')).toBe(false);
    expect(imBody.includes('diagram.id === "dg1"')).toBe(false);
    expect(imBody.includes('diagram.id === "dg2"')).toBe(false);
    expect(imBody.includes('diagram.id === "dg3"')).toBe(false);
    expect(source.includes("function DNADoubleHelixIdentifyMode")).toBe(false);
    expect(source.includes("DNA_IDENTIFY_QUESTIONS")).toBe(false);

    const biqStart = source.indexOf("function buildIdentifyQuestions(");
    const biqEnd = source.indexOf("function IdentifyMode(", biqStart);
    const biqBody = source.slice(biqStart, biqEnd);
    dnaNames.forEach(n => expect(biqBody.includes(n)).toBe(false));

    const svgStart = source.indexOf("function DNADoubleHelixSVG(");
    const svgEnd = source.indexOf("const DIAGRAM_SVG_COMPONENTS", svgStart);
    expect(svgStart).toBeGreaterThan(-1);
    const svgBody = source.slice(svgStart, svgEnd);
    ["score", "xpReward", "acceptableAnswers", "questionIndex", "choiceIds"].forEach(term => {
      expect(svgBody.includes(term)).toBe(false);
    });
  });
});

describe("STEP 18L — regression", () => {
  const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
  const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
  const leaf = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));

  it("Animal Cell Identify Mode still passes", () => {
    render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByRole("button", { name: "❓ Identify the Structure" }));
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
  });

  it("Human Heart Identify Mode still passes", () => {
    render(<DiagramGame diagram={heart} />);
    fireEvent.click(screen.getByRole("button", { name: "❓ Identify the Structure" }));
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
  });

  it("Leaf Cross Section Identify Mode still passes", () => {
    render(<DiagramGame diagram={leaf} />);
    fireEvent.click(screen.getByRole("button", { name: "❓ Identify the Structure" }));
    expect(screen.getByText(/Question 1 \/ 6 · Score: 0 \/ 6/)).toBeInTheDocument();
  });

  it("DNA Explore Mode (Step 18I) still passes", () => {
    const { container } = render(<DiagramGame diagram={dna} />);
    fireEvent.click(container.querySelector("#thymine"));
    expect(screen.getByText("Thymine")).toBeInTheDocument();
  });

  it("DNA Label Mode (Step 18J) still passes", () => {
    render(<DiagramGame diagram={dna} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();
  });

  it("DNA Mismatch Mode (Step 18K) still passes", () => {
    render(<DiagramGame diagram={dna} />);
    fireEvent.click(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" }));
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();
  });

  it("DNA foundation data (Step 18H) remains intact", () => {
    expect(dna.title).toBe("DNA Double Helix");
    expect(dna.xpReward).toBe(55);
    expect(dna.structures.length).toBe(7);
  });

  it("no console errors across a full DNA Double Helix Identify session", () => {
    const { container } = openDnaIdentifyMode();
    for (let q = 0; q < TOTAL; q++) {
      fireEvent.click(getAnswerButtons(container)[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
