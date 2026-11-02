import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

// The registry is scoped to a Supabase project ref derived from VITE_SUPABASE_URL
// at module load, so the env must be stubbed BEFORE the app module is imported.
vi.stubEnv("VITE_SUPABASE_URL", "https://nvbaykuuxjzjeafpoexi.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "dummy-anon-key");
const App = await import("./AppUnderTest.jsx");
const {
  Visualizer, ChapterPage, ContentCMS, sb, VISUALIZER_CONFIGS, PROCEDURAL_3D_MODELS,
  LAB_REGISTRY_PROJECT_REF, LAB_CHAPTER_UUID_PAIRS, LAB_CHAPTER_REGISTRIES, LAB_UUID_RE,
  getSupabaseProjectRef, validateLabRegistry, resolveLabForChapter, labChapterDeleteGuard, labUnitDeleteGuard,
} = App;

const EXCRETORY_UUID = "22222222-0001-0005-0003-000000000016";
const EXCRETORY_DB_NAME = "Excretory Products and their Elimination";
const EXCRETORY_KEY = "Excretory Products and Elimination";
const NEW_UUID = "99999999-0000-0000-0000-000000000001";
const REF = LAB_REGISTRY_PROJECT_REF;
const chapter = (id, chapter_name, extra = {}) => ({ id, chapter_name, unit_id: "u1", order_number: 1, ...extra });

let spies;
const spy = (name, impl) => { const s = vi.spyOn(sb, name).mockImplementation(impl); spies.push(s); return s; };
beforeEach(() => { spies = []; });
afterEach(() => { spies.forEach(s => s.mockRestore()); vi.restoreAllMocks(); cleanup(); });

describe("Lab registry integrity (1-3)", () => {
  it("1. has exactly 32 well-formed, unique UUIDs, scoped to the verified project", () => {
    expect(REF).toBe("nvbaykuuxjzjeafpoexi");
    expect(LAB_CHAPTER_UUID_PAIRS).toHaveLength(32);
    const uuids = LAB_CHAPTER_UUID_PAIRS.map(p => p[0]);
    expect(uuids.every(u => LAB_UUID_RE.test(u))).toBe(true);
    expect(new Set(uuids.map(u => u.toLowerCase())).size).toBe(32);
    expect(LAB_CHAPTER_REGISTRIES[REF]).toBe(LAB_CHAPTER_UUID_PAIRS);
    expect(validateLabRegistry(LAB_CHAPTER_UUID_PAIRS).valid).toBe(true);
  });
  it("2. all 32 keys resolve to existing, distinct VISUALIZER_CONFIGS entries (32/32, no extras)", () => {
    const keys = LAB_CHAPTER_UUID_PAIRS.map(p => p[1]);
    expect(new Set(keys).size).toBe(32);
    keys.forEach(k => expect(Object.prototype.hasOwnProperty.call(VISUALIZER_CONFIGS, k)).toBe(true));
    expect(Object.keys(VISUALIZER_CONFIGS)).toHaveLength(32);
    expect([...keys].sort()).toEqual(Object.keys(VISUALIZER_CONFIGS).sort());
  });
  it("3. all 32 configurations resolve to a valid procedural 3D model (32/32 registry intact)", () => {
    expect(Object.keys(PROCEDURAL_3D_MODELS)).toHaveLength(32);
    LAB_CHAPTER_UUID_PAIRS.forEach(([uuid]) => {
      const r = resolveLabForChapter(chapter(uuid, "x"), { projectRef: REF });
      expect(r.status).toBe("mapped");
      expect(typeof PROCEDURAL_3D_MODELS[r.model]).toBe("function");
    });
  });
});

describe("Excretory chapter (4-5)", () => {
  it("4. UUID ...0016 resolves to the existing key and the nephron model, DB name untouched", () => {
    const r = resolveLabForChapter(chapter(EXCRETORY_UUID, EXCRETORY_DB_NAME), { projectRef: REF });
    expect(r.status).toBe("mapped");
    expect(r.key).toBe(EXCRETORY_KEY);
    expect(r.model).toBe("nephron");
    expect(r.chapterName).toBe(EXCRETORY_DB_NAME);
    expect(Object.prototype.hasOwnProperty.call(VISUALIZER_CONFIGS, EXCRETORY_DB_NAME)).toBe(false);
  });
  it("5. the name alone cannot resolve a database-backed chapter", () => {
    const byDbName = resolveLabForChapter(chapter(NEW_UUID, EXCRETORY_DB_NAME), { projectRef: REF });
    expect(byDbName.status).toBe("new");
    expect(byDbName.config).toBeUndefined();
    const byLabKey = resolveLabForChapter(chapter(NEW_UUID, EXCRETORY_KEY), { projectRef: REF });
    expect(byLabKey.status).toBe("mapping-missing");
    expect(byLabKey.config).toBeUndefined();
  });
});

describe("Resolution classes (6, 9-12)", () => {
  it("6. a mapped chapter stays mapped after a rename (even to another Lab's key)", () => {
    ["Totally Renamed", "Ecosystem", ""].forEach(n => {
      const r = resolveLabForChapter(chapter(EXCRETORY_UUID, n), { projectRef: REF });
      expect(r.status).toBe("mapped"); expect(r.model).toBe("nephron");
    });
  });
  it("9. an unmapped new chapter shows the normal 'coming soon' state without an alert", () => {
    render(<Visualizer chapter={chapter(NEW_UUID, "Brand New Chapter")} />);
    expect(screen.getByText(/Virtual Lab coming soon for this chapter/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("10. missing UUID mapping with a matching Lab name gives an explicit error, not a name fallback", () => {
    render(<Visualizer chapter={chapter(NEW_UUID, "Ecosystem")} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/Virtual Lab mapping error/);
    expect(alert).toHaveTextContent(NEW_UUID);
    expect(alert).toHaveTextContent("Ecosystem");
    expect(screen.queryByText("2D Diagram")).not.toBeInTheDocument();
  });
  it("11. static fallback chapters keep non-Lab behaviour and are never resolved by a matching name", () => {
    const a = resolveLabForChapter({ id: "c8", title: "Cell: The Unit of Life", _staticFallback: true });
    const b = resolveLabForChapter({ id: "c8", chapter_name: "Cell: The Unit of Life" });
    const c = resolveLabForChapter({ id: EXCRETORY_UUID, chapter_name: "Ecosystem", _staticFallback: true });
    [a, b, c].forEach(r => { expect(r.status).toBe("static"); expect(r.config).toBeUndefined(); });
    render(<Visualizer chapter={{ id: "c8", title: "Cell: The Unit of Life", _staticFallback: true }} />);
    expect(screen.getByText(/Virtual Lab coming soon for this chapter/)).toBeInTheDocument();
    expect(screen.queryByText("2D Diagram")).not.toBeInTheDocument();
  });
  it("12. an unknown project reference disables the registry visibly", () => {
    expect(getSupabaseProjectRef("https://abc123.supabase.co")).toBe("abc123");
    expect(getSupabaseProjectRef("https://example.com")).toBeNull();
    expect(getSupabaseProjectRef("not a url")).toBeNull();
    expect(getSupabaseProjectRef(undefined)).toBeNull();
    const r = resolveLabForChapter(chapter(EXCRETORY_UUID, EXCRETORY_DB_NAME), { projectRef: "otherproject" });
    expect(r.status).toBe("env-unavailable"); expect(r.config).toBeUndefined();
    expect(resolveLabForChapter(chapter(EXCRETORY_UUID, "x"), { projectRef: null }).status).toBe("env-unavailable");
  });
});

describe("Registry validation fails closed (13)", () => {
  const A = "11111111-1111-1111-1111-111111111111", B = "22222222-2222-2222-2222-222222222222";
  const ok = "Ecosystem";
  it("duplicate UUID disables BOTH entries", () => {
    const v = validateLabRegistry([[A, ok], [A, "Evolution"]]);
    expect(v.valid).toBe(false); expect(v.byUuid.size).toBe(0);
    expect(v.errors.some(e => e.code === "duplicate-uuid")).toBe(true);
    expect(resolveLabForChapter(chapter(A, "x"), { projectRef: "p", registries: { p: [[A, ok], [A, "Evolution"]] } }).status).toBe("invalid");
  });
  it("one Lab key mapped by two UUIDs is ambiguous and disabled", () => {
    const v = validateLabRegistry([[A, ok], [B, ok]]);
    expect(v.byUuid.size).toBe(0); expect(v.errors.every(e => e.code === "duplicate-key")).toBe(true);
  });
  it("malformed UUID, malformed entry and non-list registry are rejected", () => {
    expect(validateLabRegistry([["not-a-uuid", ok]]).errors[0].code).toBe("malformed-uuid");
    expect(validateLabRegistry([[A]]).errors[0].code).toBe("malformed-entry");
    expect(validateLabRegistry("nope").valid).toBe(false);
  });
  it("a key with no configuration, or a config whose model is missing, is rejected (no guessing)", () => {
    expect(validateLabRegistry([[A, "No Such Chapter"]]).errors[0].code).toBe("missing-config");
    const cfg = { Broken: { model3D: { proceduralModel: "ghost" } }, NoModel: {} };
    expect(validateLabRegistry([[A, "Broken"]], cfg, {}).errors[0].code).toBe("missing-model");
    expect(validateLabRegistry([[A, "NoModel"]], cfg, {}).errors[0].code).toBe("missing-model");
  });
  it("prototype keys are not treated as Lab keys", () => {
    expect(validateLabRegistry([[A, "constructor"]]).errors[0].code).toBe("missing-config");
    expect(resolveLabForChapter(chapter(NEW_UUID, "constructor"), { projectRef: REF }).status).toBe("new");
  });
});

describe("Existing Lab navigation and rendering (14)", () => {
  it("a mapped chapter renders its Lab (2D/3D toggle) through Visualizer", () => {
    render(<Visualizer chapter={chapter(EXCRETORY_UUID, EXCRETORY_DB_NAME)} />);
    expect(screen.getByText("2D Diagram")).toBeInTheDocument();
    expect(screen.getByText("3D Lab")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("ChapterPage opens the Lab tab for a database-backed mapped chapter", async () => {
    spy("getVideos", async () => []); spy("getNotes", async () => []); spy("getQuestions", async () => []);
    spy("getTests", async () => []); spy("getProgress", async () => []);
    render(<ChapterPage chapter={chapter(EXCRETORY_UUID, EXCRETORY_DB_NAME)} level="1st PU" onBack={() => {}} />);
    fireEvent.click(await screen.findByText(/Virtual Lab/));
    expect(await screen.findByText("2D Diagram")).toBeInTheDocument();
  });
});

describe("CMS safeguards (6-8)", () => {
  const CH_KEYS = ["concepts","videos","notes","questions","tests","progress","student_questions","community_posts","game_sessions"];
  const ZERO = CH_KEYS.map(key => ({ key, label: key, reason: `r-${key}`, count: 0, verified: true }));
  const unitsWith = (chapters) => [{ id: "u1", name: "Unit One", level: "1st PU", order_number: 1, chapters }];
  const openCms = async (chapters) => {
    spy("getUnits", async () => unitsWith(chapters));
    render(<ContentCMS />);
    fireEvent.click(await screen.findByText("Unit One"));
  };
  const MAPPED = () => chapter(EXCRETORY_UUID, EXCRETORY_DB_NAME);
  const FREE = () => chapter(NEW_UUID, "Brand New Chapter", { order_number: 2 });

  it("shows each chapter's Lab mapping status in the CMS", async () => {
    await openCms([MAPPED(), FREE()]);
    const labels = screen.getAllByTestId("lab-status").map(n => n.textContent);
    expect(labels).toEqual(["Lab: mapped by UUID", "Lab: not mapped"]);
  });
  it("6. renaming a mapped chapter is allowed, warns that the name differs, and calls update with the new name", async () => {
    const upd = spy("updateChapter", async () => [{}]);
    await openCms([MAPPED()]);
    fireEvent.click(screen.getByLabelText(`Edit chapter ${EXCRETORY_DB_NAME}`));
    const input = document.getElementById("cms-name");
    fireEvent.change(input, { target: { value: "A Brand New Name" } });
    expect(screen.getByRole("note")).toHaveTextContent(/by UUID/);
    fireEvent.click(screen.getByText("Save Changes"));
    await waitFor(() => expect(upd).toHaveBeenCalledWith(EXCRETORY_UUID, { chapter_name: "A Brand New Name", order_number: 1 }));
  });
  it("7. a mapped chapter cannot be deleted - blocked before any dependency query or delete", async () => {
    const del = spy("deleteChapter", async () => []);
    const impact = spy("getChapterDeleteImpact", async () => ZERO);
    await openCms([MAPPED()]);
    fireEvent.click(screen.getByLabelText(`Delete chapter ${EXCRETORY_DB_NAME}`));
    expect(await screen.findByText(/Deletion blocked \(Virtual Lab\)/)).toBeInTheDocument();
    expect(del).not.toHaveBeenCalled(); expect(impact).not.toHaveBeenCalled();
    expect(screen.queryByText(/Permanently d/)).not.toBeInTheDocument();
  });
  it("8a. invalid mapping or unavailable registry blocks deletion (guard level)", () => {
    const A = "11111111-1111-1111-1111-111111111111";
    expect(labChapterDeleteGuard(chapter(A, "x"), { projectRef: "p", registries: { p: [[A, "Ecosystem"], [A, "Evolution"]] } }).blocked).toBe(true);
    expect(labChapterDeleteGuard(chapter(NEW_UUID, "x"), { projectRef: "p", registries: { p: [["bad", "Ecosystem"]] } }).blocked).toBe(true);
    expect(labChapterDeleteGuard(chapter(NEW_UUID, "x"), { projectRef: "unknown" }).blocked).toBe(true);
    expect(labChapterDeleteGuard(chapter(NEW_UUID, "Ecosystem"), { projectRef: REF }).blocked).toBe(true);
    expect(labChapterDeleteGuard(chapter(NEW_UUID, "Brand New"), { projectRef: REF }).blocked).toBe(false);
    expect(labChapterDeleteGuard({ id: "c1", chapter_name: "Anything" }).blocked).toBe(false);
    expect(labUnitDeleteGuard({ chapters: [MAPPED()] }).blocked).toBe(true);
    expect(labUnitDeleteGuard({ chapters: [FREE()] }).blocked).toBe(false);
  });
  it("8b. unverifiable dependency impact still blocks deleting an unmapped chapter", async () => {
    const del = spy("deleteChapter", async () => []);
    spy("getChapterDeleteImpact", async () => { throw new Error("network down"); });
    await openCms([FREE()]);
    fireEvent.click(screen.getByLabelText("Delete chapter Brand New Chapter"));
    expect(await screen.findByText(/Could not verify what depends on this chapter/)).toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();
  });
  it("8c. an unmapped, dependency-free chapter can still be deleted (existing behaviour preserved)", async () => {
    const del = spy("deleteChapter", async () => []);
    spy("getChapterDeleteImpact", async () => ZERO);
    await openCms([FREE()]);
    fireEvent.click(screen.getByLabelText("Delete chapter Brand New Chapter"));
    const input = await screen.findByPlaceholderText("Brand New Chapter");
    fireEvent.change(input, { target: { value: "Brand New Chapter" } });
    fireEvent.click(screen.getByText(/Permanently d/));
    await waitFor(() => expect(del).toHaveBeenCalledWith(NEW_UUID));
  });
  it("a new chapter receives no automatic Lab mapping (add calls only addChapter)", async () => {
    const add = spy("addChapter", async () => [{}]);
    await openCms([FREE()]);
    fireEvent.click(screen.getByText(/\+ Chapter/));
    fireEvent.change(document.getElementById("cms-name"), { target: { value: "Another New Chapter" } });
    fireEvent.click(screen.getByText("Save Chapter"));
    await waitFor(() => expect(add).toHaveBeenCalledTimes(1));
    expect(add.mock.calls[0][0]).toEqual({ unit_id: "u1", chapter_name: "Another New Chapter", order_number: 3 });
  });
});
