import { useState, useRef, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2, Upload, FileText, Circle, AlertTriangle, X as XIcon } from "lucide-react";
import {
  useMyApplications,
  useApplication,
  useSubmitApplication,
} from "../hooks/usePortalData";
import { usePublicUploadItems, useSubmitUpload, type PublicUploadItem } from "@/hooks/usePublicUpload";
import { useExtraction } from "../hooks/useExtractionContext";

export const ApplicationPage = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: applications = [] } = useMyApplications();
  const id = paramId || applications[0]?.id;
  const { data: app, isLoading } = useApplication(id);

  const uploadLinkId = app?.upload_links?.id;
  const token = app?.upload_links?.token;
  const borrowerId = app?.upload_links?.borrower_id;

  const { data: uploadItems = [] } = usePublicUploadItems(uploadLinkId);
  const submitApp = useSubmitApplication();
  const submitUpload = useSubmitUpload();

  const [currentStep, setCurrentStep] = useState(0);
  const [gateAnswers, setGateAnswers] = useState<Record<string, string>>({});
  const [textValues, setTextValues] = useState<Record<string, string>>({});

  const sections = useMemo(() => {
    const map = new Map<string, PublicUploadItem[]>();
    for (const item of uploadItems) {
      const sec = item.section || "Documents";
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec)!.push(item);
    }
    return Array.from(map.entries()).map(([title, items]) => {
      const gate = items.find((i) => i.itemType === "question");
      const docs = items.filter((i) => i.itemType !== "question" && i.templateItemName);
      const uploaded = docs.filter((d) => d.status !== "pending").length;
      return { title, gate, docs, uploaded, total: docs.length };
    }).filter((s) => s.docs.length > 0 || s.gate);
  }, [uploadItems]);

  const isSubmitted = app?.status === "submitted" || app?.status === "quoted";
  const { extractedFields, resolveDiscrepancy, addExtraction } = useExtraction();

  // Auto-fill text fields from extraction
  useEffect(() => {
    const allItems = sections.flatMap((s) => s.docs);
    for (const item of allItems) {
      const ext = extractedFields[item.templateItemId];
      if (!ext) continue;
      const current = textValues[item.id] || "";
      if (!current && ext.extractedValue) {
        // Auto-fill empty field
        setTextValues((prev) => ({ ...prev, [item.id]: ext.extractedValue }));
      } else if (current && current !== ext.extractedValue && ext.status === "pending") {
        // Mark discrepancy
        addExtraction([{ ...ext, currentValue: current, hasDiscrepancy: true }]);
      }
    }
  }, [extractedFields, sections]);

  if (isLoading) return <p style={{ fontSize: 14, color: "#9ca3af", textAlign: "center", padding: 48 }}>Loading...</p>;

  if (!app) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 32 }}>
      <div style={{ textAlign: "center" }}>
        <FileText style={{ width: 40, height: 40, color: "#d1d5db", margin: "0 auto 12px" }} />
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111", marginBottom: 6 }}>No Application Yet</h2>
        <p style={{ fontSize: 14, color: "#9ca3af" }}>Your loan officer will send you an invitation link to get started.</p>
      </div>
    </div>
  );

  if (isSubmitted) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 32 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Check style={{ width: 28, height: 28, color: "#16a34a" }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111", marginBottom: 6 }}>Application Submitted</h2>
        <p style={{ fontSize: 14, color: "#9ca3af", maxWidth: 340, margin: "0 auto 20px" }}>Your loan officer is reviewing your application.</p>
        <button onClick={() => navigate("/portal/quote")}
          style={{ height: 40, padding: "0 20px", borderRadius: 8, background: "#3b82f6", color: "white", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
          View Quote <ArrowRight style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );

  if (sections.length === 0) return <p style={{ fontSize: 14, color: "#9ca3af", textAlign: "center", padding: 48 }}>Loading...</p>;

  const safeStep = Math.min(currentStep, sections.length - 1);
  const currentSection = sections[safeStep];
  const isLastStep = safeStep >= sections.length - 1;
  const allDocs = sections.flatMap((s) => s.docs);
  const completedDocs = allDocs.filter((d) => d.status !== "pending").length;

  const handleSubmit = async () => {
    if (id) { await submitApp.mutateAsync(id); navigate("/portal/quote"); }
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* Left stepper */}
      <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid #e5e7eb", padding: 16, display: "flex", flexDirection: "column", background: "white" }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Sections</p>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {sections.map((sec, i) => {
            const isActive = i === safeStep;
            const isComplete = sec.uploaded === sec.total && sec.total > 0;
            const isGateSkipped = sec.gate && gateAnswers[sec.gate.itemKey!] === "no";
            return (
              <button key={i} onClick={() => setCurrentStep(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                  borderRadius: 8, fontSize: 12, textAlign: "left", width: "100%",
                  background: isActive ? "#f3f4f6" : "transparent",
                  color: isActive ? "#111" : "#6b7280", fontWeight: isActive ? 600 : 400,
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                }}>
                {isComplete || isGateSkipped
                  ? <Check style={{ width: 14, height: 14, color: "#16a34a", flexShrink: 0 }} />
                  : isActive
                    ? <Circle style={{ width: 14, height: 14, fill: "#111", color: "#111", flexShrink: 0 }} />
                    : <Circle style={{ width: 14, height: 14, color: "#d1d5db", flexShrink: 0 }} />}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sec.title}</span>
              </button>
            );
          })}
        </div>
        <div style={{ paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: 10, color: "#9ca3af" }}>{completedDocs}/{allDocs.length} documents uploaded</p>
          <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#3b82f6", borderRadius: 2, transition: "width 0.3s", width: allDocs.length > 0 ? `${(completedDocs / allDocs.length) * 100}%` : "0%" }} />
          </div>
        </div>
      </div>

      {/* Right content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Section header */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb", flexShrink: 0, background: "white" }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#111" }}>{currentSection.title}</h2>
          {!currentSection.gate && (
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{currentSection.uploaded}/{currentSection.total} completed</p>
          )}
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Gate question */}
            {currentSection.gate && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#111", marginBottom: 10 }}>{currentSection.gate.templateItemName}</p>
                <div style={{ display: "flex", gap: 16 }}>
                  {["yes", "no"].map((v) => (
                    <label key={v} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer", color: "#111" }}>
                      <input type="radio" name={`gate_${safeStep}`}
                        checked={gateAnswers[currentSection.gate!.itemKey!] === v}
                        onChange={() => setGateAnswers((p) => ({ ...p, [currentSection.gate!.itemKey!]: v }))}
                        style={{ accentColor: "#3b82f6" }} />
                      {v === "yes" ? "Yes" : "No"}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(!currentSection.gate || gateAnswers[currentSection.gate.itemKey!] === "yes") &&
              currentSection.docs.map((item) => (
                <DocRow key={item.id} item={item} token={token} borrowerId={borrowerId}
                  submitUpload={submitUpload} textValues={textValues}
                  onTextChange={(id, v) => setTextValues((p) => ({ ...p, [id]: v }))} />
              ))
            }

            {currentSection.gate && gateAnswers[currentSection.gate.itemKey!] === "no" && (
              <p style={{ fontSize: 14, color: "#9ca3af", padding: "8px 0" }}>Not applicable — skip to the next section.</p>
            )}

            {currentSection.gate && !gateAnswers[currentSection.gate.itemKey!] && (
              <p style={{ fontSize: 14, color: "#9ca3af", padding: "8px 0" }}>Answer the question above to continue.</p>
            )}
          </div>
        </div>

        {/* Bottom nav */}
        <div style={{ padding: "12px 24px", borderTop: "1px solid #e5e7eb", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", background: "white" }}>
          <button onClick={() => setCurrentStep(Math.max(0, safeStep - 1))} disabled={safeStep === 0}
            style={{
              height: 40, padding: "0 16px", borderRadius: 8, border: "1px solid #e5e7eb",
              background: "white", fontSize: 14, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, opacity: safeStep === 0 ? 0.3 : 1, fontFamily: "inherit",
            }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Back
          </button>
          {isLastStep ? (
            <button onClick={handleSubmit} disabled={submitApp.isPending}
              style={{
                height: 40, padding: "0 20px", borderRadius: 8, background: "#3b82f6", color: "white",
                border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, opacity: submitApp.isPending ? 0.5 : 1, fontFamily: "inherit",
              }}>
              {submitApp.isPending ? <Loader2 style={{ width: 14, height: 14 }} /> : <Check style={{ width: 14, height: 14 }} />}
              Submit Application
            </button>
          ) : (
            <button onClick={() => setCurrentStep(safeStep + 1)}
              style={{
                height: 40, padding: "0 20px", borderRadius: 8, background: "#3b82f6", color: "white",
                border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
              }}>
              Next <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function DocRow({ item, token, borrowerId, submitUpload, textValues, onTextChange }: {
  item: PublicUploadItem; token: string; borrowerId: string;
  submitUpload: ReturnType<typeof useSubmitUpload>;
  textValues: Record<string, string>;
  onTextChange: (itemId: string, value: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getExtractedValue, resolveDiscrepancy } = useExtraction();
  const isText = item.inputType === "text";
  const isDone = item.status !== "pending";
  const extraction = getExtractedValue(item.templateItemId);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !borrowerId) return;
    await submitUpload.mutateAsync({ token, templateItemId: item.templateItemId, file, borrowerId });
  };

  if (isText) {
    const hasDiscrepancy = extraction?.hasDiscrepancy && extraction.status === "pending";
    return (
      <div>
        <label style={{ fontSize: 13, fontWeight: 500, color: "#111", display: "block", marginBottom: 6 }}>{item.templateItemName}</label>
        {item.templateItemDescription && <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>{item.templateItemDescription}</p>}
        <input type="text" value={textValues[item.id] || ""} onChange={(e) => onTextChange(item.id, e.target.value)}
          placeholder={`Enter ${item.templateItemName.toLowerCase()}...`}
          style={{
            width: "100%", height: 40, borderRadius: 8,
            border: hasDiscrepancy ? "1px solid #fbbf24" : "1px solid #e5e7eb",
            padding: "0 14px", fontSize: 14, color: "#111", outline: "none", fontFamily: "inherit",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = hasDiscrepancy ? "#f59e0b" : "#3b82f6")}
          onBlur={(e) => (e.currentTarget.style.borderColor = hasDiscrepancy ? "#fbbf24" : "#e5e7eb")} />
        {/* Discrepancy warning */}
        {hasDiscrepancy && extraction && (
          <div style={{
            marginTop: 6, padding: "8px 12px", borderRadius: 8,
            background: "#fef3c7", border: "1px solid #fbbf24",
            display: "flex", alignItems: "center", gap: 8, fontSize: 12,
          }}>
            <AlertTriangle style={{ width: 14, height: 14, color: "#d97706", flexShrink: 0 }} />
            <span style={{ flex: 1, color: "#92400e" }}>
              Document says <strong>"{extraction.extractedValue}"</strong> but you entered <strong>"{extraction.currentValue}"</strong>
            </span>
            <button onClick={() => resolveDiscrepancy(item.templateItemId, false)}
              style={{ width: 24, height: 24, borderRadius: 4, background: "#fef2f2", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Keep my value">
              <XIcon style={{ width: 12, height: 12, color: "#ef4444" }} />
            </button>
            <button onClick={() => { resolveDiscrepancy(item.templateItemId, true); onTextChange(item.id, extraction.extractedValue); }}
              style={{ width: 24, height: 24, borderRadius: 4, background: "#f0fdf4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Use document value">
              <Check style={{ width: 12, height: 12, color: "#16a34a" }} />
            </button>
          </div>
        )}
        {/* Auto-filled indicator */}
        {extraction && !hasDiscrepancy && extraction.status === "pending" && !extraction.currentValue && (
          <p style={{ fontSize: 11, color: "#16a34a", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <Check style={{ width: 10, height: 10 }} /> Auto-filled from document
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10,
      border: isDone ? "1px solid #d1fae5" : "1px solid #e5e7eb",
      background: isDone ? "#f0fdf4" : "white",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: isDone ? "#16a34a" : "#f3f4f6",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isDone ? <Check style={{ width: 12, height: 12, color: "white" }} /> : <Upload style={{ width: 12, height: 12, color: "#9ca3af" }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, color: isDone ? "#6b7280" : "#111" }}>{item.templateItemName}</p>
        {item.templateItemDescription && <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{item.templateItemDescription}</p>}
      </div>
      {!isDone ? (
        <>
          <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFile} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
          <button onClick={() => fileInputRef.current?.click()} disabled={submitUpload.isPending}
            style={{
              height: 32, padding: "0 14px", borderRadius: 8, background: "#3b82f6", color: "white",
              border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, opacity: submitUpload.isPending ? 0.5 : 1, fontFamily: "inherit",
            }}>
            {submitUpload.isPending ? <Loader2 style={{ width: 12, height: 12 }} /> : <Upload style={{ width: 12, height: 12 }} />}
            Upload
          </button>
        </>
      ) : (
        <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#dcfce7", padding: "3px 8px", borderRadius: 4 }}>Done</span>
      )}
    </div>
  );
}
