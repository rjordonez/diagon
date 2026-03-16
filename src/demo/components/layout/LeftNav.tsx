import React from "react";
import { useWizard, STEPS } from "@/demo/components/wizard/WizardContext";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@/demo/lib/utils";

export const LeftNav = () => {
  const { currentStep, currentSubStep, setStep, completedSteps, currentFlatIndex } = useWizard();

  const canNavigate = (stepIdx: number, subIdx: number) => {
    const step = STEPS[stepIdx];
    const id = step.subSteps ? step.subSteps[subIdx].id : step.id;
    return completedSteps.has(id) || (stepIdx === currentStep && subIdx === currentSubStep);
  };

  const isStepComplete = (step: typeof STEPS[number]) => {
    if (step.subSteps) {
      return step.subSteps.every((s) => completedSteps.has(s.id));
    }
    return completedSteps.has(step.id);
  };

  return (
    <nav className="w-[220px] shrink-0 bg-background p-6 flex flex-col border-r border-border">
      <a href="/demo" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Overview
      </a>

      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Application</p>

      <div className="space-y-1">
        {STEPS.map((step, si) => {
          const complete = isStepComplete(step);
          const isActive = si === currentStep;

          return (
            <div key={step.id}>
              <button
                onClick={() => canNavigate(si, 0) ? setStep(si, 0) : undefined}
                className={cn(
                  "nav-step w-full text-left",
                  isActive && "nav-step-active",
                  !canNavigate(si, 0) && "opacity-50 cursor-not-allowed"
                )}
              >
                {complete ? (
                  <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-background" />
                  </div>
                ) : (
                  <div className={cn("w-5 h-5 rounded-full border-2 shrink-0",
                    isActive ? "border-foreground" : "border-border"
                  )} />
                )}
                <span className="truncate">{step.label}</span>
              </button>

              {step.subSteps && isActive && (
                <div className="ml-8 mt-1 space-y-0.5">
                  {step.subSteps.map((sub, ssi) => {
                    const subActive = ssi === currentSubStep;
                    const subComplete = completedSteps.has(sub.id);
                    return (
                      <button
                        key={sub.id}
                        onClick={() => canNavigate(si, ssi) ? setStep(si, ssi) : undefined}
                        className={cn(
                          "flex items-center gap-2 w-full text-left px-2 py-1.5 text-xs rounded transition-colors",
                          subActive ? "text-foreground font-medium" : "text-muted-foreground",
                          !canNavigate(si, ssi) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          subComplete ? "bg-foreground" : subActive ? "bg-foreground" : "bg-border"
                        )} />
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};
