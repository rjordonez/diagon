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

const SYSTEM_PROMPT = `You are an AI assistant for a mortgage Loan Officer. You just received a transcript of a phone call between the LO and a borrower/lead.

Analyze the transcript and extract all relevant information. Return ONLY valid JSON:

{
  "summary": "2-3 sentence summary of the call",
  "notes": "Detailed notes to add to the borrower's record. Include specific numbers, dates, and details mentioned. Write in third person (e.g., 'Borrower mentioned...'). Include any concerns, preferences, or timeline discussed.",
  "extractedFields": {
    "loanAmount": null or number (e.g. 500000),
    "loanPurpose": null or "Purchase" | "Refinance" | "Cash-Out Refinance" | "Construction",
    "loanType": null or "Conventional" | "FHA" | "VA" | "USDA" | "Jumbo QM" | "DSCR" | "Bank Statement / Alt Doc" | "Asset Depletion" | "Full Doc Non-QM" | "1099" | "40-Year" | "WVOE",
    "propertyAddress": null or string,
    "leadTemp": null or "hot" | "warm" | "cold",
    "estimatedCreditScore": null or string,
    "employmentType": null or string (e.g. "W-2 Employee", "Self-Employed", "1099 Contractor"),
    "annualIncome": null or string,
    "downPayment": null or string,
    "propertyType": null or string (e.g. "SFR", "Condo", "2-4 Unit", "5+ Unit"),
    "numberOfUnits": null or number,
    "estimatedRent": null or string,
    "numberOfProperties": null or number
  },
  "suggestedTemplate": null or "DSCR" | "Conventional" | "FHA" | "VA" | "USDA" | "Jumbo QM" | "Bank Statement" | "1099",
  "suggestedStage": null or "contacted" | "app-sent" | "app-in-progress",
  "actionItems": ["list", "of", "follow-up", "tasks"]
}

Rules:
- Only include fields you are confident about from the transcript
- Leave fields as null if not discussed
- For loanAmount, extract the actual number (no dollar signs)
- leadTemp should be based on the borrower's engagement level and timeline
- suggestedTemplate should match the borrower's situation (investor = DSCR, first-time buyer = FHA/Conventional, etc.)
- actionItems should be specific next steps the LO should take
- notes should be comprehensive but concise — the LO will append these to the borrower record`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  const supabase = getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Invalid token" });

  const { transcript, utterances, borrowerContext } = req.body as {
    transcript: string;
    utterances: { speaker: string; text: string }[];
    borrowerContext: { name: string; email: string; phone: string; currentNotes: string };
  };

  if (!transcript) return res.status(400).json({ error: "transcript required" });

  const openai = getOpenAI();

  // Format utterances for context
  const formattedTranscript = utterances.length > 0
    ? utterances.map((u) => `Speaker ${u.speaker}: ${u.text}`).join("\n")
    : transcript;

  const userPrompt = `Borrower: ${borrowerContext?.name || "Unknown"}
Email: ${borrowerContext?.email || "N/A"}
Phone: ${borrowerContext?.phone || "N/A"}
Existing notes: ${borrowerContext?.currentNotes || "None"}

--- CALL TRANSCRIPT ---
${formattedTranscript}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const result = JSON.parse(raw);

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Analyze transcript error:", err.message);
    return res.status(500).json({ error: "Analysis failed" });
  }
}
