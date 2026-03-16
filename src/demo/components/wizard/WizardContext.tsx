import React, { createContext, useContext, useState, useCallback } from "react";

export interface ApplicationData {
  // Step 1 - Borrower Info
  firstName: string; middleName: string; lastName: string; suffix: string;
  dateOfBirth: string; ssn: string; maritalStatus: string;
  numberOfDependents: string; agesOfDependents: string;
  citizenship: string;
  homePhone: string; cellPhone: string; workPhone: string; email: string;
  currentAddress: { street: string; unit: string; city: string; state: string; zip: string };
  yearsAtAddress: string; housingStatus: string; monthlyRent: string;
  priorAddress: { street: string; unit: string; city: string; state: string; zip: string };

  // Step 2 - Income
  employerName: string; employerPhone: string;
  employerAddress: { street: string; unit: string; city: string; state: string; zip: string };
  employmentStartDate: string; employmentType: string;
  jobTitle: string; baseSalary: string; payFrequency: string;
  overtimeIncome: string; bonusIncome: string; commissionIncome: string;
  selfEmploymentIncome: string;
  otherIncomeType: string; otherIncomeAmount: string;

  // Step 3 - Financial Profile
  checkingBalance: string; savingsBalance: string;
  investmentRetirement: string; giftFunds: string; otherAssets: string;
  monthlyMortgageRent: string; autoLoan: string; studentLoan: string;
  creditCardPayments: string; otherDebts: string;

  // Step 4a - Loan Details
  loanAmount: string; loanPurpose: string;

  // Step 4b - Subject Property
  propertyAddress: { street: string; unit: string; city: string; state: string; zip: string };
  propertyValue: string; occupancyType: string;
  mixedUse: boolean; manufacturedHome: boolean;

  // Step 4c - Additional Property
  ownsOtherRealEstate: string;
  otherPropertyAddress: { street: string; unit: string; city: string; state: string; zip: string };
  otherPropertyValue: string; otherMortgageBalance: string;
  otherMonthlyPayment: string; otherRentalIncome: string; otherPropertyStatus: string;

  // Step 5 - Declarations
  outstandingJudgments: string; declaredBankruptcy: string;
  propertyForeclosed: string; partyToLawsuit: string;
  delinquentFederalDebt: string; alimonyChildSupport: string;
  alimonyAmount: string; borrowedDownPayment: string;
  coMakerOnLoan: string; usCitizen: string;
  primaryResidenceIntent: string; ownershipInterest: string;
  eConsent: boolean; signature: string;
}

const emptyAddress = { street: "", unit: "", city: "", state: "", zip: "" };

const defaultData: ApplicationData = {
  firstName: "", middleName: "", lastName: "", suffix: "",
  dateOfBirth: "", ssn: "", maritalStatus: "",
  numberOfDependents: "", agesOfDependents: "",
  citizenship: "",
  homePhone: "", cellPhone: "", workPhone: "", email: "",
  currentAddress: { ...emptyAddress },
  yearsAtAddress: "", housingStatus: "", monthlyRent: "",
  priorAddress: { ...emptyAddress },
  employerName: "", employerPhone: "",
  employerAddress: { ...emptyAddress },
  employmentStartDate: "", employmentType: "",
  jobTitle: "", baseSalary: "", payFrequency: "",
  overtimeIncome: "", bonusIncome: "", commissionIncome: "",
  selfEmploymentIncome: "",
  otherIncomeType: "", otherIncomeAmount: "",
  checkingBalance: "", savingsBalance: "",
  investmentRetirement: "", giftFunds: "", otherAssets: "",
  monthlyMortgageRent: "", autoLoan: "", studentLoan: "",
  creditCardPayments: "", otherDebts: "",
  loanAmount: "", loanPurpose: "",
  propertyAddress: { ...emptyAddress },
  propertyValue: "", occupancyType: "",
  mixedUse: false, manufacturedHome: false,
  ownsOtherRealEstate: "",
  otherPropertyAddress: { ...emptyAddress },
  otherPropertyValue: "", otherMortgageBalance: "",
  otherMonthlyPayment: "", otherRentalIncome: "", otherPropertyStatus: "",
  outstandingJudgments: "", declaredBankruptcy: "",
  propertyForeclosed: "", partyToLawsuit: "",
  delinquentFederalDebt: "", alimonyChildSupport: "",
  alimonyAmount: "", borrowedDownPayment: "",
  coMakerOnLoan: "", usCitizen: "",
  primaryResidenceIntent: "", ownershipInterest: "",
  eConsent: false, signature: "",
};

export interface StepDef {
  id: string;
  label: string;
  subSteps?: { id: string; label: string }[];
}

export const STEPS: StepDef[] = [
  { id: "borrower", label: "Borrower Information" },
  { id: "income", label: "Income" },
  { id: "financial", label: "Financial Profile" },
  {
    id: "loan-property",
    label: "Loan & Property Information",
    subSteps: [
      { id: "loan-details", label: "Loan Details" },
      { id: "subject-property", label: "Subject Property" },
      { id: "additional-property", label: "Additional Property" },
    ],
  },
  { id: "declarations", label: "Declarations & Agreements" },
];

interface WizardContextValue {
  data: ApplicationData;
  updateData: (partial: Partial<ApplicationData>) => void;
  currentStep: number;
  currentSubStep: number;
  setStep: (step: number, subStep?: number) => void;
  goNext: () => void;
  goBack: () => void;
  completedSteps: Set<string>;
  markComplete: (stepId: string) => void;
  totalFlatSteps: number;
  currentFlatIndex: number;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export const useWizard = () => {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be inside WizardProvider");
  return ctx;
};

// Flatten steps for linear navigation
const flatSteps: { stepIdx: number; subIdx: number; id: string }[] = [];
STEPS.forEach((step, si) => {
  if (step.subSteps) {
    step.subSteps.forEach((_, ssi) => {
      flatSteps.push({ stepIdx: si, subIdx: ssi, id: step.subSteps![ssi].id });
    });
  } else {
    flatSteps.push({ stepIdx: si, subIdx: 0, id: step.id });
  }
});

export const WizardProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<ApplicationData>(defaultData);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentSubStep, setCurrentSubStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const updateData = useCallback((partial: Partial<ApplicationData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const currentFlatIndex = flatSteps.findIndex(
    (f) => f.stepIdx === currentStep && f.subIdx === currentSubStep
  );

  const setStep = useCallback((step: number, subStep = 0) => {
    setCurrentStep(step);
    setCurrentSubStep(subStep);
  }, []);

  const goNext = useCallback(() => {
    const nextIdx = currentFlatIndex + 1;
    if (nextIdx < flatSteps.length) {
      const next = flatSteps[nextIdx];
      setCurrentStep(next.stepIdx);
      setCurrentSubStep(next.subIdx);
    }
  }, [currentFlatIndex]);

  const goBack = useCallback(() => {
    const prevIdx = currentFlatIndex - 1;
    if (prevIdx >= 0) {
      const prev = flatSteps[prevIdx];
      setCurrentStep(prev.stepIdx);
      setCurrentSubStep(prev.subIdx);
    }
  }, [currentFlatIndex]);

  const markComplete = useCallback((stepId: string) => {
    setCompletedSteps((prev) => new Set([...prev, stepId]));
  }, []);

  return (
    <WizardContext.Provider
      value={{
        data, updateData,
        currentStep, currentSubStep, setStep,
        goNext, goBack,
        completedSteps, markComplete,
        totalFlatSteps: flatSteps.length,
        currentFlatIndex,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
};
