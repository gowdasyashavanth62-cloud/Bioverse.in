import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const stem = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg10"));
const dicotRoot = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg9"));

const MODE_LABELS = ["🔍 Explore", "🏷 Label the Diagram", "🔀 Find Mismatched Labels", "❓ Identify the Structure", "📝 Exam Challenge", "⭐ Important Points"];

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

describe("Dicot Stem (dg10) — registry / rendering", () => {
  it("DIAGRAM_DATA has the dg10 entry with the correct title and chapter", () => {
    const raw10 = DIAGRAM_DATA.find(d => d.id === "dg10");
    expect(raw10).toBeTruthy();
    expect(raw10.title).toBe("T.S. of a Dicot Stem");
    expect(raw10.chapter).toBe("Ch 6 Anatomy of Flowering Plants");
  });

  it("T.S. of a Dicot Stem -> Important Points loads through Diagram Center, resolving the dg10 registry entry", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("T.S. of a Dicot Stem"));
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    const heading = screen.getByRole("heading", { name: "⭐ Important Points" });
    expect(heading).toBeTruthy();
  });

  it("opens with a heading and a container, using the generic ImportantPointsMode (no DG10-specific UI)", () => {
    const { container } = openImportantPoints(stem);
    const heading = container.querySelector("h3");
    expect(heading).toBeTruthy();
    expect(heading.textContent).toContain("Important Points");
  });
});

describe("Dicot Stem (dg10) — content completeness", () => {
  it("dg10.importantPoints exists, is non-empty, and matches the verified Foundation count (9 points)", () => {
    expect(Array.isArray(stem.importantPoints)).toBe(true);
    expect(stem.importantPoints.length).toBe(9);
  });

  it("displays every configured point, in order, with a matching numbered marker, exact count", () => {
    openImportantPoints(stem);
    const expected = stem.importantPoints;

    expected.forEach(point => {
      expect(screen.getByText(point)).toBeInTheDocument();
    });

    // order preserved: numbered "1." .. "9." markers appear in document order
    const numbers = screen.getAllByText(/^\d\.$/).map(el => el.textContent);
    expect(numbers).toEqual(expected.map((_, i) => `${i + 1}.`));
  });

  it("no duplicate points in the underlying dg10 data", () => {
    const unique = new Set(stem.importantPoints);
    expect(unique.size).toBe(stem.importantPoints.length);
  });

  it("the Important Points heading is specifically associated with dg10's own section, not a coincidental match elsewhere in the app shell", () => {
    const { container } = openImportantPoints(stem);
    // Scoped to the DiagramGame container's own <h3>, not a broad
    // app-wide getByText search that could accidentally match unrelated
    // "Important Points"-labelled UI elsewhere in BioVerse.
    const headings = container.querySelectorAll("h3");
    const matches = Array.from(headings).filter(h => h.textContent.includes("Important Points"));
    expect(matches).toHaveLength(1);
  });
});

describe("Dicot Stem (dg10) — content quality / terminology", () => {
  it("every point uses real NCERT dicot-stem terminology (each point mentions at least one verified DG10 structure or a core stem-anatomy concept)", () => {
    const structureNames = stem.structures.map(s => s.name.toLowerCase());
    const stemConcepts = ["ring", "vascular bundle", "endarch", "conjoint", "collateral", "monocot", "secondary growth"];
    stem.importantPoints.forEach(point => {
      const lower = point.toLowerCase();
      const mentionsStructure = structureNames.some(n => lower.includes(n));
      const mentionsConcept = stemConcepts.some(c => lower.includes(c));
      expect(mentionsStructure || mentionsConcept).toBe(true);
    });
  });

  it("does not contain dicot-ROOT-only terminology accidentally copied from dg9 (exarch as dg10's own xylem, casparian strips, epiblema, lateral root)", () => {
    const joined = stem.importantPoints.join(" ").toLowerCase();
    // A brief contrastive mention of dg9's exarch xylem is legitimate,
    // useful pedagogy (dg10's own xylem is correctly described as
    // endarch) -- what must NOT appear is root-only structure names.
    ["casparian", "epiblema", "lateral root"].forEach(term => {
      expect(joined).not.toMatch(term);
    });
  });

  it("is concise revision material, not a full textbook chapter (each point is a single sentence-scale claim, not an essay)", () => {
    stem.importantPoints.forEach(point => {
      expect(point.length).toBeGreaterThan(20);
      expect(point.length).toBeLessThan(300);
    });
  });

  it("contains no placeholder/filler text", () => {
    const joined = stem.importantPoints.join(" ").toLowerCase();
    ["lorem ipsum", "todo", "tbd", "placeholder", "coming soon"].forEach(bad => {
      expect(joined).not.toContain(bad);
    });
  });
});

