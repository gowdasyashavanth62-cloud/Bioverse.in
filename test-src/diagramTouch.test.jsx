import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, act, fireEvent, within } from "@testing-library/react";
import {
  DiagramGame, LabelMode, DIAGRAM_DATA, normalizeDiagram, DIAGRAM_SVG_COMPONENTS,
  resolveStructureTap, DG_TAP_SLOP_PX, DG_CLICK_SUPPRESS_MS,
} from "./AppUnderTest.jsx";

const NS = "http://www.w3.org/2000/svg";
const DIAGRAMS = DIAGRAM_DATA.map(normalizeDiagram).filter(d => d.image?.type === "svg");

// jsdom has no PointerEvent: build a MouseEvent (carries clientX/Y) and attach the pointer fields.
function fire(el, type, { x = 0, y = 0, pointerType = "touch", pointerId = 1, isPrimary = true } = {}) {
  const ev = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
  Object.defineProperties(ev, {
    pointerType: { value: pointerType }, pointerId: { value: pointerId }, isPrimary: { value: isPrimary },
  });
  act(() => { el.dispatchEvent(ev); });
  return ev;
}
const tap = (el, x, y, o = {}) => { fire(el, "pointerdown", { x, y, ...o }); fire(el, "pointerup", { x, y, ...o }); };
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); });

let origElementsFromPoint;
beforeEach(() => {
  origElementsFromPoint = document.elementsFromPoint;
  document.elementsFromPoint = () => [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { document.elementsFromPoint = origElementsFromPoint; vi.restoreAllMocks(); cleanup(); });

// ── synthetic responsive SVG: viewBox 0 0 100 100 rendered at `size` px, placed at
// (left, top) in the viewport. client -> user mapping is done by the stub the way a
// browser does it (scale + offset), so the resolver is exercised against real scaling.
function buildSvg(shapes, { size, left = 20, top = 50, backdropIds = [] }) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  Object.defineProperty(svg, "viewBox", { value: { baseVal: { width: 100, height: 100 } } });
  document.body.appendChild(svg);
  const rects = new Map();
  shapes.forEach(({ id, x, y, w, h }) => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("data-structure-id", id);
    const r = document.createElementNS(NS, "rect");
    g.appendChild(r); svg.appendChild(g);
    rects.set(r, { x, y, w, h });
    if (backdropIds.includes(id)) g.getBBox = () => ({ width: 90, height: 90 });
    else g.getBBox = () => ({ width: w, height: h });
  });
  const scale = size / 100;
  document.elementsFromPoint = (cx, cy) => {
    const ux = (cx - left) / scale, uy = (cy - top) / scale;
    if (ux < 0 || uy < 0 || ux > 100 || uy > 100) return [document.body];
    const hits = [...rects].filter(([, b]) => ux >= b.x && ux <= b.x + b.w && uy >= b.y && uy <= b.y + b.h).map(([el]) => el).reverse();
    return [...hits, svg, document.body];
  };
  return { svg, scale, left, top };
}

