// supabase/functions/ai-tutor/index.ts
//
// BioVerse AI Tutor -- Deno entry point. All request handling (auth, CORS,
// validation, per-user rate limit, server-side system prompt, retry/timeout)
// lives in ./handler.ts. This file only wires in the runtime pieces:
//   * Deno.env  (GEMINI_API_KEY is read ONLY here / server-side, never logged
//     or returned)
//   * the Gemini SDK, constructed lazily and guarded so an SDK failure becomes
//     a normal logged error instead of an isolate crash
//   * Deno.serve

import { GoogleGenAI } from "npm:@google/genai@2.21.0";
import { createHandler, MAX_TOKENS, MODEL } from "./handler.ts";

let ai: GoogleGenAI | null = null;
let aiInitError: unknown = null;

function getAI(): GoogleGenAI | null {
  if (ai) return ai;
  if (aiInitError) return null;
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return null;
  try {
    ai = new GoogleGenAI({ apiKey: key });
    return ai;
  } catch (err) {
    aiInitError = err;
    console.error("ai-tutor: GoogleGenAI initialization failed", err instanceof Error ? err.message : "unknown");
    return null;
  }
}

Deno.serve(
  createHandler({
    getEnv: (name) => Deno.env.get(name),
    fetch: (input, init) => fetch(input, init),
    generate: async ({ systemInstruction, contents, signal }) => {
      const client = getAI();
      if (!client) throw new Error("provider not initialised");
      const result = await client.models.generateContent({
        model: MODEL,
        contents,
        config: { systemInstruction, maxOutputTokens: MAX_TOKENS, abortSignal: signal },
      });
      return result?.text;
    },
  }),
);
