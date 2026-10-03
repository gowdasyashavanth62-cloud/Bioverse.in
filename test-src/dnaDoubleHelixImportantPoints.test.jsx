import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DIAGRAM_DATA, normalizeDiagram, DIAGRAM_SVG_COMPONENTS } from "./AppUnderTest.jsx";

const dna = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg4"));
const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
const leaf = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));
const flower = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg5"));
const eco = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg6"));

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

describe("DNA Double Helix — Important Points — rendering", () => {
  it("opens DNA Double Helix, then Important Points, with heading and container", () => {
    const { container } = openImportantPoints(dna);
    const heading = container.querySelector("h3");
    expect(heading).toBeTruthy();
    expect(heading.textContent).toContain("Important Points");
  });

  it("renders the Step 18M DNADoubleHelixSVG alongside the points (not a placeholder)", () => {
    const { container } = openImportantPoints(dna);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg.getAttribute("aria-label")).toMatch(/dna/i);
    expect(screen.queryByText(/needs an SVG diagram/)).not.toBeInTheDocument();
  });
});

describe("DNA Double Helix — Important Points — data", () => {
  it("dg4.importantPoints exists and contains exactly the configured 6 points", () => {
    expect(Array.isArray(dna.importantPoints)).toBe(true);
    expect(dna.importantPoints.length).toBe(6);
  });

  it("dg4.importantPoints covers the expected DNA concepts", () => {
    const joined = dna.importantPoints.join(" ").toLowerCase();
    ["double helix", "nucleotide", "phosphate", "base", "adenine", "thymine", "guanine", "cytosine", "hydrogen bond"]
      .forEach(term => expect(joined.includes(term)).toBe(true));
  });
});

describe("DNA Double Helix — Important Points — content", () => {
  it("displays every configured point, in order, with no duplicates, exact count", () => {
    openImportantPoints(dna);
    const expected = dna.importantPoints;

    expected.forEach(point => {
      expect(screen.getByText(point)).toBeInTheDocument();
    });

    const numbers = screen.getAllByText(/^\d\.$/).map(el => el.textContent);
    expect(numbers).toEqual(expected.map((_, i) => `${i + 1}.`));

    const unique = new Set(expected);
    expect(unique.size).toBe(expected.length);
  });
});

describe("DNA Double Helix — Important Points — data isolation", () => {
  it("DNA points differ entirely from Animal Cell, Human Heart, and Leaf points", () => {
    const dnaSet = new Set(dna.importantPoints);
    [animalCell, heart, leaf].forEach(other => {
      const otherSet = new Set(other.importantPoints);
      expect([...dnaSet].filter(p => otherSet.has(p))).toHaveLength(0);
    });
  });

  it("switching Animal Cell -> DNA Important Points does not leak Animal Cell content", () => {
    const { unmount } = openImportantPoints(animalCell);
    expect(screen.getByText(animalCell.importantPoints[0])).toBeInTheDocument();
    unmount();

    openImportantPoints(dna);
    animalCell.importantPoints.forEach(point => {
      expect(screen.queryByText(point)).not.toBeInTheDocument();
    });
    dna.importantPoints.forEach(point => {
      expect(screen.getByText(point)).toBeInTheDocument();
    });
  });

  it("switching away and back to Important Points leaves no stale content, and does not duplicate points", () => {
    openImportantPoints(dna);
    fireEvent.click(screen.getByRole("button", { name: "🔍 Explore" }));
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    dna.importantPoints.forEach(point => {
      expect(screen.getAllByText(point)).toHaveLength(1);
    });
  });

  it("leaving Important Points does not corrupt Label Mode's own state", () => {
    render(<DiagramGame diagram={dna} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
  });
});

describe("DNA Double Helix — Important Points — mode isolation (no foreign controls)", () => {
  it("shows no exam input, identify choices, label bank, mismatch controls, or score/progress", () => {
    const { container } = openImportantPoints(dna);
    expect(screen.queryByLabelText("Type the structure name")).not.toBeInTheDocument();
    expect(screen.queryByText("Submit")).not.toBeInTheDocument();
    expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Question \d+ \//)).not.toBeInTheDocument();
    expect(screen.queryByText(/Labels Checked/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+ \/ 7 Labels/)).not.toBeInTheDocument();
    expect(container.querySelector("input")).toBeNull();
    dna.structures.forEach(s => {
      expect(screen.queryByText(s.name)).not.toBeInTheDocument();
    });
  });
});

describe("DNA Double Helix — Important Points — SVG integrity (Step 18M)", () => {
  it("all 7 structure IDs remain present with no duplicates, renderer stays pure", () => {
    const { container } = openImportantPoints(dna);
    const ids = dna.structures.map(s => s.id);
    expect(new Set(ids).size).toBe(7);
    ids.forEach(id => expect(container.querySelector(`#${id}`)).toBeTruthy());
    expect(DIAGRAM_SVG_COMPONENTS.dnaDoubleHelix).toBeTruthy();
  });

  it("Step 18M artwork signature is intact (twisting backbone + echo rungs, not the old block-style SVG)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function DNADoubleHelixSVG(");
    const end = source.indexOf("const DIAGRAM_SVG_COMPONENTS", start);
    const body = source.slice(start, end);
    expect(body.includes("echoRungY")).toBe(true);
    ["score", "xpReward", "acceptableAnswers", "questionIndex"].forEach(term => {
      expect(body.includes(term)).toBe(false);
    });
  });
});

