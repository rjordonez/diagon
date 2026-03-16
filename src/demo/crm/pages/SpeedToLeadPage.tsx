import React from "react";
import { Link } from "react-router-dom";
import { Zap, Bell, Clock, Mail } from "lucide-react";
import { MOCK_BORROWERS } from "../data/mockData";
import { LeadTempBadge } from "../components/LeadTempBadge";
import { cn } from "@/demo/lib/utils";

const AUTOMATIONS = [
  { id: "speed-to-lead", icon: Zap, label: "Speed to Lead", description: "Automated follow-up sequences for new leads", enabled: true },
  { id: "stale-reminders", icon: Clock, label: "Stale Lead Reminders", description: "Notify when leads go inactive for 7+ days", enabled: false },
  { id: "doc-nudges", icon: Mail, label: "Document Nudges", description: "Auto-remind borrowers about missing docs", enabled: false },
  { id: "status-alerts", icon: Bell, label: "Status Change Alerts", description: "Notify buyers when lead status changes", enabled: false },
];

export const SpeedToLeadPage = () => {
  const activeSequences = MOCK_BORROWERS.filter((b) => b.speedToLeadEnabled);

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-foreground tracking-tight">Automations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure automated workflows and sequences</p>
      </div>

      {/* Automations list */}
      <div className="bg-background rounded-lg border border-border divide-y divide-border">
        {AUTOMATIONS.map((auto) => (
          <div key={auto.id} className="flex items-center justify-between px-4 md:px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", auto.enabled ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground")}>
                <auto.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{auto.label}</p>
                <p className="text-xs text-muted-foreground">{auto.description}</p>
              </div>
            </div>
            <div className={cn("px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide shrink-0", auto.enabled ? "bg-stage-approved text-stage-approved-foreground" : "bg-muted text-muted-foreground")}>
              {auto.enabled ? "Active" : "Coming Soon"}
            </div>
          </div>
        ))}
      </div>

      {/* Speed to Lead detail */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4" /> Speed to Lead
        </h2>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
          {[
            { label: "Avg Time to First Contact", value: "4 min" },
            { label: "SMS Open Rate", value: "92%" },
            { label: "Email Reply Rate", value: "34%" },
            { label: "Conversion Rate", value: "28%" },
          ].map((m) => (
            <div key={m.label} className="bg-background rounded-lg border border-border p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Active Sequences */}
        <div className="bg-background rounded-lg border border-border">
          <div className="p-4 md:p-5 border-b border-border">
            <h3 className="text-sm font-semibold">Active Sequences ({activeSequences.length})</h3>
          </div>
          <div className="divide-y divide-border">
            {activeSequences.map((b) => (
              <Link key={b.id} to={`/demo/borrower/${b.id}`} className="flex items-center justify-between px-4 md:px-5 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-foreground/10 text-foreground text-xs font-bold flex items-center justify-center shrink-0">
                    {b.firstName[0]}{b.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{b.firstName} {b.lastName}</p>
                    <p className="text-xs text-muted-foreground">{b.leadSource} · Step 3/6</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden sm:block"><LeadTempBadge temp={b.leadTemp} /></span>
                  <span className="text-xs text-foreground font-bold uppercase">Active</span>
                </div>
              </Link>
            ))}
            {activeSequences.length === 0 && (
              <p className="p-5 text-sm text-muted-foreground text-center">No active sequences</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
