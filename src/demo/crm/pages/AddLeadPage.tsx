import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { LEAD_SOURCES, LOAN_PURPOSES, MOCK_BORROWERS, type Borrower } from "../data/mockData";

export const AddLeadModal = ({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) => {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    loanPurpose: "", loanAmount: "", leadSource: "", notes: "",
    speedToLead: false,
  });

  const update = (field: string, value: string | boolean) => setForm((p) => ({ ...p, [field]: value }));

  const reset = () => setForm({
    firstName: "", lastName: "", email: "", phone: "",
    loanPurpose: "", loanAmount: "", leadSource: "", notes: "",
    speedToLead: false,
  });

  const handleCreate = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.loanPurpose || !form.leadSource) return;

    const newBorrower: Borrower = {
      id: String(Date.now()),
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || "",
      loanAmount: parseInt(form.loanAmount.replace(/[^0-9]/g, "")) || 0,
      loanType: "",
      loanPurpose: form.loanPurpose,
      stage: "new-lead",
      leadTemp: "warm",
      leadScore: 50,
      daysInStage: 0,
      leadSource: form.leadSource,
      docsRequested: 0,
      docsReceived: 0,
      docsVerified: 0,
      aiFlags: 0,
      verificationStatus: "pending",
      lastActivity: "Just now",
      nextAction: "Initial outreach",
      assignedLO: "Sarah Chen",
      notes: form.notes,
      createdAt: new Date().toISOString().split("T")[0],
      birthday: null,
      speedToLeadEnabled: form.speedToLead,
      isActiveLead: null,
      diagonSequence: null,
      diagonUploadLinkId: null,
    };

    MOCK_BORROWERS.unshift(newBorrower);
    reset();
    onCreated();
    onClose();
  };

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />

      {/* Modal — full-height sheet on mobile, centered card on desktop */}
      <div className="relative w-full sm:max-w-[540px] max-h-[95dvh] sm:max-h-[85vh] bg-background border border-border rounded-t-2xl sm:rounded-xl shadow-lg flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Add New Lead</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Create a new lead in your pipeline</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" required value={form.firstName} onChange={(v) => update("firstName", v)} />
            <Field label="Last Name" required value={form.lastName} onChange={(v) => update("lastName", v)} />
          </div>
          <Field label="Email" required value={form.email} onChange={(v) => update("email", v)} type="email" />
          <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Loan Purpose<span className="text-foreground ml-0.5">*</span>
            </label>
            <select
              value={form.loanPurpose}
              onChange={(e) => update("loanPurpose", e.target.value)}
              className="form-input"
            >
              <option value="">Select...</option>
              {LOAN_PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <Field label="Est. Loan Amount" value={form.loanAmount} onChange={(v) => update("loanAmount", v)} placeholder="$500,000" />

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Lead Source<span className="text-foreground ml-0.5">*</span>
            </label>
            <select
              value={form.leadSource}
              onChange={(e) => update("leadSource", e.target.value)}
              className="form-input"
            >
              <option value="">Select...</option>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="form-input resize-none"
              placeholder="Internal notes..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.speedToLead}
              onChange={(e) => update("speedToLead", e.target.checked)}
              className="w-4 h-4 accent-foreground rounded"
            />
            <span className="text-sm">Enable Speed to Lead (start follow-up sequence immediately)</span>
          </label>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-3 px-5 py-4 border-t border-border bg-background">
          <button onClick={onClose} className="h-11 px-6 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="h-11 px-6 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            Create Lead
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, required, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string; placeholder?: string;
}) => (
  <div>
    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
      {label}{required && <span className="text-foreground ml-0.5">*</span>}
    </label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="form-input" />
  </div>
);
