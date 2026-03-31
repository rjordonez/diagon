import { cn } from "@/demo/lib/utils";

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
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Your Rate Options</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Based on a loan amount of {fmt(loanAmount)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SCENARIOS.map((s) => {
          const monthly = calcMonthlyPayment(loanAmount, s.rate, s.term);
          const closing = loanAmount * (s.closingPct / 100);
          return (
            <div key={s.label} className={cn(
              "border rounded-lg p-4 space-y-3 transition-colors",
              s.recommended ? "border-foreground bg-foreground/[0.02]" : "border-border"
            )}>
              {s.recommended && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground bg-foreground/10 px-2 py-0.5 rounded">Recommended</span>
              )}
              <div>
                <p className="text-sm font-semibold">{s.label}</p>
                <p className="text-2xl font-bold tracking-tight mt-1">{fmt(monthly)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Rate</span><span className="text-foreground font-medium">{s.rate}%</span></div>
                <div className="flex justify-between"><span>APR</span><span>{s.apr}%</span></div>
                <div className="flex justify-between"><span>Term</span><span>{s.term} years</span></div>
                <div className="flex justify-between"><span>Est. Closing Costs</span><span>{fmt(closing)}</span></div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        These are estimated rates for illustration purposes only. Actual rates may vary based on credit score, property type, and market conditions.
      </p>
    </div>
  );
};
