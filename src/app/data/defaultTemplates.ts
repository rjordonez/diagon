export interface SeedItem {
  name: string;
  description: string;
  required: boolean;
  inputType?: "upload" | "text";  // default "upload"
}

export interface SeedSection {
  title: string;
  gateQuestion?: string;
  items: SeedItem[];
}

export interface SeedTemplate {
  name: string;
  borrowerType: string;
  description: string;
  isDefault: boolean;
  isAddon: boolean;
  sections: SeedSection[];
}

export const DEFAULT_DSCR_TEMPLATE: SeedTemplate = {
  name: "DSCR Loan Prequalification",
  borrowerType: "DSCR",
  description: "Prequalification form and documentation for a DSCR (Debt Service Coverage Ratio) investment property loan",
  isDefault: true,
  isAddon: false,
  sections: [
    {
      title: "Borrower Information",
      items: [
        { name: "Full legal name", description: "As it appears on your ID", required: true, inputType: "text" },
        { name: "Date of birth", description: "MM/DD/YYYY", required: true, inputType: "text" },
        { name: "Social Security number", description: "Last 4 digits only for prequal", required: true, inputType: "text" },
        { name: "Phone number", description: "", required: true, inputType: "text" },
        { name: "Email address", description: "", required: true, inputType: "text" },
        { name: "Current home address", description: "Full street address, city, state, zip", required: true, inputType: "text" },
        { name: "Citizenship status", description: "US Citizen, Permanent Resident, or Foreign National", required: true, inputType: "text" },
        { name: "Valid government-issued photo ID", description: "Driver's license or passport", required: true, inputType: "upload" },
      ],
    },
    {
      title: "Subject Property Details",
      items: [
        { name: "Subject property address", description: "Full address of the investment property", required: true, inputType: "text" },
        { name: "Property type", description: "SFR, 2-4 Unit, Condo, Townhouse, 5+ Unit", required: true, inputType: "text" },
        { name: "Number of units", description: "", required: true, inputType: "text" },
        { name: "Loan purpose", description: "Purchase, Rate/Term Refinance, or Cash-Out Refinance", required: true, inputType: "text" },
        { name: "Purchase price or estimated value", description: "$", required: true, inputType: "text" },
        { name: "Requested loan amount", description: "$", required: true, inputType: "text" },
        { name: "Down payment amount", description: "$ — DSCR typically requires 20-25% down", required: true, inputType: "text" },
        { name: "Desired loan term", description: "30-year fixed, 5/1 ARM, 7/1 ARM, 40-year, interest-only", required: true, inputType: "text" },
        { name: "Is the property currently rented?", description: "Yes or No", required: true, inputType: "text" },
        { name: "Current or expected monthly rent", description: "$ per month — gross rental income", required: true, inputType: "text" },
        { name: "Purchase agreement or LOI", description: "If purchase — signed contract", required: false, inputType: "upload" },
      ],
    },
    {
      title: "DSCR Calculation Inputs",
      items: [
        { name: "Monthly gross rental income", description: "$ — total from all units on subject property", required: true, inputType: "text" },
        { name: "Monthly property taxes", description: "$ — annual / 12", required: true, inputType: "text" },
        { name: "Monthly property insurance", description: "$ — annual / 12", required: true, inputType: "text" },
        { name: "Monthly HOA dues", description: "$ — enter 0 if none", required: true, inputType: "text" },
        { name: "Flood insurance (if applicable)", description: "$ per month — enter 0 if not in flood zone", required: false, inputType: "text" },
        { name: "Market rent analysis or appraisal", description: "1007 rent schedule or comparable rental analysis", required: false, inputType: "upload" },
      ],
    },
    {
      title: "Credit & Financial Profile",
      items: [
        { name: "Estimated credit score", description: "DSCR minimum is typically 660-680", required: true, inputType: "text" },
        { name: "Credit report authorization", description: "Permission to pull tri-merge credit report", required: true, inputType: "upload" },
        { name: "Total liquid assets", description: "$ — cash, savings, stocks, crypto across all accounts", required: true, inputType: "text" },
        { name: "Proof of funds for down payment", description: "Bank statements or investment account statements showing available funds — last 2 months", required: true, inputType: "upload" },
        { name: "Proof of reserves", description: "Typically 6-12 months of PITIA — bank or brokerage statements", required: true, inputType: "upload" },
        { name: "Any bankruptcies, foreclosures, or short sales?", description: "If yes, provide date and details", required: true, inputType: "text" },
      ],
    },
    {
      title: "Real Estate Experience",
      items: [
        { name: "Number of investment properties currently owned", description: "", required: true, inputType: "text" },
        { name: "Years of real estate investing experience", description: "", required: true, inputType: "text" },
        { name: "Total monthly rental income across portfolio", description: "$ — from all properties you own", required: false, inputType: "text" },
        { name: "REO schedule", description: "List of all properties: address, value, loan balance, monthly payment, rental income", required: false, inputType: "upload" },
      ],
    },
    {
      title: "Entity Information",
      gateQuestion: "Are you applying as an LLC or corporation?",
      items: [
        { name: "Entity name", description: "Full legal name of the LLC or corporation", required: true, inputType: "text" },
        { name: "Entity type", description: "LLC, S-Corp, C-Corp, Trust", required: true, inputType: "text" },
        { name: "State of formation", description: "", required: true, inputType: "text" },
        { name: "EIN number", description: "Employer Identification Number", required: true, inputType: "text" },
        { name: "Articles of Organization / Incorporation", description: "Formation documents", required: true, inputType: "upload" },
        { name: "Operating Agreement or Corporate Bylaws", description: "", required: true, inputType: "upload" },
        { name: "Certificate of Good Standing", description: "From Secretary of State", required: false, inputType: "upload" },
      ],
    },
    {
      title: "HOA Information",
      gateQuestion: "Does the subject property have an HOA?",
      items: [
        { name: "HOA name and contact", description: "", required: true, inputType: "text" },
        { name: "Monthly HOA fee", description: "$", required: true, inputType: "text" },
        { name: "HOA questionnaire or condo cert", description: "Lender may require for condo/townhouse", required: false, inputType: "upload" },
      ],
    },
    {
      title: "Existing Rental Documentation",
      gateQuestion: "Is the subject property currently rented?",
      items: [
        { name: "Current lease agreement(s)", description: "Signed lease for each unit", required: true, inputType: "upload" },
        { name: "Rent roll", description: "Unit-by-unit breakdown: unit #, tenant name, monthly rent, lease expiration", required: true, inputType: "upload" },
        { name: "12-month rental payment history", description: "Bank deposits or Venmo/Zelle records showing rent received", required: false, inputType: "upload" },
      ],
    },
    {
      title: "Property Insurance",
      items: [
        { name: "Hazard/homeowner's insurance quote", description: "Dwelling coverage required — must name lender as mortgagee", required: true, inputType: "upload" },
        { name: "Flood insurance quote", description: "Required if property is in FEMA flood zone A or V", required: false, inputType: "upload" },
        { name: "Landlord/rental property insurance", description: "If different from hazard insurance — liability coverage for tenants", required: false, inputType: "upload" },
      ],
    },
    {
      title: "Property Management",
      gateQuestion: "Will a property management company manage this property?",
      items: [
        { name: "Property management company name", description: "", required: true, inputType: "text" },
        { name: "Monthly management fee", description: "$ or % of rent — typically 8-10%", required: true, inputType: "text" },
        { name: "Property management agreement", description: "Signed contract with PM company", required: true, inputType: "upload" },
      ],
    },
    {
      title: "Title & Closing",
      items: [
        { name: "How do you want to hold title?", description: "Personal name, LLC, Trust, etc.", required: true, inputType: "text" },
        { name: "Vesting instructions", description: "Full legal name(s) and manner of vesting — e.g. 'John Smith, a single man' or 'ABC Properties LLC, a CA LLC'", required: true, inputType: "text" },
        { name: "Title company / escrow contact", description: "Name, company, phone, email — if you have one selected", required: false, inputType: "text" },
        { name: "Preliminary title report", description: "If available — ordered through escrow/title company", required: false, inputType: "upload" },
      ],
    },
    {
      title: "Declarations & Disclosures",
      items: [
        { name: "Will this be your primary residence?", description: "DSCR loans are for investment properties only — must answer No", required: true, inputType: "text" },
        { name: "Business purpose affidavit", description: "Confirms the loan is for business/investment purposes, not consumer — required for DSCR", required: true, inputType: "text" },
        { name: "Are you a first-time homebuyer?", description: "Yes or No", required: true, inputType: "text" },
        { name: "Any outstanding judgments or liens?", description: "If yes, provide details and amounts", required: true, inputType: "text" },
        { name: "Any pending lawsuits?", description: "If yes, provide case details", required: true, inputType: "text" },
        { name: "Is any part of the down payment borrowed?", description: "Gift funds, seller credits, HELOC, etc. — if yes, provide source", required: true, inputType: "text" },
        { name: "Are you obligated on any loan currently in default?", description: "If yes, provide details", required: true, inputType: "text" },
        { name: "Are you a co-signer or guarantor on any debt?", description: "If yes, list the debts and amounts", required: true, inputType: "text" },
        { name: "Any child support or alimony obligations?", description: "If yes, provide monthly amount and remaining term", required: true, inputType: "text" },
        { name: "Have you had a bankruptcy, foreclosure, or short sale in the last 7 years?", description: "If yes, provide type, date, and discharge documentation", required: true, inputType: "text" },
        { name: "Background and identity verification consent", description: "I consent to identity, background, and fraud verification checks", required: true, inputType: "text" },
      ],
    },
  ],
};

