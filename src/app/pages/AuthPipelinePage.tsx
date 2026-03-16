import React, { useState } from "react";
import { Kanban, ChevronDown, ChevronRight, Upload, Download, Users } from "lucide-react";
import { cn } from "@/demo/lib/utils";
import { ACTIVE_STAGES, STAGE_CONFIG, type PipelineStage, type Borrower } from "@/demo/crm/data/mockData";
import { LeadTempBadge } from "@/demo/crm/components/LeadTempBadge";
import { StageBadge } from "@/demo/crm/components/StageBadge";
import { VerificationShield } from "@/demo/crm/components/VerificationShield";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { useBorrowers } from "../hooks/useSupabaseData";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const PHASE_GROUPS = [
  { label: "Leads", stages: ["new-lead", "contacted"] as PipelineStage[] },
  { label: "Application", stages: ["app-sent", "app-in-progress", "app-submitted"] as PipelineStage[] },
  { label: "Underwriting", stages: ["in-review", "conditionally-approved"] as PipelineStage[] },
  { label: "Closing", stages: ["clear-to-close"] as PipelineStage[] },
];

export const AuthPipelinePage = () => {
  const [tab, setTab] = useState<"pipeline" | "leads">("pipeline");
  const [filter, setFilter] = useState<"all" | "hot" | "warm" | "cold">("all");
  const { data: borrowers = [], isLoading } = useBorrowers();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h1 className="text-lg font-bold text-foreground tracking-tight">Pipeline</h1>
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (borrowers.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-lg font-bold text-foreground tracking-tight">Pipeline</h1>
        <p className="text-xs text-muted-foreground mt-0.5">0 borrowers</p>
        <div className="bg-background rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">Your pipeline is empty. Accept leads from Lead Distribution or click "Add Lead" to create one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            {tab === "pipeline" ? "Pipeline" : "Leads"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{borrowers.length} borrowers</p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "leads" && (
            <div className="flex gap-1.5">
              <button className="h-8 px-2.5 rounded-lg border border-border text-xs font-medium flex items-center gap-1.5 hover:bg-muted transition-colors">
                <Upload className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Import</span>
              </button>
              <button className="h-8 px-2.5 rounded-lg border border-border text-xs font-medium flex items-center gap-1.5 hover:bg-muted transition-colors">
                <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Template</span>
              </button>
            </div>
          )}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setTab("pipeline")}
              className={cn("h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors", tab === "pipeline" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <Kanban className="h-3.5 w-3.5" /> Pipeline
            </button>
            <button
              onClick={() => setTab("leads")}
              className={cn("h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors", tab === "leads" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <Users className="h-3.5 w-3.5" /> Leads
            </button>
          </div>
        </div>
      </div>

      {tab === "pipeline" ? (
        <KanbanView borrowers={borrowers} />
      ) : (
        <LeadsView borrowers={borrowers} filter={filter} setFilter={setFilter} />
      )}
    </div>
  );
};

const PhaseGroup = ({ label, stages, borrowers }: { label: string; stages: PipelineStage[]; borrowers: Borrower[] }) => {
  const [expanded, setExpanded] = useState(true);
  const phaseBorrowers = borrowers.filter((b) => stages.includes(b.stage));
  const totalVolume = phaseBorrowers.reduce((s, b) => s + b.loanAmount, 0);

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between py-2.5 hover:opacity-70 transition-opacity">
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-[13px] font-semibold text-foreground">{label}</span>
          <span className="text-[11px] text-muted-foreground">{phaseBorrowers.length}</span>
          <span className="text-[11px] text-muted-foreground">· {formatCurrency(totalVolume)}</span>
        </div>
      </button>

      {expanded && (
        <div className="pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-1">
            {stages.map((stage) => {
              const stageBorrowers = borrowers.filter((b) => b.stage === stage);
              const config = STAGE_CONFIG[stage];
              return (
                <div key={stage} className="min-w-0 mb-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{config.label}</span>
                    <span className="text-[10px] text-muted-foreground">{stageBorrowers.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {stageBorrowers.map((b) => (
                      <AuthBorrowerCard key={b.id} borrower={b} />
                    ))}
                    {stageBorrowers.length === 0 && (
                      <p className="text-[11px] text-muted-foreground py-3">No borrowers</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const AuthBorrowerCard = ({ borrower }: { borrower: Borrower }) => {
  const name = borrower.coFirstName
    ? `${borrower.firstName} & ${borrower.coFirstName} ${borrower.lastName}`
    : `${borrower.firstName} ${borrower.lastName}`;

  return (
    <Link
      to={`/app/borrower/${borrower.id}`}
      className="block bg-background rounded-lg border border-border p-2.5 hover:border-foreground/30 transition-colors"
    >
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <p className="text-[12px] font-semibold text-foreground truncate">{name}</p>
        <LeadTempBadge temp={borrower.leadTemp} />
      </div>
      <p className="text-[12px] font-medium text-foreground">{formatCurrency(borrower.loanAmount)}</p>
      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <FileText className="h-2.5 w-2.5" />
            {borrower.docsReceived}/{borrower.docsRequested}
          </span>
          <VerificationShield status={borrower.verificationStatus} flags={borrower.aiFlags} />
        </div>
        <span className="text-[10px] text-muted-foreground">{borrower.daysInStage}d</span>
      </div>
    </Link>
  );
};

const KanbanView = ({ borrowers }: { borrowers: Borrower[] }) => (
  <div className="divide-y divide-border">
    {PHASE_GROUPS.map((group) => (
      <PhaseGroup key={group.label} label={group.label} stages={group.stages} borrowers={borrowers} />
    ))}
  </div>
);

const LeadsView = ({ borrowers, filter, setFilter }: { borrowers: Borrower[]; filter: "all" | "hot" | "warm" | "cold"; setFilter: (f: "all" | "hot" | "warm" | "cold") => void }) => {
  const filtered = filter === "all" ? borrowers : borrowers.filter((b) => b.leadTemp === filter);

  return (
    <>
      <div className="flex gap-1">
        {(["all", "hot", "warm", "cold"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-7 px-2.5 rounded-md text-[11px] font-bold uppercase tracking-wide transition-colors ${
              filter === f ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-2">
        {filtered.map((b) => (
          <Link key={b.id} to={`/app/borrower/${b.id}`} className="block bg-background rounded-lg border border-border p-3 hover:border-foreground/20 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[13px] font-medium text-foreground">{b.firstName} {b.lastName}</p>
              <LeadTempBadge temp={b.leadTemp} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{formatCurrency(b.loanAmount)}</span>
              <StageBadge stage={b.stage} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">{b.email}</p>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-background rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                {["Name", "Email", "Phone", "Source", "Amount", "Stage", "Temp", "Score", "Created"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-3 py-2">
                    <Link to={`/app/borrower/${b.id}`} className="text-[13px] font-medium text-foreground hover:opacity-70">
                      {b.firstName} {b.lastName}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-[12px] text-muted-foreground">{b.email}</td>
                  <td className="px-3 py-2 text-[12px] text-muted-foreground">{b.phone}</td>
                  <td className="px-3 py-2 text-[11px] text-muted-foreground">{b.leadSource}</td>
                  <td className="px-3 py-2 text-[13px]">{formatCurrency(b.loanAmount)}</td>
                  <td className="px-3 py-2"><StageBadge stage={b.stage} /></td>
                  <td className="px-3 py-2"><LeadTempBadge temp={b.leadTemp} /></td>
                  <td className="px-3 py-2 text-[13px] font-medium">{b.leadScore}</td>
                  <td className="px-3 py-2 text-[11px] text-muted-foreground">{b.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
