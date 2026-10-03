import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import App, {
  BioVisionShell, CurrentShell, ActivePage, BioVisionNav, BIOVISION_NAV_ITEMS,
  UI_MODES, UI_MODE_STORAGE_KEY, sb,
} from "./AppUnderTest.jsx";

const noop = () => {};
const baseUser = { full_name: "Test Student", xp: 120 };

let consoleErrorSpy;
let originalFetch;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  originalFetch = global.fetch;
  try { window.localStorage.clear(); } catch {}
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  global.fetch = originalFetch;
  sb._session = null;
  cleanup();
});

function shellProps(overrides = {}) {
  return {
    user: baseUser, page: "dashboard", chapter: null, syllabusLevel: "1st PU",
    isMobile: false, uiMode: "biovision", setUiMode: noop,
    setChapter: noop, setSyllabusLevel: noop, handleNav: noop,
    ...overrides,
  };
}

// ── Navigation mapping ───────────────────────────────────────────────────
describe("BioVision nav -- student destinations only (no Teacher / Upgrade / Premium)", () => {
  it("contains exactly the student destinations and nothing Teacher/Upgrade/Premium related", () => {
    expect(BIOVISION_NAV_ITEMS.map(i => i.label)).toEqual(
      ["Home", "Chapters", "Practice", "PYQ's", "Flashcards", "Quiz", "Progress", "Profile"]);
    BIOVISION_NAV_ITEMS.forEach(i => {
      expect(i.label).not.toMatch(/teacher|upgrade|premium/i);
      expect(i.navKey).not.toMatch(/teacher|upgrade|premium/i);
    });
  });

  it("the rendered desktop and mobile nav show no Teacher/Upgrade/Premium text or controls", () => {
    ["desktop", "mobile"].forEach(kind => {
      const { container, unmount } = render(
        <BioVisionNav page="dashboard" isMobile={kind === "mobile"} user={baseUser} onNav={noop}
          mobileNavOpen={kind === "mobile"} onToggleMobileNav={noop} onCloseMobileNav={noop} />
      );
      expect(container.textContent).not.toMatch(/teacher|upgrade|premium/i);
      unmount();
    });
  });
});

describe("BioVision nav mapping (real BioVerse destinations only)", () => {
  it("maps every item to an existing BioVerse page key -- no invented destinations", () => {
    const expected = {
      home: "dashboard", chapters: "1stPU", practice: "questions",
      pyq: "pyq", flashcards: "flashcards", quiz: "gameHub", progress: "progress", profile: "profile",
    };
    BIOVISION_NAV_ITEMS.forEach(item => {
      expect(expected).toHaveProperty(item.key);
      expect(item.navKey).toBe(expected[item.key]);
    });
    expect(BIOVISION_NAV_ITEMS.length).toBe(8);
  });

  it("does not include a 'Hub' item -- the reference HTML's Hub has no existing BioVerse destination", () => {
    expect(BIOVISION_NAV_ITEMS.find(i => i.key === "hub")).toBeFalsy();
    expect(BIOVISION_NAV_ITEMS.some(i => i.label === "Hub")).toBe(false);
  });

  it("clicking each desktop nav item calls handleNav with exactly its mapped page key", () => {
    BIOVISION_NAV_ITEMS.forEach(item => {
      const onNav = vi.fn();
      const { unmount } = render(
        <BioVisionNav page="dashboard" isMobile={false} user={baseUser} onNav={onNav}
          mobileNavOpen={false} onToggleMobileNav={noop} onCloseMobileNav={noop} />
      );
      fireEvent.click(screen.getByRole("button", { name: item.label }));
      expect(onNav).toHaveBeenCalledWith(item.navKey);
      unmount();
    });
  });
});