describe("resolveStructureTap — responsive / scaled SVG hit testing", () => {
  afterEach(() => { document.querySelectorAll("body > svg").forEach(n => n.remove()); });

  [320, 160].forEach(size => {
    it(`thin 1-unit stroke is tappable from ~16px away at ${size}px render size (constant finger-sized target, any scale)`, () => {
      const { svg, scale, left, top } = buildSvg([{ id: "thin", x: 49.5, y: 10, w: 1, h: 80 }], { size });
      const cx = left + 50 * scale, cy = top + 50 * scale;
      expect(resolveStructureTap(svg, cx, cy)).toBe("thin");           // exact
      expect(resolveStructureTap(svg, cx + 16, cy)).toBe("thin");      // 16px off: near miss still selects
      expect(resolveStructureTap(svg, cx - 16, cy + 5)).toBe("thin");
      expect(resolveStructureTap(svg, cx + 40, cy)).toBe(null);        // far away: nothing
    });
  });

  it("two neighbours never tie: the nearest structure wins; between them nothing is selected", () => {
    const { svg, scale, left, top } = buildSvg([
      { id: "A", x: 39.5, y: 10, w: 1, h: 80 }, { id: "B", x: 59.5, y: 10, w: 1, h: 80 },
    ], { size: 320 });
    const ax = left + 40 * scale, bx = left + 60 * scale, y = top + 50 * scale;
    expect(resolveStructureTap(svg, ax + 12, y)).toBe("A");
    expect(resolveStructureTap(svg, bx - 12, y)).toBe("B");
    expect(resolveStructureTap(svg, (ax + bx) / 2, y)).toBe(null);      // 32px from each: outside both
  });

  it("works when the page is scrolled (viewport-relative client coords) and DPR/offset differ", () => {
    const a = buildSvg([{ id: "s", x: 70, y: 70, w: 4, h: 4 }], { size: 250, left: 7, top: -120 }); // scrolled up: svg top above viewport
    const x = 7 + 72 * 2.5, y = -120 + 72 * 2.5;
    expect(resolveStructureTap(a.svg, x, y)).toBe("s");
    expect(resolveStructureTap(a.svg, x + 14, y - 9)).toBe("s");
  });

  it("a large backdrop structure yields to a small structure right next to the tap, but is selected when tapped on its own", () => {
    const { svg, scale, left, top } = buildSvg([
      { id: "membrane", x: 5, y: 5, w: 90, h: 90 }, { id: "dot", x: 49, y: 49, w: 2, h: 2 },
    ], { size: 300, backdropIds: ["membrane"] });
    const cx = left + 50 * scale, cy = top + 50 * scale;
    expect(resolveStructureTap(svg, cx + 8, cy)).toBe("dot");            // lands on membrane, dot is 8px away
    expect(resolveStructureTap(svg, cx + 60, cy)).toBe("membrane");      // far from the dot: backdrop
  });

  it("returns null when something else (e.g. the floating AI button) is on top of the SVG", () => {
    const { svg } = buildSvg([{ id: "x", x: 0, y: 0, w: 100, h: 100 }], { size: 200 });
    const overlay = document.createElement("button"); document.body.appendChild(overlay);
    document.elementsFromPoint = () => [overlay, svg];
    expect(resolveStructureTap(svg, 50, 90)).toBe(null);
    overlay.remove();
  });
});

describe("all 12 diagram SVGs expose every structure to the shared touch layer", () => {
  it("each diagram renders a [data-structure-id] group per structure, with touch-action: manipulation (page still scrolls)", () => {
    expect(DIAGRAMS.length).toBe(12);
    DIAGRAMS.forEach(d => {
      const Svg = DIAGRAM_SVG_COMPONENTS[d.image.component];
      const { container, unmount } = render(<Svg selectedId={null} onSelectStructure={() => {}} />);
      const svg = container.querySelector("svg");
      expect(svg.style.touchAction).toBe("manipulation");
      d.structures.forEach(s => {
        expect(svg.querySelector(`[data-structure-id="${s.id}"]`), `${d.id}:${s.id}`).not.toBeNull();
      });
      unmount();
    });
  });
});

// helper: make the stub report a given structure group (its first drawn child) at one fixed point
function stubHitAt(svg, id, px, py) {
  const g = svg.querySelector(`[data-structure-id="${id}"]`);
  const leaf = g.querySelector("path,circle,ellipse,rect,line,polygon,polyline") || g;
  document.elementsFromPoint = (x, y) => (Math.abs(x - px) < 0.5 && Math.abs(y - py) < 0.5 ? [leaf, g, svg, document.body] : [svg, document.body]);
  return g;
}