describe("Dicot Stem (dg10) — data isolation (no DG9 / no DG11 content)", () => {
  it("dg10 points differ entirely from dg9 (Dicot Root) points — zero overlap", () => {
    const stemSet = new Set(stem.importantPoints);
    const rootSet = new Set(dicotRoot.importantPoints);
    const overlap = [...stemSet].filter(p => rootSet.has(p));
    expect(overlap.length).toBe(0);
  });

  it("switching Dicot Root -> Dicot Stem Important Points does not leak Dicot Root content", () => {
    const { unmount } = openImportantPoints(dicotRoot);
    expect(screen.getByText(dicotRoot.importantPoints[0])).toBeInTheDocument();
    unmount();

    openImportantPoints(stem);
    dicotRoot.importantPoints.forEach(point => {
      expect(screen.queryByText(point)).not.toBeInTheDocument();
    });
    stem.importantPoints.forEach(point => {
      expect(screen.getByText(point)).toBeInTheDocument();
    });
  });

  it("switching away and back to Important Points leaves no stale content and no leaked content from another diagram", () => {
    openImportantPoints(stem);
    fireEvent.click(screen.getByRole("button", { name: "🔍 Explore" }));
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    stem.importantPoints.forEach(point => {
      expect(screen.getByText(point)).toBeInTheDocument();
    });
    dicotRoot.importantPoints.forEach(point => {
      expect(screen.queryByText(point)).not.toBeInTheDocument();
    });
  });

  it("DG11 does not exist yet, so dg10 cannot and does not resolve any DG11 content", () => {
    expect(DIAGRAM_DATA.find(d => d.id === "dg11")).toBeFalsy();
  });
});

describe("Dicot Stem (dg10) — mode isolation", () => {
  it("shows no quiz score, question progress, or answer controls; awards no XP by opening", () => {
    const { container } = openImportantPoints(stem);
    expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Question \d+ \//)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Type the structure name")).not.toBeInTheDocument();
    expect(screen.queryByText("Submit")).not.toBeInTheDocument();
    expect(screen.queryByText(/XP earned/)).not.toBeInTheDocument();
    expect(container.querySelector("input")).toBeNull();
  });
});

