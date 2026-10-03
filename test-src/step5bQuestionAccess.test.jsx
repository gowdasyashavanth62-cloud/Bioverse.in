import React from "react";
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import {
  sb, ConnectedQuestionsTab, ConnectedTestsTab, QuestionsView, QuizPlayer, ANSWER_LOCKED_MSG,
} from "./AppUnderTest.jsx";

// ── Source-level guards ────────────────────────────────────────────────────
const APP_SRC = fs.readFileSync(path.resolve(__dirname, "../src/App.jsx"), "utf-8");

function sliceBetween(startMarker, endMarker) {
  const a = APP_SRC.indexOf(startMarker);
  const b = APP_SRC.indexOf(endMarker, a + startMarker.length);
  if (a < 0 || b < 0) throw new Error(`markers not found: ${startMarker} .. ${endMarker}`);
  return APP_SRC.slice(a, b);
}
const SRC = {
  hook:      sliceBetween("function useAnswerReveal()", "function ConnectedQuestionsTab("),
  qTab:      sliceBetween("function ConnectedQuestionsTab(", "function ConnectedTestsTab("),
  testsTab:  sliceBetween("function ConnectedTestsTab(", "const MODE_META = {"),
  qView:     sliceBetween("function QuestionsView()", "function TestsView()"),
};

const QUESTIONS = [
  { id: "q-1", question: "Powerhouse of the cell?", option_a: "q1-a", option_b: "q1-b", option_c: "q1-c", option_d: "q1-d", exam_type: "NEET", difficulty: "Easy", chapter_id: "ch-1" },
  { id: "q-2", question: "Site of photosynthesis?", option_a: "q2-a", option_b: "q2-b", option_c: "q2-c", option_d: "q2-d", exam_type: "KCET", difficulty: "Medium", chapter_id: "ch-1" },
];

let spies = [];
function spy(obj, name, impl) {
  const s = vi.spyOn(obj, name);
  if (impl) s.mockImplementation(impl);
  spies.push(s);
  return s;
}
beforeEach(() => { spies = []; });
afterEach(() => { spies.forEach(s => s.mockRestore()); cleanup(); });

