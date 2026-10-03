import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram, DIAGRAM_SVG_COMPONENTS } from "./AppUnderTest.jsx";

const leaf = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg3"));
const LEAF_IDS = leaf.structures.map(s => s.id);

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

describe("STEP 18B — Leaf Cross Section Explore Mode", () => {
  it("Leaf Cross Section opens from Diagram Center and defaults to Explore", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("Leaf Cross Section"));
    expect(screen.getByRole("button", { name: "🔍 Explore" })).toBeInTheDocument();
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
  });

  it("uses LeafCrossSectionSVG (not AnimalCellSVG/HumanHeartSVG or any placeholder)", () => {
    const { container } = render(<DiagramGame diagram={leaf} />);
    const svg = container.querySelector("svg");
    expect(svg.getAttribute("aria-label")).toMatch(/leaf/i);
    expect(DIAGRAM_SVG_COMPONENTS[leaf.image.component]).toBeTruthy();
  });

  it("all 6 structures are represented as selectable SVG groups", () => {
    const { container } = render(<DiagramGame diagram={leaf} />);
    expect(LEAF_IDS.length).toBe(6);
    LEAF_IDS.forEach(id => {
      const g = container.querySelector(`#${id}`);
      expect(g).toBeTruthy();
      expect(g.tagName.toLowerCase()).toBe("g");
    });
  });

  [
    ["epidermis", "Epidermis"],
    ["palisadeLayer", "Palisade Layer"],
    ["spongyLayer", "Spongy Layer"],
    ["vascularBundle", "Vascular Bundle"],
    ["guardCell", "Guard Cell"],
    ["stoma", "Stoma"],
  ].forEach(([id, name]) => {
    it(`selecting ${name} updates selectedId and shows its normalized info`, () => {
      const { container } = render(<DiagramGame diagram={leaf} />);
      const target = leaf.structures.find(s => s.id === id);
      fireEvent.click(container.querySelector(`#${id}`));
      expect(screen.getByText(target.name)).toBeInTheDocument();
      expect(screen.getByText(target.shortDescription)).toBeInTheDocument();
      expect(screen.getByText(target.explanation)).toBeInTheDocument();
      expect(screen.getByText("Selected")).toBeInTheDocument();
      const group = container.querySelector(`#${id}`);
      expect(group.getAttribute("style")).toContain("drop-shadow(0 0 4.5px rgba(245,158,11,0.95))");
    });
  });

  it("hover gives a subtle (non-selected) visual state distinct from click-selection", () => {
    const { container } = render(<DiagramGame diagram={leaf} />);
    const group = container.querySelector("#stoma");
    fireEvent.mouseEnter(group);
    expect(group.getAttribute("style")).toContain("drop-shadow(0 0 2.5px rgba(245,158,11,0.5))");
    fireEvent.mouseLeave(group);
    fireEvent.click(group);
    expect(group.getAttribute("style")).toContain("drop-shadow(0 0 4.5px rgba(245,158,11,0.95))");
  });

  it("selecting a second structure replaces the panel content (no stale info)", () => {
    const { container } = render(<DiagramGame diagram={leaf} />);
    const first = leaf.structures.find(s => s.id === "epidermis");
    const second = leaf.structures.find(s => s.id === "vascularBundle");

    fireEvent.click(container.querySelector("#epidermis"));
    expect(screen.getByText(first.name)).toBeInTheDocument();

    fireEvent.click(container.querySelector("#vascularBundle"));
    expect(screen.getByText(second.name)).toBeInTheDocument();
    expect(screen.queryByText(first.shortDescription)).not.toBeInTheDocument();
  });

  it("tap (click event, mobile-equivalent) selects a structure just like desktop click", () => {
    const { container } = render(<DiagramGame diagram={leaf} />);
    const target = leaf.structures.find(s => s.id === "guardCell");
    // jsdom/RTL have no real touch simulation; onClick is what actually
    // fires for both mouse clicks and tap gestures in this codebase (no
    // separate touch handler exists), so this is the correct mobile
    // equivalence check — not a claim of real device touch testing.
    fireEvent.click(container.querySelector("#guardCell"));
    expect(screen.getByText(target.name)).toBeInTheDocument();
    expect(screen.getByText(target.explanation)).toBeInTheDocument();
  });

  it("Clear selection returns Explore to its empty state", () => {
    const { container } = render(<DiagramGame diagram={leaf} />);
    fireEvent.click(container.querySelector("#spongyLayer"));
    fireEvent.click(screen.getByText("Clear selection"));
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
  });

  it("leaving Explore and returning preserves valid selection state (no invalid/stale data)", () => {
    const { container } = render(<DiagramGame diagram={leaf} />);
    fireEvent.click(container.querySelector("#palisadeLayer"));
    expect(screen.getByText("Palisade Layer")).toBeInTheDocument();

    // selectedStructureId is intentionally lifted to DiagramGame and persists
    // across mode tabs (same generic behavior for every diagram) — so
    // returning to Explore correctly re-shows the same valid structure,
    // not stale/invalid state.
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    fireEvent.click(screen.getByRole("button", { name: "🔍 Explore" }));
    expect(screen.getByText("Palisade Layer")).toBeInTheDocument();
    expect(screen.getByText(leaf.structures.find(s => s.id === "palisadeLayer").explanation)).toBeInTheDocument();
  });

  it("does not display Animal Cell or Human Heart data", () => {
    render(<DiagramGame diagram={leaf} />);
    expect(screen.queryByText("Nucleus")).not.toBeInTheDocument();
    expect(screen.queryByText("Left Ventricle")).not.toBeInTheDocument();
    expect(screen.queryByText("Aorta")).not.toBeInTheDocument();
  });
});

