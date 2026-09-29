import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DiagramCenter, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const heart = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg2"));
const HEART_NAMES = heart.structures.map(s => s.name);
const HEART_IDS = heart.structures.map(s => s.id);
const TOTAL = heart.structures.length;

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function openHeartLabelMode() {
  const utils = render(<DiagramGame diagram={heart} />);
  fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
  return utils;
}

function makeDataTransfer() {
  const store = {};
  return { setData: (k, v) => { store[k] = v; }, getData: (k) => store[k] || "" };
}

describe("STEP 13 — Human Heart Label Mode: data / rendering", () => {
  it("Human Heart opens from Diagram Center", () => {
    render(<DiagramCenter />);
    fireEvent.click(screen.getByText("Human Heart"));
    expect(screen.getByRole("button", { name: "🏷 Label the Diagram" })).toBeInTheDocument();
  });

  it("Label Mode opens and HumanHeartSVG renders", () => {
    const { container } = openHeartLabelMode();
    expect(container.querySelector("svg").getAttribute("aria-label")).toMatch(/heart/i);
  });

  it("exactly 7 label challenges exist, drawn from diagram.structures", () => {
    openHeartLabelMode();
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
    HEART_NAMES.forEach(name => expect(screen.getByText(name)).toBeInTheDocument());
  });
});

describe("STEP 13 — Human Heart Label Mode: correctness", () => {
  it("every Human Heart structure can be correctly matched (desktop drag-drop)", () => {
    HEART_IDS.forEach(id => {
      const { container, unmount } = openHeartLabelMode();
      const name = heart.structures.find(s => s.id === id).name;
      const dt = makeDataTransfer();
      fireEvent.dragStart(screen.getByText(name), { dataTransfer: dt });
      fireEvent.dragOver(container.querySelector(`#${id}`), { dataTransfer: dt });
      fireEvent.drop(container.querySelector(`#${id}`), { dataTransfer: dt });
      expect(screen.getByText("1 / 7 Labels")).toBeInTheDocument();
      unmount();
    });
  });

  it("correct match locks the structure and produces success feedback", () => {
    const { container } = openHeartLabelMode();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Aorta"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#aorta"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#aorta"), { dataTransfer: dt });
    expect(screen.getByText(/Aorta — correct!/)).toBeInTheDocument();
    expect(screen.queryByText("Aorta")).not.toBeInTheDocument(); // removed from bank once locked
  });

  it("incorrect match gives error feedback, does not lock, does not increment progress, and allows retry", () => {
    const { container } = openHeartLabelMode();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Left Ventricle"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#rightVentricle"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#rightVentricle"), { dataTransfer: dt });
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText("Left Ventricle")).toBeInTheDocument(); // still in bank

    // Retry with the correct structure.
    fireEvent.dragStart(screen.getByText("Left Ventricle"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#leftVentricle"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#leftVentricle"), { dataTransfer: dt });
    expect(screen.getByText("1 / 7 Labels")).toBeInTheDocument();
  });
});

describe("STEP 13 — Human Heart Label Mode: full completion / XP / Play Again", () => {
  it("completes all 7 structures, reaches 7/7, shows completion, correct score, XP capped at 60", () => {
    const { container } = openHeartLabelMode();
    const dt = makeDataTransfer();
    HEART_IDS.forEach(id => {
      const name = heart.structures.find(s => s.id === id).name;
      fireEvent.dragStart(screen.getByText(name), { dataTransfer: dt });
      fireEvent.dragOver(container.querySelector(`#${id}`), { dataTransfer: dt });
      fireEvent.drop(container.querySelector(`#${id}`), { dataTransfer: dt });
    });
    expect(screen.getByText("7 / 7 Labels")).toBeInTheDocument();
    expect(screen.getByText(/All labels placed/i)).toBeInTheDocument();
    expect(screen.getByText(/Score: 7\/7/)).toBeInTheDocument();
    const strong = container.querySelector("strong");
    const xp = Number(strong.textContent);
    expect(xp).toBe(60); // heart.xpReward, exact at 7/7
    expect(xp).toBeLessThanOrEqual(heart.xpReward);
  });

  it("Play Again resets progress/score/structures and generates a fresh session", () => {
    const { container } = openHeartLabelMode();
    const dt = makeDataTransfer();
    HEART_IDS.forEach(id => {
      const name = heart.structures.find(s => s.id === id).name;
      fireEvent.dragStart(screen.getByText(name), { dataTransfer: dt });
      fireEvent.dragOver(container.querySelector(`#${id}`), { dataTransfer: dt });
      fireEvent.drop(container.querySelector(`#${id}`), { dataTransfer: dt });
    });
    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
    HEART_NAMES.forEach(name => expect(screen.getByText(name)).toBeInTheDocument());
  });
});

describe("STEP 13 — Human Heart Label Mode: randomization", () => {
  it("multiple fresh sessions can produce different label bank orders", () => {
    const orders = [];
    for (let i = 0; i < 15; i++) {
      const { container, unmount } = openHeartLabelMode();
      const order = Array.from(container.querySelectorAll("[draggable='true']")).map(el => el.textContent);
      orders.push(order.join("|"));
      unmount();
    }
    expect(new Set(orders).size).toBeGreaterThan(1);
  });
});

describe("STEP 13 — Human Heart Label Mode: mobile/tap-equivalent interaction", () => {
  it("tap a label then tap the correct structure locks it (correct mobile matching)", () => {
    const { container } = openHeartLabelMode();
    fireEvent.click(screen.getByText("Right Atrium"));
    fireEvent.click(container.querySelector("#rightAtrium"));
    expect(screen.getByText("1 / 7 Labels")).toBeInTheDocument();
    expect(screen.queryByText("Right Atrium")).not.toBeInTheDocument();
  });

  it("tap a label then tap the wrong structure gives retry feedback (incorrect mobile matching)", () => {
    const { container } = openHeartLabelMode();
    fireEvent.click(screen.getByText("Pulmonary Artery"));
    fireEvent.click(container.querySelector("#aorta"));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText("Pulmonary Artery")).toBeInTheDocument();

    // Retry correctly.
    fireEvent.click(screen.getByText("Pulmonary Artery"));
    fireEvent.click(container.querySelector("#pulmonaryArtery"));
    expect(screen.getByText("1 / 7 Labels")).toBeInTheDocument();
  });
});

