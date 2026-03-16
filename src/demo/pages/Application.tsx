import React from "react";
import { WizardProvider, useWizard } from "@/demo/components/wizard/WizardContext";
import { LeftNav } from "@/demo/components/layout/LeftNav";
import { PennyChat } from "@/demo/components/layout/PennyChat";
import { BorrowerInfoStep } from "@/demo/components/steps/BorrowerInfoStep";
import { IncomeStep } from "@/demo/components/steps/IncomeStep";
import { FinancialProfileStep } from "@/demo/components/steps/FinancialProfileStep";
import { LoanDetailsStep } from "@/demo/components/steps/LoanDetailsStep";
import { SubjectPropertyStep } from "@/demo/components/steps/SubjectPropertyStep";
import { AdditionalPropertyStep } from "@/demo/components/steps/AdditionalPropertyStep";
import { DeclarationsStep } from "@/demo/components/steps/DeclarationsStep";

const StepContent = () => {
  const { currentStep, currentSubStep } = useWizard();

  if (currentStep === 0) return <BorrowerInfoStep />;
  if (currentStep === 1) return <IncomeStep />;
  if (currentStep === 2) return <FinancialProfileStep />;
  if (currentStep === 3) {
    if (currentSubStep === 0) return <LoanDetailsStep />;
    if (currentSubStep === 1) return <SubjectPropertyStep />;
    if (currentSubStep === 2) return <AdditionalPropertyStep />;
  }
  if (currentStep === 4) return <DeclarationsStep />;

  return null;
};

const ApplicationContent = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <LeftNav />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-[640px] mx-auto py-10 px-8">
          <div className="bg-card rounded-lg p-8">
            <StepContent />
          </div>
        </div>
      </main>
      <PennyChat />
    </div>
  );
};

const Application = () => {
  return (
    <WizardProvider>
      <ApplicationContent />
    </WizardProvider>
  );
};

export default Application;
