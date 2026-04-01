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

const SYSTEM_PROMPT = `You are an AI assistant for a mortgage Loan Officer. You have access to all their data — borrowers, pipeline, documents, messages, and templates. Answer any question about their business concisely and accurately.

When asked about a borrower, include relevant details like their loan amount, pipeline stage, contact info, and document status.
When asked about pipeline stats, summarize counts per stage.
When asked about messages, summarize the conversation history.
Keep responses clear and concise. Use bullet points for lists.`;

async function buildFullContext(supabase: ReturnType<typeof getSupabase>, userId: string): Promise<string> {
  let context = "";

  // All borrowers
  const { data: borrowers } = await supabase
    .from("borrowers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (borrowers && borrowers.length > 0) {
    context += `\n\n--- BORROWERS (${borrowers.length} total) ---`;
    for (const b of borrowers) {
      context += `\n${b.first_name} ${b.last_name} | ${b.email} | ${b.phone || "no phone"} | Stage: ${b.stage} | Loan: $${Number(b.loan_amount).toLocaleString()} ${b.loan_purpose || ""} | Score: ${b.lead_score}/100 | Temp: ${b.lead_temp} | Docs: ${b.docs_received}/${b.docs_requested} | Notes: ${b.notes || "none"}`;
    }

    // Pipeline summary
    const stages: Record<string, number> = {};
    for (const b of borrowers) { stages[b.stage] = (stages[b.stage] || 0) + 1; }
    context += `\n\n--- PIPELINE SUMMARY ---`;
    for (const [stage, count] of Object.entries(stages)) {
      context += `\n${stage}: ${count}`;
    }
    context += `\nTotal volume: $${borrowers.reduce((s, b) => s + Number(b.loan_amount), 0).toLocaleString()}`;
  }

  // Recent messages (last 50)
  const { data: messages } = await supabase
    .from("messages")
    .select("*, borrowers(first_name, last_name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (messages && messages.length > 0) {
    context += `\n\n--- RECENT MESSAGES (${messages.length}) ---`;
    for (const m of messages) {
      const name = (m as any).borrowers ? `${(m as any).borrowers.first_name} ${(m as any).borrowers.last_name}` : "Unknown";
      const dir = m.direction === "outbound" ? "→" : "←";
      context += `\n${dir} ${name}: "${m.body}" (${m.status}, ${new Date(m.created_at).toLocaleDateString()})`;
    }
  }

  // Upload links and document status
  const { data: links } = await supabase
    .from("upload_links")
    .select("*, borrowers(first_name, last_name), document_templates(name), upload_items(status, template_items(name))")
    .eq("user_id", userId);

  if (links && links.length > 0) {
    context += `\n\n--- DOCUMENT UPLOAD STATUS ---`;
    for (const link of links) {
      const bName = (link as any).borrowers ? `${(link as any).borrowers.first_name} ${(link as any).borrowers.last_name}` : "Unknown";
      const tName = (link as any).document_templates?.name || "Unknown template";
      const items = (link as any).upload_items || [];
      const uploaded = items.filter((i: any) => i.status !== "pending").length;
      context += `\n${bName} (${tName}): ${uploaded}/${items.length} docs uploaded`;
      const pending = items.filter((i: any) => i.status === "pending");
      if (pending.length > 0) {
        context += ` — Still needed: ${pending.slice(0, 5).map((i: any) => i.template_items?.name || "?").join(", ")}`;
      }
    }
  }

  // Templates
  const { data: templates } = await supabase
    .from("document_templates")
    .select("name, borrower_type, is_addon, template_items(id)")
    .eq("user_id", userId);

  if (templates && templates.length > 0) {
    context += `\n\n--- TEMPLATES ---`;
    for (const t of templates) {
      context += `\n${t.name} (${t.borrower_type || "General"})${t.is_addon ? " [add-on]" : ""} — ${(t as any).template_items?.length || 0} items`;
    }
  }

  return context;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabase = getSupabase();
  const ai = getOpenAI();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing auth token" });
  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Invalid auth token" });

  const { messages: uiMessages, conversationId } = req.body;

  const fullContext = await buildFullContext(supabase, user.id);

  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT + fullContext },
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

  // Save messages to DB
  if (conversationId) {
    const lastUserMsg = uiMessages[uiMessages.length - 1];
    if (lastUserMsg?.role === "user") {
      const userText = lastUserMsg.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") || lastUserMsg.content || "";
      if (userText) {
        await supabase.from("ai_messages").insert({
          conversation_id: conversationId, user_id: user.id, role: "user", content: userText, status: "complete",
        });
      }
    }
    if (fullText) {
      await supabase.from("ai_messages").insert({
        conversation_id: conversationId, user_id: user.id, role: "assistant", content: fullText, status: "complete",
      });
    }
    await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  }

  res.write(`data: ${JSON.stringify({ type: "done", id: crypto.randomUUID(), text: fullText })}\n\n`);
  res.end();
}
