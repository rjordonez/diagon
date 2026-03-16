export type PipelineStage =
  | "new-lead"
  | "contacted"
  | "app-sent"
  | "app-in-progress"
  | "app-submitted"
  | "in-review"
  | "conditionally-approved"
  | "clear-to-close"
  | "closed"
  | "on-hold"
  | "dead";

export type LeadTemp = "hot" | "warm" | "cold";

export type VerificationStatus = "verified" | "review" | "flagged" | "pending";

export interface Borrower {
  id: string;
  firstName: string;
  lastName: string;
  coFirstName?: string;
  coLastName?: string;
  email: string;
  phone: string;
  loanAmount: number;
  loanPurpose: string;
  propertyAddress?: string;
  stage: PipelineStage;
  leadTemp: LeadTemp;
  leadScore: number;
  daysInStage: number;
  leadSource: string;
  docsRequested: number;
  docsReceived: number;
  docsVerified: number;
  aiFlags: number;
  verificationStatus: VerificationStatus;
  lastActivity: string;
  nextAction: string;
  assignedLO: string;
  notes: string;
  createdAt: string;
  speedToLeadEnabled: boolean;
}

export const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string }> = {
  "new-lead": { label: "New Lead", color: "bg-stage-new text-stage-new-foreground" },
  contacted: { label: "Contacted", color: "bg-stage-active text-stage-active-foreground" },
  "app-sent": { label: "App Sent", color: "bg-stage-active text-stage-active-foreground" },
  "app-in-progress": { label: "App In Progress", color: "bg-stage-progress text-stage-progress-foreground" },
  "app-submitted": { label: "App Submitted", color: "bg-stage-progress text-stage-progress-foreground" },
  "in-review": { label: "In Review", color: "bg-stage-progress text-stage-progress-foreground" },
  "conditionally-approved": { label: "Cond. Approved", color: "bg-stage-approved text-stage-approved-foreground" },
  "clear-to-close": { label: "Clear to Close", color: "bg-stage-approved text-stage-approved-foreground" },
  closed: { label: "Closed", color: "bg-stage-closed text-stage-closed-foreground" },
  "on-hold": { label: "On Hold", color: "bg-stage-hold text-stage-hold-foreground" },
  dead: { label: "Dead", color: "bg-stage-dead text-stage-dead-foreground" },
};

export const PIPELINE_STAGES: PipelineStage[] = [
  "new-lead",
  "contacted",
  "app-sent",
  "app-in-progress",
  "app-submitted",
  "in-review",
  "conditionally-approved",
  "clear-to-close",
  "closed",
  "on-hold",
  "dead",
];

export const ACTIVE_STAGES: PipelineStage[] = [
  "new-lead",
  "contacted",
  "app-sent",
  "app-in-progress",
  "app-submitted",
  "in-review",
  "conditionally-approved",
  "clear-to-close",
];

