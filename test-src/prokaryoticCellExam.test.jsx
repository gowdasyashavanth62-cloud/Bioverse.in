import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const pcell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg7"));
const PCELL_IDS = pcell.structures.map(s => s.id);
const TOTAL = pcell.structures.length; // 8
const byId = (id) => pcell.structures.find(s => s.id === id);

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openExamMode() {
  const utils = render(<DiagramGame diagram={pcell} />);
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

function getInput() {
  return screen.getByLabelText("Type the structure name");
}

function getXpEarnedValue(container) {
  // The completion card's only <strong> holds the XP number — sidesteps a
  // known RTL limitation where getByText(regex) can fail to match text
  // split across a parent/child boundary ("Score: X/Y · XP earned: " + "<strong>55</strong>").
  const strong = container.querySelector("strong");
  return strong ? Number(strong.textContent) : null;
}

describe("STEP 20F — Prokaryotic Cell Exam Challenge — loads via Diagram Center, generic mode", () => {
  it("dg7 → Exam Challenge loads through Diagram Center with instructions, empty input, and a highlighted target", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("Prokaryotic Cell"));
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
    // None of the 8 structure names appear as clickable answer buttons (Exam
    // Challenge is free-recall, unlike Identify Mode's 4-choice buttons).
    const structureNameButtons = Array.from(container.querySelectorAll("button")).filter(b =>
      pcell.structures.some(s => b.textContent.trim() === s.name)
    );
    expect(structureNameButtons).toHaveLength(0);
    expect(container.querySelectorAll("input")).toHaveLength(1);
  });

  it("a highlighted target corresponds to a genuine dg7 SVG structure id", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    expect(PCELL_IDS).toContain(targetId);
  });
});

describe("STEP 20F — target coverage", () => {
  it("uses all 8 dg7 structures exactly once as targets across one full session", () => {
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
    expect([...seen].sort()).toEqual([...PCELL_IDS].sort());
  });

  it("every structure is independently reachable as a target (sampled across sessions)", () => {
    const seen = new Set();
    for (let i = 0; i < 25 && seen.size < TOTAL; i++) {
      const { container, unmount } = openExamMode();
      seen.add(getHighlightedStructureId(container));
      unmount();
    }
    expect(seen.size).toBe(TOTAL);
  });
});

