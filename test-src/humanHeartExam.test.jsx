import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const humanHeart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
const TOTAL = humanHeart.structures.length; // 7
const byId = (id) => humanHeart.structures.find(s => s.id === id);

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openExamMode() {
  const utils = render(<DiagramGame diagram={humanHeart} />);
  fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
  return utils;
}

function getHighlightedStructureId(container) {
  const el = Array.from(container.querySelectorAll("svg g")).find(
    g => g.getAttribute("style")?.includes("drop-shadow(0 0 4.5px rgba(245,158,11")
  );
  return el ? el.id : null;
}

function correctAnswerFor(structureId) {
  return byId(structureId).quiz.acceptableAnswers[0];
}

function getInput() {
  return screen.getByLabelText("Type the structure name");
}

function getXpEarnedValue(container) {
  const strong = container.querySelector("strong");
  return strong ? Number(strong.textContent) : null;
}

describe("Human Heart — Exam Challenge — rendering & question structure", () => {
  it("opens with instructions, input, submit, and a highlighted target", () => {
    const { container } = openExamMode();
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
    expect(screen.getByText(/Type the name of the highlighted structure/i)).toBeInTheDocument();
    expect(getInput()).toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();
    expect(getHighlightedStructureId(container)).toBeTruthy();
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("generates exactly 7 questions covering all 7 structures exactly once", () => {
    const { container } = openExamMode();
    const seen = new Set();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      seen.add(targetId);
      expect(screen.getByText(new RegExp(`Question ${q + 1} / ${TOTAL}`))).toBeInTheDocument();
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(seen.size).toBe(TOTAL);
    expect([...seen].sort()).toEqual(
      ["rightAtrium", "leftAtrium", "rightVentricle", "leftVentricle", "aorta", "pulmonaryArtery", "venaCava"].sort()
    );
  });
});

describe("Human Heart — Exam Challenge — answers & normalization", () => {
  it("accepts a correct answer, case/whitespace-insensitively, and increments score", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    const answer = correctAnswerFor(targetId);
    fireEvent.change(getInput(), { target: { value: `  ${answer.toUpperCase()}  ` } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: 1 / ${TOTAL}`))).toBeInTheDocument();
  });

  it("accepts the Vena Cava 'venacava' alias when it is the target", () => {
    const { container } = openExamMode();
    let targetId = getHighlightedStructureId(container);
    let guard = 0;
    // Cycle through Next Question (without submitting a real answer isn't possible,
    // so we always submit correctly until Vena Cava is the target).
    while (targetId !== "venaCava" && guard < TOTAL) {
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText("Next Question →"));
      targetId = getHighlightedStructureId(container);
      guard++;
    }
    expect(targetId).toBe("venaCava");
    fireEvent.change(getInput(), { target: { value: "  VenaCava  " } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
  });

  it("gives error feedback, reveals the correct name, and does not increment score on a wrong answer", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    const target = byId(targetId);
    fireEvent.change(getInput(), { target: { value: "definitely not a heart structure" } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText(`❌ Not quite. Correct answer: ${target.name}`)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: 0 / ${TOTAL}`))).toBeInTheDocument();
  });

  it("locks the question after submission (no double-scoring)", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    expect(getInput()).toBeDisabled();
    expect(screen.queryByText("Submit")).not.toBeInTheDocument();
  });

  it("Enter key submits, and Enter again advances", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    const input = getInput();
    fireEvent.change(input, { target: { value: correctAnswerFor(targetId) } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText(new RegExp(`Score: 1 / ${TOTAL}`))).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText(/Question 2 \/ 7/)).toBeInTheDocument();
  });
});

