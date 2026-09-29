import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram, DIAGRAM_SVG_COMPONENTS } from "./AppUnderTest.jsx";

const dna = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg4"));
const TOTAL = dna.structures.length; // 7
const byId = (id) => dna.structures.find(s => s.id === id);

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openDnaExamMode() {
  const utils = render(<DiagramGame diagram={dna} />);
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

describe("DNA Double Helix — Exam Challenge — data", () => {
  it("exactly 7 dg4 structures exist, and every structure has non-empty quiz.acceptableAnswers", () => {
    expect(dna.structures.length).toBe(7);
    dna.structures.forEach(s => {
      expect(Array.isArray(s.quiz?.acceptableAnswers)).toBe(true);
      expect(s.quiz.acceptableAnswers.length).toBeGreaterThan(0);
    });
  });

  it("canonical acceptable answers match the normalized structure names", () => {
    const expectedCanonical = {
      adenine: "adenine", thymine: "thymine", guanine: "guanine", cytosine: "cytosine",
      phosphate: "phosphate", deoxyribose: "deoxyribose", hydrogenBond: "hydrogen bond",
    };
    Object.entries(expectedCanonical).forEach(([id, canonical]) => {
      expect(byId(id).quiz.acceptableAnswers).toContain(canonical);
    });
  });

  it("dg4.xpReward is 55, and does not depend on legacy dg4.labels", () => {
    expect(dna.xpReward).toBe(55);
    expect(dna.labels).toBeUndefined();
  });
});

describe("DNA Double Helix — Exam Challenge — rendering & question structure", () => {
  it("opens with instructions, input, submit, and a highlighted target (free recall, no choice buttons)", () => {
    const { container } = openDnaExamMode();
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
    expect(screen.getByText(/Type the name of the highlighted structure/i)).toBeInTheDocument();
    expect(getInput()).toBeInTheDocument();
    expect(getInput().tagName).toBe("INPUT");
    expect(screen.getByText("Submit")).toBeInTheDocument();
    expect(getHighlightedStructureId(container)).toBeTruthy();
    dna.structures.forEach(s => expect(screen.queryByRole("button", { name: s.name })).not.toBeInTheDocument());
  });

  it("renders the Step 18M DNADoubleHelixSVG (not a placeholder), with all 7 structure IDs and no duplicates", () => {
    const { container } = openDnaExamMode();
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg.getAttribute("aria-label")).toMatch(/dna/i);
    expect(screen.queryByText(/needs an SVG diagram/)).not.toBeInTheDocument();
    const ids = dna.structures.map(s => s.id);
    expect(new Set(ids).size).toBe(7);
    ids.forEach(id => expect(container.querySelector(`#${id}`)).toBeTruthy());
    expect(DIAGRAM_SVG_COMPONENTS.dnaDoubleHelix).toBeTruthy();
  });

  it("generates exactly 7 questions covering all 7 structures exactly once (production randomness preserved)", () => {
    const { container } = openDnaExamMode();
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
    expect([...seen].sort()).toEqual(dna.structures.map(s => s.id).sort());
  });
});

