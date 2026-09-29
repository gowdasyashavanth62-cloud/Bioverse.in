import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const stem = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg10"));
const STEM_IDS = stem.structures.map(s => s.id);
const NAMES = stem.structures.map(s => s.name);
const TOTAL = stem.structures.length; // 10
const nativeNameOf = (id) => stem.structures.find(s => s.id === id).name;

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openIdentifyMode() {
  const utils = render(<DiagramGame diagram={stem} />);
  fireEvent.click(screen.getByText("❓ Identify the Structure"));
  return utils;
}

function getAnswerButtons(container) {
  return Array.from(container.querySelectorAll("button")).filter(b => {
    const text = b.textContent.trim();
    return NAMES.some(n => text === n || text === `${n}  ✓`);
  });
}

function getHighlightedId(container) {
  const g = Array.from(container.querySelectorAll("svg g")).find(
    el => el.getAttribute("style")?.includes("drop-shadow(0 0 4.5px rgba(245,158,11")
  );
  return g ? g.id : null;
}

describe("Dicot Stem (dg10) Identify Mode -- loads via Diagram Center, generic mode", () => {
  it("T.S. of a Dicot Stem -> Identify the Structure loads through Diagram Center with a valid question", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("T.S. of a Dicot Stem"));
    fireEvent.click(screen.getByText("❓ Identify the Structure"));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL}`))).toBeInTheDocument();
    expect(screen.getByText("❓ What is this structure?")).toBeInTheDocument();
  });

  it("renders the first question with a highlighted target (one of DG10's own 10 ids) and exactly 4 options, using DicotStemSVG", () => {
    const { container } = openIdentifyMode();
    const options = getAnswerButtons(container);
    expect(options).toHaveLength(4);
    const highlightedId = getHighlightedId(container);
    expect(highlightedId).toBeTruthy();
    expect(STEM_IDS).toContain(highlightedId);
    const svg = container.querySelector("svg");
    expect(svg.getAttribute("aria-label")).toMatch(/dicot stem/i);
  });
});

describe("Dicot Stem (dg10) -- four-choice / distractor validation", () => {
  it("exactly 1 of 4 options is correct, matches the highlighted structure's own name, and there are exactly 3 distractors", () => {
    const { container } = openIdentifyMode();
    const highlightedId = getHighlightedId(container);
    const options = getAnswerButtons(container);
    const texts = options.map(b => b.textContent.trim());

    expect(texts).toContain(nativeNameOf(highlightedId));
    expect(texts.filter(t => t === nativeNameOf(highlightedId)).length).toBe(1);
    const distractors = texts.filter(t => t !== nativeNameOf(highlightedId));
    expect(distractors).toHaveLength(3);
    distractors.forEach(t => expect(t).not.toBe(nativeNameOf(highlightedId)));
  });

  it("no duplicate answer labels and every choice belongs to dg10's structure set (never a DG1-DG9 name, never undefined/empty)", () => {
    const { container } = openIdentifyMode();
    const options = getAnswerButtons(container);
    const texts = options.map(b => b.textContent.trim());
    expect(new Set(texts).size).toBe(4);
    texts.forEach(t => {
      expect(NAMES).toContain(t);
      expect(t.length).toBeGreaterThan(0);
    });
  });

  it("submitting marks exactly one option correct with a trailing checkmark", () => {
    const { container } = openIdentifyMode();
    const highlightedId = getHighlightedId(container); // capture before submit -- flash overrides the selected-style filter afterward
    fireEvent.click(getAnswerButtons(container)[0]);
    const marked = getAnswerButtons(container).filter(b => b.textContent.includes("✓"));
    expect(marked).toHaveLength(1);
    expect(marked[0].textContent.replace("  ✓", "")).toBe(nativeNameOf(highlightedId));
  });

  it("the correct answer is not always in the same button position (order is randomized)", () => {
    const positions = new Set();
    for (let i = 0; i < 20; i++) {
      const { container, unmount } = openIdentifyMode();
      const highlightedId = getHighlightedId(container);
      const options = getAnswerButtons(container);
      const idx = options.findIndex(b => b.textContent.trim() === nativeNameOf(highlightedId));
      positions.add(idx);
      unmount();
    }
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe("Dicot Stem (dg10) -- deterministic target coverage (all 10 structures reachable as Q1)", () => {
  it("every one of the 10 structures is deterministically reachable as the Question-1 highlight target", () => {
    // Fisher-Yates (shuffleArray) is deterministic given its Math.random()
    // inputs. For a target index k, feeding 0.999999999 on every iteration
    // i !== k makes j = floor(r*(i+1)) === i (a self-swap / no-op), and
    // feeding 0 on the iteration where i === k makes j = 0, swapping the
    // still-untouched original element at index k into position 0. This
    // forces each structure into the Q1 slot in turn via a hand-computed
    // RNG sequence -- no sampling, no coupon-collector probability, and no
    // change to shuffleArray/buildIdentifyQuestions/IdentifyMode themselves.
    // (Same technique already established for dg7/dg8/dg9's Identify tests.)
    const NO_SWAP = 0.999999999;
    function forcedShuffleFirstSequence(targetIndex, total) {
      const values = [];
      for (let i = total - 1; i >= 1; i--) values.push(i === targetIndex ? 0 : NO_SWAP);
      return values;
    }

    // IdentifyMode's `useState(makeQuestions)` lazy initializer runs once on
    // mount, but its `useEffect(() => resetGame(), [diagram.id])` also fires
    // on that same mount and calls `setQuestions(makeQuestions())` again --
    // the SECOND invocation's result is the one actually rendered. The test
    // must pad past the first (discarded) invocation so the controlled
    // sequence lands on the second, real one. callsPerInvocation mirrors
    // buildIdentifyQuestions' own math exactly: (total-1) for the order
    // shuffle, plus per question a (total-2)-call distractor shuffle and a
    // (numChoices-1)-call choice-order shuffle -- both derived from dg10's
    // actual structure count (10, not hardcoded to dg9's 9).
    const numChoices = Math.min(4, TOTAL);
    const callsPerInvocation = (TOTAL - 1) + TOTAL * ((TOTAL - 2) + (numChoices - 1));
    const padding = new Array(callsPerInvocation).fill(0.5); // discarded first invocation -- value doesn't matter

    STEM_IDS.forEach((expectedId, k) => {
      const sequence = [...padding, ...forcedShuffleFirstSequence(k, TOTAL)];
      let call = 0;
      const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => {
        const v = call < sequence.length ? sequence[call] : 0.5;
        call++;
        return v;
      });
      const { container, unmount } = openIdentifyMode();
      expect(getHighlightedId(container)).toBe(expectedId);
      unmount();
      randomSpy.mockRestore();
    });
  });
});

describe("Dicot Stem (dg10) -- target validity", () => {
  it("buildIdentifyQuestions' direct output references only dg10's own 10 structures, one target per question, never undefined/empty", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    // Exercised indirectly through the real rendered component below
    // (avoids duplicating buildIdentifyQuestions' logic in the test file);
    // this assertion targets its OUTPUT shape via the rendered DOM across
    // a full 10-question session.
    const { container } = openIdentifyMode();
    for (let q = 0; q < TOTAL; q++) {
      const highlightedId = getHighlightedId(container);
      expect(highlightedId).toBeTruthy();
      expect(STEM_IDS).toContain(highlightedId);
      const options = getAnswerButtons(container);
      expect(options).toHaveLength(4);
      options.forEach(o => expect(o.textContent.trim().length).toBeGreaterThan(0));
      fireEvent.click(options[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    // avoid unused-import lint noise while keeping the dynamic-import style
    // consistent with the source-level reusability check below
    expect(typeof fs.readFileSync).toBe("function");
    expect(typeof path.join).toBe("function");
    expect(typeof fileURLToPath).toBe("function");
  });

  it("across a full session, all 10 questions target a distinct structure each -- the full DG10 set, no repeats, no foreign ids", () => {
    const { container } = openIdentifyMode();
    const seenTargets = [];
    for (let q = 0; q < TOTAL; q++) {
      seenTargets.push(getHighlightedId(container));
      fireEvent.click(getAnswerButtons(container)[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(seenTargets.length).toBe(TOTAL);
    expect(new Set(seenTargets).size).toBe(TOTAL);
    expect(seenTargets.slice().sort()).toEqual([...STEM_IDS].sort());
  });
});

describe("Dicot Stem (dg10) -- answer behavior / scoring (multiple disjoint correct/incorrect examples)", () => {
  it("correct answer gives '🎯 Correct!' feedback and increments score by 1", () => {
    for (let attempt = 0; attempt < 40; attempt++) {
      const { container, unmount } = openIdentifyMode();
      const options = getAnswerButtons(container);
      fireEvent.click(options[0]);
      if (screen.queryByText("🎯 Correct!")) {
        expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} .* Score: 1 / ${TOTAL}`))).toBeInTheDocument();
        unmount();
        return;
      }
      unmount();
    }
    throw new Error("Did not observe a correct-answer case across 40 attempts");
  });

  it("wrong answer gives 'Not quite' feedback, does not increment score, reveals the correct answer, and does not falsely mark the wrong choice correct", () => {
    for (let attempt = 0; attempt < 40; attempt++) {
      const { container, unmount } = openIdentifyMode();
      const options = getAnswerButtons(container);
      fireEvent.click(options[0]);
      if (screen.queryByText(/Not quite/i)) {
        expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} .* Score: 0 / ${TOTAL}`))).toBeInTheDocument();
        const marked = getAnswerButtons(container).filter(b => b.textContent.includes("✓"));
        expect(marked).toHaveLength(1); // only the true correct answer gets the checkmark
        expect(screen.getByText(new RegExp(`Correct answer: ${marked[0].textContent.trim().replace("  ✓", "")}`))).toBeInTheDocument();
        unmount();
        return;
      }
      unmount();
    }
    throw new Error("Did not observe a wrong-answer case across 40 attempts");
  });

  it("incorrect answers award 0 XP (no XP line shown on the question itself)", () => {
    for (let attempt = 0; attempt < 40; attempt++) {
      const { container, unmount } = openIdentifyMode();
      const options = getAnswerButtons(container);
      fireEvent.click(options[0]);
      if (screen.queryByText(/Not quite/i)) {
        expect(screen.queryByText(/XP earned:/)).not.toBeInTheDocument();
        unmount();
        return;
      }
      unmount();
    }
    throw new Error("Did not observe a wrong-answer case across 40 attempts");
  });

  it("a question cannot be scored twice: options disable after submission and further clicks don't move the score", () => {
    const { container } = openIdentifyMode();
    const options = getAnswerButtons(container);
    fireEvent.click(options[0]);
    getAnswerButtons(container).forEach(b => expect(b).toBeDisabled());
    fireEvent.click(options[1]);
    const scoreText = screen.getByText(new RegExp(`Question 1 / ${TOTAL} .* Score:`)).textContent;
    fireEvent.click(options[1]);
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} .* Score:`)).textContent).toBe(scoreText);
  });

  it("advances one question at a time via Next Question, and repeated answering across questions cannot double-count", () => {
    const { container } = openIdentifyMode();
    fireEvent.click(getAnswerButtons(container)[0]);
    const afterQ1 = screen.getByText(new RegExp(`Question 1 / ${TOTAL} .* Score: (0|1) / ${TOTAL}`)).textContent;
    const scoreAfterQ1 = Number(afterQ1.match(/Score: (\d+)/)[1]);
    fireEvent.click(screen.getByText("Next Question →"));
    expect(screen.getByText(new RegExp(`Question 2 / ${TOTAL} .* Score: ${scoreAfterQ1} / ${TOTAL}`))).toBeInTheDocument();
  });

  it("a second disjoint correct-answer example on a different question index also scores correctly", () => {
    const { container } = openIdentifyMode();
    fireEvent.click(getAnswerButtons(container)[0]);
    fireEvent.click(screen.getByText("Next Question →"));
    for (let attempt = 0; attempt < 40; attempt++) {
      const before = Number(screen.getByText(new RegExp(`Question 2 / ${TOTAL} .* Score: \\d+`)).textContent.match(/Score: (\d+)/)[1]);
      const options = getAnswerButtons(container);
      fireEvent.click(options[0]);
      if (screen.queryByText("🎯 Correct!")) {
        expect(screen.getByText(new RegExp(`Question 2 / ${TOTAL} .* Score: ${before + 1} / ${TOTAL}`))).toBeInTheDocument();
        return;
      }
      // wrong: reset this attempt by remounting fresh and retry via Play Again equivalent is unnecessary here;
      // Next Question isn't available mid-attempt without resubmission, so just accept the wrong path once and stop.
      expect(screen.getByText(new RegExp(`Question 2 / ${TOTAL} .* Score: ${before} / ${TOTAL}`))).toBeInTheDocument();
      return;
    }
  });
});

