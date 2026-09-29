import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const humanHeart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openImportantPoints(diagram) {
  const utils = render(<DiagramGame diagram={diagram} />);
  fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
  return utils;
}

describe("Human Heart — Important Points — rendering", () => {
  it("opens Human Heart, then Important Points, with heading and container", () => {
    const { container } = openImportantPoints(humanHeart);
    const heading = container.querySelector("h3");
    expect(heading).toBeTruthy();
    expect(heading.textContent).toContain("Important Points");
  });
});

describe("Human Heart — Important Points — content", () => {
  it("humanHeart.importantPoints exists and is non-empty", () => {
    expect(Array.isArray(humanHeart.importantPoints)).toBe(true);
    expect(humanHeart.importantPoints.length).toBeGreaterThan(0);
  });

  it("displays every configured point, in order, with no duplicates, exact count", () => {
    openImportantPoints(humanHeart);
    const expected = humanHeart.importantPoints;
    // exact configured count (5)
    expect(expected.length).toBe(5);

    expected.forEach(point => {
      expect(screen.getByText(point)).toBeInTheDocument();
    });

    // order preserved: numbered "1." .. "5." markers appear in document order
    const numbers = screen.getAllByText(/^\d\.$/).map(el => el.textContent);
    expect(numbers).toEqual(expected.map((_, i) => `${i + 1}.`));

    // no duplicates in the underlying data
    const unique = new Set(expected);
    expect(unique.size).toBe(expected.length);
  });
});

describe("Human Heart — Important Points — data isolation", () => {
  it("Human Heart points differ entirely from Animal Cell points", () => {
    const heartSet = new Set(humanHeart.importantPoints);
    const cellSet = new Set(animalCell.importantPoints);
    const overlap = [...heartSet].filter(p => cellSet.has(p));
    expect(overlap.length).toBe(0);
  });

  it("switching Animal Cell -> Human Heart Important Points does not leak Animal Cell content", () => {
    const { unmount } = openImportantPoints(animalCell);
    expect(screen.getByText(animalCell.importantPoints[0])).toBeInTheDocument();
    unmount();

    openImportantPoints(humanHeart);
    animalCell.importantPoints.forEach(point => {
      expect(screen.queryByText(point)).not.toBeInTheDocument();
    });
    humanHeart.importantPoints.forEach(point => {
      expect(screen.getByText(point)).toBeInTheDocument();
    });
  });

  it("switching away and back to Important Points leaves no stale content", () => {
    openImportantPoints(humanHeart);
    fireEvent.click(screen.getByRole("button", { name: "🔍 Explore" }));
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    humanHeart.importantPoints.forEach(point => {
      expect(screen.getByText(point)).toBeInTheDocument();
    });
  });
});

describe("Human Heart — Important Points — mode isolation", () => {
  it("shows no quiz score, question progress, or answer controls; awards no XP by opening", () => {
    const { container } = openImportantPoints(humanHeart);
    expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Question \d+ \//)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Type the structure name")).not.toBeInTheDocument();
    expect(screen.queryByText("Submit")).not.toBeInTheDocument();
    expect(screen.queryByText(/XP earned/)).not.toBeInTheDocument();
    expect(container.querySelector("input")).toBeNull();
  });
});

describe("Human Heart — Important Points — responsive", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [1440, 1024, 390].forEach((width) => {
    it(`${width}px: renders without horizontal overflow`, () => {
      setWidth(width);
      const { container, unmount } = openImportantPoints(humanHeart);
      const heading = container.querySelector("h3");
      expect(heading?.textContent).toContain("Important Points");
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

describe("Human Heart — Important Points — accessibility", () => {
  it("uses a real heading and introduces no extra interactive controls beyond the generic mode switcher", () => {
    const { container } = openImportantPoints(humanHeart);
    const heading = container.querySelector("h3");
    expect(heading).toBeTruthy();
    expect(heading.textContent).toContain("Important Points");
    // No input/select/textarea at all — those would signal quiz/exam controls leaking in.
    expect(container.querySelectorAll("input, select, textarea").length).toBe(0);
    // The only buttons present are the generic mode-switcher tabs (one per GAME_MODES entry);
    // the Important Points body itself introduces zero interactive controls.
    const buttons = Array.from(container.querySelectorAll("button"));
    const modeLabels = ["🔍 Explore", "🏷 Label the Diagram", "🔀 Find Mismatched Labels", "❓ Identify the Structure", "📝 Exam Challenge", "⭐ Important Points"];
    expect(buttons.every(b => modeLabels.includes(b.textContent))).toBe(true);
  });
});

describe("Human Heart — Important Points — regression", () => {
  it("Human Heart Explore/Label/Mismatch/Identify/Exam all still render", () => {
    const { container } = render(<DiagramGame diagram={humanHeart} />);
    ["🔍 Explore", "🏷 Label the Diagram", "🔀 Find Mismatched Labels", "❓ Identify the Structure", "📝 Exam Challenge", "⭐ Important Points"]
      .forEach(label => {
        fireEvent.click(screen.getByRole("button", { name: label }));
        expect(container.querySelector("svg") || container.querySelector("h3")).toBeTruthy();
      });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("Animal Cell Important Points still passes and Animal Cell overall renders", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    ["🔍 Explore", "🏷 Label the Diagram", "🔀 Find Mismatched Labels", "❓ Identify the Structure", "📝 Exam Challenge", "⭐ Important Points"]
      .forEach(label => {
        fireEvent.click(screen.getByRole("button", { name: label }));
        expect(container.querySelector("svg") || container.querySelector("h3")).toBeTruthy();
      });
    animalCell.importantPoints.forEach(point => {
      fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    });
    expect(screen.getByText(animalCell.importantPoints[0])).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

describe("Human Heart — Important Points — reusability / source check", () => {
  it("ImportantPointsMode contains no dg2/dg1-specific conditionals and no duplicate component", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");

    expect(source.includes("function HumanHeartImportantPoints")).toBe(false);
    expect((source.match(/function ImportantPointsMode\(/g) || []).length).toBe(1);

    const start = source.indexOf("function ImportantPointsMode(");
    const nextFnStart = source.indexOf("\nfunction ", start + 1);
    const body = source.slice(start, nextFnStart);

    expect(body.includes('diagram.id === "dg2"')).toBe(false);
    expect(body.includes('diagram.id === "dg1"')).toBe(false);
    expect(body.includes('diagram.title === "Human Heart"')).toBe(false);
    ["Left Atrium", "Right Atrium", "Aorta", "Vena Cava", "Pulmonary Artery"]
      .forEach(word => expect(body.includes(word)).toBe(false));
  });

  it("HumanHeartSVG contains no importantPoints/score/xp/quiz-state logic", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function HumanHeartSVG(");
    const nextFnStart = source.indexOf("\nfunction ", start + 1);
    const body = source.slice(start, nextFnStart);

    ["importantPoints", "score", "xpReward", "acceptableAnswers", "questionIndex"]
      .forEach(term => expect(body.includes(term)).toBe(false));
  });
});
