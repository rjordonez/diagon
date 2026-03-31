import { useRef } from "react";
import { useParams } from "react-router-dom";
import { Upload, Check, FileText, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/demo/lib/utils";
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-lg font-semibold mb-1">Invalid Link</h1>
          <p className="text-sm text-muted-foreground">This upload link doesn't exist or has expired.</p>
        </div>
      </div>
    );
  }

  if (link.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-lg font-semibold mb-1">Link Expired</h1>
          <p className="text-sm text-muted-foreground">This upload link has expired. Please contact your loan officer for a new one.</p>
        </div>
      </div>
    );
  }

  const uploadedCount = items.filter((i) => i.status !== "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-full bg-foreground/10 flex items-center justify-center mx-auto mb-3">
            <Upload className="h-6 w-6 text-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Document Upload</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hi {link.borrowerName.split(" ")[0]}, please upload the following documents for your loan application.
          </p>
        </div>

        {/* Progress */}
        {items.length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground rounded-full transition-all"
                style={{ width: `${(uploadedCount / items.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{uploadedCount} of {items.length}</span>
          </div>
        )}

        {/* All done */}
        {uploadedCount === items.length && items.length > 0 && (
          <div className="bg-foreground/5 border border-border rounded-lg p-4 mb-6 text-center">
            <Check className="h-6 w-6 text-foreground mx-auto mb-1" />
            <p className="text-sm font-medium">All documents uploaded!</p>
            <p className="text-xs text-muted-foreground">Your loan officer will review them shortly.</p>
          </div>
        )}

        {/* Items */}
        <div className="space-y-2">
          {items.map((item) => (
            <UploadItemCard key={item.id} item={item} token={token!} linkId={link.id} submitUpload={submitUpload} />
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-8">
          Powered by Diagon
        </p>
      </div>
    </div>
  );
}

function UploadItemCard({ item, token, linkId, submitUpload }: {
  item: { id: string; templateItemId: string; templateItemName: string; templateItemDescription: string | null; required: boolean; status: string };
  token: string;
  linkId: string;
  submitUpload: ReturnType<typeof useSubmitUpload>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploading = submitUpload.isPending;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data } = await supabase.from("upload_links").select("borrower_id").eq("id", linkId).single();

    if (!data) return;

    await submitUpload.mutateAsync({
      token,
      templateItemId: item.templateItemId,
      file,
      borrowerId: data.borrower_id,
    });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border">
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
        item.status !== "pending" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
      )}>
        {item.status !== "pending" ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {item.templateItemName}
          {item.required && <span className="text-xs text-muted-foreground ml-1">*</span>}
        </p>
        {item.templateItemDescription && (
          <p className="text-xs text-muted-foreground">{item.templateItemDescription}</p>
        )}
      </div>
      {item.status === "pending" ? (
        <>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-8 px-3 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Upload
          </button>
        </>
      ) : (
        <span className="text-xs font-medium text-foreground bg-foreground/10 px-2 py-1 rounded">Uploaded</span>
      )}
    </div>
  );
}