export const BORROWER_PROFILE_ADDONS: SeedTemplate[] = [
  {
    name: "W-2 Employee",
    borrowerType: "W-2 Employee",
    description: "Most straightforward application — income sits in W-2 statements",
    isDefault: true, isAddon: true,
    sections: [{ title: "W-2 Employee Documents", items: [
      { name: "W-2 statements", description: "Last 2 years", required: true, inputType: "upload" },
      { name: "Most recent pay stubs", description: "Last 30 days", required: true, inputType: "upload" },
      { name: "Annual gross income", description: "$ — from W-2 box 1", required: true, inputType: "text" },
      { name: "Employer name", description: "", required: true, inputType: "text" },
    ]}],
  },
  {
    name: "Self-Employed Business Owner",
    borrowerType: "Self-Employed",
    description: "Most common user of DSCR loans due to low reported income from business write-offs",
    isDefault: true, isAddon: true,
    sections: [{ title: "Self-Employed Documents", items: [
      { name: "Personal tax returns", description: "Last 2 years — all pages including schedules", required: true, inputType: "upload" },
      { name: "Business tax returns", description: "Last 2 years", required: true, inputType: "upload" },
      { name: "Year-to-date profit & loss statement", description: "", required: true, inputType: "upload" },
      { name: "Business bank statements", description: "Last 3 months", required: true, inputType: "upload" },
      { name: "Business name", description: "", required: true, inputType: "text" },
      { name: "Annual gross business revenue", description: "$", required: true, inputType: "text" },
      { name: "Years in business", description: "", required: true, inputType: "text" },
    ]}],
  },
  {
    name: "Portfolio Scaler (10+ Properties)",
    borrowerType: "Portfolio Scaler",
    description: "Needs REO schedule and full documentation for every property and LLC in the portfolio",
    isDefault: true, isAddon: true,
    sections: [
      { title: "Portfolio Overview", items: [
        { name: "Total number of financed properties", description: "", required: true, inputType: "text" },
        { name: "Total portfolio value", description: "$", required: true, inputType: "text" },
        { name: "Total monthly portfolio income", description: "$", required: true, inputType: "text" },
        { name: "REO (Real Estate Owned) schedule", description: "Full list: address, value, loan balance, monthly payment, rental income", required: true, inputType: "upload" },
        { name: "Mortgage statements for each financed property", description: "Most recent statement per property", required: true, inputType: "upload" },
      ]},
      { title: "Multiple LLCs", gateQuestion: "Do you have multiple LLCs?", items: [
        { name: "List of all LLCs with properties held", description: "Entity name, EIN, properties under each", required: true, inputType: "text" },
        { name: "LLC documentation for each entity", description: "Articles of Org + Operating Agreement per entity", required: true, inputType: "upload" },
      ]},
    ],
  },
  {
    name: "Short-Term Rental Operator (Airbnb/Vrbo)",
    borrowerType: "STR Operator",
    description: "Airbnb/Vrbo operators need platform payout history and STR-specific documentation",
    isDefault: true, isAddon: true,
    sections: [
      { title: "STR Income", gateQuestion: "Do you have existing STR payout history?", items: [
        { name: "Payout history from Airbnb/Vrbo", description: "Past 12 months — download from platform", required: true, inputType: "upload" },
        { name: "Annual gross STR income", description: "$", required: true, inputType: "text" },
        { name: "Average nightly rate", description: "$", required: true, inputType: "text" },
        { name: "Annual occupancy rate", description: "Percentage — e.g. 75%", required: true, inputType: "text" },
      ]},
      { title: "STR Documentation", items: [
        { name: "AirDNA report showing projected income", description: "For new purchases without payout history", required: true, inputType: "upload" },
        { name: "STR-specific insurance policy", description: "Short-term rental insurance — not standard landlord policy", required: true, inputType: "upload" },
        { name: "Local STR permit or license", description: "If required by municipality", required: false, inputType: "upload" },
      ]},
    ],
  },
  {
    name: "Foreign National Investor",
    borrowerType: "Foreign National",
    description: "No SSN — uses passport. Alternative credit documentation. Typically 30-35% down required",
    isDefault: true, isAddon: true,
    sections: [{ title: "Foreign National Documents", items: [
      { name: "Valid passport", description: "All identity pages", required: true, inputType: "upload" },
      { name: "Country of citizenship", description: "", required: true, inputType: "text" },
      { name: "Visa type (if in US)", description: "H1-B, L-1, E-2, etc. or N/A if abroad", required: true, inputType: "text" },
      { name: "International credit reports or bank reference letters", description: "From foreign banks — minimum 2 trade lines", required: true, inputType: "upload" },
      { name: "Proof of funds from foreign account", description: "Bank statements translated to English", required: true, inputType: "upload" },
      { name: "Wire transfer documentation", description: "Showing ability to move funds to US account", required: true, inputType: "upload" },
    ]}],
  },
  {
    name: "Retired Investor",
    borrowerType: "Retired",
    description: "Funds in retirement and brokerage accounts. May need to document withdrawal ability",
    isDefault: true, isAddon: true,
    sections: [
      { title: "Retirement Assets", items: [
        { name: "Brokerage/investment account statements", description: "Last 2 months", required: true, inputType: "upload" },
        { name: "Total retirement/investment assets", description: "$", required: true, inputType: "text" },
        { name: "Monthly pension or social security income", description: "$ — if any", required: false, inputType: "text" },
      ]},
      { title: "Retirement Fund Sourcing", gateQuestion: "Are you using retirement funds for the down payment?", items: [
        { name: "IRA/401k distribution letter or withdrawal authorization", description: "Showing ability to access funds without penalty, or documenting penalty amount", required: true, inputType: "upload" },
        { name: "Estimated net amount after taxes/penalties", description: "$", required: true, inputType: "text" },
      ]},
    ],
  },
  {
    name: "Gig Economy / 1099 Worker",
    borrowerType: "Gig Economy",
    description: "Uses 1099s instead of W-2s. Bank statements verify income flow",
    isDefault: true, isAddon: true,
    sections: [{ title: "Gig Economy Documents", items: [
      { name: "1099 forms", description: "Last 2 years — from all platforms/clients", required: true, inputType: "upload" },
      { name: "Bank statements showing deposits", description: "Last 6 months — highlight income deposits", required: true, inputType: "upload" },
      { name: "Annual gross 1099 income", description: "$", required: true, inputType: "text" },
      { name: "Primary income source/platform", description: "e.g. Uber, DoorDash, freelance consulting", required: true, inputType: "text" },
      { name: "Years as independent contractor", description: "", required: true, inputType: "text" },
    ]}],
  },
];
