import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { callBioAI, sb, AITutor } from "./AppUnderTest.jsx";

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

const okResponse = (text = "Hello from the tutor") =>
  new Response(JSON.stringify({ text }), { status: 200, headers: { "Content-Type": "application/json" } });
const errResponse = (status, error = "x") =>
  new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json" } });

let fetchMock;
let savedSession;
beforeEach(() => {
  savedSession = sb._session;
  sb._session = { access_token: "user-jwt-123", refresh_token: "r", expires_at: Date.now() + 3_600_000, user: { id: "u1" } };
  fetchMock = vi.fn(async () => okResponse());
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  sb._session = savedSession;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  cleanup();
});

const lastCall = () => {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url, init, body: JSON.parse(init.body) };
};

describe("callBioAI  authenticated request to the ai-tutor function", () => {
  it("sends the signed-in user's access token, not the public anon key", async () => {
    await callBioAI([{ role: "user", content: "What is ATP?" }]);
    const { url, init } = lastCall();
    expect(url).toMatch(/\/functions\/v1\/ai-tutor$/);
    expect(init.headers.Authorization).toBe("Bearer user-jwt-123");
    expect(init.headers.Authorization).not.toContain(sb._key);
  });

  it("never sends a client-defined system prompt", async () => {
    await callBioAI([{ role: "user", content: "hi" }], { chapter: "Ecosystem", level: "1st PU", language: "English" });
    const { body } = lastCall();
    for (const k of ["system", "systemPrompt", "developer", "instructions"]) expect(body).not.toHaveProperty(k);
    expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
  });

  it("sends only chapter/level/language as context (and omits context when none is given)", async () => {
    await callBioAI([{ role: "user", content: "hi" }], { chapter: "Cell: The Unit of Life", level: "2nd PU", language: "Kannada" });
    expect(lastCall().body.context).toEqual({ chapter: "Cell: The Unit of Life", level: "2nd PU", language: "Kannada" });
    await callBioAI([{ role: "user", content: "hi" }]);
    expect(lastCall().body).not.toHaveProperty("context");
  });

  it("does not call the backend and asks the user to log in when there is no session", async () => {
    sb._session = null;
    await expect(callBioAI([{ role: "user", content: "hi" }])).rejects.toThrow(/log in/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps 401 to a login message and 429 to a rate-limit message", async () => {
    fetchMock.mockResolvedValueOnce(errResponse(401, "Authentication required."));
    await expect(callBioAI([{ role: "user", content: "hi" }])).rejects.toThrow(/log in/i);
    fetchMock.mockResolvedValueOnce(errResponse(429, "slow down"));
    await expect(callBioAI([{ role: "user", content: "hi" }])).rejects.toThrow(/too quickly/i);
  });

  it("keeps the generic unavailable message for server/provider failures and never echoes internals", async () => {
    for (const status of [500, 502, 503, 504]) {
      fetchMock.mockResolvedValueOnce(errResponse(status, "internal GEMINI_API_KEY details"));
      await expect(callBioAI([{ role: "user", content: "hi" }])).rejects.toThrow("AI Tutor is temporarily unavailable. Please try again.");
    }
  });

  it("returns the AI text on success", async () => {
    fetchMock.mockResolvedValueOnce(okResponse("ATP is the energy currency."));
    await expect(callBioAI([{ role: "user", content: "hi" }])).resolves.toBe("ATP is the energy currency.");
  });
});

describe("AITutor chat  UI behaviour preserved, context now sent as structured fields", () => {
  const setup = (props = {}) =>
    render(<AITutor currentChapter="Cell: The Unit of Life" currentLevel="2nd PU" user={{ name: "Test" }} {...props} />);

  it("sending a message shows the AI reply and passes chapter + level as context", async () => {
    fetchMock.mockResolvedValueOnce(okResponse("Mitochondria make ATP."));
    setup();
    const input = screen.getByPlaceholderText(/Ask anything about Biology/i);
    fireEvent.change(input, { target: { value: "Explain mitochondria" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() => expect(screen.getByText(/Mitochondria make ATP\./)).toBeInTheDocument());
    const { body, init } = lastCall();
    expect(init.headers.Authorization).toBe("Bearer user-jwt-123");
    expect(body.context).toMatchObject({ chapter: "Cell: The Unit of Life", level: "2nd PU", language: "English" });
    expect(body).not.toHaveProperty("system");
    expect(body.messages[body.messages.length - 1]).toEqual({ role: "user", content: "Explain mitochondria" });
  });

  it("Enter sends the message (existing behaviour)", async () => {
    setup();
    const input = screen.getByPlaceholderText(/Ask anything about Biology/i);
    fireEvent.change(input, { target: { value: "What is DNA?" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("shows the existing friendly error message when the backend rejects the request", async () => {
    fetchMock.mockResolvedValueOnce(errResponse(401, "Authentication required."));
    setup();
    fireEvent.change(screen.getByPlaceholderText(/Ask anything about Biology/i), { target: { value: "hi" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() => expect(screen.getByText(/having trouble connecting right now/i)).toBeInTheDocument());
  });
});
