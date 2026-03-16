import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, Shield, CreditCard, MessageSquare, Zap, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/demo/lib/utils";
import { MOCK_BORROWERS, MOCK_ACTIVITIES, PIPELINE_STAGES, STAGE_CONFIG } from "../data/mockData";
import { LeadTempBadge } from "../components/LeadTempBadge";
import { StageBadge } from "../components/StageBadge";
import { VerificationShield } from "../components/VerificationShield";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const TABS = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "application", label: "Application", icon: FileText },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "verification", label: "AI Verification", icon: Shield },
  { id: "credit", label: "Credit & Financials", icon: CreditCard },
  { id: "activity", label: "Activity", icon: MessageSquare },
  { id: "speed-to-lead", label: "Speed to Lead", icon: Zap },
];

export const BorrowerDetail = () => {
  const { id } = useParams();
  const borrower = MOCK_BORROWERS.find((b) => b.id === id);
  const [activeTab, setActiveTab] = useState("overview");

  if (!borrower) {
    return (
      <div className="max-w-[1200px] mx-auto">
        <Link to="/demo/pipeline" className="text-sm text-foreground flex items-center gap-1 mb-4"><ArrowLeft className="h-4 w-4" /> Back to Pipeline</Link>
        <p className="text-muted-foreground">Borrower not found.</p>
      </div>
    );
  }

  const name = borrower.coFirstName
    ? `${borrower.firstName} & ${borrower.coFirstName} ${borrower.lastName}`
    : `${borrower.firstName} ${borrower.lastName}`;

  const currentStageIdx = PIPELINE_STAGES.indexOf(borrower.stage);

  return (
    <div className="max-w-[1200px] mx-auto space-y-4 md:space-y-6">
      <Link to="/demo/pipeline" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Pipeline
      </Link>

      {/* Header */}
      <div className="bg-background rounded-lg border border-border p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-foreground/10 text-foreground text-lg font-bold flex items-center justify-center shrink-0">
              {borrower.firstName[0]}{borrower.lastName[0]}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">{name}</h1>
                <LeadTempBadge temp={borrower.leadTemp} />
                <StageBadge stage={borrower.stage} />
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{borrower.email}</span>
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{borrower.phone}</span>
                {borrower.propertyAddress && <span className="hidden md:flex items-center gap-1"><MapPin className="h-3 w-3" />{borrower.propertyAddress}</span>}
              </div>
            </div>
          </div>
          <div className="text-left md:text-right shrink-0">
            <p className="text-xl font-bold text-foreground tracking-tight">{formatCurrency(borrower.loanAmount)}</p>
            <p className="text-xs text-muted-foreground">{borrower.loanPurpose}</p>
          </div>
        </div>

        {/* Stage Progress */}
        <div className="mt-6 hidden md:flex items-center gap-1">
          {PIPELINE_STAGES.slice(0, 8).map((stage, i) => {
            const isCompleted = i < currentStageIdx;
            const isCurrent = i === currentStageIdx;
            return (
              <React.Fragment key={stage}>
                <div className={cn(
                  "h-2.5 w-2.5 rounded-full shrink-0",
                  isCompleted || isCurrent ? "bg-foreground" : "bg-border"
                )} />
                {i < 7 && <div className={cn("h-0.5 flex-1", isCompleted ? "bg-foreground" : "bg-border")} />}
              </React.Fragment>
            );
          })}
        </div>
        <div className="hidden md:flex justify-between mt-1.5">
          {PIPELINE_STAGES.slice(0, 8).map((stage) => (
            <span key={stage} className="text-[9px] text-muted-foreground">{STAGE_CONFIG[stage].label}</span>
          ))}
        </div>
      </div>

      {/* Tabs — horizontal scroll on mobile */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 md:px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap shrink-0",
              activeTab === tab.id ? "text-foreground border-foreground" : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-background rounded-lg border border-border p-4 md:p-6">
        {activeTab === "overview" && <OverviewTab borrower={borrower} />}
        {activeTab === "application" && <ApplicationTab />}
        {activeTab === "documents" && <DocumentsTab borrower={borrower} />}
        {activeTab === "verification" && <VerificationTab />}
        {activeTab === "credit" && <CreditTab />}
        {activeTab === "activity" && <ActivityTab />}
        {activeTab === "speed-to-lead" && <SpeedToLeadTab borrower={borrower} />}
      </div>
    </div>
  );
};

const OverviewTab = ({ borrower }: { borrower: typeof MOCK_BORROWERS[0] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Contact Information</h3>
      <div className="space-y-2 text-sm">
        <p><span className="text-muted-foreground">Email:</span> {borrower.email}</p>
        <p><span className="text-muted-foreground">Phone:</span> {borrower.phone}</p>
        <p><span className="text-muted-foreground">Lead Source:</span> {borrower.leadSource}</p>
        <p><span className="text-muted-foreground">Created:</span> {borrower.createdAt}</p>
      </div>
    </div>
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Loan Summary</h3>
      <div className="space-y-2 text-sm">
        <p><span className="text-muted-foreground">Amount:</span> {formatCurrency(borrower.loanAmount)}</p>
        <p><span className="text-muted-foreground">Purpose:</span> {borrower.loanPurpose}</p>
        <p><span className="text-muted-foreground">Lead Score:</span> {borrower.leadScore}/100</p>
        <p><span className="text-muted-foreground">Days in Stage:</span> {borrower.daysInStage}</p>
      </div>
    </div>
    <div className="md:col-span-2">
      <h3 className="text-base font-semibold mb-2">Notes</h3>
      <p className="text-sm text-muted-foreground">{borrower.notes}</p>
    </div>
  </div>
);

const ApplicationTab = () => {
  const sections = [
    { name: "Borrower Information", status: "complete", fields: "14/14" },
    { name: "Income & Employment", status: "complete", fields: "12/12" },
    { name: "Financial Profile", status: "partial", fields: "8/10" },
    { name: "Loan Details", status: "complete", fields: "2/2" },
    { name: "Subject Property", status: "complete", fields: "7/7" },
    { name: "Additional Property", status: "hidden", fields: "—" },
    { name: "Declarations", status: "partial", fields: "10/13" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Application Progress — 78%</h3>
        <button className="h-8 px-3 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-80 transition-opacity w-fit">
          Request Completion
        </button>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className="bg-foreground h-2 rounded-full" style={{ width: "78%" }} />
      </div>
      <div className="divide-y divide-border">
        {sections.map((s) => (
          <div key={s.name} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {s.status === "complete" && <Check className="h-4 w-4 text-foreground" />}
              {s.status === "partial" && <AlertTriangle className="h-4 w-4 text-muted-foreground" />}
              {s.status === "hidden" && <span className="h-4 w-4 rounded-full bg-muted" />}
              <span className="text-sm">{s.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{s.fields}</span>
              {s.status === "hidden" && (
                <button className="text-xs text-foreground font-medium hover:opacity-70">Show</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DocumentsTab = ({ borrower }: { borrower: typeof MOCK_BORROWERS[0] }) => {
  const docs = [
    { name: "W-2 Form (2025)", category: "Income", date: "Mar 4, 2026", status: "verified" as const },
    { name: "Pay Stub — Feb 2026", category: "Income", date: "Mar 3, 2026", status: "verified" as const },
    { name: "Bank Statement — Chase", category: "Assets", date: "Mar 2, 2026", status: "review" as const },
    { name: "Driver's License", category: "Identity", date: "Mar 1, 2026", status: "verified" as const },
    { name: "Purchase Agreement", category: "Property", date: "Feb 28, 2026", status: "verified" as const },
    { name: "Tax Return 2024", category: "Income", date: "Feb 27, 2026", status: "verified" as const },
    { name: "HOI Declaration", category: "Property", date: "Feb 26, 2026", status: "pending" as const },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Documents ({borrower.docsReceived}/{borrower.docsRequested})</h3>
        <div className="flex gap-2">
          <button className="h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">Request Docs</button>
          <button className="h-8 px-3 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-80 transition-opacity">Send Checklist</button>
        </div>
      </div>
      <div className="divide-y divide-border">
        {docs.map((d, i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3 min-w-0">
              <VerificationShield status={d.status} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.category}</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{d.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const VerificationTab = () => {
  const checks = [
    { doc: "W-2 Form (2025)", category: "Document Authenticity", result: "Verified", detail: "Font consistency ✓ | Metadata ✓ | Layout ✓ | EIN match ✓", status: "verified" as const },
    { doc: "Pay Stub — Feb 2026", category: "Income Consistency", result: "Verified", detail: "YTD gross matches W-2 projection within 3%", status: "verified" as const },
    { doc: "Bank Statement — Chase", category: "Large Deposit Detection", result: "Review Required", detail: "$12,400 deposit on Feb 15 exceeds 50% of stated monthly income. Source: Unknown.", status: "review" as const },
    { doc: "Bank Statement — Chase", category: "Account Holder Match", result: "Verified", detail: "Name matches: Marcus A. Webb. Address matches application.", status: "verified" as const },
    { doc: "Driver's License", category: "Identity Verification", result: "Verified", detail: "Barcode valid | Not expired | Name matches application", status: "verified" as const },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">AI Pre-Verification Results</h3>
      <div className="space-y-3">
        {checks.map((c, i) => (
          <div key={i} className="border border-border rounded-lg p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <VerificationShield status={c.status} />
                <span className="text-sm font-medium truncate">{c.doc}</span>
              </div>
              <span className={cn("text-xs font-bold uppercase shrink-0",
                c.status === "verified" ? "text-foreground" : "text-muted-foreground"
              )}>{c.result}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{c.category}</p>
            <p className="text-xs text-secondary-foreground">{c.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const CreditTab = () => (
  <div className="space-y-6">
    <h3 className="text-base font-semibold">Credit & Financial Analysis</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border border-border rounded-lg p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Account Summary</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Chase Checking (...4821)</span><span className="font-medium">$24,500</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Chase Savings (...4822)</span><span className="font-medium">$67,200</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Fidelity 401k (...9901)</span><span className="font-medium">$182,000</span></div>
          <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Total Verified Assets</span><span>$273,700</span></div>
        </div>
      </div>
      <div className="border border-border rounded-lg p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Income Verification</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Monthly Payroll (detected)</span><span className="font-medium">$12,800</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Income Consistency Score</span><span className="font-medium">94/100</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Stated vs Verified</span><span className="font-medium">+2.1%</span></div>
        </div>
      </div>
      <div className="border border-border rounded-lg p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Cash Flow (90-day)</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Avg Monthly Inflow</span><span className="font-medium">$13,200</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Avg Monthly Outflow</span><span className="font-medium">$8,400</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Net Cash Flow</span><span className="font-medium">+$4,800</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Overdraft Events (60d)</span><span className="font-medium">0</span></div>
        </div>
      </div>
      <div className="border border-border rounded-lg p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Credit Profile</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Credit Score</span><span className="font-bold text-lg">748</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Open Tradelines</span><span className="font-medium">6</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Utilization Rate</span><span className="font-medium">18%</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">On-Time Payment</span><span className="font-medium">99%</span></div>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
      <Shield className="h-4 w-4 text-foreground shrink-0" />
      Data pulled via Plaid on Mar 3, 2026. All accounts verified.
    </div>
  </div>
);

const ActivityTab = () => {
  const borderColors: Record<string, string> = {
    "lo-action": "border-l-foreground",
    "borrower-action": "border-l-muted-foreground",
    system: "border-l-border",
    flag: "border-l-foreground",
  };

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Activity Feed</h3>
      {MOCK_ACTIVITIES.map((a) => (
        <div key={a.id} className={cn("border-l-4 pl-4 py-2", borderColors[a.type])}>
          <p className="text-sm">{a.description}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{a.actor} · {a.timestamp}</p>
        </div>
      ))}
    </div>
  );
};

const SpeedToLeadTab = ({ borrower }: { borrower: typeof MOCK_BORROWERS[0] }) => {
  const sequence = [
    { step: 1, timing: "Immediately", channel: "SMS", status: "sent", message: `Hi ${borrower.firstName}, this is Sarah Chen. I saw your inquiry and want to help...` },
    { step: 2, timing: "Day 1", channel: "Email", status: "sent", message: "Personalized email with bio, loan options overview, and CTA." },
    { step: 3, timing: "Day 2", channel: "SMS", status: "sent", message: "Quick check-in. Still interested in exploring your options?" },
    { step: 4, timing: "Day 4", channel: "Email", status: "pending", message: "Rate comparison and pre-qualification offer." },
    { step: 5, timing: "Day 7", channel: "Phone", status: "pending", message: "Personal call — follow up on engagement." },
    { step: 6, timing: "Day 14", channel: "Email", status: "pending", message: "Final nurture email with market update." },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Follow-up Sequence</h3>
        <span className={cn(
          "text-xs font-bold uppercase px-2 py-0.5 rounded",
          borrower.speedToLeadEnabled ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
        )}>
          {borrower.speedToLeadEnabled ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="space-y-2">
        {sequence.map((s, i) => (
          <div key={i} className={cn("flex items-center gap-3 md:gap-4 p-3 rounded-lg border", s.status === "sent" ? "border-border bg-muted/30" : "border-border")}>
            <div className={cn(
              "h-7 w-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0",
              s.status === "sent" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
            )}>
              {s.step}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{s.channel}</span>
                <span className="text-xs text-muted-foreground">· {s.timing}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{s.message}</p>
            </div>
            <span className={cn("text-[11px] font-bold uppercase shrink-0",
              s.status === "sent" ? "text-foreground" : "text-muted-foreground"
            )}>{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
