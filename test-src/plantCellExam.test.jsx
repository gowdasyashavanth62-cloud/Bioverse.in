import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const plant = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg8"));
const PLANT_IDS = plant.structures.map(s => s.id);
const TOTAL = plant.structures.length; // 11
const byId = (id) => plant.structures.find(s => s.id === id);

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openExamMode() {
  const utils = render(<DiagramGame diagram={plant} />);
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

// Finds a target by repeatedly opening fresh Exam sessions until the
// requested structure lands on Question 1 — same sampling-for-a-rare-target
// technique already used for dg7's Exam answer-safety tests, bounded high
// enough (60 attempts) to make failure astronomically unlikely for a 1-in-11 draw.
function withTarget(structureId, run) {
  for (let attempt = 0; attempt < 90; attempt++) {
    const { container, unmount } = openExamMode();
    if (getHighlightedStructureId(container) !== structureId) { unmount(); continue; }
    run(container);
    unmount();
    return;
  }
  throw new Error(`Never landed on the ${structureId} target across 90 attempts`);
}

describe("Plant Cell (dg8) Exam Challenge — loads via Diagram Center, generic mode", () => {
  it("dg8 → Exam Challenge loads through Diagram Center with instructions, empty input, and a highlighted target", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("Plant Cell"));
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
    expect(screen.getByText(/Type the name of the highlighted structure/i)).toBeInTheDocument();
    const input = getInput();
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("");
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("no multiple-choice answer list is rendered — only a text input and Submit", () => {
    const { container } = openExamMode();
    expect(getInput()).toBeInTheDocument();
    const structureNameButtons = Array.from(container.querySelectorAll("button")).filter(b =>
      plant.structures.some(s => b.textContent.trim() === s.name)
    );
    expect(structureNameButtons).toHaveLength(0);
    expect(container.querySelectorAll("input")).toHaveLength(1);
  });

  it("a highlighted target corresponds to a genuine dg8 SVG structure id", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    expect(PLANT_IDS).toContain(targetId);
  });
});

describe("Plant Cell (dg8) — target coverage", () => {
  it("uses all 11 dg8 structures exactly once as targets across one full session", () => {
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
    expect([...seen].sort()).toEqual([...PLANT_IDS].sort());
  });

  it("every one of the 11 structures is deterministically reachable as the Question-1 target", () => {
    // Fisher-Yates (shuffleArray) is deterministic given its Math.random()
    // inputs. For a target index k, feeding 0.999999999 on every iteration
    // i !== k makes j = floor(r*(i+1)) === i (a self-swap / no-op), and
    // feeding 0 on the iteration where i === k makes j = 0, swapping the
    // still-untouched original element at index k into position 0 — forcing
    // each structure into the Q1 slot in turn. Same technique already
    // established for dg7/dg8 Identify Mode's deterministic coverage fix.
    //
    // ExamMode has the same lazy-init + mount-effect double-invocation
    // pattern as IdentifyMode: `useState(makeOrder)` runs once, but the
    // mount `useEffect(() => resetGame(), [diagram.id])` calls
    // `setOrder(makeOrder())` again, and that SECOND invocation is the one
    // actually rendered. Unlike buildIdentifyQuestions (which also shuffles
    // per-question distractors/choices), buildExamOrder does exactly ONE
    // shuffleArray call, so callsPerInvocation is simply (TOTAL - 1) — no
    // extra per-question calls to pad past.
    const NO_SWAP = 0.999999999;
    function forcedShuffleFirstSequence(targetIndex, total) {
      const values = [];
      for (let i = total - 1; i >= 1; i--) values.push(i === targetIndex ? 0 : NO_SWAP);
      return values;
    }
    const callsPerInvocation = TOTAL - 1;
    const padding = new Array(callsPerInvocation).fill(0.5); // discarded first invocation

    PLANT_IDS.forEach((expectedId, k) => {
      const sequence = [...padding, ...forcedShuffleFirstSequence(k, TOTAL)];
      let call = 0;
      const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => {
        const v = call < sequence.length ? sequence[call] : 0.5;
        call++;
        return v;
      });
      const { container, unmount } = openExamMode();
      expect(getHighlightedStructureId(container)).toBe(expectedId);
      unmount();
      randomSpy.mockRestore();
    });
  });
});

