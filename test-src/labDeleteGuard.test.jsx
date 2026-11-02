import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

vi.stubEnv("VITE_SUPABASE_URL", "https://nvbaykuuxjzjeafpoexi.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "dummy-anon-key");
const App = await import("./AppUnderTest.jsx");
const { ContentCMS, sb, LAB_REGISTRY_PROJECT_REF: REF, labChapterDeleteGuard, labUnitDeleteGuard } = App;

const EXCRETORY_UUID = "22222222-0001-0005-0003-000000000016";
const NEW_UUID = "99999999-0000-0000-0000-000000000001";
const A = "11111111-1111-1111-1111-111111111111";
const ch = (id, chapter_name) => ({ id, chapter_name, order_number: 1 });

afterEach(() => { vi.restoreAllMocks(); cleanup(); });

// Each guard assertion pins BOTH `status` and the reason text, so a test cannot
// pass merely because some other branch (e.g. the fail-closed fallthrough)
// also happens to block.
describe("labChapterDeleteGuard - isolated", () => {
  it("1. blocks a mapped chapter (status 'mapped', mapped-by-UUID reason)", () => {
    const g = labChapterDeleteGuard(ch(EXCRETORY_UUID, "Excretory Products and their Elimination"), { projectRef: REF });
    expect(g.blocked).toBe(true);
    expect(g.status).toBe("mapped");
    expect(g.reason).toMatch(/mapped to it by UUID/);
  });
  it("3. blocks an unmapped chapter whose name matches an existing Lab key", () => {
    const g = labChapterDeleteGuard(ch(NEW_UUID, "Ecosystem"), { projectRef: REF });
    expect(g.blocked).toBe(true);
    expect(g.status).toBe("mapping-missing");
    expect(g.reason).toMatch(/name matches an existing Virtual Lab but its UUID is not registered/);
  });
  it("4a. blocks a chapter whose registry entry is invalid (duplicate UUID)", () => {
    const registries = { p: [[A, "Ecosystem"], [A, "Evolution"]] };
    const g = labChapterDeleteGuard(ch(A, "Anything"), { projectRef: "p", registries });
    expect(g.blocked).toBe(true);
    expect(g.status).toBe("invalid");
    expect(g.reason).toMatch(/mapping is invalid/);
  });
  it("4b. blocks even a non-listed chapter when the registry failed its integrity check", () => {
    const registries = { p: [["not-a-uuid", "Ecosystem"]] };
    const g = labChapterDeleteGuard(ch(NEW_UUID, "Brand New Chapter"), { projectRef: "p", registries });
    expect(g.blocked).toBe(true);
    expect(g.status).toBe("new");
    expect(g.reason).toMatch(/failed its integrity check/);
  });
  it("5. blocks when the Supabase project/environment has no registry", () => {
    ["unknownproject", null].forEach(projectRef => {
      const g = labChapterDeleteGuard(ch(NEW_UUID, "Brand New Chapter"), { projectRef });
      expect(g.blocked).toBe(true);
      expect(g.status).toBe("env-unavailable");
      expect(g.reason).toMatch(/unavailable for this Supabase project/);
    });
  });
  it("6a. allows an ordinary unmapped new chapter (valid registry, no matching Lab name)", () => {
    const g = labChapterDeleteGuard(ch(NEW_UUID, "Brand New Chapter"), { projectRef: REF });
    expect(g).toEqual({ blocked: false, reason: null, status: "new" });
  });
  it("6b. does not block chapters without a database UUID (they can never resolve a Lab)", () => {
    expect(labChapterDeleteGuard({ id: "c1", chapter_name: "Anything" }).blocked).toBe(false);
  });
});

describe("labUnitDeleteGuard - isolated", () => {
  it("2. blocks a unit containing a mapped chapter, naming the protected chapter", () => {
    const unit = { id: "u1", chapters: [ch(NEW_UUID, "Brand New Chapter"), ch(EXCRETORY_UUID, "Excretory Products and their Elimination")] };
    const g = labUnitDeleteGuard(unit, { projectRef: REF });
    expect(g.blocked).toBe(true);
    expect(g.status).toBe("mapped");
    expect(g.reason).toMatch(/A chapter in this unit \("Excretory Products and their Elimination"\) is protected/);
    expect(g.reason).toMatch(/mapped to it by UUID/);
  });
  it("2b. blocks a unit in an unavailable environment, and allows a unit of ordinary chapters", () => {
    const unit = { chapters: [ch(NEW_UUID, "Brand New Chapter")] };
    expect(labUnitDeleteGuard(unit, { projectRef: "unknownproject" }).status).toBe("env-unavailable");
    expect(labUnitDeleteGuard(unit, { projectRef: "unknownproject" }).blocked).toBe(true);
    expect(labUnitDeleteGuard(unit, { projectRef: REF })).toEqual({ blocked: false, reason: null, status: "static" });
    expect(labUnitDeleteGuard({ chapters: [] }, { projectRef: REF }).blocked).toBe(false);
  });
});

describe("guards as wired into the CMS", () => {
  const KEYS = ["concepts","videos","notes","questions","tests","progress","student_questions","community_posts","game_sessions"];
  const ZERO = KEYS.map(key => ({ key, label: key, reason: `r-${key}`, count: 0, verified: true }));
  const open = async (chapters) => {
    vi.spyOn(sb, "getUnits").mockResolvedValue([{ id: "u1", name: "Unit One", level: "1st PU", order_number: 1, chapters }]);
    render(<ContentCMS />);
    fireEvent.click(await screen.findByText("Unit One"));
  };
  it("a unit containing a mapped chapter is blocked before any impact query or delete", async () => {
    const del = vi.spyOn(sb, "deleteUnit").mockResolvedValue([]);
    const impact = vi.spyOn(sb, "getUnitDeleteImpact").mockResolvedValue(ZERO);
    await open([ch(EXCRETORY_UUID, "Excretory Products and their Elimination")]);
    fireEvent.click(screen.getByLabelText("Delete unit Unit One"));
    expect(await screen.findByText(/Deletion blocked \(Virtual Lab\)/)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/A chapter in this unit/);
    expect(del).not.toHaveBeenCalled(); expect(impact).not.toHaveBeenCalled();
  });
  it("6c. an ordinary unmapped chapter is deleted when every dependency check passes", async () => {
    const del = vi.spyOn(sb, "deleteChapter").mockResolvedValue([]);
    const impact = vi.spyOn(sb, "getChapterDeleteImpact").mockResolvedValue(ZERO);
    await open([ch(NEW_UUID, "Brand New Chapter")]);
    fireEvent.click(screen.getByLabelText("Delete chapter Brand New Chapter"));
    fireEvent.change(await screen.findByPlaceholderText("Brand New Chapter"), { target: { value: "Brand New Chapter" } });
    fireEvent.click(screen.getByText(/Permanently d/));
    await waitFor(() => expect(del).toHaveBeenCalledWith(NEW_UUID));
    expect(impact).toHaveBeenCalled();
    expect(screen.queryByText(/Deletion blocked \(Virtual Lab\)/)).not.toBeInTheDocument();
  });
});
