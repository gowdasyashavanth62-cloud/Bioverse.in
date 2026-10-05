import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { DiagramCenter, DIAGRAM_DATA, DIAGRAM_SVG_COMPONENTS, normalizeDiagram } from "./AppUnderTest.jsx";

let consoleErrorSpy;
afterEach(() => {
  consoleErrorSpy && consoleErrorSpy.mockRestore();
  cleanup();
});

describe("Diagram Center thumbnails (DG1-DG9)", () => {
  it("every diagram declares an svg-type image backed by a real, distinct component", () => {
    const svgDiagrams = DIAGRAM_DATA.filter(d => d.image?.type === "svg");
    // All twelve curriculum diagrams use real SVG artwork, not emoji/placeholder images.
    expect(svgDiagrams.length).toBe(12);
    const componentRefs = svgDiagrams.map(d => DIAGRAM_SVG_COMPONENTS[d.image.component]);
    // Every referenced component must actually exist in the registry.
    componentRefs.forEach(c => expect(typeof c).toBe("function"));
    // No two diagrams share the same thumbnail component — each is unique.
    expect(new Set(componentRefs).size).toBe(componentRefs.length);
  });

  it("renders a distinct <svg> thumbnail per diagram card, with no generic placeholder icon", () => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container, getByText } = render(<DiagramCenter />);

    const svgDiagramCount = DIAGRAM_DATA.filter(d => normalizeDiagram(d).image?.type === "svg").length;

    // Grid must render one <svg> root per svg-type diagram card (the real
    // artwork), not a shared emoji glyph standing in for all of them.
    const svgEls = container.querySelectorAll("svg");
    expect(svgEls.length).toBeGreaterThanOrEqual(svgDiagramCount);

    // The old bug rendered "🖼" as each *card's* thumbnail for every diagram
    // whose image.type wasn't "emoji" — i.e. all 9 curriculum diagrams.
    // Scope the check to each diagram's own card (found via its title),
    // since the page header separately and legitimately uses the same
    // emoji as its own icon.
    const svgDiagrams = DIAGRAM_DATA.filter(d => normalizeDiagram(d).image?.type === "svg");
    svgDiagrams.forEach(d => {
      const titleEl = getByText(normalizeDiagram(d).title);
      const card = titleEl.closest("div[style*='cursor']") || titleEl.parentElement.parentElement;
      expect(card.textContent).not.toContain("🖼");
    });
  });

  it("DG1 (Animal Cell) and DG9 (Dicot Root) render different SVG artwork, not the same icon", () => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const dg1 = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
    const dg9 = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg9"));
    expect(dg1.image.component).not.toBe(dg9.image.component);
    expect(DIAGRAM_SVG_COMPONENTS[dg1.image.component]).not.toBe(DIAGRAM_SVG_COMPONENTS[dg9.image.component]);
  });
});