describe("Plant Cell (dg8) — answer normalization", () => {
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

  // Explicit per-structure canonical-answer checks for all 11 Plant Cell
  // structures, plus their defined aliases from dg8's foundation data.
  it("Cell Wall: canonical answer accepted", () => {
    withTarget("cellWall", () => {
      fireEvent.change(getInput(), { target: { value: "Cell Wall" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Plasma Membrane: canonical answer and the 'cell membrane' alias are both accepted", () => {
    expect(byId("plasmaMembrane").quiz.acceptableAnswers).toContain("cell membrane");
    withTarget("plasmaMembrane", () => {
      fireEvent.change(getInput(), { target: { value: "  PLASMA membrane  " } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
    withTarget("plasmaMembrane", () => {
      fireEvent.change(getInput(), { target: { value: "Cell Membrane" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Cytoplasm: canonical answer accepted", () => {
    withTarget("cytoplasm", () => {
      fireEvent.change(getInput(), { target: { value: "cytoplasm" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Nucleus: canonical answer accepted", () => {
    withTarget("nucleus", () => {
      fireEvent.change(getInput(), { target: { value: "Nucleus" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Nucleolus: canonical answer accepted", () => {
    withTarget("nucleolus", () => {
      fireEvent.change(getInput(), { target: { value: "Nucleolus" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Chloroplast: canonical answer and the 'chloroplasts' alias are both accepted", () => {
    expect(byId("chloroplast").quiz.acceptableAnswers).toContain("chloroplasts");
    withTarget("chloroplast", () => {
      fireEvent.change(getInput(), { target: { value: "Chloroplast" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
    withTarget("chloroplast", () => {
      fireEvent.change(getInput(), { target: { value: "chloroplasts" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Central Vacuole: canonical answer and the 'vacuole' alias are both accepted", () => {
    expect(byId("centralVacuole").quiz.acceptableAnswers).toContain("vacuole");
    withTarget("centralVacuole", () => {
      fireEvent.change(getInput(), { target: { value: "Central Vacuole" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
    withTarget("centralVacuole", () => {
      fireEvent.change(getInput(), { target: { value: "vacuole" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Mitochondrion: canonical answer and the 'mitochondria' alias are both accepted", () => {
    expect(byId("mitochondrion").quiz.acceptableAnswers).toContain("mitochondria");
    withTarget("mitochondrion", () => {
      fireEvent.change(getInput(), { target: { value: "Mitochondrion" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
    withTarget("mitochondrion", () => {
      fireEvent.change(getInput(), { target: { value: "mitochondria" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Endoplasmic Reticulum: canonical answer and the 'er' alias are both accepted", () => {
    expect(byId("endoplasmicReticulum").quiz.acceptableAnswers).toContain("er");
    withTarget("endoplasmicReticulum", () => {
      fireEvent.change(getInput(), { target: { value: "Endoplasmic Reticulum" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
    withTarget("endoplasmicReticulum", () => {
      fireEvent.change(getInput(), { target: { value: "ER" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Golgi Apparatus: canonical answer and 'golgi body'/'golgi complex' aliases are all accepted", () => {
    expect(byId("golgiApparatus").quiz.acceptableAnswers).toEqual(
      expect.arrayContaining(["golgi apparatus", "golgi body", "golgi complex"])
    );
    withTarget("golgiApparatus", () => {
      fireEvent.change(getInput(), { target: { value: "Golgi Apparatus" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
    withTarget("golgiApparatus", () => {
      fireEvent.change(getInput(), { target: { value: "golgi body" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
    withTarget("golgiApparatus", () => {
      fireEvent.change(getInput(), { target: { value: "GOLGI COMPLEX" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });

  it("Ribosomes: canonical answer and the 'ribosome' alias are both accepted", () => {
    expect(byId("ribosomes").quiz.acceptableAnswers).toContain("ribosome");
    withTarget("ribosomes", () => {
      fireEvent.change(getInput(), { target: { value: "Ribosomes" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
    withTarget("ribosomes", () => {
      fireEvent.change(getInput(), { target: { value: "ribosome" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });
});

describe("Plant Cell (dg8) — answer safety: no broad substring matching", () => {
  it("rejects arbitrary partial answers and appended garbage (not present in acceptableAnswers)", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    const target = byId(targetId);
    fireEvent.change(getInput(), { target: { value: "definitely not a real structure" } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText(`❌ Not quite. Correct answer: ${target.name}`)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
  });

  it("rejects a truncated prefix of the correct answer ('nucle' for 'nucleus')", () => {
    withTarget("nucleus", () => {
      fireEvent.change(getInput(), { target: { value: "nucle" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("nucleus").name}`)).toBeInTheDocument();
    });
  });

  it("rejects the correct answer with appended garbage ('nucleus abc')", () => {
    withTarget("nucleus", () => {
      fireEvent.change(getInput(), { target: { value: "nucleus abc" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("nucleus").name}`)).toBeInTheDocument();
    });
  });

  it("rejects the correct answer with prepended garbage ('abc nucleus')", () => {
    withTarget("nucleus", () => {
      fireEvent.change(getInput(), { target: { value: "abc nucleus" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("nucleus").name}`)).toBeInTheDocument();
    });
  });

  it("rejects a single word extracted from 'plasma membrane' ('plasma' and 'membrane' alone)", () => {
    withTarget("plasmaMembrane", () => {
      fireEvent.change(getInput(), { target: { value: "plasma" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("plasmaMembrane").name}`)).toBeInTheDocument();
    });
    withTarget("plasmaMembrane", () => {
      fireEvent.change(getInput(), { target: { value: "membrane" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("plasmaMembrane").name}`)).toBeInTheDocument();
    });
  });

  it("rejects 'golgi' alone (a substring of the correct 'golgi apparatus', not itself an accepted answer)", () => {
    withTarget("golgiApparatus", () => {
      fireEvent.change(getInput(), { target: { value: "golgi" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("golgiApparatus").name}`)).toBeInTheDocument();
    });
  });

  it("rejects an unrelated word that merely contains the target word ('mitochondrion' is not matched by 'mitochondrionical')", () => {
    withTarget("mitochondrion", () => {
      fireEvent.change(getInput(), { target: { value: "mitochondrionical" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("mitochondrion").name}`)).toBeInTheDocument();
    });
  });

  it("rejects a truncated prefix of 'chloroplast' ('chloro')", () => {
    withTarget("chloroplast", () => {
      fireEvent.change(getInput(), { target: { value: "chloro" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("chloroplast").name}`)).toBeInTheDocument();
    });
  });

  it("rejects 'chloroplast' with appended garbage ('chloroplast xyz')", () => {
    withTarget("chloroplast", () => {
      fireEvent.change(getInput(), { target: { value: "chloroplast xyz" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("chloroplast").name}`)).toBeInTheDocument();
    });
  });

  it("rejects 'chloroplast' with prepended garbage ('xyz chloroplast')", () => {
    withTarget("chloroplast", () => {
      fireEvent.change(getInput(), { target: { value: "xyz chloroplast" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("chloroplast").name}`)).toBeInTheDocument();
    });
  });
});

describe("Plant Cell (dg8) — submission / scoring", () => {
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

describe("Plant Cell (dg8) — completion / XP", () => {
  it("dg8.xpReward is exactly 60", () => {
    expect(DIAGRAM_DATA.find(d => d.id === "dg8").xpReward).toBe(60);
  });

  it("completes after question 11 with a perfect score earning exactly 60 XP, shown once", () => {
    const { container } = openExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
    expect(getXpEarnedValue(container)).toBe(60);
    expect(container.querySelectorAll("strong").length).toBe(1);
  });

  it("mixed-correctness run: XP matches the existing generic formula Math.round(60/11*score), never exceeding 60", () => {
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
    expect(getXpEarnedValue(container)).toBe(60);
  });
});

describe("Plant Cell (dg8) — reset / replay / isolation", () => {
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

describe("Plant Cell (dg8) — mobile / keyboard / responsive / accessibility", () => {
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

describe("Plant Cell (dg8) — dg1-dg7 regression remains intact", () => {
  it("dg1 (Animal Cell) Exam Challenge still works", () => {
    const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(container.querySelector("#nucleus"));
    expect(screen.getByText("Nucleus")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
  });

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

  it("dg2-dg6 Exam Challenge still loads with an input, Submit, and intact structure counts", () => {
    ["dg2", "dg3", "dg4", "dg5", "dg6"].forEach(id => {
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
});

describe("Plant Cell (dg8) — source-level reusability check", () => {
  it("ExamMode and buildExamOrder contain no dg8/Plant-Cell-specific hardcoded names or conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");

    const start = source.indexOf("function ExamMode(");
    const end = source.indexOf("function DiagramGame(");
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);
    const forbidden = ["Cell Wall", "Plasma Membrane", "Nucleolus", "Chloroplast", "Central Vacuole", "Mitochondrion", "Endoplasmic Reticulum", "Golgi Apparatus"];
    forbidden.forEach(word => expect(body.includes(word)).toBe(false));
    expect(body.includes('diagram.id === "dg8"')).toBe(false);

    const genStart = source.indexOf("function buildExamOrder(");
    const genEnd = source.indexOf("\n}\n", genStart) + 1;
    const genBody = source.slice(genStart, genEnd);
    forbidden.forEach(word => expect(genBody.includes(word)).toBe(false));
  });
});