describe("STEP 13 — Human Heart Label Mode: responsive", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  [
    { label: "desktop", width: 1440, expectGrid: true },
    { label: "laptop/tablet", width: 1024, expectGrid: true },
    { label: "mobile", width: 390, expectGrid: false },
  ].forEach(({ label, width, expectGrid }) => {
    it(`${label} (${width}px): no horizontal overflow, SVG + label bank usable, tap works`, () => {
      setWidth(width);
      const { container, unmount } = openHeartLabelMode();
      const layoutEl = Array.from(container.querySelectorAll("div")).find(
        el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px")
      );
      expect(layoutEl).toBeTruthy();
      expect(layoutEl.style.display).toBe(expectGrid ? "grid" : "flex");

      // Touch-equivalent interaction must work at every width.
      fireEvent.click(screen.getByText("Vena Cava"));
      fireEvent.click(container.querySelector("#venaCava"));
      expect(screen.getByText("1 / 7 Labels")).toBeInTheDocument();

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

describe("STEP 13 — source-level reusability check", () => {
  it("LabelMode and HumanHeartSVG contain no dg2/heart-name-specific or dg1-specific conditionals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const heartNames = ["Left Ventricle", "Right Ventricle", "Left Atrium", "Right Atrium", "Aorta", "Pulmonary Artery", "Vena Cava"];

    const lmStart = source.indexOf("function LabelMode(");
    const lmEnd = source.indexOf("function DiagramGame(", lmStart) > lmStart
      ? source.indexOf("function DiagramGame(", lmStart)
      : source.indexOf("function MismatchMode(", lmStart);
    expect(lmStart).toBeGreaterThan(-1);
    const lmBody = source.slice(lmStart, lmEnd);
    heartNames.forEach(n => expect(lmBody.includes(n)).toBe(false));
    expect(lmBody.includes('diagram.id === "dg2"')).toBe(false);
    expect(lmBody.includes('diagram.id === "dg1"')).toBe(false);

    const svgStart = source.indexOf("function HumanHeartSVG(");
    const svgEnd = source.indexOf("const DIAGRAM_SVG_COMPONENTS", svgStart);
    expect(svgStart).toBeGreaterThan(-1);
    const svgBody = source.slice(svgStart, svgEnd);
    ["score", "xpReward", "acceptableAnswers", "placed", "bank"].forEach(term => {
      expect(svgBody.includes(term)).toBe(false);
    });
  });
});

describe("STEP 13 — regression", () => {
  const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));

  it("Animal Cell Label Mode still passes", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByRole("button", { name: "🏷 Label the Diagram" }));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
    const dt = makeDataTransfer();
    fireEvent.dragStart(screen.getByText("Nucleus"), { dataTransfer: dt });
    fireEvent.dragOver(container.querySelector("#nucleus"), { dataTransfer: dt });
    fireEvent.drop(container.querySelector("#nucleus"), { dataTransfer: dt });
    expect(screen.getByText("1 / 7 Labels")).toBeInTheDocument();
  });

  it("Animal Cell Explore Mode still passes", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(container.querySelector("#nucleus"));
    expect(screen.getByText("Nucleus")).toBeInTheDocument();
  });

  it("no console errors across a full Human Heart Label session", () => {
    const { container } = openHeartLabelMode();
    const dt = makeDataTransfer();
    HEART_IDS.forEach(id => {
      const name = heart.structures.find(s => s.id === id).name;
      fireEvent.dragStart(screen.getByText(name), { dataTransfer: dt });
      fireEvent.dragOver(container.querySelector(`#${id}`), { dataTransfer: dt });
      fireEvent.drop(container.querySelector(`#${id}`), { dataTransfer: dt });
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