export const MOCK_BORROWERS: Borrower[] = [
  {
    id: "1",
    firstName: "Marcus",
    lastName: "Webb",
    coFirstName: "Jenna",
    coLastName: "Webb",
    email: "marcus.webb@email.com",
    phone: "(415) 555-0142",
    loanAmount: 880000,
    loanPurpose: "Purchase",
    propertyAddress: "2847 Oak Valley Dr, San Jose, CA 95132",
    stage: "in-review",
    leadTemp: "hot",
    leadScore: 91,
    daysInStage: 2,
    leadSource: "Referral",
    docsRequested: 7,
    docsReceived: 7,
    docsVerified: 5,
    aiFlags: 0,
    verificationStatus: "verified",
    lastActivity: "2 hours ago",
    nextAction: "Final review",
    assignedLO: "Sarah Chen",
    notes: "Strong file. Pre-approved by underwriting.",
    createdAt: "2026-02-10",
    speedToLeadEnabled: false,
  },
  {
    id: "2",
    firstName: "Derek",
    lastName: "Fontaine",
    email: "derek.fontaine@email.com",
    phone: "(510) 555-0198",
    loanAmount: 1600000,
    loanPurpose: "Purchase",
    propertyAddress: "1234 Johnson St, San Francisco, CA 94182",
    stage: "app-submitted",
    leadTemp: "hot",
    leadScore: 82,
    daysInStage: 3,
    leadSource: "Company Website",
    docsRequested: 7,
    docsReceived: 5,
    docsVerified: 3,
    aiFlags: 1,
    verificationStatus: "review",
    lastActivity: "5 hours ago",
    nextAction: "Review AI flags",
    assignedLO: "Sarah Chen",
    notes: "Jumbo loan. Awaiting 2 more docs.",
    createdAt: "2026-02-15",
    speedToLeadEnabled: false,
  },
  {
    id: "3",
    firstName: "Priya",
    lastName: "Nair",
    email: "priya.nair@email.com",
    phone: "(408) 555-0267",
    loanAmount: 540000,
    loanPurpose: "Refinance",
    propertyAddress: "918 Elm Creek Way, Sunnyvale, CA 94086",
    stage: "conditionally-approved",
    leadTemp: "hot",
    leadScore: 78,
    daysInStage: 1,
    leadSource: "Zillow",
    docsRequested: 6,
    docsReceived: 6,
    docsVerified: 6,
    aiFlags: 0,
    verificationStatus: "verified",
    lastActivity: "1 day ago",
    nextAction: "Collect final conditions",
    assignedLO: "Sarah Chen",
    notes: "Rate lock expiring in 10 days.",
    createdAt: "2026-01-28",
    speedToLeadEnabled: false,
  },
  {
    id: "4",
    firstName: "Liam",
    lastName: "Torres",
    coFirstName: "Sasha",
    coLastName: "Torres",
    email: "liam.torres@email.com",
    phone: "(650) 555-0321",
    loanAmount: 1200000,
    loanPurpose: "Purchase",
    stage: "app-in-progress",
    leadTemp: "warm",
    leadScore: 62,
    daysInStage: 4,
    leadSource: "Referral",
    docsRequested: 0,
    docsReceived: 0,
    docsVerified: 0,
    aiFlags: 0,
    verificationStatus: "pending",
    lastActivity: "1 day ago",
    nextAction: "Nudge to complete app",
    assignedLO: "Sarah Chen",
    notes: "Meeting booked for Thursday.",
    createdAt: "2026-02-20",
    speedToLeadEnabled: true,
  },
  {
    id: "5",
    firstName: "Natasha",
    lastName: "Okonkwo",
    email: "natasha.o@email.com",
    phone: "(925) 555-0456",
    loanAmount: 720000,
    loanPurpose: "Purchase",
    stage: "app-sent",
    leadTemp: "warm",
    leadScore: 48,
    daysInStage: 5,
    leadSource: "Open House",
    docsRequested: 0,
    docsReceived: 0,
    docsVerified: 0,
    aiFlags: 0,
    verificationStatus: "pending",
    lastActivity: "3 days ago",
    nextAction: "Follow up on app",
    assignedLO: "Sarah Chen",
    notes: "Email opened; no app started yet.",
    createdAt: "2026-02-22",
    speedToLeadEnabled: true,
  },
  {
    id: "6",
    firstName: "James",
    lastName: "Whitfield",
    email: "j.whitfield@email.com",
    phone: "(707) 555-0589",
    loanAmount: 430000,
    loanPurpose: "Purchase",
    stage: "contacted",
    leadTemp: "warm",
    leadScore: 44,
    daysInStage: 3,
    leadSource: "Cold Call",
    docsRequested: 0,
    docsReceived: 0,
    docsVerified: 0,
    aiFlags: 0,
    verificationStatus: "pending",
    lastActivity: "2 days ago",
    nextAction: "Send application link",
    assignedLO: "Sarah Chen",
    notes: "Responded to first text; interested in FHA.",
    createdAt: "2026-02-25",
    speedToLeadEnabled: true,
  },
  {
    id: "7",
    firstName: "Camille",
    lastName: "Russo",
    email: "c.russo@email.com",
    phone: "(831) 555-0712",
    loanAmount: 950000,
    loanPurpose: "Cash-Out Refinance",
    stage: "new-lead",
    leadTemp: "cold",
    leadScore: 18,
    daysInStage: 8,
    leadSource: "Social Media",
    docsRequested: 0,
    docsReceived: 0,
    docsVerified: 0,
    aiFlags: 0,
    verificationStatus: "pending",
    lastActivity: "8 days ago",
    nextAction: "Attempt 5th outreach",
    assignedLO: "Sarah Chen",
    notes: "No response after 4 outreach attempts.",
    createdAt: "2026-02-18",
    speedToLeadEnabled: true,
  },
  {
    id: "8",
    firstName: "Anand",
    lastName: "Patel",
    email: "anand.p@email.com",
    phone: "(209) 555-0834",
    loanAmount: 310000,
    loanPurpose: "Purchase",
    stage: "new-lead",
    leadTemp: "cold",
    leadScore: 8,
    daysInStage: 22,
    leadSource: "Zillow",
    docsRequested: 0,
    docsReceived: 0,
    docsVerified: 0,
    aiFlags: 0,
    verificationStatus: "pending",
    lastActivity: "22 days ago",
    nextAction: "Last attempt or close",
    assignedLO: "Sarah Chen",
    notes: "Added 22 days ago; no activity.",
    createdAt: "2026-02-04",
    speedToLeadEnabled: false,
  },
  {
    id: "9",
    firstName: "Gregory",
    lastName: "Marsh",
    email: "g.marsh@email.com",
    phone: "(530) 555-0967",
    loanAmount: 670000,
    loanPurpose: "Refinance",
    stage: "on-hold",
    leadTemp: "cold",
    leadScore: 22,
    daysInStage: 30,
    leadSource: "Company Website",
    docsRequested: 3,
    docsReceived: 1,
    docsVerified: 0,
    aiFlags: 0,
    verificationStatus: "pending",
    lastActivity: "30 days ago",
    nextAction: "Re-engage or close",
    assignedLO: "Sarah Chen",
    notes: "No activity in 30 days; paused file.",
    createdAt: "2026-01-15",
    speedToLeadEnabled: false,
  },
  {
    id: "10",
    firstName: "Elena",
    lastName: "Vasquez",
    email: "elena.v@email.com",
    phone: "(415) 555-1100",
    loanAmount: 495000,
    loanPurpose: "Purchase",
    propertyAddress: "456 Pine St, Oakland, CA 94612",
    stage: "clear-to-close",
    leadTemp: "hot",
    leadScore: 95,
    daysInStage: 1,
    leadSource: "Referral",
    docsRequested: 7,
    docsReceived: 7,
    docsVerified: 7,
    aiFlags: 0,
    verificationStatus: "verified",
    lastActivity: "4 hours ago",
    nextAction: "Schedule closing",
    assignedLO: "Sarah Chen",
    notes: "All conditions cleared. Closing scheduled next week.",
    createdAt: "2026-01-10",
    speedToLeadEnabled: false,
  },
];

