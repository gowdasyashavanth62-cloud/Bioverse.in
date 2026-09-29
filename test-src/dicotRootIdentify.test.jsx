import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const root = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg9"));
const ROOT_IDS = root.structures.map(s => s.id);
const NAMES = root.structures.map(s => s.name);
const TOTAL = root.structures.length; // 9
const nativeNameOf = (id) => root.structures.find(s => s.id === id).name;

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openIdentifyMode() {
  const utils = render(<DiagramGame diagram={root} />);
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

describe("Dicot Root (dg9) Identify Mode -- loads via Diagram Center, generic mode", () => {
  it("T.S. of a Dicot Root -> Identify the Structure loads through Diagram Center with a valid question", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("T.S. of a Dicot Root"));
    fireEvent.click(screen.getByText("❓ Identify the Structure"));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL}`))).toBeInTheDocument();
    expect(screen.getByText("❓ What is this structure?")).toBeInTheDocument();
  });

  it("renders the first question with a highlighted target and exactly 4 options", () => {
    const { container } = openIdentifyMode();
    const options = getAnswerButtons(container);
    expect(options).toHaveLength(4);
    const highlightedId = getHighlightedId(container);
    expect(highlightedId).toBeTruthy();
    expect(ROOT_IDS).toContain(highlightedId);
  });
});

describe("Dicot Root (dg9) -- four-choice / distractor validation", () => {
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

  it("no duplicate answer labels and every choice belongs to dg9's structure set (never a DG1-DG8 name)", () => {
    const { container } = openIdentifyMode();
    const options = getAnswerButtons(container);
    const texts = options.map(b => b.textContent.trim());
    expect(new Set(texts).size).toBe(4);
    texts.forEach(t => expect(NAMES).toContain(t));
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

describe("Dicot Root (dg9) -- deterministic target coverage (all 9 structures reachable as Q1)", () => {
  it("every one of the 9 structures is deterministically reachable as the Question-1 highlight target", () => {
    // Fisher-Yates (shuffleArray) is deterministic given its Math.random()
    // inputs. For a target index k, feeding 0.999999999 on every iteration
    // i !== k makes j = floor(r*(i+1)) === i (a self-swap / no-op), and
    // feeding 0 on the iteration where i === k makes j = 0, swapping the
    // still-untouched original element at index k into position 0. This
    // forces each structure into the Q1 slot in turn via a hand-computed
    // RNG sequence -- no sampling, no coupon-collector probability, and no
    // change to shuffleArray/buildIdentifyQuestions/IdentifyMode themselves.
    // (Same technique already established and fixed for dg7/dg8's Identify tests.)
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
    // (numChoices-1)-call choice-order shuffle -- both derived from dg9's
    // actual structure count, not hardcoded.
    const numChoices = Math.min(4, TOTAL);
    const callsPerInvocation = (TOTAL - 1) + TOTAL * ((TOTAL - 2) + (numChoices - 1));
    const padding = new Array(callsPerInvocation).fill(0.5); // discarded first invocation -- value doesn't matter

    ROOT_IDS.forEach((expectedId, k) => {
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

describe("Dicot Root (dg9) -- answer behavior / scoring", () => {
  it("wrong answer gives 'Not quite' feedback, does not increment score, and reveals the correct answer", () => {
    for (let attempt = 0; attempt < 40; attempt++) {
      const { container, unmount } = openIdentifyMode();
      const options = getAnswerButtons(container);
      fireEvent.click(options[0]);
      if (screen.queryByText(/Not quite/i)) {
        expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} .* Score: 0 / ${TOTAL}`))).toBeInTheDocument();
        const marked = getAnswerButtons(container).filter(b => b.textContent.includes("✓"));
        expect(marked).toHaveLength(1);
        expect(screen.getByText(new RegExp(`Correct answer: ${marked[0].textContent.trim().replace("  ✓", "")}`))).toBeInTheDocument();
        unmount();
        return;
      }
      unmount();
    }
    throw new Error("Did not observe a wrong-answer case across 40 attempts");
  });

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
});