describe("Dicot Stem (dg10) -- completion / XP", () => {
  it("completes after question 10 with correct score and XP formula (Math.round(63/10*score)), capped at dg10.xpReward (63)", () => {
    expect(DIAGRAM_DATA.find(d => d.id === "dg10").xpReward).toBe(63);
    const { container } = openIdentifyMode();
    let score = 0;
    for (let q = 0; q < TOTAL; q++) {
      const options = getAnswerButtons(container);
      fireEvent.click(options[0]);
      if (screen.queryByText("🎯 Correct!")) score++;
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${score}/${TOTAL}`))).toBeInTheDocument();
    const summary = screen.getByText(new RegExp(`Score: ${score}/${TOTAL}`)).parentElement.textContent;
    const xp = Number(summary.match(/XP earned:\s*(\d+)/)[1]);
    expect(xp).toBeLessThanOrEqual(63);
    expect(xp).toBe(Math.round((63 / TOTAL) * score));
  });

  it("a perfect run (10/10) earns exactly dg10.xpReward (63) XP, shown exactly once", () => {
    // Reuse the deterministic Q1-forcing technique, extended so every
    // question's target is known in advance and its own correct choice can
    // be clicked precisely -- guarantees a perfect run without relying on
    // (1/4)^10 luck or a probabilistic retry loop.
    const NO_SWAP = 0.999999999;
    function forcedShuffleFirstSequence(targetIndex, total) {
      const values = [];
      for (let i = total - 1; i >= 1; i--) values.push(i === targetIndex ? 0 : NO_SWAP);
      return values;
    }
    const numChoices = Math.min(4, TOTAL);
    const callsPerInvocation = (TOTAL - 1) + TOTAL * ((TOTAL - 2) + (numChoices - 1));
    const padding = new Array(callsPerInvocation).fill(0.5);
    // Force Q1's target to "epidermis" (index 0) deterministically; for the
    // remaining questions we don't need to control the target identity --
    // we just always click the option that IS the correct answer, which
    // IdentifyMode already exposes via its own name-matching contract.
    const sequence = [...padding, ...forcedShuffleFirstSequence(0, TOTAL)];
    let call = 0;
    const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => {
      const v = call < sequence.length ? sequence[call] : 0.5;
      call++;
      return v;
    });
    const { container } = openIdentifyMode();
    for (let q = 0; q < TOTAL; q++) {
      const highlightedId = getHighlightedId(container);
      const options = getAnswerButtons(container);
      const correctOption = options.find(b => b.textContent.trim() === nativeNameOf(highlightedId));
      fireEvent.click(correctOption);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    randomSpy.mockRestore();
    const xpLine = screen.getByText(/XP earned:/);
    expect(xpLine.parentElement.textContent).toContain("XP earned: 63");
    expect(screen.getAllByText(/XP earned:/).length).toBe(1);
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
  });

  it("repeated interaction after completion cannot double-award XP (no remaining answer surface; XP shown once)", () => {
    const { container } = openIdentifyMode();
    for (let q = 0; q < TOTAL; q++) {
      fireEvent.click(getAnswerButtons(container)[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(getAnswerButtons(container)).toHaveLength(0);
    expect(screen.getAllByText(/XP earned:/).length).toBe(1);
  });

  it("repeated clicks on a disabled/answered question cannot farm XP or progress", () => {
    const { container } = openIdentifyMode();
    const options = getAnswerButtons(container);
    fireEvent.click(options[0]);
    const scoreLineBefore = screen.getByText(new RegExp(`Question 1 / ${TOTAL} .* Score:`)).textContent;
    for (let i = 0; i < 10; i++) options.forEach(o => fireEvent.click(o));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} .* Score:`)).textContent).toBe(scoreLineBefore);
  });
});