describe("STEP 18B — Leaf Cross Section Explore responsive layout", () => {
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
      const { container, unmount } = render(<DiagramGame diagram={leaf} />);
      expect(container.querySelector("svg")).toBeTruthy();
      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");

      fireEvent.click(container.querySelector("#stoma"));
      expect(screen.getByText("Stoma")).toBeInTheDocument();

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

describe("STEP 18B — source-level reusability check", () => {
  it("ExploreMode contains no dg3/Leaf-Cross-Section-specific or dg1/dg2-specific conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function ExploreMode(");
    const end = source.indexOf("function LabelMode(", start);
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);
    ["Epidermis", "Palisade Layer", "Spongy Layer", "Vascular Bundle", "Guard Cell", "Stoma"]
      .forEach(n => expect(body.includes(n)).toBe(false));
    expect(body.includes('diagram.id === "dg3"')).toBe(false);
    expect(body.includes('diagram.id === "dg1"')).toBe(false);
    expect(body.includes('diagram.id === "dg2"')).toBe(false);
    expect((source.match(/function ExploreMode\(/g) || []).length).toBe(1);
    expect(source.includes("function LeafCrossSectionExploreMode")).toBe(false);
  });

  it("LeafCrossSectionSVG contains no game/mode-specific logic", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function LeafCrossSectionSVG(");
    const nextFnStart = source.indexOf("\nfunction ", start + 1);
    const body = source.slice(start, nextFnStart);
    ["score", "xpReward", "acceptableAnswers", "questionIndex", "choiceIds"]
      .forEach(term => expect(body.includes(term)).toBe(false));
  });
});

describe("STEP 18B — regression", () => {
  it("Animal Cell Explore Mode still works unmodified", () => {
    const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(container.querySelector("#nucleus"));
    expect(screen.getByText("Nucleus")).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("Human Heart Explore Mode still works unmodified", () => {
    const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
    const { container } = render(<DiagramGame diagram={heart} />);
    fireEvent.click(container.querySelector("#aorta"));
    expect(screen.getByText("Aorta")).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
