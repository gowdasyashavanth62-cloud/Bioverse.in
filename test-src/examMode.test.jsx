import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
const TOTAL = animalCell.structures.length;
const byId = (id) => animalCell.structures.find(s => s.id === id);

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openExamMode() {
  const utils = render(<DiagramGame diagram={animalCell} />);
  fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
  return utils;
}

// The one SVG group carrying the persistent "selected" highlight filter is
// this question's target — same convention used by the Identify Mode tests.
function getHighlightedStructureId(container) {
  const el = Array.from(container.querySelectorAll("svg g")).find(
    g => g.getAttribute("style")?.includes("drop-shadow(0 0 4.5px rgba(245,158,11")
  );
  return el ? el.id : null;
}

function correctAnswerFor(structureId) {
  return byId(structureId).quiz.acceptableAnswers[0];
}

function getInput(container) {
  return screen.getByLabelText("Type the structure name");
}

function getXpEarnedValue(container) {
  // The completion card's only <strong> holds the XP number — querying it
  // directly sidesteps a known RTL limitation where getByText(regex) can
  // fail to match text split across a parent/child element boundary
  // ("Score: X/Y · XP earned: " + "<strong>50</strong>").
  const strong = container.querySelector("strong");
  return strong ? Number(strong.textContent) : null;
}

describe("Exam Challenge", () => {
  it("renders the first question with instructions, input, and a highlighted target", () => {
    const { container } = openExamMode();
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
    expect(screen.getByText(/Type the name of the highlighted structure/i)).toBeInTheDocument();
    expect(getInput(container)).toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();
    expect(getHighlightedStructureId(container)).toBeTruthy();
  });

  it("a correct (case/whitespace-insensitive) answer is accepted and increments score", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    const answer = correctAnswerFor(targetId);
    fireEvent.change(getInput(container), { target: { value: `  ${answer.toUpperCase()}  ` } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    expect(screen.getByText(/Question 1 \/ 7 · Score: 1 \/ 7/)).toBeInTheDocument();
  });

  it("a wrong answer gives feedback, reveals the correct name, and does not increment score", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    const target = byId(targetId);
    fireEvent.change(getInput(container), { target: { value: "definitely not a real organelle" } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText(`❌ Not quite. Correct answer: ${target.name}`)).toBeInTheDocument();
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
  });

  it("a question cannot be scored twice (input disables after submission)", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(container), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    expect(getInput(container)).toBeDisabled();
    expect(screen.getByText(/Question 1 \/ 7 · Score: 1 \/ 7/)).toBeInTheDocument();
    // "Submit" is replaced by "Next Question →" — there is no way to resubmit this question.
    expect(screen.queryByText("Submit")).not.toBeInTheDocument();
  });

  it("Enter key submits, and Enter again advances to the next question", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    const input = getInput(container);
    fireEvent.change(input, { target: { value: correctAnswerFor(targetId) } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText(/Question 1 \/ 7 · Score: 1 \/ 7/)).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText(/Question 2 \/ 7/)).toBeInTheDocument();
  });

  it("uses all 7 structures exactly once as targets, and progress advances one at a time", () => {
    const { container } = openExamMode();
    const seen = new Set();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      seen.add(targetId);
      expect(screen.getByText(new RegExp(`Question ${q + 1} / ${TOTAL}`))).toBeInTheDocument();
      fireEvent.change(getInput(container), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(seen.size).toBe(TOTAL);
  });

  it("completes after question 7 with a perfect score earning exactly diagram.xpReward XP", () => {
    const { container } = openExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(container), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
    expect(getXpEarnedValue(container)).toBe(50);
  });

  it("XP never exceeds diagram.xpReward on a run with wrong answers mixed in", () => {
    const { container } = openExamMode();
    let score = 0;
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      const wrong = q % 2 === 0; // alternate right/wrong
      fireEvent.change(getInput(container), { target: { value: wrong ? "xyz" : correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      if (!wrong) score++;
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    const xp = getXpEarnedValue(container);
    expect(xp).toBeLessThanOrEqual(animalCell.xpReward);
    expect(xp).toBe(Math.round((animalCell.xpReward / TOTAL) * score));
  });

  it("Play Again resets score/progress and produces a fresh question order", () => {
    const { container } = openExamMode();
    const firstOrder = [];
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      firstOrder.push(targetId);
      fireEvent.change(getInput(container), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();

    const secondOrder = [];
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      secondOrder.push(targetId);
      fireEvent.change(getInput(container), { target: { value: correctAnswerFor(targetId) } });
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

describe("Exam Challenge — mode switching / regression", () => {
  it("switching from Exam Challenge to another mode works, and back creates fresh state", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(container), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText(/Score: 1 \/ 7/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "🔍 Explore" }));
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    // Returning to Exam Challenge mounts a fresh instance — 0/7, not the earlier 1/7.
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
  });

  it("Exam Challenge does not corrupt Explore, Label, Mismatch, or Identify state", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(container), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));

    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" }));
    expect(screen.getByText("0 / 7 Labels Checked")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "❓ Identify the Structure" }));
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "🔍 Explore" }));
    fireEvent.click(container.querySelector("#nucleus"));
    expect(screen.getByText("Nucleus")).toBeInTheDocument();
  });

  it("existing five modes remain unaffected (spot check each renders)", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    ["🔍 Explore", "🏷 Label the Diagram", "🔀 Find Mismatched Labels", "❓ Identify the Structure", "⭐ Important Points"]
      .forEach(label => {
        fireEvent.click(screen.getByRole("button", { name: label }));
        expect(container.querySelector("svg")).toBeTruthy();
      });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

describe("Exam Challenge — responsive", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "laptop/tablet", width: 1024, expectGrid: true },
    { label: "mobile", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): no horizontal overflow`, () => {
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
      unmount();
      setWidth(1280);
    });
  });
});

describe("Exam Challenge source check", () => {
  it("contains no hardcoded Animal Cell structure names or dg1-specific conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function ExamMode(");
    const end = source.indexOf("function DiagramGame(");
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);
    ["Nucleus", "Mitochondria", "Golgi", "Ribosome", "Vacuole", "Cell Membrane", "Endoplasmic Reticulum"]
      .forEach(word => expect(body.includes(word)).toBe(false));
    expect(body.includes('diagram.id === "dg1"')).toBe(false);
  });
});
