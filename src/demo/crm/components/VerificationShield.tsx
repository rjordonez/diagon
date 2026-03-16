import React from "react";
import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import type { VerificationStatus } from "../data/mockData";

const config: Record<VerificationStatus, { Icon: typeof Shield; className: string }> = {
  verified: { Icon: ShieldCheck, className: "text-foreground" },
  review: { Icon: ShieldAlert, className: "text-muted-foreground" },
  flagged: { Icon: ShieldAlert, className: "text-foreground" },
  pending: { Icon: ShieldQuestion, className: "text-muted-foreground" },
};

export const VerificationShield = ({ status, flags }: { status: VerificationStatus; flags?: number }) => {
  const { Icon, className } = config[status];
  return (
    <span className="relative inline-flex">
      <Icon className={`h-4 w-4 ${className}`} />
      {status === "flagged" && flags && flags > 0 && (
        <span className="absolute -top-1 -right-1.5 h-3.5 w-3.5 rounded-full bg-foreground text-[9px] font-bold text-background flex items-center justify-center">
          {flags}
        </span>
      )}
    </span>
  );
};