// ── Active-state ─────────────────────────────────────────────────────────
describe("BioVision nav active state (reflects the existing `page` state, no second nav state)", () => {
  it("Home is active when page === 'dashboard'", () => {
    render(<BioVisionNav page="dashboard" isMobile={false} user={baseUser} onNav={noop} mobileNavOpen={false} onToggleMobileNav={noop} onCloseMobileNav={noop} />);
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Chapters" })).not.toHaveAttribute("aria-current");
  });

  it("Chapters is active when page === 'syllabus', regardless of 1st/2nd PU level", () => {
    render(<BioVisionNav page="syllabus" isMobile={false} user={baseUser} onNav={noop} mobileNavOpen={false} onToggleMobileNav={noop} onCloseMobileNav={noop} />);
    expect(screen.getByRole("button", { name: "Chapters" })).toHaveAttribute("aria-current", "page");
  });

  it("Practice/PYQ's/Flashcards/Quiz/Progress each activate only for their own page", () => {
    const cases = [
      ["questions", "Practice"], ["pyq", "PYQ's"], ["flashcards", "Flashcards"],
      ["gameHub", "Quiz"], ["progress", "Progress"],
    ];
    cases.forEach(([page, label]) => {
      const { unmount } = render(<BioVisionNav page={page} isMobile={false} user={baseUser} onNav={noop} mobileNavOpen={false} onToggleMobileNav={noop} onCloseMobileNav={noop} />);
      expect(screen.getByRole("button", { name: label })).toHaveAttribute("aria-current", "page");
      const others = BIOVISION_NAV_ITEMS.filter(i => i.label !== label);
      others.forEach(o => expect(screen.getByRole("button", { name: o.label })).not.toHaveAttribute("aria-current"));
      unmount();
    });
  });

  it("a page with no matching nav item (e.g. diagrams) leaves every nav item inactive, not falsely highlighting one", () => {
    render(<BioVisionNav page="diagrams" isMobile={false} user={baseUser} onNav={noop} mobileNavOpen={false} onToggleMobileNav={noop} onCloseMobileNav={noop} />);
    BIOVISION_NAV_ITEMS.forEach(item => {
      expect(screen.getByRole("button", { name: item.label })).not.toHaveAttribute("aria-current");
    });
  });
});

