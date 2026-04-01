import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, X, Send, Shield, Trash2, MessageCircle,
  Type, Hash, Calendar, DollarSign, Tag,
} from "lucide-react";
import { useBorrowers } from "../hooks/useSupabaseData";
import { supabase } from "@/lib/supabase";
import { LEAD_SOURCES, LOAN_PURPOSES } from "@/demo/crm/data/mockData";
import { AuthAddLeadModal } from "../components/AuthAddLeadModal";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const STAGE_LABELS: Record<string, string> = {
  "new-lead": "New Lead", contacted: "Contacted", "app-sent": "App Sent", "app-in-progress": "In Progress",
  "app-submitted": "Submitted", "in-review": "In Review", "conditionally-approved": "Cond. Approved",
  "clear-to-close": "Clear to Close", closed: "Closed", "on-hold": "On Hold", dead: "Dead",
};

const STAGE_KEYS = Object.keys(STAGE_LABELS);
const TEMP_COLORS: Record<string, string> = { hot: "#ef4444", warm: "#f59e0b", cold: "#3b82f6" };

type SortField = "name" | "email" | "phone" | "loanPurpose" | "loanAmount" | "stage" | "leadTemp" | "leadScore" | "leadSource" | "createdAt";
type ColumnType = "text" | "number" | "currency" | "select" | "date";
type CalcType = "countEmpty" | "countFilled" | "percentEmpty" | "percentFilled";

interface ColumnDef {
  key: SortField;
  label: string;
  type: ColumnType;
  dbField: string;
  options?: string[];
  align?: "left" | "right" | "center";
  width: number;
}

const CHECKBOX_W = 40;
const NAME_W = 200;
const ROW_H = 40;
const FROZEN_LEFT = CHECKBOX_W + NAME_W; // 240px total frozen width

const COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name", type: "text", dbField: "first_name", width: NAME_W },
  { key: "email", label: "Email", type: "text", dbField: "email", width: 200 },
  { key: "phone", label: "Phone", type: "text", dbField: "phone", width: 150 },
  { key: "loanPurpose", label: "Loan Purpose", type: "select", dbField: "loan_purpose", options: LOAN_PURPOSES, width: 150 },
  { key: "loanAmount", label: "Loan Amount", type: "currency", dbField: "loan_amount", align: "right", width: 150 },
  { key: "stage", label: "Stage", type: "select", dbField: "stage", options: STAGE_KEYS, width: 150 },
  { key: "leadTemp", label: "Temp", type: "select", dbField: "lead_temp", options: ["hot", "warm", "cold"], width: 100 },
  { key: "leadScore", label: "Score", type: "number", dbField: "lead_score", align: "center", width: 90 },
  { key: "leadSource", label: "Lead Source", type: "select", dbField: "lead_source", options: LEAD_SOURCES, width: 150 },
  { key: "createdAt", label: "Created", type: "date", dbField: "created_at", width: 140 },
];

const TYPE_ICONS: Record<ColumnType, typeof Type> = { text: Type, number: Hash, currency: DollarSign, select: Tag, date: Calendar };

function getFieldValue(b: Record<string, any>, key: SortField): string {
  switch (key) {
    case "name": return `${b.firstName} ${b.lastName}`;
    case "email": return b.email || "";
    case "phone": return b.phone || "";
    case "loanPurpose": return b.loanPurpose || "";
    case "loanAmount": return String(b.loanAmount || 0);
    case "stage": return b.stage || "";
    case "leadTemp": return b.leadTemp || "";
    case "leadScore": return String(b.leadScore ?? "");
    case "leadSource": return b.leadSource || "";
    case "createdAt": return b.createdAt || "";
    default: return "";
  }
}

// CSS injected once for the sticky shadow — ::after needs position:relative on the td,
// which only works with border-separate (not border-collapse).
const TABLE_CSS = `
  .attio-table { border-collapse: separate; border-spacing: 0; }
  .attio-table .frozen-name {
    position: relative;
  }
  .attio-table .frozen-name::after {
    content: '';
    position: absolute;
    top: 0;
    right: -6px;
    bottom: -1px;
    width: 6px;
    background: linear-gradient(to right, rgba(0,0,0,0.06), transparent);
    pointer-events: none;
  }
`;

