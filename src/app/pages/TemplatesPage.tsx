import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, FileText, Trash2, Edit2, Layers } from "lucide-react";
import { useTemplates, useDeleteTemplate, useSeedDefaults } from "../hooks/useTemplateData";

export const TemplatesPage = () => {
  const { data: templates = [], isLoading } = useTemplates();
  const deleteTemplate = useDeleteTemplate();
  const seedDefaults = useSeedDefaults();
  const navigate = useNavigate();
  const seeded = useRef(false);

  const baseTemplates = templates.filter((t) => !t.isAddon);
  const addonTemplates = templates.filter((t) => t.isAddon);
  const hasDefaults = templates.some((t) => t.isDefault);

  useEffect(() => {
    if (!isLoading && !hasDefaults && !seeded.current && !seedDefaults.isPending) {
      seeded.current = true;
      seedDefaults.mutate();
    }
  }, [isLoading, hasDefaults]);

  const badge = (label: string, bg = "#f3f4f6", color = "#374151") => (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: bg, color, marginLeft: 6 }}>
      {label}
    </span>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{
        height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", borderBottom: "1px solid #e5e7eb", background: "white",
      }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Templates</span>
        <button
          onClick={() => navigate("/app/templates/new")}
          style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600,
            background: "#3b82f6", color: "white", border: "none", borderRadius: 8,
            padding: "8px 18px", cursor: "pointer",
          }}
        >
          <Plus style={{ width: 14, height: 14 }} /> New Template
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", background: "#fafafa" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 24px 48px" }}>
          {isLoading ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#9ca3af" }}>Loading...</p>
            </div>
          ) : templates.length === 0 ? (
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 48, textAlign: "center" }}>
              <FileText style={{ width: 32, height: 32, color: "#d1d5db", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                {seedDefaults.isPending ? "Setting up default templates..." : "No templates yet"}
              </p>
              <p style={{ fontSize: 13, color: "#9ca3af" }}>
                {seedDefaults.isPending ? "Loading DSCR documentation templates and borrower profiles..." : "Click \"New Template\" to create one."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {/* Base Templates */}
              {baseTemplates.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                    Base Templates
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {baseTemplates.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          background: "white", borderRadius: 12, border: "1px solid #e5e7eb",
                          padding: "14px 20px", display: "flex", alignItems: "center", gap: 14,
                          cursor: "pointer", transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#fafafa";
                          e.currentTarget.querySelector<HTMLElement>("[data-actions]")!.style.opacity = "1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "white";
                          e.currentTarget.querySelector<HTMLElement>("[data-actions]")!.style.opacity = "0";
                        }}
                        onClick={() => navigate(`/app/templates/${t.id}/edit`)}
                      >
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, background: "#f3f4f6",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <FileText style={{ width: 18, height: 18, color: "#6b7280" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{t.name}</span>
                            {t.borrowerType && badge(t.borrowerType)}
                            {t.isDefault && badge("Default", "#eef2ff", "#4f46e5")}
                          </div>
                          {t.description && (
                            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</p>
                          )}
                        </div>
                        <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>{t.itemCount} items</span>
                        <div data-actions style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, opacity: 0, transition: "opacity 0.15s" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/app/templates/${t.id}/edit`); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9ca3af", display: "flex" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#111")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
                          >
                            <Edit2 style={{ width: 14, height: 14 }} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${t.name}"?`)) deleteTemplate.mutate(t.id); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9ca3af", display: "flex" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
                          >
                            <Trash2 style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-on Profiles */}
              {addonTemplates.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <Layers style={{ width: 12, height: 12 }} /> Borrower Profile Add-ons
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {addonTemplates.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          background: "white", borderRadius: 12, border: "1px solid #e5e7eb",
                          padding: "14px 16px", cursor: "pointer", transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#fafafa";
                          e.currentTarget.querySelector<HTMLElement>("[data-actions]")!.style.opacity = "1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "white";
                          e.currentTarget.querySelector<HTMLElement>("[data-actions]")!.style.opacity = "0";
                        }}
                        onClick={() => navigate(`/app/templates/${t.id}/edit`)}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{t.name}</p>
                            {t.description && (
                              <p style={{
                                fontSize: 12, color: "#9ca3af", marginTop: 3,
                                overflow: "hidden", textOverflow: "ellipsis",
                                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                              }}>{t.description}</p>
                            )}
                            <p style={{ fontSize: 11, color: "#c0c0c0", marginTop: 6 }}>{t.itemCount} item{t.itemCount !== 1 ? "s" : ""}</p>
                          </div>
                          <div data-actions style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0, opacity: 0, transition: "opacity 0.15s" }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/app/templates/${t.id}/edit`); }}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9ca3af", display: "flex" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#111")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
                            >
                              <Edit2 style={{ width: 13, height: 13 }} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${t.name}"?`)) deleteTemplate.mutate(t.id); }}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9ca3af", display: "flex" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
                            >
                              <Trash2 style={{ width: 13, height: 13 }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
