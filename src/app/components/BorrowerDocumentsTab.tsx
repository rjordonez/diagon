import { useState } from "react";
import { Link2, Copy, Check, FileText, Upload, ExternalLink, HelpCircle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/demo/lib/utils";
import { useTemplates, useUploadLink, useCreateUploadLink, useUploadItems, type UploadItem } from "../hooks/useTemplateData";

interface Borrower {
  id: string;
  firstName: string;
  lastName: string;
}

export const BorrowerDocumentsTab = ({ borrower }: { borrower: Borrower }) => {
  const { data: templates = [] } = useTemplates();
  const { data: uploadLink, isLoading: linkLoading } = useUploadLink(borrower.id);
  const createUploadLink = useCreateUploadLink();
  const { data: uploadItems = [] } = useUploadItems(uploadLink?.id);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedAddonId, setSelectedAddonId] = useState("");
  const [copied, setCopied] = useState(false);

  const baseTemplates = templates.filter((t) => !t.isAddon);
  const addonTemplates = templates.filter((t) => t.isAddon);

  const inputClass = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-colors";

  const handleGenerateLink = async () => {
    if (!selectedTemplateId) return;
    await createUploadLink.mutateAsync({ borrowerId: borrower.id, templateId: selectedTemplateId, addonTemplateId: selectedAddonId || undefined });
  };

  const uploadUrl = uploadLink ? `${window.location.origin}/portal/invite/${uploadLink.token}` : "";
  const handleCopy = () => { navigator.clipboard.writeText(uploadUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // Count only document items (not gate questions)
  const docItems = uploadItems.filter((i) => !i.itemType || i.itemType === "document");
  const uploadedCount = docItems.filter((i) => i.status !== "pending").length;
  const totalCount = docItems.length;

  if (linkLoading) return <p className="text-sm text-muted-foreground py-4">Loading...</p>;

  // No upload link — template picker
  if (!uploadLink) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Select a template to generate an upload link for {borrower.firstName}.</p>
        {baseTemplates.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-2">No templates yet.</p>
            <a href="/app/templates" className="text-sm text-foreground underline">Create a template first</a>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Template</label>
              <select className={inputClass} value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                <option value="">Select...</option>
                {baseTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            {addonTemplates.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Borrower Profile</label>
                <select className={inputClass} value={selectedAddonId} onChange={(e) => setSelectedAddonId(e.target.value)}>
                  <option value="">None</option>
                  {addonTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
            <button onClick={handleGenerateLink} disabled={!selectedTemplateId || createUploadLink.isPending}
              className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> {createUploadLink.isPending ? "Creating..." : "Generate Link"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Group items by section
  const sections = new Map<string, UploadItem[]>();
  for (const item of uploadItems) {
    // Use section from the joined template_items data
    const sec = item.section || "Documents";
    if (!sections.has(sec)) sections.set(sec, []);
    sections.get(sec)!.push(item);
  }

  return (
    <div className="space-y-4">
      {/* Link */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" /> {uploadLink.templateName}
          </span>
          <span className="text-xs text-muted-foreground">
            Expires {new Date(uploadLink.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
        <div className="flex gap-2">
          <input type="text" readOnly value={uploadUrl} className={inputClass + " text-xs bg-background"} />
          <button onClick={handleCopy} className="h-10 px-3 rounded-lg border border-border text-sm hover:bg-muted transition-colors shrink-0 flex items-center gap-1">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <a href={uploadUrl} target="_blank" rel="noopener noreferrer"
            className="h-10 px-3 rounded-lg border border-border text-sm hover:bg-muted transition-colors shrink-0 flex items-center">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-foreground rounded-full transition-all"
            style={{ width: totalCount > 0 ? `${(uploadedCount / totalCount) * 100}%` : "0%" }} />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{uploadedCount} / {totalCount} uploaded</span>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {Array.from(sections.entries()).map(([sectionName, items]) => (
          <SectionCard key={sectionName} title={sectionName} items={items} />
        ))}
      </div>
    </div>
  );
};

function SectionCard({ title, items }: { title: string; items: UploadItem[] }) {
  const [open, setOpen] = useState(true);

  // Separate gate questions from document items
  const gateItem = items.find((i) => i.itemType === "question");
  const docItems = items.filter((i) => !i.itemType || i.itemType === "document");

  const uploadedInSection = docItems.filter((i) => i.status !== "pending").length;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 cursor-pointer" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex-1">{title}</span>
        <span className="text-[10px] text-muted-foreground">
          {uploadedInSection}/{docItems.length}
        </span>
      </div>

      {open && (
        <div>
          {/* Gate question if present */}
          {gateItem && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/5 border-b border-border">
              <HelpCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span className="text-sm flex-1">{gateItem.templateItemName}</span>
              <span className="text-xs text-muted-foreground">Borrower answers Yes/No</span>
            </div>
          )}

          {/* Document items */}
          <div className="divide-y divide-border/60">
            {docItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                  item.status !== "pending" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                )}>
                  {item.status !== "pending" ? <Check className="h-3 w-3" /> : <span className="text-[9px]">{docItems.indexOf(item) + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{item.templateItemName}</p>
                  {item.templateItemDescription && (
                    <p className="text-xs text-muted-foreground">{item.templateItemDescription}</p>
                  )}
                </div>
                {item.status === "pending" ? (
                  <span className="text-[10px] text-muted-foreground">Pending</span>
                ) : (
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded",
                    item.status === "verified" ? "bg-foreground text-background" : "bg-muted text-foreground"
                  )}>{item.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
