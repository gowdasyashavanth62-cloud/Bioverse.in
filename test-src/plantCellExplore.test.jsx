import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram, DIAGRAM_SVG_COMPONENTS } from "./AppUnderTest.jsx";

const plant = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg8"));
const PLANT_IDS = plant.structures.map(s => s.id);

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

describe("Plant Cell (dg8) — Explore Mode discovery", () => {
  it("Diagram Center can locate and load Plant Cell, opening on Explore by default", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("Plant Cell"));
    expect(screen.getByRole("button", { name: "🔍 Explore" })).toBeInTheDocument();
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
  });

  it("uses PlantCellSVG (not any other diagram's renderer) and has exactly 11 structures", () => {
    expect(plant.structures.length).toBe(11);
    const { container } = render(<DiagramGame diagram={plant} />);
    const svg = container.querySelector("svg");
    expect(svg.getAttribute("aria-label")).toMatch(/plant cell/i);
    expect(DIAGRAM_SVG_COMPONENTS[plant.image.component]).toBeTruthy();
  });

  it("all 11 structures render as selectable SVG groups with the exact expected ids, no duplicates, no missing renderer", () => {
    expect(new Set(PLANT_IDS).size).toBe(11);
    const { container } = render(<DiagramGame diagram={plant} />);
    PLANT_IDS.forEach(id => {
      const matches = container.querySelectorAll(`#${id}`);
      expect(matches.length).toBe(1);
      expect(matches[0].tagName.toLowerCase()).toBe("g");
    });
  });
});

describe("Plant Cell (dg8) — Explore Mode behavior (all 11 structures)", () => {
  it("every one of the 11 structures can be selected, highlighting correctly and showing its name/description/explanation", () => {
    PLANT_IDS.forEach(id => {
      const { container, unmount } = render(<DiagramGame diagram={plant} />);
      const target = plant.structures.find(s => s.id === id);
      const group = container.querySelector(`#${id}`);
      fireEvent.click(group);
      expect(group.getAttribute("style")).toContain("drop-shadow(0 0 4.5px rgba(245,158,11,0.95))");
      expect(screen.getByText(target.name)).toBeInTheDocument();
      expect(screen.getByText(target.shortDescription)).toBeInTheDocument();
      expect(screen.getByText(target.explanation)).toBeInTheDocument();
      expect(screen.getByText("Selected")).toBeInTheDocument();
      unmount();
    });
  });

  it("selecting a second structure replaces the panel content (no stale info)", () => {
    const { container } = render(<DiagramGame diagram={plant} />);
    const first = plant.structures.find(s => s.id === "cellWall");
    const second = plant.structures.find(s => s.id === "golgiApparatus");

    fireEvent.click(container.querySelector("#cellWall"));
    expect(screen.getByText(first.name)).toBeInTheDocument();

    fireEvent.click(container.querySelector("#golgiApparatus"));
    expect(screen.getByText(second.name)).toBeInTheDocument();
    expect(screen.queryByText(first.shortDescription)).not.toBeInTheDocument();
  });

  it("hover gives a subtle (non-selected) visual state distinct from click-selection", () => {
    const { container } = render(<DiagramGame diagram={plant} />);
    const group = container.querySelector("#chloroplast");
    fireEvent.mouseEnter(group);
    expect(group.getAttribute("style")).toContain("drop-shadow(0 0 2.5px rgba(245,158,11,0.5))");
    fireEvent.mouseLeave(group);
    fireEvent.click(group);
    expect(group.getAttribute("style")).toContain("drop-shadow(0 0 4.5px rgba(245,158,11,0.95))");
  });

  it("Clear selection returns Explore to its empty state (deselect/reset)", () => {
    const { container } = render(<DiagramGame diagram={plant} />);
    fireEvent.click(container.querySelector("#nucleolus"));
    fireEvent.click(screen.getByText("Clear selection"));
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
    expect(screen.queryByText("Selected")).not.toBeInTheDocument();
  });

  it("tap (click event, no hover requirement) selects a structure just like desktop click", () => {
    const { container } = render(<DiagramGame diagram={plant} />);
    const target = plant.structures.find(s => s.id === "centralVacuole");
    // jsdom/RTL have no real touch simulation; onClick fires for both mouse
    // clicks and tap gestures in this codebase (no separate touch handler
    // exists), matching the convention already used by dg7's Explore tests.
    fireEvent.click(container.querySelector("#centralVacuole"));
    expect(screen.getByText(target.name)).toBeInTheDocument();
    expect(screen.getByText(target.explanation)).toBeInTheDocument();
  });
});

