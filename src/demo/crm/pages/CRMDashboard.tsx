import React from "react";
import { MOCK_BORROWERS } from "../data/mockData";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const KPI = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="bg-background rounded-lg border border-border p-3">
    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</p>
    <p className="text-xl font-bold text-foreground tracking-tight">{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

export const CRMDashboard = () => {
  const totalVolume = MOCK_BORROWERS.reduce((s, b) => s + b.loanAmount, 0);
  const hotLeads = MOCK_BORROWERS.filter((b) => b.leadTemp === "hot").length;
  const flagCount = MOCK_BORROWERS.reduce((s, b) => s + b.aiFlags, 0);
  const closedCount = MOCK_BORROWERS.filter((b) => b.stage === "closed" || b.stage === "clear-to-close").length;
  const avgScore = Math.round(MOCK_BORROWERS.reduce((s, b) => s + b.leadScore, 0) / MOCK_BORROWERS.length);

  const byStage: Record<string, number> = {};
  MOCK_BORROWERS.forEach((b) => { byStage[b.stage] = (byStage[b.stage] || 0) + 1; });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Welcome back, Sarah. Here's your pipeline summary.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <KPI label="Volume" value={formatCurrency(totalVolume)} sub={`${MOCK_BORROWERS.length} active`} />
        <KPI label="Hot Leads" value={String(hotLeads)} sub="Ready to move" />
        <KPI label="Avg Lead Score" value={String(avgScore)} />
        <KPI label="Near Close" value={String(closedCount)} sub="Clear to close" />
      </div>

      {/* Pipeline Distribution */}
      <div className="bg-background rounded-lg border border-border p-4 md:p-5">
        <h3 className="text-base font-semibold mb-4">Pipeline Distribution</h3>
        <div className="space-y-3">
          {Object.entries(byStage).map(([stage, count]) => (
            <div key={stage} className="flex items-center justify-between gap-3">
              <span className="text-sm capitalize min-w-0 truncate">{stage.replace(/-/g, " ")}</span>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-20 md:w-32 bg-muted rounded-full h-2">
                  <div className="bg-foreground h-2 rounded-full" style={{ width: `${(count / MOCK_BORROWERS.length) * 100}%` }} />
                </div>
                <span className="text-sm font-medium w-6 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
