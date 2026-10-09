import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Dashboard, BioVisionHome, ProfileView, TestsView, RewardsStore, sb } from "./AppUnderTest.jsx";

const here = path.dirname(fileURLToPath(import.meta.url));
const appSrc = fs.readFileSync(path.join(here, "..", "src", "App.jsx"), "utf8");
const USER = { id: "u1", full_name: "Priya Sharma", xp: 120, streak: 3, email: "p@example.com", subscription_plan: "free" };
const NO_PREMIUM = /premium|upgrade|free plan|razorpay|go pro/i;

let originalFetch;
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  originalFetch = global.fetch;
  global.fetch = vi.fn(async (url) => {
    const u = String(url);
    const body = u.includes("/rest/v1/tests")
      ? [{ id: "t1", title: "Cell Test", test_type: "Chapter", total_questions: 10, time_limit: 15, difficulty: "Easy", is_premium: true }]
      : [];
    return { ok: true, status: 200, json: async () => body };
  });
  sb._session = null;
});
afterEach(() => { vi.restoreAllMocks(); global.fetch = originalFetch; cleanup(); });

describe("Premium removal -- rendered student UI", () => {
  it("Current UI Dashboard has no Premium/Upgrade UI (free and premium-plan users)", async () => {
    for (const plan of ["free", "premium_yearly"]) {
      const { container, unmount } = render(<Dashboard user={{ ...USER, subscription_plan: plan }} onNav={() => {}} />);
      await waitFor(() => expect(screen.getByText("Your Courses")).toBeInTheDocument());
      expect(container.textContent).not.toMatch(NO_PREMIUM);
      unmount();
    }
  });

  it("BioVision home has no Premium/Upgrade UI", async () => {
    const { container } = render(<BioVisionHome user={USER} onNav={() => {}} />);
    await waitFor(() => expect(container.textContent.length).toBeGreaterThan(0));
    expect(container.textContent).not.toMatch(NO_PREMIUM);
  });

  it("Profile (Current + BioVision) has no plan badge or Premium/Upgrade UI", async () => {
    for (const mode of ["current", "biovision"]) {
      const { container, unmount } = render(<ProfileView user={USER} uiMode={mode} onUiModeChange={() => {}} />);
      await waitFor(() => expect(screen.getByText("Interface Style")).toBeInTheDocument());
      expect(container.textContent).not.toMatch(NO_PREMIUM);
      unmount();
    }
  });

  it("Tests list shows no Premium lock/badge even when a test row has is_premium", async () => {
    const { container } = render(<TestsView />);
    await waitFor(() => expect(screen.getByText("Cell Test")).toBeInTheDocument());
    expect(container.textContent).not.toMatch(NO_PREMIUM);
  });

  it("Rewards Store has no Premium rewards but still lists free rewards", () => {
    const { container } = render(<RewardsStore userXP={5000} />);
    expect(container.textContent).not.toMatch(NO_PREMIUM);
    expect(screen.getByText("Exclusive Notes PDF")).toBeInTheDocument();
  });
});

describe("Premium removal -- source", () => {
  it("no student Premium helpers/components remain referenced", () => {
    expect(appSrc).not.toMatch(/Razorpay|razorpay/);
    expect(appSrc).not.toMatch(/isPremium/);
    expect(appSrc).not.toMatch(/getSubscription/);
    expect(appSrc).not.toMatch(/is_premium/);
    expect(appSrc).not.toMatch(/Go Premium|Upgrade Now|Upgrade to Premium|Start Premium|Simple Pricing/);
  });
  it("admin subscription infrastructure is retained", () => {
    expect(appSrc).toMatch(/function SubscriptionManager\(/);
    expect(appSrc).toMatch(/premiumStudents/);
  });
});