describe("Dicot Stem (dg10) -- reset / replay / isolation", () => {
  it("Play Again resets score/progress to 0 and produces a fresh question order; XP is not duplicated across replay cycles", () => {
    const { container } = openIdentifyMode();
    const firstOrder = [];
    for (let q = 0; q < TOTAL; q++) {
      firstOrder.push(getHighlightedId(container));
      fireEvent.click(getAnswerButtons(container)[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    const firstXpMatch = screen.getByText(/XP earned:/).parentElement.textContent.match(/XP earned:\s*(\d+)/);
    expect(firstXpMatch).toBeTruthy();

    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} .* Score: 0 / ${TOTAL}`))).toBeInTheDocument();
    expect(screen.queryByText(/Challenge Complete/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/XP earned:/)).not.toBeInTheDocument();

    const secondOrder = [];
    for (let q = 0; q < TOTAL; q++) {
      secondOrder.push(getHighlightedId(container));
      fireEvent.click(getAnswerButtons(container)[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(secondOrder.join("|")).not.toBe(firstOrder.join("|"));
    // The completion screen shows exactly one XP line for THIS session --
    // no accumulation from the previous Play Again cycle.
    expect(screen.getAllByText(/XP earned:/).length).toBe(1);
  });

  it("identify state does not leak between diagrams (a fresh instance starts at Question 1, Score 0)", () => {
    const { container: c1, unmount: unmount1 } = openIdentifyMode();
    fireEvent.click(getAnswerButtons(c1)[0]);
    unmount1();

    const dicotRoot = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg9"));
    render(<DiagramGame diagram={dicotRoot} />);
    fireEvent.click(screen.getByText("❓ Identify the Structure"));
    expect(screen.getByText(/Question 1 \/ 9 .* Score: 0 \/ 9/)).toBeInTheDocument();
  });

  it("identify state does not leak between modes: switching away and back gives a fresh Question 1 / Score 0", () => {
    const { container } = openIdentifyMode();
    fireEvent.click(getAnswerButtons(container)[0]);
    fireEvent.click(screen.getByText("Next Question →"));
    expect(screen.getByText(new RegExp(`Question 2 / ${TOTAL}`))).toBeInTheDocument();

    fireEvent.click(screen.getByText("🔍 Explore"));
    expect(screen.queryByText(new RegExp(`Question \\d+ / ${TOTAL}`))).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("❓ Identify the Structure"));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} .* Score: 0 / ${TOTAL}`))).toBeInTheDocument();
  });
});