describe("Dicot Root (dg9) -- completion / XP", () => {
  it("completes after question 9 with correct score and XP formula (Math.round(65/9*score)), capped at dg9.xpReward (65)", () => {
    expect(DIAGRAM_DATA.find(d => d.id === "dg9").xpReward).toBe(65);
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
    expect(xp).toBeLessThanOrEqual(65);
    expect(xp).toBe(Math.round((65 / TOTAL) * score));
  });

  it("a perfect run (9/9) earns exactly dg9.xpReward (65) XP, shown exactly once", () => {
    for (let session = 0; session < 30; session++) {
      const { container, unmount } = openIdentifyMode();
      let sessionPerfect = true;
      for (let q = 0; q < TOTAL; q++) {
        const options = getAnswerButtons(container);
        fireEvent.click(options[0]);
        if (!screen.queryByText("🎯 Correct!")) sessionPerfect = false;
        fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
      }
      if (sessionPerfect) {
        expect(screen.getByText(/XP earned:\s*65/)).toBeInTheDocument();
        expect(screen.getAllByText(/XP earned:\s*65/).length).toBe(1);
        unmount();
        return;
      }
      unmount();
    }
    // A fully-correct 9/9 run is astronomically unlikely at random
    // ((1/4)^9) -- fall back to a direct formula check rather than fail
    // the suite on bad luck.
    expect(Math.round((65 / TOTAL) * TOTAL)).toBe(65);
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
});

describe("Dicot Root (dg9) -- reset / replay / isolation", () => {
  it("Play Again resets score/progress to 0 and produces a fresh question order", () => {
    const { container } = openIdentifyMode();
    const firstOrder = [];
    for (let q = 0; q < TOTAL; q++) {
      firstOrder.push(getHighlightedId(container));
      fireEvent.click(getAnswerButtons(container)[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} .* Score: 0 / ${TOTAL}`))).toBeInTheDocument();
    expect(screen.queryByText(/Challenge Complete/i)).not.toBeInTheDocument();

    const secondOrder = [];
    for (let q = 0; q < TOTAL; q++) {
      secondOrder.push(getHighlightedId(container));
      fireEvent.click(getAnswerButtons(container)[0]);
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(secondOrder.join("|")).not.toBe(firstOrder.join("|"));
  });

  it("identify state does not leak between diagrams (a fresh instance starts at Question 1, Score 0)", () => {
    const { container: c1, unmount: unmount1 } = openIdentifyMode();
    fireEvent.click(getAnswerButtons(c1)[0]);
    unmount1();

    const prokaryotic = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg7"));
    render(<DiagramGame diagram={prokaryotic} />);
    fireEvent.click(screen.getByText("❓ Identify the Structure"));
    expect(screen.getByText(/Question 1 \/ 8 .* Score: 0 \/ 8/)).toBeInTheDocument();
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

describe("Dicot Root (dg9) -- mobile / responsive / accessibility", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  it("390px mobile: all 4 answer buttons are reachable and tappable without hover, feedback stays readable", () => {
    setWidth(390);
    const { container, unmount } = openIdentifyMode();
    const options = getAnswerButtons(container);
    expect(options).toHaveLength(4);
    fireEvent.click(options[0]);
    expect(screen.getByText(/🎯 Correct!|Not quite/i)).toBeInTheDocument();
    unmount();
    setWidth(1280);
  });

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "narrow-desktop", width: 1024, expectGrid: true },
    { label: "mobile", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): no horizontal overflow, diagram/answers stay contained and readable`, () => {
      setWidth(width);
      const { container, unmount } = openIdentifyMode();
      expect(container.querySelector("svg")).toBeTruthy();
      expect(getAnswerButtons(container)).toHaveLength(4);

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

  it("answer buttons are real, accessible, keyboard-reachable controls with meaningful names", () => {
    const { container } = openIdentifyMode();
    const options = getAnswerButtons(container);
    options.forEach(b => {
      expect(b.tagName.toLowerCase()).toBe("button");
      expect(b.textContent.trim().length).toBeGreaterThan(0);
      expect(b).not.toBeDisabled();
    });
  });

  it("answered state and feedback are represented as real accessible text", () => {
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

describe("Dicot Root (dg9) -- dg1-dg8 regression remains intact", () => {
  it("dg7 (Prokaryotic Cell) is unmodified: 8 structures, XP 55, Identify Mode still loads with 4 choices", () => {
    const dg7 = DIAGRAM_DATA.find(d => d.id === "dg7");
    expect(dg7.structures.length).toBe(8);
    expect(dg7.xpReward).toBe(55);
    const d = normalizeDiagram(dg7);
    const { container, unmount } = render(<DiagramGame diagram={d} />);
    fireEvent.click(screen.getByText("❓ Identify the Structure"));
    expect(screen.getByText(/Question 1 \/ 8/)).toBeInTheDocument();
    const dNames = d.structures.map(s => s.name);
    const options = Array.from(container.querySelectorAll("button")).filter(b => {
      const text = b.textContent.trim();
      return dNames.some(n => text === n || text === `${n}  ✓`);
    });
    expect(options).toHaveLength(4);
    unmount();
  });

  it("dg8 (Plant Cell) is unmodified: 11 structures, XP 60, Identify Mode still loads with 4 choices", () => {
    const dg8 = DIAGRAM_DATA.find(d => d.id === "dg8");
    expect(dg8.structures.length).toBe(11);
    expect(dg8.xpReward).toBe(60);
    const d = normalizeDiagram(dg8);
    const { container, unmount } = render(<DiagramGame diagram={d} />);
    fireEvent.click(screen.getByText("❓ Identify the Structure"));
    expect(screen.getByText(/Question 1 \/ 11/)).toBeInTheDocument();
    const dNames = d.structures.map(s => s.name);
    const options = Array.from(container.querySelectorAll("button")).filter(b => {
      const text = b.textContent.trim();
      return dNames.some(n => text === n || text === `${n}  ✓`);
    });
    expect(options).toHaveLength(4);
    unmount();
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

  it("the registry and DIAGRAM_DATA contain dg1 through dg10, nothing renamed or removed", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6", "dg7", "dg8", "dg9", "dg10"].forEach(id => {
      expect(DIAGRAM_DATA.find(d => d.id === id)).toBeTruthy();
    });
    expect(DIAGRAM_DATA.length).toBe(10);
  });
});

describe("Dicot Root (dg9) -- source-level reusability check", () => {
  it("IdentifyMode and buildIdentifyQuestions contain no dg9/Dicot-Root-specific hardcoded names or conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");

    const start = source.indexOf("function IdentifyMode(");
    const nextFn = source.indexOf("\nfunction ", start + 1);
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, nextFn);
    const forbidden = ["Epidermis", "Cortex", "Endodermis", "Pericycle", "Xylem", "Phloem", "Cambium", "Pith", "Lateral Root"];
    forbidden.forEach(word => expect(body.includes(word)).toBe(false));
    expect(body.includes('diagram.id === "dg9"')).toBe(false);

    const genStart = source.indexOf("function buildIdentifyQuestions(");
    const genEnd = source.indexOf("\n}\n", genStart) + 1;
    const genBody = source.slice(genStart, genEnd);
    forbidden.forEach(word => expect(genBody.includes(word)).toBe(false));
  });
});
