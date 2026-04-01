import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, ChevronDown, ChevronRight, Save, HelpCircle, Pencil } from "lucide-react";
import { useTemplateItems, useSaveTemplate } from "../hooks/useTemplateData";
import { supabase } from "@/lib/supabase";

interface BuilderItem {
  name: string;
  description: string;
  required: boolean;
}

interface BuilderSection {
  title: string;
  gateQuestion: string;
  open: boolean;
  items: BuilderItem[];
}

export const TemplateBuilderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [name, setName] = useState("");
  const [borrowerType, setBorrowerType] = useState("");
  const [description, setDescription] = useState("");
  const [isAddon, setIsAddon] = useState(false);
  const [sections, setSections] = useState<BuilderSection[]>([{ title: "Section 1", gateQuestion: "", open: true, items: [{ name: "", description: "", required: true }] }]);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  const saveTemplate = useSaveTemplate();
  const { data: existingItems = [] } = useTemplateItems(id || null);

  useEffect(() => {
    if (!id) return;
    supabase.from("document_templates").select("*").eq("id", id).single().then(({ data }) => {
      if (!data) return;
      setName(data.name); setBorrowerType(data.borrower_type || "");
      setDescription(data.description || ""); setIsAddon(data.is_addon || false);
    });
  }, [id]);

  useEffect(() => {
    if (!isEditing || existingItems.length === 0) return;
    const sectionMap = new Map<string, { gateQuestion: string; items: BuilderItem[] }>();
    for (const item of existingItems) {
      const sec = item.section || "General";
      if (!sectionMap.has(sec)) sectionMap.set(sec, { gateQuestion: "", items: [] });
      const entry = sectionMap.get(sec)!;
      if (item.itemType === "question") {
        entry.gateQuestion = item.name;
      } else {
        entry.items.push({ name: item.name, description: item.description || "", required: item.required });
      }
    }
    setSections(Array.from(sectionMap.entries()).map(([title, data]) => ({
      title, gateQuestion: data.gateQuestion, open: true, items: data.items.length > 0 ? data.items : [{ name: "", description: "", required: true }],
    })));
  }, [existingItems, isEditing]);

  const up = (fn: (s: BuilderSection[]) => void) => { const c = JSON.parse(JSON.stringify(sections)); fn(c); setSections(c); };

  const handleSave = async () => {
    if (!name.trim()) return;
    const saveSections = sections.map((s) => {
      const items: any[] = [];
      if (s.gateQuestion.trim()) {
        items.push({
          name: s.gateQuestion.trim(), description: "", required: true,
          itemType: "question", fieldType: "boolean",
          itemKey: `gate_${s.title.toLowerCase().replace(/\s+/g, "_")}`, conditionKey: null,
        });
      }
      const gateKey = s.gateQuestion.trim() ? `gate_${s.title.toLowerCase().replace(/\s+/g, "_")}` : null;
      for (const item of s.items) {
        if (!item.name.trim()) continue;
        items.push({
          name: item.name, description: item.description, required: item.required,
          itemType: "document", fieldType: null, itemKey: null, conditionKey: gateKey,
        });
      }
      return { title: s.title || "General", items };
    });
    await saveTemplate.mutateAsync({
      id: id || undefined, name: name.trim(), borrowerType: borrowerType.trim(),
      description: description.trim(), isAddon, sections: saveSections,
    });
    navigate("/app/templates");
  };

  const inputBase: React.CSSProperties = {
    width: "100%", height: 32, borderRadius: 6, border: "1px solid #e5e7eb",
    padding: "0 10px", fontSize: 13, color: "#374151", outline: "none",
    background: "white", fontFamily: "inherit",
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{
        height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", borderBottom: "1px solid #e5e7eb", background: "white",
      }}>
        <button
          onClick={() => navigate("/app/templates")}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#111")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} /> Templates
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>Template</span>
          <span style={{ fontSize: 13, color: "#d1d5db" }}>/</span>
          <span style={{ fontSize: 13, color: "#111", fontWeight: 500 }}>{name || "New"}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", background: "#fafafa" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 24px 48px" }}>
          {/* Template metadata */}
          <div style={{ marginBottom: 28 }}>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
              style={{ width: "100%", fontSize: 20, fontWeight: 700, color: "#111", background: "transparent", border: "none", outline: "none", padding: 0, fontFamily: "inherit" }}
            />
            <input
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              style={{ width: "100%", fontSize: 13, color: "#6b7280", background: "transparent", border: "none", outline: "none", padding: 0, marginTop: 6, fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <input
                value={borrowerType} onChange={(e) => setBorrowerType(e.target.value)}
                placeholder="Borrower type"
                style={{ ...inputBase, width: 160 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#111")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", cursor: "pointer" }}>
                <input type="checkbox" checked={isAddon} onChange={(e) => setIsAddon(e.target.checked)} style={{ accentColor: "#111" }} />
                Profile add-on
              </label>
            </div>
          </div>

          {/* Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sections.map((section, si) => (
              <div key={si} style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                {/* Section header */}
                <div
                  style={{ background: "#f9fafb", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: section.open ? "1px solid #f0f0f0" : "none" }}
                  onMouseEnter={(e) => { const btn = e.currentTarget.querySelector<HTMLElement>("[data-del]"); if (btn) btn.style.opacity = "1"; }}
                  onMouseLeave={(e) => { const btn = e.currentTarget.querySelector<HTMLElement>("[data-del]"); if (btn) btn.style.opacity = "0"; }}
                >
                  <button onClick={() => up((c) => { c[si].open = !c[si].open; })} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9ca3af", display: "flex" }}>
                    {section.open ? <ChevronDown style={{ width: 14, height: 14 }} /> : <ChevronRight style={{ width: 14, height: 14 }} />}
                  </button>
                  <input
                    value={section.title}
                    onChange={(e) => up((c) => { c[si].title = e.target.value; })}
                    placeholder="Section name..."
                    style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#111", background: "transparent", border: "none", outline: "none", padding: 0, fontFamily: "inherit" }}
                  />
                  {sections.length > 1 && (
                    <button data-del onClick={() => up((c) => { c.splice(si, 1); })}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#d1d5db", display: "flex", opacity: 0, transition: "opacity 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#d1d5db")}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                </div>

                {section.open && (
                  <div style={{ padding: 16 }}>
                    {/* Gate question */}
                    {section.gateQuestion.trim() ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
                        <HelpCircle style={{ width: 14, height: 14, color: "#3b82f6", flexShrink: 0 }} />
                        <input
                          value={section.gateQuestion}
                          onChange={(e) => up((c) => { c[si].gateQuestion = e.target.value; })}
                          placeholder="Yes/No question..."
                          style={{ flex: 1, fontSize: 13, background: "transparent", border: "none", outline: "none", color: "#1e40af", fontFamily: "inherit" }}
                        />
                        <button onClick={() => up((c) => { c[si].gateQuestion = ""; })} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#93c5fd", display: "flex" }}>
                          <X style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => up((c) => { c[si].gateQuestion = " "; })}
                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", padding: "0 0 10px", fontFamily: "inherit" }}
                      >
                        <HelpCircle style={{ width: 12, height: 12 }} /> Add gate question
                      </button>
                    )}

                    {/* Document items */}
                    <div style={{ border: "1px solid #f0f0f0", borderRadius: 8, overflow: "hidden" }}>
                      {section.items.map((item, ii) => {
                        const key = `${si}-${ii}`;
                        const isActive = activeItem === key;

                        return (
                          <div key={ii} style={{
                            borderBottom: ii < section.items.length - 1 ? "1px solid #f0f0f0" : "none",
                            borderLeft: isActive ? "2px solid #111" : "2px solid transparent",
                            background: isActive ? "#f9fafb" : "white",
                            transition: "background 0.1s",
                          }}
                            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#fafafa"; }}
                            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "white"; }}
                          >
                            <div
                              onClick={() => setActiveItem(isActive ? null : key)}
                              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer" }}
                            >
                              <span style={{ fontSize: 11, color: "#d1d5db", width: 18, textAlign: "right", flexShrink: 0 }}>{ii + 1}</span>
                              {isActive ? (
                                <input
                                  autoFocus
                                  value={item.name}
                                  onChange={(e) => { e.stopPropagation(); up((c) => { c[si].items[ii].name = e.target.value; }); }}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Document name..."
                                  style={{ flex: 1, fontSize: 13, background: "transparent", border: "none", outline: "none", color: "#111", fontFamily: "inherit" }}
                                />
                              ) : (
                                <span style={{ flex: 1, fontSize: 13, color: item.name ? "#111" : "#d1d5db", fontStyle: item.name ? "normal" : "italic" }}>
                                  {item.name || "Untitled"}
                                </span>
                              )}
                              {!isActive && item.description && (
                                <span style={{ fontSize: 10, fontWeight: 500, padding: "1px 5px", borderRadius: 3, background: "#f3f4f6", color: "#9ca3af" }}>note</span>
                              )}
                              {!isActive && !item.required && (
                                <span style={{ fontSize: 10, fontWeight: 500, padding: "1px 5px", borderRadius: 3, background: "#f3f4f6", color: "#9ca3af" }}>optional</span>
                              )}
                              {!isActive && (
                                <Pencil style={{ width: 12, height: 12, color: "#e5e7eb", flexShrink: 0 }} />
                              )}
                            </div>

                            {isActive && (
                              <div onClick={(e) => e.stopPropagation()} style={{ padding: "0 12px 10px", marginLeft: 28 }}>
                                <input
                                  value={item.description}
                                  onChange={(e) => up((c) => { c[si].items[ii].description = e.target.value; })}
                                  placeholder="Instructions for the borrower (optional)"
                                  style={{ ...inputBase, marginBottom: 8 }}
                                  onFocus={(e) => (e.currentTarget.style.borderColor = "#111")}
                                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
                                />
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280", cursor: "pointer" }}>
                                    <input type="checkbox" checked={item.required} onChange={(e) => up((c) => { c[si].items[ii].required = e.target.checked; })} style={{ accentColor: "#111" }} />
                                    Required
                                  </label>
                                  <button
                                    onClick={() => up((c) => { c[si].items.splice(ii, 1); if (c[si].items.length === 0) c[si].items.push({ name: "", description: "", required: true }); })}
                                    style={{ fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => { up((c) => { c[si].items.push({ name: "", description: "", required: true }); }); setActiveItem(`${si}-${section.items.length}`); }}
                      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: "8px 0 0", fontFamily: "inherit" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#111")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
                    >
                      <Plus style={{ width: 12, height: 12 }} /> Add document
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Add section button */}
            <button
              onClick={() => up((c) => { c.push({ title: "", gateQuestion: "", open: true, items: [{ name: "", description: "", required: true }] }); })}
              style={{
                width: "100%", height: 44, borderRadius: 12,
                border: "1px dashed #d1d5db", background: "white",
                fontSize: 13, color: "#9ca3af", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "inherit", transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#9ca3af"; e.currentTarget.style.color = "#6b7280"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#9ca3af"; }}
            >
              <Plus style={{ width: 14, height: 14 }} /> Add section
            </button>
          </div>

          {/* Save bar */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 40 }}>
            <button
              onClick={() => navigate("/app/templates")}
              style={{
                height: 40, padding: "0 20px", borderRadius: 8,
                border: "1px solid #e5e7eb", background: "white",
                fontSize: 13, fontWeight: 500, color: "#374151", cursor: "pointer", fontFamily: "inherit",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saveTemplate.isPending}
              style={{
                height: 40, padding: "0 20px", borderRadius: 8,
                background: "#3b82f6", color: "white", border: "none",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                opacity: !name.trim() || saveTemplate.isPending ? 0.5 : 1,
                fontFamily: "inherit",
              }}
            >
              <Save style={{ width: 14, height: 14 }} /> {saveTemplate.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
