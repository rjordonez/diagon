import React from "react";
import { cn } from "@/demo/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: boolean;
  uppercase?: boolean;
}

export const SelectInput = ({ value, onChange, options, placeholder = "Select", error, uppercase }: SelectInputProps) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "form-input appearance-none pr-10",
        error && "form-input-error",
        uppercase && "uppercase tracking-wider text-xs font-bold"
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
  </div>
);
