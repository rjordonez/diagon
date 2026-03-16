import React, { useState } from "react";
import { useWizard } from "@/demo/components/wizard/WizardContext";
import { StepNavigation } from "@/demo/components/wizard/StepNavigation";
import { FormField } from "@/demo/components/form/FormField";
import { PhoneInput } from "@/demo/components/form/PhoneInput";
import { CurrencyInput } from "@/demo/components/form/CurrencyInput";
import { SelectInput } from "@/demo/components/form/SelectInput";
import { AddressGroup } from "@/demo/components/form/AddressGroup";
import { cn } from "@/demo/lib/utils";

const EMPLOYMENT_TYPES = [
  { value: "W-2", label: "W-2" }, { value: "Self-Employed", label: "Self-Employed" },
  { value: "Contract", label: "Contract" }, { value: "Retired", label: "Retired" },
  { value: "Other", label: "Other" },
];

const PAY_FREQ = [
  { value: "Weekly", label: "Weekly" }, { value: "Bi-weekly", label: "Bi-weekly" },
  { value: "Semi-monthly", label: "Semi-monthly" }, { value: "Monthly", label: "Monthly" },
  { value: "Annually", label: "Annually" },
];

const OTHER_INCOME_TYPES = [
  { value: "Social Security", label: "Social Security" }, { value: "Rental", label: "Rental Income" },
  { value: "Pension", label: "Pension" }, { value: "Disability", label: "Disability" },
  { value: "Other", label: "Other" },
];

export const IncomeStep = () => {
  const { data, updateData, markComplete } = useWizard();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!data.employerName.trim()) e.employerName = "Required";
    if (!data.employerPhone || data.employerPhone.replace(/\D/g, "").length !== 10) e.employerPhone = "Required";
    if (!data.employmentStartDate) e.employmentStartDate = "Required";
    if (!data.employmentType) e.employmentType = "Required";
    if (!data.jobTitle.trim()) e.jobTitle = "Required";
    if (!data.baseSalary) e.baseSalary = "Required";
    if (!data.payFrequency) e.payFrequency = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (validate()) { markComplete("income"); return true; }
    return false;
  };

  return (
    <div>
      <h1 className="section-title">Income</h1>
      <p className="section-subtitle mt-1 mb-8">Current employment and income details</p>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Employer Name" required error={errors.employerName}>
            <input value={data.employerName} onChange={(e) => updateData({ employerName: e.target.value })}
              placeholder="Acme Corp" className={cn("form-input", errors.employerName && "form-input-error")} />
          </FormField>
          <FormField label="Employer Phone" required error={errors.employerPhone}>
            <PhoneInput value={data.employerPhone} onChange={(v) => updateData({ employerPhone: v })} error={!!errors.employerPhone} />
          </FormField>
        </div>

        <AddressGroup label="Employer Address" value={data.employerAddress}
          onChange={(v) => updateData({ employerAddress: v })} required />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Employment Start Date" required error={errors.employmentStartDate}>
            <input type="month" value={data.employmentStartDate}
              onChange={(e) => updateData({ employmentStartDate: e.target.value })}
              className={cn("form-input", errors.employmentStartDate && "form-input-error")} />
          </FormField>
          <FormField label="Employment Type" required error={errors.employmentType}>
            <SelectInput value={data.employmentType} onChange={(v) => updateData({ employmentType: v })}
              options={EMPLOYMENT_TYPES} error={!!errors.employmentType} />
          </FormField>
          <FormField label="Job Title / Position" required error={errors.jobTitle}>
            <input value={data.jobTitle} onChange={(e) => updateData({ jobTitle: e.target.value })}
              placeholder="Software Engineer" className={cn("form-input", errors.jobTitle && "form-input-error")} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Base Salary / Income (Annual)" required error={errors.baseSalary}>
            <CurrencyInput value={data.baseSalary} onChange={(v) => updateData({ baseSalary: v })} error={!!errors.baseSalary} />
          </FormField>
          <FormField label="Pay Frequency" required error={errors.payFrequency}>
            <SelectInput value={data.payFrequency} onChange={(v) => updateData({ payFrequency: v })}
              options={PAY_FREQ} error={!!errors.payFrequency} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Overtime Income">
            <CurrencyInput value={data.overtimeIncome} onChange={(v) => updateData({ overtimeIncome: v })} />
          </FormField>
          <FormField label="Bonus Income">
            <CurrencyInput value={data.bonusIncome} onChange={(v) => updateData({ bonusIncome: v })} />
          </FormField>
          <FormField label="Commission Income">
            <CurrencyInput value={data.commissionIncome} onChange={(v) => updateData({ commissionIncome: v })} />
          </FormField>
        </div>

        {data.employmentType === "Self-Employed" && (
          <FormField label="Self-Employment Income (Annual)">
            <CurrencyInput value={data.selfEmploymentIncome} onChange={(v) => updateData({ selfEmploymentIncome: v })} />
          </FormField>
        )}

        <div className="pt-4 border-t border-border">
          <p className="form-label font-semibold mb-4">Other Income</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Income Type">
              <SelectInput value={data.otherIncomeType} onChange={(v) => updateData({ otherIncomeType: v })}
                options={OTHER_INCOME_TYPES} />
            </FormField>
            <FormField label="Annual Amount">
              <CurrencyInput value={data.otherIncomeAmount} onChange={(v) => updateData({ otherIncomeAmount: v })} />
            </FormField>
          </div>
        </div>
      </div>

      <StepNavigation onContinue={handleContinue} />
    </div>
  );
};
