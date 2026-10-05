import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const root = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg11"));
const ROOT_IDS = root.structures.map(s => s.id);
const TOTAL = root.structures.length; // 9
const byId = (id) => root.structures.find(s => s.id === id);

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openExamMode() {
  const utils = render(<DiagramGame diagram={root} />);
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

// Fisher-Yates (shuffleArray) is deterministic given its Math.random()
// inputs. For a target index k, feeding 0.999999999 on every iteration
// i !== k makes j = floor(r*(i+1)) === i (a self-swap / no-op), and feeding
// 0 on the iteration where i === k makes j = 0, swapping the still-untouched
// original element at index k into position 0 -- forcing each structure into
// the Q1 slot in turn. Same technique already established for dg7/dg8's
// Exam tests and DG9's own Identify tests.
//
// ExamMode has the same lazy-init + mount-effect double-invocation pattern
// as IdentifyMode: `useState(makeOrder)` runs once, but the mount
// `useEffect(() => resetGame(), [diagram.id])` calls `setOrder(makeOrder())`
// again, and that SECOND invocation is the one actually rendered.
// buildExamOrder does exactly ONE shuffleArray call (no per-question
// distractor/choice shuffles, unlike buildIdentifyQuestions), so
// callsPerInvocation is simply (TOTAL - 1).
const NO_SWAP = 0.999999999;
function forcedShuffleFirstSequence(targetIndex, total) {
  const values = [];
  for (let i = total - 1; i >= 1; i--) values.push(i === targetIndex ? 0 : NO_SWAP);
  return values;
}
function withForcedFirstTarget(targetIndex, run) {
  const callsPerInvocation = TOTAL - 1;
  const padding = new Array(callsPerInvocation).fill(0.5); // discarded first invocation
  const sequence = [...padding, ...forcedShuffleFirstSequence(targetIndex, TOTAL)];
  let call = 0;
  const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => {
    const v = call < sequence.length ? sequence[call] : 0.5;
    call++;
    return v;
  });
  const { container, unmount } = openExamMode();
  run(container);
  unmount();
  randomSpy.mockRestore();
}

// Deterministic per-structure helper: forces the named structure onto
// Question 1 via the RNG technique above -- no probabilistic sampling, no
// coupon-collector loop over freshly mounted sessions (that pattern is the
// known pre-existing flaky one in prokaryoticCellExam.test.jsx and is
// deliberately NOT reused here).
function withTarget(structureId, run) {
  const k = ROOT_IDS.indexOf(structureId);
  withForcedFirstTarget(k, run);
}

describe("Monocot Root (dg11) Exam Challenge -- loads via Diagram Center, generic mode", () => {
  it("dg11 -> Exam Challenge loads through Diagram Center with instructions, empty input, and a highlighted target", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("T.S. of a Monocot Root"));
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
    expect(screen.getByText(/Type the name of the highlighted structure/i)).toBeInTheDocument();
    const input = getInput();
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("");
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("no multiple-choice answer list is rendered -- only a free-text input and Submit", () => {
    const { container } = openExamMode();
    expect(getInput()).toBeInTheDocument();
    const structureNameButtons = Array.from(container.querySelectorAll("button")).filter(b =>
      root.structures.some(s => b.textContent.trim() === s.name)
    );
    expect(structureNameButtons).toHaveLength(0);
    expect(container.querySelectorAll("input")).toHaveLength(1);
  });

  it("a highlighted target corresponds to a genuine dg11 SVG structure id", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    expect(ROOT_IDS).toContain(targetId);
  });
});

describe("Monocot Root (dg11) -- deterministic target coverage (RNG-forced, not sampled)", () => {
  it("uses all 9 dg11 structures exactly once as targets across one full session (one natural, un-forced playthrough)", () => {
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
    expect([...seen].sort()).toEqual([...ROOT_IDS].sort());
  });

  it("every one of the 9 structures is deterministically reachable as the Question-1 target (RNG-forced, no sampling loop)", () => {
    ROOT_IDS.forEach((expectedId, k) => {
      withForcedFirstTarget(k, (container) => {
        expect(getHighlightedStructureId(container)).toBe(expectedId);
      });
    });
  });
});