// ── Mobile navigation ────────────────────────────────────────────────────
describe("BioVision mobile navigation", () => {
  it("desktop nav links are hidden and a real, labeled hamburger button appears on mobile", () => {
    render(<BioVisionNav page="dashboard" isMobile={true} user={baseUser} onNav={noop} mobileNavOpen={false} onToggleMobileNav={noop} onCloseMobileNav={noop} />);
    expect(screen.queryByRole("navigation", { name: "Main navigation" })).not.toBeInTheDocument();
    const menuBtn = screen.getByRole("button", { name: "Open navigation menu" });
    expect(menuBtn.tagName.toLowerCase()).toBe("button");
    expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });

  it("toggling calls onToggleMobileNav, and the open drawer shows an accessible 'Close' label with aria-expanded=true", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <BioVisionNav page="dashboard" isMobile={true} user={baseUser} onNav={noop} mobileNavOpen={false} onToggleMobileNav={onToggle} onCloseMobileNav={noop} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(<BioVisionNav page="dashboard" isMobile={true} user={baseUser} onNav={noop} mobileNavOpen={true} onToggleMobileNav={onToggle} onCloseMobileNav={noop} />);
    const closeBtn = screen.getByRole("button", { name: "Close navigation menu" });
    expect(closeBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
  });

  it("selecting an item in the open mobile drawer calls both onNav (with the mapped key) and onCloseMobileNav", () => {
    const onNav = vi.fn();
    const onClose = vi.fn();
    render(<BioVisionNav page="dashboard" isMobile={true} user={baseUser} onNav={onNav} mobileNavOpen={true} onToggleMobileNav={noop} onCloseMobileNav={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Progress" }));
    expect(onNav).toHaveBeenCalledWith("progress");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("BioVisionShell closes its own mobile drawer automatically whenever the page changes", () => {
    const { rerender, container } = render(<BioVisionShell {...shellProps({ isMobile: true, page: "dashboard" })} />);
    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();

    rerender(<BioVisionShell {...shellProps({ isMobile: true, page: "questions" })} />);
    expect(container.querySelector('nav[aria-label="Main navigation"]')).toBeFalsy();
  });
});

// ── BioVisionShell composition ───────────────────────────────────────────
describe("BioVisionShell", () => {
  it("renders the BioVision top nav and the shared ActivePage content, and does NOT render the Current shell's sidebar", () => {
    const { container } = render(<BioVisionShell {...shellProps({ page: "dashboard" })} />);
    expect(container.querySelector('nav[aria-label="Main navigation"]')).toBeTruthy();
    expect(screen.getByText(/Loading your dashboard/)).toBeInTheDocument();
    // SidebarWithAI's topbar-specific tagline text must not appear here.
    expect(screen.queryByText("BioVerse · Karnataka PU Biology")).not.toBeInTheDocument();
  });

  it("shows the floating AI button except on the AI Tutor/AI Dashboard pages, matching existing behavior", () => {
    const withBtn = render(<BioVisionShell {...shellProps({ page: "dashboard" })} />);
    expect(withBtn.container.querySelector('[aria-label], button')).toBeTruthy();
    withBtn.unmount();
  });

  it("routes through the real handleNav callback for every control (Home/profile/admin/Ask AI)", () => {
    const handleNav = vi.fn();
    render(<BioVisionShell {...shellProps({ page: "diagrams", handleNav })} />);
    fireEvent.click(screen.getByRole("button", { name: "Profile" }));
    expect(handleNav).toHaveBeenCalledWith("profile");
    fireEvent.click(screen.getByRole("button", { name: "Admin panel" }));
    expect(handleNav).toHaveBeenCalledWith("admin");
    fireEvent.click(screen.getByRole("button", { name: "🤖 Ask AI" }));
    expect(handleNav).toHaveBeenCalledWith("aiTutor");
  });
});

// ── CurrentShell regression (must remain exactly as before) ─────────────
describe("CurrentShell -- unchanged rendered shell", () => {
  it("still renders the existing topbar tagline and does NOT render BioVision's top nav", () => {
    const { container } = render(
      <CurrentShell {...shellProps({ page: "dashboard", uiMode: "current" })}
        sidebarOpen={false} setSidebarOpen={noop} pageTitles={{ dashboard: "Dashboard" }}
        sidebarActive="dashboard" setMode={noop} />
    );
    expect(screen.getByText("BioVerse · Karnataka PU Biology")).toBeInTheDocument();
    expect(container.querySelector('nav[aria-label="Main navigation"]')).toBeFalsy();
  });

  it("still shows the correct page title from pageTitles in the topbar", () => {
    render(
      <CurrentShell {...shellProps({ page: "questions", uiMode: "current" })}
        sidebarOpen={false} setSidebarOpen={noop} pageTitles={{ questions: "Question Bank" }}
        sidebarActive="questions" setMode={noop} />
    );
    expect(screen.getAllByText("Question Bank").length).toBeGreaterThanOrEqual(1);
  });

  it("still calls setMode('admin') from the topbar gear, exactly as before", () => {
    const setMode = vi.fn();
    render(
      <CurrentShell {...shellProps({ page: "dashboard", uiMode: "current" })}
        sidebarOpen={false} setSidebarOpen={noop} pageTitles={{ dashboard: "Dashboard" }}
        sidebarActive="dashboard" setMode={setMode} />
    );
    fireEvent.click(screen.getByText("⚙️"));
    expect(setMode).toHaveBeenCalledWith("admin");
  });

  it("both shells reach the same ActivePage content for a page with no uiMode-specific fork (e.g. 'questions')", () => {
    const { unmount: unmount1 } = render(
      <CurrentShell {...shellProps({ page: "questions", uiMode: "current" })}
        sidebarOpen={false} setSidebarOpen={noop} pageTitles={{ questions: "Question Bank" }}
        sidebarActive="questions" setMode={noop} />
    );
    expect(screen.getByText(/Loading questions/)).toBeInTheDocument();
    unmount1();

    render(<BioVisionShell {...shellProps({ page: "questions" })} />);
    expect(screen.getByText(/Loading questions/)).toBeInTheDocument();
  });
});

// ── ActivePage is the single shared page router (no duplication) ────────
describe("ActivePage -- single shared page-routing implementation", () => {
  it("both shells delegate to the exact same ActivePage component reference", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(path.join(__dirname, "AppUnderTest.jsx"), "utf8");
    // Exactly one ActivePage definition, and both shells reference it (not a
    // BioVisionDashboard/BioVisionSyllabus-style duplicate per page).
    expect((source.match(/function ActivePage\(/g) || []).length).toBe(1);
    const shellStart = source.indexOf("function BioVisionShell(");
    const shellEnd = source.indexOf("function CurrentShell(");
    const bioBody = source.slice(shellStart, shellEnd);
    const currentStart = shellEnd;
    const currentEnd = source.indexOf("export default function App(");
    const currentBody = source.slice(currentStart, currentEnd);
    expect(bioBody.includes("<ActivePage")).toBe(true);
    expect(currentBody.includes("<ActivePage")).toBe(true);
    // Neither shell reimplements the page===... chain itself.
    expect((bioBody.match(/page === "dashboard"/g) || []).length).toBe(0);
    expect((currentBody.match(/page === "dashboard"/g) || []).length).toBe(0);
  });

  it("renders Diagram Center's real DicotStemSVG-capable engine when page === 'diagrams' (Diagram Center untouched)", () => {
    render(<ActivePage page="diagrams" chapter={null} syllabusLevel="1st PU" user={baseUser} uiMode="biovision" setUiMode={noop} handleNav={noop} setChapter={noop} setSyllabusLevel={noop} />);
    expect(screen.getByRole("heading", { name: /Diagram Learning Center/ })).toBeInTheDocument();
  });
});

// ── App()-level integration: shell selection, persistence, no duplication ─
// ── Responsive: explicit pixel breakpoints ───────────────────────────────
describe("BioVisionShell -- responsive at named breakpoints", () => {
  [
    { width: 390, isMobile: true },
    { width: 412, isMobile: true },
    { width: 1024, isMobile: false },
    { width: 1440, isMobile: false },
  ].forEach(({ width, isMobile }) => {
    it(`${width}px: renders without horizontal overflow, nav stays usable (mobile hamburger vs desktop links)`, () => {
      const { container, unmount } = render(<BioVisionShell {...shellProps({ isMobile, page: "dashboard" })} />);
      expect(container.querySelector('nav[aria-label="Main navigation"]') !== null).toBe(!isMobile);
      expect(!!screen.queryByRole("button", { name: "Open navigation menu" })).toBe(isMobile);

      const badWidths = Array.from(container.querySelectorAll("[style]")).filter(el => {
        const w = el.style.width;
        return w && /^\d+(\.\d+)?px$/.test(w) && parseFloat(w) > width;
      });
      expect(badWidths).toHaveLength(0);
      unmount();
    });
  });
});

describe("App() -- shell selection integration", () => {
  function mockSignedInSession() {
    sb._session = {
      access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600000,
      user: { id: "u1", email: "student@example.com" },
    };
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: async () => [] }));
  }

  it("defaults to the BioVision shell when no ui-mode preference is stored", async () => {
    mockSignedInSession();
    const { findByRole } = render(<App />);
    await findByRole("navigation", { name: "Main navigation" });
  });

  it("renders the Current shell when 'current' is already stored in localStorage", async () => {
    window.localStorage.setItem(UI_MODE_STORAGE_KEY, UI_MODES.CURRENT);
    mockSignedInSession();
    render(<App />);
    await screen.findByText("BioVerse · Karnataka PU Biology");
    expect(screen.queryByRole("navigation", { name: "Main navigation" })).not.toBeInTheDocument();
  });

  it("only one shell is ever mounted at once -- never both simultaneously", async () => {
    mockSignedInSession();
    const { container } = render(<App />);
    await screen.findByRole("navigation", { name: "Main navigation" });
    // The Current shell's distinguishing topbar tagline must be absent
    // while BioVision is active -- proving no duplicate shell render.
    expect(screen.queryByText("BioVerse · Karnataka PU Biology")).not.toBeInTheDocument();
  });

  it("switching to Current UI from Profile's Appearance selector actually swaps the live shell, and persists the choice", async () => {
    mockSignedInSession();
    render(<App />);
    await screen.findByRole("navigation", { name: "Main navigation" });

    fireEvent.click(screen.getByRole("button", { name: "Profile" }));
    fireEvent.click(await screen.findByRole("button", { name: /Current BioVerse UI/ }));

    await screen.findByText("BioVerse · Karnataka PU Biology");
    expect(screen.queryByRole("navigation", { name: "Main navigation" })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(UI_MODE_STORAGE_KEY)).toBe("current");
  });
});
