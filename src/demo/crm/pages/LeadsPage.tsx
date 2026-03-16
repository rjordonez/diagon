import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Download } from "lucide-react";
import { MOCK_BORROWERS } from "../data/mockData";
import { LeadTempBadge } from "../components/LeadTempBadge";
import { StageBadge } from "../components/StageBadge";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const LeadsPage = () => {
  const [filter, setFilter] = useState<"all" | "hot" | "warm" | "cold">("all");
  const filtered = filter === "all" ? MOCK_BORROWERS : MOCK_BORROWERS.filter((b) => b.leadTemp === filter);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">Leads</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{MOCK_BORROWERS.length} total leads</p>
        </div>
        <div className="flex gap-1.5">
          <button className="h-8 px-2.5 rounded-lg border border-border text-xs font-medium flex items-center gap-1.5 hover:bg-muted transition-colors">
            <Upload className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Import</span>
          </button>
          <button className="h-8 px-2.5 rounded-lg border border-border text-xs font-medium flex items-center gap-1.5 hover:bg-muted transition-colors">
            <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Template</span>
          </button>
        </div>
      </div>

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
    </div>
  );
};
