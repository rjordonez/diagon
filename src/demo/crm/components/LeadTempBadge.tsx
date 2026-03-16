import React from "react";
import { cn } from "@/demo/lib/utils";
import type { LeadTemp } from "../data/mockData";

const TEMP_STYLES: Record<LeadTemp, string> = {
  hot: "bg-hot/15 text-hot",
  warm: "bg-warm/15 text-warm-foreground",
  cold: "bg-cold/15 text-cold",
};

export const LeadTempBadge = ({ temp }: { temp: LeadTemp }) => (
  <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide", TEMP_STYLES[temp])}>
    {temp}
  </span>
);