describe("DNA Double Helix — Exam Challenge — answer validation & normalization", () => {
  it("accepts each structure's canonical answer, case/whitespace-insensitively (all 7 structures sampled)", () => {
    dna.structures.forEach(({ id }) => {
      const { container, unmount } = openDnaExamMode();
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

  it("accepts a configured acceptable variant (Hydrogen Bond alias 'hydrogen bonds') when that structure is the target", () => {
    const { container } = openDnaExamMode();
    let targetId = getHighlightedStructureId(container);
    let guard = 0;
    while (targetId !== "hydrogenBond" && guard < TOTAL) {
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText("Next Question →"));
      targetId = getHighlightedStructureId(container);
      guard++;
    }
    expect(targetId).toBe("hydrogenBond");
    expect(byId("hydrogenBond").quiz.acceptableAnswers).toContain("hydrogen bonds");
    fireEvent.change(getInput(), { target: { value: "  Hydrogen Bonds  " } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
  });

  it("an empty submission is a no-op per the existing generic contract (not treated as a wrong answer)", () => {
    const { container } = openDnaExamMode();
    fireEvent.change(getInput(), { target: { value: "" } });
    fireEvent.click(screen.getByText("Submit"));
    // Generic ExamMode intentionally ignores blank input (`if (!norm) return;`)
    // rather than silently counting it as incorrect — the question stays open.
    expect(screen.queryByText(/Not quite/)).not.toBeInTheDocument();
    expect(screen.queryByText("✅ Correct!")).not.toBeInTheDocument();
    expect(getInput()).not.toBeDisabled();
    expect(screen.getByText(new RegExp(`Score: 0 / ${TOTAL}`))).toBeInTheDocument();
    // The question remains answerable afterward.
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
  });

  it("rejects a random incorrect answer, an Animal Cell answer, and a Human Heart answer", () => {
    ["definitely not a dna structure", "Nucleus", "Aorta"].forEach(bad => {
      const { container, unmount } = openDnaExamMode();
      const targetId = getHighlightedStructureId(container);
      const target = byId(targetId);
      fireEvent.change(getInput(), { target: { value: bad } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${target.name}`)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`Score: 0 / ${TOTAL}`))).toBeInTheDocument();
      unmount();
    });
  });

  it("locks the question after submission (no double-scoring, no leaked state into next question)", () => {
    const { container } = openDnaExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    expect(getInput()).toBeDisabled();
    expect(screen.queryByText("Submit")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Next Question →"));
    expect(getInput()).not.toBeDisabled();
    expect(getInput().value).toBe("");
  });

  it("Enter key submits, and Enter again advances (keyboard-only flow)", () => {
    const { container } = openDnaExamMode();
    const targetId = getHighlightedStructureId(container);
    const input = getInput();
    fireEvent.change(input, { target: { value: correctAnswerFor(targetId) } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText(new RegExp(`Score: 1 / ${TOTAL}`))).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText(/Question 2 \/ 7/)).toBeInTheDocument();
  });
});

describe("DNA Double Helix — Exam Challenge — completion, XP, Play Again", () => {
  it("completes with a perfect score and exactly 55 XP, sourced from diagram.xpReward", () => {
    const { container } = openDnaExamMode();
    expect(dna.xpReward).toBe(55);
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
    expect(getXpEarnedValue(container)).toBe(55);
  });

  it("caps XP correctly on a mixed correct/wrong run (formula-derived, not hardcoded)", () => {
    const { container } = openDnaExamMode();
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
    expect(xp).toBeLessThanOrEqual(55);
    expect(xp).toBe(Math.round((dna.xpReward / TOTAL) * score));
  });

  it("Play Again resets score/progress/feedback/input and produces a fresh question order", () => {
    const { container } = openDnaExamMode();
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

  it("question order is randomized across separate independent sessions", () => {
    const orders = [];
    for (let i = 0; i < 15; i++) {
      const { container, unmount } = openDnaExamMode();
      orders.push(getHighlightedStructureId(container));
      unmount();
    }
    expect(new Set(orders).size).toBeGreaterThan(1);
  });
});

describe("DNA Double Helix — Exam Challenge — mobile/touch-equivalent", () => {
  it("completes a full session via the same handlers used on touch devices", () => {
    const { container } = openDnaExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit")); // same onClick fired by a real tap
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
  });
});

describe("DNA Double Helix — Exam Challenge — responsive", () => {
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
      const { container, unmount } = openDnaExamMode();
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

describe("DNA Double Helix — Exam Challenge — accessibility", () => {
  it("input has an accessible label, submit is a real button, submitted controls disable", () => {
    const { container } = openDnaExamMode();
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

describe("DNA Double Helix — Exam Challenge — data isolation", () => {
  it("does not display Animal Cell or Human Heart structure names", () => {
    openDnaExamMode();
    ["Nucleus", "Mitochondria", "Left Ventricle", "Aorta", "Vena Cava"].forEach(foreign => {
      expect(screen.queryByText(foreign)).not.toBeInTheDocument();
    });
  });
});

describe("DNA Double Helix — Exam Challenge — reusability / source check", () => {
  it("ExamMode contains no dg4-specific or DNA-name-specific conditionals, and no second exam implementation exists", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");

    expect(source.includes("function DNADoubleHelixExamMode")).toBe(false);
    expect(source.includes("dg4ExamGame")).toBe(false);
    expect((source.match(/function ExamMode\(/g) || []).length).toBe(1);

    const start = source.indexOf("function ExamMode(");
    const end = source.indexOf("function DiagramGame(");
    const body = source.slice(start, end);

    ["Adenine", "Thymine", "Guanine", "Cytosine", "Phosphate", "Deoxyribose", "Hydrogen Bond"]
      .forEach(word => expect(body.includes(word)).toBe(false));
    expect(body.includes('diagram.id === "dg4"')).toBe(false);
    expect(body.includes('diagram.title === "DNA Double Helix"')).toBe(false);
    expect(body.includes("55")).toBe(false); // no hardcoded dg4 xpReward
    expect(body.includes("diagram.xpReward")).toBe(true); // XP sourced generically
  });

  it("DNADoubleHelixSVG remains a pure renderer with no exam/game state (Step 18M artwork untouched by this step)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function DNADoubleHelixSVG(");
    const end = source.indexOf("const DIAGRAM_SVG_COMPONENTS", start);
    const body = source.slice(start, end);

    ["score", "xpReward", "acceptableAnswers", "questionIndex", "choiceIds"]
      .forEach(term => expect(body.includes(term)).toBe(false));
    // Step 18M artwork signature checks (twisting backbone + echo rungs) —
    // confirms this step did not revert to the earlier block-style DNA SVG.
    expect(body.includes("echoRungY")).toBe(true);
  });
});

describe("DNA Double Helix — Exam Challenge — regression", () => {
  const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
  const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
  const leaf = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));
  const flower = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg5"));
  const eco = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg6"));

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

  it("Leaf Cross Section Exam Mode still passes", () => {
    render(<DiagramGame diagram={leaf} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(/Question 1 \/ 6 · Score: 0 \/ 6/)).toBeInTheDocument();
  });

  it("Flower Structure Exam Mode still passes (SVG renders, no placeholder)", () => {
    const { container } = render(<DiagramGame diagram={flower} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.queryByText(/needs an SVG diagram/)).not.toBeInTheDocument();
  });

  it("Ecosystem Pyramid Exam Mode still passes (SVG renders, no placeholder)", () => {
    const { container } = render(<DiagramGame diagram={eco} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.queryByText(/needs an SVG diagram/)).not.toBeInTheDocument();
  });

  it("DNA Explore/Label/Mismatch/Identify Modes (Steps 18I–18L) still pass", () => {
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

  it("no console errors across a full DNA Double Helix Exam session", () => {
    const { container } = openDnaExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
