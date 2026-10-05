import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram, DIAGRAM_SVG_COMPONENTS } from "./AppUnderTest.jsx";

const root = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg11"));
const ROOT_IDS = root.structures.map(s => s.id);

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

describe("Monocot Root (dg11) -- Explore Mode discovery", () => {
  it("Diagram Center can locate and load T.S. of a Monocot Root, opening on Explore by default", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("T.S. of a Monocot Root"));
    expect(screen.getByRole("button", { name: /Explore/ })).toBeInTheDocument();
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
  });

  it("uses MonocotRootSVG (not any other diagram's renderer) through the registry and has exactly 9 structures", () => {
    expect(root.structures.length).toBe(9);
    expect(root.image).toEqual({ type: "svg", component: "monocotRoot" });
    expect(DIAGRAM_SVG_COMPONENTS.monocotRoot).toBeTruthy();
    const { container } = render(<DiagramGame diagram={root} />);
    const svg = container.querySelector("svg");
    expect(svg.getAttribute("aria-label")).toMatch(/monocot root/i);
  });

  it("all 9 structures render as selectable SVG groups with the exact expected ids, no duplicates, no missing renderer", () => {
    expect(new Set(ROOT_IDS).size).toBe(9);
    const { container } = render(<DiagramGame diagram={root} />);
    ROOT_IDS.forEach(id => {
      const matches = container.querySelectorAll(`#${id}`);
      expect(matches.length).toBe(1);
      expect(matches[0].tagName.toLowerCase()).toBe("g");
    });
  });
});

