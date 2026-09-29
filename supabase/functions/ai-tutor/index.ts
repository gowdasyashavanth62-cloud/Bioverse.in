// supabase/functions/ai-tutor/index.ts
//
// BioVerse AI Tutor — protected server-side proxy to the Google Gemini API.
//
// Migrated from Anthropic to Gemini. The browser still never talks to
// the AI provider directly and never holds its API key — that key
// (GEMINI_API_KEY) lives only here, as a Supabase Edge Function secret
// (set with `supabase secrets set GEMINI_API_KEY=...`), read via
// Deno.env at request time. The request/response contract the frontend
// depends on — { messages, system } in, { text } out — is unchanged.

import { GoogleGenAI } from "npm:@google/genai@2.21.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const MODEL = "gemini-3.8-flash";
const MAX_TOKENS = 1000;

// Transient-failure retry policy for the Gemini call. Only retry errors that
// are genuinely likely to succeed on a second try (provider overload/rate
// limiting); never retry permanent errors (bad key, bad request, auth).
const RETRYABLE_HTTP_STATUSES = new Set([429, 500, 502, 503, 504]);
const RETRYABLE_STATUS_STRINGS = ["UNAVAILABLE", "RESOURCE_EXHAUSTED"];
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [0, 1000, 2000]; // attempt 1 immediate, attempt 2 ~1s, attempt 3 ~2s

function isRetryableProviderError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const status = (err as { status?: unknown }).status;
  if (typeof status === "number" && RETRYABLE_HTTP_STATUSES.has(status)) return true;
  const msg = err.message || "";
  return RETRYABLE_STATUS_STRINGS.some((s) => msg.includes(s));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Request-shape limits — keeps payloads sane and caps AI cost per call.
const MAX_MESSAGES = 16; // only the most recent turns are sent upstream
const MAX_MESSAGE_CHARS = 6000;
const MAX_SYSTEM_CHARS = 4000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Best-effort in-memory rate limit. Edge functions are stateless and can
// scale to zero between invocations, so this map only throttles bursts
// hitting the same warm instance — it is NOT a durable, cross-instance
// quota. It is a lightweight first line of defense against accidental
// request floods (e.g. a stuck retry loop), not a substitute for a real
// billing/quota system. Documented as a known limitation in the report.
const requestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Lazily instantiated on first request and cached per warm instance (holds
// no request-specific state). Constructing GoogleGenAI at module top-level
// previously ran outside any try/catch during isolate boot — if the SDK
// threw there (incompatibility, bad input, etc.) it crashed the whole
// function before Deno.serve() ever registered, producing a silent 502
// with no application-level log. Deferring construction into the request
// handler, guarded by try/catch, turns that failure mode into a normal
// logged 500 response instead of an isolate crash.
let ai: GoogleGenAI | null = null;
let aiInitError: unknown = null;

function getAI(): GoogleGenAI | null {
  if (ai) return ai;
  if (aiInitError) return null; // already failed once this instance; don't retry every request
  if (!GEMINI_API_KEY) return null;
  try {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    return ai;
  } catch (err) {
    aiInitError = err;
    console.error("ai-tutor: GoogleGenAI initialization failed", err);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return json({ error: "Too many requests. Please wait a moment and try again." }, 429);
  }

  if (!GEMINI_API_KEY) {
    // Server-side misconfiguration — never describe this to the client.
    console.error("ai-tutor: GEMINI_API_KEY secret is not configured");
    return json({ error: "AI Tutor is temporarily unavailable. Please try again later." }, 500);
  }

  const client = getAI();
  if (!client) {
    // getAI() already logged the specific cause (missing key vs SDK init failure).
    return json({ error: "AI Tutor is temporarily unavailable. Please try again later." }, 500);
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch (err) {
    console.error("ai-tutor: could not parse request JSON", err);
    return json({ error: "Malformed request." }, 400);
  }

  const { messages, system } = payload || {};

  if (typeof system !== "string" || system.trim().length === 0) {
    return json({ error: "`system` must be a non-empty string." }, 400);
  }
  if (system.length > MAX_SYSTEM_CHARS) {
    return json({ error: "System prompt too long." }, 400);
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: "`messages` must be a non-empty array." }, 400);
  }

  const cleanMessages: { role: string; content: string }[] = [];
  for (const m of messages.slice(-MAX_MESSAGES)) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
      return json({ error: "Each message needs a valid role and string content." }, 400);
    }
    const trimmed = m.content.trim();
    if (!trimmed) continue;
    cleanMessages.push({ role: m.role, content: trimmed.slice(0, MAX_MESSAGE_CHARS) });
  }
  if (cleanMessages.length === 0) {
    return json({ error: "No valid messages to send." }, 400);
  }

  // Gemini uses "model" where Anthropic used "assistant"; content lives
  // in a `parts` array rather than a plain string. `system` maps to
  // `config.systemInstruction`, and MAX_TOKENS maps to
  // `config.maxOutputTokens` — the closest Gemini equivalent.
  const contents = cleanMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const controller = new AbortController();
  const timeoutMs = 25_000; // well under Supabase's 150s idle timeout
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let lastErr: unknown;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const result = await client.models.generateContent({
          model: MODEL,
          contents,
          config: {
            systemInstruction: system,
            maxOutputTokens: MAX_TOKENS,
            abortSignal: controller.signal,
          },
        });

        const text = result?.text;
        if (typeof text !== "string" || !text) {
          console.error("ai-tutor: unexpected provider response shape", result);
          return json({ error: "AI Tutor could not generate a response. Please try again." }, 502);
        }

        return json({ text });
      } catch (err) {
        lastErr = err;

        if (err instanceof Error && err.name === "AbortError") {
          throw err; // timeout — never retried, handled by the outer catch
        }

        const attemptsRemain = attempt < MAX_ATTEMPTS - 1;
        if (attemptsRemain && isRetryableProviderError(err) && !controller.signal.aborted) {
          console.error(
            `ai-tutor: transient provider error on attempt ${attempt + 1}/${MAX_ATTEMPTS}, retrying`,
            err instanceof Error ? err.message : err,
          );
          await delay(BACKOFF_MS[attempt + 1]);
          continue;
        }

        throw err; // permanent error, or retries exhausted
      }
    }

    throw lastErr;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error("ai-tutor: Gemini request timed out after", timeoutMs, "ms");
      return json({ error: "AI Tutor took too long to respond. Please try again." }, 504);
    }
    if (isRetryableProviderError(err)) {
      console.error(
        "ai-tutor: provider still unavailable after retries",
        err instanceof Error ? err.message : err,
      );
      return json({ error: "AI Tutor is experiencing high demand. Please try again shortly." }, 503);
    }
    console.error("ai-tutor: network/exception calling provider", err);
    return json({ error: "AI Tutor is temporarily unavailable. Please try again." }, 502);
  } finally {
    clearTimeout(timeoutId);
  }
});
