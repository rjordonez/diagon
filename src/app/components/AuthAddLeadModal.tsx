import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { LEAD_SOURCES, LOAN_PURPOSES, LOAN_TYPES } from "@/demo/crm/data/mockData";
import { useAddBorrower } from "../hooks/useSupabaseData";

export const AuthAddLeadModal = ({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) => {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", birthday: "",
    loanType: "", loanPurpose: "", loanAmount: "", leadSource: "", notes: "",
  });

  const addBorrower = useAddBorrower();

  const update = (field: string, value: string | boolean) => setForm((p) => ({ ...p, [field]: value }));

  const reset = () => setForm({
    firstName: "", lastName: "", email: "", phone: "", birthday: "",
    loanType: "", loanPurpose: "", loanAmount: "", leadSource: "", notes: "",
  });

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.loanPurpose || !form.leadSource) return;

    await addBorrower.mutateAsync({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      birthday: form.birthday || undefined,
      loanType: form.loanType || undefined,
      loanPurpose: form.loanPurpose,
      loanAmount: parseInt(form.loanAmount.replace(/[^0-9]/g, "")) || 0,
      leadSource: form.leadSource,
      notes: form.notes,
    });

    reset();
    onCreated();
    onClose();
  };

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      <div className="relative w-full sm:max-w-[540px] max-h-[95dvh] sm:max-h-[85vh] bg-background border border-border rounded-t-2xl sm:rounded-xl shadow-lg flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Add New Lead</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Create a new lead in your pipeline</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" required value={form.firstName} onChange={(v) => update("firstName", v)} />
            <Field label="Last Name" required value={form.lastName} onChange={(v) => update("lastName", v)} />
          </div>
          <Field label="Email" required value={form.email} onChange={(v) => update("email", v)} type="email" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
            <Field label="Birthday" value={form.birthday} onChange={(v) => update("birthday", v)} type="date" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Loan Type
              </label>
              <select value={form.loanType} onChange={(e) => update("loanType", e.target.value)} className="form-input">
                <option value="">Select...</option>
                <optgroup label="QM Programs">
                  {["Conventional", "FHA", "VA", "USDA", "Jumbo QM"].map((t) => <option key={t} value={t}>{t}</option>)}
                </optgroup>
                <optgroup label="Non-QM Programs">
                  {["DSCR", "Bank Statement / Alt Doc", "Asset Depletion", "Full Doc Non-QM", "1099", "40-Year", "WVOE"].map((t) => <option key={t} value={t}>{t}</option>)}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Loan Purpose<span className="text-foreground ml-0.5">*</span>
              </label>
              <select value={form.loanPurpose} onChange={(e) => update("loanPurpose", e.target.value)} className="form-input">
                <option value="">Select...</option>
                {LOAN_PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <Field label="Est. Loan Amount" value={form.loanAmount} onChange={(v) => update("loanAmount", v)} placeholder="$500,000" />

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Lead Source<span className="text-foreground ml-0.5">*</span>
            </label>
            <select value={form.leadSource} onChange={(e) => update("leadSource", e.target.value)} className="form-input">
              <option value="">Select...</option>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} className="form-input resize-none" placeholder="Internal notes..." />
          </div>

          <label className="hidden">
          </label>
        </div>

        <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-3 px-5 py-4 border-t border-border bg-background">
          <button onClick={onClose} className="h-11 px-6 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={addBorrower.isPending}
            className="h-11 px-6 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {addBorrower.isPending ? "Creating..." : "Create Lead"}
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
