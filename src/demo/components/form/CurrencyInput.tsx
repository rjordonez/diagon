import React, { useState } from "react";
import { cn } from "@/demo/lib/utils";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

export const CurrencyInput = ({ value, onChange, placeholder = "0", error, className }: CurrencyInputProps) => {
  const [focused, setFocused] = useState(false);

  const formatCurrency = (val: string) => {
    const num = val.replace(/[^0-9]/g, "");
    if (!num) return "";
    return Number(num).toLocaleString("en-US");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    onChange(raw);
  };

  const handleBlur = () => {
    setFocused(false);
    if (value) onChange(value);
  };

  return (
    <div className={cn("relative", className)}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[15px]">$</span>
      <input
        type="text"
        value={focused ? value : formatCurrency(value)}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn("form-input pl-7", error && "form-input-error")}
      />
    </div>
  );
};
