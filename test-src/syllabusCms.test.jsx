import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { ContentCMS, CMS_CHAPTER_DEPENDENTS, sb } from "./AppUnderTest.jsx";

const UNITS_1ST = [
  { id: "u1", name: "Unit I – Diversity", level: "1st PU", order_number: 1, chapters: [
    { id: "c2", unit_id: "u1", chapter_name: "Biological Classification", order_number: 2 },
    { id: "c1", unit_id: "u1", chapter_name: "The Living World", order_number: 1 },
  ]},
  { id: "u2", name: "Unit II – Structure", level: "1st PU", order_number: 5, chapters: [] },
];
const CH_KEYS = ["concepts","videos","notes","questions","tests","progress","community_posts","game_sessions"];
const CH_LABEL = { progress: "student progress records", community_posts: "community posts", game_sessions: "game sessions" };
const mk = (over = {}) => CH_KEYS.map(key => ({ key, label: CH_LABEL[key] || key, reason: `reason-${key}`, count: 0, verified: true, ...(over[key] || {}) }));
const CH_ZERO = mk();

let spies;
const spy = (name, impl) => { const s = vi.spyOn(sb, name).mockImplementation(impl); spies.push(s); return s; };
beforeEach(() => { spies = []; });
afterEach(() => { spies.forEach(s => s.mockRestore()); vi.restoreAllMocks(); cleanup(); });

const ready = async (units = UNITS_1ST) => {
  const getUnits = spy("getUnits", async () => units);
  render(<ContentCMS />);
  await screen.findByText(units[0]?.name || "No units for 1st PU yet");
  return getUnits;
};
const expand = (name) => fireEvent.click(screen.getByText(name));

