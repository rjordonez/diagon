import { useState, useRef } from "react";
import { Upload, FileText, Loader2, Check, X, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getAuthToken } from "@/app/hooks/useAIData";
import { useExtraction, type ExtractionResult } from "../hooks/useExtractionContext";

interface Props {
  open: boolean;
  onClose: () => void;
  uploadItems: { id: string; templateItemId: string; templateItemName: string; status: string }[];
  borrowerId: string;
  token: string;
}

export const SmartUploadPanel = ({ open, onClose, uploadItems, borrowerId, token }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractionPreview, setExtractionPreview] = useState<Record<string, string> | null>(null);
  const [docType, setDocType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { addExtraction, addUploadedDoc, updateDocStatus } = useExtraction();

  const templateItemNames = uploadItems.map((i) => i.templateItemName);

  const handleFile = async (file: File) => {
    setError(null);
    setExtractionPreview(null);
    const docId = crypto.randomUUID();

    // 1. Upload to storage
    setUploading(true);
    addUploadedDoc({ id: docId, fileName: file.name, documentType: "...", status: "uploading", extractedCount: 0 });

    const ext = file.name.split(".").pop() || "pdf";
    const path = `${borrowerId}/smart_${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("borrower-uploads").upload(path, file);
    if (uploadErr) {
      setError("Upload failed");
      updateDocStatus(docId, "error");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("borrower-uploads").getPublicUrl(path);
    const fileUrl = urlData.publicUrl;
    setUploading(false);

    // 2. Extract with AI
    setExtracting(true);
    updateDocStatus(docId, "extracting");

    try {
      const authToken = await getAuthToken();
      const res = await fetch("/api/extract-document", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ fileUrl, fileName: file.name, templateItemNames }),
      });

      if (!res.ok) throw new Error("Extraction failed");

      const data = await res.json();
      const mapped: Record<string, string> = data.mapped || {};
      setExtractionPreview(mapped);
      setDocType(data.documentType || "Document");
      updateDocStatus(docId, "done", Object.keys(mapped).length);

      // Also try to match the uploaded file to a template item and mark it as uploaded
      const matchingItem = uploadItems.find((i) =>
        i.templateItemName.toLowerCase().includes((data.documentType || "").toLowerCase()) ||
        (data.documentType || "").toLowerCase().includes(i.templateItemName.toLowerCase())
      );
      if (matchingItem && matchingItem.status === "pending") {
        await supabase.rpc("submit_borrower_upload", {
          p_token: token,
          p_template_item_id: matchingItem.templateItemId,
          p_file_name: file.name,
          p_file_type: file.type,
          p_file_url: fileUrl,
        });
      }
    } catch (err: any) {
      setError(err.message || "Extraction failed");
      updateDocStatus(docId, "error");
    } finally {
      setExtracting(false);
    }
  };

  const handleApply = () => {
    if (!extractionPreview) return;

    const results: ExtractionResult[] = [];
    for (const [itemName, value] of Object.entries(extractionPreview)) {
      const item = uploadItems.find((i) => i.templateItemName === itemName);
      if (item) {
        results.push({
          templateItemId: item.templateItemId,
          templateItemName: itemName,
          extractedValue: value,
          currentValue: null, // ApplicationPage will check for discrepancies
          hasDiscrepancy: false,
          status: "pending",
        });
      }
    }
    addExtraction(results);
    setExtractionPreview(null);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={onClose} />
      <div style={{
        position: "absolute", top: 48, right: 0, zIndex: 50,
        width: 380, background: "white", borderRadius: 12, border: "1px solid #e5e7eb",
        boxShadow: "0 8px 32px rgba(0,0,0,0.10)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles style={{ width: 16, height: 16, color: "#3b82f6" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Smart Upload</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 18 }}>
          {/* Upload zone */}
          {!extractionPreview && !extracting && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#3b82f6"; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = "#d1d5db"; }}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#d1d5db"; const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              style={{
                border: "2px dashed #d1d5db", borderRadius: 10, padding: "28px 16px",
                textAlign: "center", cursor: "pointer", transition: "border-color 0.15s",
              }}
            >
              <Upload style={{ width: 24, height: 24, color: "#9ca3af", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>
                {uploading ? "Uploading..." : "Drop a document or click to browse"}
              </p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>PDF, JPG, PNG — W2, bank statements, tax returns</p>
              <input ref={fileInputRef} type="file" style={{ display: "none" }}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
            </div>
          )}

          {/* Extracting state */}
          {extracting && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <Loader2 style={{ width: 24, height: 24, color: "#3b82f6", margin: "0 auto 10px", animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>Analyzing document...</p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Extracting fields with AI</p>
            </div>
          )}

          {/* Extraction preview */}
          {extractionPreview && !extracting && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Check style={{ width: 14, height: 14, color: "#16a34a" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
                  {docType} — {Object.keys(extractionPreview).length} fields extracted
                </span>
              </div>
              <div style={{ maxHeight: 200, overflow: "auto", borderRadius: 8, border: "1px solid #f0f0f0" }}>
                {Object.entries(extractionPreview).map(([key, value], i, arr) => (
                  <div key={key} style={{
                    display: "flex", justifyContent: "space-between", padding: "6px 12px",
                    borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none",
                    fontSize: 12,
                  }}>
                    <span style={{ color: "#6b7280" }}>{key}</span>
                    <span style={{ color: "#111", fontWeight: 500 }}>{String(value).slice(0, 30)}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleApply}
                style={{
                  width: "100%", height: 36, borderRadius: 8, marginTop: 12,
                  background: "#3b82f6", color: "white", border: "none",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                <Sparkles style={{ width: 14, height: 14 }} /> Apply to Form
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <p style={{ fontSize: 12, color: "#ef4444", marginTop: 10, textAlign: "center" }}>{error}</p>
          )}
        </div>
      </div>
    </>
  );
};
