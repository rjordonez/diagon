interface Props {
  loanAmount: number;
}

function calcMonthlyPayment(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const SCENARIOS = [
  { label: "30-Year Fixed", rate: 6.75, term: 30, apr: 6.85, closingPct: 2.5, recommended: true },
  { label: "15-Year Fixed", rate: 6.00, term: 15, apr: 6.15, closingPct: 2.5 },
  { label: "7/1 ARM", rate: 6.25, term: 30, apr: 6.45, closingPct: 2.0 },
  { label: "30-Year Fixed (Points)", rate: 6.25, term: 30, apr: 6.50, closingPct: 3.5 },
];

export const RateSheetQuote = ({ loanAmount }: Props) => {
  if (!loanAmount || loanAmount <= 0) return null;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>Your Rate Options</h3>
        <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Based on a loan amount of {fmt(loanAmount)}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {SCENARIOS.map((s) => {
          const monthly = calcMonthlyPayment(loanAmount, s.rate, s.term);
          const closing = loanAmount * (s.closingPct / 100);
          return (
            <div key={s.label} style={{
              background: "white", borderRadius: 12, padding: 20,
              border: s.recommended ? "2px solid #3b82f6" : "1px solid #e5e7eb",
            }}>
              {s.recommended && (
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#3b82f6", background: "#eff6ff", padding: "2px 8px", borderRadius: 4, display: "inline-block", marginBottom: 10 }}>
                  Recommended
                </span>
              )}
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{s.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#111", marginTop: 6 }}>
                {fmt(monthly)}<span style={{ fontSize: 14, fontWeight: 400, color: "#9ca3af" }}>/mo</span>
              </p>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Rate", value: `${s.rate}%`, bold: true },
                  { label: "APR", value: `${s.apr}%` },
                  { label: "Term", value: `${s.term} years` },
                  { label: "Est. Closing Costs", value: fmt(closing) },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280" }}>
                    <span>{row.label}</span>
                    <span style={{ color: row.bold ? "#111" : "#6b7280", fontWeight: row.bold ? 600 : 400 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 10, color: "#d1d5db", textAlign: "center", marginTop: 20 }}>
        These are estimated rates for illustration purposes only. Actual rates may vary based on credit score, property type, and market conditions.
      </p>
    </div>
  );
};
