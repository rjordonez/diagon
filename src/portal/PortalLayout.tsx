import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, DollarSign, LogOut, Menu, X, Upload, Check, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { CopilotChat } from "./components/CopilotChat";
import { SmartUploadPanel } from "./components/SmartUploadPanel";
import { ExtractionProvider, useExtraction } from "./hooks/useExtractionContext";
import { useMyApplications, useApplication } from "./hooks/usePortalData";
import { usePublicUploadItems } from "@/hooks/usePublicUpload";

const NAV_ITEMS = [
  { to: "/portal", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/portal/application", icon: FileText, label: "My Application" },
  { to: "/portal/quote", icon: DollarSign, label: "Quote" },
];

export const PortalLayout = () => {
  return (
    <ExtractionProvider>
      <PortalLayoutInner />
    </ExtractionProvider>
  );
};

function PortalLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const userName = profile?.fullName || "Borrower";
  const initials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSignOut = async () => { await signOut(); navigate("/portal/login"); };

  // Get application data for smart upload
  const { data: applications = [] } = useMyApplications();
  const app = applications[0];
  const { data: appData } = useApplication(app?.id);
  const uploadLinkId = appData?.upload_links?.id;
  const uploadToken = appData?.upload_links?.token || "";
  const borrowerId = appData?.upload_links?.borrower_id || "";
  const { data: uploadItems = [] } = usePublicUploadItems(uploadLinkId);

  const { uploadedDocs } = useExtraction();

  return (
    <>
      <div style={{ height: "100vh", width: "100vw", display: "flex", overflow: "hidden" }}>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.15)", zIndex: 40 }}
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <nav style={{
          width: 240, flexShrink: 0, background: "#f0f0f0", display: "flex", flexDirection: "column", zIndex: 50,
          position: sidebarOpen ? "fixed" : undefined, inset: sidebarOpen ? "0 auto 0 0" : undefined,
        }}>
          {/* Brand */}
          <div style={{ height: 56, flexShrink: 0, borderBottom: "1px solid #d9d9d9", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>Diagon</h2>
              <p style={{ fontSize: 11, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{userName}</p>
            </div>
            {sidebarOpen && (
              <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: "#6b7280" }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            )}
          </div>

          {/* Nav */}
          <div style={{ flex: 1, padding: 12, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)}
                  style={({ isActive }) => ({
                    display: "flex", alignItems: "center", gap: 10, height: 36,
                    padding: "0 12px", borderRadius: 8, fontSize: 13, fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#111" : "#6b7280", background: isActive ? "rgba(0,0,0,0.06)" : "transparent",
                    textDecoration: "none", transition: "background 0.15s",
                  })}
                >
                  <item.icon style={{ width: 16, height: 16, flexShrink: 0 }} strokeWidth={1.5} />
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Document Checklist */}
            {uploadedDocs.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, padding: "0 12px", marginBottom: 6 }}>
                  Uploaded Documents
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {uploadedDocs.map((doc) => (
                    <div key={doc.id} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 6,
                      fontSize: 12, color: "#6b7280",
                    }}>
                      {doc.status === "uploading" && <Loader2 style={{ width: 12, height: 12, color: "#9ca3af", animation: "spin 1s linear infinite", flexShrink: 0 }} />}
                      {doc.status === "extracting" && <Sparkles style={{ width: 12, height: 12, color: "#3b82f6", flexShrink: 0 }} />}
                      {doc.status === "done" && <Check style={{ width: 12, height: 12, color: "#16a34a", flexShrink: 0 }} />}
                      {doc.status === "error" && <AlertTriangle style={{ width: 12, height: 12, color: "#ef4444", flexShrink: 0 }} />}
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {doc.fileName}
                      </span>
                      {doc.status === "done" && doc.extractedCount > 0 && (
                        <span style={{ fontSize: 10, color: "#16a34a", flexShrink: 0 }}>{doc.extractedCount}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom */}
          <div style={{ padding: "8px 12px", borderTop: "1px solid #d9d9d9" }}>
            <button onClick={handleSignOut}
              style={{
                display: "flex", alignItems: "center", gap: 10, height: 32, width: "100%",
                padding: "0 12px", borderRadius: 8, fontSize: 13, color: "#6b7280",
                background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <LogOut style={{ width: 16, height: 16, flexShrink: 0 }} strokeWidth={1.5} />
              Sign Out
            </button>
          </div>
        </nav>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Top bar */}
          <header style={{
            height: 56, flexShrink: 0, borderBottom: "1px solid #e5e7eb", background: "white",
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px",
            position: "relative",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setSidebarOpen(true)}
                style={{ display: "none", width: 36, height: 36, borderRadius: 8, border: "1px solid #e5e7eb", alignItems: "center", justifyContent: "center", background: "white", cursor: "pointer" }}>
                <Menu style={{ width: 16, height: 16 }} />
              </button>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>Borrower Portal</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Smart Upload button */}
              {uploadToken && (
                <button
                  onClick={() => setUploadPanelOpen(!uploadPanelOpen)}
                  style={{
                    height: 32, padding: "0 12px", borderRadius: 8,
                    background: uploadPanelOpen ? "#eff6ff" : "white",
                    border: "1px solid #e5e7eb", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 12, fontWeight: 500, color: "#3b82f6",
                    fontFamily: "inherit",
                  }}
                >
                  <Upload style={{ width: 14, height: 14 }} />
                  Upload
                </button>
              )}
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: "#f3f4f6",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: "#374151",
              }}>{initials}</div>
            </div>

            {/* Smart Upload Panel */}
            <SmartUploadPanel
              open={uploadPanelOpen}
              onClose={() => setUploadPanelOpen(false)}
              uploadItems={uploadItems.map((i) => ({
                id: i.id,
                templateItemId: i.templateItemId,
                templateItemName: i.templateItemName,
                status: i.status,
              }))}
              borrowerId={borrowerId}
              token={uploadToken}
            />
          </header>

          {/* Page content */}
          <main style={{ flex: 1, minHeight: 0, overflow: "auto", background: "#fafafa" }}>
            <Outlet />
          </main>
        </div>
      </div>

      <CopilotChat />
    </>
  );
}
