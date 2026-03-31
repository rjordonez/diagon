import { useState, useCallback, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2, Upload, FileText, Circle } from "lucide-react";
import { cn } from "@/demo/lib/utils";
import {
  useMyApplications,
  useApplication,
  useFormResponses,
  useSaveFormResponse,
  useSubmitApplication,
} from "../hooks/usePortalData";
import { usePublicUploadItems, useSubmitUpload, type PublicUploadItem } from "@/hooks/usePublicUpload";

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
  const handleTextChange = (itemId: string, value: string) => setTextValues((p) => ({ ...p, [itemId]: value }));

  // Build sections from upload items
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

  if (isLoading) return <p className="text-sm text-muted-foreground py-12 text-center">Loading...</p>;
  if (!app) return (
    <div className="py-16 text-center">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
      <h2 className="text-lg font-semibold mb-1">No Application Yet</h2>
      <p className="text-sm text-muted-foreground">Your loan officer will send you an invitation link to get started.</p>
    </div>
  );

  if (isSubmitted) {
    return (
      <div className="py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-foreground/10 flex items-center justify-center mx-auto mb-4">
          <Check className="h-7 w-7 text-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-1">Application Submitted</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">Your loan officer is reviewing your application.</p>
        <Link to="/portal/quote" className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors">
          View Quote <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  if (sections.length === 0) return <p className="text-sm text-muted-foreground py-12 text-center">Loading...</p>;

  const safeStep = Math.min(currentStep, sections.length - 1);
  const currentSection = sections[safeStep];
  const isLastStep = safeStep >= sections.length - 1;
  const allDocs = sections.flatMap((s) => s.docs);
  const completedDocs = allDocs.filter((d) => d.status !== "pending").length;

  const handleSubmit = async () => {
    if (id) { await submitApp.mutateAsync(id); navigate("/portal/quote"); }
  };

  return (
    <div className="flex gap-6">
      {/* Left: Section stepper */}
      <div className="w-48 shrink-0 hidden md:flex flex-col">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sections</p>
        <div className="space-y-0.5">
          {sections.map((sec, i) => {
            const isActive = i === safeStep;
            const isComplete = sec.uploaded === sec.total && sec.total > 0;
            const isGateSkipped = sec.gate && gateAnswers[sec.gate.itemKey!] === "no";

            return (
              <button key={i} onClick={() => setCurrentStep(i)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors text-xs",
                  isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}>
                {isComplete || isGateSkipped ? (
                  <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                ) : isActive ? (
                  <Circle className="h-3.5 w-3.5 fill-foreground text-foreground shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                )}
                <span className="truncate">{sec.title}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground">{completedDocs}/{allDocs.length} documents uploaded</p>
          <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
            <div className="h-full bg-foreground rounded-full transition-all"
              style={{ width: allDocs.length > 0 ? `${(completedDocs / allDocs.length) * 100}%` : "0%" }} />
          </div>
        </div>
      </div>

      {/* Right: Current section */}
      <div className="flex-1 min-w-0">
        {/* Mobile step indicator */}
        <div className="md:hidden mb-4">
          <p className="text-xs text-muted-foreground mb-2">Section {safeStep + 1} of {sections.length}</p>
          <div className="flex items-center gap-1">
            {sections.map((_, i) => (
              <button key={i} onClick={() => setCurrentStep(i)}
                className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= safeStep ? "bg-foreground" : "bg-muted")} />
            ))}
          </div>
        </div>

        {/* Section content */}
        <div>
          <div className="mb-5 pb-4 border-b border-border">
            <h2 className="text-lg font-semibold">{currentSection.title}</h2>
            {!currentSection.gate && (
              <p className="text-xs text-muted-foreground mt-0.5">{currentSection.uploaded}/{currentSection.total} completed</p>
            )}
          </div>

          <div className="space-y-3">
            {/* Gate question */}
            {currentSection.gate && (
              <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-4 mb-2">
                <p className="text-sm font-medium mb-3">{currentSection.gate.templateItemName}</p>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name={`gate_${safeStep}`}
                      checked={gateAnswers[currentSection.gate.itemKey!] === "yes"}
                      onChange={() => setGateAnswers((p) => ({ ...p, [currentSection.gate!.itemKey!]: "yes" }))} /> Yes
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name={`gate_${safeStep}`}
                      checked={gateAnswers[currentSection.gate.itemKey!] === "no"}
                      onChange={() => setGateAnswers((p) => ({ ...p, [currentSection.gate!.itemKey!]: "no" }))} /> No
                  </label>
                </div>
              </div>
            )}

            {/* Docs — show if no gate or gate = yes */}
            {(!currentSection.gate || gateAnswers[currentSection.gate.itemKey!] === "yes") &&
              currentSection.docs.map((item) => (
                <DocRow key={item.id} item={item} token={token} borrowerId={borrowerId} submitUpload={submitUpload} textValues={textValues} onTextChange={handleTextChange} />
              ))
            }

            {currentSection.gate && gateAnswers[currentSection.gate.itemKey!] === "no" && (
              <p className="text-sm text-muted-foreground py-2">Not applicable — skip to the next section.</p>
            )}

            {currentSection.gate && !gateAnswers[currentSection.gate.itemKey!] && (
              <p className="text-sm text-muted-foreground py-2">Answer the question above to continue.</p>
            )}
          </div>
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between pt-5">
          <button onClick={() => setCurrentStep(Math.max(0, safeStep - 1))} disabled={safeStep === 0}
            className="h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-30 flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          {isLastStep ? (
            <button onClick={handleSubmit} disabled={submitApp.isPending}
              className="h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-1.5">
              {submitApp.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Submit Application
            </button>
          ) : (
            <button onClick={() => setCurrentStep(safeStep + 1)}
              className="h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center gap-1.5">
              Next <ArrowRight className="h-3.5 w-3.5" />
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
  const isText = item.inputType === "text";
  const isDone = item.status !== "pending";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !borrowerId) return;
    await submitUpload.mutateAsync({ token, templateItemId: item.templateItemId, file, borrowerId });
  };

  if (isText) {
    return (
      <div className="space-y-1.5 px-1">
        <label className="text-sm font-medium">{item.templateItemName}</label>
        {item.templateItemDescription && <p className="text-xs text-muted-foreground">{item.templateItemDescription}</p>}
        <input
          type="text"
          value={textValues[item.id] || ""}
          onChange={(e) => onTextChange(item.id, e.target.value)}
          placeholder={`Enter ${item.templateItemName.toLowerCase()}...`}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-colors"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors",
      isDone ? "border-foreground/20 bg-foreground/[0.02]" : "border-border")}>
      <div className={cn("h-6 w-6 rounded-full flex items-center justify-center shrink-0",
        isDone ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
        {isDone ? <Check className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", isDone && "text-muted-foreground")}>{item.templateItemName}</p>
        {item.templateItemDescription && <p className="text-xs text-muted-foreground">{item.templateItemDescription}</p>}
      </div>
      {!isDone ? (
        <>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
          <button onClick={() => fileInputRef.current?.click()} disabled={submitUpload.isPending}
            className="h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-1.5">
            {submitUpload.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Choose file
          </button>
        </>
      ) : (
        <span className="text-xs font-medium bg-foreground/10 text-foreground px-2.5 py-1 rounded-md">Done</span>
      )}
    </div>
  );
}
