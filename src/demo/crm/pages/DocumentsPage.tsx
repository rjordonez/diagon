import React from "react";
import { Link } from "react-router-dom";
import { VerificationShield } from "../components/VerificationShield";
import type { VerificationStatus } from "../data/mockData";

interface Doc {
  borrower: string;
  borrowerId: string;
  name: string;
  category: string;
  date: string;
  status: VerificationStatus;
}

const DOCS: Doc[] = [
  { borrower: "Marcus Webb", borrowerId: "1", name: "W-2 Form (2025)", category: "Income", date: "Mar 4", status: "verified" },
  { borrower: "Marcus Webb", borrowerId: "1", name: "Bank Statement — Chase", category: "Assets", date: "Mar 2", status: "review" },
  { borrower: "Derek Fontaine", borrowerId: "2", name: "Pay Stub — Feb 2026", category: "Income", date: "Mar 3", status: "verified" },
  { borrower: "Derek Fontaine", borrowerId: "2", name: "Tax Return 2024", category: "Income", date: "Mar 1", status: "flagged" },
  { borrower: "Priya Nair", borrowerId: "3", name: "HOI Declaration", category: "Property", date: "Feb 28", status: "pending" },
  { borrower: "Priya Nair", borrowerId: "3", name: "Purchase Agreement", category: "Property", date: "Feb 27", status: "verified" },
  { borrower: "Elena Vasquez", borrowerId: "10", name: "Driver's License", category: "Identity", date: "Feb 25", status: "verified" },
];

export const DocumentsPage = () => (
  <div className="max-w-[1200px] mx-auto space-y-4">
    <div>
      <h1 className="text-[22px] font-bold text-foreground tracking-tight">Document Center</h1>
      <p className="text-sm text-muted-foreground mt-0.5">All borrower documents across your pipeline</p>
    </div>

    {/* Mobile card view */}
    <div className="md:hidden space-y-3">
      {DOCS.sort((a, b) => {
        const order = { flagged: 0, review: 1, pending: 2, verified: 3 };
        return order[a.status] - order[b.status];
      }).map((d, i) => (
        <div key={i} className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <VerificationShield status={d.status} flags={d.status === "flagged" ? 1 : 0} />
              <span className="text-sm font-medium">{d.name}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{d.category}</span>
            <Link to={`/demo/borrower/${d.borrowerId}`} className="text-foreground hover:opacity-70">{d.borrower}</Link>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{d.date}</p>
        </div>
      ))}
    </div>

    {/* Desktop table */}
    <div className="hidden md:block bg-background rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border">
              {["Status", "Document", "Category", "Borrower", "Uploaded"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {DOCS.sort((a, b) => {
              const order = { flagged: 0, review: 1, pending: 2, verified: 3 };
              return order[a.status] - order[b.status];
            }).map((d, i) => (
              <tr key={i} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3"><VerificationShield status={d.status} flags={d.status === "flagged" ? 1 : 0} /></td>
                <td className="px-4 py-3 text-sm font-medium">{d.name}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{d.category}</td>
                <td className="px-4 py-3">
                  <Link to={`/demo/borrower/${d.borrowerId}`} className="text-sm text-foreground hover:opacity-70">{d.borrower}</Link>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{d.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
