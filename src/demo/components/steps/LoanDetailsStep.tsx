import React, { useState } from "react";
import { useWizard } from "@/demo/components/wizard/WizardContext";
import { StepNavigation } from "@/demo/components/wizard/StepNavigation";
import { FormField } from "@/demo/components/form/FormField";
import { CurrencyInput } from "@/demo/components/form/CurrencyInput";
import { SelectInput } from "@/demo/components/form/SelectInput";
import { cn } from "@/demo/lib/utils";

const LOAN_PURPOSES = [
  { value: "Purchase", label: "Purchase" },
  { value: "Refinance", label: "Refinance" },
  { value: "Cash-Out Refinance", label: "Cash-Out Refinance" },
  { value: "Construction", label: "Construction" },
];

export const LoanDetailsStep = () => {
  const { data, updateData, markComplete } = useWizard();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!data.loanAmount) e.loanAmount = "Required";
    if (!data.loanPurpose) e.loanPurpose = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (validate()) { markComplete("loan-details"); return true; }
    return false;
  };

  return (
    <div>
      <h1 className="section-title">Loan Details</h1>
      <p className="section-subtitle mt-1 mb-8">Tell us about the loan you're seeking</p>

      <div className="space-y-6">
        <FormField label="Loan Amount" required error={errors.loanAmount}>
          <div className="max-w-sm">
            <CurrencyInput value={data.loanAmount} onChange={(v) => updateData({ loanAmount: v })} error={!!errors.loanAmount} placeholder="1,600,000" />
          </div>
        </FormField>

        <div>
          <label className="form-label block mb-1.5 uppercase tracking-wider text-xs font-bold">
            Loan Purpose<span className="form-required">*</span>
          </label>
          <div className="max-w-sm">
            <SelectInput value={data.loanPurpose} onChange={(v) => updateData({ loanPurpose: v })}
              options={LOAN_PURPOSES} error={!!errors.loanPurpose} />
          </div>
          {errors.loanPurpose && <p className="form-error-text">{errors.loanPurpose}</p>}
        </div>
      </div>

      <StepNavigation onContinue={handleContinue} />
    </div>
  );
};
