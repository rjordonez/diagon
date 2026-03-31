const inputClass = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-colors";

interface FieldProps {
  label: string;
  fieldType: string;
  options: string[] | null;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
}

export const FormField = ({ label, fieldType, options, required, value, onChange }: FieldProps) => {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">
        {label}{required && <span className="text-foreground ml-0.5">*</span>}
      </label>

      {fieldType === "text" && (
        <input type="text" className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} />
      )}

      {fieldType === "number" && (
        <input type="number" className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} placeholder="0" />
      )}

      {fieldType === "date" && (
        <input type="date" className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
      )}

      {fieldType === "select" && (
        <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select...</option>
          {(options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )}

      {fieldType === "multiselect" && (
        <div className="space-y-1">
          {(options || []).map((opt) => {
            const selected = (value || "").split(",").filter(Boolean);
            const isChecked = selected.includes(opt);
            return (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isChecked} className="rounded"
                  onChange={() => {
                    const next = isChecked ? selected.filter((s) => s !== opt) : [...selected, opt];
                    onChange(next.join(","));
                  }} />
                {opt}
              </label>
            );
          })}
        </div>
      )}

      {fieldType === "boolean" && (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name={label} checked={value === "yes"} onChange={() => onChange("yes")} /> Yes
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name={label} checked={value === "no"} onChange={() => onChange("no")} /> No
          </label>
        </div>
      )}

      {fieldType === "file" && (
        <input type="file" className="text-sm" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file.name);
        }} />
      )}
    </div>
  );
};