describe("Human Heart — Exam Challenge — completion, XP, Play Again", () => {
  it("completes with a perfect score and exactly the configured 60 XP", () => {
    const { container } = openExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
    expect(humanHeart.xpReward).toBe(60);
    expect(getXpEarnedValue(container)).toBe(60);
  });

  it("caps XP correctly on a mixed correct/wrong run", () => {
    const { container } = openExamMode();
    let score = 0;
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      const wrong = q % 2 === 0;
      fireEvent.change(getInput(), { target: { value: wrong ? "xyz" : correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      if (!wrong) score++;
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    const xp = getXpEarnedValue(container);
    expect(xp).toBeLessThanOrEqual(60);
    expect(xp).toBe(Math.round((60 / TOTAL) * score));
  });

  it("Play Again resets score/progress/feedback and produces a fresh question order", () => {
    const { container } = openExamMode();
    const firstOrder = [];
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      firstOrder.push(targetId);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
    expect(screen.queryByText("✅ Correct!")).not.toBeInTheDocument();

    const secondOrder = [];
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      secondOrder.push(targetId);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(secondOrder.join("|")).not.toBe(firstOrder.join("|"));
  });

  it("question order is randomized across separate sessions", () => {
    const orders = [];
    for (let i = 0; i < 15; i++) {
      const { container, unmount } = openExamMode();
      orders.push(getHighlightedStructureId(container));
      unmount();
    }
    expect(new Set(orders).size).toBeGreaterThan(1);
  });
});

describe("Human Heart — Exam Challenge — mobile/touch-equivalent & regression", () => {
  it("completes a full session via the same handlers used on touch devices", () => {
    const { container } = openExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit")); // same onClick fired by a real tap
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
  });

  it("does not corrupt Explore, Label, Mismatch, or Identify state for Human Heart", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));

    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" }));
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "❓ Identify the Structure" }));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "🔍 Explore" }));
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("switching away and back to Exam Challenge mounts fresh state", () => {
    openExamMode();
    fireEvent.click(screen.getByRole("button", { name: "🔍 Explore" }));
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
  });

  it("all Human Heart modes still render without console errors (Explore/Label/Mismatch/Identify/Exam)", () => {
    const { container } = render(<DiagramGame diagram={humanHeart} />);
    ["🔍 Explore", "🏷 Label the Diagram", "🔀 Find Mismatched Labels", "❓ Identify the Structure", "📝 Exam Challenge"]
      .forEach(label => {
        fireEvent.click(screen.getByRole("button", { name: label }));
        expect(container.querySelector("svg")).toBeTruthy();
      });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

describe("Human Heart — Exam Challenge — responsive", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "laptop/tablet", width: 1024, expectGrid: true },
    { label: "mobile", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): usable layout, no horizontal overflow`, () => {
      setWidth(width);
      const { container, unmount } = openExamMode();
      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");
      const badWidths = Array.from(container.querySelectorAll("[style]")).filter(el => {
        const w = el.style.width;
        return w && /^\d+(\.\d+)?px$/.test(w) && parseFloat(w) > width;
      });
      expect(badWidths).toHaveLength(0);
      expect(getInput()).toBeInTheDocument();
      expect(screen.getByText("Submit")).toBeInTheDocument();
      unmount();
      setWidth(1280);
    });
  });
});

describe("Human Heart — Exam Challenge — accessibility", () => {
  it("input has an accessible label, submit is a real button, submitted controls disable", () => {
    const { container } = openExamMode();
    const input = getInput();
    expect(input.tagName).toBe("INPUT");
    const submitBtn = screen.getByText("Submit");
    expect(submitBtn.tagName).toBe("BUTTON");
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(input, { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(submitBtn);
    expect(getInput()).toBeDisabled();
    expect(screen.getByText("Next Question →").tagName).toBe("BUTTON");
  });
});

describe("Human Heart — Exam Challenge — reusability / source check", () => {
  it("ExamMode contains no dg2-specific or Human-Heart-name conditionals, and no second exam implementation exists", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");

    expect(source.includes("function HumanHeartExamMode")).toBe(false);
    expect((source.match(/function ExamMode\(/g) || []).length).toBe(1);

    const start = source.indexOf("function ExamMode(");
    const end = source.indexOf("function DiagramGame(");
    const body = source.slice(start, end);

    ["Left Atrium", "Right Atrium", "Left Ventricle", "Right Ventricle", "Aorta", "Pulmonary Artery", "Vena Cava"]
      .forEach(word => expect(body.includes(word)).toBe(false));
    expect(body.includes('diagram.id === "dg2"')).toBe(false);
    expect(body.includes('diagram.id === "dg1"')).toBe(false);
  });

  it("HumanHeartSVG remains a pure renderer with no exam/game state", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function HumanHeartSVG(");
    const end = source.indexOf("\n}", source.indexOf("function HumanHeartSVG(") + 1) + 2;
    const nextFnStart = source.indexOf("\nfunction ", start + 1);
    const body = source.slice(start, nextFnStart > -1 ? nextFnStart : end);

    ["score", "xpReward", "acceptableAnswers", "questionIndex", "choiceIds"]
      .forEach(term => expect(body.includes(term)).toBe(false));
  });
});