export const AuthPipelinePage = () => {
  const { data: borrowers = [], isLoading } = useBorrowers();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowId: string; colKey: SortField } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [calcDropdownOpen, setCalcDropdownOpen] = useState<string | null>(null);
  const [columnCalcs, setColumnCalcs] = useState<Record<string, CalcType>>({});
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!calcDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setCalcDropdownOpen(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calcDropdownOpen]);

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortAsc(!sortAsc);
    else { setSortField(f); setSortAsc(true); }
  };

  const sorted = [...borrowers].sort((a, b) => {
    let c = 0;
    switch (sortField) {
      case "name": c = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`); break;
      case "email": c = a.email.localeCompare(b.email); break;
      case "phone": c = (a.phone || "").localeCompare(b.phone || ""); break;
      case "loanPurpose": c = (a.loanPurpose || "").localeCompare(b.loanPurpose || ""); break;
      case "loanAmount": c = a.loanAmount - b.loanAmount; break;
      case "stage": c = a.stage.localeCompare(b.stage); break;
      case "leadTemp": c = a.leadTemp.localeCompare(b.leadTemp); break;
      case "leadScore": c = a.leadScore - b.leadScore; break;
      case "leadSource": c = (a.leadSource || "").localeCompare(b.leadSource || ""); break;
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
    queryClient.invalidateQueries({ queryKey: ["borrowers"] });
  };

  const startEditing = (rowId: string, colKey: SortField) => {
    const b = borrowers.find((x) => x.id === rowId);
    if (!b) return;
    setEditingCell({ rowId, colKey });
    setEditValue(getFieldValue(b, colKey));
  };
  const cancelEdit = () => setEditingCell(null);
  const saveEdit = async () => {
    if (!editingCell) return;
    const { rowId, colKey } = editingCell;
    const col = COLUMNS.find((c) => c.key === colKey);
    if (!col) { cancelEdit(); return; }
    let payload: Record<string, any> = {};
    if (colKey === "name") {
      const parts = editValue.trim().split(/\s+/);
      payload = { first_name: parts[0] || "", last_name: parts.slice(1).join(" ") || "" };
    } else if (col.type === "currency" || col.type === "number") {
      const num = parseFloat(editValue.replace(/[^0-9.-]/g, ""));
      if (isNaN(num)) { cancelEdit(); return; }
      payload = { [col.dbField]: num };
    } else {
      payload = { [col.dbField]: editValue };
    }
    setEditingCell(null);
    await supabase.from("borrowers").update(payload).eq("id", rowId);
    queryClient.invalidateQueries({ queryKey: ["borrowers"] });
  };

  const computeCalc = (colKey: SortField, calc: CalcType): string => {
    if (sorted.length === 0) return "0";
    let empty = 0;
    for (const b of sorted) { const v = getFieldValue(b, colKey); if (!v || v === "0") empty++; }
    const filled = sorted.length - empty;
    switch (calc) {
      case "countEmpty": return `${empty}`;
      case "countFilled": return `${filled}`;
      case "percentEmpty": return `${Math.round((empty / sorted.length) * 100)}%`;
      case "percentFilled": return `${Math.round((filled / sorted.length) * 100)}%`;
    }
  };

  const CALC_OPTIONS: { id: CalcType; label: string }[] = [
    { id: "countEmpty", label: "Count empty" },
    { id: "countFilled", label: "Count filled" },
    { id: "percentEmpty", label: "Percent empty" },
    { id: "percentFilled", label: "Percent filled" },
  ];

  // Sticky cell style builders — always pass an explicit background color
  const frozenCheckbox = (bg: string): React.CSSProperties => ({
    position: "sticky", left: 0, zIndex: 3, background: bg,
    width: CHECKBOX_W, minWidth: CHECKBOX_W, maxWidth: CHECKBOX_W,
    textAlign: "center", padding: 0,
  });

  const frozenName = (bg: string): React.CSSProperties => ({
    position: "sticky", left: CHECKBOX_W, zIndex: 3, background: bg,
    width: NAME_W, minWidth: NAME_W, maxWidth: NAME_W,
    borderRight: "1px solid #e5e7eb",
    overflow: "hidden", textOverflow: "ellipsis",
  });

  const cell: React.CSSProperties = {
    padding: "0 12px", height: ROW_H,
    borderBottom: "1px solid #f0f0f0", borderRight: "1px solid #f0f0f0",
    fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  };

  const hdrCell: React.CSSProperties = {
    ...cell, height: 36, fontWeight: 500, fontSize: 13, color: "#6b7280",
    borderBottom: "1px solid #e5e7eb", cursor: "pointer", userSelect: "none",
    background: "#f9fafb", position: "sticky", top: 0, zIndex: 2,
  };

  const editorStyle: React.CSSProperties = {
    width: "100%", height: "100%", border: "none", outline: "none",
    fontSize: 14, background: "transparent", padding: 0, margin: 0, fontFamily: "inherit",
  };

  const setRowBg = (tr: HTMLTableRowElement, bg: string) => {
    tr.style.background = bg;
    tr.querySelectorAll<HTMLElement>("[data-frozen]").forEach((el) => { el.style.background = bg; });
  };

  const renderCellValue = (b: any, col: ColumnDef) => {
    const val = getFieldValue(b, col.key);
    switch (col.key) {
      case "name":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", background: "#e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 600, color: "#374151", flexShrink: 0,
            }}>
              {b.firstName[0]}{b.lastName[0]}
            </div>
            <span
              onClick={(e) => { e.stopPropagation(); navigate(`/app/borrower/${b.id}`); }}
              style={{ fontWeight: 500, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis" }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >{b.firstName} {b.lastName}</span>
          </div>
        );
      case "loanAmount":
        return <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(b.loanAmount)}</span>;
      case "stage":
        return (
          <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 6, background: "#f3f4f6", color: "#374151", display: "inline-block" }}>
            {STAGE_LABELS[b.stage] || b.stage}
          </span>
        );
      case "leadTemp":
        return <span style={{ fontSize: 12, fontWeight: 600, textTransform: "capitalize", color: TEMP_COLORS[b.leadTemp] || "#6b7280" }}>{b.leadTemp}</span>;
      case "leadScore":
        return <span style={{ color: "#6b7280" }}>{b.leadScore}</span>;
      case "createdAt":
        return <span style={{ color: "#9ca3af" }}>{val}</span>;
      default:
        return <span style={{ color: "#6b7280" }}>{val}</span>;
    }
  };

  const renderEditor = (b: any, col: ColumnDef) => {
    if (col.type === "select" && col.options) {
      return (
        <select value={editValue}
          onChange={(e) => { setEditValue(e.target.value); setTimeout(() => saveEdit(), 0); }}
          onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
          onBlur={() => saveEdit()}
          ref={(el) => el?.focus()}
          style={{ ...editorStyle, cursor: "pointer" }}
        >
          {col.options.map((opt) => <option key={opt} value={opt}>{col.key === "stage" ? (STAGE_LABELS[opt] || opt) : opt}</option>)}
        </select>
      );
    }
    if (col.type === "date") {
      return (
        <input type="date" value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
          onBlur={() => saveEdit()} ref={(el) => el?.focus()} style={editorStyle} />
      );
    }
    return (
      <input type="text" value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
        onBlur={() => saveEdit()} ref={(el) => el?.focus()}
        style={{ ...editorStyle, textAlign: col.align || "left" }} />
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <style>{TABLE_CSS}</style>

      {/* Header row 1 */}
      <div style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid #e5e7eb" }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Leads</span>
        <button onClick={() => navigate("/app")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
          <MessageCircle style={{ width: 16, height: 16 }} /> Ask Diagon
        </button>
      </div>

      {/* Header row 2 */}
      <div style={{ height: 48, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid #e5e7eb" }}>
        <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 500, background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
          All Leads <ChevronDown style={{ width: 14, height: 14 }} />
        </button>
        <button onClick={() => setAddLeadOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>
          <Plus style={{ width: 14, height: 14 }} /> New Lead
        </button>
      </div>

      {/* Header row 3 - sort */}
      <div style={{ height: 36, flexShrink: 0, display: "flex", alignItems: "center", gap: 16, padding: "0 20px", borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280" }}>
          <ArrowUpDown style={{ width: 13, height: 13 }} />
          Sorted by <span style={{ fontWeight: 600, color: "#111" }}>{COLUMNS.find((c) => c.key === sortField)?.label || sortField}</span>
          <span style={{ color: "#9ca3af" }}>{sortAsc ? "(A-Z)" : "(Z-A)"}</span>
        </div>
      </div>

      {/* Scrollable table area */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <table className="attio-table" style={{ minWidth: "100%" }}>
          <colgroup>
            <col style={{ width: CHECKBOX_W, minWidth: CHECKBOX_W }} />
            {COLUMNS.map((col) => <col key={col.key} style={{ width: col.width, minWidth: col.width }} />)}
          </colgroup>

          {/* Table header */}
          <thead>
            <tr>
              {/* Frozen checkbox header */}
              <th style={{ ...hdrCell, ...frozenCheckbox("#f9fafb"), zIndex: 4, cursor: "default", borderRight: "1px solid #f0f0f0" }}>
                <input type="checkbox" checked={allSel} onChange={toggleAll} style={{ cursor: "pointer" }} />
              </th>
              {/* Frozen name header */}
              <th className="frozen-name" onClick={() => handleSort("name")}
                style={{ ...hdrCell, ...frozenName("#f9fafb"), zIndex: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Type style={{ width: 12, height: 12, color: "#9ca3af", flexShrink: 0 }} />
                  <span>Name</span>
                  {sortField === "name"
                    ? (sortAsc ? <ArrowUp style={{ width: 10, height: 10, flexShrink: 0 }} /> : <ArrowDown style={{ width: 10, height: 10, flexShrink: 0 }} />)
                    : <ArrowUpDown style={{ width: 10, height: 10, opacity: 0.3, flexShrink: 0 }} />}
                </div>
              </th>
              {/* Scrollable column headers */}
              {COLUMNS.slice(1).map((col) => {
                const Icon = TYPE_ICONS[col.type];
                const isActive = sortField === col.key;
                const SortIcon = isActive ? (sortAsc ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th key={col.key} onClick={() => handleSort(col.key)}
                    style={{ ...hdrCell, textAlign: col.align || "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon style={{ width: 12, height: 12, color: "#9ca3af", flexShrink: 0 }} />
                      <span>{col.label}</span>
                      <SortIcon style={{ width: 10, height: 10, opacity: isActive ? 1 : 0.3, flexShrink: 0 }} />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr><td colSpan={COLUMNS.length + 1} style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>Loading...</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={COLUMNS.length + 1} style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No leads yet. Click "New Lead" to add one.</td></tr>
            ) : (
              <>
                {sorted.map((b) => {
                  const isSel = selected.has(b.id);
                  const rowBg = isSel ? "#eff6ff" : "white";
                  return (
                    <tr key={b.id} style={{ background: rowBg }}
                      onMouseEnter={(e) => { if (!isSel) setRowBg(e.currentTarget, "#fafafa"); }}
                      onMouseLeave={(e) => { if (!isSel) setRowBg(e.currentTarget, "white"); }}>
                      {/* Frozen checkbox */}
                      <td data-frozen style={{ ...cell, ...frozenCheckbox(rowBg), borderRight: "1px solid #f0f0f0" }}
                        onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={isSel} onChange={() => toggleOne(b.id)} style={{ cursor: "pointer" }} />
                      </td>
                      {/* Frozen name */}
                      <td data-frozen className="frozen-name"
                        onClick={() => { if (!(editingCell?.rowId === b.id && editingCell?.colKey === "name")) startEditing(b.id, "name"); }}
                        style={{
                          ...cell, ...frozenName(rowBg), cursor: "cell", padding: "0 12px",
                          ...(editingCell?.rowId === b.id && editingCell?.colKey === "name"
                            ? { background: "#eff6ff", boxShadow: "inset 0 0 0 2px #3b82f6", overflow: "visible", padding: "0 4px" }
                            : {}),
                        }}>
                        {editingCell?.rowId === b.id && editingCell?.colKey === "name"
                          ? renderEditor(b, COLUMNS[0])
                          : renderCellValue(b, COLUMNS[0])}
                      </td>
                      {/* Scrollable columns */}
                      {COLUMNS.slice(1).map((col) => {
                        const isEditing = editingCell?.rowId === b.id && editingCell?.colKey === col.key;
                        return (
                          <td key={col.key}
                            onClick={() => { if (!isEditing) startEditing(b.id, col.key); }}
                            style={{
                              ...cell, textAlign: col.align || "left", cursor: "cell",
                              ...(isEditing ? { background: "#eff6ff", boxShadow: "inset 0 0 0 2px #3b82f6", overflow: "visible", padding: "0 4px" } : {}),
                            }}>
                            {isEditing ? renderEditor(b, col) : renderCellValue(b, col)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </>
            )}
          </tbody>

          {/* Footer */}
          <tfoot>
            <tr>
              <td data-frozen style={{ ...cell, borderBottom: "none", ...frozenCheckbox("white"), borderRight: "1px solid #f0f0f0" }} />
              <td data-frozen className="frozen-name" style={{ ...cell, borderBottom: "none", ...frozenName("white"), fontWeight: 500, fontSize: 13, color: "#9ca3af", padding: "0 12px" }}>
                {sorted.length} count
              </td>
              {COLUMNS.slice(1).map((col) => {
                const activeCalc = columnCalcs[col.key];
                const isDropdownOpen = calcDropdownOpen === col.key;
                return (
                  <td key={col.key} style={{ ...cell, borderBottom: "none", fontSize: 13, color: "#9ca3af", overflow: "visible", position: "relative" }}>
                    <div
                      onClick={(e) => { e.stopPropagation(); setCalcDropdownOpen(isDropdownOpen ? null : col.key); }}
                      style={{ cursor: "pointer", display: "flex", alignItems: "center", height: "100%" }}
                    >
                      {activeCalc ? (
                        <span style={{ fontWeight: 500, color: "#6b7280" }}>
                          {computeCalc(col.key, activeCalc)}
                          <span style={{ marginLeft: 4, fontWeight: 400, color: "#9ca3af", fontSize: 11 }}>
                            {CALC_OPTIONS.find((o) => o.id === activeCalc)?.label.toLowerCase()}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: "#c0c0c0" }}>+ Add calculation</span>
                      )}
                    </div>
                    {isDropdownOpen && (
                      <div ref={dropdownRef} style={{
                        position: "absolute", top: "100%", left: 0, marginTop: 4,
                        background: "white", border: "1px solid #e5e7eb", borderRadius: 10,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.10)", minWidth: 180, zIndex: 30, overflow: "hidden",
                      }}>
                        <div style={{ padding: "8px 14px 4px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Aggregations
                        </div>
                        <div style={{ borderTop: "1px solid #f0f0f0", margin: "2px 0" }} />
                        {CALC_OPTIONS.map((opt) => (
                          <div key={opt.id}
                            onClick={(e) => { e.stopPropagation(); setColumnCalcs((prev) => ({ ...prev, [col.key]: opt.id })); setCalcDropdownOpen(null); }}
                            style={{ padding: "7px 14px", fontSize: 14, cursor: "pointer", background: activeCalc === opt.id ? "#f3f4f6" : undefined, fontWeight: activeCalc === opt.id ? 500 : 400 }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = activeCalc === opt.id ? "#f3f4f6" : "")}>
                            {opt.label}
                          </div>
                        ))}
                        {activeCalc && (
                          <>
                            <div style={{ borderTop: "1px solid #f0f0f0", margin: "2px 0" }} />
                            <div
                              onClick={(e) => { e.stopPropagation(); setColumnCalcs((prev) => { const n = { ...prev }; delete n[col.key]; return n; }); setCalcDropdownOpen(null); }}
                              style={{ padding: "7px 14px", fontSize: 14, cursor: "pointer", color: "#ef4444" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                              Remove
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Selection toolbar */}
      {selected.size > 0 && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#18181b", color: "white", borderRadius: 12,
          padding: "6px 6px 6px 4px", display: "flex", alignItems: "center", gap: 2,
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)", zIndex: 50,
        }}>
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

      <AuthAddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} onCreated={() => queryClient.invalidateQueries({ queryKey: ["borrowers"] })} />
    </div>
  );
};
