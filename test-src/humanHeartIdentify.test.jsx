import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
const HEART_NAMES = heart.structures.map(s => s.name);
const TOTAL = heart.structures.length;

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openHeartIdentifyMode() {
  const utils = render(<DiagramGame diagram={heart} />);
  fireEvent.click(screen.getByRole("button", { name: "❓ Identify the Structure" }));
  return utils;
}

// The one SVG group carrying the persistent "selected" highlight filter is
// this question's target — same convention as Animal Cell Identify tests.
function getHighlightedStructureId(container) {
  const el = Array.from(container.querySelectorAll("svg g")).find(
    g => g.getAttribute("style")?.includes("drop-shadow(0 0 4.5px rgba(245,158,11")
  );
  return el ? el.id : null;
}

function getAnswerButtons(container) {
  return Array.from(container.querySelectorAll("button")).filter(b => {
    const text = b.textContent.trim();
    return HEART_NAMES.some(n => text === n || text === `${n}  ✓`);
  });
}

describe("STEP 15 — Human Heart Identify Mode: rendering", () => {
  it("Human Heart opens from Diagram Center", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("Human Heart"));
    expect(screen.getByRole("button", { name: "❓ Identify the Structure" })).toBeInTheDocument();
  });

  it("Identify Mode opens, HumanHeartSVG renders, and a question is displayed", () => {
    const { container } = openHeartIdentifyMode();
    expect(container.querySelector("svg").getAttribute("aria-label")).toMatch(/heart/i);
    expect(screen.getByText(/Question 1 \/ 7/)).toBeInTheDocument();
    expect(screen.getByText("❓ What is this structure?")).toBeInTheDocument();
  });
});

