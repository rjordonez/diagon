import { useState } from "react";
import { Zap, ChevronRight, Clock, Users, Mail } from "lucide-react";

interface Automation {
  id: string;
  name: string;
  description: string;
  type: "follow-up" | "re-engage" | "email-drip";
  trigger: string;
  schedule: string;
  active: boolean;
  leadsEnrolled: number;
  messagesSent: number;
}

const AUTOMATIONS: Automation[] = [
  {
    id: "1", name: "Follow Up with New Leads", type: "follow-up",
    description: "Automatically reach out to new leads within minutes of them entering your pipeline. Sends an intro text, follows up at 1 hour, 4 hours, and 24 hours if no response.",
    trigger: "Lead enters \"New Lead\" stage",
    schedule: "Immediately, then 1h, 4h, 24h",
    active: true, leadsEnrolled: 12, messagesSent: 47,
  },
  {
    id: "2", name: "Re-engage Old Leads", type: "re-engage",
    description: "Reach back out to leads that have gone cold. Sends a check-in message, then a value-add follow-up at 3 days and 7 days.",
    trigger: "No activity for 14+ days",
    schedule: "Day 1, Day 3, Day 7",
    active: true, leadsEnrolled: 8, messagesSent: 23,
  },
  {
    id: "3", name: "Email Drip — Rate Update", type: "email-drip",
    description: "Weekly email campaign keeping leads informed about rate changes, market updates, and refinance opportunities.",
    trigger: "Lead is in any active stage",
    schedule: "Every Monday, 9:00 AM",
    active: false, leadsEnrolled: 0, messagesSent: 0,
  },
  {
    id: "4", name: "Email Drip — Nurture Sequence", type: "email-drip",
    description: "Long-term nurture email series for leads not yet ready to apply. Educational content about the loan process, sent bi-weekly.",
    trigger: "Lead temp is \"cold\"",
    schedule: "Every other Tuesday, 10:00 AM",
    active: false, leadsEnrolled: 0, messagesSent: 0,
  },
];

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  "follow-up": { label: "Follow-up", color: "#16a34a", bg: "#f0fdf4" },
  "re-engage": { label: "Re-engage", color: "#d97706", bg: "#fffbeb" },
  "email-drip": { label: "Email Drip", color: "#7c3aed", bg: "#f5f3ff" },
};

export const AutomationsPage = () => {
  const [automations, setAutomations] = useState(AUTOMATIONS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleActive = (id: string) => {
    setAutomations((prev) => prev.map((a) => a.id === id ? { ...a, active: !a.active } : a));
  };

  const activeCount = automations.filter((a) => a.active).length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{
        height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", borderBottom: "1px solid #e5e7eb", background: "white",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Automations</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", borderRadius: 4 }}>
            {activeCount} active
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", background: "#fafafa" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 24px 48px" }}>
          {/* Stats bar */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Active Automations", value: String(activeCount), icon: Zap, color: "#16a34a" },
              { label: "Leads Enrolled", value: String(automations.reduce((s, a) => s + a.leadsEnrolled, 0)), icon: Users, color: "#3b82f6" },
              { label: "Messages Sent", value: String(automations.reduce((s, a) => s + a.messagesSent, 0)), icon: Mail, color: "#7c3aed" },
            ].map((stat) => (
              <div key={stat.label} style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <stat.icon style={{ width: 14, height: 14, color: stat.color }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>{stat.label}</span>
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: "#111", margin: 0 }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Automation cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {automations.map((auto) => {
              const typeConf = TYPE_CONFIG[auto.type];
              const isExpanded = expandedId === auto.id;
              return (
                <div key={auto.id} style={{
                  background: "white", borderRadius: 12, border: "1px solid #e5e7eb",
                  overflow: "hidden", transition: "box-shadow 0.15s",
                  boxShadow: isExpanded ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                }}>
                  {/* Card header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : auto.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                      cursor: "pointer", transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                  >
                    {/* Status dot */}
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: auto.active ? "#22c55e" : "#d1d5db",
                    }} />

                    {/* Name + type badge */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{auto.name}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                          background: typeConf.bg, color: typeConf.color, textTransform: "uppercase", letterSpacing: 0.3,
                        }}>
                          {typeConf.label}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>
                      {auto.leadsEnrolled} enrolled
                    </span>

                    {/* Toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleActive(auto.id); }}
                      style={{
                        width: 36, height: 20, borderRadius: 10, padding: 2,
                        background: auto.active ? "#22c55e" : "#e5e7eb",
                        border: "none", cursor: "pointer", transition: "background 0.2s",
                        display: "flex", alignItems: "center",
                        justifyContent: auto.active ? "flex-end" : "flex-start",
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white" }} />
                    </button>

                    <ChevronRight style={{
                      width: 14, height: 14, color: "#d1d5db", flexShrink: 0,
                      transform: isExpanded ? "rotate(90deg)" : "none",
                      transition: "transform 0.15s",
                    }} />
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ padding: "0 20px 16px", borderTop: "1px solid #f3f4f6" }}>
                      <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: "14px 0 16px" }}>
                        {auto.description}
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f9fafb" }}>
                          <p style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Trigger</p>
                          <p style={{ fontSize: 13, color: "#111", fontWeight: 500 }}>{auto.trigger}</p>
                        </div>
                        <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f9fafb" }}>
                          <p style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Schedule</p>
                          <p style={{ fontSize: 13, color: "#111", fontWeight: 500 }}>{auto.schedule}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                        <div style={{ padding: "6px 12px", borderRadius: 6, background: "#f3f4f6", fontSize: 12, color: "#6b7280" }}>
                          <span style={{ fontWeight: 600, color: "#111" }}>{auto.leadsEnrolled}</span> leads enrolled
                        </div>
                        <div style={{ padding: "6px 12px", borderRadius: 6, background: "#f3f4f6", fontSize: 12, color: "#6b7280" }}>
                          <span style={{ fontWeight: 600, color: "#111" }}>{auto.messagesSent}</span> messages sent
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Coming soon notice */}
          <div style={{
            marginTop: 20, padding: "16px 20px", borderRadius: 12,
            border: "1px dashed #d1d5db", background: "white", textAlign: "center",
          }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#9ca3af" }}>
              Custom automation builder coming soon
            </p>
            <p style={{ fontSize: 12, color: "#d1d5db", marginTop: 4 }}>
              Build your own sequences with custom triggers, timing, and message templates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
