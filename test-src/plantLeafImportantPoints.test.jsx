import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const leaf = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));
const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));

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

describe("Leaf Cross Section — Important Points — rendering", () => {
  it("opens Leaf Cross Section, then Important Points, with heading and container", () => {
    const { container } = openImportantPoints(leaf);
    const heading = container.querySelector("h3");
    expect(heading).toBeTruthy();
    expect(heading.textContent).toContain("Important Points");
  });
});

describe("Leaf Cross Section — Important Points — data", () => {
  it("dg3 is normalized and importantPoints exists as a non-empty array", () => {
    expect(Array.isArray(leaf.structures)).toBe(true);
    expect(Array.isArray(leaf.importantPoints)).toBe(true);
    expect(leaf.importantPoints.length).toBeGreaterThan(0);
  });

  it("importantPoints contains exactly the configured 6 points", () => {
    expect(leaf.importantPoints.length).toBe(6);
  });
});

describe("Leaf Cross Section — Important Points — content", () => {
  it("displays every configured point, in order, with no duplicates, exact count", () => {
    openImportantPoints(leaf);
    const expected = leaf.importantPoints;

    expected.forEach(point => {
      expect(screen.getByText(point)).toBeInTheDocument();
    });

    const numbers = screen.getAllByText(/^\d\.$/).map(el => el.textContent);
    expect(numbers).toEqual(expected.map((_, i) => `${i + 1}.`));

    const unique = new Set(expected);
    expect(unique.size).toBe(expected.length);
  });
});

describe("Leaf Cross Section — Important Points — data isolation", () => {
  it("Leaf Cross Section points differ entirely from Animal Cell and Human Heart points", () => {
    const leafSet = new Set(leaf.importantPoints);
    const cellSet = new Set(animalCell.importantPoints);
    const heartSet = new Set(heart.importantPoints);
    expect([...leafSet].filter(p => cellSet.has(p))).toHaveLength(0);
    expect([...leafSet].filter(p => heartSet.has(p))).toHaveLength(0);
  });

  it("switching Animal Cell -> Leaf Cross Section Important Points does not leak Animal Cell content", () => {
    const { unmount } = openImportantPoints(animalCell);
    expect(screen.getByText(animalCell.importantPoints[0])).toBeInTheDocument();
    unmount();

    openImportantPoints(leaf);
    animalCell.importantPoints.forEach(point => {
      expect(screen.queryByText(point)).not.toBeInTheDocument();
    });
    leaf.importantPoints.forEach(point => {
      expect(screen.getByText(point)).toBeInTheDocument();
    });
  });
});

