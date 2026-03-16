import React, { useState } from "react";
import { useWizard } from "@/demo/components/wizard/WizardContext";
import { StepNavigation } from "@/demo/components/wizard/StepNavigation";
import { FormField } from "@/demo/components/form/FormField";
import { CurrencyInput } from "@/demo/components/form/CurrencyInput";
import { SelectInput } from "@/demo/components/form/SelectInput";
import { AddressGroup } from "@/demo/components/form/AddressGroup";
import { cn } from "@/demo/lib/utils";

const OCCUPANCY_TYPES = [
  { value: "Primary Residence", label: "Primary Residence" },
  { value: "Second Home", label: "Second Home" },
  { value: "Investment Property", label: "Investment Property" },
];

export const SubjectPropertyStep = () => {
  const { data, updateData, markComplete } = useWizard();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!data.propertyAddress.street.trim()) e["street"] = "Required";
    if (!data.propertyAddress.city.trim()) e["city"] = "Required";
    if (!data.propertyAddress.state) e["state"] = "Required";
    if (data.propertyAddress.zip.length !== 5) e["zip"] = "Required";
    if (!data.propertyValue) e.propertyValue = "Required";
    if (!data.occupancyType) e.occupancyType = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (validate()) { markComplete("subject-property"); return true; }
    return false;
  };

  return (
    <div>
      <h1 className="section-title">Subject Property</h1>
      <p className="section-subtitle mt-1 mb-8">Details about the property for this loan</p>

      <div className="space-y-6">
        <AddressGroup label="Property Address" value={data.propertyAddress}
          onChange={(v) => updateData({ propertyAddress: v })} required
          errors={{ street: errors.street, city: errors.city, state: errors.state, zip: errors.zip }} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Property Value" required error={errors.propertyValue}>
            <CurrencyInput value={data.propertyValue} onChange={(v) => updateData({ propertyValue: v })}
              error={!!errors.propertyValue} placeholder="2,000,000" />
          </FormField>
          <FormField label="Occupancy Type" required error={errors.occupancyType}>
            <SelectInput value={data.occupancyType} onChange={(v) => updateData({ occupancyType: v })}
              options={OCCUPANCY_TYPES} error={!!errors.occupancyType} />
          </FormField>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="form-label font-semibold mb-3">Property Characteristics</p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={data.mixedUse}
                onChange={(e) => updateData({ mixedUse: e.target.checked })}
                className="w-4 h-4 accent-primary rounded" />
              Mixed Use Property
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={data.manufacturedHome}
                onChange={(e) => updateData({ manufacturedHome: e.target.checked })}
                className="w-4 h-4 accent-primary rounded" />
              Manufactured Home
            </label>
          </div>
        </div>
      </div>

      <StepNavigation onContinue={handleContinue} />
    </div>
  );
};