describe("ContentCMS — loading from the database", () => {
  it("shows a loading state, then renders DB units (not the static syllabus), ordered by order_number", async () => {
    let resolve; spy("getUnits", () => new Promise(r => { resolve = r; }));
    render(<ContentCMS />);
    expect(screen.getByRole("status")).toHaveTextContent(/Loading units and chapters/);
    resolve([UNITS_1ST[1], UNITS_1ST[0]]); // returned out of order
    await screen.findByText("Unit I – Diversity");
    const names = screen.getAllByText(/^Unit I/).map(n => n.textContent);
    expect(names[0]).toBe("Unit I – Diversity");
    expect(screen.queryByText(/Unit I – Diversity in the Living World/)).not.toBeInTheDocument(); // static SYLLABUS title
    expect(screen.getByText(/2 chapters · order 1/)).toBeInTheDocument();
  });

  it("chapters are shown sorted by order_number", async () => {
    await ready(); expand("Unit I – Diversity");
    const list = screen.getAllByText(/^(The Living World|Biological Classification)$/).map(n => n.textContent);
    expect(list).toEqual(["The Living World", "Biological Classification"]);
  });

  it("requests the currently selected level and reloads on level switch", async () => {
    const g = await ready();
    expect(g).toHaveBeenLastCalledWith("1st PU");
    g.mockImplementation(async () => []);
    fireEvent.click(screen.getByRole("button", { name: "2nd PU" }));
    await waitFor(() => expect(g).toHaveBeenLastCalledWith("2nd PU"));
    await screen.findByText("No units for 2nd PU yet");
  });

  it("shows an empty state with a prompt to add the first unit", async () => {
    spy("getUnits", async () => []);
    render(<ContentCMS />);
    expect(await screen.findByText("No units for 1st PU yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Add Unit" })).toBeEnabled();
  });

  it("shows the real error with Retry (never an empty list or static fallback), and Retry recovers", async () => {
    const g = spy("getUnits", async () => { throw new Error("Load failed (HTTP 401)"); });
    render(<ContentCMS />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Load failed (HTTP 401)");
    expect(screen.getByRole("button", { name: "+ Add Unit" })).toBeDisabled();
    g.mockImplementation(async () => UNITS_1ST);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Unit I – Diversity")).toBeInTheDocument();
  });

  it("no longer shows controls that only toasted (Concept, expected videos/notes counts)", async () => {
    await ready(); expand("Unit I – Diversity");
    expect(screen.queryByText(/\+ Concept/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Add chapter to Unit I – Diversity"));
    expect(screen.queryByText(/Expected (Videos|Notes|Concepts)/)).not.toBeInTheDocument();
  });
});

describe("ContentCMS — create / edit", () => {
  it("adds a unit with the current level and next order_number, then reloads", async () => {
    const g = await ready();
    const add = spy("addUnit", async (d) => [{ id: "new", ...d }]);
    fireEvent.click(screen.getByRole("button", { name: "+ Add Unit" }));
    expect(screen.getByLabelText("Order")).toHaveValue(6); // max(1,5)+1
    fireEvent.change(screen.getByLabelText("Unit name"), { target: { value: "  Unit III  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save Unit" }));
    await waitFor(() => expect(add).toHaveBeenCalledWith({ name: "Unit III", level: "1st PU", order_number: 6 }));
    await waitFor(() => expect(g).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/Unit added\./)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Unit" })).not.toBeInTheDocument();
  });

  it("edits a unit keeping its id (PATCH by id, only name/order_number)", async () => {
    await ready();
    const upd = spy("updateUnit", async (id, d) => [{ id, ...d }]);
    fireEvent.click(screen.getByLabelText("Edit unit Unit I – Diversity"));
    fireEvent.change(screen.getByLabelText("Unit name"), { target: { value: "Unit I – Renamed" } });
    fireEvent.change(screen.getByLabelText("Order"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(upd).toHaveBeenCalledWith("u1", { name: "Unit I – Renamed", order_number: 3 }));
  });

  it("adds a chapter under the right unit_id with next order within that unit", async () => {
    await ready();
    const add = spy("addChapter", async (d) => [{ id: "n", ...d }]);
    fireEvent.click(screen.getByLabelText("Add chapter to Unit I – Diversity"));
    expect(screen.getByLabelText("Order")).toHaveValue(3);
    fireEvent.change(screen.getByLabelText("Chapter name"), { target: { value: "Plant Kingdom" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Chapter" }));
    await waitFor(() => expect(add).toHaveBeenCalledWith({ unit_id: "u1", chapter_name: "Plant Kingdom", order_number: 3 }));
  });

  it("edits a chapter keeping its id and without touching unit_id", async () => {
    await ready(); expand("Unit I – Diversity");
    const upd = spy("updateChapter", async (id, d) => [{ id, ...d }]);
    fireEvent.click(screen.getByLabelText("Edit chapter The Living World"));
    fireEvent.change(screen.getByLabelText("Chapter name"), { target: { value: "The Living World (rev)" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(upd).toHaveBeenCalledWith("c1", { chapter_name: "The Living World (rev)", order_number: 1 }));
    expect(upd.mock.calls[0][1]).not.toHaveProperty("unit_id");
  });

  it("validates blank names and bad order without calling the database", async () => {
    await ready();
    const add = spy("addUnit", async () => []);
    fireEvent.click(screen.getByRole("button", { name: "+ Add Unit" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Unit" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Unit name is required.");
    fireEvent.change(screen.getByLabelText("Unit name"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("Order"), { target: { value: "-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Unit" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/whole number/);
    expect(add).not.toHaveBeenCalled();
  });

  it("a failed save keeps the dialog open, shows the real error, and shows no success toast or reload", async () => {
    const g = await ready();
    spy("addUnit", async () => { throw new Error("new row violates row-level security policy"); });
    fireEvent.click(screen.getByRole("button", { name: "+ Add Unit" }));
    fireEvent.change(screen.getByLabelText("Unit name"), { target: { value: "Nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Unit" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("row-level security");
    expect(screen.queryByText(/Unit added\./)).not.toBeInTheDocument();
    expect(g).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Save Unit" })).toBeEnabled(); // can retry
  });

  it("a zero-row update (helper throws) is reported as a failure", async () => {
    await ready();
    spy("updateUnit", async () => { throw new Error("No unit was updated (it may have been deleted, or you may not have permission)."); });
    fireEvent.click(screen.getByLabelText("Edit unit Unit I – Diversity"));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No unit was updated");
    expect(screen.queryByText(/Unit updated\./)).not.toBeInTheDocument();
  });

  it("prevents duplicate submission while a save is in flight", async () => {
    await ready();
    let release; const add = spy("addUnit", () => new Promise(r => { release = r; }));
    fireEvent.click(screen.getByRole("button", { name: "+ Add Unit" }));
    fireEvent.change(screen.getByLabelText("Unit name"), { target: { value: "Once" } });
    const btn = screen.getByRole("button", { name: "Save Unit" });
    fireEvent.click(btn); fireEvent.click(btn); fireEvent.click(btn);
    expect(add).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    release([{ id: "x" }]);
    await screen.findByText(/Unit added\./);
  });
});

describe("ContentCMS — deletion safety", () => {
  it("BLOCKS deleting a unit that still has chapters; never calls deleteUnit", async () => {
    await ready();
    const del = spy("deleteUnit", async () => []);
    spy("getUnitDeleteImpact", async () => [{ key: "chapters", label: "chapters", count: 2, verified: true }]);
    fireEvent.click(screen.getByLabelText("Delete unit Unit I – Diversity"));
    expect(await screen.findByText(/Deletion blocked/)).toBeInTheDocument();
    expect(screen.getByText("2 chapters")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Permanently delete/ })).not.toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();
  });

  it("BLOCKS deleting a chapter with dependents and lists only the non-zero counts accurately", async () => {
    await ready(); expand("Unit I – Diversity");
    const del = spy("deleteChapter", async () => []);
    spy("getChapterDeleteImpact", async () => mk({ videos: { count: 3 }, progress: { count: 12 } }));
    fireEvent.click(screen.getByLabelText("Delete chapter The Living World"));
    expect(await screen.findByText(/Deletion blocked/)).toBeInTheDocument();
    expect(screen.getByText("3 videos")).toBeInTheDocument();
    expect(screen.getByText("12 student progress records")).toBeInTheDocument();
    expect(screen.queryByText(/\b0 notes\b/)).not.toBeInTheDocument();
    expect(screen.getByText(/Storage PDF files are never deleted/)).toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();
  });

  it("when counts cannot be verified, deletion is blocked (not assumed safe) and Retry re-checks", async () => {
    await ready(); expand("Unit I – Diversity");
    const del = spy("deleteChapter", async () => []);
    const impact = spy("getChapterDeleteImpact", async () => { throw new Error("Count failed for videos (HTTP 500)"); });
    fireEvent.click(screen.getByLabelText("Delete chapter The Living World"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/deletion is blocked.*Count failed for videos/);
    expect(screen.queryByRole("button", { name: /Permanently delete/ })).not.toBeInTheDocument();
    impact.mockImplementation(async () => CH_ZERO);
    fireEvent.click(screen.getByRole("button", { name: "Retry check" }));
    expect(await screen.findByLabelText(/Type the chapter name/)).toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();
  });

  it("with zero dependents, requires typing the exact name before the delete button is enabled; then deletes by id and reloads", async () => {
    const g = await ready(); expand("Unit I – Diversity");
    const del = spy("deleteChapter", async (id) => [{ id }]);
    spy("getChapterDeleteImpact", async () => CH_ZERO);
    fireEvent.click(screen.getByLabelText("Delete chapter The Living World"));
    const input = await screen.findByLabelText(/Type the chapter name/);
    const btn = screen.getByRole("button", { name: "Permanently delete chapter" });
    expect(btn).toBeDisabled();
    fireEvent.change(input, { target: { value: "the living world" } }); // wrong case
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(del).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "The Living World" } });
    expect(btn).toBeEnabled();
    fireEvent.click(btn);
    await waitFor(() => expect(del).toHaveBeenCalledWith("c1"));
    expect(await screen.findByText(/Chapter deleted\./)).toBeInTheDocument();
    expect(g).toHaveBeenCalledTimes(2);
  });

  it("re-checks dependents immediately before deleting and refuses if new content appeared", async () => {
    await ready();
    const del = spy("deleteUnit", async () => [{ id: "u2" }]);
    const impact = spy("getUnitDeleteImpact", async () => [{ key: "chapters", label: "chapters", count: 0, verified: true }]);
    fireEvent.click(screen.getByLabelText("Delete unit Unit II – Structure"));
    fireEvent.change(await screen.findByLabelText(/Type the unit name/), { target: { value: "Unit II – Structure" } });
    impact.mockImplementation(async () => [{ key: "chapters", label: "chapters", count: 1, verified: true }]); // chapter added meanwhile
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete unit" }));
    expect(await screen.findByText(/Deletion blocked/)).toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();
  });

  it("a failed or zero-row delete shows the error and never reports success", async () => {
    await ready();
    spy("getUnitDeleteImpact", async () => [{ key: "chapters", label: "chapters", count: 0, verified: true }]);
    spy("deleteUnit", async () => { throw new Error("No unit was deleted (it may already be gone, or you may not have permission)."); });
    fireEvent.click(screen.getByLabelText("Delete unit Unit II – Structure"));
    fireEvent.change(await screen.findByLabelText(/Type the unit name/), { target: { value: "Unit II – Structure" } });
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete unit" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No unit was deleted");
    expect(screen.queryByText(/Unit deleted\./)).not.toBeInTheDocument();
  });

  it("prevents a double-click from issuing two deletes", async () => {
    await ready();
    spy("getUnitDeleteImpact", async () => [{ key: "chapters", label: "chapters", count: 0, verified: true }]);
    let release; const del = spy("deleteUnit", () => new Promise(r => { release = r; }));
    fireEvent.click(screen.getByLabelText("Delete unit Unit II – Structure"));
    fireEvent.change(await screen.findByLabelText(/Type the unit name/), { target: { value: "Unit II – Structure" } });
    const btn = screen.getByRole("button", { name: "Permanently delete unit" });
    fireEvent.click(btn); fireEvent.click(btn);
    await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    release([{ id: "u2" }]);
    await screen.findByText(/Unit deleted\./);
    expect(del).toHaveBeenCalledTimes(1);
  });
});

describe("ContentCMS — chapter deletion: every known dependent blocks, with a reason", () => {
  const openChapterDelete = async () => {
    await ready(); expand("Unit I – Diversity");
    fireEvent.click(screen.getByLabelText("Delete chapter The Living World"));
  };
  it.each([["concepts"], ["community_posts"], ["game_sessions"], ["questions"], ["tests"], ["notes"]])("blocks when %s exist, explains why, and never calls deleteChapter", async (key) => {
    const del = spy("deleteChapter", async () => []);
    spy("getChapterDeleteImpact", async () => mk({ [key]: { count: 2 } }));
    await openChapterDelete();
    expect(await screen.findByText(/Deletion blocked/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`^2 ${CH_LABEL[key] || key}$`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`reason-${key}`))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Permanently delete/ })).not.toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();
  });

  it("a zero from a table whose admin visibility is NOT verified does not allow deletion (fail-closed)", async () => {
    const del = spy("deleteChapter", async () => []);
    spy("getChapterDeleteImpact", async () => mk({ community_posts: { verified: false }, game_sessions: { verified: false } }));
    await openChapterDelete();
    expect(await screen.findByText(/Deletion blocked/)).toBeInTheDocument();
    expect(screen.getByText(/zero count is not trusted/)).toBeInTheDocument();
    expect(screen.getByText("community posts")).toBeInTheDocument();
    expect(screen.getByText("game sessions")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Type the chapter name/)).not.toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();
  });

  describe("dependency visibility: concepts is verified-visible; unverified dependencies stay fail-closed", () => {
    it("the real impact check (not a stubbed list) treats a concepts count of 0 as a verified zero: no block, typed confirmation offered", async () => {
      const del = spy("deleteChapter", async () => []);
      spy("_count", async () => 0); // every table reports zero rows; nothing is stubbed above _count
      await openChapterDelete();
      expect(await screen.findByLabelText(/Type the chapter name/)).toBeInTheDocument();
      expect(screen.queryByText(/Deletion blocked/)).not.toBeInTheDocument();
      expect(screen.queryByText(/zero count is not trusted/)).not.toBeInTheDocument();
      expect(del).not.toHaveBeenCalled(); // nothing is deleted until the user confirms
    });
    it("a genuinely unverified dependency {count: 0, verified: false} still blocks even when all seven other dependents are verified zero", async () => {
      const del = spy("deleteChapter", async () => []);
      spy("getChapterDeleteImpact", async () => mk({ game_sessions: { verified: false } }));
      await openChapterDelete();
      expect(await screen.findByText(/Deletion blocked/)).toBeInTheDocument();
      expect(screen.getByText(/zero count is not trusted/)).toBeInTheDocument();
      expect(screen.getByText("game sessions")).toBeInTheDocument();
      expect(del).not.toHaveBeenCalled();
    });
    it("a VERIFIED zero concepts count keeps the existing safe behaviour (typed confirmation, then delete)", async () => {
      const del = spy("deleteChapter", async () => [{ id: "c1" }]);
      spy("getChapterDeleteImpact", async () => mk({ concepts: { verified: true } }));
      await openChapterDelete();
      fireEvent.change(await screen.findByLabelText(/Type the chapter name/), { target: { value: "The Living World" } });
      expect(screen.queryByText(/Deletion blocked/)).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /Permanently delete/ }));
      await waitFor(() => expect(del).toHaveBeenCalledWith("c1"));
    });
    it("a concepts count above zero still blocks deletion", async () => {
      const del = spy("deleteChapter", async () => []);
      spy("getChapterDeleteImpact", async () => mk({ concepts: { count: 2, verified: true } }));
      await openChapterDelete();
      expect(await screen.findByText(/Deletion blocked/)).toBeInTheDocument();
      expect(del).not.toHaveBeenCalled();
    });
    it("all eight chapter dependents are verified-visible; the unit check's chapters dependency is verified", async () => {
      spy("_count", async () => 0);
      const r = await sb.getChapterDeleteImpact("c1");
      expect(r.map(i => [i.key, i.verified])).toEqual(CH_KEYS.map(k => [k, true]));
      expect((await sb.getUnitDeleteImpact("u1"))[0]).toMatchObject({ key: "chapters", verified: true });
    });
  });

  it("an empty impact list is never treated as safe", async () => {
    const del = spy("deleteChapter", async () => []);
    spy("getChapterDeleteImpact", async () => []);
    await openChapterDelete();
    expect(await screen.findByText(/Deletion blocked/)).toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();
  });

  it("explains a database foreign-key refusal in plain language (e.g. community posts), without success", async () => {
    spy("getChapterDeleteImpact", async () => CH_ZERO);
    spy("deleteChapter", async () => { throw new Error('update or delete on table "chapters" violates foreign key constraint "community_posts_chapter_id_fkey"'); });
    await openChapterDelete();
    fireEvent.change(await screen.findByLabelText(/Type the chapter name/), { target: { value: "The Living World" } });
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete chapter" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/refused the delete because other records \(for example community posts\)/);
    expect(screen.queryByText(/Chapter deleted\./)).not.toBeInTheDocument();
  });

  it("re-checks all dependents right before deleting a chapter and refuses if a new one appeared", async () => {
    const del = spy("deleteChapter", async () => [{ id: "c1" }]);
    const impact = spy("getChapterDeleteImpact", async () => CH_ZERO);
    await openChapterDelete();
    fireEvent.change(await screen.findByLabelText(/Type the chapter name/), { target: { value: "The Living World" } });
    impact.mockImplementation(async () => mk({ community_posts: { count: 1 } }));
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete chapter" }));
    expect(await screen.findByText(/Deletion blocked/)).toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();
  });

  it("if the final re-check itself FAILS, no delete is sent and the failure is shown (fail-closed at the last step)", async () => {
    const del = spy("deleteChapter", async () => [{ id: "c1" }]);
    const impact = spy("getChapterDeleteImpact", async () => CH_ZERO);
    await openChapterDelete();
    fireEvent.change(await screen.findByLabelText(/Type the chapter name/), { target: { value: "The Living World" } });
    impact.mockImplementation(async () => { throw new Error("Count failed for community_posts (HTTP 500)"); });
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete chapter" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Count failed for community_posts");
    expect(del).not.toHaveBeenCalled();
    expect(screen.queryByText(/Chapter deleted\./)).not.toBeInTheDocument();
  });

  it("final confirmation warns that deletion can cascade, and keeps the race and Storage warnings", async () => {
    spy("getChapterDeleteImpact", async () => CH_ZERO);
    await openChapterDelete();
    await screen.findByLabelText(/Type the chapter name/);
    expect(screen.getByText(/No dependent records were found in the 8 tables checked/)).toBeInTheDocument();
    expect(screen.getByText(/deleting a chapter can permanently delete dependent database content through cascading relationships/)).toBeInTheDocument();
    expect(screen.getByText(/cannot rule out a record created at the same instant/)).toBeInTheDocument();
    expect(screen.getByText(/Storage PDF files are never deleted by this tool/)).toBeInTheDocument();
  });

  it("unit confirmation carries its own cascade warning", async () => {
    await ready();
    spy("getUnitDeleteImpact", async () => [{ key: "chapters", label: "chapters", reason: "r", count: 0, verified: true }]);
    fireEvent.click(screen.getByLabelText("Delete unit Unit II – Structure"));
    await screen.findByLabelText(/Type the unit name/);
    expect(screen.getByText(/deleting a unit permanently deletes its chapters/)).toBeInTheDocument();
  });

  it("after a FAILED final re-check the green 'no dependents' banner is gone, the error is clear, deletion stays blocked, and re-running the check restores the normal flow", async () => {
    const del = spy("deleteChapter", async () => [{ id: "c1" }]);
    const impact = spy("getChapterDeleteImpact", async () => CH_ZERO);
    await openChapterDelete();
    fireEvent.change(await screen.findByLabelText(/Type the chapter name/), { target: { value: "The Living World" } });
    impact.mockImplementation(async () => { throw new Error("Count failed for videos (HTTP 500)"); });
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete chapter" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Could not re-verify the dependent records, so nothing was deleted\. Count failed for videos/);
    expect(screen.queryByText(/No dependent records were found/)).not.toBeInTheDocument();
    expect(screen.getByText(/deletion stays blocked until the dependency check is run again and passes/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Permanently delete/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Type the chapter name/)).not.toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();
    // Re-run the check: normal flow returns, with the typed name cleared.
    impact.mockImplementation(async () => CH_ZERO);
    fireEvent.click(screen.getByRole("button", { name: "Re-run check" }));
    const input = await screen.findByLabelText(/Type the chapter name/);
    expect(input).toHaveValue("");
    expect(screen.getByRole("button", { name: "Permanently delete chapter" })).toBeDisabled();
    expect(del).not.toHaveBeenCalled();
  });

  it("after the DATABASE refuses the delete, the green banner is gone, the explanation is shown, and deletion stays blocked", async () => {
    spy("getChapterDeleteImpact", async () => CH_ZERO);
    spy("deleteChapter", async () => { throw new Error('update or delete on table "chapters" violates foreign key constraint "community_posts_chapter_id_fkey"'); });
    await openChapterDelete();
    fireEvent.change(await screen.findByLabelText(/Type the chapter name/), { target: { value: "The Living World" } });
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete chapter" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/database refused the delete/);
    expect(screen.queryByText(/No dependent records were found/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Permanently delete/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Re-run check" })).toBeInTheDocument();
  });

  it("a double-click on the chapter delete button issues only one delete", async () => {
    spy("getChapterDeleteImpact", async () => CH_ZERO);
    let release; const del = spy("deleteChapter", () => new Promise(r => { release = r; }));
    await openChapterDelete();
    fireEvent.change(await screen.findByLabelText(/Type the chapter name/), { target: { value: "The Living World" } });
    const btn = screen.getByRole("button", { name: "Permanently delete chapter" });
    fireEvent.click(btn); fireEvent.click(btn);
    await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    release([{ id: "c1" }]);
    await screen.findByText(/Chapter deleted\./);
    expect(del).toHaveBeenCalledTimes(1);
  });

  it("typed-name confirmation tolerates stray whitespace in stored names", async () => {
    await ready([{ ...UNITS_1ST[0], chapters: [{ id: "cx", unit_id: "u1", chapter_name: "  Padded Name ", order_number: 1 }] }]);
    expand("Unit I – Diversity");
    const del = spy("deleteChapter", async () => [{ id: "cx" }]);
    spy("getChapterDeleteImpact", async () => CH_ZERO);
    fireEvent.click(screen.getByLabelText(/Delete chapter\s+Padded Name/));
    fireEvent.change(await screen.findByLabelText(/Type the chapter name/), { target: { value: "Padded Name" } });
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete chapter" }));
    await waitFor(() => expect(del).toHaveBeenCalledWith("cx"));
  });
});

describe("sb syllabus helpers — never fake success", () => {
  const resp = (body, { ok = true, status = 200, headers = {} } = {}) => ({ ok, status, json: async () => body, headers: { get: (k) => headers[k.toLowerCase()] ?? null } });
  let fetchMock;
  beforeEach(() => { fetchMock = vi.spyOn(globalThis, "fetch"); });

  it("addUnit/addChapter throw on HTTP error and on empty result", async () => {
    fetchMock.mockResolvedValueOnce(resp({ message: "duplicate key" }, { ok: false, status: 409 }));
    await expect(sb.addUnit({ name: "x" })).rejects.toThrow("duplicate key");
    fetchMock.mockResolvedValueOnce(resp([]));
    await expect(sb.addChapter({ chapter_name: "x" })).rejects.toThrow(/not saved/);
    fetchMock.mockResolvedValueOnce(resp([{ id: "1" }]));
    await expect(sb.addUnit({ name: "x" })).resolves.toEqual([{ id: "1" }]);
  });

  it("updateUnit/updateChapter treat zero affected rows as failure and target only the given id", async () => {
    fetchMock.mockResolvedValueOnce(resp([]));
    await expect(sb.updateUnit("abc", { name: "n" })).rejects.toThrow(/No unit was updated/);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/units\?id=eq\.abc$/);
    expect(fetchMock.mock.calls[0][1].method).toBe("PATCH");
    fetchMock.mockResolvedValueOnce(resp([]));
    await expect(sb.updateChapter("abc", { chapter_name: "n" })).rejects.toThrow(/No chapter was updated/);
  });

  it("deleteUnit/deleteChapter send DELETE by id with return=representation; zero rows or HTTP errors throw", async () => {
    fetchMock.mockResolvedValueOnce(resp([{ id: "abc" }]));
    await expect(sb.deleteChapter("abc")).resolves.toEqual([{ id: "abc" }]);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/chapters\?id=eq\.abc$/);
    expect(opts.method).toBe("DELETE");
    expect(opts.headers.Prefer).toBe("return=representation");
    fetchMock.mockResolvedValueOnce(resp([]));
    await expect(sb.deleteUnit("abc")).rejects.toThrow(/No unit was deleted/);
    fetchMock.mockResolvedValueOnce(resp({ message: "permission denied" }, { ok: false, status: 403 }));
    await expect(sb.deleteUnit("abc")).rejects.toThrow("permission denied");
  });

  it("_count reads the exact total from Content-Range and throws when it cannot", async () => {
    fetchMock.mockResolvedValueOnce(resp([{ id: 1 }], { headers: { "content-range": "0-0/17" } }));
    await expect(sb._count("videos", "chapter_id=eq.c1")).resolves.toBe(17);
    expect(fetchMock.mock.calls[0][1].headers.Prefer).toBe("count=exact");
    fetchMock.mockResolvedValueOnce(resp([], { headers: { "content-range": "*/0" } }));
    await expect(sb._count("videos", "chapter_id=eq.c1")).resolves.toBe(0);
    fetchMock.mockResolvedValueOnce(resp([]));
    await expect(sb._count("videos", "chapter_id=eq.c1")).rejects.toThrow(/Could not verify/);
    fetchMock.mockResolvedValueOnce(resp({ message: "boom" }, { ok: false, status: 500 }));
    await expect(sb._count("videos", "chapter_id=eq.c1")).rejects.toThrow("boom");
  });

  it("getChapterDeleteImpact counts all eight dependents; one failed count rejects the whole check", async () => {
    const counts = { concepts: 1, videos: 2, notes: 3, questions: 4, tests: 5, progress: 6, community_posts: 7, game_sessions: 8 };
    fetchMock.mockImplementation(async (url) => {
      const t = /rest\/v1\/(\w+)\?/.exec(url)[1];
      expect(url).toMatch(/chapter_id=eq\.c1/);
      return resp([], { headers: { "content-range": `0-0/${counts[t]}` } });
    });
    const r = await sb.getChapterDeleteImpact("c1");
    expect(r.map(i => [i.key, i.count])).toEqual(Object.entries(counts));
    // All eight dependents are verified-visible. Live inspection showed concepts has the
    // concepts_public_read SELECT policy USING (true), so its count (and a zero) is trusted.
    expect(r.filter(i => !i.verified)).toEqual([]);
    expect(r.find(i => i.key === "concepts")).toMatchObject({ count: 1, verified: true });
    expect(r.find(i => i.key === "community_posts")).toMatchObject({ count: 7, verified: true });
    expect(CMS_CHAPTER_DEPENDENTS.map(d => d[0])).toEqual(CH_KEYS);
    fetchMock.mockReset();
    let n = 0;
    fetchMock.mockImplementation(async () => (++n === 7 ? resp({ message: "x" }, { ok: false, status: 500 }) : resp([], { headers: { "content-range": "*/0" } })));
    await expect(sb.getChapterDeleteImpact("c1")).rejects.toThrow();
  });

  it("getUnitDeleteImpact counts chapters by unit_id", async () => {
    fetchMock.mockResolvedValueOnce(resp([{ id: 1 }], { headers: { "content-range": "0-0/4" } }));
    const r = await sb.getUnitDeleteImpact("u1");
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ key: "chapters", count: 4, verified: true });
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/chapters\?select=id&unit_id=eq\.u1&limit=1$/);
  });
});
