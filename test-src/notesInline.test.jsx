import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { ConnectedNotesTab, NotesView, sb, PdfPageRenderer, DIAGRAM_DATA } from "./AppUnderTest.jsx";

const TAB_NOTES = [
  { id: "n1", title: "Cell Biology — Class Notes", pdf_url: "ch1/notes1.pdf", note_type: "PDF", download_count: 3, content: "Intro to cells" },
  { id: "n2", title: "Genetics Basics", pdf_url: "ch1/notes2.pdf", note_type: "PDF", download_count: 1 },
];

const LIBRARY_NOTES = [
  { id: "n1", title: "Cell Biology — Class Notes", pdf_url: "ch1/notes1.pdf", note_type: "PDF", download_count: 3, chapters: { chapter_name: "Cell: The Unit of Life" } },
  { id: "n2", title: "Genetics Basics", pdf_url: "ch1/notes2.pdf", note_type: "PDF", download_count: 1, chapters: { chapter_name: "Genetics" } },
];

const PAGE_IMAGES = ["data:image/png;base64,AAA", "data:image/png;base64,BBB", "data:image/png;base64,CCC"];

let fetchSpy, renderSpy, windowOpenSpy;

beforeEach(() => {
  fetchSpy = vi.spyOn(sb, "fetchFileBlobUrl").mockImplementation(async (bucket, path) => `blob:mock/${bucket}/${path}`);
  renderSpy = vi.spyOn(PdfPageRenderer, "renderPages").mockResolvedValue(PAGE_IMAGES);
  windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
});
afterEach(() => {
  fetchSpy.mockRestore();
  renderSpy.mockRestore();
  windowOpenSpy.mockRestore();
  cleanup();
});

function openButtonFor(title) {
  return screen.getByRole("button", { name: `Open notes: ${title}` });
}

