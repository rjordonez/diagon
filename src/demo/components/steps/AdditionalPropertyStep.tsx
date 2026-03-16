import React, { useState } from "react";
import { useWizard } from "@/demo/components/wizard/WizardContext";
import { StepNavigation } from "@/demo/components/wizard/StepNavigation";
import { FormField } from "@/demo/components/form/FormField";
import { CurrencyInput } from "@/demo/components/form/CurrencyInput";
import { SelectInput } from "@/demo/components/form/SelectInput";
import { AddressGroup } from "@/demo/components/form/AddressGroup";

const PROPERTY_STATUSES = [
  { value: "Sold", label: "Sold" }, { value: "Pending Sale", label: "Pending Sale" },
  { value: "Retaining", label: "Retaining" }, { value: "Investment", label: "Investment" },
];

export const AdditionalPropertyStep = () => {
  const { data, updateData, markComplete } = useWizard();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!data.ownsOtherRealEstate) e.ownsOtherRealEstate = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (validate()) { markComplete("additional-property"); return true; }
    return false;
  };

  return (
    <div>
      <h1 className="section-title">Additional Property</h1>
      <p className="section-subtitle mt-1 mb-8">Do you own any other real estate?</p>

      <div className="space-y-6">
        <FormField label="Do you own other real estate?" required error={errors.ownsOtherRealEstate}>
          <div className="flex gap-6 mt-1">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="ownsOther" value={opt} checked={data.ownsOtherRealEstate === opt}
                  onChange={(e) => updateData({ ownsOtherRealEstate: e.target.value })}
                  className="w-4 h-4 accent-primary" />
                {opt}
              </label>
            ))}
          </div>
        </FormField>

        {data.ownsOtherRealEstate === "Yes" && (
          <>
            <AddressGroup label="Property Address" value={data.otherPropertyAddress}
              onChange={(v) => updateData({ otherPropertyAddress: v })} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Market Value">
                <CurrencyInput value={data.otherPropertyValue} onChange={(v) => updateData({ otherPropertyValue: v })} />
              </FormField>
              <FormField label="Mortgage Balance">
                <CurrencyInput value={data.otherMortgageBalance} onChange={(v) => updateData({ otherMortgageBalance: v })} />
              </FormField>
              <FormField label="Monthly Mortgage Payment">
                <CurrencyInput value={data.otherMonthlyPayment} onChange={(v) => updateData({ otherMonthlyPayment: v })} />
              </FormField>
              <FormField label="Rental Income">
                <CurrencyInput value={data.otherRentalIncome} onChange={(v) => updateData({ otherRentalIncome: v })} />
              </FormField>
            </div>

            <FormField label="Property Status">
              <div className="max-w-xs">
                <SelectInput value={data.otherPropertyStatus} onChange={(v) => updateData({ otherPropertyStatus: v })}
                  options={PROPERTY_STATUSES} />
              </div>
            </FormField>
          </>
        )}
      </div>

      <StepNavigation onContinue={handleContinue} />
    </div>
  );
};
