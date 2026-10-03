import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagramGame, DIAGRAM_DATA, normalizeDiagram } from "./AppUnderTest.jsx";

const animalCell = normalizeDiagram(DIAGRAM_DATA.find(d => d.id === "dg1"));
const CANONICAL_ORDER = animalCell.structures.map(s => s.name);
const STRUCTURE_IDS = animalCell.structures.map(s => s.id); // e.g. cellMembrane, nucleus, ...

function makeDataTransfer() {
  const store = {};
  return {
    setData: (k, v) => { store[k] = v; },
    getData: (k) => store[k] || "",
    effectAllowed: null,
  };
}

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

describe("Explore Mode (regression check)", () => {
  it("selecting a structure by click shows its info panel", () => {
    const { container } = render(<DiagramGame diagram={animalCell} />);
    // default mode is explore
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();

    const nucleusGroup = container.querySelector("#nucleus");
    expect(nucleusGroup).toBeTruthy();
    fireEvent.click(nucleusGroup);

    expect(screen.getByText("Nucleus")).toBeInTheDocument();
    expect(screen.getByText(/Control centre of the cell/i)).toBeInTheDocument();
    expect(screen.getByText("Clear selection")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Clear selection"));
    expect(screen.getByText(/Hover or tap a structure/i)).toBeInTheDocument();
  });
});

describe("Label Mode", () => {
  function openLabelMode() {
    const utils = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    return utils;
  }

  it("shows exactly 7 labels", () => {
    openLabelMode();
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
    CANONICAL_ORDER.forEach(name => expect(screen.getByText(name)).toBeInTheDocument());
  });

  it("shuffles label order across mounts", () => {
    const orders = [];
    for (let i = 0; i < 15; i++) {
      const { container, unmount } = render(<DiagramGame diagram={animalCell} />);
      fireEvent.click(screen.getByText("🏷 Label the Diagram"));
      const chipTexts = Array.from(container.querySelectorAll("[draggable='true']")).map(el => el.textContent);
      orders.push(chipTexts.join("|"));
      unmount();
    }
    const canonical = CANONICAL_ORDER.join("|");
    const distinctOrders = new Set(orders);
    // Overwhelmingly unlikely (~1/5040 per draw) that a real shuffle
    // produces the canonical order every single time, or produces the
    // exact same order on every mount.
    expect(orders.some(o => o !== canonical)).toBe(true);
    expect(distinctOrders.size).toBeGreaterThan(1);
  });

  it("drag-and-drop: correct placement locks structure and increments progress", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    const nucleusChip = screen.getByText("Nucleus");
    const nucleusGroup = container.querySelector("#nucleus");

    fireEvent.dragStart(nucleusChip, { dataTransfer: dt });
    fireEvent.dragOver(nucleusGroup, { dataTransfer: dt });
    fireEvent.drop(nucleusGroup, { dataTransfer: dt });

    expect(screen.getByText("1 / 7 Labels")).toBeInTheDocument();
    expect(screen.getByText(/correct!/i)).toBeInTheDocument();
    // Correctly placed label leaves the bank (locked, not re-offered).
    expect(screen.queryByText("Nucleus")).not.toBeInTheDocument();
  });

  it("drag-and-drop: wrong placement gives feedback, no progress, label stays available", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();
    const nucleusChip = screen.getByText("Nucleus");
    const mitochondriaGroup = container.querySelector("#mitochondria");

    fireEvent.dragStart(nucleusChip, { dataTransfer: dt });
    fireEvent.dragOver(mitochondriaGroup, { dataTransfer: dt });
    fireEvent.drop(mitochondriaGroup, { dataTransfer: dt });

    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    // Label remains in the bank for retry.
    expect(screen.getByText("Nucleus")).toBeInTheDocument();
  });

  it("tap flow (mobile-equivalent): tap label then tap structure places it, wrong tap gives retry", () => {
    const { container } = openLabelMode();
    const vacuoleChip = screen.getByText("Vacuole");
    const nucleusGroup = container.querySelector("#nucleus");
    const vacuoleGroup = container.querySelector("#vacuole");

    // Wrong tap target first.
    fireEvent.click(vacuoleChip);
    fireEvent.click(nucleusGroup);
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText("Vacuole")).toBeInTheDocument(); // still available

    // Retry: correct target.
    fireEvent.click(vacuoleChip);
    fireEvent.click(vacuoleGroup);
    expect(screen.getByText("1 / 7 Labels")).toBeInTheDocument();
    expect(screen.queryByText("Vacuole")).not.toBeInTheDocument();
  });

  it("completing all 7 shows score, XP, and Play Again resets the game", () => {
    const { container } = openLabelMode();
    const dt = makeDataTransfer();

    STRUCTURE_IDS.forEach(id => {
      const label = animalCell.structures.find(s => s.id === id).name;
      const chip = screen.getByText(label);
      const group = container.querySelector(`#${id}`);
      fireEvent.dragStart(chip, { dataTransfer: dt });
      fireEvent.dragOver(group, { dataTransfer: dt });
      fireEvent.drop(group, { dataTransfer: dt });
    });

    expect(screen.getByText("7 / 7 Labels")).toBeInTheDocument();
    expect(screen.getByText(/All labels placed/i)).toBeInTheDocument();
    expect(screen.getByText(/Score: 7\/7/)).toBeInTheDocument();
    expect(screen.getByText(/XP earned:/)).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument(); // xpReward:50, 7/7 correct

    fireEvent.click(screen.getByText("Play Again"));
    expect(screen.getByText("0 / 7 Labels")).toBeInTheDocument();
    CANONICAL_ORDER.forEach(name => expect(screen.getByText(name)).toBeInTheDocument());
  });
});

describe("Responsive layout", () => {
  const setWidth = (w) => {
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  };

  it("uses a two-column grid on desktop width", () => {
    setWidth(1280);
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    const wrapper = container.querySelectorAll("div")[0];
    // Find the grid/flex wrapper directly holding the two cards.
    const gridEl = Array.from(container.querySelectorAll("div")).find(
      el => el.style.display === "grid" || (el.style.display === "flex" && el.style.flexDirection === "column")
    );
    expect(gridEl).toBeTruthy();
    expect(gridEl.style.display).toBe("grid");
  });

  it("stacks vertically on narrow/mobile width", () => {
    setWidth(390);
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    const stackedEl = Array.from(container.querySelectorAll("div")).find(
      el => el.style.display === "flex" && el.style.flexDirection === "column" && el.style.gap === "14px"
    );
    expect(stackedEl).toBeTruthy();
    setWidth(1280); // restore for other tests
  });
});

describe("Console cleanliness", () => {
  it("no console.error calls during a full play-through", () => {
    setWidthNoop();
    const { container } = render(<DiagramGame diagram={animalCell} />);
    fireEvent.click(container.querySelector("#nucleus"));
    fireEvent.click(screen.getByText("🏷 Label the Diagram"));
    const dt = makeDataTransfer();
    const chip = screen.getByText("Nucleus");
    const group = container.querySelector("#nucleus");
    fireEvent.dragStart(chip, { dataTransfer: dt });
    fireEvent.dragOver(group, { dataTransfer: dt });
    fireEvent.drop(group, { dataTransfer: dt });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
function setWidthNoop() {}
