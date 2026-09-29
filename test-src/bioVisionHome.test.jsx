import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { BioVisionHome, Dashboard, ProfileView, sb } from "./AppUnderTest.jsx";

const REAL_USER = { full_name: "Priya Sharma", xp: 4820, streak: 12, email: "priya@example.com", subscription_plan: "free" };

let consoleErrorSpy;
let originalFetch;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  originalFetch = global.fetch;
  sb._session = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600000, user: { id: "u1" } };
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
  global.fetch = originalFetch;
  sb._session = null;
  cleanup();
});

function mockFetch({ results = [], units = [], sub = null, profile = null } = {}) {
  global.fetch = vi.fn((url) => {
    const u = String(url);
    if (u.includes("/rest/v1/users")) return Promise.resolve({ ok: true, json: async () => profile ? [profile] : [] });
    if (u.includes("/rest/v1/results")) return Promise.resolve({ ok: true, json: async () => results });
    if (u.includes("/rest/v1/units")) return Promise.resolve({ ok: true, json: async () => units });
    if (u.includes("/rest/v1/subscriptions")) return Promise.resolve({ ok: true, json: async () => sub ? [sub] : [] });
    return Promise.resolve({ ok: true, json: async () => [] });
  });
}

describe("BioVisionHome -- real user greeting, no generic placeholder", () => {
  it("shows the real logged-in user's first name in the hero heading", async () => {
    mockFetch();
    render(<BioVisionHome user={REAL_USER} onNav={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Priya/)).toBeInTheDocument());
    expect(screen.queryByText(/Hi Engineer/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Welcome back, Student")).not.toBeInTheDocument();
  });

  it("falls back to the existing safe default ('Student') only when no name is available at all", async () => {
    mockFetch();
    render(<BioVisionHome user={{ xp: 0 }} onNav={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Welcome back,/)).toBeInTheDocument());
    expect(screen.getByText("Student")).toBeInTheDocument();
  });
});

describe("BioVisionHome -- real statistics only, nothing invented", () => {
  it("shows the real streak, XP, and test count -- not the reference HTML's Class 12 numbers", async () => {
    mockFetch({ results: [{ id: "r1", score: 8, total: 10, tests: { title: "Cell Biology Test" } }] });
    render(<BioVisionHome user={REAL_USER} onNav={() => {}} />);
    await waitFor(() => expect(screen.getByText("12 days")).toBeInTheDocument());
    expect(screen.getByText("4,820")).toBeInTheDocument(); // real XP, toLocaleString'd
    expect(screen.getAllByText("80%").length).toBeGreaterThanOrEqual(1); // avg-score card (and the single result row)
    expect(screen.queryByText("13/13")).not.toBeInTheDocument();
    expect(screen.queryByText("63")).not.toBeInTheDocument();
    expect(screen.queryByText(/Visualizers/)).not.toBeInTheDocument();
    expect(screen.queryByText(/100% Free & Offline/)).not.toBeInTheDocument();
    expect(screen.queryByText(/NCERT Aligned/)).not.toBeInTheDocument();
  });

  it("shows '—' avg score and a real empty-results state when no tests have been taken, rather than a fabricated number", async () => {
    mockFetch({ results: [] });
    render(<BioVisionHome user={REAL_USER} onNav={() => {}} />);
    await waitFor(() => expect(screen.getByText("—")).toBeInTheDocument());
    expect(screen.getByText("No tests taken yet")).toBeInTheDocument();
  });
});