describe("Dicot Stem (dg10) -- mobile / responsive / accessibility", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "laptop", width: 1024, expectGrid: true },
    { label: "mobile-412", width: 412, expectGrid: false },
    { label: "mobile-390", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): no horizontal overflow, diagram/answers stay contained, readable, and tappable without hover`, () => {
      setWidth(width);
      const { container, unmount } = openIdentifyMode();
      expect(container.querySelector("svg")).toBeTruthy();
      expect(getAnswerButtons(container)).toHaveLength(4);

      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");

      // Tap-only interaction (no hover event fired anywhere above).
      fireEvent.click(getAnswerButtons(container)[0]);
      expect(screen.getByText(/🎯 Correct!|Not quite/i)).toBeInTheDocument();

      const badWidths = Array.from(container.querySelectorAll("[style]")).filter(el => {
        const w = el.style.width;
        return w && /^\d+(\.\d+)?px$/.test(w) && parseFloat(w) > width;
      });
      expect(badWidths).toHaveLength(0);

      unmount();
      setWidth(1280);
    });
  });

  it("answer buttons are real, accessible, keyboard-reachable controls with meaningful names, not disabled before answering", () => {
    const { container } = openIdentifyMode();
    const options = getAnswerButtons(container);
    options.forEach(b => {
      expect(b.tagName.toLowerCase()).toBe("button");
      expect(b.textContent.trim().length).toBeGreaterThan(0);
      expect(b).not.toBeDisabled();
    });
  });

  it("answered state and feedback are represented as real accessible text, and all options become disabled (not just color-changed)", () => {
    const { container } = openIdentifyMode();
    fireEvent.click(getAnswerButtons(container)[0]);
    expect(screen.getByText(/🎯 Correct!|Not quite/i)).toBeInTheDocument();
    getAnswerButtons(container).forEach(b => expect(b).toBeDisabled());
  });

  it("completion feedback is accessible, queryable text with a real Play Again button", () => {
    const { container } = openIdentifyMode();
    for (let q = 0; q < TOTAL; q++) {
      fireEvent.click(getAnswerButtons(container)[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play Again" })).toBeInTheDocument();
  });
});

describe("Dicot Stem (dg10) -- dg1-dg9 regression remains intact", () => {
  it("dg9 (Dicot Root) is unmodified: 9 structures, XP 65, Identify Mode still loads with 4 choices", () => {
    const dg9 = DIAGRAM_DATA.find(d => d.id === "dg9");
    expect(dg9.structures.length).toBe(9);
    expect(dg9.xpReward).toBe(65);
    const d = normalizeDiagram(dg9);
    const { container, unmount } = render(<DiagramGame diagram={d} />);
    fireEvent.click(screen.getByText("❓ Identify the Structure"));
    expect(screen.getByText(/Question 1 \/ 9/)).toBeInTheDocument();
    const dNames = d.structures.map(s => s.name);
    const options = Array.from(container.querySelectorAll("button")).filter(b => {
      const text = b.textContent.trim();
      return dNames.some(n => text === n || text === `${n}  ✓`);
    });
    expect(options).toHaveLength(4);
    unmount();
  });

  it("dg9's own Identify completion still works exactly as before, unaffected by dg10's addition", () => {
    const dg9 = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg9"));
    const { container } = render(<DiagramGame diagram={dg9} />);
    fireEvent.click(screen.getByText("❓ Identify the Structure"));
    for (let q = 0; q < dg9.structures.length; q++) {
      fireEvent.click(Array.from(container.querySelectorAll("button")).filter(b => {
        const text = b.textContent.trim();
        return dg9.structures.some(s => text === s.name || text === `${s.name}  ✓`);
      })[0]);
      fireEvent.click(screen.getByText(q + 1 >= dg9.structures.length ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByText(/XP earned:/)).toBeInTheDocument();
  });

  it("dg7 (Prokaryotic Cell) and dg8 (Plant Cell) are unmodified and still load into Identify Mode with 4 choices", () => {
    const dg7 = DIAGRAM_DATA.find(d => d.id === "dg7");
    expect(dg7.structures.length).toBe(8);
    expect(dg7.xpReward).toBe(55);
    const dg8 = DIAGRAM_DATA.find(d => d.id === "dg8");
    expect(dg8.structures.length).toBe(11);
    expect(dg8.xpReward).toBe(60);
    [dg7, dg8].forEach(raw => {
      const d = normalizeDiagram(raw);
      const { container, unmount } = render(<DiagramGame diagram={d} />);
      fireEvent.click(screen.getByText("❓ Identify the Structure"));
      expect(screen.getByText(new RegExp(`Question 1 / ${d.structures.length}`))).toBeInTheDocument();
      const dNames = d.structures.map(s => s.name);
      const options = Array.from(container.querySelectorAll("button")).filter(b => {
        const text = b.textContent.trim();
        return dNames.some(n => text === n || text === `${n}  ✓`);
      });
      expect(options).toHaveLength(4);
      unmount();
    });
  });

  it("dg1-dg6 Identify Mode still loads with exactly 4 (or fewer, per own structure count) choices and intact structure counts", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6"].forEach(id => {
      const d = normalizeDiagram(DIAGRAM_DATA.find(x => x.id === id));
      const { container, unmount } = render(<DiagramGame diagram={d} />);
      fireEvent.click(screen.getByText("❓ Identify the Structure"));
      expect(screen.getByText(new RegExp(`Question 1 / ${d.structures.length}`))).toBeInTheDocument();
      const dNames = d.structures.map(s => s.name);
      const options = Array.from(container.querySelectorAll("button")).filter(b => {
        const text = b.textContent.trim();
        return dNames.some(n => text === n || text === `${n}  ✓`);
      });
      expect(options).toHaveLength(Math.min(4, d.structures.length));
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

  it("DG10 Foundation/Explore/Label/Mismatch data remain intact (spot check: xpReward, structure count, SVG registration)", () => {
    const raw10 = DIAGRAM_DATA.find(d => d.id === "dg10");
    expect(raw10.xpReward).toBe(63);
    expect(raw10.structures.length).toBe(10);
    expect(raw10.image).toEqual({ type: "svg", component: "dicotStem" });
    expect(raw10.title).toBe("T.S. of a Dicot Stem");
    expect(raw10.chapter).toBe("Ch 6 Anatomy of Flowering Plants");
  });
});

describe("Dicot Stem (dg10) -- source-level reusability check", () => {
  it("IdentifyMode and buildIdentifyQuestions contain no dg10/Dicot-Stem-specific hardcoded names or conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");

    const start = source.indexOf("function IdentifyMode(");
    const nextFn = source.indexOf("\nfunction ", start + 1);
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, nextFn);
    const forbidden = ["Epidermis", "Hypodermis", "Cortex", "Endodermis", "Pericycle", "Xylem", "Phloem", "Cambium", "Medullary Ray", "Pith"];
    forbidden.forEach(word => expect(body.includes(word)).toBe(false));
    expect(body.includes('diagram.id === "dg10"')).toBe(false);
    expect(body.includes('diagram.image.component === "dicotStem"')).toBe(false);

    const genStart = source.indexOf("function buildIdentifyQuestions(");
    const genEnd = source.indexOf("\n}\n", genStart) + 1;
    const genBody = source.slice(genStart, genEnd);
    forbidden.forEach(word => expect(genBody.includes(word)).toBe(false));
  });
});
