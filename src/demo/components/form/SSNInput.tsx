import React, { useState } from "react";
import { cn } from "@/demo/lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface SSNInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export const SSNInput = ({ value, onChange, error }: SSNInputProps) => {
  const [visible, setVisible] = useState(false);

  const formatSSN = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const maskSSN = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length <= 5) return "•".repeat(digits.length);
    return `•••-••-${digits.slice(5)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatSSN(e.target.value));
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={visible ? value : maskSSN(value)}
        onChange={handleChange}
        placeholder="XXX-XX-XXXX"
        className={cn("form-input pr-10", error && "form-input-error")}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};
