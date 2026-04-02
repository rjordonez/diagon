import { useRef } from "react";
import { useParams } from "react-router-dom";
import { Upload, Check, FileText, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUploadLinkByToken, usePublicUploadItems, useSubmitUpload } from "@/hooks/usePublicUpload";

const queryClient = new QueryClient();

export const BorrowerUploadPage = () => (
  <QueryClientProvider client={queryClient}>
    <UploadPageInner />
  </QueryClientProvider>
);

function UploadPageInner() {
  const { token } = useParams<{ token: string }>();
  const { data: link, isLoading } = useUploadLinkByToken(token);
  const { data: items = [] } = usePublicUploadItems(link?.id);
  const submitUpload = useSubmitUpload();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa" }}>
        <Loader2 style={{ width: 24, height: 24, color: "#9ca3af", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!link) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <AlertCircle style={{ width: 40, height: 40, color: "#d1d5db", margin: "0 auto 12px" }} />
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", marginBottom: 6 }}>Invalid Link</h1>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>This upload link doesn't exist or has expired.</p>
        </div>
      </div>
    );
  }

  if (link.expired) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <AlertCircle style={{ width: 40, height: 40, color: "#d1d5db", margin: "0 auto 12px" }} />
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", marginBottom: 6 }}>Link Expired</h1>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>This upload link has expired. Please contact your loan officer for a new one.</p>
        </div>
      </div>
    );
  }

  const uploadedCount = items.filter((i) => i.status !== "pending").length;
  const allDone = uploadedCount === items.length && items.length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 24px 60px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: "#eff6ff",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
          }}>
            <Upload style={{ width: 22, height: 22, color: "#3b82f6" }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>Document Upload</h1>
          <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 6 }}>
            Hi {link.borrowerName.split(" ")[0]}, please upload the following documents for your loan application.
          </p>
        </div>

        {/* Progress */}
        {items.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", background: allDone ? "#16a34a" : "#3b82f6", borderRadius: 3,
                transition: "width 0.3s", width: `${(uploadedCount / items.length) * 100}%`,
              }} />
            </div>
            <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>{uploadedCount} of {items.length}</span>
          </div>
        )}

        {/* All done */}
        {allDone && (
          <div style={{
            background: "#f0fdf4", border: "1px solid #d1fae5", borderRadius: 12,
            padding: 20, textAlign: "center", marginBottom: 20,
          }}>
            <Check style={{ width: 24, height: 24, color: "#16a34a", margin: "0 auto 6px" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#16a34a" }}>All documents uploaded!</p>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Your loan officer will review them shortly.</p>
          </div>
        )}

        {/* Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item) => (
            <UploadItemCard key={item.id} item={item} token={token!} linkId={link.id} submitUpload={submitUpload} />
          ))}
        </div>

        <p style={{ fontSize: 10, color: "#d1d5db", textAlign: "center", marginTop: 40 }}>Powered by Diagon</p>
      </div>
    </div>
  );
}

function UploadItemCard({ item, token, linkId, submitUpload }: {
  item: { id: string; templateItemId: string; templateItemName: string; templateItemDescription: string | null; required: boolean; status: string };
  token: string; linkId: string;
  submitUpload: ReturnType<typeof useSubmitUpload>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDone = item.status !== "pending";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data } = await supabase.from("upload_links").select("borrower_id").eq("id", linkId).single();
    if (!data) return;
    await submitUpload.mutateAsync({ token, templateItemId: item.templateItemId, file, borrowerId: data.borrower_id });
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10,
      border: isDone ? "1px solid #d1fae5" : "1px solid #e5e7eb",
      background: isDone ? "#f0fdf4" : "white",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: isDone ? "#16a34a" : "#f3f4f6",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isDone ? <Check style={{ width: 14, height: 14, color: "white" }} /> : <FileText style={{ width: 14, height: 14, color: "#9ca3af" }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: isDone ? "#6b7280" : "#111" }}>
          {item.templateItemName}
          {item.required && <span style={{ color: "#d1d5db", marginLeft: 4 }}>*</span>}
        </p>
        {item.templateItemDescription && (
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{item.templateItemDescription}</p>
        )}
      </div>
      {isDone ? (
        <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#dcfce7", padding: "3px 8px", borderRadius: 4 }}>Uploaded</span>
      ) : (
        <>
          <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
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
      )}
    </div>
  );
}
