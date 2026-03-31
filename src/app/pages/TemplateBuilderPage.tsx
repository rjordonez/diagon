import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus, X, ChevronDown, ChevronRight, Save, HelpCircle, Pencil } from "lucide-react";
import { cn } from "@/demo/lib/utils";
import { useTemplateItems, useSaveTemplate } from "../hooks/useTemplateData";
import { supabase } from "@/lib/supabase";

interface BuilderItem {
  name: string;
  description: string;
  required: boolean;
}

interface BuilderSection {
  title: string;
  gateQuestion: string;  // if set, borrower must answer Yes to see this section
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

  // Load existing items — reconstruct gate questions from "question" type items
  useEffect(() => {
    if (!isEditing || existingItems.length === 0) return;
    const sectionMap = new Map<string, { gateQuestion: string; items: BuilderItem[] }>();
    for (const item of existingItems) {
      const sec = item.section || "General";
      if (!sectionMap.has(sec)) sectionMap.set(sec, { gateQuestion: "", items: [] });
      const entry = sectionMap.get(sec)!;
      // If it's a question item, it's the section gate
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

    // Convert sections back to items format — gate questions become question-type items
    const saveSections = sections.map((s) => {
      const items: any[] = [];
      // Add gate question as first item if present
      if (s.gateQuestion.trim()) {
        items.push({
          name: s.gateQuestion.trim(),
          description: "",
          required: true,
          itemType: "question",
          fieldType: "boolean",
          itemKey: `gate_${s.title.toLowerCase().replace(/\s+/g, "_")}`,
          conditionKey: null,
        });
      }
      // Add document items — if section has a gate, mark them conditional
      const gateKey = s.gateQuestion.trim() ? `gate_${s.title.toLowerCase().replace(/\s+/g, "_")}` : null;
      for (const item of s.items) {
        if (!item.name.trim()) continue;
        items.push({
          name: item.name,
          description: item.description,
          required: item.required,
          itemType: "document",
          fieldType: null,
          itemKey: null,
          conditionKey: gateKey,
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

  return (
    <div className="max-w-[640px] mx-auto pb-8">
      <Link to="/app/templates" className="text-xs text-muted-foreground flex items-center gap-1 mb-6 hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Templates
      </Link>

      {/* Title */}
      <div className="mb-6">
        <input className="w-full text-2xl font-bold tracking-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/40"
          placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full text-sm text-muted-foreground bg-transparent border-none outline-none mt-1 placeholder:text-muted-foreground/40"
          placeholder="Add a description..." value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex items-center gap-3 mt-3">
          <input className="h-8 rounded-md border border-border bg-background px-2.5 text-xs w-40 placeholder:text-muted-foreground outline-none focus:border-foreground"
            placeholder="Borrower type" value={borrowerType} onChange={(e) => setBorrowerType(e.target.value)} />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" checked={isAddon} onChange={(e) => setIsAddon(e.target.checked)} className="rounded" /> Profile add-on
          </label>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {sections.map((section, si) => (
          <div key={si} className="border border-border rounded-xl overflow-hidden">
            {/* Section header */}
            <div className="bg-muted/40 px-5 py-3 flex items-center gap-2 group">
              <button onClick={() => up((c) => { c[si].open = !c[si].open; })} className="text-muted-foreground">
                {section.open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <input className="flex-1 text-sm font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 hover:underline hover:decoration-muted-foreground/30 focus:no-underline"
                placeholder="Click to name this section..." value={section.title}
                onChange={(e) => up((c) => { c[si].title = e.target.value; })} />
              {sections.length > 1 && (
                <button onClick={() => up((c) => { c.splice(si, 1); })} className="text-muted-foreground/40 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {section.open && (
              <div className="px-5 py-4 space-y-3">
                {/* Gate question — compact */}
                {section.gateQuestion.trim() ? (
                  <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2">
                    <HelpCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <input
                      className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
                      placeholder="Yes/No question..."
                      value={section.gateQuestion}
                      onChange={(e) => up((c) => { c[si].gateQuestion = e.target.value; })}
                    />
                    <button onClick={() => up((c) => { c[si].gateQuestion = ""; })} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => up((c) => { c[si].gateQuestion = " "; })}
                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" /> Add gate question
                  </button>
                )}

                {/* Document items */}
                <div>

                  <div className="space-y-0 divide-y divide-border/60 border border-border/60 rounded-lg overflow-hidden">
                    {section.items.map((item, ii) => {
                      const key = `${si}-${ii}`;
                      const isActive = activeItem === key;

                      return (
                        <div key={ii}
                          className={cn(
                            "transition-all group/item",
                            isActive ? "bg-muted/50 border-l-2 border-foreground" : "hover:bg-muted/30 border-l-2 border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-3 px-3 py-2.5 cursor-pointer" onClick={() => setActiveItem(isActive ? null : key)}>
                            <span className="text-xs text-muted-foreground/40 w-5 text-right shrink-0">{ii + 1}</span>

                            {isActive ? (
                              <input className="flex-1 text-sm bg-transparent border-none outline-none" autoFocus
                                placeholder="Document name..." value={item.name}
                                onChange={(e) => { e.stopPropagation(); up((c) => { c[si].items[ii].name = e.target.value; }); }}
                                onClick={(e) => e.stopPropagation()} />
                            ) : (
                              <span className={cn("flex-1 text-sm", !item.name && "text-muted-foreground/40 italic")}>
                                {item.name || "Untitled"}
                              </span>
                            )}

                            {!isActive && item.description && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">note</span>
                            )}
                            {!isActive && !item.required && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">optional</span>
                            )}

                            {/* Edit hint on hover */}
                            {!isActive && (
                              <Pencil className="h-3 w-3 text-muted-foreground/0 group-hover/item:text-muted-foreground/50 transition-colors shrink-0" />
                            )}
                          </div>

                          {isActive && (
                            <div className="px-3 pb-3 pt-0 ml-8 space-y-2" onClick={(e) => e.stopPropagation()}>
                              <input className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs placeholder:text-muted-foreground outline-none focus:border-foreground"
                                placeholder="Instructions for the borrower (optional)"
                                value={item.description} onChange={(e) => up((c) => { c[si].items[ii].description = e.target.value; })} />
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <input type="checkbox" checked={item.required} className="rounded"
                                    onChange={(e) => up((c) => { c[si].items[ii].required = e.target.checked; })} /> Required
                                </label>
                                <button onClick={() => up((c) => { c[si].items.splice(ii, 1); if (c[si].items.length === 0) c[si].items.push({ name: "", description: "", required: true }); })}
                                  className="text-xs text-muted-foreground hover:text-foreground">Remove</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={() => { up((c) => { c[si].items.push({ name: "", description: "", required: true }); }); setActiveItem(`${si}-${section.items.length}`); }}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-2 px-1 py-1">
                    <Plus className="h-3 w-3" /> Add document
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        <button onClick={() => up((c) => { c.push({ title: "", gateQuestion: "", open: true, items: [{ name: "", description: "", required: true }] }); })}
          className="w-full h-11 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-1.5">
          <Plus className="h-4 w-4" /> Add section
        </button>
      </div>

      {/* Save bar */}
      <div className="flex justify-end gap-3 mt-16 mb-4">
        <Link to="/app/templates" className="h-10 px-5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center">Cancel</Link>
        <button onClick={handleSave} disabled={!name.trim() || saveTemplate.isPending}
          className="h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-1.5">
          <Save className="h-3.5 w-3.5" /> {saveTemplate.isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};
