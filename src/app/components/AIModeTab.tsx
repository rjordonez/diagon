import { useState, useRef, useEffect } from "react";
import { Mic, Square, Upload, Loader2, Check, FileText, Sparkles, X, Plus, Bot, ChevronDown, ChevronRight, ArrowRight, Link2, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getAuthToken } from "../hooks/useAIData";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import type { Borrower } from "@/demo/crm/data/mockData";

type Phase = "idle" | "recording" | "uploading" | "transcribing" | "analyzing" | "complete";

interface Utterance { speaker: string; text: string }
interface Analysis {
  summary: string;
  notes: string;
  extractedFields: Record<string, any>;
  suggestedTemplate: string | null;
  suggestedStage: string | null;
  actionItems: string[];
}

const FIELD_LABELS: Record<string, string> = {
  loanAmount: "Loan Amount", loanPurpose: "Loan Purpose", loanType: "Loan Type",
  propertyAddress: "Property Address", leadTemp: "Lead Temperature",
  estimatedCreditScore: "Credit Score", employmentType: "Employment",
  annualIncome: "Annual Income", downPayment: "Down Payment",
  propertyType: "Property Type", numberOfUnits: "Units",
  estimatedRent: "Monthly Rent", numberOfProperties: "Properties Owned",
};

const DB_FIELD_MAP: Record<string, string> = {
  loanAmount: "loan_amount", loanPurpose: "loan_purpose", loanType: "loan_type",
  propertyAddress: "property_address", leadTemp: "lead_temp",
};

const STAGE_LABELS: Record<string, string> = {
  "new-lead": "New Lead", contacted: "Contacted", "app-sent": "App Sent",
  "app-in-progress": "In Progress", "app-submitted": "Submitted",
};

// CSS for pulse animation
const PULSE_CSS = `
@keyframes ai-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}
`;

