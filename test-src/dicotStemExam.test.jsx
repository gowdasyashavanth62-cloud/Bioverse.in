import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const stem = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg10"));
const STEM_IDS = stem.structures.map(s => s.id);
const TOTAL = stem.structures.length; // 10
const byId = (id) => stem.structures.find(s => s.id === id);

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openExamMode() {
  const utils = render(<DiagramGame diagram={stem} />);
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
// the Q1 slot in turn. Same technique already established for dg7/dg8/dg9's
// Exam tests (and DG10's own Identify/Mismatch tests).
//
// ExamMode has the same lazy-init + mount-effect double-invocation pattern
// as IdentifyMode/MismatchMode: `useState(makeOrder)` runs once, but the
// mount `useEffect(() => resetGame(), [diagram.id])` calls
// `setOrder(makeOrder())` again, and that SECOND invocation is the one
// actually rendered. buildExamOrder does exactly ONE shuffleArray call (no
// per-question distractor/choice shuffles, unlike buildIdentifyQuestions),
// so callsPerInvocation is simply (TOTAL - 1) = 9 for dg10's 10 structures.
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
// coupon-collector loop over freshly mounted sessions.
function withTarget(structureId, run) {
  const k = STEM_IDS.indexOf(structureId);
  withForcedFirstTarget(k, run);
}

describe("Dicot Stem (dg10) Exam Challenge -- loads via Diagram Center, generic mode", () => {
  it("dg10 -> Exam Challenge loads through Diagram Center with instructions, empty input, and a highlighted target", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("T.S. of a Dicot Stem"));
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
    expect(screen.getByText(/Type the name of the highlighted structure/i)).toBeInTheDocument();
    const input = getInput();
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("");
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("no multiple-choice answer list is rendered -- only a free-text input and Submit (Exam Mode is free-recall, not Identify's multiple-choice)", () => {
    const { container } = openExamMode();
    expect(getInput()).toBeInTheDocument();
    const structureNameButtons = Array.from(container.querySelectorAll("button")).filter(b =>
      stem.structures.some(s => b.textContent.trim() === s.name)
    );
    expect(structureNameButtons).toHaveLength(0);
    expect(container.querySelectorAll("input")).toHaveLength(1);
  });

  it("a highlighted target corresponds to a genuine dg10 SVG structure id, rendered via the real DicotStemSVG (not DicotRootSVG or any other diagram's artwork)", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    expect(STEM_IDS).toContain(targetId);
    const svg = container.querySelector("svg");
    expect(svg.getAttribute("aria-label")).toMatch(/dicot stem/i);
  });
});

describe("Dicot Stem (dg10) -- question generation & validity", () => {
  it("uses all 10 dg10 structures exactly once as targets across one full session (one natural, un-forced playthrough) -- no undefined/foreign target", () => {
    const { container } = openExamMode();
    const seen = new Set();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      expect(targetId).toBeTruthy();
      expect(STEM_IDS).toContain(targetId);
      seen.add(targetId);
      expect(screen.getByText(new RegExp(`Question ${q + 1} / ${TOTAL}`))).toBeInTheDocument();
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(seen.size).toBe(TOTAL);
    expect([...seen].sort()).toEqual([...STEM_IDS].sort());
  });

  it("every one of the 10 structures is deterministically reachable as the Question-1 target (RNG-forced, no sampling loop)", () => {
    STEM_IDS.forEach((expectedId, k) => {
      withForcedFirstTarget(k, (container) => {
        expect(getHighlightedStructureId(container)).toBe(expectedId);
      });
    });
  });

  it("the correct answer for every generated question is genuinely associated with the highlighted structure's own quiz.acceptableAnswers (no self-contradictory question)", () => {
    const { container } = openExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      const target = byId(targetId);
      expect(Array.isArray(target.quiz?.acceptableAnswers)).toBe(true);
      expect(target.quiz.acceptableAnswers.length).toBeGreaterThan(0);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
  });
});

