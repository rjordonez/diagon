import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, FileText, Shield, Copy, Check, ExternalLink } from "lucide-react";
import { PIPELINE_STAGES, STAGE_CONFIG } from "@/demo/crm/data/mockData";
import { useBorrowers } from "../hooks/useSupabaseData";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { BorrowerDocumentsTab } from "../components/BorrowerDocumentsTab";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const TEMP_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  hot: { bg: "#fef2f2", text: "#ef4444", label: "Hot" },
  warm: { bg: "#fffbeb", text: "#d97706", label: "Warm" },
  cold: { bg: "#eff6ff", text: "#3b82f6", label: "Cold" },
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "application", label: "Application" },
  { id: "documents", label: "Documents" },
  { id: "verification", label: "AI Verification" },
];

export const AuthBorrowerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: borrowers = [], isLoading } = useBorrowers();
  const borrower = borrowers.find((b) => b.id === id);
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const saveNotes = async (value: string) => {
    if (!borrower) return;
    setSavingNotes(true);
    await supabase.from("borrowers").update({ notes: value }).eq("id", borrower.id);
    queryClient.invalidateQueries({ queryKey: ["borrowers"] });
    setSavingNotes(false);
  };

  if (isLoading) {
    return (
      <div style={{ padding: 32 }}>
        <button onClick={() => navigate("/app/leads")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Leads
        </button>
        <p style={{ marginTop: 24, color: "#9ca3af", fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  if (!borrower) {
    return (
      <div style={{ padding: 32 }}>
        <button onClick={() => navigate("/app/leads")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Leads
        </button>
        <p style={{ marginTop: 24, color: "#9ca3af", fontSize: 14 }}>Borrower not found.</p>
      </div>
    );
  }

  const name = borrower.coFirstName
    ? `${borrower.firstName} & ${borrower.coFirstName} ${borrower.lastName}`
    : `${borrower.firstName} ${borrower.lastName}`;

  const temp = TEMP_COLORS[borrower.leadTemp] || TEMP_COLORS.warm;
  const currentStageIdx = PIPELINE_STAGES.indexOf(borrower.stage);
  const stageConfig = STAGE_CONFIG[borrower.stage];
  const notesValue = notes ?? borrower.notes;

  const infoRow = (label: string, value: string, copyable?: boolean) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, color: "#111", fontWeight: 500 }}>{value}</span>
        {copyable && (
          <button
            onClick={() => copyToClipboard(value, label)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: copiedField === label ? "#22c55e" : "#9ca3af", display: "flex" }}
          >
            {copiedField === label ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ height: "100%", overflow: "auto", background: "#fafafa" }}>
      {/* Top bar */}
      <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: "1px solid #e5e7eb", background: "white", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => navigate("/app/leads")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#111")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Leads
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>Lead</span>
          <span style={{ fontSize: 13, color: "#d1d5db" }}>/</span>
          <span style={{ fontSize: 13, color: "#111", fontWeight: 500 }}>{borrower.firstName} {borrower.lastName}</span>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 24px 48px" }}>
        {/* Profile header card */}
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            {/* Left: avatar + info */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: "#f3f4f6",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 700, color: "#374151", flexShrink: 0,
              }}>
                {borrower.firstName[0]}{borrower.lastName[0]}
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: 0, lineHeight: 1.3 }}>{name}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  {/* Temp badge */}
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, padding: "2px 8px", borderRadius: 4, background: temp.bg, color: temp.text }}>
                    {temp.label}
                  </span>
                  {/* Stage badge */}
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, padding: "2px 8px", borderRadius: 4, background: "#f3f4f6", color: "#374151" }}>
                    {stageConfig.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6b7280" }}>
                    <Mail style={{ width: 12, height: 12 }} /> {borrower.email}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6b7280" }}>
                    <Phone style={{ width: 12, height: 12 }} /> {borrower.phone}
                  </span>
                  {borrower.propertyAddress && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6b7280" }}>
                      <MapPin style={{ width: 12, height: 12 }} /> {borrower.propertyAddress}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: loan amount */}
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#111", margin: 0, fontVariantNumeric: "tabular-nums" }}>{fmt(borrower.loanAmount)}</p>
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{borrower.loanPurpose}</p>
            </div>
          </div>

          {/* Stage progress bar */}
          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 2 }}>
            {PIPELINE_STAGES.slice(0, 8).map((stage, i) => {
              const isCompleted = i < currentStageIdx;
              const isCurrent = i === currentStageIdx;
              return (
                <React.Fragment key={stage}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                    background: isCompleted || isCurrent ? "#111" : "#e5e7eb",
                    border: isCurrent ? "2px solid #111" : "none",
                    boxShadow: isCurrent ? "0 0 0 3px rgba(0,0,0,0.08)" : "none",
                  }} />
                  {i < 7 && (
                    <div style={{ height: 2, flex: 1, background: isCompleted ? "#111" : "#e5e7eb", borderRadius: 1 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {PIPELINE_STAGES.slice(0, 8).map((stage) => (
              <span key={stage} style={{ fontSize: 9, color: "#9ca3af", textAlign: "center", width: 60 }}>{STAGE_CONFIG[stage].label}</span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e5e7eb", marginBottom: 20 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 16px", fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? "#111" : "#6b7280",
                background: "none", border: "none", cursor: "pointer",
                borderBottom: activeTab === tab.id ? "2px solid #111" : "2px solid transparent",
                marginBottom: -1, transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = "#111"; }}
              onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = "#6b7280"; }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Contact info */}
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: "0 0 4px" }}>Contact Information</h3>
              {infoRow("Email", borrower.email, true)}
              {infoRow("Phone", borrower.phone, true)}
              {infoRow("Lead Source", borrower.leadSource)}
              {infoRow("Created", borrower.createdAt)}
              {borrower.propertyAddress && infoRow("Property", borrower.propertyAddress, true)}
            </div>

            {/* Loan summary */}
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: "0 0 4px" }}>Loan Summary</h3>
              {infoRow("Amount", fmt(borrower.loanAmount))}
              {infoRow("Purpose", borrower.loanPurpose)}
              {infoRow("Lead Score", `${borrower.leadScore} / 100`)}
              {infoRow("Days in Stage", String(borrower.daysInStage))}
              {infoRow("Assigned LO", borrower.assignedLO || "Unassigned")}
            </div>

            {/* Notes - full width */}
            <div style={{ gridColumn: "1 / -1", background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: 0 }}>Notes</h3>
                {savingNotes && <span style={{ fontSize: 11, color: "#9ca3af" }}>Saving...</span>}
              </div>
              <textarea
                value={notesValue || ""}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => { if (notes !== null && notes !== borrower.notes) saveNotes(notes); }}
                placeholder="Add notes about this lead..."
                style={{
                  width: "100%", minHeight: 80, padding: 12, borderRadius: 8,
                  border: "1px solid #e5e7eb", fontSize: 13, color: "#374151",
                  resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.5,
                  background: "#fafafa",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#111")}
                onBlurCapture={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>
          </div>
        )}

        {activeTab === "application" && (
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 40, textAlign: "center" }}>
            <FileText style={{ width: 32, height: 32, color: "#d1d5db", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, color: "#6b7280" }}>Application data will appear once the borrower starts their application.</p>
          </div>
        )}

        {activeTab === "documents" && (
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20 }}>
            <BorrowerDocumentsTab borrower={borrower} />
          </div>
        )}

        {activeTab === "verification" && (
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 40, textAlign: "center" }}>
            <Shield style={{ width: 32, height: 32, color: "#d1d5db", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, color: "#6b7280" }}>AI verification will run once documents are uploaded.</p>
          </div>
        )}
      </div>
    </div>
  );
};