describe("touch tap on every diagram SVG (tap / pointercancel / tap-vs-drag / no duplicate)", () => {
  DIAGRAMS.forEach(d => {
    it(`${d.id}: tap selects once; click from the same gesture is swallowed; mouse uses the click path only`, () => {
      const Svg = DIAGRAM_SVG_COMPONENTS[d.image.component];
      const onSelect = vi.fn();
      const { container } = render(<Svg selectedId={null} onSelectStructure={onSelect} />);
      const svg = container.querySelector("svg");
      const target = d.structures[d.structures.length - 1].id;
      const g = stubHitAt(svg, target, 100, 100);
      const leaf = g.querySelector("path,circle,ellipse,rect,line,polygon,polyline") || g;

      tap(leaf, 100, 100);                        // finger tap
      click(leaf);                                // browser's synthesized click
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenLastCalledWith(target);

      onSelect.mockClear();
      fire(leaf, "pointerdown", { x: 100, y: 100 });   // cancelled gesture (e.g. browser took over for scroll)
      fire(leaf, "pointercancel", { x: 100, y: 100 });
      fire(leaf, "pointerup", { x: 100, y: 100 });
      expect(onSelect).not.toHaveBeenCalled();

      fire(leaf, "pointerdown", { x: 100, y: 100 });   // drag/scroll past the slop
      fire(leaf, "pointermove", { x: 100, y: 100 + DG_TAP_SLOP_PX + 6 });
      fire(leaf, "pointerup", { x: 100, y: 100 + DG_TAP_SLOP_PX + 6 });
      expect(onSelect).not.toHaveBeenCalled();

      fire(leaf, "pointerdown", { x: 100, y: 100 });   // small jitter is still a tap
      fire(leaf, "pointermove", { x: 103, y: 102 });
      document.elementsFromPoint = (x, y) => [leaf, g, svg, document.body];
      fire(leaf, "pointerup", { x: 103, y: 102 });
      expect(onSelect).toHaveBeenCalledTimes(1);

    });

    it(`${d.id}: desktop mouse — pointer events ignored, the existing onClick fires exactly once`, () => {
      const Svg = DIAGRAM_SVG_COMPONENTS[d.image.component];
      const onSelect = vi.fn();
      const { container } = render(<Svg selectedId={null} onSelectStructure={onSelect} />);
      const svg = container.querySelector("svg");
      const g = stubHitAt(svg, d.structures[0].id, 100, 100);
      tap(g, 100, 100, { pointerType: "mouse" });
      expect(onSelect).not.toHaveBeenCalled();
      click(g);
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenLastCalledWith(d.structures[0].id);
    });
  });

  it("stylus (pen) behaves like touch", () => {
    const d = DIAGRAMS[0];
    const Svg = DIAGRAM_SVG_COMPONENTS[d.image.component];
    const onSelect = vi.fn();
    const { container } = render(<Svg selectedId={null} onSelectStructure={onSelect} />);
    const svg = container.querySelector("svg");
    const g = stubHitAt(svg, d.structures[0].id, 60, 60);
    tap(g, 60, 60, { pointerType: "pen" });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe("modes: structure tap by finger (Explore, Find Mismatched Labels)", () => {
  const diagram = DIAGRAMS[0];
  const last = diagram.structures[diagram.structures.length - 1];

  it("Explore: a finger tap selects the structure and shows it exactly once", () => {
    const { container } = render(<DiagramGame diagram={diagram} />);
    const svg = container.querySelector("svg");
    const g = stubHitAt(svg, last.id, 80, 80);
    tap(g, 80, 80); click(g);
    expect(screen.getByText("Selected")).toBeInTheDocument();
    expect(screen.getAllByText(last.name).length).toBeGreaterThan(0);
  });

  it("Find Mismatched Labels: a finger tap on a structure still activates it (no duplicate toggle from the click)", () => {
    const { container } = render(<DiagramGame diagram={diagram} />);
    fireEvent.click(screen.getByText(/Find Mismatched Labels/));
    const svg = container.querySelector("svg");
    const g = stubHitAt(svg, last.id, 80, 80);
    const before = container.innerHTML;
    tap(g, 80, 80); click(g);            // if the click also toggled, selection would flip back and HTML would equal `before`
    const afterTap = container.innerHTML;
    expect(afterTap).not.toBe(before);
  });
});

describe("Label the Diagram — label bank on touch", () => {
  const diagram = DIAGRAMS[0];
  const [A, B] = diagram.structures;
  const chip = (name) => screen.getAllByText(name).find(el => el.getAttribute("draggable") === "true");
  const progress = () => screen.getByText(/\/ \d+ Labels/).textContent.replace(/\s+/g, " ");
  const ghost = () => document.querySelector('[aria-hidden="true"][style*="position: fixed"]');

  function setup() {
    const r = render(<LabelMode diagram={diagram} isNarrow />);
    const svg = r.container.querySelector("svg");
    return { ...r, svg };
  }

  it("tap label → tap structure places it exactly once (pointer + click do not double-fire)", () => {
    const { svg } = setup();
    const c = chip(A.name);
    tap(c, 10, 10); click(c);                         // select label (tap, not drag)
    const g = stubHitAt(svg, A.id, 120, 120);
    tap(g, 120, 120); click(g);                       // tap structure
    expect(progress()).toMatch(/^1 \/ \d+ Labels/);
  });

  it("repeated interactions work without a second tap: select, place, select next, place next", () => {
    const { svg } = setup();
    [A, B].forEach((s, i) => {
      const c = chip(s.name);
      tap(c, 10, 10); click(c);
      const g = stubHitAt(svg, s.id, 120, 120);
      tap(g, 120, 120); click(g);
      expect(progress()).toMatch(new RegExp(`^${i + 1} / `));
    });
  });

  it("tap on the wrong structure is rejected (rules unchanged), label can be retried", () => {
    const { svg } = setup();
    const c = chip(A.name);
    tap(c, 10, 10); click(c);
    const g = stubHitAt(svg, B.id, 120, 120);
    tap(g, 120, 120); click(g);
    expect(progress()).toMatch(/^0 \/ /);
    expect(chip(A.name)).toBeTruthy();
  });

  it("drag label → drop on structure places it; ghost shows while dragging and is gone after", () => {
    const { svg } = setup();
    const c = chip(A.name);
    fire(c, "pointerdown", { x: 10, y: 10 });
    fire(c, "pointermove", { x: 10, y: 10 + DG_TAP_SLOP_PX + 20 });
    expect(ghost()).not.toBeNull();
    const g = stubHitAt(svg, A.id, 130, 130);
    fire(c, "pointermove", { x: 130, y: 130 });
    fire(c, "pointerup", { x: 130, y: 130 });
    click(c);                                         // trailing click after a drag must not select anything
    expect(progress()).toMatch(/^1 \/ /);
    expect(ghost()).toBeNull();
  });

  it("tap-vs-drag: movement under the slop is a tap (selects), not a drag (no ghost, no placement)", () => {
    const { svg } = setup();
    const c = chip(A.name);
    fire(c, "pointerdown", { x: 10, y: 10 });
    fire(c, "pointermove", { x: 13, y: 12 });
    expect(ghost()).toBeNull();
    stubHitAt(svg, A.id, 13, 12);
    fire(c, "pointerup", { x: 13, y: 12 });
    expect(progress()).toMatch(/^0 \/ /);
    click(c);
    expect(c.style.background).toMatch(/rgb|#/);       // selected styling applied by the click path
  });

  it("failed drop (released on empty space) resets drag state, keeps the label, and the next tap works first time", () => {
    const { svg } = setup();
    const c = chip(A.name);
    fire(c, "pointerdown", { x: 10, y: 10 });
    fire(c, "pointermove", { x: 10, y: 80 });
    document.elementsFromPoint = () => [document.body];
    fire(c, "pointerup", { x: 10, y: 80 });
    click(c);                                         // swallowed
    expect(ghost()).toBeNull();
    expect(progress()).toMatch(/^0 \/ /);
    tap(c, 10, 10); click(c);                         // first tap after the failed drag selects
    const g = stubHitAt(svg, A.id, 120, 120);
    tap(g, 120, 120); click(g);
    expect(progress()).toMatch(/^1 \/ /);
  });

  it("pointercancel during a drag clears the ghost and drag state without placing anything", () => {
    setup();
    const c = chip(A.name);
    fire(c, "pointerdown", { x: 10, y: 10 });
    fire(c, "pointermove", { x: 10, y: 70 });
    expect(ghost()).not.toBeNull();
    fire(c, "pointercancel", { x: 10, y: 70 });
    expect(ghost()).toBeNull();
    expect(progress()).toMatch(/^0 \/ /);
  });

  it("native HTML5 drag is cancelled for touch (pointer drag owns it) but still works for mouse", () => {
    setup();
    const c = chip(A.name);
    fire(c, "pointerdown", { x: 1, y: 1, pointerType: "touch" });
    const dsTouch = new Event("dragstart", { bubbles: true, cancelable: true });
    dsTouch.dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    act(() => { c.dispatchEvent(dsTouch); });
    expect(dsTouch.defaultPrevented).toBe(true);
    fire(c, "pointerup", { x: 1, y: 1, pointerType: "touch" });

    fire(c, "pointerdown", { x: 1, y: 1, pointerType: "mouse" });
    const dsMouse = new Event("dragstart", { bubbles: true, cancelable: true });
    dsMouse.dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    act(() => { c.dispatchEvent(dsMouse); });
    expect(dsMouse.defaultPrevented).toBe(false);
    expect(dsMouse.dataTransfer.setData).toHaveBeenCalledWith("text/plain", A.id);
  });

  it("chips only (not the page) disable browser gestures", () => {
    const { container } = setup();
    expect(chip(A.name).style.touchAction).toBe("none");
    expect(container.querySelector("svg").style.touchAction).toBe("manipulation");
  });
});
