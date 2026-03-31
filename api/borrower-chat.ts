import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const maxDuration = 30;

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

const SYSTEM_PROMPT = `You are a helpful mortgage application assistant for Diagon. You help borrowers understand:
- What documents they need and why
- Mortgage terms and concepts (DSCR, LTV, DTI, escrow, etc.)
- The application process and what to expect
- How to prepare their documents

Be friendly, clear, and concise. Use simple language — avoid jargon unless the borrower asks about a specific term. If you don't know something specific about their loan, suggest they contact their loan officer.

Keep responses short (2-4 sentences) unless the borrower asks for a detailed explanation.`;

async function buildBorrowerContext(supabase: ReturnType<typeof getSupabase>, userId: string): Promise<string> {
  // Get borrower's application
  const { data: apps } = await supabase
    .from("borrower_applications")
    .select("id, status, upload_links(id, template_id, document_templates(name))")
    .eq("borrower_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!apps || apps.length === 0) return "";

  const app = apps[0];
  const uploadLinkId = (app as any).upload_links?.id;
  const templateName = (app as any).upload_links?.document_templates?.name || "Loan Application";

  let context = `\n\nBorrower's application: "${templateName}" (status: ${app.status})`;

  if (uploadLinkId) {
    const { data: items } = await supabase
      .from("upload_items")
      .select("status, template_items(name, section, item_type, input_type)")
      .eq("upload_link_id", uploadLinkId);

    if (items && items.length > 0) {
      const pending = items.filter((i: any) => i.status === "pending" && i.template_items?.item_type !== "question");
      const uploaded = items.filter((i: any) => i.status !== "pending" && i.template_items?.item_type !== "question");

      context += `\n${uploaded.length} documents uploaded, ${pending.length} still needed.`;

      if (pending.length > 0) {
        context += `\nDocuments still needed:`;
        for (const item of pending.slice(0, 10)) {
          const ti = (item as any).template_items;
          if (ti?.name) context += `\n  - ${ti.name} (${ti.section || "General"})`;
        }
        if (pending.length > 10) context += `\n  ... and ${pending.length - 10} more`;
      }
    }
  }

  return context;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabase = getSupabase();
  const ai = getOpenAI();

  // Auth
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing auth token" });
  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Invalid auth token" });

  const { messages: uiMessages } = req.body;

  // Build context
  const borrowerContext = await buildBorrowerContext(supabase, user.id);

  // Convert messages
  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT + borrowerContext },
  ];
  for (const msg of uiMessages || []) {
    if (msg.role === "user") {
      const text = msg.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") || msg.content || "";
      if (text) openaiMessages.push({ role: "user", content: text });
    } else if (msg.role === "assistant") {
      const text = msg.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") || msg.content || "";
      if (text) openaiMessages.push({ role: "assistant", content: text });
    }
  }

  // Stream response
  const stream = await ai.chat.completions.create({
    model: "gpt-4o",
    messages: openaiMessages,
    stream: true,
  });

  // Set headers for streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullText = "";
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullText += content;
      res.write(`data: ${JSON.stringify({ type: "text", text: content })}\n\n`);
    }
  }

  // Send final message
  res.write(`data: ${JSON.stringify({ type: "done", id: crypto.randomUUID(), text: fullText })}\n\n`);
  res.end();
}
