import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import App, {
  RoleSelect, BioVisionShell, CurrentShell, BioVisionNav, BIOVISION_NAV_ITEMS,
  ProfileView, sb, UI_MODE_STORAGE_KEY,
} from "./AppUnderTest.jsx";

const noop = () => {};
const user = { id: "u1", full_name: "Test Student", xp: 120, role: "student" };
const TEACHER = /teacher/i;

let originalFetch;
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  originalFetch = global.fetch;
  try { window.localStorage.clear(); } catch {}
  sb._session = null;
});
afterEach(() => {
  global.fetch = originalFetch;
  sb._session = null;
  vi.restoreAllMocks();
  cleanup();
});

function mockBackend({ loginOk = true } = {}) {
  const json = (body, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
  global.fetch = vi.fn((url) => {
    const u = String(url);
    if (u.includes("/auth/v1/token")) {
      return loginOk
        ? json({ access_token: "student-token", refresh_token: "r", expires_in: 3600, user: { id: "u1", email: "s@bioverse.in" } })
        : json({ error_description: "Invalid login credentials" }, 400);
    }
    if (u.includes("/rest/v1/users")) return json([{ id: "u1", email: "s@bioverse.in", full_name: "Test Student", role: "student", xp: 0, streak: 0, subscription_plan: "free" }]);
    return json([]);
  });
}

describe("Teacher removal -- portal selection (first screen)", () => {
  it("RoleSelect offers only Student and Super Admin -- no Teacher card, button or text", () => {
    const onRole = vi.fn();
    const { container } = render(<RoleSelect onRole={onRole} />);
    expect(container.textContent).not.toMatch(TEACHER);
    expect(screen.getByText("Student Portal")).toBeInTheDocument();
    expect(screen.getByText("Super Admin Portal")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Continue as/i }).length).toBe(2);
    expect(screen.queryByRole("button", { name: /teacher/i })).toBeNull();
  });

  it("the remaining portals still route correctly (student and admin entries exist)", () => {
    const onRole = vi.fn();
    render(<RoleSelect onRole={onRole} />);
    fireEvent.click(screen.getByRole("button", { name: /Continue as Student/i }));
    expect(onRole).toHaveBeenLastCalledWith("student");
    fireEvent.click(screen.getByRole("button", { name: /Continue as Super Admin/i }));
    expect(onRole).toHaveBeenLastCalledWith("admin");
    expect(onRole).toHaveBeenCalledTimes(2);
  });

  it("the full app opens on the portal screen with no Teacher entry", async () => {
    mockBackend();
    const { container } = render(<App />);
    await screen.findByText("Student Portal");
    expect(container.textContent).not.toMatch(TEACHER);
  });
});

describe("Teacher removal -- login / signup surfaces", () => {
  it("student login and signup screens contain no Teacher text", async () => {
    mockBackend();
    const { container } = render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /Continue as Student/i }));
    await screen.findByText("Login to BioVerse");
    expect(container.textContent).not.toMatch(TEACHER);
    fireEvent.click(screen.getByText("Create account"));
    await screen.findByText("Create Account");
    expect(container.textContent).not.toMatch(TEACHER);
  });

  it("STUDENT LOGIN STILL WORKS: valid credentials sign in, store the session and leave the auth screen", async () => {
    mockBackend();
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /Continue as Student/i }));
    fireEvent.change(await screen.findByPlaceholderText("you@email.com"), { target: { value: "s@bioverse.in" } });
    fireEvent.change(screen.getByPlaceholderText("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByText("Login to BioVerse"));
    await waitFor(() => expect(sb._session?.access_token).toBe("student-token"));
    await waitFor(() => expect(screen.queryByText("Login to BioVerse")).toBeNull());
    expect(screen.getAllByText(/Chapters/).length).toBeGreaterThan(0); // BioVision nav -- inside the student app
  });

  it("student login still rejects bad credentials with an error and stays on the form", async () => {
    mockBackend({ loginOk: false });
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /Continue as Student/i }));
    fireEvent.change(await screen.findByPlaceholderText("you@email.com"), { target: { value: "s@bioverse.in" } });
    fireEvent.change(screen.getByPlaceholderText("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByText("Login to BioVerse"));
    await screen.findByText(/Invalid login credentials/i);
    expect(sb._session).toBeNull();
  });

  it("ADMIN ENTRY STILL EXISTS: Continue as Super Admin opens the admin login", async () => {
    mockBackend();
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /Continue as Super Admin/i }));
    await screen.findByText("Login to Admin Panel");
    expect(screen.getByText("BioVerse Admin")).toBeInTheDocument();
  });
});

