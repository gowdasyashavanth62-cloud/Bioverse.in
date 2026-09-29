import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { SyllabusView, ChapterPage, sb } from "./AppUnderTest.jsx";

const FRESH_SESSION = () => ({
  access_token: "valid-token",
  refresh_token: "refresh-token",
  expires_at: Date.now() + 60 * 60 * 1000, // an hour from now — not expired
  user: { id: "user-1", email: "student@example.com" },
});

const EXPIRED_SESSION = () => ({
  access_token: "stale-expired-token",
  refresh_token: "refresh-token",
  expires_at: Date.now() - 5000, // already expired — simulates reopening the app after long inactivity
  user: { id: "user-1", email: "student@example.com" },
});

let consoleErrorSpy;
let originalFetch;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  originalFetch = global.fetch;
  sb._session = null;
  try { window.localStorage.clear(); } catch {}
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  global.fetch = originalFetch;
  sb._session = null;
  cleanup();
});

describe("Content hydration — real query failure vs genuinely-empty vs content-coming-soon", () => {
  it("SyllabusView shows a real error + retry state when the units query fails (e.g. RLS/expired-JWT 401), NOT the static fallback syllabus", async () => {
    sb._session = FRESH_SESSION();
    global.fetch = vi.fn((url) => {
      if (String(url).includes("/rest/v1/units")) {
        return Promise.resolve({ ok: false, status: 401, json: async () => ({ message: "JWT expired" }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(<SyllabusView level="1st PU" onChapter={() => {}} />);

    await waitFor(() => expect(screen.getByText(/Couldn't load the syllabus/i)).toBeInTheDocument());
    expect(screen.getByText(/Retry/i)).toBeInTheDocument();
    // Must NOT silently fall back to the static "content coming soon" path.
    expect(screen.queryByText(/The Living World/i)).not.toBeInTheDocument();
  });

  it("SyllabusView falls back to the static syllabus only when the query genuinely succeeds with zero rows", async () => {
    sb._session = FRESH_SESSION();
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: async () => [] }));

    render(<SyllabusView level="1st PU" onChapter={() => {}} />);

    await waitFor(() => expect(screen.getByText(/The Living World/i)).toBeInTheDocument());
    expect(screen.queryByText(/Couldn't load the syllabus/i)).not.toBeInTheDocument();
  });

  it("ChapterPage shows error + retry (not 'content coming soon') when a real DB-linked chapter's content fetch fails", async () => {
    sb._session = FRESH_SESSION();
    global.fetch = vi.fn((url) => {
      if (String(url).includes("/rest/v1/videos")) {
        return Promise.resolve({ ok: false, status: 500, json: async () => ({ message: "Internal error" }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const chapter = { id: "real-chapter-uuid", chapter_name: "Cell: The Unit of Life" };
    render(<ChapterPage chapter={chapter} level="1st PU" onBack={() => {}} />);

    await waitFor(() => expect(screen.getByText(/Couldn't load "Cell: The Unit of Life"/i)).toBeInTheDocument());
    expect(screen.getByText(/Retry/i)).toBeInTheDocument();
    expect(screen.queryByText(/hasn't linked this chapter/i)).not.toBeInTheDocument();
  });

  it("ChapterPage still shows 'content coming soon' for a genuinely unlinked (_staticFallback) chapter", async () => {
    sb._session = FRESH_SESSION();
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: async () => [] }));

    const chapter = { id: "static-1", title: "The Living World", _staticFallback: true };
    render(<ChapterPage chapter={chapter} level="1st PU" onBack={() => {}} />);

    await waitFor(() => expect(screen.getByText(/hasn't linked this chapter/i)).toBeInTheDocument());
  });
});

describe("Session restoration — expired JWT is refreshed instead of silently failing every request", () => {
  it("sb._ensureFreshSession exchanges the refresh_token for a new access_token when the stored session is expired", async () => {
    sb._session = EXPIRED_SESSION();
    const refreshCall = vi.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({ access_token: "new-fresh-token", refresh_token: "new-refresh-token", expires_in: 3600, user: EXPIRED_SESSION().user }),
    }));
    global.fetch = vi.fn((url) => {
      if (String(url).includes("grant_type=refresh_token")) return refreshCall();
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    await sb._ensureFreshSession();

    expect(refreshCall).toHaveBeenCalledTimes(1);
    expect(sb._session.access_token).toBe("new-fresh-token");
    expect(sb._session.expires_at).toBeGreaterThan(Date.now());
  });

  it("a reopened app with an expired token still loads real syllabus content, instead of the request silently failing", async () => {
    sb._session = EXPIRED_SESSION();
    const realUnits = [{ id: "unit-1", name: "Unit I", order_number: 1, chapters: [{ id: "ch-1", chapter_name: "The Living World" }] }];

    global.fetch = vi.fn((url) => {
      const u = String(url);
      if (u.includes("grant_type=refresh_token")) {
        return Promise.resolve({ ok: true, json: async () => ({ access_token: "new-fresh-token", refresh_token: "new-refresh-token", expires_in: 3600, user: EXPIRED_SESSION().user }) });
      }
      if (u.includes("/rest/v1/units")) {
        return Promise.resolve({ ok: true, json: async () => realUnits });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(<SyllabusView level="1st PU" onChapter={() => {}} />);

    // Real DB content loads successfully post-refresh — no error, no false "coming soon".
    await waitFor(() => expect(screen.getByText("Unit I")).toBeInTheDocument());
    expect(screen.queryByText(/Couldn't load the syllabus/i)).not.toBeInTheDocument();
  });
});