describe("BioVisionHome -- real chapter data, no hardcoded Class 12 content", () => {
  it("renders real BioVerse units when available, not a hardcoded chapter array", async () => {
    mockFetch({ units: [{ id: "u1", name: "Diversity of Living Organisms", level: "1st PU", icon: "🌿", chapters: [1,2,3] }] });
    render(<BioVisionHome user={REAL_USER} onNav={() => {}} />);
    await waitFor(() => expect(screen.getByText("Diversity of Living Organisms")).toBeInTheDocument());
    expect(screen.getByText("1st PU · 3 chapters")).toBeInTheDocument();
    // None of the reference HTML's Class 12 chapter names leak in.
    expect(screen.queryByText(/Reproduction/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Genetics.{0,20}Evolution/)).not.toBeInTheDocument();
  });

  it("uses the existing safe fallback course list when no units are available yet, not fabricated data", async () => {
    mockFetch({ units: [] });
    render(<BioVisionHome user={REAL_USER} onNav={() => {}} />);
    await waitFor(() => expect(screen.getByText("1st PU Biology")).toBeInTheDocument());
    expect(screen.getByText("2nd PU Biology")).toBeInTheDocument();
    expect(screen.getByText("KCET Preparation")).toBeInTheDocument();
    expect(screen.getByText("NEET Preparation")).toBeInTheDocument();
  });

  it("clicking a real chapter unit navigates via the existing onNav mechanism with the correct existing page key", async () => {
    mockFetch({ units: [{ id: "u1", name: "Plant Physiology", level: "2nd PU", icon: "🌱", chapters: [1] }] });
    const onNav = vi.fn();
    render(<BioVisionHome user={REAL_USER} onNav={onNav} />);
    await waitFor(() => expect(screen.getByText("Plant Physiology")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Plant Physiology").closest("button"));
    expect(onNav).toHaveBeenCalledWith("2ndPU");
  });
});

describe("BioVisionHome -- navigation wiring (every CTA uses the real navigation system)", () => {
  it("Continue Learning routes to 1stPU by default when no units are loaded", async () => {
    mockFetch({ units: [] });
    const onNav = vi.fn();
    render(<BioVisionHome user={REAL_USER} onNav={onNav} />);
    await waitFor(() => expect(screen.getByText("Continue Learning →")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Continue Learning →"));
    expect(onNav).toHaveBeenCalledWith("1stPU");
  });

  it("Take a Quiz routes to the existing Game Hub page key", async () => {
    mockFetch();
    const onNav = vi.fn();
    render(<BioVisionHome user={REAL_USER} onNav={onNav} />);
    await waitFor(() => expect(screen.getByText("Take a Quiz")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Take a Quiz"));
    expect(onNav).toHaveBeenCalledWith("gameHub");
  });

  it("every Quick Access card routes to its correct existing page key (Practice/PYQ's/Flashcards/Quiz/Diagram Center/AI Tutor)", async () => {
    mockFetch();
    const onNav = vi.fn();
    render(<BioVisionHome user={REAL_USER} onNav={onNav} />);
    await waitFor(() => expect(screen.getByText("Quick access")).toBeInTheDocument());
    const expected = [
      ["Practice", "questions"], ["PYQ's", "pyq"], ["Flashcards", "flashcards"],
      ["Quiz", "gameHub"], ["Diagram Center", "diagrams"], ["AI Tutor", "aiTutor"],
    ];
    for (const [label, key] of expected) {
      fireEvent.click(screen.getByText(label).closest("button"));
      expect(onNav).toHaveBeenCalledWith(key);
    }
  });

  it("'Browse Tests' in the empty-results state routes to the existing tests page", async () => {
    mockFetch({ results: [] });
    const onNav = vi.fn();
    render(<BioVisionHome user={REAL_USER} onNav={onNav} />);
    await waitFor(() => expect(screen.getByText("Browse Tests")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Browse Tests"));
    expect(onNav).toHaveBeenCalledWith("tests");
  });

  it("does not introduce any fake/placeholder page destinations beyond existing keys", async () => {
    mockFetch();
    const onNav = vi.fn();
    const { container } = render(<BioVisionHome user={REAL_USER} onNav={onNav} />);
    await waitFor(() => expect(screen.getByText("Quick access")).toBeInTheDocument());
    const buttons = Array.from(container.querySelectorAll("button"));
    const knownKeys = ["1stPU", "2ndPU", "kcet", "neet", "gameHub", "questions", "pyq", "flashcards", "diagrams", "aiTutor", "tests"];
    buttons.forEach(b => fireEvent.click(b));
    onNav.mock.calls.forEach(call => expect(knownKeys).toContain(call[0]));
  });
});

describe("BioVisionHome -- Diagram Center / AI Tutor are entry points only", () => {
  it("the Diagram Center card is a plain navigation entry, not an embedded DiagramGame instance", async () => {
    mockFetch();
    render(<BioVisionHome user={REAL_USER} onNav={() => {}} />);
    await waitFor(() => expect(screen.getByText("Diagram Center")).toBeInTheDocument());
    expect(document.querySelector("svg[aria-label*='diagram' i]")).toBeNull();
  });

  it("the AI Tutor card is a plain navigation entry, not an embedded chat interface", async () => {
    mockFetch();
    render(<BioVisionHome user={REAL_USER} onNav={() => {}} />);
    await waitFor(() => expect(screen.getByText("AI Tutor")).toBeInTheDocument());
    expect(screen.queryByPlaceholderText(/ask.*biology/i)).not.toBeInTheDocument();
  });
});

describe("Current UI Dashboard -- unchanged", () => {
  it("Dashboard still renders its original heading/greeting/premium-banner behavior, using the same shared data hook", async () => {
    mockFetch({ results: [{ id: "r1", score: 8, total: 10, tests: { title: "Cell Biology Test" } }] });
    render(<Dashboard user={REAL_USER} onNav={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Welcome back, Priya/)).toBeInTheDocument());
    expect(screen.getByText("Your Courses")).toBeInTheDocument();
    expect(screen.getByText("Recent Test Results")).toBeInTheDocument();
    // Dashboard's own vertical "Your Courses" list, not BioVisionHome's hero/quick-access layout.
    expect(screen.queryByText("Quick access")).not.toBeInTheDocument();
    expect(screen.queryByText("Continue Learning →")).not.toBeInTheDocument();
  });

  it("Dashboard's rendered stat values are identical to BioVisionHome's for the same underlying data (shared hook, no divergent computation)", async () => {
    mockFetch({ results: [{ id: "r1", score: 9, total: 10, tests: { title: "Test" } }] });
    const { unmount } = render(<Dashboard user={REAL_USER} onNav={() => {}} />);
    await waitFor(() => expect(screen.getAllByText("90%").length).toBeGreaterThanOrEqual(1));
    const dashboardCount = screen.getAllByText("90%").length;
    unmount();

    render(<BioVisionHome user={REAL_USER} onNav={() => {}} />);
    await waitFor(() => expect(screen.getAllByText("90%").length).toBeGreaterThanOrEqual(1));
    expect(screen.getAllByText("90%").length).toBe(dashboardCount);
  });
});

describe("BioVisionHome -- responsive", () => {
  const setWidth = (w) => { window.innerWidth = w; window.dispatchEvent(new Event("resize")); };

  [390, 412, 768, 1024, 1440].forEach(width => {
    it(`${width}px: renders without horizontal overflow`, async () => {
      setWidth(width);
      mockFetch({ units: [{ id: "u1", name: "Human Physiology", level: "1st PU", icon: "🧬", chapters: [1,2] }] });
      const { container, unmount } = render(<BioVisionHome user={REAL_USER} onNav={() => {}} />);
      await waitFor(() => expect(screen.getByText("Human Physiology")).toBeInTheDocument());

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

describe("BioVisionHome -- semantics / accessibility", () => {
  it("uses a real <h1> for the hero and real <h2> section headings, real buttons for every CTA", async () => {
    mockFetch();
    const { container } = render(<BioVisionHome user={REAL_USER} onNav={() => {}} />);
    await waitFor(() => expect(container.querySelector("h1")).toBeTruthy());
    expect(container.querySelectorAll("h2").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Continue Learning →").tagName.toLowerCase()).toBe("button");
    expect(screen.getByText("Practice").closest("button")).toBeTruthy();
  });
});

describe("BioVision UI -- Teacher / Upgrade / Premium removed", () => {
  it("BioVisionHome shows no Upgrade banner, Premium CTA, plan label, or Teacher section for a free-plan user", async () => {
    mockFetch({ units: [{ id: "u1", name: "Plant Physiology", level: "1st PU", icon: "🌱", chapters: [1] }] });
    const { container } = render(<BioVisionHome user={REAL_USER} onNav={() => {}} />);
    await waitFor(() => expect(screen.getByText("Plant Physiology")).toBeInTheDocument());
    expect(container.textContent).not.toMatch(/upgrade|premium|free plan|teacher|razorpay/i);
    expect(screen.queryByText(/999/)).not.toBeInTheDocument();
  });

  it("BioVisionHome shows none of it for a premium user either", async () => {
    mockFetch();
    const { container } = render(<BioVisionHome user={{ ...REAL_USER, subscription_plan: "premium_yearly" }} onNav={() => {}} />);
    await waitFor(() => expect(screen.getByText("Quick access")).toBeInTheDocument());
    expect(container.textContent).not.toMatch(/upgrade|premium|teacher/i);
  });

  it("BioVisionHome keeps its learning content: hero, stats, chapters, quick access (incl. AI Tutor), results", async () => {
    mockFetch();
    render(<BioVisionHome user={REAL_USER} onNav={() => {}} />);
    await waitFor(() => expect(screen.getByText("Quick access")).toBeInTheDocument());
    expect(screen.getByText("Continue with your chapters")).toBeInTheDocument();
    expect(screen.getByText("AI Tutor")).toBeInTheDocument();
    expect(screen.getByText("Recent test results")).toBeInTheDocument();
    expect(screen.getByText("12 days")).toBeInTheDocument();
  });

  it("BioVisionHome layout has no empty leftover containers where the banner used to be", async () => {
    mockFetch();
    const { container } = render(<BioVisionHome user={REAL_USER} onNav={() => {}} />);
    await waitFor(() => expect(screen.getByText("Quick access")).toBeInTheDocument());
    const empties = Array.from(container.querySelectorAll("div")).filter(d => d.children.length === 0 && d.textContent === "" && d.style.marginBottom === "26px");
    expect(empties).toHaveLength(0);
  });

  it("ProfileView in BioVision mode hides the plan badge and the Go Premium / Upgrade Now block, but keeps the Interface Style selector", async () => {
    mockFetch({ profile: { id: "u1", full_name: "Priya Sharma", subscription_plan: "free", xp: 4820 }, sub: { plan_name: "free" } });
    const { container } = render(<ProfileView user={REAL_USER} uiMode="biovision" onUiModeChange={() => {}} />);
    await waitFor(() => expect(screen.getByText("Interface Style")).toBeInTheDocument());
    expect(container.textContent).not.toMatch(/go premium|upgrade now|free plan/i);
    expect(screen.getByRole("button", { name: /BioVision-style UI/ })).toBeInTheDocument();
  });

  it("ProfileView in Current mode is unchanged: still shows the plan badge and Go Premium / Upgrade Now block for a free user", async () => {
    mockFetch({ profile: { id: "u1", full_name: "Priya Sharma", subscription_plan: "free", xp: 4820 }, sub: { plan_name: "free" } });
    const { container } = render(<ProfileView user={REAL_USER} uiMode="current" onUiModeChange={() => {}} />);
    await waitFor(() => expect(screen.getByText("Interface Style")).toBeInTheDocument());
    expect(container.textContent).toMatch(/Go Premium/);
    expect(container.textContent).toMatch(/Upgrade Now/);
    expect(container.textContent).toMatch(/Free Plan/);
  });

  it("Current UI Dashboard still shows its Upgrade banner for a free user (Current UI preserved)", async () => {
    mockFetch();
    render(<Dashboard user={REAL_USER} onNav={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Upgrade to Premium/)).toBeInTheDocument());
    expect(screen.getByText("Upgrade Now")).toBeInTheDocument();
  });

  it("backend preserved: useDashboardData still exposes isPremium and the subscription lookup still exists", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "AppUnderTest.jsx"), "utf8");
    expect(src.includes("async getSubscription()")).toBe(true);
    expect(src.includes("function TeacherAuth(")).toBe(true);
    const i = src.indexOf("function useDashboardData(");
    expect(src.slice(i, i + 2500).includes("isPremium")).toBe(true);
  });
});