describe("STEP 20F — answer normalization", () => {
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

  it("every acceptableAnswers variant already present in dg7's normalized data is accepted (e.g. capsule's 4 variants)", () => {
    // capsule has multiple accepted phrasings in DIAGRAM_DATA — verify each independently.
    const variants = byId("capsule").quiz.acceptableAnswers;
    expect(variants.length).toBeGreaterThan(1);
    variants.forEach(variant => {
      for (let attempt = 0; attempt < 60; attempt++) {
        const { container, unmount } = openExamMode();
        const targetId = getHighlightedStructureId(container);
        if (targetId !== "capsule") { unmount(); continue; }
        fireEvent.change(getInput(), { target: { value: `  ${variant.toUpperCase()}  ` } });
        fireEvent.click(screen.getByText("Submit"));
        expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
        unmount();
        return;
      }
      throw new Error(`Never landed on the "capsule" target to test variant "${variant}" across 60 attempts`);
    });
  });

  it("plasmaMembrane's second acceptable variant ('cell membrane') is accepted", () => {
    expect(byId("plasmaMembrane").quiz.acceptableAnswers).toContain("cell membrane");
    for (let attempt = 0; attempt < 60; attempt++) {
      const { container, unmount } = openExamMode();
      const targetId = getHighlightedStructureId(container);
      if (targetId !== "plasmaMembrane") { unmount(); continue; }
      fireEvent.change(getInput(), { target: { value: "Cell Membrane" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
      unmount();
      return;
    }
    throw new Error("Never landed on the plasmaMembrane target across 60 attempts");
  });
});

describe("STEP 20F — answer safety: no broad substring matching", () => {
  it("rejects arbitrary partial answers and appended garbage (not present in acceptableAnswers)", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    const target = byId(targetId);
    fireEvent.change(getInput(), { target: { value: "definitely not a real structure" } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText(`❌ Not quite. Correct answer: ${target.name}`)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
  });

  it("rejects a truncated prefix of the correct answer ('nucleo' for 'nucleoid')", () => {
    for (let attempt = 0; attempt < 60; attempt++) {
      const { container, unmount } = openExamMode();
      const targetId = getHighlightedStructureId(container);
      if (targetId !== "nucleoid") { unmount(); continue; }
      fireEvent.change(getInput(), { target: { value: "nucleo" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("nucleoid").name}`)).toBeInTheDocument();
      unmount();
      return;
    }
    throw new Error("Never landed on the nucleoid target across 60 attempts");
  });

  it("rejects the correct answer with appended garbage ('nucleoid abc')", () => {
    for (let attempt = 0; attempt < 60; attempt++) {
      const { container, unmount } = openExamMode();
      const targetId = getHighlightedStructureId(container);
      if (targetId !== "nucleoid") { unmount(); continue; }
      fireEvent.change(getInput(), { target: { value: "nucleoid abc" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("nucleoid").name}`)).toBeInTheDocument();
      unmount();
      return;
    }
    throw new Error("Never landed on the nucleoid target across 60 attempts");
  });

  it("rejects the correct answer with prepended garbage ('abc nucleoid')", () => {
    for (let attempt = 0; attempt < 60; attempt++) {
      const { container, unmount } = openExamMode();
      const targetId = getHighlightedStructureId(container);
      if (targetId !== "nucleoid") { unmount(); continue; }
      fireEvent.change(getInput(), { target: { value: "abc nucleoid" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("nucleoid").name}`)).toBeInTheDocument();
      unmount();
      return;
    }
    throw new Error("Never landed on the nucleoid target across 60 attempts");
  });

  it("rejects a single word extracted from 'plasma membrane' ('plasma' and 'membrane' alone)", () => {
    let sawPlasma = false;
    for (let attempt = 0; attempt < 60 && !sawPlasma; attempt++) {
      const { container, unmount } = openExamMode();
      const targetId = getHighlightedStructureId(container);
      if (targetId !== "plasmaMembrane") { unmount(); continue; }
      sawPlasma = true;
      fireEvent.change(getInput(), { target: { value: "plasma" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("plasmaMembrane").name}`)).toBeInTheDocument();
      unmount();
    }
    expect(sawPlasma).toBe(true);

    let sawMembrane = false;
    for (let attempt = 0; attempt < 60 && !sawMembrane; attempt++) {
      const { container, unmount } = openExamMode();
      const targetId = getHighlightedStructureId(container);
      if (targetId !== "plasmaMembrane") { unmount(); continue; }
      sawMembrane = true;
      fireEvent.change(getInput(), { target: { value: "membrane" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("plasmaMembrane").name}`)).toBeInTheDocument();
      unmount();
    }
    expect(sawMembrane).toBe(true);
  });

  it("rejects 'plasma membrane abc' (correct answer plus trailing garbage)", () => {
    for (let attempt = 0; attempt < 60; attempt++) {
      const { container, unmount } = openExamMode();
      const targetId = getHighlightedStructureId(container);
      if (targetId !== "plasmaMembrane") { unmount(); continue; }
      fireEvent.change(getInput(), { target: { value: "plasma membrane abc" } });
      fireEvent.click(screen.getByText("Submit"));
      expect(screen.getByText(`❌ Not quite. Correct answer: ${byId("plasmaMembrane").name}`)).toBeInTheDocument();
      unmount();
      return;
    }
    throw new Error("Never landed on the plasmaMembrane target across 60 attempts");
  });
});

describe("STEP 20F — submission / scoring", () => {
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
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: "wrong answer" } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.queryByText(/Challenge Complete/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/XP earned:/)).not.toBeInTheDocument();
  });
});

describe("STEP 20F — completion / XP", () => {
  it("dg7.xpReward is exactly 55", () => {
    expect(DIAGRAM_DATA.find(d => d.id === "dg7").xpReward).toBe(55);
  });

  it("completes after question 8 with a perfect score earning exactly 55 XP, shown once", () => {
    const { container } = openExamMode();
    for (let q = 0; q < TOTAL; q++) {
      const targetId = getHighlightedStructureId(container);
      fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
      fireEvent.click(screen.getByText("Submit"));
      fireEvent.click(screen.getByText(q + 1 >= TOTAL ? "See Results" : "Next Question →"));
    }
    expect(screen.getByText(/Challenge Complete/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Score: ${TOTAL}/${TOTAL}`))).toBeInTheDocument();
    expect(getXpEarnedValue(container)).toBe(55);
    expect(container.querySelectorAll("strong").length).toBe(1); // XP shown exactly once
  });

  it("XP never exceeds 55 on a run with wrong answers mixed in, and matches the generic formula", () => {
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
    expect(xp).toBeLessThanOrEqual(55);
    expect(xp).toBe(Math.round((55 / TOTAL) * score));
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
    expect(getXpEarnedValue(container)).toBe(55);
  });
});

describe("STEP 20F — reset / replay / isolation", () => {
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

    const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
    render(<DiagramGame diagram={heart} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
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

  it("does not corrupt Label, Mismatch, or Identify state for dg7", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));

    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText("0 / 8 Labels")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "🔀 Find Mismatched Labels" }));
    expect(screen.getByText("0 / 8 Labels Checked")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "❓ Identify the Structure" }));
    expect(screen.getByText(new RegExp(`Question 1 / ${TOTAL} · Score: 0 / ${TOTAL}`))).toBeInTheDocument();
  });
});

