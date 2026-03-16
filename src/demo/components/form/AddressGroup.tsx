import React from "react";
import { FormField } from "./FormField";
import { cn } from "@/demo/lib/utils";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME",
  "MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI",
  "SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

interface AddressData {
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressGroupProps {
  value: AddressData;
  onChange: (value: AddressData) => void;
  errors?: Partial<Record<keyof AddressData, string>>;
  required?: boolean;
  label?: string;
}

export const AddressGroup = ({ value, onChange, errors = {}, required, label }: AddressGroupProps) => {
  const update = (field: keyof AddressData, val: string) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-4">
      {label && <p className="form-label font-semibold">{label}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
        <FormField label="Street Address" required={required} error={errors.street}>
          <input
            value={value.street}
            onChange={(e) => update("street", e.target.value)}
            placeholder="123 Main Street"
            className={cn("form-input", errors.street && "form-input-error")}
          />
        </FormField>
        <FormField label="Unit/Apt" error={errors.unit}>
          <input
            value={value.unit}
            onChange={(e) => update("unit", e.target.value)}
            placeholder="Apt 4B"
            className="form-input w-full sm:w-28"
          />
        </FormField>
      </div>
      <div className="grid grid-cols-[2fr_1fr_1fr] gap-4">
        <FormField label="City" required={required} error={errors.city}>
          <input
            value={value.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="City"
            className={cn("form-input", errors.city && "form-input-error")}
          />
        </FormField>
        <FormField label="State" required={required} error={errors.state}>
          <select
            value={value.state}
            onChange={(e) => update("state", e.target.value)}
            className={cn("form-input appearance-none", errors.state && "form-input-error")}
          >
            <option value="">Select</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </FormField>
        <FormField label="ZIP" required={required} error={errors.zip}>
          <input
            value={value.zip}
            onChange={(e) => update("zip", e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="00000"
            className={cn("form-input", errors.zip && "form-input-error")}
          />
        </FormField>
      </div>
    </div>
  );
};