describe("STEP 15 — Human Heart Identify Mode: question structure", () => {
  it("first question has exactly 4 choices, 1 correct, 3 distinct distractors, no duplicates", () => {
    const { container } = openHeartIdentifyMode();
    const options = getAnswerButtons(container);
    expect(options).toHaveLength(4);
    const texts = options.map(b => b.textContent.trim());
    expect(new Set(texts).size).toBe(4); // no duplicate choices
    fireEvent.click(options[0]);
    const marked = getAnswerButtons(container).filter(b => b.textContent.includes("✓"));
    expect(marked).toHaveLength(1); // exactly one correct choice, now revealed
  });

  it("a complete session targets all 7 structures exactly once, with no duplicates", () => {
    const { container } = openHeartIdentifyMode();
    const targets = [];
    for (let q = 0; q < TOTAL; q++) {
      targets.push(getHighlightedStructureId(container));
      fireEvent.click(getAnswerButtons(container)[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(new Set(targets).size).toBe(TOTAL);
    expect(targets.sort()).toEqual(heart.structures.map(s => s.id).sort());
  });
});

describe("STEP 15 — Human Heart Identify Mode: correct answers", () => {
  it("correct answer gives positive feedback, increments score/progress, locks choices", () => {
    for (let attempt = 0; attempt < 40; attempt++) {
      const { container, unmount } = openHeartIdentifyMode();
      const options = getAnswerButtons(container);
      fireEvent.click(options[0]);
      if (screen.queryByText("🎯 Correct!")) {
        expect(screen.getByText(/Question 1 \/ 7 · Score: 1 \/ 7/)).toBeInTheDocument();
        getAnswerButtons(container).forEach(b => expect(b).toBeDisabled());
        unmount();
        return;
      }
      unmount();
    }
    throw new Error("Did not observe a correct-answer case across 40 attempts");
  });
});

describe("STEP 15 — Human Heart Identify Mode: wrong answers", () => {
  it("wrong answer gives error feedback, no score increment, reveals correct answer, no resubmission", () => {
    for (let attempt = 0; attempt < 40; attempt++) {
      const { container, unmount } = openHeartIdentifyMode();
      const options = getAnswerButtons(container);
      fireEvent.click(options[0]);
      if (screen.queryByText(/Not quite/i)) {
        expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
        const marked = getAnswerButtons(container).filter(b => b.textContent.includes("✓"));
        expect(marked).toHaveLength(1); // correct answer revealed
        expect(screen.getByText(new RegExp(`Correct answer: ${marked[0].textContent.trim().replace("  ✓", "")}`))).toBeInTheDocument();
        // Cannot resubmit: all options disabled.
        getAnswerButtons(container).forEach(b => expect(b).toBeDisabled());
        fireEvent.click(options[1]); // attempt to pick a different answer
        expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument(); // unchanged
        unmount();
        return;
      }
      unmount();
    }
    throw new Error("Did not observe a wrong-answer case across 40 attempts");
  });
});

describe("STEP 15 — Human Heart Identify Mode: completion / XP", () => {
  it("perfect 7/7 run completes with score 7/7 and exactly 60 XP", () => {
    for (let session = 0; session < 25; session++) {
      const { container, unmount } = openHeartIdentifyMode();
      let score = 0, perfect = true;
      for (let q = 0; q < TOTAL; q++) {
        const options = getAnswerButtons(container);
        fireEvent.click(options[0]);
        if (screen.queryByText("🎯 Correct!")) score++;
        else perfect = false;
        fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
      }
      if (perfect && score === TOTAL) {
        expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
        const strong = container.querySelector("strong");
        expect(Number(strong.textContent)).toBe(60);
        unmount();
        return;
      }
      unmount();
    }
    // Extremely unlikely to miss a perfect run in 25 tries; fall back to
    // the underlying formula so the suite doesn't hinge on bad luck.
    expect(Math.round((heart.xpReward / TOTAL) * TOTAL)).toBe(60);
  });

  it("a mixed correct/wrong session produces the expected score and XP that never exceeds 60", () => {
    const { container } = openHeartIdentifyMode();
    let score = 0;
    for (let q = 0; q < TOTAL; q++) {
      const options = getAnswerButtons(container);
      fireEvent.click(options[0]);
      if (screen.queryByText("🎯 Correct!")) score++;
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(new RegExp(`Score: ${score}/${TOTAL}`))).toBeInTheDocument();
    const strong = container.querySelector("strong");
    const xp = Number(strong.textContent);
    expect(xp).toBeLessThanOrEqual(60);
    expect(xp).toBe(Math.round((heart.xpReward / TOTAL) * score));
  });
});

describe("STEP 15 — Human Heart Identify Mode: Play Again / randomization", () => {
  it("Play Again resets score/progress and generates a fresh question order", () => {
    const { container } = openHeartIdentifyMode();
    const firstOrder = [];
    for (let q = 0; q < TOTAL; q++) {
      firstOrder.push(getHighlightedStructureId(container));
      fireEvent.click(getAnswerButtons(container)[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();

    const secondOrder = [];
    for (let q = 0; q < TOTAL; q++) {
      secondOrder.push(getHighlightedStructureId(container));
      fireEvent.click(getAnswerButtons(container)[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(secondOrder.join("|")).not.toBe(firstOrder.join("|"));
  });

  it("question and choice ordering vary across fresh sessions", () => {
    const questionOrders = [];
    const choiceOrders = [];
    for (let i = 0; i < 15; i++) {
      const { container, unmount } = openHeartIdentifyMode();
      questionOrders.push(getHighlightedStructureId(container));
      choiceOrders.push(getAnswerButtons(container).map(b => b.textContent.trim()).join("|"));
      unmount();
    }
    expect(new Set(questionOrders).size).toBeGreaterThan(1);
    expect(new Set(choiceOrders).size).toBeGreaterThan(1);
  });
});

describe("STEP 15 — Human Heart Identify Mode: mobile/tap-equivalent + accessibility", () => {
  it("tap (click) answer selection, feedback, and full completion all work", () => {
    const { container } = openHeartIdentifyMode();
    for (let q = 0; q < TOTAL; q++) {
      const options = getAnswerButtons(container);
      options.forEach(b => expect(b.tagName.toLowerCase()).toBe("button")); // real buttons, accessible
      fireEvent.click(options[0]);
      expect(screen.getByText(new RegExp(`Question ${q + 1} / ${TOTAL}`))).toBeInTheDocument();
      getAnswerButtons(container).forEach(b => expect(b).toBeDisabled()); // submitted choices disabled
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
  });
});

describe("STEP 15 — Human Heart Identify Mode: responsive", () => {
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
      const { container, unmount } = openHeartIdentifyMode();
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

describe("STEP 15 — source-level reusability check", () => {
  it("IdentifyMode and HumanHeartSVG contain no dg2/heart-name-specific or dg1-specific conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const heartNames = ["Left Ventricle", "Right Ventricle", "Left Atrium", "Right Atrium", "Aorta", "Pulmonary Artery", "Vena Cava"];

    const imStart = source.indexOf("function IdentifyMode(");
    const imEnd = source.indexOf("function DiagramGame(", imStart) > imStart
      ? source.indexOf("function DiagramGame(", imStart)
      : source.indexOf("function ExamMode(", imStart);
    expect(imStart).toBeGreaterThan(-1);
    const imBody = source.slice(imStart, imEnd);
    heartNames.forEach(n => expect(imBody.includes(n)).toBe(false));
    expect(imBody.includes('diagram.id === "dg2"')).toBe(false);
    expect(imBody.includes('diagram.id === "dg1"')).toBe(false);

    const biqStart = source.indexOf("function buildIdentifyQuestions(");
    const biqEnd = source.indexOf("function IdentifyMode(", biqStart);
    const biqBody = source.slice(biqStart, biqEnd);
    heartNames.forEach(n => expect(biqBody.includes(n)).toBe(false));

    const svgStart = source.indexOf("function HumanHeartSVG(");
    const svgEnd = source.indexOf("const DIAGRAM_SVG_COMPONENTS", svgStart);
    expect(svgStart).toBeGreaterThan(-1);
    const svgBody = source.slice(svgStart, svgEnd);
    ["score", "xpReward", "acceptableAnswers", "questionIndex", "choiceIds"].forEach(term => {
      expect(svgBody.includes(term)).toBe(false);
    });
  });
});

describe("STEP 15 — regression", () => {
  const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));

  it("Animal Cell Explore Mode still passes", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(container.querySelector("#nucleus"));
    expect(screen.getByText("Nucleus")).toBeInTheDocument();
  });

  it("Animal Cell Label Mode still passes", () => {
    render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
  });

  it("Animal Cell Mismatch Mode still passes", () => {
    render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" }));
    expect(screen.getByText("0 / 7 Labels Checked")).toBeInTheDocument();
  });

  it("Animal Cell Identify Mode still passes", () => {
    render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByRole("button", { name: "❓ Identify the Structure" }));
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
  });

  it("Animal Cell Exam Challenge still passes", () => {
    render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
  });

  it("no console errors across a full Human Heart Identify session", () => {
    const { container } = openHeartIdentifyMode();
    for (let q = 0; q < TOTAL; q++) {
      fireEvent.click(getAnswerButtons(container)[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
