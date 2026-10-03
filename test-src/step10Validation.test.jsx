import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

const MODE_BUTTON = {
  explore: "🔍 Explore",
  label: "🏷 Label the Diagram",
  mismatch: "🔀 Find Mismatched Labels",
  identify: "❓ Identify the Structure",
  exam: "📝 Exam Challenge",
  points: "⭐ Important Points",
};
const ALL_MODES = Object.keys(MODE_BUTTON);

function goTo(mode) {
  fireEvent.click(screen.getByRole("button", { name: MODE_BUTTON[mode] }));
}

describe("STEP 10 — Diagram Center entry / navigation", () => {
  it("Diagram Center loads and lists Animal Cell with correct metadata", () => {
    render(<DiagramCenter />);
    expect(screen.getByText("🖼 Diagram Learning Center")).toBeInTheDocument();
    const title = screen.getByText("Animal Cell Structure");
    // Other diagrams also default to xpReward 50 and may share "7 labels",
    // so scope the metadata checks to Animal Cell's own card specifically.
    const card = title.closest("div").parentElement;
    expect(within(card).getByText("Cell · 7 labels")).toBeInTheDocument();
    expect(within(card).getByText("+50 XP")).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("opening Animal Cell from the picker renders the full game with all 6 modes", () => {
    const { container } = render(<DiagramCenter />);
    fireEvent.click(screen.getByText("Animal Cell Structure"));
    // The detail-page header prefixes the title with an emoji ("🖼 Animal
    // Cell Structure"), so it's no longer an exact match for the picker
    // card's plain title text — check via partial match instead.
    expect(screen.getByText(/Animal Cell Structure/)).toBeInTheDocument();
    ALL_MODES.forEach(mode => {
      expect(screen.getByRole("button", { name: MODE_BUTTON[mode] })).toBeInTheDocument();
    });
    expect(container.querySelector("svg")).toBeTruthy();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("Back navigation returns to the diagram list, and reopening Animal Cell gives a clean, fresh UI", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("Animal Cell Structure"));
    goTo("label");
    const dt = { store: {}, setData(k, v) { this.store[k] = v; }, getData(k) { return this.store[k] || ""; } };
    fireEvent.dragStart(screen.getByText("Nucleus"), { dataTransfer: dt });
    fireEvent.click(screen.getByText("← Back"));
    expect(screen.getByText("🖼 Diagram Learning Center")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Animal Cell Structure"));
    // Re-opening mounts a brand-new DiagramGame instance — Explore is the
    // default mode again and Label's earlier in-progress drag has no
    // bearing (state is intentionally local/non-persistent).
    expect(screen.getByRole("button", { name: "🔍 Explore" })).toBeInTheDocument();
    goTo("label");
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
  });
});

describe("STEP 10 — all 6 modes load without crashing", () => {
  it("every mode renders and keeps the SVG + all 7 structures visible", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    ALL_MODES.forEach(mode => {
      goTo(mode);
      expect(container.querySelector("svg")).toBeTruthy();
      animalCell.structures.forEach(s => {
        expect(container.querySelector(`#${s.id}`)).toBeTruthy();
      });
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

describe("STEP 10 — extended mode-switching / state isolation (6 modes)", () => {
  it("Explore → Label → Mismatch → Identify → Exam → Points → Explore: no crash, no bleed", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);

    goTo("explore");
    fireEvent.click(container.querySelector("#mitochondria"));
    expect(screen.getByText("Mitochondria")).toBeInTheDocument();

    goTo("label");
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();

    goTo("mismatch");
    expect(screen.getByText("0 / 7 Labels Checked")).toBeInTheDocument();

    goTo("identify");
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();

    goTo("exam");
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
    expect(screen.getByLabelText("Type the structure name")).toBeInTheDocument();

    goTo("points");
    expect(screen.getByRole("heading", { name: "⭐ Important Points" })).toBeInTheDocument();

    goTo("explore");
    expect(screen.queryByText(/Hover or tap a structure/i) || screen.queryByText("Mitochondria")).toBeTruthy();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("Label → Explore → Label: Label always starts fresh on re-entry", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    goTo("label");
    const dt = { store: {}, setData(k, v) { this.store[k] = v; }, getData(k) { return this.store[k] || ""; } };
    fireEvent.dragStart(screen.getByText("Nucleus"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#nucleus"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#nucleus"), { dataTransfer: dt });
    expect(screen.getByText("1 / 7 Labels")).toBeInTheDocument();

    goTo("explore");
    goTo("label");
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
  });

  it("Mismatch → Identify → Mismatch: Mismatch's solved count does not leak into/out of Identify", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    goTo("mismatch");
    const chip = container.querySelector(`button[aria-label='Check label "Nucleus"']`);
    fireEvent.click(chip);
    fireEvent.click(screen.getByText("✓ Correct"));
    if (!screen.queryByText(/that label was right/i)) fireEvent.click(screen.getByText("✗ Mismatched"));
    expect(screen.getByText("1 / 7 Labels Checked")).toBeInTheDocument();

    goTo("identify");
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();

    goTo("mismatch");
    // Re-entering Mismatch is a fresh instance too (consistent with every
    // other mode's remount-on-reselect behavior already validated).
    expect(screen.getByText("0 / 7 Labels Checked")).toBeInTheDocument();
  });

  it("Identify → Exam → Identify: scores never cross-contaminate between the two quiz modes", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    goTo("identify");
    const idOptions = Array.from(container.querySelectorAll("button")).filter(b =>
      animalCell.structures.some(s => b.textContent.trim() === s.name)
    );
    fireEvent.click(idOptions[0]);
    // Identify score is now 0 or 1 depending on the random draw — either way, it must not appear in Exam.

    goTo("exam");
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
    const input = screen.getByLabelText("Type the structure name");
    const targetGroup = Array.from(container.querySelectorAll("svg g")).find(
      g => g.getAttribute("style")?.includes("drop-shadow(0 0 4.5px rgba(245,158,11")
    );
    const target = animalCell.structures.find(s => s.id === targetGroup.id);
    fireEvent.change(input, { target: { value: target.quiz.acceptableAnswers[0] } });
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText(/Question 1 \/ 7 · Score: 1 \/ 7/)).toBeInTheDocument();

    goTo("identify");
    // Exam's just-earned 1/7 must not appear here — Identify is a fresh instance.
    expect(screen.getByText(/Question 1 \/ 7 · Score: 0 \/ 7/)).toBeInTheDocument();
  });
});

describe("STEP 10 — responsive across all 6 modes", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "laptop/tablet", width: 1024, expectGrid: true },
    { label: "mobile", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): Label/Mismatch/Identify/Exam have no horizontal overflow`, () => {
      setWidth(width);
      const { container, unmount } = render(<DiagramGame diagram={animalCell} />);
      ["label", "mismatch", "identify", "exam"].forEach(mode => {
        goTo(mode);
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
      });
      unmount();
      setWidth(1280);
    });
  });

  it("Important Points remains readable at mobile width", () => {
    setWidth(390);
    render(<DiagramGame diagram={animalCell} />);
    goTo("points");
    expect(screen.getByRole("heading", { name: "⭐ Important Points" })).toBeInTheDocument();
    animalCell.importantPoints.forEach(p => expect(screen.getByText(p)).toBeInTheDocument());
    setWidth(1280);
  });
});

describe("STEP 10 — Animal Cell data check", () => {
  it("has exactly 7 structures and xpReward 50, each with id/name/position/labelPosition/quiz", () => {
    expect(animalCell.structures).toHaveLength(7);
    expect(animalCell.xpReward).toBe(50);
    animalCell.structures.forEach(s => {
      expect(typeof s.id).toBe("string");
      expect(typeof s.name).toBe("string");
      expect(s.position).toBeTruthy();
      expect(s.labelPosition).toBeTruthy();
      expect(Array.isArray(s.quiz?.acceptableAnswers)).toBe(true);
      expect(s.quiz.acceptableAnswers.length).toBeGreaterThan(0);
    });
  });

  it("dg5, dg6 are now normalized too (upgraded outside this step's scope)", () => {
    // dg2 was upgraded in Step 11, dg3 in Step 18A, dg4 in Step 18H, and
    // dg5/dg6 in the DG5+DG6 SVG Integration step — each is covered by its
    // own dedicated test suite now, not here.
    ["dg5", "dg6"].forEach(id => {
      const raw = DIAGRAM_DATA.find(d => d.id === id);
      expect(raw).toBeTruthy();
      expect(Array.isArray(raw.structures)).toBe(true);
      expect(normalizeDiagram(raw)).toBe(raw);
    });
  });
});

describe("STEP 10 — source-level reusability check", () => {
  it("no hardcoded Animal Cell rules in any of the 5 reusable game components", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const forbiddenNames = ["Nucleus", "Mitochondria", "Golgi", "Ribosome", "Vacuole", "Cell Membrane", "Endoplasmic Reticulum"];
    const components = ["ExploreMode", "LabelMode", "MismatchMode", "IdentifyMode", "ExamMode"];
    const boundaries = [...components, "DiagramGame"];
    components.forEach((name, i) => {
      const start = source.indexOf(`function ${name}(`);
      expect(start).toBeGreaterThan(-1);
      // Find the next boundary function that appears after this one.
      const rest = boundaries.slice(i + 1).map(b => source.indexOf(`function ${b}(`, start)).filter(idx => idx > start);
      const end = Math.min(...rest);
      const body = source.slice(start, end);
      forbiddenNames.forEach(n => expect(body.includes(n)).toBe(false));
      expect(body.includes('diagram.id === "dg1"')).toBe(false);
    });
  });
});
