import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const maxDuration = 120;

const ASSEMBLYAI_BASE = "https://api.assemblyai.com";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  const supabase = getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Invalid token" });

  const assemblyKey = process.env.ASSEMBLYAI_API_KEY;
  if (!assemblyKey) return res.status(500).json({ error: "ASSEMBLYAI_API_KEY not configured" });

  const { audioUrl } = req.body as { audioUrl: string };
  if (!audioUrl) return res.status(400).json({ error: "audioUrl required" });

  const headers = { authorization: assemblyKey, "content-type": "application/json" };

  try {
    // Submit transcription
    const submitRes = await fetch(`${ASSEMBLYAI_BASE}/v2/transcript`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        audio_url: audioUrl,
        speech_models: ["universal-3-pro", "universal-2"],
        language_detection: true,
        speaker_labels: true,
      }),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      return res.status(500).json({ error: `AssemblyAI submit failed: ${err}` });
    }

    const { id: transcriptId } = await submitRes.json();

    // Poll until complete
    const pollUrl = `${ASSEMBLYAI_BASE}/v2/transcript/${transcriptId}`;
    let transcript: any;

    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 3000));

      const pollRes = await fetch(pollUrl, { headers });
      transcript = await pollRes.json();

      if (transcript.status === "completed") break;
      if (transcript.status === "error") {
        return res.status(500).json({ error: `Transcription failed: ${transcript.error}` });
      }
    }

    if (!transcript || transcript.status !== "completed") {
      return res.status(504).json({ error: "Transcription timed out" });
    }

    return res.status(200).json({
      transcript: transcript.text || "",
      utterances: (transcript.utterances || []).map((u: any) => ({
        speaker: u.speaker,
        text: u.text,
        start: u.start,
        end: u.end,
      })),
      status: "completed",
    });
  } catch (err: any) {
    console.error("Transcribe error:", err.message);
    return res.status(500).json({ error: "Transcription failed" });
  }
}