describe("DNA Double Helix — Important Points — responsive", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [1440, 1024, 390].forEach((width) => {
    it(`${width}px: renders without horizontal overflow, SVG stays visible`, () => {
      setWidth(width);
      const { container, unmount } = openImportantPoints(dna);
      const heading = container.querySelector("h3");
      expect(heading?.textContent).toContain("Important Points");
      expect(container.querySelector("svg")).toBeTruthy();
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

describe("DNA Double Helix — Important Points — accessibility", () => {
  it("uses a real heading and introduces no extra interactive controls beyond the generic mode switcher", () => {
    const { container } = openImportantPoints(dna);
    const heading = container.querySelector("h3");
    expect(heading).toBeTruthy();
    expect(heading.textContent).toContain("Important Points");
    expect(container.querySelectorAll("input, select, textarea").length).toBe(0);
    const buttons = Array.from(container.querySelectorAll("button"));
    const modeLabels = ["🔍 Explore", "🏷 Label the Diagram", "🔀 Find Mismatched Labels", "❓ Identify the Structure", "📝 Exam Challenge", "⭐ Important Points"];
    expect(buttons.every(b => modeLabels.includes(b.textContent))).toBe(true);
  });
});

describe("DNA Double Helix — Important Points — reusability / source check", () => {
  it("ImportantPointsMode contains no dg4/DNA-specific conditionals and no duplicate component", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");

    expect(source.includes("function DNADoubleHelixImportantPoints")).toBe(false);
    expect((source.match(/function ImportantPointsMode\(/g) || []).length).toBe(1);

    const start = source.indexOf("function ImportantPointsMode(");
    const nextFnStart = source.indexOf("\nfunction ", start + 1);
    const body = source.slice(start, nextFnStart);

    expect(body.includes('diagram.id === "dg4"')).toBe(false);
    expect(body.includes('diagram.title === "DNA Double Helix"')).toBe(false);
    expect(body.includes("diagram.importantPoints")).toBe(true); // sourced generically
    ["Adenine", "Thymine", "Guanine", "Cytosine", "Phosphate", "Deoxyribose", "Hydrogen Bond"]
      .forEach(word => expect(body.includes(word)).toBe(false));
  });
});

describe("DNA Double Helix — Important Points — regression", () => {
  it("DNA Explore/Label/Mismatch/Identify/Exam Modes still render (Steps 18I–18N)", () => {
    const { container } = render(<DiagramGame diagram={dna} />);
    ["🔍 Explore", "🏷 Label the Diagram", "🔀 Find Mismatched Labels", "❓ Identify the Structure", "📝 Exam Challenge", "⭐ Important Points"]
      .forEach(label => {
        fireEvent.click(screen.getByRole("button", { name: label }));
        expect(container.querySelector("svg") || container.querySelector("h3")).toBeTruthy();
      });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("Animal Cell Important Points still passes", () => {
    render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    expect(screen.getByText(animalCell.importantPoints[0])).toBeInTheDocument();
  });

  it("Human Heart Important Points still passes", () => {
    render(<DiagramGame diagram={heart} />);
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    expect(screen.getByText(heart.importantPoints[0])).toBeInTheDocument();
  });

  it("Leaf Cross Section Important Points still passes", () => {
    render(<DiagramGame diagram={leaf} />);
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    expect(screen.getByText(leaf.importantPoints[0])).toBeInTheDocument();
  });

  it("Flower Structure Important Points still passes (SVG renders, no placeholder)", () => {
    const { container } = render(<DiagramGame diagram={flower} />);
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.getByText(flower.importantPoints[0])).toBeInTheDocument();
  });

  it("Ecosystem Pyramid Important Points still passes (SVG renders, no placeholder)", () => {
    const { container } = render(<DiagramGame diagram={eco} />);
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.getByText(eco.importantPoints[0])).toBeInTheDocument();
  });
});
