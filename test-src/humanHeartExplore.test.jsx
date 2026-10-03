import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram, DIAGRAM_SVG_COMPONENTS } from "./AppUnderTest.jsx";

const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
const HEART_IDS = heart.structures.map(s => s.id);

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

describe("STEP 12 — Human Heart Explore Mode", () => {
  it("Human Heart opens from Diagram Center and defaults to Explore", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("Human Heart"));
    expect(screen.getByRole("button", { name: "🔍 Explore" })).toBeInTheDocument();
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
  });

  it("uses HumanHeartSVG (not AnimalCellSVG or any placeholder)", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    const svg = container.querySelector("svg");
    expect(svg.getAttribute("aria-label")).toMatch(/heart/i);
    expect(DIAGRAM_SVG_COMPONENTS[heart.image.component]).toBeTruthy();
  });

  it("all 7 structures are represented as selectable SVG groups", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    HEART_IDS.forEach(id => {
      const g = container.querySelector(`#${id}`);
      expect(g).toBeTruthy();
      expect(g.tagName.toLowerCase()).toBe("g");
    });
  });

  it("clicking a structure selects it and shows its normalized info (name, shortDescription, explanation)", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    const target = heart.structures.find(s => s.id === "leftVentricle");
    fireEvent.click(container.querySelector("#leftVentricle"));
    expect(screen.getByText(target.name)).toBeInTheDocument();
    expect(screen.getByText(target.shortDescription)).toBeInTheDocument();
    expect(screen.getByText(target.explanation)).toBeInTheDocument();
    expect(screen.getByText("Selected")).toBeInTheDocument();
  });

  it("hover gives a subtle (non-selected) visual state distinct from click-selection", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    const group = container.querySelector("#aorta");
    fireEvent.mouseEnter(group);
    expect(group.getAttribute("style")).toContain("drop-shadow(0 0 2.5px rgba(245,158,11,0.5))"); // hover-only glow
    fireEvent.mouseLeave(group);
    fireEvent.click(group);
    expect(group.getAttribute("style")).toContain("drop-shadow(0 0 4.5px rgba(245,158,11,0.95))"); // selected glow (stronger, persistent)
  });

  it("selecting a second structure replaces the panel content (no stale info)", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    const first = heart.structures.find(s => s.id === "rightAtrium");
    const second = heart.structures.find(s => s.id === "pulmonaryArtery");

    fireEvent.click(container.querySelector("#rightAtrium"));
    expect(screen.getByText(first.name)).toBeInTheDocument();

    fireEvent.click(container.querySelector("#pulmonaryArtery"));
    expect(screen.getByText(second.name)).toBeInTheDocument();
    expect(screen.queryByText(first.shortDescription)).not.toBeInTheDocument();
  });

  it("tap (click event, mobile-equivalent) selects a structure just like desktop click", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    const target = heart.structures.find(s => s.id === "venaCava");
    // jsdom/RTL have no real touch simulation; onClick is what actually
    // fires for both mouse clicks and tap gestures in this codebase (no
    // separate touch handler exists), so this is the correct mobile
    // equivalence check — not a claim of real device touch testing.
    fireEvent.click(container.querySelector("#venaCava"));
    expect(screen.getByText(target.name)).toBeInTheDocument();
    expect(screen.getByText(target.explanation)).toBeInTheDocument();
  });

  it("Clear selection returns Explore to its empty state", () => {
    const { container } = render(<DiagramGame diagram={heart} />);
    fireEvent.click(container.querySelector("#aorta"));
    fireEvent.click(screen.getByText("Clear selection"));
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
  });
});

describe("STEP 12 — Human Heart Explore responsive layout", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "laptop/tablet", width: 1024, expectGrid: true },
    { label: "mobile", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): Explore layout has no horizontal overflow, SVG + panel stay usable`, () => {
      setWidth(width);
      const { container, unmount } = render(<DiagramGame diagram={heart} />);
      expect(container.querySelector("svg")).toBeTruthy();
      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");

      fireEvent.click(container.querySelector("#leftAtrium"));
      expect(screen.getByText("Left Atrium")).toBeInTheDocument();

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

describe("STEP 12 — source-level reusability check", () => {
  it("ExploreMode contains no dg2/Human Heart-specific or dg1-specific conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function ExploreMode(");
    const end = source.indexOf("function DiagramGame(", start) > start
      ? source.indexOf("function DiagramGame(", start)
      : source.indexOf("function LabelMode(", start);
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);
    ["Left Ventricle", "Right Ventricle", "Left Atrium", "Right Atrium", "Aorta", "Pulmonary Artery", "Vena Cava"]
      .forEach(n => expect(body.includes(n)).toBe(false));
    expect(body.includes('diagram.id === "dg2"')).toBe(false);
    expect(body.includes('diagram.id === "dg1"')).toBe(false);
  });
});

describe("STEP 12 — Animal Cell Explore regression", () => {
  it("Animal Cell Explore Mode still works unmodified", () => {
    const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(container.querySelector("#nucleus"));
    expect(screen.getByText("Nucleus")).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
