import { useNavigate } from "react-router-dom";
import { FileText, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { useMyApplications } from "../hooks/usePortalData";
import { useAuth } from "@/lib/AuthContext";

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  invited: { label: "Invited", bg: "#f3f4f6", color: "#6b7280" },
  in_progress: { label: "In Progress", bg: "#eff6ff", color: "#3b82f6" },
  submitted: { label: "Submitted", bg: "#f0fdf4", color: "#16a34a" },
  quoted: { label: "Quote Ready", bg: "#faf5ff", color: "#7c3aed" },
};

export const PortalDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: applications = [], isLoading } = useMyApplications();
  const firstName = profile?.fullName?.split(" ")[0] || "there";

  if (isLoading) return <p style={{ fontSize: 14, color: "#9ca3af", textAlign: "center", padding: 48 }}>Loading...</p>;

  if (applications.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 32 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "#f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
          }}>
            <FileText style={{ width: 28, height: 28, color: "#d1d5db" }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111", marginBottom: 6 }}>Welcome to Diagon</h2>
          <p style={{ fontSize: 14, color: "#9ca3af", maxWidth: 340 }}>
            No applications yet. When your loan officer sends you an invitation link, your application will appear here.
          </p>
        </div>
      </div>
    );
  }

  const app = applications[0];
  const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.invited;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px 48px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 4 }}>Welcome back, {firstName}.</h1>
      <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 28 }}>Track your loan application progress</p>

      {/* Status card */}
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Application Status</p>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: status.bg, color: status.color }}>
              {status.label}
            </span>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 10 }}>{app.templateName}</p>
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: "#f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {app.status === "submitted" || app.status === "quoted"
              ? <CheckCircle2 style={{ width: 20, height: 20, color: "#16a34a" }} />
              : <Clock style={{ width: 20, height: 20, color: "#9ca3af" }} />}
          </div>
        </div>
      </div>

      {/* Action items */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 10 }}>Action Items</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(app.status === "invited" || app.status === "in_progress") && (
            <div onClick={() => navigate(`/portal/application/${app.id}`)}
              style={{
                background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText style={{ width: 16, height: 16, color: "#6b7280" }} />
              </div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#111" }}>Continue your application</span>
              <ChevronRight style={{ width: 16, height: 16, color: "#d1d5db" }} />
            </div>
          )}
          {(app.status === "submitted" || app.status === "quoted") && (
            <div onClick={() => navigate(`/portal/quote/${app.id}`)}
              style={{
                background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CheckCircle2 style={{ width: 16, height: 16, color: "#16a34a" }} />
              </div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#111" }}>View your rate quote</span>
              <ChevronRight style={{ width: 16, height: 16, color: "#d1d5db" }} />
            </div>
          )}
        </div>
      </div>

      {/* All Applications */}
      {applications.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 10 }}>All Applications</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {applications.map((a) => {
              const s = STATUS_CONFIG[a.status] || STATUS_CONFIG.invited;
              return (
                <div key={a.id} onClick={() => navigate(`/portal/application/${a.id}`)}
                  style={{
                    background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "12px 18px",
                    display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                >
                  <FileText style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#111" }}>{a.templateName}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: s.bg, color: s.color }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loan Officer card */}
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 12 }}>Your Loan Officer</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", background: "#f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#374151",
          }}>
            {app.loName.charAt(0)}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{app.loName}</p>
            <p style={{ fontSize: 12, color: "#9ca3af" }}>Reach out with any questions about your application</p>
          </div>
        </div>
      </div>
    </div>
  );
};
