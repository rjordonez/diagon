import React from "react";
import { cn } from "@/demo/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
}

export const PhoneInput = ({ value, onChange, placeholder = "(XXX) XXX-XXXX", error }: PhoneInputProps) => {
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    if (digits.length === 0) return "";
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatPhone(e.target.value));
  };

  return (
    <input
      type="tel"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={cn("form-input", error && "form-input-error")}
    />
  );
};
