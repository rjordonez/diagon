import React, { useState } from "react";
import { Kanban, ChevronDown, ChevronRight, Upload, Download, Users } from "lucide-react";
import { cn } from "@/demo/lib/utils";
import { MOCK_BORROWERS, ACTIVE_STAGES, STAGE_CONFIG, type PipelineStage } from "../data/mockData";
import { BorrowerCard } from "../components/BorrowerCard";
import { LeadTempBadge } from "../components/LeadTempBadge";
import { StageBadge } from "../components/StageBadge";
import { VerificationShield } from "../components/VerificationShield";
import { Link } from "react-router-dom";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// Group stages into logical phases
const PHASE_GROUPS = [
  { label: "Leads", stages: ["new-lead", "contacted"] as PipelineStage[] },
  { label: "Application", stages: ["app-sent", "app-in-progress", "app-submitted"] as PipelineStage[] },
  { label: "Underwriting", stages: ["in-review", "conditionally-approved"] as PipelineStage[] },
  { label: "Closing", stages: ["clear-to-close"] as PipelineStage[] },
];

export const PipelinePage = () => {
  const [tab, setTab] = useState<"pipeline" | "leads">("pipeline");
  const [filter, setFilter] = useState<"all" | "hot" | "warm" | "cold">("all");

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            {tab === "pipeline" ? "Pipeline" : "Leads"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{MOCK_BORROWERS.length} borrowers</p>
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
        <KanbanView />
      ) : (
        <LeadsView filter={filter} setFilter={setFilter} />
      )}
    </div>
  );
};

/* ── Pipeline Views ── */

const PhaseGroup = ({ label, stages }: { label: string; stages: PipelineStage[] }) => {
  const [expanded, setExpanded] = useState(true);
  const borrowers = MOCK_BORROWERS.filter((b) => stages.includes(b.stage));
  const totalVolume = borrowers.reduce((s, b) => s + b.loanAmount, 0);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-2.5 hover:opacity-70 transition-opacity"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-[13px] font-semibold text-foreground">{label}</span>
          <span className="text-[11px] text-muted-foreground">{borrowers.length}</span>
          <span className="text-[11px] text-muted-foreground">· {formatCurrency(totalVolume)}</span>
        </div>
      </button>

      {expanded && (
        <div className="pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-1">
            {stages.map((stage) => {
              const stageBorrowers = MOCK_BORROWERS.filter((b) => b.stage === stage);
              const config = STAGE_CONFIG[stage];
              return (
                <div key={stage} className="min-w-0 mb-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{config.label}</span>
                    <span className="text-[10px] text-muted-foreground">{stageBorrowers.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {stageBorrowers.map((b) => (
                      <BorrowerCard key={b.id} borrower={b} />
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

const KanbanView = () => (
  <div className="divide-y divide-border">
    {PHASE_GROUPS.map((group) => (
      <PhaseGroup key={group.label} label={group.label} stages={group.stages} />
    ))}
  </div>
);

/* ── Leads View ── */

const LeadsView = ({ filter, setFilter }: { filter: "all" | "hot" | "warm" | "cold"; setFilter: (f: "all" | "hot" | "warm" | "cold") => void }) => {
  const filtered = filter === "all" ? MOCK_BORROWERS : MOCK_BORROWERS.filter((b) => b.leadTemp === filter);

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
          <Link key={b.id} to={`/demo/borrower/${b.id}`} className="block bg-background rounded-lg border border-border p-3 hover:border-foreground/20 transition-colors">
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
                    <Link to={`/demo/borrower/${b.id}`} className="text-[13px] font-medium text-foreground hover:opacity-70">
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
