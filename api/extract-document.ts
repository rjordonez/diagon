import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const maxDuration = 60;

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  const supabase = getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Invalid token" });

  const { fileUrl, fileName, templateItemNames } = req.body as {
    fileUrl: string;
    fileName: string;
    templateItemNames: string[];
  };

  if (!fileUrl) return res.status(400).json({ error: "fileUrl required" });

  const openai = getOpenAI();

  const systemPrompt = `You are a document data extraction assistant for a mortgage loan application.

You will receive an image of a document (W2, bank statement, tax return, pay stub, ID, etc.).

Extract all relevant data fields from the document. Return ONLY valid JSON with this structure:
{
  "documentType": "W2" | "bank_statement" | "tax_return" | "pay_stub" | "drivers_license" | "other",
  "extracted": {
    "field_name": "value",
    ...
  },
  "mapped": {
    "template_item_name": "value",
    ...
  }
}

The "extracted" object should contain ALL data you can read from the document with descriptive keys like:
- employer_name, employer_address, employer_ein
- employee_name, employee_ssn, employee_address
- wages_tips, federal_tax_withheld, state_tax_withheld
- account_number, routing_number, account_balance
- gross_income, net_income, pay_period
- full_name, date_of_birth, license_number, address

The "mapped" object should map extracted values to these specific template item names when applicable:
${templateItemNames.map((n) => `- "${n}"`).join("\n")}

Only include mappings where you are confident the extracted value matches the template item.
For monetary values, include just the number (e.g., "85000" not "$85,000").
For dates, use YYYY-MM-DD format.
For SSN, only include last 4 digits.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: `Extract data from this document: ${fileName}` },
            { type: "image_url", image_url: { url: fileUrl, detail: "high" } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const result = JSON.parse(raw);

    return res.status(200).json({
      documentType: result.documentType || "other",
      extracted: result.extracted || {},
      mapped: result.mapped || {},
    });
  } catch (err: any) {
    console.error("Extract document error:", err.message);
    return res.status(500).json({ error: "Failed to extract document data" });
  }
}