// ── student_questions / student code never touches the answer key ─────────
describe("Step 5B — student question loading is answer-free", () => {
  it("sb.getQuestions and sb.getStudentQuestionBank read the student_questions view, never the questions table", async () => {
    const getSpy = spy(sb, "_get", async () => []);
    await sb.getQuestions("ch-1", "NEET");
    await sb.getStudentQuestionBank();
    expect(getSpy.mock.calls.map(c => c[0])).toEqual(["student_questions", "student_questions"]);
    expect(getSpy.mock.calls[0][1]).toContain("chapter_id=eq.ch-1");
    expect(getSpy.mock.calls[0][1]).toContain("exam_type=eq.NEET");
  });

  it("student components contain no correct_answer reference and never query the questions table", () => {
    for (const [name, code] of Object.entries({ qTab: SRC.qTab, testsTab: SRC.testsTab, qView: SRC.qView })) {
      expect(code, `${name} must not reference correct_answer`).not.toMatch(/correct_answer/);
      expect(code, `${name} must not read the questions table`).not.toMatch(/["'`]questions["'`]\s*[,)]/);
      expect(code, `${name} must not call staff getAllQuestions`).not.toMatch(/getAllQuestions/);
    }
    // ConnectedTestsTab must not grade locally any more.
    expect(SRC.testsTab).not.toMatch(/submitResult/);
    expect(SRC.testsTab).not.toMatch(/indexOf\(q\.correct/);
  });

  it("the reveal hook only ever calls revealAnswer with one question id", () => {
    expect(SRC.hook).toMatch(/sb\.revealAnswer\(questionId\)/);
    expect(SRC.hook).not.toMatch(/Promise\.all/);
    expect(sb.revealAnswer.length).toBe(1);
  });
});

// ── RPC wrapper contracts ──────────────────────────────────────────────────
describe("Step 5B — RPC wrappers", () => {
  it("revealAnswer -> reveal_answer with only p_question_id; returns the first row", async () => {
    const rpc = spy(sb, "_rpc", async () => [{ correct_answer: "B", explanation: "why" }]);
    const r = await sb.revealAnswer("q-1");
    expect(rpc).toHaveBeenCalledWith("reveal_answer", { p_question_id: "q-1" });
    expect(r).toEqual({ correct_answer: "B", explanation: "why" });
  });

  it("getTestQuestions -> get_test_questions with only the test id (client cannot pick questions)", async () => {
    const rpc = spy(sb, "_rpc", async () => [{ question_id: "q-1" }]);
    await sb.getTestQuestions("t-1");
    expect(rpc).toHaveBeenCalledWith("get_test_questions", { p_test_id: "t-1" });
  });

  it("submitTest -> submit_test with answers + time only; never a score or correct_answer", async () => {
    const rpc = spy(sb, "_rpc", async () => [{ score: 2, total: 3, accuracy: 67 }]);
    const r = await sb.submitTest("t-1", { "q-1": "A" }, 90);
    expect(rpc).toHaveBeenCalledWith("submit_test", { p_test_id: "t-1", p_answers: { "q-1": "A" }, p_time_taken: 90 });
    expect(Object.keys(rpc.mock.calls[0][1]).sort()).toEqual(["p_answers", "p_test_id", "p_time_taken"]);
    expect(r).toEqual({ score: 2, total: 3, accuracy: 67 });
  });
});

// ── Chapter Questions tab ──────────────────────────────────────────────────
describe("Step 5B — ConnectedQuestionsTab (chapter questions)", () => {
  it("renders questions and options with no answer or explanation and makes no reveal call on load", () => {
    const reveal = spy(sb, "revealAnswer", async () => ({}));
    render(<ConnectedQuestionsTab questions={QUESTIONS} />);
    expect(screen.getByText("Powerhouse of the cell?")).toBeInTheDocument();
    expect(screen.getByText("q1-a")).toBeInTheDocument();
    expect(screen.queryByText("\u2713")).not.toBeInTheDocument();
    expect(reveal).not.toHaveBeenCalled();
    expect(screen.getAllByRole("button", { name: "Show Answer" })).toHaveLength(2);
  });

  it("Show Answer asks the database for exactly that one question and then shows answer + explanation", async () => {
    const reveal = spy(sb, "revealAnswer", async () => ({ correct_answer: "B", explanation: "Mitochondria make ATP." }));
    render(<ConnectedQuestionsTab questions={QUESTIONS} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Show Answer" })[0]);
    expect(await screen.findByText(/Mitochondria make ATP\./)).toBeInTheDocument();
    expect(reveal).toHaveBeenCalledTimes(1);
    expect(reveal).toHaveBeenCalledWith("q-1");
    expect(screen.getByText("\u2713")).toBeInTheDocument();
    // Hide then show again does not re-hit the database.
    fireEvent.click(screen.getByRole("button", { name: "Hide Answer" }));
    expect(screen.queryByText(/Mitochondria make ATP\./)).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Show Answer" })[0]);
    expect(await screen.findByText(/Mitochondria make ATP\./)).toBeInTheDocument();
    expect(reveal).toHaveBeenCalledTimes(1);
  });

  it("when the database denies (not attempted) the answer is NOT shown and a Game Hub hint appears", async () => {
    spy(sb, "revealAnswer", async () => { throw new Error("Not authorized to view this answer."); });
    render(<ConnectedQuestionsTab questions={QUESTIONS} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Show Answer" })[0]);
    expect(await screen.findByRole("alert")).toHaveTextContent(ANSWER_LOCKED_MSG);
    expect(screen.queryByText("\u2713")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide Answer" })).not.toBeInTheDocument();
  });

  it("a local click cannot fake an attempt: a resolved-but-empty response still shows nothing", async () => {
    spy(sb, "revealAnswer", async () => null);
    render(<ConnectedQuestionsTab questions={QUESTIONS} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Show Answer" })[1]);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("\u2713")).not.toBeInTheDocument();
  });
});

// ── Student Question Bank page ─────────────────────────────────────────────
describe("Step 5B — QuestionsView (student Question Bank)", () => {
  it("loads from the answer-free view + chapters, never getAllQuestions, and reveals through the RPC", async () => {
    const bank = spy(sb, "getStudentQuestionBank", async () => QUESTIONS);
    spy(sb, "getAllChapters", async () => [{ id: "ch-1", chapter_name: "Cell: The Unit of Life" }]);
    const staff = spy(sb, "getAllQuestions", async () => []);
    const reveal = spy(sb, "revealAnswer", async () => ({ correct_answer: "A", explanation: "Because A." }));

    render(<QuestionsView />);
    expect(await screen.findByText("Powerhouse of the cell?")).toBeInTheDocument();
    expect(bank).toHaveBeenCalled();
    expect(staff).not.toHaveBeenCalled();
    expect(screen.getAllByText(/Cell: The Unit of Life/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Because A\./)).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Show Answer" })[0]);
    expect(await screen.findByText(/Because A\./)).toBeInTheDocument();
    expect(reveal).toHaveBeenCalledWith("q-1");
  });
});

// ── Tests tab (server-side delivery + grading) ─────────────────────────────
const TEST = { id: "t-1", title: "Cell Biology Chapter Test", total_questions: 3, time_limit: 10, difficulty: "Easy" };
const TEST_ROWS = [1, 2, 3].map(n => ({
  question_id: `tq-${n}`, question: `Test question ${n}?`,
  option_a: `t${n}-a`, option_b: `t${n}-b`, option_c: `t${n}-c`, option_d: `t${n}-d`,
  exam_type: "NEET", difficulty: "Easy",
}));

describe("Step 5B — ConnectedTestsTab uses server-side delivery and grading", () => {
  it("loads the server-chosen set via get_test_questions (not chapter questions) and never receives an answer key", async () => {
    const get = spy(sb, "getTestQuestions", async () => TEST_ROWS);
    const legacy = spy(sb, "getQuestions", async () => []);
    render(<ConnectedTestsTab tests={[TEST]} chapterId="ch-1" />);
    fireEvent.click(screen.getByRole("button", { name: /Start Test/ }));
    expect(await screen.findByText(/Test question 1\?/)).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("t-1");
    expect(legacy).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Submit \(0\/3\)/ })).toBeDisabled();
  });

  it("submits only the chosen LETTERS, shows the SERVER's score, and does not save/compute anything locally", async () => {
    spy(sb, "getTestQuestions", async () => TEST_ROWS);
    const submit = spy(sb, "submitTest", async () => ({ score: 2, total: 3, accuracy: 66.7 }));
    const patch = spy(sb, "_patch", async () => ({}));
    const post = spy(sb, "_post", async () => ({}));
    render(<ConnectedTestsTab tests={[TEST]} chapterId="ch-1" />);
    fireEvent.click(screen.getByRole("button", { name: /Start Test/ }));
    await screen.findByText(/Test question 1\?/);

    fireEvent.click(screen.getByText("t1-a"));
    fireEvent.click(screen.getByText("t2-b"));
    fireEvent.click(screen.getByText("t3-d"));
    fireEvent.click(screen.getByRole("button", { name: /Submit \(3\/3\)/ }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    const [testId, answers, timeTaken] = submit.mock.calls[0];
    expect(testId).toBe("t-1");
    expect(answers).toEqual({ "tq-1": "A", "tq-2": "B", "tq-3": "D" });
    expect(typeof timeTaken).toBe("number");
    expect(JSON.stringify(submit.mock.calls[0])).not.toMatch(/score|correct/i);

    expect(await screen.findByText("2/3")).toBeInTheDocument();
    expect(screen.getByText(/67% accuracy/)).toBeInTheDocument();
    // The direct result writer is gone and nothing posts to results any more.
    expect(sb.submitResult).toBeUndefined();
    expect(post).not.toHaveBeenCalled();
    expect(patch).not.toHaveBeenCalled();
  });

  it("a failed submission alerts and keeps the student on the test (no fake result screen)", async () => {
    spy(sb, "getTestQuestions", async () => TEST_ROWS);
    spy(sb, "submitTest", async () => { throw new Error("network"); });
    const alertSpy = spy(window, "alert", () => {});
    render(<ConnectedTestsTab tests={[TEST]} chapterId="ch-1" />);
    fireEvent.click(screen.getByRole("button", { name: /Start Test/ }));
    await screen.findByText(/Test question 1\?/);
    ["t1-a", "t2-a", "t3-a"].forEach(t => fireEvent.click(screen.getByText(t)));
    fireEvent.click(screen.getByRole("button", { name: /Submit \(3\/3\)/ }));
    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(screen.queryByText(/% accuracy/)).not.toBeInTheDocument();
    expect(screen.getByText(/Test question 1\?/)).toBeInTheDocument();
  });

  it("a test the server returns no questions for does not open", async () => {
    spy(sb, "getTestQuestions", async () => []);
    const alertSpy = spy(window, "alert", () => {});
    render(<ConnectedTestsTab tests={[TEST]} chapterId="ch-1" />);
    fireEvent.click(screen.getByRole("button", { name: /Start Test/ }));
    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(screen.getByText("Available Tests")).toBeInTheDocument();
  });
});

// ── Regression: staff Question Manager helpers + Game Hub untouched ────────
describe("Step 5B — regression: staff and game paths keep their existing behaviour", () => {
  it("staff helpers still use the full questions table (view/create/update/delete/bulk import)", async () => {
    const get = spy(sb, "_get", async () => []);
    const post = spy(sb, "_post", async (t, d) => [{ id: "new", ...d }]);
    const patch = spy(sb, "_patch", async () => []);
    const del = spy(sb, "_delete", async () => []);
    await sb.getAllQuestions();
    await sb.addQuestion({ question: "q", correct_answer: "A" });
    await sb.updateQuestion("id-1", { explanation: "e" });
    await sb.deleteQuestion("id-1");
    expect(get.mock.calls[0][0]).toBe("questions");
    expect(post.mock.calls[0][0]).toBe("questions");
    expect(patch.mock.calls[0][0]).toBe("questions");
    expect(del.mock.calls[0][0]).toBe("questions");
  });

  it("Game Hub QuizPlayer still runs entirely through start/submit/award RPCs and never reads question tables", async () => {
    const QID = "0d564b55-5cd7-43d9-b8df-31b8550d47fb";
    const start = spy(sb, "startGameSession", async () => [{
      session_id: "s-1", question_id: QID, question: "Game question?",
      option_a: "g-a", option_b: "g-b", option_c: "g-c", option_d: "g-d", exam_type: "NEET", difficulty: "Easy",
    }]);
    const submit = spy(sb, "submitGameSession", async () => [{ correct_answers: 1, total_questions: 1, xp_earned: 10 }]);
    const award = spy(sb, "awardXp", async () => [{ new_xp: 10, new_streak: 1, xp_granted: 10 }]);
    const get = spy(sb, "_get", async () => []);
    const reveal = spy(sb, "revealAnswer", async () => ({}));
    const log = vi.spyOn(console, "log").mockImplementation(() => {}); spies.push(log);

    render(<QuizPlayer mode="practice_arena" chapterId={null} numQuestions={1} onExit={() => {}} onFinished={() => {}} />);
    expect(await screen.findByText("Game question?")).toBeInTheDocument();
    fireEvent.click(screen.getByText("g-a"));
    fireEvent.click(screen.getByRole("button", { name: /Finish/ }));

    await waitFor(() => expect(submit).toHaveBeenCalledWith("s-1", { [QID]: "A" }));
    await waitFor(() => expect(award).toHaveBeenCalledWith("s-1"));
    expect(start).toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
    expect(reveal).not.toHaveBeenCalled();
  });
});

describe("Step 6B — no direct result writer remains in the frontend", () => {
  it("sb.submitResult is removed and the source never writes to the results table", () => {
    expect(sb.submitResult).toBeUndefined();
    expect(APP_SRC).not.toMatch(/async submitResult\s*\(/);
    expect(APP_SRC).not.toMatch(/\b_(post|patch|delete)\(\s*["'`]results["'`]/);
    // results are only ever READ by the student app (getResults).
    expect(APP_SRC).toMatch(/_get\(\s*"results"/);
  });
});