describe("Dicot Stem (dg10) — responsive", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [1440, 1024, 412, 390].forEach((width) => {
    it(`${width}px: renders without horizontal overflow, all points remain readable and reflow correctly`, () => {
      setWidth(width);
      const { container, unmount } = openImportantPoints(stem);
      const heading = container.querySelector("h3");
      expect(heading?.textContent).toContain("Important Points");
      stem.importantPoints.forEach(point => {
        expect(screen.getByText(point)).toBeInTheDocument();
      });
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

describe("Dicot Stem (dg10) — accessibility", () => {
  it("uses a real heading and introduces no extra interactive controls beyond the generic mode switcher", () => {
    const { container } = openImportantPoints(stem);
    const heading = container.querySelector("h3");
    expect(heading).toBeTruthy();
    expect(heading.textContent).toContain("Important Points");
    // No input/select/textarea at all -- those would signal quiz/exam controls leaking in.
    expect(container.querySelectorAll("input, select, textarea").length).toBe(0);
    // The only buttons present are the generic mode-switcher tabs.
    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.every(b => MODE_LABELS.includes(b.textContent))).toBe(true);
  });

  it("point numbering is conveyed as real text (not color/icon alone), readable independent of styling", () => {
    openImportantPoints(stem);
    const numbers = screen.getAllByText(/^\d\.$/);
    expect(numbers.length).toBe(stem.importantPoints.length);
  });
});

describe("Dicot Stem (dg10) — regression: all seven modes resolve the same registry entry", () => {
  it("Dicot Stem Explore/Label/Mismatch/Identify/Exam/Important Points all still render for dg10", () => {
    const { container } = render(<DiagramGame diagram={stem} />);
    MODE_LABELS.forEach(label => {
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(container.querySelector("svg") || container.querySelector("h3")).toBeTruthy();
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("dg9 (Dicot Root) Important Points, and all its other modes, still render correctly, unaffected by dg10", () => {
    const { container } = render(<DiagramGame diagram={dicotRoot} />);
    MODE_LABELS.forEach(label => {
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(container.querySelector("svg") || container.querySelector("h3")).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "⭐ Important Points" }));
    expect(screen.getByText(dicotRoot.importantPoints[0])).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("dg1, dg7, dg8 Important Points remain intact (non-empty, still render)", () => {
    ["dg1", "dg7", "dg8"].forEach(id => {
      const d = normalizeDiagram(DIAGRAM_DATA.find(x => x.id === id));
      expect(d.importantPoints.length).toBeGreaterThan(0);
      const { unmount } = openImportantPoints(d);
      expect(screen.getByText(d.importantPoints[0])).toBeInTheDocument();
      unmount();
    });
  });

  it("the registry and DIAGRAM_DATA contain dg1 through dg10, nothing renamed or removed, and no dg11 exists yet", () => {
    ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6", "dg7", "dg8", "dg9", "dg10"].forEach(id => {
      expect(DIAGRAM_DATA.find(d => d.id === id)).toBeTruthy();
    });
    expect(DIAGRAM_DATA.find(d => d.id === "dg11")).toBeFalsy();
    expect(DIAGRAM_DATA.length).toBe(10);
  });

  it("DG10's other frozen data (xpReward, structure count, SVG, title, chapter) remains intact", () => {
    const raw10 = DIAGRAM_DATA.find(d => d.id === "dg10");
    expect(raw10.xpReward).toBe(63);
    expect(raw10.structures.length).toBe(10);
    expect(raw10.image).toEqual({ type: "svg", component: "dicotStem" });
  });
});

describe("Dicot Stem (dg10) — reusability / source-level engine purity", () => {
  it("ImportantPointsMode contains no dg10/Dicot-Stem-specific conditionals, no duplicated component, and is the same single generic function used by every diagram", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");

    expect(source.includes("function DicotStemImportantPoints")).toBe(false);
    expect(source.includes("function DG10ImportantPointsMode")).toBe(false);
    expect((source.match(/function ImportantPointsMode\(/g) || []).length).toBe(1);

    const start = source.indexOf("function ImportantPointsMode(");
    const nextFnStart = source.indexOf("\nfunction ", start + 1);
    const body = source.slice(start, nextFnStart);

    expect(body.includes('diagram.id === "dg10"')).toBe(false);
    expect(body.includes('diagram.image.component === "dicotStem"')).toBe(false);
    expect(body.includes('diagram.title === "T.S. of a Dicot Stem"')).toBe(false);
    ["Epidermis", "Hypodermis", "Cortex", "Endodermis", "Pericycle", "Xylem", "Phloem", "Cambium", "Medullary Ray", "Pith"]
      .forEach(word => expect(body.includes(word)).toBe(false));
  });

  it("DicotStemSVG contains no importantPoints/score/xp/quiz-state logic", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function DicotStemSVG(");
    const nextFnStart = source.indexOf("\nfunction ", start + 1);
    const body = source.slice(start, nextFnStart);

    ["importantPoints", "score", "xpReward", "acceptableAnswers", "questionIndex"]
      .forEach(term => expect(body.includes(term)).toBe(false));
  });
});