describe("STEP 20F — mobile / keyboard / responsive / accessibility", () => {
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
    fireEvent.change(input, { target: { value: correctAnswerFor(targetId) } }); // tap/type only, no hover
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    unmount();
    setWidth(1280);
  });

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "laptop/tablet", width: 1024, expectGrid: true },
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

  it("correct/incorrect feedback and completion feedback are accessible, real text (not color alone)", () => {
    const { container } = openExamMode();
    const targetId = getHighlightedStructureId(container);
    fireEvent.change(getInput(), { target: { value: correctAnswerFor(targetId) } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
  });
});

describe("STEP 20F — dg1–dg6 regression remains intact", () => {
  it("dg1 (Animal Cell) Exam Challenge still works, other modes still work", () => {
    const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(container.querySelector("#nucleus"));
    expect(screen.getByText("Nucleus")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
  });

  it("dg2–dg6 Exam Challenge still loads with an input, Submit, and intact structure counts", () => {
    ["dg2", "dg3", "dg4", "dg5", "dg6"].forEach(id => {
      const d = normalizeDiagram(DIAGRAM_DATA.find(x => x.id === id));
      const { container, unmount } = render(<DiagramGame diagram={d} />);
      fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
      expect(screen.getByText(new RegExp(`Question 1 / ${d.structures.length}`))).toBeInTheDocument();
      expect(screen.getByLabelText("Type the structure name")).toBeInTheDocument();
      expect(screen.getByText("Submit")).toBeInTheDocument();
      unmount();
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

describe("STEP 20F — source-level reusability check", () => {
  it("ExamMode and buildExamOrder contain no dg7/Prokaryotic-Cell-specific hardcoded names or conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");

    const start = source.indexOf("function ExamMode(");
    const end = source.indexOf("function DiagramGame(");
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);
    const forbidden = ["Capsule", "Cell Wall", "Plasma Membrane", "Cytoplasm", "Nucleoid", "Ribosomes", "Plasmid", "Flagellum"];
    forbidden.forEach(word => expect(body.includes(word)).toBe(false));
    expect(body.includes('diagram.id === "dg7"')).toBe(false);

    const genStart = source.indexOf("function buildExamOrder(");
    const genEnd = source.indexOf("\n}\n", genStart) + 1;
    const genBody = source.slice(genStart, genEnd);
    forbidden.forEach(word => expect(genBody.includes(word)).toBe(false));
  });
});