export const LEAD_SOURCES = [
  "Referral",
  "Company Website",
  "Zillow",
  "Realtor.com",
  "Open House",
  "Social Media",
  "Cold Call",
  "Marketing Campaign",
  "Other",
];

export const LOAN_PURPOSES = ["Purchase", "Refinance", "Cash-Out Refinance", "Construction"];

export interface ActivityEntry {
  id: string;
  type: "lo-action" | "borrower-action" | "system" | "flag";
  description: string;
  actor: string;
  timestamp: string;
}

export const MOCK_ACTIVITIES: ActivityEntry[] = [
  { id: "a1", type: "borrower-action", description: "Uploaded W-2 form (2025)", actor: "Marcus Webb", timestamp: "Today, 2:15 PM" },
  { id: "a2", type: "system", description: "AI verification completed — all checks passed", actor: "System", timestamp: "Today, 2:16 PM" },
  { id: "a3", type: "lo-action", description: "Moved stage from App Submitted to In Review", actor: "Sarah Chen", timestamp: "Today, 10:30 AM" },
  { id: "a4", type: "borrower-action", description: "Completed application step: Declarations", actor: "Marcus Webb", timestamp: "Yesterday, 4:45 PM" },
  { id: "a5", type: "lo-action", description: "Sent document checklist via email", actor: "Sarah Chen", timestamp: "Feb 20, 11:00 AM" },
  { id: "a6", type: "system", description: "Speed to Lead sequence completed — 5 messages sent", actor: "System", timestamp: "Feb 18, 9:00 AM" },
  { id: "a7", type: "borrower-action", description: "Opened application link for the first time", actor: "Marcus Webb", timestamp: "Feb 17, 3:22 PM" },
  { id: "a8", type: "lo-action", description: "Sent application link via email and SMS", actor: "Sarah Chen", timestamp: "Feb 15, 10:00 AM" },
];