describe("Monocot Root (dg11) -- answer normalization", () => {
  it("the canonical answer is accepted", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
  });

  it("case differences are accepted (generic normalizeExamAnswer lowercases input)", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId).toUpperCase() } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
  });

  it("leading/trailing whitespace is accepted (generic normalizeExamAnswer trims)", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: `   ${correctAnswerFor(targetId)}   ` } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
  });

  // Explicit per-structure canonical-answer checks for all 9 dg11 structures.
  it("Epidermis: canonical answer, and the 'epiblema' alias, both accepted", () => {
    expect(byId("epidermis").quiz.acceptableAnswers).toContain("epiblema");
    withTarget("epidermis", () => {
      fireEvent.change(getInput(), { target: { value: "Epidermis" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
    withTarget("epidermis", () => {
      fireEvent.change(getInput(), { target: { value: "epiblema" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Cortex: canonical answer accepted", () => {
    withTarget("cortex", () => {
      fireEvent.change(getInput(), { target: { value: "Cortex" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Endodermis: canonical answer accepted", () => {
    withTarget("endodermis", () => {
      fireEvent.change(getInput(), { target: { value: "endodermis" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Pericycle: canonical answer accepted", () => {
    withTarget("pericycle", () => {
      fireEvent.change(getInput(), { target: { value: "Pericycle" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Metaxylem: canonical answer accepted", () => {
    withTarget("metaxylem", () => {
      fireEvent.change(getInput(), { target: { value: "Metaxylem" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Phloem: canonical answer accepted", () => {
    withTarget("phloem", () => {
      fireEvent.change(getInput(), { target: { value: "Phloem" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Protoxylem: canonical answer accepted", () => {
    withTarget("protoxylem", () => {
      fireEvent.change(getInput(), { target: { value: "Protoxylem" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Pith: canonical answer accepted", () => {
    withTarget("pith", () => {
      fireEvent.change(getInput(), { target: { value: "Pith" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Root hair: canonical answer and the 'root hairs' alias both accepted", () => {
    expect(byId("rootHair").quiz.acceptableAnswers).toContain("root hairs");
    withTarget("rootHair", () => {
      fireEvent.change(getInput(), { target: { value: "Root hair" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
    withTarget("rootHair", () => {
      fireEvent.change(getInput(), { target: { value: "ROOT HAIRS" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });
});

describe("Monocot Root (dg11) -- answer safety: no broad substring/prefix/suffix matching", () => {
  it("rejects an empty answer -- Submit is a no-op, nothing is scored or flagged wrong", () => {
    const { container } = openExamMode();
    fireEvent.change(getInput(), { target: { value: "" } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.queryByText("✅ Correct!")).not.toBeInTheDocument();
    expect(screen.queryByText(/Not quite/i)).not.toBeInTheDocument();
    expect(getInput()).not.toBeDisabled();
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
  });

  it("rejects a whitespace-only answer the same way (normalizes to empty)", () => {
    const { container } = openExamMode();
    fireEvent.change(getInput(), { target: { value: "   " } });
    fireEvent.click(screen.getByText("Submit"));
    expect(getInput()).not.toBeDisabled();
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
  });

  it("rejects an unrelated answer", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    const target = byId(targetId);
    fireEvent.change(getInput(), { target: { value: "definitely not a real structure" } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText(`❌ Not quite. Correct answer: ${target.name}`)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
  });

  it("rejects a truncated prefix of 'endodermis' ('endo')", () => {
    withTarget("endodermis", () => {
      fireEvent.change(getInput(), { target: { value: "endo" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("endodermis").name}`)).toBeInTheDocument();
    });
  });

  it("rejects the correct answer with appended garbage ('metaxylem abc')", () => {
    withTarget("metaxylem", () => {
      fireEvent.change(getInput(), { target: { value: "metaxylem abc" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("metaxylem").name}`)).toBeInTheDocument();
    });
  });

  it("rejects the correct answer with prepended garbage ('abc metaxylem')", () => {
    withTarget("metaxylem", () => {
      fireEvent.change(getInput(), { target: { value: "abc metaxylem" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("metaxylem").name}`)).toBeInTheDocument();
    });
  });

  it("rejects a single word extracted from 'root hair' ('hair' and 'root' alone)", () => {
    withTarget("rootHair", () => {
      fireEvent.change(getInput(), { target: { value: "hair" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("rootHair").name}`)).toBeInTheDocument();
    });
    withTarget("rootHair", () => {
      fireEvent.change(getInput(), { target: { value: "root" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("rootHair").name}`)).toBeInTheDocument();
    });
  });

  it("rejects an unrelated word that merely contains the target word ('pericycle' is not matched by 'pericyclical')", () => {
    withTarget("pericycle", () => {
      fireEvent.change(getInput(), { target: { value: "pericyclical" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("pericycle").name}`)).toBeInTheDocument();
    });
  });

  it("rejects a truncated prefix of 'protoxylem' ('protox')", () => {
    withTarget("protoxylem", () => {
      fireEvent.change(getInput(), { target: { value: "protox" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("protoxylem").name}`)).toBeInTheDocument();
    });
  });

  it("rejects 'pith' with surrounding garbage ('pith xyz' / 'xyz pith')", () => {
    withTarget("pith", () => {
      fireEvent.change(getInput(), { target: { value: "pith xyz" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("pith").name}`)).toBeInTheDocument();
    });
    withTarget("pith", () => {
      fireEvent.change(getInput(), { target: { value: "xyz pith" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("pith").name}`)).toBeInTheDocument();
    });
  });
});

describe("Monocot Root (dg11) -- submission / scoring", () => {
  it("a question cannot be scored twice (input disables after submission, Submit disappears)", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    expect(getInput()).toBeDisabled();
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 1 / ${TOTAL}`))).toBeInTheDocument();
    expect(screen.queryByText("Submit")).not.toBeInTheDocument();
  });

  it("Enter key submits, and Enter again advances to the next question", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    const input = getInput();
    fireEvent.change(input, { target: { value: correctAnswerFor(targetId) } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 1 / ${TOTAL}`))).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText(new RegExp(`Question 2 / ${TOTAL}`))).toBeInTheDocument();
  });

  it("incorrect answer does not falsely mark completion, and does not award XP", () => {
    const { container } = openExamMode();
    fireEvent.change(getInput(), { target: { value: "wrong answer" } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.queryByText(/Challenge Complete/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/XP earned:/)).not.toBeInTheDocument();
  });
});

describe("Monocot Root (dg11) -- completion / XP", () => {
  it("dg11.xpReward is exactly 65", () => {
    expect(DIAGRAM_DATA.find(d => d.id === "dg11").xpReward).toBe(65);
  });

  it("completes after question 9 with a perfect score earning exactly 65 XP, shown once", () => {
    const { container } = openExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
    expect(getXpEarnedValue(container)).toBe(65);
    expect(container.querySelectorAll("strong").length).toBe(1);
  });

  it("mixed-correctness run: XP matches the existing generic formula Math.round(65/9*score), never exceeding 65", () => {
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
    expect(xp).toBeLessThanOrEqual(65);
    expect(xp).toBe(Math.round((65 / TOTAL) * score));
  });

  it("score can never exceed 9 and XP can never exceed 65, even across a full completed run", () => {
    const { container } = openExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      const scoreMatch = screen.getByText(/Score:/).textContent.match(/Score:\s*(\d+)\s*\/\s*9/);
      expect(Number(scoreMatch[1])).toBeLessThanOrEqual(TOTAL);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(getXpEarnedValue(container)).toBeLessThanOrEqual(65);
  });

  it("repeated interaction after completion cannot double-award XP (no remaining input/Submit surface)", () => {
    const { container } = openExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Type the structure name")).not.toBeInTheDocument();
    expect(screen.queryByText("Submit")).not.toBeInTheDocument();
    expect(getXpEarnedValue(container)).toBe(65);
    expect(container.querySelectorAll("strong").length).toBe(1); // no duplicate reward on rerender
  });
});

describe("Monocot Root (dg11) -- reset / replay / isolation", () => {
  it("Play Again resets score/progress/input and produces a fresh question order", () => {
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
    expect(getInput().value).toBe("");
    expect(screen.queryByText(/Challenge Complete/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/XP earned:/i)).not.toBeInTheDocument();

    const secondOrder = [];
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      secondOrder.push(targetId);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
    expect(getXpEarnedValue(container)).toBe(65);
    expect(secondOrder.join("|")).not.toBe(firstOrder.join("|"));
  });

  it("exam state does not leak between diagrams (a fresh instance starts at Question 1, Score 0)", () => {
    const { container: c1, unmount: unmount1 } = openExamMode();
    const targetId = getHighlightedStructureId(c1);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    unmount1();

    const prokaryotic = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg7"));
    render(<DiagramGame diagram={prokaryotic} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(/Question 1 \/ 8 · Score: 0 \/ 8/)).toBeInTheDocument();
  });

  it("exam state does not leak between modes: switching away and back gives a fresh Question 1 / Score 0", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText(new RegExp(`Score: 1 / ${TOTAL}`))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "🔍 Explore" }));
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
  });
});

describe("Monocot Root (dg11) -- mobile / keyboard / responsive / accessibility", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  it("390px mobile: input and Submit are reachable and tappable without hover", () => {
    setWidth(390);
    const { container, unmount } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    const input = getInput();
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    unmount();
    setWidth(1280);
  });

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "narrow-desktop", width: 1024, expectGrid: true },
    { label: "mobile", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): no horizontal overflow, diagram/input/feedback stay contained and readable`, () => {
      setWidth(width);
      const { container, unmount } = openExamMode();
      expect(container.querySelector("svg")).toBeTruthy();
      expect(getInput()).toBeInTheDocument();

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

  it("the text input has a meaningful accessible label, and Submit is a real accessible button", () => {
    const { container } = openExamMode();
    const input = getInput();
    expect(input.tagName.toLowerCase()).toBe("input");
    expect(input.getAttribute("type")).toBe("text");
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  it("disabled/completed state is communicated via a real disabled attribute, not styling alone", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    expect(getInput()).toHaveAttribute("disabled");
  });

  it("completion feedback is accessible, real text, with a real Play Again button", () => {
    const { container } = openExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play Again" })).toBeInTheDocument();
  });
});

describe("Monocot Root (dg11) -- dg1-dg8 regression remains intact", () => {
  it("dg7 (Prokaryotic Cell) is unmodified: 8 structures, XP 55, Exam Challenge still loads", () => {
    const dg7 = DIAGRAM_DATA.find(d => d.id === "dg7");
    expect(dg7.structures.length).toBe(8);
    expect(dg7.xpReward).toBe(55);
    const d = normalizeDiagram(dg7);
    const { unmount } = render(<DiagramGame diagram={d} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(/Question 1 \/ 8/)).toBeInTheDocument();
    expect(screen.getByLabelText("Type the structure name")).toBeInTheDocument();
    unmount();
  });

  it("dg8 (Plant Cell) is unmodified: 11 structures, XP 60, Exam Challenge still loads", () => {
    const dg8 = DIAGRAM_DATA.find(d => d.id === "dg8");
    expect(dg8.structures.length).toBe(11);
    expect(dg8.xpReward).toBe(60);
    const d = normalizeDiagram(dg8);
    const { unmount } = render(<DiagramGame diagram={d} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(/Question 1 \/ 11/)).toBeInTheDocument();
    expect(screen.getByLabelText("Type the structure name")).toBeInTheDocument();
    unmount();
  });

  it("dg1-dg6 Exam Challenge still loads with an input, Submit, and intact structure counts", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6"].forEach(id => {
      const d = normalizeDiagram(DIAGRAM_DATA.find(x => x.id === id));
      const { unmount } = render(<DiagramGame diagram={d} />);
      fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
      expect(screen.getByText(new RegExp(`Question 1 / ${d.structures.length}`))).toBeInTheDocument();
      expect(screen.getByLabelText("Type the structure name")).toBeInTheDocument();
      expect(screen.getByText("Submit")).toBeInTheDocument();
      unmount();
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("the registry and DIAGRAM_DATA contain dg1 through dg11, nothing renamed or removed", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6", "dg7", "dg8", "dg9", "dg10", "dg11"].forEach(id => {
      expect(DIAGRAM_DATA.find(d => d.id === id)).toBeTruthy();
    });
        expect(DIAGRAM_DATA.length).toBe(12);
  });
});

describe("Monocot Root (dg11) -- source-level reusability check", () => {
  it("ExamMode and buildExamOrder contain no dg11/Monocot-Root-specific hardcoded names or conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");

    const start = source.indexOf("function ExamMode(");
    const end = source.indexOf("function DiagramGame(");
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);
    const forbidden = ["Root hair", "Epidermis", "Cortex", "Endodermis", "Pericycle", "Phloem", "Protoxylem", "Metaxylem", "Pith"];
    forbidden.forEach(word => expect(body.includes(word)).toBe(false));
    expect(body.includes('diagram.id === "dg11"')).toBe(false);

    const genStart = source.indexOf("function buildExamOrder(");
    const genEnd = source.indexOf("\n}\n", genStart) + 1;
    const genBody = source.slice(genStart, genEnd);
    forbidden.forEach(word => expect(genBody.includes(word)).toBe(false));
  });
});
