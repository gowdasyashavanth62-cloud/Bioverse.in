import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const leaf = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));
const TOTAL = leaf.structures.length; // 6
const byId = (id) => leaf.structures.find(s => s.id === id);

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openLeafExamMode() {
  const utils = render(<DiagramGame diagram={leaf} />);
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

describe("Leaf Cross Section — Exam Challenge — data", () => {
  it("exactly 6 dg3 structures exist, and every structure has non-empty quiz.acceptableAnswers", () => {
    expect(leaf.structures.length).toBe(6);
    leaf.structures.forEach(s => {
      expect(Array.isArray(s.quiz?.acceptableAnswers)).toBe(true);
      expect(s.quiz.acceptableAnswers.length).toBeGreaterThan(0);
    });
  });

  it("canonical acceptable answers match the normalized structure names (case-insensitively)", () => {
    const expectedCanonical = {
      epidermis: "epidermis",
      palisadeLayer: "palisade layer",
      spongyLayer: "spongy layer",
      vascularBundle: "vascular bundle",
      guardCell: "guard cell",
      stoma: "stoma",
    };
    Object.entries(expectedCanonical).forEach(([id, canonical]) => {
      expect(byId(id).quiz.acceptableAnswers).toContain(canonical);
    });
  });
});

describe("Leaf Cross Section — Exam Challenge — rendering & question structure", () => {
  it("opens with instructions, input, submit, and a highlighted target (free recall, no choice buttons)", () => {
    const { container } = openLeafExamMode();
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
    expect(screen.getByText(/Type the name of the highlighted structure/i)).toBeInTheDocument();
    expect(getInput()).toBeInTheDocument();
    expect(getInput().tagName).toBe("INPUT");
    expect(screen.getByText("Submit")).toBeInTheDocument();
    expect(getHighlightedStructureId(container)).toBeTruthy();
    // Free recall: no per-structure answer-choice buttons present.
    leaf.structures.forEach(s => expect(screen.queryByRole("button", { name: s.name })).not.toBeInTheDocument());
  });

  it("generates exactly 6 questions covering all 6 structures exactly once", () => {
    const { container } = openLeafExamMode();
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
    expect([...seen].sort()).toEqual(leaf.structures.map(s => s.id).sort());
  });
});

describe("Leaf Cross Section — Exam Challenge — answer validation & normalization", () => {
  it("accepts each structure's canonical answer, case/whitespace-insensitively", () => {
    leaf.structures.forEach(({ id }) => {
      const { container, unmount } = openLeafExamMode();
      let targetId = getHighlightedStructureId(container);
      let guard = 0;
      while (targetId !== id && guard < TOTAL) {
        fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
        fireEvent.click(screen.getByText("Submit"));
        fireEvent.click(screen.getByText("Next Question →"));
        targetId = getHighlightedStructureId(container);
        guard++;
      }
      expect(targetId).toBe(id);
      const canonical = correctAnswerFor(id);
      fireEvent.change(getInput(), { target: { value: `  ${canonical.toUpperCase()}  ` } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
      unmount();
    });
  });

  it("accepts a configured acceptable variant (Palisade Layer alias 'palisade mesophyll') when that structure is the target", () => {
    const { container } = openLeafExamMode();
    let targetId = getHighlightedStructureId(container);
    let guard = 0;
    while (targetId !== "palisadeLayer" && guard < TOTAL) {
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText("Next Question →"));
      targetId = getHighlightedStructureId(container);
      guard++;
    }
    expect(targetId).toBe("palisadeLayer");
    expect(byId("palisadeLayer").quiz.acceptableAnswers).toContain("palisade mesophyll");
    fireEvent.change(getInput(), { target: { value: "  Palisade Mesophyll  " } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
  });

  it("does not accept an unconfigured synonym (e.g. 'mesophyll layer' alone is not in Spongy Layer's data)", () => {
    const { container } = openLeafExamMode();
    let targetId = getHighlightedStructureId(container);
    let guard = 0;
    while (targetId !== "spongyLayer" && guard < TOTAL) {
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText("Next Question →"));
      targetId = getHighlightedStructureId(container);
      guard++;
    }
    expect(targetId).toBe("spongyLayer");
    expect(byId("spongyLayer").quiz.acceptableAnswers).not.toContain("mesophyll layer");
    fireEvent.change(getInput(), { target: { value: "mesophyll layer" } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText(/Not quite/)).toBeInTheDocument();
  });

  it("rejects a random incorrect answer, an Animal Cell answer, and a Human Heart answer", () => {
    ["definitely not a leaf structure", "Nucleus", "Aorta"].forEach(bad => {
      const { container, unmount } = openLeafExamMode();
      const targetId = getHighlightedStructureId(container);
      const target = byId(targetId);
      fireEvent.change(getInput(), { target: { value: bad } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${target.name}`)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`Score: 0 / ${TOTAL}`))).toBeInTheDocument();
      unmount();
    });
  });

  it("gives error feedback and does not increment score on a wrong answer", () => {
    const { container } = openLeafExamMode();
    const targetId = getHighlightedStructureId(container);
    const target = byId(targetId);
    fireEvent.change(getInput(), { target: { value: "definitely not a leaf structure" } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText(`❌ Not quite. Correct answer: ${target.name}`)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: 0 / ${TOTAL}`))).toBeInTheDocument();
  });

  it("locks the question after submission (no double-scoring, no leaked state into next question)", () => {
    const { container } = openLeafExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    expect(getInput()).toBeDisabled();
    expect(screen.queryByText("Submit")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Next Question →"));
    expect(getInput()).not.toBeDisabled();
    expect(getInput().value).toBe("");
  });

  it("Enter key submits, and Enter again advances", () => {
    const { container } = openLeafExamMode();
    const targetId = getHighlightedStructureId(container);
    const input = getInput();
    fireEvent.change(input, { target: { value: correctAnswerFor(targetId) } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText(new RegExp(`Score: 1 / ${TOTAL}`))).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText(/Question 2 \/ 6/)).toBeInTheDocument();
  });
});

describe("Leaf Cross Section — Exam Challenge — completion, XP, Play Again", () => {
  it("completes with a perfect score and exactly the configured 45 XP (sourced from diagram.xpReward)", () => {
    const { container } = openLeafExamMode();
    expect(leaf.xpReward).toBe(45);
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
    expect(getXpEarnedValue(container)).toBe(45);
  });

  it("caps XP correctly on a mixed correct/wrong run (formula-derived, not hardcoded)", () => {
    const { container } = openLeafExamMode();
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
    expect(xp).toBeLessThanOrEqual(45);
    expect(xp).toBe(Math.round((leaf.xpReward / TOTAL) * score));
  });

  it("Play Again resets score/progress/feedback and produces a fresh question order", () => {
    const { container } = openLeafExamMode();
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
    expect(getInput().value).toBe("");

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
      const { container, unmount } = openLeafExamMode();
      orders.push(getHighlightedStructureId(container));
      unmount();
    }
    expect(new Set(orders).size).toBeGreaterThan(1);
  });
});

describe("Leaf Cross Section — Exam Challenge — mobile/touch-equivalent", () => {
  it("completes a full session via the same handlers used on touch devices", () => {
    const { container } = openLeafExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit")); // same onClick fired by a real tap
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
  });
});

describe("Leaf Cross Section — Exam Challenge — responsive", () => {
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
      const { container, unmount } = openLeafExamMode();
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

describe("Leaf Cross Section — Exam Challenge — accessibility", () => {
  it("input has an accessible label, submit is a real button, submitted controls disable", () => {
    const { container } = openLeafExamMode();
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

describe("Leaf Cross Section — Exam Challenge — data isolation", () => {
  it("does not display Animal Cell or Human Heart structure names", () => {
    openLeafExamMode();
    ["Nucleus", "Mitochondria", "Left Ventricle", "Aorta", "Vena Cava"].forEach(foreign => {
      expect(screen.queryByText(foreign)).not.toBeInTheDocument();
    });
  });
});

describe("Leaf Cross Section — Exam Challenge — reusability / source check", () => {
  it("ExamMode contains no dg3-specific or leaf-name-specific conditionals, and no second exam implementation exists", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");

    expect(source.includes("function LeafCrossSectionExamMode")).toBe(false);
    expect(source.includes("dg3ExamGame")).toBe(false);
    expect((source.match(/function ExamMode\(/g) || []).length).toBe(1);

    const start = source.indexOf("function ExamMode(");
    const end = source.indexOf("function DiagramGame(");
    const body = source.slice(start, end);

    ["Epidermis", "Palisade Layer", "Spongy Layer", "Vascular Bundle", "Guard Cell", "Stoma"]
      .forEach(word => expect(body.includes(word)).toBe(false));
    expect(body.includes('diagram.id === "dg3"')).toBe(false);
    expect(body.includes('diagram.id === "dg1"')).toBe(false);
    expect(body.includes('diagram.id === "dg2"')).toBe(false);
    expect(body.includes("45")).toBe(false); // no hardcoded dg3 xpReward
    expect(body.includes("diagram.xpReward")).toBe(true); // XP sourced generically
  });

  it("LeafCrossSectionSVG remains a pure renderer with no exam/game state", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function LeafCrossSectionSVG(");
    const end = source.indexOf("const DIAGRAM_SVG_COMPONENTS", start);
    const body = source.slice(start, end);

    ["score", "xpReward", "acceptableAnswers", "questionIndex", "choiceIds"]
      .forEach(term => expect(body.includes(term)).toBe(false));
  });
});

describe("Leaf Cross Section — Exam Challenge — regression", () => {
  const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
  const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));

  it("Animal Cell Exam Mode still passes", () => {
    render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
  });

  it("Human Heart Exam Mode still passes", () => {
    render(<DiagramGame diagram={heart} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
  });

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

  it("Animal Cell Mismatch Mode still passes", () => {
    render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" }));
    expect(screen.getByText("0 / 7 Labels Checked")).toBeInTheDocument();
  });

  it("Human Heart Mismatch Mode still passes", () => {
    render(<DiagramGame diagram={heart} />);
    fireEvent.click(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" }));
    expect(screen.getByText("0 / 7 Labels Checked")).toBeInTheDocument();
  });

  it("Leaf Cross Section Explore/Label/Mismatch/Identify Modes still pass", () => {
    const { container } = render(<DiagramGame diagram={leaf} />);
    fireEvent.click(container.querySelector("#stoma"));
    expect(screen.getByText("Stoma")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText(`0 / ${TOTAL} Labels`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" }));
    expect(screen.getByText(`0 / ${TOTAL} Labels Checked`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "❓ Identify the Structure" }));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
  });

  it("no console errors across a full Leaf Cross Section Exam session", () => {
    const { container } = openLeafExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
