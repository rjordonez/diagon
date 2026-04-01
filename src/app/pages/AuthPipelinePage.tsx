import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowUpDown, Filter, ChevronDown, X, Send, Shield, Trash2, MessageCircle } from "lucide-react";
import { useBorrowers } from "../hooks/useSupabaseData";
import { supabase } from "@/lib/supabase";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const STAGE_LABELS: Record<string, string> = {
  "new-lead": "New Lead", contacted: "Contacted", "app-sent": "App Sent", "app-in-progress": "In Progress",
  "app-submitted": "Submitted", "in-review": "In Review", "conditionally-approved": "Cond. Approved",
  "clear-to-close": "Clear to Close", closed: "Closed", "on-hold": "On Hold", dead: "Dead",
};

const TEMP_COLORS: Record<string, string> = { hot: "#ef4444", warm: "#f59e0b", cold: "#3b82f6" };

type SortField = "name" | "email" | "loanAmount" | "stage" | "leadTemp" | "leadScore" | "createdAt";

const COLUMNS: { key: SortField; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "loanAmount", label: "Loan Amount" },
  { key: "stage", label: "Stage" },
  { key: "leadTemp", label: "Temp" },
  { key: "leadScore", label: "Score" },
  { key: "createdAt", label: "Created" },
];

export const AuthPipelinePage = () => {
  const { data: borrowers = [], isLoading } = useBorrowers();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (f: SortField) => { if (sortField === f) setSortAsc(!sortAsc); else { setSortField(f); setSortAsc(true); } };

  const sorted = [...borrowers].sort((a, b) => {
    let c = 0;
    switch (sortField) {
      case "name": c = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`); break;
      case "email": c = a.email.localeCompare(b.email); break;
      case "loanAmount": c = a.loanAmount - b.loanAmount; break;
      case "stage": c = a.stage.localeCompare(b.stage); break;
      case "leadTemp": c = a.leadTemp.localeCompare(b.leadTemp); break;
      case "leadScore": c = a.leadScore - b.leadScore; break;
      case "createdAt": c = a.createdAt.localeCompare(b.createdAt); break;
    }
    return sortAsc ? c : -c;
  });

  const allSel = selected.size === sorted.length && sorted.length > 0;
  const toggleAll = () => setSelected(allSel ? new Set() : new Set(sorted.map((b) => b.id)));
  const toggleOne = (id: string) => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s); };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} lead(s)?`)) return;
    for (const id of selected) await supabase.from("borrowers").delete().eq("id", id);
    setSelected(new Set());
    window.location.reload();
  };

  const th: React.CSSProperties = { padding: "0 16px", height: 44, textAlign: "left", fontWeight: 500, fontSize: 14, color: "#6b7280", whiteSpace: "nowrap", borderBottom: "1px solid #d9d9d9", borderRight: "1px solid #d9d9d9", cursor: "pointer", userSelect: "none", background: "#f5f5f5", position: "sticky", top: 0, zIndex: 1 };
  const td: React.CSSProperties = { padding: "0 16px", height: 48, borderBottom: "1px solid #e5e5e5", borderRight: "1px solid #e5e5e5", fontSize: 15 };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Top bar row 1 — same 56px as sidebar header */}
      <div style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid #d9d9d9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Leads</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/app")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
            <MessageCircle style={{ width: 16, height: 16 }} /> Ask Diagon
          </button>
        </div>
      </div>

      {/* Top bar row 2 */}
      <div style={{ height: 48, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid #d9d9d9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 500, background: "none", border: "1px solid #d9d9d9", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
            All Leads <ChevronDown style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>
          <Plus style={{ width: 14, height: 14 }} /> New Lead
        </button>
      </div>

      {/* Top bar row 3 — sort + filter */}
      <div style={{ height: 40, flexShrink: 0, display: "flex", alignItems: "center", gap: 16, padding: "0 20px", borderBottom: "1px solid #d9d9d9", background: "#fafafa" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280" }}>
          <ArrowUpDown style={{ width: 13, height: 13 }} /> Sorted by <span style={{ fontWeight: 600, color: "#111" }}>{sortField}</span>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
          <Filter style={{ width: 13, height: 13 }} /> Filter
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 40, textAlign: "center", borderRight: "1px solid #f0f0f0" }}>
                <input type="checkbox" checked={allSel} onChange={toggleAll} style={{ cursor: "pointer" }} />
              </th>
              {COLUMNS.map((col) => (
                <th key={col.key} onClick={() => handleSort(col.key)} style={th}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {col.label}
                    <ArrowUpDown style={{ width: 10, height: 10, opacity: sortField === col.key ? 1 : 0.3 }} />
                  </div>
                </th>
              ))}
              <th style={{ ...th, width: 40, textAlign: "center", cursor: "default" }}>
                <Plus style={{ width: 12, height: 12, color: "#9ca3af" }} />
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>Loading...</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No leads yet</td></tr>
            ) : sorted.map((b) => {
              const isSel = selected.has(b.id);
              return (
                <tr key={b.id} onClick={() => navigate(`/app/borrower/${b.id}`)}
                  style={{ cursor: "pointer", background: isSel ? "#eff6ff" : undefined }}
                  onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "#fafafa"; }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = ""; }}>
                  <td style={{ ...td, width: 40, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={isSel} onChange={() => toggleOne(b.id)} style={{ cursor: "pointer" }} />
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#374151", flexShrink: 0 }}>
                        {b.firstName[0]}{b.lastName[0]}
                      </div>
                      <span style={{ fontWeight: 500 }}>{b.firstName} {b.lastName}</span>
                    </div>
                  </td>
                  <td style={{ ...td, color: "#6b7280" }}>{b.email}</td>
                  <td style={{ ...td, fontVariantNumeric: "tabular-nums" }}>{fmt(b.loanAmount)}</td>
                  <td style={td}>
                    <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 6, background: "#f3f4f6", color: "#374151" }}>
                      {STAGE_LABELS[b.stage] || b.stage}
                    </span>
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: TEMP_COLORS[b.leadTemp] || "#6b7280" }}>{b.leadTemp}</span>
                  </td>
                  <td style={{ ...td, textAlign: "center", color: "#6b7280" }}>{b.leadScore}</td>
                  <td style={{ ...td, color: "#9ca3af" }}>{b.createdAt}</td>
                  <td style={{ ...td, width: 40 }} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom — count + add calculation */}
      <div style={{ flexShrink: 0, borderTop: "1px solid #d9d9d9", display: "flex", alignItems: "center", height: 40, fontSize: 13, color: "#9ca3af" }}>
        <div style={{ width: 40, borderRight: "1px solid #e5e5e5", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }} />
        <div style={{ padding: "0 16px", borderRight: "1px solid #e5e5e5", height: "100%", display: "flex", alignItems: "center", fontWeight: 500 }}>
          {sorted.length} count
        </div>
        {COLUMNS.slice(1).map((col) => (
          <div key={col.key} style={{ flex: 1, padding: "0 16px", borderRight: "1px solid #e5e5e5", height: "100%", display: "flex", alignItems: "center", cursor: "pointer" }}>
            + Add calculation
          </div>
        ))}
        <div style={{ width: 40 }} />
      </div>

      {/* Selection bar */}
      {selected.size > 0 && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#18181b", color: "white", borderRadius: 12, padding: "6px 6px 6px 4px", display: "flex", alignItems: "center", gap: 2, boxShadow: "0 4px 24px rgba(0,0,0,0.18)", zIndex: 50 }}>
          <span style={{ fontSize: 12, fontWeight: 700, padding: "0 10px", background: "#3b82f6", borderRadius: 8, lineHeight: "28px", marginRight: 2 }}>{selected.size}</span>
          <span style={{ fontSize: 13, padding: "0 8px", color: "#a1a1aa" }}>selected</span>
          {[
            { icon: Send, label: "Send message", action: () => {} },
            { icon: Shield, label: "Run preapproval", action: () => {} },
            { icon: Trash2, label: "Delete", action: handleDelete },
          ].map(({ icon: Icon, label, action }, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); action(); }}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "white", background: "none", border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: 6 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#27272a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
              <Icon style={{ width: 14, height: 14 }} /> {label}
            </button>
          ))}
          <button onClick={() => setSelected(new Set())}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "#71717a", borderRadius: 6 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#27272a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}
    </div>
  );
};
