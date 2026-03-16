import React from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import type { Borrower } from "../data/mockData";
import { LeadTempBadge } from "./LeadTempBadge";
import { VerificationShield } from "./VerificationShield";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const BorrowerCard = ({ borrower }: { borrower: Borrower }) => {
  const name = borrower.coFirstName
    ? `${borrower.firstName} & ${borrower.coFirstName} ${borrower.lastName}`
    : `${borrower.firstName} ${borrower.lastName}`;

  return (
    <Link
      to={`/demo/borrower/${borrower.id}`}
      className="block bg-background rounded-lg border border-border p-2.5 hover:border-foreground/30 transition-colors group"
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