describe("Teacher removal -- student interface (Current UI, BioVision UI, desktop + mobile)", () => {
  const shellProps = (o = {}) => ({
    user, page: "dashboard", chapter: null, syllabusLevel: "1st PU", isMobile: false,
    uiMode: "biovision", setUiMode: noop, setChapter: noop, setSyllabusLevel: noop, handleNav: noop, ...o,
  });

  it("BioVision shell (desktop + mobile) has no Teacher entry anywhere", () => {
    mockBackend();
    [false, true].forEach(isMobile => {
      const { container, unmount } = render(<BioVisionShell {...shellProps({ isMobile })} />);
      expect(container.textContent).not.toMatch(TEACHER);
      unmount();
    });
  });

  it("Current UI shell (sidebar + top bar, desktop + mobile) has no Teacher entry anywhere", () => {
    mockBackend();
    [false, true].forEach(isMobile => {
      const { container, unmount } = render(
        <CurrentShell {...shellProps({ isMobile, uiMode: "current" })} sidebarOpen={isMobile} setSidebarOpen={noop}
          pageTitles={{ dashboard: "Dashboard" }} sidebarActive="dashboard" setMode={noop} />
      );
      expect(container.textContent).not.toMatch(TEACHER);
      unmount();
    });
  });

  it("BioVision nav items and the rendered desktop/mobile nav have no Teacher destination", () => {
    BIOVISION_NAV_ITEMS.forEach(i => { expect(i.label).not.toMatch(TEACHER); expect(i.navKey).not.toMatch(TEACHER); });
    ["desktop", "mobile"].forEach(kind => {
      const { container, unmount } = render(
        <BioVisionNav page="dashboard" isMobile={kind === "mobile"} user={user} onNav={noop}
          mobileNavOpen={kind === "mobile"} onToggleMobileNav={noop} onCloseMobileNav={noop} />
      );
      expect(container.textContent).not.toMatch(TEACHER);
      unmount();
    });
  });

  it("Profile / Settings (both interface modes) has no Teacher section", async () => {
    mockBackend();
    const { container } = render(<ProfileView user={user} uiMode="biovision" setUiMode={noop} />);
    await waitFor(() => expect(container.textContent.length).toBeGreaterThan(50));
    expect(container.textContent).not.toMatch(TEACHER);
  });

  it("a Teacher page is unreachable: unknown teacher page keys render no teacher content in either shell (title fallback neutralised so the key itself is not echoed)", () => {
    mockBackend();
    ["teacher", "teacherAuth", "teacherPanel", "teacherDashboard"].forEach(page => {
      [["biovision", BioVisionShell], ["current", CurrentShell]].forEach(([uiMode, Shell]) => {
        const extra = uiMode === "current" ? { sidebarOpen: false, setSidebarOpen: noop, pageTitles: { [page]: "Page" }, sidebarActive: page, setMode: noop } : {};
        const { container, unmount } = render(<Shell {...shellProps({ page, uiMode })} {...extra} />);
        expect(container.textContent).not.toMatch(TEACHER);
        unmount();
      });
    });
  });
});

describe("Teacher removal -- source guarantees (frontend only; backend roles untouched)", () => {
  it("TeacherAuth, the teacherAuth screen, the Teacher Portal card and the teacher route are gone from the app source", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "AppUnderTest.jsx"), "utf8");
    expect(src).not.toMatch(/function TeacherAuth\b/);
    expect(src).not.toMatch(/<TeacherAuth\b/);
    expect(src).not.toContain('"teacherAuth"');
    expect(src).not.toContain("Teacher Portal");
    expect(src).not.toContain("Continue as Teacher");
    expect(src).not.toMatch(/role === "teacher"/);
    // still present: student + admin auth, and the first-screen role routing for them
    expect(src).toMatch(/function StudentAuth\b/);
    expect(src).toMatch(/function AdminLoginGated\b/);
    expect(src).toMatch(/if \(role === "admin"\)/);
  });
});
