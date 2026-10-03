import React from "react";
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { AITutor } from "./AppUnderTest.jsx";

function setViewportWidth(width) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
}

// jsdom doesn't implement scrollIntoView — AITutor calls it on every
// message-list update. Stub it so mounting the component doesn't throw.
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

describe("AI Tutor — mobile responsiveness", () => {
  it("stacks the chat + suggestions sidebar into one column at 390px (iPhone-class phone)", () => {
    setViewportWidth(390);
    const { container } = render(<AITutor currentChapter={null} currentLevel="1st PU" user={{ name: "Test" }} />);
    const grids = Array.from(container.querySelectorAll("div")).filter(
      el => el.style.display === "grid" && el.style.gridTemplateColumns
    );
    const chatGrid = grids.find(el => el.style.alignItems === "start");
    expect(chatGrid).toBeTruthy();
    expect(chatGrid.style.gridTemplateColumns).toBe("1fr");
  });

  it("stacks the chat + suggestions sidebar into one column at 412px (common Android width)", () => {
    setViewportWidth(412);
    const { container } = render(<AITutor currentChapter={null} currentLevel="1st PU" user={{ name: "Test" }} />);
    const grids = Array.from(container.querySelectorAll("div")).filter(
      el => el.style.display === "grid" && el.style.gridTemplateColumns
    );
    const chatGrid = grids.find(el => el.style.alignItems === "start");
    expect(chatGrid.style.gridTemplateColumns).toBe("1fr");
  });

  it("keeps the two-column chat + sidebar layout at 1440px (desktop)", () => {
    setViewportWidth(1440);
    const { container } = render(<AITutor currentChapter={null} currentLevel="1st PU" user={{ name: "Test" }} />);
    const grids = Array.from(container.querySelectorAll("div")).filter(
      el => el.style.display === "grid" && el.style.gridTemplateColumns
    );
    const chatGrid = grids.find(el => el.style.alignItems === "start");
    expect(chatGrid.style.gridTemplateColumns).toBe("1fr 300px");
  });

  it("wraps the tab-switcher row instead of overflowing it at 390px", () => {
    setViewportWidth(390);
    const { getByText } = render(<AITutor currentChapter={null} currentLevel="1st PU" user={{ name: "Test" }} />);
    const tabButton = getByText("💬 AI Chat");
    const tabRow = tabButton.parentElement;
    expect(tabRow.style.flexWrap).toBe("wrap");
  });
});