export interface CampaignRequest {
  id: string;
  name: string;
  goal: string;
  audience: string[];
  channels: string[];
  status: "submitted" | "in-review" | "approved" | "live" | "completed" | "rejected";
  launchDate: string;
  duration: string;
  budget?: number;
  leadsGenerated?: number;
  submittedAt: string;
}

export const MOCK_CAMPAIGNS: CampaignRequest[] = [
  {
    id: "c1", name: "Spring Purchase Push", goal: "Generate new leads",
    audience: ["First-time buyers", "Move-up buyers"], channels: ["Email", "Meta Ads"],
    status: "live", launchDate: "2026-03-01", duration: "1 month",
    budget: 1200, leadsGenerated: 14, submittedAt: "2026-02-15",
  },
  {
    id: "c2", name: "Refi Rate Drop Alert", goal: "Nurture existing leads",
    audience: ["Refinance prospects"], channels: ["Email", "SMS"],
    status: "completed", launchDate: "2026-02-01", duration: "2 weeks",
    budget: 400, leadsGenerated: 8, submittedAt: "2026-01-20",
  },
  {
    id: "c3", name: "Agent Referral Outreach", goal: "Brand awareness",
    audience: ["Real estate agents"], channels: ["Direct Mail", "Email"],
    status: "in-review", launchDate: "2026-03-15", duration: "1 month",
    budget: 2000, submittedAt: "2026-03-01",
  },
];

// Lead Distribution types and data

export type DeliveryMethod = "direct-post" | "ping-post";

export type LeadDistributionStatus = "accepted" | "rejected" | "pending" | "returned";

// Sarah's buyer profile
export interface MyBuyerProfile {
  states: string[];
  loanTypes: string[];
  amountMin: number;
  amountMax: number;
  dailyCap: number;
  todayReceived: number;
  pricePerLead: number;
  deliveryMethod: DeliveryMethod;
}

// Campaigns Sarah is enrolled in (Diagon set these up, she can see/pause them)
export interface BuyerCampaign {
  id: string;
  name: string;
  type: DeliveryMethod;
  filters: string[];
  leadsReceived: number;
  totalSpend: number;
  status: "active" | "paused";
}

// Leads delivered to Sarah
export interface IncomingLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  state: string;
  loanType: string;
  loanAmount: number;
  propertyAddress?: string;
  price: number;
  status: "new" | "accepted" | "rejected" | "returned";
  timestamp: string;
  source: string;
  trustedFormCert: string;
  leadIdToken: string;
  dupeCheck: boolean;
}

export const MY_PROFILE: MyBuyerProfile = {
  states: ["CA", "TX", "FL"],
  loanTypes: ["Purchase", "Refinance"],
  amountMin: 200000,
  amountMax: 2000000,
  dailyCap: 50,
  todayReceived: 7,
  pricePerLead: 45,
  deliveryMethod: "direct-post",
};

export const MY_CAMPAIGNS: BuyerCampaign[] = [
  {
    id: "bc1", name: "CA Purchase Leads", type: "direct-post",
    filters: ["State = CA", "Loan Type = Purchase", "Amount $200k–$1.5M"],
    leadsReceived: 142, totalSpend: 6390, status: "active",
  },
  {
    id: "bc2", name: "Multi-State Refi", type: "ping-post",
    filters: ["State = CA, TX, FL", "Loan Type = Refinance", "Amount $200k–$2M"],
    leadsReceived: 87, totalSpend: 3915, status: "active",
  },
  {
    id: "bc3", name: "High-Value Jumbo", type: "direct-post",
    filters: ["State = CA", "Loan Type = Purchase", "Amount $1M–$2M"],
    leadsReceived: 34, totalSpend: 1530, status: "paused",
  },
];