describe("Plant Cell (dg8) — Explore accessibility", () => {
  it("every structure group is an interactive, accessible click target", () => {
    const { container } = render(<DiagramGame diagram={plant} />);
    PLANT_IDS.forEach(id => {
      const group = container.querySelector(`#${id}`);
      expect(group.getAttribute("style")).toContain("cursor: pointer");
      expect(group.id).toBe(id);
    });
    const svg = container.querySelector("svg");
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toBeTruthy();
  });

  it("the Clear selection control is a real, labeled, keyboard-reachable button", () => {
    const { container } = render(<DiagramGame diagram={plant} />);
    fireEvent.click(container.querySelector("#mitochondrion"));
    const clearBtn = screen.getByText("Clear selection");
    expect(clearBtn.tagName.toLowerCase()).toBe("button");
  });

  it("selected state is represented in the info panel via a visible 'Selected' badge, not color alone, and structure info is available without hover", () => {
    const { container } = render(<DiagramGame diagram={plant} />);
    expect(screen.queryByText("Selected")).not.toBeInTheDocument();
    fireEvent.click(container.querySelector("#endoplasmicReticulum"));
    expect(screen.getByText("Selected")).toBeInTheDocument();
    const target = plant.structures.find(s => s.id === "endoplasmicReticulum");
    expect(screen.getByText(target.explanation)).toBeInTheDocument();
  });
});

describe("Plant Cell (dg8) — responsive layout", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "mobile", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): Explore layout has no horizontal overflow, SVG + panel stay usable, selection stays visible`, () => {
      setWidth(width);
      const { container, unmount } = render(<DiagramGame diagram={plant} />);
      expect(container.querySelector("svg")).toBeTruthy();
      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");

      // Tap-only interaction (no mouseEnter/hover fired) works at this width.
      fireEvent.click(container.querySelector("#ribosomes"));
      expect(screen.getByText("Ribosomes")).toBeInTheDocument();
      expect(screen.getByText("Selected")).toBeInTheDocument();

      const badWidths = Array.from(container.querySelectorAll("[style]")).filter(el => {
        const w = el.style.width;
        return w && /^\d+(\.\d+)?px$/.test(w) && parseFloat(w) > width;
      });
      expect(badWidths).toHaveLength(0);

      unmount();
      setWidth(1280);
    });
  });

  it("all 11 structures remain selectable at mobile width (390px), not just a subset", () => {
    setWidth(390);
    PLANT_IDS.forEach(id => {
      const { container, unmount } = render(<DiagramGame diagram={plant} />);
      const target = plant.structures.find(s => s.id === id);
      fireEvent.click(container.querySelector(`#${id}`));
      expect(screen.getByText(target.name)).toBeInTheDocument();
      unmount();
    });
    setWidth(1280);
  });
});

describe("Plant Cell (dg8) — XP safety in Explore Mode", () => {
  it("exploring never shows an XP line, and dg8.xpReward (60) is untouched by Explore interaction", () => {
    const raw8 = DIAGRAM_DATA.find(d => d.id === "dg8");
    expect(raw8.xpReward).toBe(60);
    const { container } = render(<DiagramGame diagram={plant} />);
    PLANT_IDS.forEach(id => fireEvent.click(container.querySelector(`#${id}`)));
    fireEvent.click(screen.getByText("Clear selection"));
    // Precise: a bare /XP/i would also match "Explore" (contains the
    // substring "xp") — check for an actual XP amount/line instead, which
    // Explore Mode must never render.
    expect(screen.queryByText(/\d+\s*xp\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/XP earned:/i)).not.toBeInTheDocument();
    expect(raw8.xpReward).toBe(60); // still unchanged after interaction
  });
});

describe("Plant Cell (dg8) — isolation", () => {
  it("Explore selection state does not leak into a freshly mounted instance of a different diagram", () => {
    const { container: c1, unmount: unmount1 } = render(<DiagramGame diagram={plant} />);
    fireEvent.click(c1.querySelector("#golgiApparatus"));
    expect(screen.getByText("Golgi Apparatus")).toBeInTheDocument();
    unmount1();

    const prokaryotic = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg7"));
    render(<DiagramGame diagram={prokaryotic} />);
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
    expect(screen.queryByText("Golgi Apparatus")).not.toBeInTheDocument();
    expect(screen.queryByText("Selected")).not.toBeInTheDocument();
  });
});

describe("Plant Cell (dg8) — dg1–dg7 regression (Explore Mode still loads for every prior diagram)", () => {
  it("dg1–dg7 all still load into Explore Mode with an intact SVG and their own structure counts", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6", "dg7"].forEach(id => {
      const d = normalizeDiagram(DIAGRAM_DATA.find(x => x.id === id));
      expect(d.structures.length).toBeGreaterThan(0);
      const { container, unmount } = render(<DiagramGame diagram={d} />);
      expect(container.querySelector("svg")).toBeTruthy();
      expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
      unmount();
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
