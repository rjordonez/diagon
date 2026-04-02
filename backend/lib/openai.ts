import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("Warning: OPENAI_API_KEY not set — Diagon agent will not work");
}

export const openai = new OpenAI({ apiKey: apiKey || "" });
