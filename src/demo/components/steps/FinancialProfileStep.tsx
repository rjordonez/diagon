import React, { useState } from "react";
import { useWizard } from "@/demo/components/wizard/WizardContext";
import { StepNavigation } from "@/demo/components/wizard/StepNavigation";
import { FormField } from "@/demo/components/form/FormField";
import { CurrencyInput } from "@/demo/components/form/CurrencyInput";

export const FinancialProfileStep = () => {
  const { data, updateData, markComplete } = useWizard();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!data.checkingBalance) e.checkingBalance = "Required";
    if (!data.monthlyMortgageRent) e.monthlyMortgageRent = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (validate()) { markComplete("financial"); return true; }
    return false;
  };

  return (
    <div>
      <h1 className="section-title">Financial Profile</h1>
      <p className="section-subtitle mt-1 mb-8">Assets, liabilities, and monthly obligations</p>

      <div className="space-y-6">
        <p className="form-label font-semibold">Assets</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Checking Account Balance" required error={errors.checkingBalance}>
            <CurrencyInput value={data.checkingBalance} onChange={(v) => updateData({ checkingBalance: v })} error={!!errors.checkingBalance} />
          </FormField>
          <FormField label="Savings Account Balance">
            <CurrencyInput value={data.savingsBalance} onChange={(v) => updateData({ savingsBalance: v })} />
          </FormField>
          <FormField label="Investment / Retirement">
            <CurrencyInput value={data.investmentRetirement} onChange={(v) => updateData({ investmentRetirement: v })} />
          </FormField>
          <FormField label="Gift Funds">
            <CurrencyInput value={data.giftFunds} onChange={(v) => updateData({ giftFunds: v })} />
          </FormField>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="form-label font-semibold mb-4">Monthly Liabilities</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Monthly Mortgage / Rent" required error={errors.monthlyMortgageRent}>
              <CurrencyInput value={data.monthlyMortgageRent} onChange={(v) => updateData({ monthlyMortgageRent: v })} error={!!errors.monthlyMortgageRent} />
            </FormField>
            <FormField label="Auto Loan Payment">
              <CurrencyInput value={data.autoLoan} onChange={(v) => updateData({ autoLoan: v })} />
            </FormField>
            <FormField label="Student Loan Payment">
              <CurrencyInput value={data.studentLoan} onChange={(v) => updateData({ studentLoan: v })} />
            </FormField>
            <FormField label="Credit Card Minimum Payments">
              <CurrencyInput value={data.creditCardPayments} onChange={(v) => updateData({ creditCardPayments: v })} />
            </FormField>
            <FormField label="Other Monthly Debts">
              <CurrencyInput value={data.otherDebts} onChange={(v) => updateData({ otherDebts: v })} />
            </FormField>
          </div>
        </div>
      </div>

      <StepNavigation onContinue={handleContinue} />
    </div>
  );
};