describe("Dicot Stem (dg10) -- answer normalization", () => {
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

  // Explicit per-structure canonical-answer checks for all 10 dg10 structures.
  it("Epidermis: canonical answer accepted", () => {
    withTarget("epidermis", () => {
      fireEvent.change(getInput(), { target: { value: "Epidermis" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Hypodermis: canonical answer accepted", () => {
    withTarget("hypodermis", () => {
      fireEvent.change(getInput(), { target: { value: "Hypodermis" } });
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

  it("Endodermis: canonical answer, and the 'starch sheath' alias, both accepted", () => {
    expect(byId("endodermis").quiz.acceptableAnswers).toContain("starch sheath");
    withTarget("endodermis", () => {
      fireEvent.change(getInput(), { target: { value: "Endodermis" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
    withTarget("endodermis", () => {
      fireEvent.change(getInput(), { target: { value: "starch sheath" } });
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

  it("Phloem: canonical answer accepted", () => {
    withTarget("phloem", () => {
      fireEvent.change(getInput(), { target: { value: "Phloem" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Cambium: canonical answer accepted", () => {
    withTarget("cambium", () => {
      fireEvent.change(getInput(), { target: { value: "Cambium" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Xylem: canonical answer accepted", () => {
    withTarget("xylem", () => {
      fireEvent.change(getInput(), { target: { value: "Xylem" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Medullary Ray: canonical answer, and the 'medullary rays' plural alias, both accepted", () => {
    expect(byId("medullaryRay").quiz.acceptableAnswers).toContain("medullary rays");
    withTarget("medullaryRay", () => {
      fireEvent.change(getInput(), { target: { value: "medullary ray" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
    withTarget("medullaryRay", () => {
      fireEvent.change(getInput(), { target: { value: "MEDULLARY RAYS" } });
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
});

describe("Dicot Stem (dg10) -- answer safety: no broad substring/prefix/suffix matching", () => {
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
    openExamMode();
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

  it("rejects the correct answer with appended garbage ('xylem abc')", () => {
    withTarget("xylem", () => {
      fireEvent.change(getInput(), { target: { value: "xylem abc" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("xylem").name}`)).toBeInTheDocument();
    });
  });

  it("rejects the correct answer with prepended garbage ('abc pith')", () => {
    withTarget("pith", () => {
      fireEvent.change(getInput(), { target: { value: "abc pith" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("pith").name}`)).toBeInTheDocument();
    });
  });

  it("rejects a single word extracted from 'medullary ray' ('medullary' and 'ray' alone)", () => {
    withTarget("medullaryRay", () => {
      fireEvent.change(getInput(), { target: { value: "medullary" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("medullaryRay").name}`)).toBeInTheDocument();
    });
    withTarget("medullaryRay", () => {
      fireEvent.change(getInput(), { target: { value: "ray" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("medullaryRay").name}`)).toBeInTheDocument();
    });
  });

  it("rejects an unrelated word that merely contains the target word ('cortex' is not matched by 'cortexish')", () => {
    withTarget("cortex", () => {
      fireEvent.change(getInput(), { target: { value: "cortexish" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("cortex").name}`)).toBeInTheDocument();
    });
  });

  it("rejects a truncated prefix of 'cambium' ('camb')", () => {
    withTarget("cambium", () => {
      fireEvent.change(getInput(), { target: { value: "camb" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("cambium").name}`)).toBeInTheDocument();
    });
  });

  it("rejects 'phloem' with surrounding garbage ('phloem xyz' / 'xyz phloem')", () => {
    withTarget("phloem", () => {
      fireEvent.change(getInput(), { target: { value: "phloem xyz" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("phloem").name}`)).toBeInTheDocument();
    });
    withTarget("phloem", () => {
      fireEvent.change(getInput(), { target: { value: "xyz phloem" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("phloem").name}`)).toBeInTheDocument();
    });
  });

  it("cross-structure answer is rejected: typing 'xylem' when the target is 'phloem' does not falsely mark it correct", () => {
    withTarget("phloem", () => {
      fireEvent.change(getInput(), { target: { value: "xylem" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("phloem").name}`)).toBeInTheDocument();
      expect(screen.queryByText("✅ Correct!")).not.toBeInTheDocument();
    });
  });
});

describe("Dicot Stem (dg10) -- submission / scoring", () => {
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
    openExamMode();
    fireEvent.change(getInput(), { target: { value: "wrong answer" } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.queryByText(/Challenge Complete/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/XP earned:/)).not.toBeInTheDocument();
  });

  it("a second, disjoint incorrect-answer example on a different structure also behaves correctly (no XP, no false-correct)", () => {
    withTarget("cortex", () => {
      fireEvent.change(getInput(), { target: { value: "not cortex" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.queryByText("✅ Correct!")).not.toBeInTheDocument();
      expect(screen.queryByText(/XP earned:/)).not.toBeInTheDocument();
      expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
    });
  });

  it("repeatedly clicking Submit after an answer is already locked in cannot re-score or farm points", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText(new RegExp(`Score: 1 / ${TOTAL}`))).toBeInTheDocument();
    // Submit is gone (replaced by Next Question); submitAnswer() itself also
    // guards on `if (submitted) return;`, so there is no way to re-fire it.
    expect(screen.queryByText("Submit")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Next Question →"));
    // Advancing moves to Question 2 with a fresh (unanswered) Submit button
    // and the score from Question 1 carried forward unchanged -- proving
    // the single earlier submission was not re-counted.
    expect(screen.getByText(new RegExp(`Question 2 / ${TOTAL} · Score: 1 / ${TOTAL}`))).toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();
    expect(screen.queryByText("Next Question →")).not.toBeInTheDocument();
  });
});

describe("Dicot Stem (dg10) -- completion / XP", () => {
  it("dg10.xpReward is exactly 63", () => {
    expect(DIAGRAM_DATA.find(d => d.id === "dg10").xpReward).toBe(63);
  });

  it("completes after question 10 with a perfect score earning exactly 63 XP, shown once", () => {
    const { container } = openExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
    expect(getXpEarnedValue(container)).toBe(63);
    expect(container.querySelectorAll("strong").length).toBe(1);
  });

  it("non-perfect (mixed-correctness) run: XP matches the existing generic formula Math.round(63/10*score), never exceeding 63", () => {
    const { container } = openExamMode();
    let score = 0;
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      const wrong = q % 2 === 0; // 5 wrong, 5 right -- a genuine non-perfect run
      fireEvent.change(getInput(), { target: { value: wrong ? "xyz" : correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      if (!wrong) score++;
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(score).toBe(5); // sanity: genuinely a non-perfect, partial-credit run
    expect(screen.getByText(new RegExp(`Score: ${score}/${TOTAL}`))).toBeInTheDocument();
    const xp = getXpEarnedValue(container);
    expect(xp).toBeLessThan(63);
    expect(xp).toBe(Math.round((63 / TOTAL) * score));
  });

  it("a second, differently-shaped non-perfect run (3 correct out of 10) also matches the generic XP formula exactly", () => {
    const { container } = openExamMode();
    let score = 0;
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      const correct = q < 3; // exactly 3 correct
      fireEvent.change(getInput(), { target: { value: correct ? correctAnswerFor(targetId) : "nope" } });
      fireEvent.click(screen.getByText("Submit"));
      if (correct) score++;
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(score).toBe(3);
    const xp = getXpEarnedValue(container);
    expect(xp).toBe(Math.round((63 / TOTAL) * 3));
  });

  it("score can never exceed 10 and XP can never exceed 63, even across a full completed run", () => {
    const { container } = openExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      const scoreMatch = screen.getByText(/Score:/).textContent.match(/Score:\s*(\d+)\s*\/\s*10/);
      expect(Number(scoreMatch[1])).toBeLessThanOrEqual(TOTAL);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(getXpEarnedValue(container)).toBeLessThanOrEqual(63);
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
    expect(getXpEarnedValue(container)).toBe(63);
    expect(container.querySelectorAll("strong").length).toBe(1); // no duplicate reward on rerender
  });
});

describe("Dicot Stem (dg10) -- completion lock", () => {
  it("after completion, no question controls remain to change the final score or re-trigger completion", () => {
    const { container } = openExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
    expect(container.querySelectorAll("input").length).toBe(0);
    expect(screen.queryByText("Next Question →")).not.toBeInTheDocument();
    expect(screen.queryByText("See Results")).not.toBeInTheDocument();
    // Only the real, generic post-completion control (Play Again) remains.
    expect(screen.getByRole("button", { name: "Play Again" })).toBeInTheDocument();
  });
});

describe("Dicot Stem (dg10) -- reset / replay / isolation", () => {
  it("Play Again resets score/progress/input and produces a fresh question order; a fresh session completes normally with no leaked/duplicated XP", () => {
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
    expect(getXpEarnedValue(container)).toBe(63);
    expect(container.querySelectorAll("strong").length).toBe(1); // one XP line, not accumulated across cycles
    expect(secondOrder.join("|")).not.toBe(firstOrder.join("|"));
  });

  it("a second Play Again cycle also stays XP-safe (no accumulation across multiple resets)", () => {
    const { container } = openExamMode();
    for (let cycle = 0; cycle < 2; cycle++) {
      for (let q = 0; q < TOTAL; q++) {
        const targetId = getHighlightedStructureId(container);
        fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
        fireEvent.click(screen.getByText("Submit"));
        fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
      }
      expect(getXpEarnedValue(container)).toBe(63);
      expect(container.querySelectorAll("strong").length).toBe(1);
      if (cycle === 0) fireEvent.click(screen.getByText("Play Again"));
    }
  });

  it("exam state does not leak between diagrams (a fresh instance starts at Question 1, Score 0)", () => {
    const { container: c1, unmount: unmount1 } = openExamMode();
    const targetId = getHighlightedStructureId(c1);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    unmount1();

    const dicotRoot = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg9"));
    render(<DiagramGame diagram={dicotRoot} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(/Question 1 \/ 9 · Score: 0 \/ 9/)).toBeInTheDocument();
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

describe("Dicot Stem (dg10) -- mobile / keyboard / responsive / accessibility", () => {
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

  it("412px mobile: input and Submit are reachable and tappable without hover", () => {
    setWidth(412);
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
    { label: "laptop", width: 1024, expectGrid: true },
    { label: "mobile-412", width: 412, expectGrid: false },
    { label: "mobile-390", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): no horizontal overflow, diagram/input/feedback stay contained and readable, completion screen usable`, () => {
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

      // Completion screen also stays usable at this width.
      for (let q = 0; q < TOTAL; q++) {
        const targetId = getHighlightedStructureId(container);
        fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
        fireEvent.click(screen.getByText("Submit"));
        fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
      }
      expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Play Again" })).toBeInTheDocument();

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

  it("correctness feedback is exposed via real accessible text, not color alone", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
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

describe("Dicot Stem (dg10) -- dg1-dg9 regression remains intact", () => {
  it("dg9 (Dicot Root) is unmodified: 9 structures, XP 65, Exam Challenge still loads and completes correctly", () => {
    const dg9raw = DIAGRAM_DATA.find(d => d.id === "dg9");
    expect(dg9raw.structures.length).toBe(9);
    expect(dg9raw.xpReward).toBe(65);
    const d = normalizeDiagram(dg9raw);
    const { container, unmount } = render(<DiagramGame diagram={d} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(/Question 1 \/ 9/)).toBeInTheDocument();
    expect(screen.getByLabelText("Type the structure name")).toBeInTheDocument();
    for (let q = 0; q < d.structures.length; q++) {
      const targetId = getHighlightedStructureId(container);
      const target = d.structures.find(s => s.id === targetId);
      fireEvent.change(getInput(), { target: { value: target.quiz.acceptableAnswers[0] } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= d.structures.length ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(getXpEarnedValue(container)).toBe(65);
    unmount();
  });

  it("dg7 (Prokaryotic Cell) and dg8 (Plant Cell) are unmodified and still load into Exam Challenge", () => {
    const dg7 = DIAGRAM_DATA.find(d => d.id === "dg7");
    expect(dg7.structures.length).toBe(8);
    expect(dg7.xpReward).toBe(55);
    const dg8 = DIAGRAM_DATA.find(d => d.id === "dg8");
    expect(dg8.structures.length).toBe(11);
    expect(dg8.xpReward).toBe(60);
    [dg7, dg8].forEach(raw => {
      const d = normalizeDiagram(raw);
      const { unmount } = render(<DiagramGame diagram={d} />);
      fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
      expect(screen.getByText(new RegExp(`Question 1 / ${d.structures.length}`))).toBeInTheDocument();
      expect(screen.getByLabelText("Type the structure name")).toBeInTheDocument();
      unmount();
    });
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

  it("the registry and DIAGRAM_DATA contain dg1 through dg10, nothing renamed or removed, and no dg11 exists yet", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6", "dg7", "dg8", "dg9", "dg10"].forEach(id => {
      expect(DIAGRAM_DATA.find(d => d.id === id)).toBeTruthy();
    });
    expect(DIAGRAM_DATA.find(d => d.id === "dg11")).toBeFalsy();
    expect(DIAGRAM_DATA.length).toBe(10);
  });

  it("DG10 Foundation/Explore/Label/Mismatch/Identify data remain intact (spot check: xpReward, structure count, SVG registration, title, chapter)", () => {
    const raw10 = DIAGRAM_DATA.find(d => d.id === "dg10");
    expect(raw10.xpReward).toBe(63);
    expect(raw10.structures.length).toBe(10);
    expect(raw10.image).toEqual({ type: "svg", component: "dicotStem" });
    expect(raw10.title).toBe("T.S. of a Dicot Stem");
    expect(raw10.chapter).toBe("Ch 6 Anatomy of Flowering Plants");
  });
});

describe("Dicot Stem (dg10) -- source-level reusability check", () => {
  it("ExamMode and buildExamOrder contain no dg10/Dicot-Stem-specific hardcoded names or conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");

    const start = source.indexOf("function ExamMode(");
    const end = source.indexOf("function DiagramGame(");
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);
    const forbidden = ["Epidermis", "Hypodermis", "Cortex", "Endodermis", "Pericycle", "Xylem", "Phloem", "Cambium", "Medullary Ray", "Pith"];
    forbidden.forEach(word => expect(body.includes(word)).toBe(false));
    expect(body.includes('diagram.id === "dg10"')).toBe(false);
    expect(body.includes('diagram.image.component === "dicotStem"')).toBe(false);

    const genStart = source.indexOf("function buildExamOrder(");
    const genEnd = source.indexOf("\n}\n", genStart) + 1;
    const genBody = source.slice(genStart, genEnd);
    forbidden.forEach(word => expect(genBody.includes(word)).toBe(false));
  });
});
