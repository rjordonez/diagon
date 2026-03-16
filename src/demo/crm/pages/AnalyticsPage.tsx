import React from "react";
import { MOCK_BORROWERS } from "../data/mockData";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const AnalyticsPage = () => {
  const totalVolume = MOCK_BORROWERS.reduce((s, b) => s + b.loanAmount, 0);
  const avgScore = Math.round(MOCK_BORROWERS.reduce((s, b) => s + b.leadScore, 0) / MOCK_BORROWERS.length);

  const bySource: Record<string, number> = {};
  MOCK_BORROWERS.forEach((b) => { bySource[b.leadSource] = (bySource[b.leadSource] || 0) + 1; });

  const byStage: Record<string, number> = {};
  MOCK_BORROWERS.forEach((b) => { byStage[b.stage] = (byStage[b.stage] || 0) + 1; });

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-foreground tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Pipeline performance and lead insights</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Pipeline", value: formatCurrency(totalVolume) },
          { label: "Total Borrowers", value: String(MOCK_BORROWERS.length) },
          { label: "Avg Lead Score", value: String(avgScore) },
          { label: "Conversion Rate", value: "32%" },
        ].map((m) => (
          <div key={m.label} className="bg-background rounded-lg border border-border p-4 md:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{m.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-background rounded-lg border border-border p-4 md:p-5">
          <h3 className="text-base font-semibold mb-4">Leads by Source</h3>
          <div className="space-y-3">
            {Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between gap-3">
                <span className="text-sm min-w-0 truncate">{source}</span>
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
    </div>
  );
};