describe("Monocot Root (dg11) -- Explore Mode behavior (all 9 structures individually reachable)", () => {
  it("every one of the 9 structures can be tapped/clicked, highlights correctly, and shows its own name/description/explanation", () => {
    ROOT_IDS.forEach(id => {
      const { container, unmount } = render(<DiagramGame diagram={root} />);
      const target = root.structures.find(s => s.id === id);
      const group = container.querySelector(`#${id}`);
      expect(group).toBeTruthy();

      // no prior selection before interaction
      expect(screen.queryByText("Selected")).not.toBeInTheDocument();

      fireEvent.click(group);

      expect(group.getAttribute("style")).toContain("drop-shadow(0 0 4.5px rgba(245,158,11,0.95))");
      expect(screen.getByText("Selected")).toBeInTheDocument();
      expect(screen.getByText(target.name)).toBeInTheDocument();
      expect(screen.getByText(target.shortDescription)).toBeInTheDocument();
      expect(screen.getByText(target.explanation)).toBeInTheDocument();
      unmount();
    });
  });

  it("cross-structure selection never shows the wrong structure's info (epidermis, metaxylem, phloem, pith, rootHair spot-checked)", () => {
    const { container } = render(<DiagramGame diagram={root} />);
    const checks = ["epidermis", "metaxylem", "phloem", "pith", "rootHair"];
    checks.forEach(id => {
      const target = root.structures.find(s => s.id === id);
      const others = checks.filter(o => o !== id).map(o => root.structures.find(s => s.id === o));

      fireEvent.click(container.querySelector(`#${id}`));

      expect(screen.getByText(target.name)).toBeInTheDocument();
      expect(screen.getByText(target.explanation)).toBeInTheDocument();
      others.forEach(o => {
        expect(screen.queryByText(o.name)).not.toBeInTheDocument();
        expect(screen.queryByText(o.explanation)).not.toBeInTheDocument();
      });
    });
  });

  it("selecting a second structure fully replaces the panel content -- no stale info from the previous selection", () => {
    const { container } = render(<DiagramGame diagram={root} />);
    const first = root.structures.find(s => s.id === "cortex");
    const second = root.structures.find(s => s.id === "protoxylem");

    fireEvent.click(container.querySelector("#cortex"));
    expect(screen.getByText(first.name)).toBeInTheDocument();

    fireEvent.click(container.querySelector("#protoxylem"));
    expect(screen.getByText(second.name)).toBeInTheDocument();
    expect(screen.queryByText(first.shortDescription)).not.toBeInTheDocument();
    expect(screen.queryByText(first.explanation)).not.toBeInTheDocument();
  });

  it("hover gives a subtle (non-selected) visual state distinct from click-selection", () => {
    const { container } = render(<DiagramGame diagram={root} />);
    const group = container.querySelector("#endodermis");
    fireEvent.mouseEnter(group);
    expect(group.getAttribute("style")).toContain("drop-shadow(0 0 2.5px rgba(245,158,11,0.5))");
    fireEvent.mouseLeave(group);
    fireEvent.click(group);
    expect(group.getAttribute("style")).toContain("drop-shadow(0 0 4.5px rgba(245,158,11,0.95))");
  });

  it("Clear selection returns Explore to its empty state (deselect/reset)", () => {
    const { container } = render(<DiagramGame diagram={root} />);
    fireEvent.click(container.querySelector("#pericycle"));
    expect(screen.getByText("Selected")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear selection"));
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
    expect(screen.queryByText("Selected")).not.toBeInTheDocument();
  });

  it("tap (click event, no hover requirement) selects a structure just like desktop click", () => {
    const { container } = render(<DiagramGame diagram={root} />);
    const target = root.structures.find(s => s.id === "rootHair");
    // jsdom/RTL have no real touch simulation; onClick fires for both mouse
    // clicks and tap gestures in this codebase (no separate touch handler
    // exists), matching the convention already used by dg7/dg8's Explore tests.
    fireEvent.click(container.querySelector("#rootHair"));
    expect(screen.getByText(target.name)).toBeInTheDocument();
    expect(screen.getByText(target.explanation)).toBeInTheDocument();
  });
});

describe("Monocot Root (dg11) -- Important Points remain accessible from Explore", () => {
  it("switching to Important Points shows exactly dg11's own points, none from another diagram", () => {
    render(<DiagramGame diagram={root} />);
    fireEvent.click(screen.getByRole("button", { name: /Important Points/ }));
    expect(screen.getByRole("heading", { name: "⭐ Important Points" })).toBeInTheDocument();
    expect(root.importantPoints.length).toBeGreaterThanOrEqual(7);
    expect(root.importantPoints.length).toBeLessThanOrEqual(9);
    root.importantPoints.forEach(point => {
      expect(screen.getByText(point)).toBeInTheDocument();
    });
    const otherDiagram = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg8"));
    otherDiagram.importantPoints.forEach(point => {
      expect(screen.queryByText(point)).not.toBeInTheDocument();
    });
  });

  it("switching modes away from and back to Explore preserves the prior selection via the generic (not dg11-specific) DiagramGame behavior", () => {
    render(<DiagramGame diagram={root} />);
    const svgBefore = document.querySelector("svg");
    fireEvent.click(svgBefore.querySelector("#metaxylem"));
    expect(screen.getByText("Metaxylem")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Important Points/ }));
    expect(screen.queryByText(root.structures.find(s => s.id === "metaxylem").explanation)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Explore/ }));
    expect(screen.getByText("Metaxylem")).toBeInTheDocument();
  });
});

describe("Monocot Root (dg11) -- XP safety in Explore Mode", () => {
  it("exploring never shows a completion XP line, and dg11.xpReward (65) is untouched by Explore interaction", () => {
    const raw9 = DIAGRAM_DATA.find(d => d.id === "dg11");
    expect(raw9.xpReward).toBe(65);
    const { container } = render(<DiagramGame diagram={root} />);
    ROOT_IDS.forEach(id => fireEvent.click(container.querySelector(`#${id}`)));
    fireEvent.click(screen.getByText("Clear selection"));
    // Precise: a bare /XP/i would also match "Explore" (contains the
    // substring "xp") -- check for an actual XP amount/completion line
    // instead, which Explore Mode must never render.
    expect(screen.queryByText(/\d+\s*xp\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/XP earned:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/65\s*XP/i)).not.toBeInTheDocument();
    expect(raw9.xpReward).toBe(65); // still unchanged after interaction
  });
});

