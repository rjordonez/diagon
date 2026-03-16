import React from "react";
import { cn } from "@/demo/lib/utils";
import { STAGE_CONFIG, type PipelineStage } from "../data/mockData";

export const StageBadge = ({ stage }: { stage: PipelineStage }) => {
  const config = STAGE_CONFIG[stage];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide", config.color)}>
      {config.label}
    </span>
  );
};
