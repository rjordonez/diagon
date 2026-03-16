import React from "react";
import { useWizard } from "./WizardContext";
import { cn } from "@/demo/lib/utils";

interface StepNavigationProps {
  onContinue: () => boolean;
}

export const StepNavigation = ({ onContinue }: StepNavigationProps) => {
  const { currentFlatIndex, goBack, goNext, totalFlatSteps } = useWizard();
  const isFirst = currentFlatIndex === 0;
  const isLast = currentFlatIndex === totalFlatSteps - 1;

  const handleContinue = () => {
    onContinue();
    goNext();
  };

  return (
    <div className="flex justify-end gap-3 pt-8">
      {!isFirst && (
        <button
          type="button"
          onClick={goBack}
          className="h-11 px-6 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Back
        </button>
      )}
      <button
        type="button"
        onClick={handleContinue}
        className={cn(
          "h-11 px-6 rounded-md text-sm font-semibold transition-colors",
          "bg-foreground text-card hover:opacity-90"
        )}
      >
        {isLast ? "Submit Application" : "Continue"}
      </button>
    </div>
  );
};