describe("Student Notes (chapter tab) — ConnectedNotesTab renders in-page, not an external PDF viewer", () => {
  it("each notes card initially shows 'Open Notes' (not 'Download PDF')", () => {
    render(<ConnectedNotesTab notes={TAB_NOTES} chapterName="Cell Biology" />);
    expect(screen.getAllByText("Open Notes")).toHaveLength(2);
    expect(screen.queryByText("Close Notes")).not.toBeInTheDocument();
    expect(screen.queryByText(/Download PDF/i)).not.toBeInTheDocument();
  });

  it("clicking 'Open Notes' expands the notes in the same page, rendering through the in-app renderer, with no new tab/window.open", async () => {
    render(<ConnectedNotesTab notes={TAB_NOTES} chapterName="Cell Biology" />);
    fireEvent.click(openButtonFor("Cell Biology — Class Notes"));

    // (Loading state is verified separately, deterministically, with a
    // manually-controlled promise — see "loading state shows..." below.
    // Asserting it here against an instantly-resolving mock would be racy:
    // React 18 can batch straight through to "ready" without ever painting
    // the intermediate loading render.)
    expect(await screen.findByAltText("Page 1")).toBeInTheDocument();
    expect(screen.getByAltText("Page 2")).toBeInTheDocument();
    expect(screen.getByAltText("Page 3")).toBeInTheDocument();

    expect(fetchSpy).toHaveBeenCalledWith("notes-pdfs", "ch1/notes1.pdf");
    expect(renderSpy).toHaveBeenCalledWith("blob:mock/notes-pdfs/ch1/notes1.pdf", expect.any(Number));
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it("no target=\"_blank\" elements exist in the rendered notes flow", async () => {
    const { container } = render(<ConnectedNotesTab notes={TAB_NOTES} chapterName="Cell Biology" />);
    fireEvent.click(openButtonFor("Cell Biology — Class Notes"));
    await screen.findByAltText("Page 1");
    expect(container.querySelectorAll('[target="_blank"]')).toHaveLength(0);
  });

  it("the expanded page content appears below the note card's header/button, within the same card element", async () => {
    const { container } = render(<ConnectedNotesTab notes={TAB_NOTES} chapterName="Cell Biology" />);
    const btn = openButtonFor("Cell Biology — Class Notes");
    fireEvent.click(btn);
    const img1 = await screen.findByAltText("Page 1");

    const card = btn.closest("div");
    expect(within(card).getByAltText("Page 1")).toBe(img1);
    // DOM order: the button must precede the rendered page content.
    const position = btn.compareDocumentPosition(img1);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("'Close Notes' collapses the rendered content and returns to 'Open Notes', without reloading or navigating away", async () => {
    render(<ConnectedNotesTab notes={TAB_NOTES} chapterName="Cell Biology" />);
    fireEvent.click(openButtonFor("Cell Biology — Class Notes"));
    await screen.findByAltText("Page 1");

    fireEvent.click(screen.getByRole("button", { name: "Close notes: Cell Biology — Class Notes" }));
    expect(screen.queryByAltText("Page 1")).not.toBeInTheDocument();
    expect(screen.getAllByText("Open Notes")).toHaveLength(2); // both cards back to closed state
  });

  it("opening one note does not open unrelated notes (isolation)", async () => {
    render(<ConnectedNotesTab notes={TAB_NOTES} chapterName="Cell Biology" />);
    fireEvent.click(openButtonFor("Cell Biology — Class Notes"));
    await screen.findByAltText("Page 1");

    // The second note's button is still in its closed state, and no page
    // content was rendered for it.
    expect(screen.getByRole("button", { name: "Open notes: Genetics Basics" })).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it("loading state shows 'Loading notes…' before the renderer resolves", async () => {
    let resolveRender;
    renderSpy.mockImplementation(() => new Promise(res => { resolveRender = res; }));
    render(<ConnectedNotesTab notes={TAB_NOTES} chapterName="Cell Biology" />);
    fireEvent.click(openButtonFor("Cell Biology — Class Notes"));
    // toggleNote itself awaits fetchFileBlobUrl before NotesPdfPanel even
    // mounts, so the "Loading notes…" state only appears after that
    // microtask settles — wait for the real UI state rather than asserting
    // synchronously right after the click.
    expect(await screen.findByText("Loading notes…")).toBeInTheDocument();
    resolveRender(PAGE_IMAGES);
    expect(await screen.findByAltText("Page 1")).toBeInTheDocument();
  });

  it("error state shows the polished message when rendering fails, without breaking the rest of the page", async () => {
    renderSpy.mockRejectedValue(new Error("boom"));
    render(<ConnectedNotesTab notes={TAB_NOTES} chapterName="Cell Biology" />);
    fireEvent.click(openButtonFor("Cell Biology — Class Notes"));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Unable to load these notes. Please try again.");
    // The rest of the page (the other note's card) is unaffected.
    expect(screen.getByRole("button", { name: "Open notes: Genetics Basics" })).toBeInTheDocument();
  });

  it("fails gracefully when the PDF has zero readable pages", async () => {
    renderSpy.mockResolvedValue([]);
    render(<ConnectedNotesTab notes={TAB_NOTES} chapterName="Cell Biology" />);
    fireEvent.click(openButtonFor("Cell Biology — Class Notes"));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Unable to load these notes. Please try again.");
  });

  it("if resolving the blob URL fails, shows the existing inline error (not a broken page)", async () => {
    fetchSpy.mockRejectedValue(new Error("Could not load file (HTTP 404)"));
    render(<ConnectedNotesTab notes={TAB_NOTES} chapterName="Cell Biology" />);
    fireEvent.click(openButtonFor("Cell Biology — Class Notes"));
    expect(await screen.findByText(/Could not load file/i)).toBeInTheDocument();
    expect(renderSpy).not.toHaveBeenCalled();
  });

  it("existing notes card fields (title, type, download count, content preview) still render correctly", () => {
    render(<ConnectedNotesTab notes={TAB_NOTES} chapterName="Cell Biology" />);
    expect(screen.getByText("Cell Biology — Class Notes")).toBeInTheDocument();
    expect(screen.getByText(/PDF · 3 downloads/)).toBeInTheDocument();
    expect(screen.getByText(/Intro to cells/)).toBeInTheDocument();
  });

  it("mobile width (390px): no element renders with a fixed pixel width wider than the viewport", async () => {
    window.innerWidth = 390;
    window.dispatchEvent(new Event("resize"));
    const { container } = render(<ConnectedNotesTab notes={TAB_NOTES} chapterName="Cell Biology" />);
    fireEvent.click(openButtonFor("Cell Biology — Class Notes"));
    await screen.findByAltText("Page 1");

    const badWidths = Array.from(container.querySelectorAll("[style]")).filter(el => {
      const w = el.style.width;
      return w && /^\d+(\.\d+)?px$/.test(w) && parseFloat(w) > 390;
    });
    expect(badWidths).toHaveLength(0);
    window.innerWidth = 1280;
  });

  it("aria-expanded reflects open/closed state on the toggle button", async () => {
    render(<ConnectedNotesTab notes={TAB_NOTES} chapterName="Cell Biology" />);
    const btn = openButtonFor("Cell Biology — Class Notes");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(btn);
    await screen.findByAltText("Page 1");
    expect(screen.getByRole("button", { name: "Close notes: Cell Biology — Class Notes" }).getAttribute("aria-expanded")).toBe("true");
  });
});

describe("Student Notes Library (NotesView) — same in-page behavior", () => {
  beforeEach(() => {
    vi.spyOn(sb, "getAllNotes").mockResolvedValue(LIBRARY_NOTES);
  });

  it("shows a loading state, then renders notes cards with 'Open Notes'", async () => {
    render(<NotesView />);
    expect(screen.getByText("Loading notes…")).toBeInTheDocument();
    expect(await screen.findByText("Cell Biology — Class Notes")).toBeInTheDocument();
    expect(screen.getAllByText("Open Notes")).toHaveLength(2);
  });

  it("clicking 'Open Notes' expands in-page via the in-app renderer, with no new tab", async () => {
    render(<NotesView />);
    await screen.findByText("Cell Biology — Class Notes");
    fireEvent.click(openButtonFor("Cell Biology — Class Notes"));
    expect(await screen.findByAltText("Page 1")).toBeInTheDocument();
    expect(windowOpenSpy).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledWith("notes-pdfs", "ch1/notes1.pdf");
  });

  it("'Close Notes' collapses the content back down", async () => {
    render(<NotesView />);
    await screen.findByText("Cell Biology — Class Notes");
    fireEvent.click(openButtonFor("Cell Biology — Class Notes"));
    await screen.findByAltText("Page 1");
    fireEvent.click(screen.getByRole("button", { name: "Close notes: Cell Biology — Class Notes" }));
    expect(screen.queryByAltText("Page 1")).not.toBeInTheDocument();
  });

  it("opening one note does not open the other (isolation)", async () => {
    render(<NotesView />);
    await screen.findByText("Cell Biology — Class Notes");
    fireEvent.click(openButtonFor("Cell Biology — Class Notes"));
    await screen.findByAltText("Page 1");
    expect(screen.getByRole("button", { name: "Open notes: Genetics Basics" })).toBeInTheDocument();
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it("no target=\"_blank\" elements exist anywhere in the library flow", async () => {
    const { container } = render(<NotesView />);
    await screen.findByText("Cell Biology — Class Notes");
    fireEvent.click(openButtonFor("Cell Biology — Class Notes"));
    await screen.findByAltText("Page 1");
    expect(container.querySelectorAll('[target="_blank"]')).toHaveLength(0);
  });

  it("existing bookmark, note type, and download count still work/render", async () => {
    render(<NotesView />);
    await screen.findByText("Cell Biology — Class Notes");
    expect(screen.getAllByText("PDF")).toHaveLength(2);
    expect(screen.getByText("3 downloads")).toBeInTheDocument();
  });
});

describe("Notes PDF flow — regression / scope guard", () => {
  it("no window.open call is ever made from the student ConnectedNotesTab/NotesView flow, across normal open/close/error paths", async () => {
    render(<ConnectedNotesTab notes={TAB_NOTES} chapterName="X" />);
    fireEvent.click(openButtonFor("Cell Biology — Class Notes"));
    await screen.findByAltText("Page 1");
    fireEvent.click(screen.getByRole("button", { name: "Close notes: Cell Biology — Class Notes" }));
    fireEvent.click(openButtonFor("Genetics Basics"));
    await screen.findByAltText("Page 1");
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it("admin NotesManager preview flow (teacher/admin upload workflow) is untouched — still uses window.open for its own preview action", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("function NotesManager(");
    const end = source.indexOf("\nfunction ", start + 1);
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);
    expect(body).toContain('window.open(blobUrl, "_blank")');
  });

  it("Diagram Center and dg1-dg10 data are unaffected by this change", () => {
    expect(DIAGRAM_DATA.length).toBe(10);
    expect(DIAGRAM_DATA.find(d => d.id === "dg8").title).toBe("Plant Cell");
  });
});

// ══════════════════════════════════════════════════════════════════
// REAL (non-mocked) PdfPageRenderer regression tests — added after a
// real-Android-device failure ("Unable to load these notes. Please try
// again.") revealed that the previous fully-mocked test suite could not
// have caught the actual bug. Root cause: pdfjs-dist v6's worker is
// ESM-only and requires `new Worker(url, {type:"module"})`, which has
// unreliable support on real Android WebView/PWA contexts even though it
// works fine in desktop testing (jsdom never creates a real Worker at
// all, so the mocked suite was blind to this). Fixed by pinning
// pdfjs-dist@3.11.174 (legacy build), whose worker is a classic script
// (`new Worker(url)`, no {type:"module"}) — confirmed by reading
// pdfjs-dist's own source for both versions. A second, independent bug
// was found in the same investigation: v3.11.174's build is UMD/CJS, and
// `getDocument`/`GlobalWorkerOptions` land on `.default` under some
// import-interop paths rather than as direct named exports — the
// production code now normalizes both shapes defensively.
//
// These tests exercise the REAL pdfjs-dist library and the REAL
// PdfPageRenderer.renderPages() invalid-response guard — no mocking of
// PdfPageRenderer itself. A genuine multi-page PDF (generated with
// Python's reportlab, verified independently via a standalone Node
// script before being embedded here) is used as real, parseable bytes.
// Full canvas-based page rendering could not be verified in jsdom (no
// real <canvas> 2D context / Worker support there — this is a jsdom
// limitation, not a reproduction of the reported bug), so these tests
// stop at real document parsing + text extraction, which is exactly the
// layer the actual bug (worker/import/interop) lives in.
// ══════════════════════════════════════════════════════════════════

const REAL_TEST_PDF_BASE64 = "JVBERi0xLjMKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMSAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL0NvbnRlbnRzIDkgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjc1NiA4NDEuODg5OCBdIC9QYXJlbnQgOCAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNCAwIG9iago8PAovQ29udGVudHMgMTAgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjc1NiA4NDEuODg5OCBdIC9QYXJlbnQgOCAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNSAwIG9iago8PAovQ29udGVudHMgMTEgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjc1NiA4NDEuODg5OCBdIC9QYXJlbnQgOCAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNiAwIG9iago8PAovUGFnZU1vZGUgL1VzZU5vbmUgL1BhZ2VzIDggMCBSIC9UeXBlIC9DYXRhbG9nCj4+CmVuZG9iago3IDAgb2JqCjw8Ci9BdXRob3IgKGFub255bW91cykgL0NyZWF0aW9uRGF0ZSAoRDoyMDI2MDkyMDAzMjAwMiswMCcwMCcpIC9DcmVhdG9yIChhbm9ueW1vdXMpIC9LZXl3b3JkcyAoKSAvTW9kRGF0ZSAoRDoyMDI2MDkyMDAzMjAwMiswMCcwMCcpIC9Qcm9kdWNlciAoUmVwb3J0TGFiIFBERiBMaWJyYXJ5IC0gXChvcGVuc291cmNlXCkpIAogIC9TdWJqZWN0ICh1bnNwZWNpZmllZCkgL1RpdGxlICh1bnRpdGxlZCkgL1RyYXBwZWQgL0ZhbHNlCj4+CmVuZG9iago4IDAgb2JqCjw8Ci9Db3VudCAzIC9LaWRzIFsgMyAwIFIgNCAwIFIgNSAwIFIgXSAvVHlwZSAvUGFnZXMKPj4KZW5kb2JqCjkgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMTI3Cj4+CnN0cmVhbQpHYXBRaDBFPUYsMFVcSDNUXHBOWVReUUtrP3RjPklQLDtXI1UxXjIzaWhQRU1fP0NXNEtJU2k5ME1qRy5pZklDSyVCJUdKWWdmRSw8LyUncmAjT0pvZURfKnAhI0lRdD8lbW1Lb01idV05bmVaW0tiLGh0IT1FJzNwSzhAX34+ZW5kc3RyZWFtCmVuZG9iagoxMCAwIG9iago8PAovRmlsdGVyIFsgL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlIF0gL0xlbmd0aCAxMjcKPj4Kc3RyZWFtCkdhcFFoMEU9RiwwVVxIM1RccE5ZVF5RS2s/dGM+SVAsO1cjVTFeMjNpaFBFTV8/Q1c0S0lTaTkwTWpHLmlmSUNLJUIlR0pZZ2ZFLDwvJSdyYCNPSm9lRF8qcCEjSVF0PyVtbUtvTWJ1PTluZVpbS2IsaHQhPUUnM3BMYj9ufj5lbmRzdHJlYW0KZW5kb2JqCjExIDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDEyNwo+PgpzdHJlYW0KR2FwUWgwRT1GLDBVXEgzVFxwTllUXlFLaz90Yz5JUCw7VyNVMV4yM2loUEVNXz9DVzRLSVNpOTBNakcuaWZJQ0slQiVHSllnZkUsPC8lJ3JgI09Kb2VEXypwISNJUXQ/JW1tS29NYyEoOW5lWltLYixodCE9RSczcE43Pyh+PmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDEyCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDA2MSAwMDAwMCBuIAowMDAwMDAwMDkyIDAwMDAwIG4gCjAwMDAwMDAxOTkgMDAwMDAgbiAKMDAwMDAwMDQwMiAwMDAwMCBuIAowMDAwMDAwNjA2IDAwMDAwIG4gCjAwMDAwMDA4MTAgMDAwMDAgbiAKMDAwMDAwMDg3OCAwMDAwMCBuIAowMDAwMDAxMTM5IDAwMDAwIG4gCjAwMDAwMDEyMTAgMDAwMDAgbiAKMDAwMDAwMTQyNyAwMDAwMCBuIAowMDAwMDAxNjQ1IDAwMDAwIG4gCnRyYWlsZXIKPDwKL0lEIApbPDFlNGM5ODQ4NDQxMzEyZDY2ODg0YjFmMzFjM2NkOTRkPjwxZTRjOTg0ODQ0MTMxMmQ2Njg4NGIxZjMxYzNjZDk0ZD5dCiUgUmVwb3J0TGFiIGdlbmVyYXRlZCBQREYgZG9jdW1lbnQgLS0gZGlnZXN0IChvcGVuc291cmNlKQoKL0luZm8gNyAwIFIKL1Jvb3QgNiAwIFIKL1NpemUgMTIKPj4Kc3RhcnR4cmVmCjE4NjMKJSVFT0YK"; // 3-page PDF: "BioVerse real test PDF - page N"

function base64ToUint8Array(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

describe("PdfPageRenderer — real (non-mocked) pdf.js integration", () => {
  it("the real pdfjs-dist legacy build parses a real multi-page PDF and extracts real text (proves the CJS/UMD interop fix, independent of PdfPageRenderer)", async () => {
    const mod = await import("pdfjs-dist/legacy/build/pdf.js");
    const pdfjsLib = mod.getDocument ? mod : mod.default; // same interop-safe pattern as production
    expect(typeof pdfjsLib.getDocument).toBe("function");

    const data = base64ToUint8Array(REAL_TEST_PDF_BASE64);
    const doc = await pdfjsLib.getDocument({ data, isEvalSupported: false }).promise;
    expect(doc.numPages).toBe(3);

    const page1 = await doc.getPage(1);
    const text1 = (await page1.getTextContent()).items.map(i => i.str).join(" ");
    expect(text1).toContain("BioVerse real test PDF - page 1");

    const page3 = await doc.getPage(3);
    const text3 = (await page3.getTextContent()).items.map(i => i.str).join(" ");
    expect(text3).toContain("BioVerse real test PDF - page 3");
  }, 20000);

  it("PdfPageRenderer.renderPages (real, unmocked) correctly detects a non-PDF response (e.g. an HTML/JSON error page) instead of failing deep inside pdf.js with a confusing error", async () => {
    renderSpy.mockRestore(); // this test exercises the REAL implementation, not the outer beforeEach's mock
    const jsonErrorUrl = "data:application/json," + encodeURIComponent(JSON.stringify({ error: "not found" }));
    await expect(PdfPageRenderer.renderPages(jsonErrorUrl, 600)).rejects.toMatchObject({
      stage: "invalidResponse",
    });
  });

  it("PdfPageRenderer.renderPages (real, unmocked) accepts real PDF magic bytes (%PDF-) and proceeds past the invalid-response guard", async () => {
    renderSpy.mockRestore(); // this test exercises the REAL implementation, not the outer beforeEach's mock
    const data = base64ToUint8Array(REAL_TEST_PDF_BASE64);
    const pdfDataUrl = "data:application/pdf;base64," + REAL_TEST_PDF_BASE64;
    // Sanity: the embedded fixture really does start with the PDF magic header.
    expect(String.fromCharCode(...data.slice(0, 5))).toBe("%PDF-");
    // It should get past the invalid-response guard (real fetch + real byte
    // check) and fail later, if at all, only for jsdom-environment reasons
    // (no real <canvas>/Worker) — never with stage "invalidResponse".
    try {
      await PdfPageRenderer.renderPages(pdfDataUrl, 600);
    } catch (e) {
      expect(e.stage).not.toBe("invalidResponse");
    }
  }, 20000);
});

describe("PdfPageRenderer — source-level fix verification", () => {
  it("no longer references the v6 ESM-only module-worker path, and uses the classic (non-module) legacy worker instead", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("const PdfPageRenderer");
    const end = source.indexOf("\n};", start) + 3;
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);

    expect(body).not.toContain("pdfjs-dist/build/pdf.worker.min.mjs");
    expect(body).toContain("pdfjs-dist/legacy/build/pdf.worker.min.js");
    expect(body).toContain("pdfjs-dist/legacy/build/pdf.js");
    expect(body).toContain("isEvalSupported: false");
    expect(body).toContain("standardFontDataUrl");
    expect(body).toContain("cMapUrl");
  });

  it("package.json pins pdfjs-dist to the classic-worker-compatible 3.11.174 (not a v4+ ESM-only release)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
    expect(pkg.dependencies["pdfjs-dist"]).toBe("3.11.174");
  });

  it("pdfjs-dist's own installed source confirms the worker-instantiation difference that caused the real-device bug", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const workerSource = fs.readFileSync(
      path.join(__dirname, "..", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.js"),
      "utf8"
    );
    // The installed (legacy, v3.11.174) build must instantiate its worker
    // classically — no {type:"module"} — which is what makes it work on
    // real Android WebView/PWA contexts where module workers are unreliable.
    expect(workerSource).toMatch(/new Worker\(workerSrc\)/);
    expect(workerSource).not.toMatch(/new Worker\(workerSrc,\s*\{\s*type:\s*["']module["']/);
  });

  it("uses window.devicePixelRatio (not just CSS width) when computing render resolution, so pages aren't blurry on high-density screens", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    const start = source.indexOf("const PdfPageRenderer");
    const end = source.indexOf("\n};", start) + 3;
    const body = source.slice(start, end);
    expect(body).toContain("window.devicePixelRatio");
  });
});
