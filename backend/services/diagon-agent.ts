import { supabase } from "../lib/supabase.js";
import { openai } from "../lib/openai.js";

const APP_URL = process.env.APP_URL || "https://diagon.vercel.app";

type DiagonSequence = "intro_sent" | "awaiting_confirm" | "link_sent" | "completed" | "opted_out";

interface DiagonResponse {
  intent: "confirm" | "deny" | "opt_out" | "question" | "other";
  response: string;
  next_state: DiagonSequence;
}

function buildSystemPrompt(borrowerName: string, loName: string, sequence: string, hasLink: boolean): string {
  const linkContext = hasLink
    ? "You have a secure document upload link ready to send. If they confirm, you will send it."
    : "There is no document link to send. You are just introducing yourself and confirming they are open to working together.";

  return `You are Diagon, a friendly AI assistant for ${loName}, a mortgage Loan Officer.
You are texting a borrower named ${borrowerName} via iMessage.

Current sequence state: ${sequence}
${linkContext}

Your job is to interpret the borrower's reply and generate your response.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "intent": "confirm" | "deny" | "opt_out" | "question" | "other",
  "response": "your reply message text",
  "next_state": "awaiting_confirm" | "link_sent" | "completed" | "opted_out"
}

Intent rules:
- "confirm": they said yes, sure, ok, sounds good, send it, etc. → next_state should be "${hasLink ? "link_sent" : "completed"}"
- "deny": they said no, not now, not interested, maybe later → next_state "completed"
- "opt_out": they said stop, unsubscribe, don't text me, leave me alone → next_state "opted_out"
- "question": they asked a question about the process, rates, timeline, etc. → keep next_state as "${sequence}"
- "other": anything else, general conversation → keep next_state as "${sequence}"

Response style:
- Text like a real person, not formal email
- Keep it brief — 1-2 sentences max
- Be friendly and helpful
- If they opt out, be respectful: "No worries at all! I'll stop reaching out. If you ever need anything, just text this number."
- If they confirm and there's a link: "Awesome! Here's the link" (the link will be sent separately)
- If they deny: be understanding, don't push`;
}

export async function processDiagonReply(borrowerId: string, inboundText: string): Promise<void> {
  // 1. Fetch borrower
  const { data: borrower } = await supabase
    .from("borrowers")
    .select("id, user_id, first_name, last_name, diagon_sequence, diagon_upload_link_id, assigned_lo")
    .eq("id", borrowerId)
    .single();

  if (!borrower) return;

  const sequence = borrower.diagon_sequence as DiagonSequence | null;
  if (!sequence || sequence === "completed" || sequence === "opted_out") return;

  // 2. Get LO name
  let loName = borrower.assigned_lo || "your Loan Officer";
  if (loName === "You" || !loName) {
    const { data: user } = await supabase.auth.admin.getUserById(borrower.user_id);
    loName = user?.user?.user_metadata?.full_name?.split(" ")[0] || "your Loan Officer";
  } else {
    loName = loName.split(" ")[0]; // first name only
  }

  // 3. Check if we have a link
  let hasLink = !!borrower.diagon_upload_link_id;
  let linkToken: string | null = null;
  if (hasLink && borrower.diagon_upload_link_id) {
    const { data: link } = await supabase
      .from("upload_links")
      .select("token")
      .eq("id", borrower.diagon_upload_link_id)
      .single();
    linkToken = link?.token || null;
    if (!linkToken) hasLink = false;
  }

  // 4. Get recent message history
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("direction, body")
    .eq("borrower_id", borrowerId)
    .order("created_at", { ascending: true })
    .limit(20);

  const history = (recentMessages || []).map((m) => ({
    role: m.direction === "outbound" ? "assistant" as const : "user" as const,
    content: m.body,
  }));

  // 5. Call OpenAI
  const systemPrompt = buildSystemPrompt(borrower.first_name, loName, sequence, hasLink);

  let aiResponse: DiagonResponse;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: inboundText },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "";
    // Strip markdown code blocks if present
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      aiResponse = JSON.parse(cleaned);
    } catch {
      // AI returned plain text instead of JSON — use it as the response, keep current state
      console.log("Diagon: AI returned plain text, using as response:", cleaned.slice(0, 60));
      aiResponse = {
        intent: "other",
        response: cleaned,
        next_state: sequence as DiagonSequence,
      };
    }
  } catch (err: any) {
    console.error("Diagon AI error:", err.message);
    return;
  }

  // 6. Look up borrower's phone for the recipient field
  const { data: bPhone } = await supabase.from("borrowers").select("phone").eq("id", borrowerId).single();
  const recipient = bPhone?.phone || "";

  // 7. Insert response message
  const { error: insertErr } = await supabase.from("messages").insert({
    user_id: borrower.user_id,
    borrower_id: borrowerId,
    direction: "outbound",
    recipient,
    body: aiResponse.response,
    status: "queued",
  });
  if (insertErr) {
    console.error("Diagon: failed to insert response message:", insertErr.message);
  }

  // 8. If confirmed and has link, send the link as a follow-up
  if (aiResponse.intent === "confirm" && hasLink && linkToken) {
    const linkUrl = `${APP_URL}/portal/invite/${linkToken}`;
    const { error: linkErr } = await supabase.from("messages").insert({
      user_id: borrower.user_id,
      borrower_id: borrowerId,
      direction: "outbound",
      recipient,
      body: linkUrl,
      status: "queued",
    });
    if (linkErr) {
      console.error("Diagon: failed to insert link message:", linkErr.message);
    }
  }

  // 9. Update borrower status
  const updates: Record<string, any> = {
    diagon_sequence: aiResponse.next_state,
  };
  if (aiResponse.intent === "confirm") {
    updates.is_active_lead = "true";
  } else if (aiResponse.intent === "opt_out" || aiResponse.intent === "deny") {
    updates.is_active_lead = "false";
  }
  const { error: updateErr } = await supabase.from("borrowers").update(updates).eq("id", borrowerId);
  if (updateErr) {
    console.error("Diagon: failed to update borrower:", updateErr.message);
  }

  console.log(`🤖 Diagon → ${borrower.first_name}: [${aiResponse.intent}] "${aiResponse.response.slice(0, 50)}..."`);
}
