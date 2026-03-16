import React from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField = ({ label, required, error, children, className = "" }: FormFieldProps) => (
  <div className={className}>
    <label className="form-label block mb-1.5">
      {label}
      {required && <span className="form-required">*</span>}
    </label>
    {children}
    {error && <p className="form-error-text">{error}</p>}
  </div>
);