describe("Leaf Cross Section — Important Points — navigation / mode isolation", () => {
  it("Explore → Important Points renders cleanly with no leaked selection state", () => {
    const { container } = render(<DiagramGame diagram={leaf} />);
    fireEvent.click(container.querySelector("#stoma"));
    expect(screen.getByText("Stoma")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    expect(screen.queryByText(leaf.structures.find(s => s.id === "stoma").explanation)).not.toBeInTheDocument();
    leaf.importantPoints.forEach(point => expect(screen.getByText(point)).toBeInTheDocument());
  });

  it("Exam → Important Points renders cleanly with no leaked exam input/score", () => {
    render(<DiagramGame diagram={leaf} />);
    fireEvent.click(screen.getByRole("button", { name: "📝 Exam Challenge" }));
    expect(screen.getByLabelText("Type the structure name")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    expect(screen.queryByLabelText("Type the structure name")).not.toBeInTheDocument();
    expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();
    leaf.importantPoints.forEach(point => expect(screen.getByText(point)).toBeInTheDocument());
  });

  it("Identify → Important Points renders cleanly with no leaked question/choices", () => {
    render(<DiagramGame diagram={leaf} />);
    fireEvent.click(screen.getByRole("button", { name: "❓ Identify the Structure" }));
    expect(screen.getByText(/Question 1 \/ 6/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    expect(screen.queryByText(/Question \d+ \//)).not.toBeInTheDocument();
    expect(screen.queryByText("❓ What is this structure?")).not.toBeInTheDocument();
    leaf.importantPoints.forEach(point => expect(screen.getByText(point)).toBeInTheDocument());
  });

  it("leaving Important Points does not corrupt Label Mode's own state", () => {
    render(<DiagramGame diagram={leaf} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText("0 / 6 Labels")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText("0 / 6 Labels")).toBeInTheDocument();
  });
});

describe("Leaf Cross Section — Important Points — mode isolation (no foreign controls)", () => {
  it("shows no exam input, identify choices, label bank, mismatch controls, or score/progress", () => {
    const { container } = openImportantPoints(leaf);
    expect(screen.queryByLabelText("Type the structure name")).not.toBeInTheDocument();
    expect(screen.queryByText("Submit")).not.toBeInTheDocument();
    expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Question \d+ \//)).not.toBeInTheDocument();
    expect(screen.queryByText(/Labels Checked/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+ \/ 6 Labels/)).not.toBeInTheDocument();
    expect(container.querySelector("input")).toBeNull();
    leaf.structures.forEach(s => {
      expect(screen.queryByText(s.name)).not.toBeInTheDocument(); // no draggable/choice chips bearing structure names
    });
  });
});

describe("Leaf Cross Section — Important Points — responsive", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [1440, 1024, 390].forEach((width) => {
    it(`${width}px: renders without horizontal overflow`, () => {
      setWidth(width);
      const { container, unmount } = openImportantPoints(leaf);
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

describe("Leaf Cross Section — Important Points — accessibility", () => {
  it("uses a real heading and introduces no extra interactive controls beyond the generic mode switcher", () => {
    const { container } = openImportantPoints(leaf);
    const heading = container.querySelector("h3");
    expect(heading).toBeTruthy();
    expect(heading.textContent).toContain("Important Points");
    expect(container.querySelectorAll("input, select, textarea").length).toBe(0);
    const buttons = Array.from(container.querySelectorAll("button"));
    const modeLabels = ["🔍 Explore", "🏷 Label the Diagram", "🔀 Find Mismatched Labels", "❓ Identify the Structure", "📝 Exam Challenge", "⭐ Important Points"];
    expect(buttons.every(b => modeLabels.includes(b.textContent))).toBe(true);
  });
});

describe("Leaf Cross Section — Important Points — reusability / source check", () => {
  it("ImportantPointsMode contains no dg3/leaf-specific conditionals and no duplicate component", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");

    expect(source.includes("function LeafCrossSectionImportantPoints")).toBe(false);
    expect(source.includes("dg3ImportantPoints")).toBe(false);
    expect((source.match(/function ImportantPointsMode\(/g) || []).length).toBe(1);

    const start = source.indexOf("function ImportantPointsMode(");
    const nextFnStart = source.indexOf("\nfunction ", start + 1);
    const body = source.slice(start, nextFnStart);

    expect(body.includes('diagram.id === "dg3"')).toBe(false);
    expect(body.includes('diagram.id === "dg1"')).toBe(false);
    expect(body.includes('diagram.id === "dg2"')).toBe(false);
    expect(body.includes('diagram.title === "Leaf Cross Section"')).toBe(false);
    expect(body.includes('diagram.category === "Plant Anatomy"')).toBe(false);
    expect(body.includes("diagram.importantPoints")).toBe(true); // sourced generically
    ["Epidermis", "Palisade Layer", "Spongy Layer", "Vascular Bundle", "Guard Cell", "Stoma"]
      .forEach(word => expect(body.includes(word)).toBe(false));
  });

  it("LeafCrossSectionSVG contains no importantPoints/score/xp/quiz-state logic", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function LeafCrossSectionSVG(");
    const end = source.indexOf("const DIAGRAM_SVG_COMPONENTS", start);
    const body = source.slice(start, end);

    ["importantPoints", "score", "xpReward", "acceptableAnswers", "questionIndex"]
      .forEach(term => expect(body.includes(term)).toBe(false));
  });
});

describe("Leaf Cross Section — Important Points — regression", () => {
  it("Leaf Explore/Label/Mismatch/Identify/Exam/Important Points all still render", () => {
    const { container } = render(<DiagramGame diagram={leaf} />);
    ["🔍 Explore", "🏷 Label the Diagram", "🔀 Find Mismatched Labels", "❓ Identify the Structure", "📝 Exam Challenge", "⭐ Important Points"]
      .forEach(label => {
        fireEvent.click(screen.getByRole("button", { name: label }));
        expect(container.querySelector("svg") || container.querySelector("h3")).toBeTruthy();
      });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("Animal Cell modes still render, including Important Points", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    ["🔍 Explore", "🏷 Label the Diagram", "🔀 Find Mismatched Labels", "❓ Identify the Structure", "📝 Exam Challenge", "⭐ Important Points"]
      .forEach(label => {
        fireEvent.click(screen.getByRole("button", { name: label }));
        expect(container.querySelector("svg") || container.querySelector("h3")).toBeTruthy();
      });
    expect(screen.getByText(animalCell.importantPoints[0])).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("Human Heart modes still render, including Important Points", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    ["🔍 Explore", "🏷 Label the Diagram", "🔀 Find Mismatched Labels", "❓ Identify the Structure", "📝 Exam Challenge", "⭐ Important Points"]
      .forEach(label => {
        fireEvent.click(screen.getByRole("button", { name: label }));
        expect(container.querySelector("svg") || container.querySelector("h3")).toBeTruthy();
      });
    expect(screen.getByText(heart.importantPoints[0])).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