describe("Monocot Root (dg11) -- Explore accessibility", () => {
  it("every structure group is an interactive, accessible click target with an id matching its structure id", () => {
    const { container } = render(<DiagramGame diagram={root} />);
    ROOT_IDS.forEach(id => {
      const group = container.querySelector(`#${id}`);
      expect(group.getAttribute("style")).toContain("cursor: pointer");
      expect(group.id).toBe(id);
    });
    const svg = container.querySelector("svg");
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toBeTruthy();
  });

  it("the Clear selection control is a real, labeled, keyboard-reachable button", () => {
    const { container } = render(<DiagramGame diagram={root} />);
    fireEvent.click(container.querySelector("#phloem"));
    const clearBtn = screen.getByText("Clear selection");
    expect(clearBtn.tagName.toLowerCase()).toBe("button");
  });

  it("selected state is represented in the info panel via a visible 'Selected' badge, not color alone, and info is available without hover", () => {
    const { container } = render(<DiagramGame diagram={root} />);
    expect(screen.queryByText("Selected")).not.toBeInTheDocument();
    fireEvent.click(container.querySelector("#pith"));
    expect(screen.getByText("Selected")).toBeInTheDocument();
    const target = root.structures.find(s => s.id === "pith");
    expect(screen.getByText(target.explanation)).toBeInTheDocument();
  });
});

describe("Monocot Root (dg11) -- responsive layout", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "narrow-desktop", width: 1024, expectGrid: true },
    { label: "mobile", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): Explore layout has no horizontal overflow, SVG + panel stay usable, selection stays visible`, () => {
      setWidth(width);
      const { container, unmount } = render(<DiagramGame diagram={root} />);
      expect(container.querySelector("svg")).toBeTruthy();
      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");

      // Tap-only interaction (no mouseEnter/hover fired) works at this width.
      fireEvent.click(container.querySelector("#cortex"));
      expect(screen.getByText("Cortex")).toBeInTheDocument();
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

  it("all 9 structures remain individually selectable at mobile width (390px), not just a subset", () => {
    setWidth(390);
    ROOT_IDS.forEach(id => {
      const { container, unmount } = render(<DiagramGame diagram={root} />);
      const target = root.structures.find(s => s.id === id);
      fireEvent.click(container.querySelector(`#${id}`));
      expect(screen.getByText(target.name)).toBeInTheDocument();
      unmount();
    });
    setWidth(1280);
  });
});

describe("Monocot Root (dg11) -- isolation", () => {
  it("Explore selection state does not leak into a freshly mounted instance of a different diagram", () => {
    const { container: c1, unmount: unmount1 } = render(<DiagramGame diagram={root} />);
    fireEvent.click(c1.querySelector("#endodermis"));
    expect(screen.getByText("Endodermis")).toBeInTheDocument();
    unmount1();

    const plantCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg8"));
    render(<DiagramGame diagram={plantCell} />);
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
    expect(screen.queryByText("Endodermis")).not.toBeInTheDocument();
    expect(screen.queryByText("Selected")).not.toBeInTheDocument();
  });
});

describe("Monocot Root (dg11) -- dg1-dg8 regression (Explore Mode still loads for every prior diagram)", () => {
  it("dg1-dg8 all still load into Explore Mode with an intact SVG and their own structure counts", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6", "dg7", "dg8"].forEach(id => {
      const d = normalizeDiagram(DIAGRAM_DATA.find(x => x.id === id));
      expect(d.structures.length).toBeGreaterThan(0);
      const { container, unmount } = render(<DiagramGame diagram={d} />);
      expect(container.querySelector("svg")).toBeTruthy();
      expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
      unmount();
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("the registry and DIAGRAM_DATA contain dg1 through dg11, nothing renamed or removed", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6", "dg7", "dg8", "dg9", "dg10", "dg11"].forEach(id => {
      expect(DIAGRAM_DATA.find(d => d.id === id)).toBeTruthy();
    });
    expect(DIAGRAM_DATA.length).toBe(12);
  });
});
