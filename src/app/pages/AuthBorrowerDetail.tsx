import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, FileText, Shield, CreditCard, MessageSquare, Zap, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/demo/lib/utils";
import { PIPELINE_STAGES, STAGE_CONFIG } from "@/demo/crm/data/mockData";
import { LeadTempBadge } from "@/demo/crm/components/LeadTempBadge";
import { StageBadge } from "@/demo/crm/components/StageBadge";
import { useBorrowers } from "../hooks/useSupabaseData";

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

export const AuthBorrowerDetail = () => {
  const { id } = useParams();
  const { data: borrowers = [], isLoading } = useBorrowers();
  const borrower = borrowers.find((b) => b.id === id);
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto">
        <Link to="/app/pipeline" className="text-sm text-muted-foreground flex items-center gap-1 mb-4"><ArrowLeft className="h-4 w-4" /> Back to Pipeline</Link>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!borrower) {
    return (
      <div className="max-w-[1200px] mx-auto">
        <Link to="/app/pipeline" className="text-sm text-foreground flex items-center gap-1 mb-4"><ArrowLeft className="h-4 w-4" /> Back to Pipeline</Link>
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
      <Link to="/app/pipeline" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
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
                <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", isCompleted || isCurrent ? "bg-foreground" : "bg-border")} />
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

      {/* Tabs */}
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
        {activeTab === "overview" && (
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
              <p className="text-sm text-muted-foreground">{borrower.notes || "No notes yet."}</p>
            </div>
          </div>
        )}
        {activeTab === "application" && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Application data will appear once the borrower starts their application.
          </div>
        )}
        {activeTab === "documents" && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No documents uploaded yet.
          </div>
        )}
        {activeTab === "verification" && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            AI verification will run once documents are uploaded.
          </div>
        )}
        {activeTab === "credit" && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Credit and financial data will appear once linked.
          </div>
        )}
        {activeTab === "activity" && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No activity yet.
          </div>
        )}
        {activeTab === "speed-to-lead" && (
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
            {borrower.speedToLeadEnabled ? (
              <p className="text-sm text-muted-foreground">Speed to Lead sequence is active for this borrower.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Speed to Lead is not enabled for this borrower.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
