import OpenAI from "openai";
import { wrapOpenAI } from "langsmith/wrappers";

export const openai = wrapOpenAI(new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));

export const OPENAI_MODEL = process.env.OPENAI_MODEL;
if (!OPENAI_MODEL) {
  throw new Error("Missing OPENAI_MODEL env var");
}
