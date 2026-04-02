import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { User, Bell, ChevronRight } from "lucide-react";

export const AuthSettingsPage = () => {
  const { user } = useAuth();
  const fullName = user?.user_metadata?.full_name || "";
  const nameParts = fullName.split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [activeSection, setActiveSection] = useState("profile");

  const [notifications, setNotifications] = useState({
    docUploaded: true,
    aiFlag: true,
    stlReply: true,
    stageChanged: true,
    campaignStatus: true,
  });


  const inputStyle: React.CSSProperties = {
    width: "100%", height: 36, borderRadius: 8, border: "1px solid #e5e7eb",
    padding: "0 12px", fontSize: 13, color: "#111", outline: "none",
    background: "white", fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 6, display: "block",
  };

  const sectionBtn = (id: string, label: string, icon: typeof User) => {
    const Icon = icon;
    const active = activeSection === id;
    return (
      <button
        key={id}
        onClick={() => setActiveSection(id)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "10px 12px", borderRadius: 8, border: "none",
          background: active ? "#f3f4f6" : "transparent",
          cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400,
          color: active ? "#111" : "#6b7280", fontFamily: "inherit",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f9fafb"; }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
      >
        <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
        <ChevronRight style={{ width: 14, height: 14, opacity: active ? 1 : 0.3 }} />
      </button>
    );
  };

  const toggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSwitch = (checked: boolean, onChange: () => void) => (
    <button
      onClick={onChange}
      style={{
        width: 36, height: 20, borderRadius: 10, padding: 2,
        background: checked ? "#111" : "#e5e7eb",
        border: "none", cursor: "pointer", transition: "background 0.2s",
        display: "flex", alignItems: "center",
        justifyContent: checked ? "flex-end" : "flex-start",
      }}
    >
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", transition: "all 0.2s" }} />
    </button>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{
        height: 56, flexShrink: 0, display: "flex", alignItems: "center",
        padding: "0 24px", borderBottom: "1px solid #e5e7eb", background: "white",
      }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Settings</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", background: "#fafafa" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 24px 48px", display: "flex", gap: 24 }}>
          {/* Left nav */}
          <div style={{ width: 200, flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sectionBtn("profile", "Profile", User)}
              {sectionBtn("notifications", "Notifications", Bell)}
            </div>
          </div>

          {/* Right content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {activeSection === "profile" && (
              <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111", margin: "0 0 20px" }}>Profile</h3>

                {/* Avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%", background: "#f3f4f6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 700, color: "#374151",
                  }}>
                    {firstName[0] || ""}{lastName[0] || ""}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{firstName} {lastName}</p>
                    <p style={{ fontSize: 12, color: "#9ca3af" }}>{user?.email}</p>
                  </div>
                </div>

                {/* Form */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>First Name</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#111")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")} />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#111")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Email</label>
                    <input value={user?.email || ""} disabled style={{ ...inputStyle, background: "#f9fafb", color: "#9ca3af", cursor: "not-allowed" }} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                  <button style={{
                    height: 36, padding: "0 20px", borderRadius: 8,
                    background: "#111", color: "white", border: "none",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}>
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111", margin: "0 0 20px" }}>Notifications</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {([
                    { key: "docUploaded" as const, label: "New document uploaded", desc: "When a borrower uploads a new document" },
                    { key: "aiFlag" as const, label: "AI flag raised", desc: "When AI verification finds an issue" },
                    { key: "stlReply" as const, label: "Diagon reply received", desc: "When a borrower replies to a Diagon message" },
                    { key: "stageChanged" as const, label: "Stage changed", desc: "When a lead moves to a new pipeline stage" },
                    { key: "campaignStatus" as const, label: "Campaign status", desc: "When a marketing campaign status changes" },
                  ]).map((item, i, arr) => (
                    <div key={item.key} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none",
                    }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{item.label}</p>
                        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{item.desc}</p>
                      </div>
                      {toggleSwitch(notifications[item.key], () => toggle(item.key))}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