export const AIModeTab = ({ borrower, onSetupDocs }: { borrower: Borrower; onSetupDocs?: (template: string | null) => void }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [utterances, setUtterances] = useState<Utterance[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());
  const [notesAdded, setNotesAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(true);

  useEffect(() => {
    if (phase !== "recording") return;
    const interval = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setRecordingTime(0);
      setPhase("recording");
      setError(null);
    } catch {
      setError("Microphone access denied");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      mr.stream.getTracks().forEach((t) => t.stop());
      await processAudio(blob, `recording_${Date.now()}.webm`);
    };
    mr.stop();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await processAudio(file, file.name);
  };

  const processAudio = async (blob: Blob, fileName: string) => {
    setError(null);
    setPhase("uploading");
    const path = `${borrower.id}/ai_audio_${Date.now()}.${fileName.split(".").pop() || "webm"}`;
    const { error: uploadErr } = await supabase.storage.from("borrower-uploads").upload(path, blob);
    if (uploadErr) { setError("Upload failed"); setPhase("idle"); return; }
    const { data: urlData } = supabase.storage.from("borrower-uploads").getPublicUrl(path);

    setPhase("transcribing");
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ audioUrl: urlData.publicUrl }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Transcription failed"); }
      const data = await res.json();
      setTranscript(data.transcript);
      setUtterances(data.utterances || []);

      setPhase("analyzing");
      const analyzeRes = await fetch("/api/analyze-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          transcript: data.transcript,
          utterances: data.utterances || [],
          borrowerContext: {
            name: `${borrower.firstName} ${borrower.lastName}`,
            email: borrower.email, phone: borrower.phone,
            currentNotes: borrower.notes || "",
          },
        }),
      });
      if (!analyzeRes.ok) throw new Error("Analysis failed");
      setAnalysis(await analyzeRes.json());
      setPhase("complete");
    } catch (err: any) {
      setError(err.message || "Processing failed");
      if (!transcript) setPhase("idle");
      else setPhase("complete");
    }
  };

  const applyField = async (key: string, value: any) => {
    const dbField = DB_FIELD_MAP[key];
    if (!dbField) return;
    await supabase.from("borrowers").update({ [dbField]: key === "loanAmount" ? Number(value) : value }).eq("id", borrower.id).then();
    queryClient.invalidateQueries({ queryKey: ["borrowers"] });
    setAppliedFields((prev) => new Set([...prev, key]));
  };

  const applyAll = async () => {
    if (!analysis) return;
    for (const [key, value] of Object.entries(analysis.extractedFields || {})) {
      if (value != null && DB_FIELD_MAP[key] && !appliedFields.has(key)) {
        await applyField(key, value);
      }
    }
  };

  const addToNotes = async () => {
    if (!analysis) return;
    const existing = borrower.notes || "";
    const ts = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const section = `\n\n--- Call Notes (${ts}) ---\nSummary: ${analysis.summary}\n\n${analysis.notes}\n\nAction Items:\n${(analysis.actionItems || []).map((a) => `- ${a}`).join("\n")}`;
    await supabase.from("borrowers").update({ notes: (existing + section).trim() }).eq("id", borrower.id).then();
    queryClient.invalidateQueries({ queryKey: ["borrowers"] });
    setNotesAdded(true);
  };


  const reset = () => {
    setPhase("idle"); setTranscript(""); setUtterances([]); setAnalysis(null);
    setAppliedFields(new Set()); setNotesAdded(false); setError(null); setRecordingTime(0);
  };

  const isProcessing = phase === "uploading" || phase === "transcribing" || phase === "analyzing";

  return (
    <div>
      <style>{PULSE_CSS}</style>

      {/* Input area — record or upload */}
      {phase === "idle" && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button onClick={startRecording} style={{
            flex: 1, padding: "24px 16px", borderRadius: 12, border: "1px solid #e5e7eb",
            background: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
            fontFamily: "inherit", transition: "border-color 0.15s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Mic style={{ width: 20, height: 20, color: "#ef4444" }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Record Call</p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Record audio from your microphone</p>
            </div>
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={{
            flex: 1, padding: "24px 16px", borderRadius: 12, border: "1px solid #e5e7eb",
            background: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
            fontFamily: "inherit", transition: "border-color 0.15s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Upload style={{ width: 20, height: 20, color: "#3b82f6" }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Upload Recording</p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>MP3, WAV, M4A, or WebM</p>
            </div>
          </button>
          <input ref={fileInputRef} type="file" style={{ display: "none" }} accept=".mp3,.wav,.m4a,.webm,.ogg" onChange={handleFileUpload} />
        </div>
      )}

      {/* Recording */}
      {phase === "recording" && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 28, textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", animation: "ai-pulse 1.5s infinite" }}>
            <Mic style={{ width: 24, height: 24, color: "white" }} />
          </div>
          <p style={{ fontSize: 32, fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatTime(recordingTime)}</p>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Recording in progress...</p>
          <button onClick={stopRecording} style={{
            marginTop: 18, height: 40, padding: "0 24px", borderRadius: 8, background: "#ef4444",
            color: "white", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "inherit",
          }}>
            <Square style={{ width: 14, height: 14 }} /> Stop Recording
          </button>
        </div>
      )}

      {/* Processing */}
      {isProcessing && (
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 28, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Loader2 style={{ width: 20, height: 20, color: "#3b82f6", animation: "spin 1s linear infinite", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>
                {phase === "uploading" ? "Uploading audio..." : phase === "transcribing" ? "Transcribing with AssemblyAI..." : "Analyzing transcript with AI..."}
              </p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                {phase === "transcribing" ? "This may take 1-2 minutes for longer recordings" : "Almost done..."}
              </p>
            </div>
          </div>
          {/* Progress steps */}
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            {[
              { label: "Upload", done: phase !== "uploading" },
              { label: "Transcribe", done: phase === "analyzing" },
              { label: "Analyze", done: false },
            ].map((step, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", height: 3, borderRadius: 2, background: step.done ? "#3b82f6" : "#e5e7eb", transition: "background 0.3s" }} />
                <span style={{ fontSize: 10, color: step.done ? "#3b82f6" : "#9ca3af" }}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {(transcript || analysis) && (
        <div style={{ display: "flex", gap: 20 }}>
          {/* Left: Transcript */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {transcript && (
              <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 16 }}>
                <div onClick={() => setTranscriptOpen(!transcriptOpen)} style={{
                  padding: "12px 16px", borderBottom: transcriptOpen ? "1px solid #f3f4f6" : "none",
                  display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {transcriptOpen ? <ChevronDown style={{ width: 14, height: 14, color: "#9ca3af" }} /> : <ChevronRight style={{ width: 14, height: 14, color: "#9ca3af" }} />}
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: 0 }}>Call Transcript</h3>
                    <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", padding: "1px 6px", borderRadius: 4 }}>
                      {utterances.length} turns
                    </span>
                  </div>
                  {phase === "complete" && (
                    <button onClick={(e) => { e.stopPropagation(); reset(); }} style={{ fontSize: 12, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                      New Recording
                    </button>
                  )}
                </div>
                {transcriptOpen && (
                  <div style={{ padding: 16, maxHeight: 500, overflow: "auto" }}>
                    {utterances.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {utterances.map((u, i) => (
                          <div key={i} style={{ display: "flex", gap: 10 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                              background: u.speaker === "A" ? "#eff6ff" : "#f0fdf4",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 10, fontWeight: 700, color: u.speaker === "A" ? "#3b82f6" : "#16a34a",
                            }}>
                              {u.speaker}
                            </div>
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 600, color: u.speaker === "A" ? "#3b82f6" : "#16a34a", textTransform: "uppercase", marginBottom: 3 }}>
                                Speaker {u.speaker}
                              </p>
                              <p style={{ fontSize: 14, color: "#111", lineHeight: 1.6 }}>{u.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 14, color: "#111", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{transcript}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Items */}
            {analysis?.actionItems?.length > 0 && (
              <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: "0 0 12px" }}>Action Items</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {analysis.actionItems.map((item, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                      <input type="checkbox" style={{ marginTop: 3, accentColor: "#111" }} />
                      <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{item}</p>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: AI Analysis */}
          {analysis && (
            <div style={{ width: 360, flexShrink: 0 }}>
              {/* Summary */}
              <div style={{ background: "#eff6ff", borderRadius: 12, border: "1px solid #bfdbfe", padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Sparkles style={{ width: 14, height: 14, color: "#3b82f6" }} />
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: "#1e40af", margin: 0 }}>AI Summary</h3>
                </div>
                <p style={{ fontSize: 13, color: "#1e3a5f", lineHeight: 1.5 }}>{analysis.summary}</p>
              </div>

              {/* Quick Actions */}
              <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16, marginBottom: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: "0 0 10px" }}>Quick Actions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button onClick={applyAll} disabled={Object.entries(analysis.extractedFields || {}).filter(([, v]) => v != null).every(([k]) => appliedFields.has(k))}
                    style={{
                      width: "100%", height: 36, borderRadius: 8, background: "#111", color: "white",
                      border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit",
                      opacity: Object.entries(analysis.extractedFields || {}).filter(([, v]) => v != null).every(([k]) => appliedFields.has(k)) ? 0.5 : 1,
                    }}>
                    <Zap style={{ width: 14, height: 14 }} /> Apply All Fields
                  </button>
                  <button onClick={addToNotes} disabled={notesAdded}
                    style={{
                      width: "100%", height: 36, borderRadius: 8, border: "1px solid #e5e7eb",
                      background: notesAdded ? "#f0fdf4" : "white", color: notesAdded ? "#16a34a" : "#111",
                      fontSize: 13, fontWeight: 500, cursor: notesAdded ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit",
                    }}>
                    {notesAdded ? <><Check style={{ width: 12, height: 12 }} /> Notes Saved</> : <><Plus style={{ width: 12, height: 12 }} /> Save to Notes</>}
                  </button>
                  {borrower.diagonSequence ? (
                    <div style={{
                      width: "100%", height: 36, borderRadius: 8, background: "#f3f4f6",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      fontSize: 13, fontWeight: 500, color: "#6b7280",
                    }}>
                      <Bot style={{ width: 14, height: 14 }} />
                      {borrower.diagonSequence === "opted_out" ? "Opted Out" :
                        borrower.diagonSequence === "completed" ? "Diagon Complete" : "Diagon Sent"}
                    </div>
                  ) : (
                    <button onClick={() => {
                      if (onSetupDocs) onSetupDocs(analysis?.suggestedTemplate || null);
                    }}
                      style={{
                        width: "100%", height: 36, borderRadius: 8, background: "#3b82f6", color: "white",
                        border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit",
                      }}>
                      <Link2 style={{ width: 14, height: 14 }} /> Set Up Docs & Start Diagon
                    </button>
                  )}
                </div>
              </div>

              {/* Recommended Template */}
              {analysis.suggestedTemplate && (
                <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16, marginBottom: 12 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: "0 0 10px" }}>Recommended Setup</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: "#f9fafb", marginBottom: 8 }}>
                    <FileText style={{ width: 16, height: 16, color: "#6b7280", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{analysis.suggestedTemplate} Loan</p>
                      <p style={{ fontSize: 11, color: "#9ca3af" }}>Recommended template</p>
                    </div>
                    <button onClick={() => applyField("loanType", analysis.suggestedTemplate)} disabled={appliedFields.has("loanType")}
                      style={{
                        height: 24, padding: "0 10px", borderRadius: 4, border: "none",
                        fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                        background: appliedFields.has("loanType") ? "#f0fdf4" : "#3b82f6",
                        color: appliedFields.has("loanType") ? "#16a34a" : "white",
                      }}>
                      {appliedFields.has("loanType") ? "Applied" : "Apply"}
                    </button>
                  </div>
                  {analysis.suggestedStage && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: "#f9fafb" }}>
                      <ArrowRight style={{ width: 16, height: 16, color: "#6b7280", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{STAGE_LABELS[analysis.suggestedStage] || analysis.suggestedStage}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>Suggested stage</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Extracted Fields */}
              <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16, marginBottom: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: "0 0 10px" }}>Extracted Info</h3>
                {Object.entries(analysis.extractedFields || {}).filter(([, v]) => v != null).map(([key, value]) => {
                  const applied = appliedFields.has(key);
                  const canApply = !!DB_FIELD_MAP[key];
                  return (
                    <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f3f4f6" }}>
                      <div>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>{FIELD_LABELS[key] || key}</p>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>
                          {key === "loanAmount" || key === "downPayment" || key === "annualIncome"
                            ? `$${Number(value).toLocaleString()}`
                            : String(value)}
                        </p>
                      </div>
                      {canApply && (
                        <button onClick={() => applyField(key, value)} disabled={applied}
                          style={{
                            height: 22, padding: "0 8px", borderRadius: 4, border: "none",
                            fontSize: 10, fontWeight: 600, cursor: applied ? "default" : "pointer",
                            background: applied ? "#f0fdf4" : "#f3f4f6",
                            color: applied ? "#16a34a" : "#6b7280", fontFamily: "inherit",
                          }}>
                          {applied ? "Applied" : "Apply"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Call Notes Preview */}
              <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: "0 0 8px" }}>Call Notes</h3>
                <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, maxHeight: 150, overflow: "auto" }}>{analysis.notes}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca" }}>
          <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>
        </div>
      )}
    </div>
  );
};
