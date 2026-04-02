import { createContext, useContext, useState, type ReactNode } from "react";

export interface ExtractionResult {
  templateItemId: string;
  templateItemName: string;
  extractedValue: string;
  currentValue: string | null;
  hasDiscrepancy: boolean;
  status: "pending" | "accepted" | "rejected";
}

export interface UploadedDoc {
  id: string;
  fileName: string;
  documentType: string;
  status: "uploading" | "extracting" | "done" | "error";
  extractedCount: number;
}

interface ExtractionContextValue {
  extractedFields: Record<string, ExtractionResult>;
  uploadedDocs: UploadedDoc[];
  addExtraction: (results: ExtractionResult[]) => void;
  addUploadedDoc: (doc: UploadedDoc) => void;
  updateDocStatus: (id: string, status: UploadedDoc["status"], extractedCount?: number) => void;
  resolveDiscrepancy: (templateItemId: string, useExtracted: boolean) => void;
  getExtractedValue: (templateItemId: string) => ExtractionResult | undefined;
}

const ExtractionContext = createContext<ExtractionContextValue | null>(null);

export function ExtractionProvider({ children }: { children: ReactNode }) {
  const [extractedFields, setExtractedFields] = useState<Record<string, ExtractionResult>>({});
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  const addExtraction = (results: ExtractionResult[]) => {
    setExtractedFields((prev) => {
      const next = { ...prev };
      for (const r of results) {
        next[r.templateItemId] = r;
      }
      return next;
    });
  };

  const addUploadedDoc = (doc: UploadedDoc) => {
    setUploadedDocs((prev) => [doc, ...prev]);
  };

  const updateDocStatus = (id: string, status: UploadedDoc["status"], extractedCount?: number) => {
    setUploadedDocs((prev) =>
      prev.map((d) => d.id === id ? { ...d, status, ...(extractedCount !== undefined ? { extractedCount } : {}) } : d)
    );
  };

  const resolveDiscrepancy = (templateItemId: string, useExtracted: boolean) => {
    setExtractedFields((prev) => {
      const field = prev[templateItemId];
      if (!field) return prev;
      return {
        ...prev,
        [templateItemId]: {
          ...field,
          status: useExtracted ? "accepted" : "rejected",
          hasDiscrepancy: false,
        },
      };
    });
  };

  const getExtractedValue = (templateItemId: string) => extractedFields[templateItemId];

  return (
    <ExtractionContext.Provider value={{ extractedFields, uploadedDocs, addExtraction, addUploadedDoc, updateDocStatus, resolveDiscrepancy, getExtractedValue }}>
      {children}
    </ExtractionContext.Provider>
  );
}

export function useExtraction() {
  const ctx = useContext(ExtractionContext);
  if (!ctx) throw new Error("useExtraction must be used within ExtractionProvider");
  return ctx;
}
