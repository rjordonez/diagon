import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, Upload, FileText, HelpCircle, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/demo/lib/utils";
import { supabase } from "@/lib/supabase";
import { useMyApplications, useApplication } from "../hooks/usePortalData";
import { usePublicUploadItems, useSubmitUpload, type PublicUploadItem } from "@/hooks/usePublicUpload";

export const PortalDocumentsPage = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const { data: applications = [] } = useMyApplications();
  const id = paramId || applications[0]?.id;
  const { data: app, isLoading } = useApplication(id);
  const uploadLinkId = app?.upload_links?.id;
  const token = app?.upload_links?.token;
  const borrowerId = app?.upload_links?.borrower_id;
  const { data: items = [] } = usePublicUploadItems(uploadLinkId);
  const submitUpload = useSubmitUpload();

  const [gateAnswers, setGateAnswers] = useState<Record<string, string>>({});

  if (isLoading) return <p className="text-sm text-muted-foreground py-12 text-center">Loading...</p>;
  if (!app) return <p className="text-sm text-muted-foreground py-12 text-center">Application not found.</p>;

  // Group by section
  const sections = new Map<string, PublicUploadItem[]>();
  for (const item of items) {
    const sec = item.section || "Documents";
    if (!sections.has(sec)) sections.set(sec, []);
    sections.get(sec)!.push(item);
  }

  const docItems = items.filter((i) => i.itemType !== "question");
  const uploadedCount = docItems.filter((i) => i.status !== "pending").length;
  const totalCount = docItems.length;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/portal" className="text-xs text-muted-foreground flex items-center gap-1 mb-3 hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to Overview
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Upload the required documents for your application</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-foreground rounded-full transition-all"
            style={{ width: totalCount > 0 ? `${(uploadedCount / totalCount) * 100}%` : "0%" }} />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{uploadedCount}/{totalCount}</span>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {Array.from(sections.entries()).map(([sectionName, sectionItems]) => (
          <DocumentSection
            key={sectionName}
            title={sectionName}
            items={sectionItems}
            gateAnswers={gateAnswers}
            setGateAnswers={setGateAnswers}
            token={token}
            borrowerId={borrowerId}
            submitUpload={submitUpload}
          />
        ))}
      </div>
    </div>
  );
};

function DocumentSection({ title, items, gateAnswers, setGateAnswers, token, borrowerId, submitUpload }: {
  title: string;
  items: PublicUploadItem[];
  gateAnswers: Record<string, string>;
  setGateAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  token: string;
  borrowerId: string;
  submitUpload: ReturnType<typeof useSubmitUpload>;
}) {
  const [open, setOpen] = useState(true);
  const gateItem = items.find((i) => i.itemType === "question");
  const docItems = items.filter((i) => i.itemType !== "question");
  const gateKey = gateItem?.itemKey;

  // If there's a gate and user hasn't answered yet, or answered No
  const gateBlocked = gateKey && gateAnswers[gateKey] !== "yes";
  const uploaded = docItems.filter((i) => i.status !== "pending").length;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 cursor-pointer" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        <span className="text-sm font-semibold flex-1">{title}</span>
        {!gateBlocked && (
          <span className="text-[10px] text-muted-foreground">{uploaded}/{docItems.length}</span>
        )}
      </div>

      {open && (
        <div>
          {/* Gate question */}
          {gateItem && (
            <div className="px-4 py-3 border-b border-border bg-blue-500/5">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{gateItem.templateItemName}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="radio" name={gateKey!} checked={gateAnswers[gateKey!] === "yes"}
                        onChange={() => setGateAnswers((p) => ({ ...p, [gateKey!]: "yes" }))} />
                      Yes
                    </label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="radio" name={gateKey!} checked={gateAnswers[gateKey!] === "no"}
                        onChange={() => setGateAnswers((p) => ({ ...p, [gateKey!]: "no" }))} />
                      No
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          {gateBlocked ? (
            gateAnswers[gateKey!] === "no" ? (
              <div className="px-4 py-3 text-xs text-muted-foreground">Not applicable — skipped</div>
            ) : (
              <div className="px-4 py-3 text-xs text-muted-foreground">Answer the question above to continue</div>
            )
          ) : (
            <div className="divide-y divide-border/60">
              {docItems.map((item) => (
                <UploadRow key={item.id} item={item} token={token} borrowerId={borrowerId} submitUpload={submitUpload} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UploadRow({ item, token, borrowerId, submitUpload }: {
  item: PublicUploadItem; token: string; borrowerId: string;
  submitUpload: ReturnType<typeof useSubmitUpload>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploading = submitUpload.isPending;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !borrowerId) return;
    await submitUpload.mutateAsync({ token, templateItemId: item.templateItemId, file, borrowerId });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={cn("h-6 w-6 rounded-full flex items-center justify-center shrink-0",
        item.status !== "pending" ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
        {item.status !== "pending" ? <Check className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{item.templateItemName}{item.required && <span className="text-muted-foreground">*</span>}</p>
        {item.templateItemDescription && <p className="text-xs text-muted-foreground">{item.templateItemDescription}</p>}
      </div>
      {item.status === "pending" ? (
        <>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
            className="h-8 px-3 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-1">
            {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload
          </button>
        </>
      ) : (
        <span className="text-[10px] font-medium bg-foreground/10 text-foreground px-2 py-1 rounded">Uploaded</span>
      )}
    </div>
  );
}
