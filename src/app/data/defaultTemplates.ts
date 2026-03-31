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
  name: "DSCR Loan Documentation",
  borrowerType: "DSCR",
  description: "Standard documentation needed for a DSCR (Debt Service Coverage Ratio) loan",
  isDefault: true,
  isAddon: false,
  sections: [
    {
      title: "Personal Documentation",
      items: [
        { name: "Valid government-issued photo ID", description: "Driver's license or passport", required: true, inputType: "upload" },
        { name: "Social Security number", description: "", required: true, inputType: "text" },
        { name: "Contact information", description: "Phone, email, current address", required: true, inputType: "text" },
        { name: "Personal bank statements", description: "Last 2-3 months", required: true, inputType: "upload" },
        { name: "Credit report authorization form", description: "Gives lenders permission to pull your credit score", required: true, inputType: "upload" },
      ],
    },
    {
      title: "Property Documentation",
      items: [
        { name: "Property address and details", description: "Square footage, number of units, etc.", required: true, inputType: "text" },
        { name: "Purchase agreement", description: "Contract between buyer and seller", required: true, inputType: "upload" },
        { name: "Current property insurance information", description: "", required: true, inputType: "upload" },
        { name: "Property tax statements", description: "", required: true, inputType: "upload" },
        { name: "Photos of the property", description: "Interior and exterior. Lenders require properties to be turnkey — ready for move-in without renovations", required: true, inputType: "upload" },
      ],
    },
    {
      title: "HOA Documentation",
      gateQuestion: "Does the property have an HOA?",
      items: [
        { name: "HOA documents and fee information", description: "", required: true, inputType: "upload" },
        { name: "HOA fee statements", description: "Current monthly/quarterly statements", required: true, inputType: "upload" },
      ],
    },
    {
      title: "Income Verification",
      gateQuestion: "Do you have existing rental properties?",
      items: [
        { name: "Current lease agreements", description: "For existing rental properties", required: true, inputType: "upload" },
        { name: "Rent roll showing payment history", description: "Spreadsheet showing every unit, rent charged, paid, and when", required: true, inputType: "upload" },
        { name: "Schedule E from tax returns", description: "Lender may want to verify your rental income with the IRS", required: false, inputType: "upload" },
        { name: "Market rent analysis or professional rent estimate", description: "For new purchases", required: true, inputType: "upload" },
      ],
    },
    {
      title: "Entity Documentation",
      gateQuestion: "Are you applying as an LLC or corporation?",
      items: [
        { name: "Entity name", description: "Full legal name of the LLC or corporation", required: true, inputType: "text" },
        { name: "Articles of Organization/Incorporation", description: "Entity formation documents", required: true, inputType: "upload" },
        { name: "Operating agreement or corporate bylaws", description: "", required: true, inputType: "upload" },
        { name: "EIN number", description: "", required: true, inputType: "text" },
        { name: "EIN documentation", description: "IRS confirmation letter", required: true, inputType: "upload" },
        { name: "Certificate of Good Standing", description: "", required: true, inputType: "upload" },
        { name: "Business tax returns", description: "May be required depending on lender", required: false, inputType: "upload" },
      ],
    },
    {
      title: "Financial Documentation",
      items: [
        { name: "Bank statements for down payment and closing costs", description: "DSCR loans usually require 20-25% down. Lenders want to see the funds in your account", required: true, inputType: "upload" },
        { name: "Proof of reserves", description: "Typically 6-12 months of PITIA payments. Hedge against vacancies or unexpected repairs", required: true, inputType: "upload" },
      ],
    },
    {
      title: "Other Properties Owned",
      gateQuestion: "Do you own other real estate?",
      items: [
        { name: "Number of properties owned", description: "", required: true, inputType: "text" },
        { name: "List of other real estate owned", description: "Address, value, and status of each property", required: true, inputType: "text" },
        { name: "Recent mortgage statements for other properties", description: "Lenders want to see payment history", required: true, inputType: "upload" },
      ],
    },
    {
      title: "Property Expenses",
      items: [
        { name: "Insurance quotes or policies", description: "", required: true, inputType: "upload" },
        { name: "Property tax estimates", description: "Pulled from County Assessor's website", required: true, inputType: "upload" },
        { name: "Maintenance and repair estimates", description: "Estimates from a third-party contractor", required: false, inputType: "upload" },
      ],
    },
    {
      title: "Utility & Management",
      gateQuestion: "Are utilities or property management paid by the owner?",
      items: [
        { name: "Utility bills", description: "If paid by owner", required: false, inputType: "upload" },
        { name: "Property management agreements", description: "If applicable", required: false, inputType: "upload" },
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
    ]}],
  },
  {
    name: "Self-Employed Business Owner",
    borrowerType: "Self-Employed",
    description: "Most common user of DSCR loans due to low reported income from business write-offs",
    isDefault: true, isAddon: true,
    sections: [{ title: "Self-Employed Documents", items: [
      { name: "Business tax returns", description: "Last 2 years", required: true, inputType: "upload" },
      { name: "Profit & loss statement", description: "Year-to-date", required: true, inputType: "upload" },
      { name: "Business bank statements", description: "Last 2-3 months", required: true, inputType: "upload" },
    ]}],
  },
  {
    name: "Portfolio Scaler (10+ Properties)",
    borrowerType: "Portfolio Scaler",
    description: "Needs REO schedule and full documentation for every property and LLC in the portfolio",
    isDefault: true, isAddon: true,
    sections: [
      { title: "Portfolio Overview", items: [
        { name: "REO (Real Estate Owned) schedule", description: "Full list of every property, outstanding loan balances, monthly payments, and rental income", required: true, inputType: "upload" },
        { name: "Mortgage statements for each financed property", description: "One per property", required: true, inputType: "upload" },
      ]},
      { title: "Multiple LLCs", gateQuestion: "Do you have multiple LLCs?", items: [
        { name: "LLC documentation for each entity", description: "Many portfolio scalers use multiple LLCs for investment properties", required: true, inputType: "upload" },
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
        { name: "Payout history from Airbnb/Vrbo", description: "Past 12 months", required: true, inputType: "upload" },
        { name: "Annual occupancy rate", description: "", required: true, inputType: "text" },
      ]},
      { title: "STR Documentation", items: [
        { name: "AirDNA report showing projected income", description: "For new purchases without payout history", required: true, inputType: "upload" },
        { name: "STR-specific insurance policy", description: "Proof of short-term rental insurance", required: true, inputType: "upload" },
      ]},
    ],
  },
  {
    name: "Foreign National Investor",
    borrowerType: "Foreign National",
    description: "SSN replaced by passport. Alternative credit documentation required",
    isDefault: true, isAddon: true,
    sections: [{ title: "Foreign National Documents", items: [
      { name: "Valid passport", description: "Replaces SSN requirement", required: true, inputType: "upload" },
      { name: "International credit reports or bank reference letters", description: "Alternative credit documentation from foreign banks", required: true, inputType: "upload" },
      { name: "Wire transfer documentation", description: "Foreign bank statements, wire transfer records, and letter explaining origin of funds", required: true, inputType: "upload" },
    ]}],
  },
  {
    name: "Retired Investor",
    borrowerType: "Retired",
    description: "Funds in IRA and brokerage accounts. Watch for withdrawal penalties and tax implications",
    isDefault: true, isAddon: true,
    sections: [
      { title: "Retirement Accounts", items: [
        { name: "Brokerage statements", description: "Current account statements", required: true, inputType: "upload" },
      ]},
      { title: "Retirement Fund Sourcing", gateQuestion: "Are you using retirement funds for the down payment?", items: [
        { name: "IRA/Retirement fund sourcing documentation", description: "Lenders need to verify sufficient funds after withdrawal penalties and tax implications", required: true, inputType: "upload" },
      ]},
    ],
  },
  {
    name: "Gig Economy Worker",
    borrowerType: "Gig Economy",
    description: "Uses 1099s instead of W-2s for income verification",
    isDefault: true, isAddon: true,
    sections: [{ title: "Gig Economy Documents", items: [
      { name: "1099 forms", description: "Last 2 years — replaces W-2s", required: true, inputType: "upload" },
      { name: "Bank statements showing deposits", description: "Last 3-6 months to verify income flow", required: true, inputType: "upload" },
    ]}],
  },
];