export const MY_INCOMING_LEADS: IncomingLead[] = [
  {
    id: "il1", name: "Marcus Webb", email: "marcus.webb@email.com", phone: "(415) 555-0142",
    state: "CA", loanType: "Purchase", loanAmount: 880000,
    propertyAddress: "2847 Oak Valley Dr, San Jose, CA 95132",
    price: 45, status: "new", timestamp: "Today, 2:30 PM", source: "CA Purchase Leads",
    trustedFormCert: "tf-cert-8a3f2b", leadIdToken: "lid-9x2k7m", dupeCheck: true,
  },
  {
    id: "il2", name: "Priya Nair", email: "priya.nair@email.com", phone: "(408) 555-0267",
    state: "CA", loanType: "Refinance", loanAmount: 540000,
    propertyAddress: "918 Elm Creek Way, Sunnyvale, CA 94086",
    price: 45, status: "new", timestamp: "Today, 1:15 PM", source: "Multi-State Refi",
    trustedFormCert: "tf-cert-5c1d9e", leadIdToken: "lid-7p3n4q", dupeCheck: true,
  },
  {
    id: "il3", name: "Derek Fontaine", email: "derek.fontaine@email.com", phone: "(510) 555-0198",
    state: "CA", loanType: "Purchase", loanAmount: 1600000,
    propertyAddress: "1234 Johnson St, San Francisco, CA 94182",
    price: 45, status: "new", timestamp: "Today, 11:45 AM", source: "High-Value Jumbo",
    trustedFormCert: "tf-cert-7b2e6f", leadIdToken: "lid-4m8j1w", dupeCheck: true,
  },
  {
    id: "il4", name: "Liam Torres", email: "liam.torres@email.com", phone: "(650) 555-0321",
    state: "TX", loanType: "Refinance", loanAmount: 420000,
    price: 45, status: "accepted", timestamp: "Today, 10:20 AM", source: "Multi-State Refi",
    trustedFormCert: "tf-cert-3e7h5k", leadIdToken: "lid-5t9v2r", dupeCheck: true,
  },
  {
    id: "il5", name: "Natasha Okonkwo", email: "natasha.o@email.com", phone: "(925) 555-0456",
    state: "FL", loanType: "Purchase", loanAmount: 720000,
    propertyAddress: "8812 Palm Bay Rd, Melbourne, FL 32940",
    price: 45, status: "accepted", timestamp: "Today, 9:50 AM", source: "CA Purchase Leads",
    trustedFormCert: "tf-cert-2a9f8c", leadIdToken: "lid-1k5r3p", dupeCheck: true,
  },
  {
    id: "il6", name: "James Whitfield", email: "j.whitfield@email.com", phone: "(707) 555-0589",
    state: "CA", loanType: "Purchase", loanAmount: 430000,
    price: 45, status: "accepted", timestamp: "Yesterday, 4:30 PM", source: "CA Purchase Leads",
    trustedFormCert: "tf-cert-6d4g7j", leadIdToken: "lid-8w2m6n", dupeCheck: false,
  },
  {
    id: "il7", name: "Camille Russo", email: "c.russo@email.com", phone: "(831) 555-0712",
    state: "CA", loanType: "Refinance", loanAmount: 950000,
    propertyAddress: "445 Coast Rd, Santa Cruz, CA 95060",
    price: 45, status: "accepted", timestamp: "Yesterday, 2:10 PM", source: "Multi-State Refi",
    trustedFormCert: "tf-cert-1f8j4b", leadIdToken: "lid-3q6x9d", dupeCheck: true,
  },
  {
    id: "il8", name: "Anand Patel", email: "anand.p@email.com", phone: "(209) 555-0834",
    state: "TX", loanType: "Purchase", loanAmount: 310000,
    price: 45, status: "rejected", timestamp: "Yesterday, 11:00 AM", source: "CA Purchase Leads",
    trustedFormCert: "tf-cert-9g2k5m", leadIdToken: "lid-6u1y8t", dupeCheck: false,
  },
  {
    id: "il9", name: "Elena Vasquez", email: "elena.v@email.com", phone: "(415) 555-1100",
    state: "CA", loanType: "Purchase", loanAmount: 495000,
    propertyAddress: "456 Pine St, Oakland, CA 94612",
    price: 45, status: "rejected", timestamp: "2 days ago, 3:15 PM", source: "CA Purchase Leads",
    trustedFormCert: "tf-cert-4d7f2a", leadIdToken: "lid-2h9c5w", dupeCheck: true,
  },
  {
    id: "il10", name: "Gregory Marsh", email: "g.marsh@email.com", phone: "(530) 555-0967",
    state: "FL", loanType: "Refinance", loanAmount: 670000,
    price: 45, status: "returned", timestamp: "2 days ago, 10:30 AM", source: "Multi-State Refi",
    trustedFormCert: "tf-cert-8b3e1c", leadIdToken: "lid-7k4m2q", dupeCheck: true,
  },
];
