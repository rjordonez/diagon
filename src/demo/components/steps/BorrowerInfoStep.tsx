import React, { useState } from "react";
import { useWizard } from "@/demo/components/wizard/WizardContext";
import { StepNavigation } from "@/demo/components/wizard/StepNavigation";
import { FormField } from "@/demo/components/form/FormField";
import { PhoneInput } from "@/demo/components/form/PhoneInput";
import { SSNInput } from "@/demo/components/form/SSNInput";
import { SelectInput } from "@/demo/components/form/SelectInput";
import { AddressGroup } from "@/demo/components/form/AddressGroup";
import { cn } from "@/demo/lib/utils";

const SUFFIXES = [
  { value: "Jr.", label: "Jr." }, { value: "Sr.", label: "Sr." },
  { value: "II", label: "II" }, { value: "III", label: "III" }, { value: "IV", label: "IV" },
];

const MARITAL = [
  { value: "Married", label: "Married" },
  { value: "Separated", label: "Separated" },
  { value: "Unmarried", label: "Unmarried" },
];

export const BorrowerInfoStep = () => {
  const { data, updateData, markComplete, goNext } = useWizard();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!data.firstName.trim()) e.firstName = "First name is required";
    if (!data.lastName.trim()) e.lastName = "Last name is required";
    if (!data.dateOfBirth) e.dateOfBirth = "Date of birth is required";
    if (data.ssn.replace(/\D/g, "").length !== 9) e.ssn = "Valid SSN is required";
    if (!data.maritalStatus) e.maritalStatus = "Marital status is required";
    if (!data.citizenship) e.citizenship = "Citizenship is required";
    if (!data.cellPhone || data.cellPhone.replace(/\D/g, "").length !== 10) e.cellPhone = "Valid cell phone is required";
    if (!data.email.trim() || !data.email.includes("@")) e.email = "Valid email is required";
    if (!data.currentAddress.street.trim()) e["currentAddress.street"] = "Street is required";
    if (!data.currentAddress.city.trim()) e["currentAddress.city"] = "City is required";
    if (!data.currentAddress.state) e["currentAddress.state"] = "State is required";
    if (data.currentAddress.zip.length !== 5) e["currentAddress.zip"] = "Valid ZIP is required";
    if (!data.yearsAtAddress) e.yearsAtAddress = "Required";
    if (!data.housingStatus) e.housingStatus = "Required";
    if (data.housingStatus === "Rent" && !data.monthlyRent) e.monthlyRent = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      markComplete("borrower");
      return true;
    }
    return false;
  };

  return (
    <div>
      <h1 className="section-title">Borrower Information</h1>
      <p className="section-subtitle mt-1 mb-8">Personal details as they appear on your government-issued ID</p>

      <div className="space-y-6">
        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-4">
          <FormField label="First Name" required error={errors.firstName}>
            <input value={data.firstName} onChange={(e) => updateData({ firstName: e.target.value })}
              placeholder="John" className={cn("form-input", errors.firstName && "form-input-error")} />
          </FormField>
          <FormField label="Middle Name">
            <input value={data.middleName} onChange={(e) => updateData({ middleName: e.target.value })}
              placeholder="Michael" className="form-input" />
          </FormField>
          <FormField label="Last Name" required error={errors.lastName}>
            <input value={data.lastName} onChange={(e) => updateData({ lastName: e.target.value })}
              placeholder="Doe" className={cn("form-input", errors.lastName && "form-input-error")} />
          </FormField>
          <FormField label="Suffix" className="w-24">
            <SelectInput value={data.suffix} onChange={(v) => updateData({ suffix: v })} options={SUFFIXES} placeholder="--" />
          </FormField>
        </div>

        {/* DOB + SSN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Date of Birth" required error={errors.dateOfBirth}>
            <input type="date" value={data.dateOfBirth} onChange={(e) => updateData({ dateOfBirth: e.target.value })}
              className={cn("form-input", errors.dateOfBirth && "form-input-error")} />
          </FormField>
          <FormField label="Social Security Number" required error={errors.ssn}>
            <SSNInput value={data.ssn} onChange={(v) => updateData({ ssn: v })} error={!!errors.ssn} />
          </FormField>
        </div>

        {/* Marital + Dependents */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Marital Status" required error={errors.maritalStatus}>
            <SelectInput value={data.maritalStatus} onChange={(v) => updateData({ maritalStatus: v })} options={MARITAL} error={!!errors.maritalStatus} />
          </FormField>
          <FormField label="Number of Dependents">
            <input type="number" min="0" value={data.numberOfDependents}
              onChange={(e) => updateData({ numberOfDependents: e.target.value })}
              placeholder="0" className="form-input" />
          </FormField>
          {Number(data.numberOfDependents) > 0 && (
            <FormField label="Ages of Dependents">
              <input value={data.agesOfDependents} onChange={(e) => updateData({ agesOfDependents: e.target.value })}
                placeholder="3, 7, 12" className="form-input" />
            </FormField>
          )}
        </div>

        {/* Citizenship */}
        <FormField label="Citizenship" required error={errors.citizenship}>
          <div className="flex gap-4 mt-1">
            {["US Citizen", "Permanent Resident", "Non-Permanent Resident"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="citizenship" value={opt} checked={data.citizenship === opt}
                  onChange={(e) => updateData({ citizenship: e.target.value })}
                  className="w-4 h-4 accent-primary" />
                {opt}
              </label>
            ))}
          </div>
        </FormField>

        {/* Phones */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Home Phone">
            <PhoneInput value={data.homePhone} onChange={(v) => updateData({ homePhone: v })} />
          </FormField>
          <FormField label="Cell Phone" required error={errors.cellPhone}>
            <PhoneInput value={data.cellPhone} onChange={(v) => updateData({ cellPhone: v })} error={!!errors.cellPhone} />
          </FormField>
          <FormField label="Work Phone">
            <PhoneInput value={data.workPhone} onChange={(v) => updateData({ workPhone: v })} />
          </FormField>
        </div>

        {/* Email */}
        <FormField label="Email Address" required error={errors.email}>
          <input type="email" value={data.email} onChange={(e) => updateData({ email: e.target.value })}
            placeholder="john.doe@email.com" className={cn("form-input max-w-md", errors.email && "form-input-error")} />
        </FormField>

        {/* Current Address */}
        <div className="pt-4 border-t border-border">
          <AddressGroup
            label="Current Address"
            value={data.currentAddress}
            onChange={(v) => updateData({ currentAddress: v })}
            required
            errors={{
              street: errors["currentAddress.street"],
              city: errors["currentAddress.city"],
              state: errors["currentAddress.state"],
              zip: errors["currentAddress.zip"],
            }}
          />
        </div>

        {/* Years + Housing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Years at Current Address" required error={errors.yearsAtAddress}>
            <input type="number" min="0" value={data.yearsAtAddress}
              onChange={(e) => updateData({ yearsAtAddress: e.target.value })}
              placeholder="0" className={cn("form-input", errors.yearsAtAddress && "form-input-error")} />
          </FormField>
          <FormField label="Housing Status" required error={errors.housingStatus}>
            <div className="flex gap-4 mt-2">
              {["Own", "Rent", "Living Rent-Free"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="housing" value={opt} checked={data.housingStatus === opt}
                    onChange={(e) => updateData({ housingStatus: e.target.value })}
                    className="w-4 h-4 accent-primary" />
                  {opt}
                </label>
              ))}
            </div>
          </FormField>
        </div>

        {data.housingStatus === "Rent" && (
          <FormField label="Monthly Rent" required error={errors.monthlyRent}>
            <div className="max-w-xs">
              <input value={data.monthlyRent} onChange={(e) => updateData({ monthlyRent: e.target.value.replace(/\D/g, "") })}
                placeholder="$2,000" className={cn("form-input", errors.monthlyRent && "form-input-error")} />
            </div>
          </FormField>
        )}

        {Number(data.yearsAtAddress) > 0 && Number(data.yearsAtAddress) < 2 && (
          <div className="pt-4 border-t border-border">
            <AddressGroup label="Prior Address" value={data.priorAddress}
              onChange={(v) => updateData({ priorAddress: v })} required />
          </div>
        )}
      </div>

      <StepNavigation onContinue={handleContinue} />
    </div>
  );
};
