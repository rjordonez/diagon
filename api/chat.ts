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

const SYSTEM_PROMPT = `You are an AI assistant for a mortgage Loan Officer (LO). You help the LO communicate with their borrowers via iMessage.

Your responsibilities:
- Compose professional, friendly iMessage texts to borrowers on behalf of the LO
- Request specific documents from borrowers (W2s, pay stubs, bank statements, tax returns, etc.)
- Follow up on pending items
- Answer the LO's questions about their borrowers using the data available
- Report on inbound messages from borrowers

Guidelines for composing messages:
- Keep texts concise and professional but warm
- Use the borrower's first name
- Be clear about what you're requesting and why
- Don't use overly formal language — this is a text message, not an email
- Never reveal that you are an AI — write as if you are the LO

When the LO asks you to text a borrower:
1. Use the lookup_borrower tool if you need to find the borrower
2. Compose an appropriate message
3. Use the send_imessage tool to send it
4. Confirm to the LO what you sent

When reporting inbound messages, summarize what the borrower said and suggest next steps if appropriate.

Available pipeline stages: new-lead, contacted, application, processing, underwriting, conditional, clear-to-close, closed, on-hold, archived`;

const VALID_STAGES = [
  "new-lead", "contacted", "application", "processing",
  "underwriting", "conditional", "clear-to-close", "closed",
  "on-hold", "archived",
];

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "send_imessage",
      description: "Send an iMessage to a borrower. The message will be queued and sent via the iMessage bridge.",
      parameters: {
        type: "object",
        properties: {
          borrower_id: { type: "string", description: "The UUID of the borrower to message" },
          message_body: { type: "string", description: "The text message to send" },
        },
        required: ["borrower_id", "message_body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_borrower",
      description: "Search for borrowers by name, email, or phone. Returns matching borrower records.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query — a name, email, or phone number" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_document",
      description: "Request a specific document from a borrower via iMessage.",
      parameters: {
        type: "object",
        properties: {
          borrower_id: { type: "string", description: "The UUID of the borrower" },
          document_type: { type: "string", description: "Type of document (e.g., W2, pay_stub, bank_statement, tax_return)" },
          custom_message: { type: "string", description: "Optional custom message" },
        },
        required: ["borrower_id", "document_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_pipeline",
      description: "Update a borrower's pipeline stage.",
      parameters: {
        type: "object",
        properties: {
          borrower_id: { type: "string", description: "The UUID of the borrower" },
          new_stage: { type: "string", enum: VALID_STAGES, description: "The new pipeline stage" },
        },
        required: ["borrower_id", "new_stage"],
      },
    },
  },
];

async function buildContext(supabase: ReturnType<typeof getSupabase>, borrowerId: string | null): Promise<string> {
  if (!borrowerId) return "";
  let context = "";

  const { data: borrower } = await supabase.from("borrowers").select("*").eq("id", borrowerId).single();
  if (borrower) {
    context += `\n\nCurrent borrower context:\n`;
    context += `Name: ${borrower.first_name} ${borrower.last_name}\n`;
    context += `Email: ${borrower.email}\nPhone: ${borrower.phone || "N/A"}\n`;
    context += `Loan Amount: $${Number(borrower.loan_amount).toLocaleString()}\n`;
    context += `Loan Purpose: ${borrower.loan_purpose || "N/A"}\nProperty: ${borrower.property_address || "N/A"}\n`;
    context += `Pipeline Stage: ${borrower.stage}\nLead Temperature: ${borrower.lead_temp}\n`;
    context += `Lead Score: ${borrower.lead_score}/100\nDays in Stage: ${borrower.days_in_stage}\n`;
    context += `Notes: ${borrower.notes || "None"}\n`;
  }

  const { data: messages } = await supabase.from("messages").select("direction, body, status, created_at")
    .eq("borrower_id", borrowerId).order("created_at", { ascending: false }).limit(10);
  if (messages && messages.length > 0) {
    context += `\nRecent iMessage history (newest first):\n`;
    for (const m of messages) {
      const dir = m.direction === "outbound" ? "LO →" : "Borrower →";
      context += `  ${dir} "${m.body}" (${m.status}, ${m.created_at})\n`;
    }
  }
  return context;
}

async function executeTool(name: string, args: any, supabase: ReturnType<typeof getSupabase>, userId: string): Promise<string> {
  if (name === "send_imessage") {
    const { data: borrower, error: bErr } = await supabase.from("borrowers")
      .select("id, user_id, first_name, last_name, phone").eq("id", args.borrower_id).single();
    if (bErr || !borrower) return JSON.stringify({ error: "Borrower not found" });
    if (!borrower.phone) return JSON.stringify({ error: `${borrower.first_name} ${borrower.last_name} has no phone number` });
    const { error } = await supabase.from("messages").insert({
      user_id: borrower.user_id, borrower_id: borrower.id,
      direction: "outbound", recipient: borrower.phone, body: args.message_body, status: "queued",
    });
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ success: true, recipient: `${borrower.first_name} ${borrower.last_name}`, message: args.message_body });
  }

  if (name === "lookup_borrower") {
    const q = args.query.toLowerCase().trim();
    const { data: borrowers } = await supabase.from("borrowers").select("*").eq("user_id", userId);
    const matches = (borrowers || []).filter((b: any) => {
      const full = `${b.first_name} ${b.last_name}`.toLowerCase();
      const email = (b.email || "").toLowerCase();
      const phone = (b.phone || "").replace(/\D/g, "");
      const qd = q.replace(/\D/g, "");
      return full.includes(q) || email.includes(q) || (qd.length >= 4 && phone.includes(qd));
    });
    return JSON.stringify({ results: matches.map((b: any) => ({
      id: b.id, name: `${b.first_name} ${b.last_name}`, email: b.email, phone: b.phone,
      loan_amount: b.loan_amount, loan_purpose: b.loan_purpose, stage: b.stage,
    }))});
  }

  if (name === "request_document") {
    const { data: borrower, error: bErr } = await supabase.from("borrowers")
      .select("id, user_id, first_name, last_name, phone").eq("id", args.borrower_id).single();
    if (bErr || !borrower) return JSON.stringify({ error: "Borrower not found" });
    if (!borrower.phone) return JSON.stringify({ error: "No phone number" });
    const message = args.custom_message || `Hi ${borrower.first_name}, I hope you're doing well! We need your ${args.document_type.replace(/_/g, " ")} to keep your loan moving. Could you send that over? Let me know if you have questions!`;
    await supabase.from("messages").insert({
      user_id: borrower.user_id, borrower_id: borrower.id,
      direction: "outbound", recipient: borrower.phone, body: message, status: "queued",
    });
    return JSON.stringify({ success: true, recipient: `${borrower.first_name} ${borrower.last_name}`, message_sent: message });
  }

  if (name === "update_pipeline") {
    const { data: borrower } = await supabase.from("borrowers").select("id, first_name, last_name, stage")
      .eq("id", args.borrower_id).single();
    if (!borrower) return JSON.stringify({ error: "Borrower not found" });
    await supabase.from("borrowers").update({ stage: args.new_stage, days_in_stage: 0 }).eq("id", args.borrower_id);
    return JSON.stringify({ success: true, borrower: `${borrower.first_name} ${borrower.last_name}`, old_stage: borrower.stage, new_stage: args.new_stage });
  }

  return JSON.stringify({ error: `Unknown tool: ${name}` });
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

  const userId = user.id;
  const { messages: uiMessages, conversationId, borrowerId } = req.body;

  // Build context
  const borrowerContext = await buildContext(supabase, borrowerId || null);

  // Convert UI messages to OpenAI format
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

  // Tool calling loop
  const MAX_STEPS = 5;
  let finalText = "";

  for (let step = 0; step < MAX_STEPS; step++) {
    const completion = await ai.chat.completions.create({
      model: "gpt-4o",
      messages: openaiMessages,
      tools: TOOLS,
      stream: false,
    });

    const choice = completion.choices[0];
    const message = choice.message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      openaiMessages.push(message);
      for (const tc of message.tool_calls) {
        const args = JSON.parse(tc.function.arguments);
        const result = await executeTool(tc.function.name, args, supabase, userId);
        openaiMessages.push({ role: "tool", tool_call_id: tc.id, content: result });
      }
      continue;
    }

    finalText = message.content || "";
    break;
  }

  // Save to DB
  if (conversationId) {
    const lastUser = uiMessages?.[uiMessages.length - 1];
    if (lastUser?.role === "user") {
      const userText = lastUser.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") || "";
      if (userText) {
        await supabase.from("ai_messages").insert({
          conversation_id: conversationId, user_id: userId, role: "user", content: userText, status: "complete",
        });
      }
    }
    if (finalText) {
      await supabase.from("ai_messages").insert({
        conversation_id: conversationId, user_id: userId, role: "assistant", content: finalText, status: "complete",
      });
    }
    await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  }

  // Return as a simple JSON response (no streaming for now — we'll add it once this works)
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    id: crypto.randomUUID(),
    role: "assistant",
    parts: [{ type: "text", text: finalText }],
  }));
}
