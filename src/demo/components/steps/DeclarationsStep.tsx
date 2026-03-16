import React, { useState } from "react";
import { useWizard } from "@/demo/components/wizard/WizardContext";
import { StepNavigation } from "@/demo/components/wizard/StepNavigation";
import { FormField } from "@/demo/components/form/FormField";
import { CurrencyInput } from "@/demo/components/form/CurrencyInput";
import { cn } from "@/demo/lib/utils";

const YES_NO_QUESTIONS = [
  { key: "outstandingJudgments", label: "Are there any outstanding judgments against you?" },
  { key: "declaredBankruptcy", label: "Have you declared bankruptcy within the past 7 years?" },
  { key: "propertyForeclosed", label: "Have you had property foreclosed upon in the past 7 years?" },
  { key: "partyToLawsuit", label: "Are you a party to a lawsuit?" },
  { key: "delinquentFederalDebt", label: "Are you delinquent on any federal debt?" },
  { key: "borrowedDownPayment", label: "Are you borrowing any part of the down payment?" },
  { key: "coMakerOnLoan", label: "Are you a co-maker or endorser on a note?" },
  { key: "usCitizen", label: "Are you a U.S. citizen?" },
  { key: "primaryResidenceIntent", label: "Do you intend to occupy the property as your primary residence?" },
  { key: "ownershipInterest", label: "Have you had an ownership interest in a property in the past 3 years?" },
] as const;

export const DeclarationsStep = () => {
  const { data, updateData, markComplete } = useWizard();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    YES_NO_QUESTIONS.forEach((q) => {
      if (!(data as any)[q.key]) e[q.key] = "Required";
    });
    if (!data.alimonyChildSupport) e.alimonyChildSupport = "Required";
    if (data.alimonyChildSupport === "Yes" && !data.alimonyAmount) e.alimonyAmount = "Required";
    if (!data.eConsent) e.eConsent = "You must consent to proceed";
    if (!data.signature.trim()) e.signature = "Signature is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (validate()) { markComplete("declarations"); return true; }
    return false;
  };

  return (
    <div>
      <h1 className="section-title">Declarations & Agreements</h1>
      <p className="section-subtitle mt-1 mb-8">Please answer all questions truthfully</p>

      <div className="space-y-5">
        {YES_NO_QUESTIONS.map((q) => (
          <div key={q.key} className={cn("flex items-start justify-between py-3 border-b border-border", errors[q.key] && "border-destructive")}>
            <span className="text-sm text-foreground flex-1 pr-4">{q.label}<span className="form-required">*</span></span>
            <div className="flex gap-4 shrink-0">
              {["Yes", "No"].map((opt) => (
                <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" name={q.key} value={opt}
                    checked={(data as any)[q.key] === opt}
                    onChange={() => updateData({ [q.key]: opt } as any)}
                    className="w-4 h-4 accent-primary" />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* Alimony */}
        <div className={cn("flex items-start justify-between py-3 border-b border-border", errors.alimonyChildSupport && "border-destructive")}>
          <span className="text-sm text-foreground flex-1 pr-4">
            Are you obligated to pay alimony or child support?<span className="form-required">*</span>
          </span>
          <div className="flex gap-4 shrink-0">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="alimony" value={opt}
                  checked={data.alimonyChildSupport === opt}
                  onChange={() => updateData({ alimonyChildSupport: opt })}
                  className="w-4 h-4 accent-primary" />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {data.alimonyChildSupport === "Yes" && (
          <FormField label="Monthly Amount" required error={errors.alimonyAmount}>
            <div className="max-w-xs">
              <CurrencyInput value={data.alimonyAmount} onChange={(v) => updateData({ alimonyAmount: v })} error={!!errors.alimonyAmount} />
            </div>
          </FormField>
        )}

        {/* eConsent */}
        <div className="pt-6 border-t border-border">
          <label className={cn("flex items-start gap-3 cursor-pointer", errors.eConsent && "text-destructive")}>
            <input type="checkbox" checked={data.eConsent}
              onChange={(e) => updateData({ eConsent: e.target.checked })}
              className="w-4 h-4 mt-0.5 accent-primary" />
            <span className="text-sm">
              I consent to receive electronic documents and agree to the terms and conditions of this application.<span className="form-required">*</span>
            </span>
          </label>
          {errors.eConsent && <p className="form-error-text ml-7">{errors.eConsent}</p>}
        </div>

        {/* Signature */}
        <FormField label="Electronic Signature" required error={errors.signature}>
          <input value={data.signature} onChange={(e) => updateData({ signature: e.target.value })}
            placeholder="Type your full legal name"
            className={cn("form-input max-w-md italic", errors.signature && "form-input-error")} />
          <p className="text-xs text-muted-foreground mt-1">By typing your name, you are electronically signing this application.</p>
        </FormField>
      </div>

      <StepNavigation onContinue={handleContinue} />
    </div>
  );
};
