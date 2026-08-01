import OpenAI from "openai";
import { wrapOpenAI } from "langsmith/wrappers";

export const openai = wrapOpenAI(new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));

export const OPENAI_MODEL = process.env.OPENAI_MODEL;
if (!OPENAI_MODEL) {
  throw new Error("Missing OPENAI_MODEL env var");
}

// Optional shared vector store searched on every message alongside any
// thread-specific store (e.g. a common knowledge base uploaded outside the
// per-thread attach flow). Unset by default — file_search only kicks in
// per-thread otherwise.
export const DEFAULT_VECTOR_STORE_ID = process.env.OPENAI_VECTOR_STORE_ID;
