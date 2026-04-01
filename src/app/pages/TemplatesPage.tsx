import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Trash2, Edit2, Layers } from "lucide-react";
import { cn } from "@/demo/lib/utils";
import { useTemplates, useDeleteTemplate, useSeedDefaults } from "../hooks/useTemplateData";

export const TemplatesPage = () => {
  const { data: templates = [], isLoading } = useTemplates();
  const deleteTemplate = useDeleteTemplate();
  const seedDefaults = useSeedDefaults();
  const seeded = useRef(false);

  const baseTemplates = templates.filter((t) => !t.isAddon);
  const addonTemplates = templates.filter((t) => t.isAddon);
  const hasDefaults = templates.some((t) => t.isDefault);

  // Auto-seed defaults on first load if none exist
  useEffect(() => {
    if (!isLoading && !hasDefaults && !seeded.current && !seedDefaults.isPending) {
      seeded.current = true;
      seedDefaults.mutate();
    }
  }, [isLoading, hasDefaults]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground">Document checklists and forms for different borrower types</p>
        </div>
        <Link to="/app/templates/new"
          className="h-9 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New Template
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
      ) : templates.length === 0 ? (
        <div className="border border-border rounded-lg p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-semibold mb-1">{seedDefaults.isPending ? "Setting up default templates..." : "No templates yet"}</h3>
          <p className="text-xs text-muted-foreground">{seedDefaults.isPending ? "Loading DSCR documentation templates and borrower profiles..." : "Templates will appear here."}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Base Templates */}
          {baseTemplates.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Base Templates</h2>
              <div className="space-y-2">
                {baseTemplates.map((t) => (
                  <TemplateRow key={t.id} template={t} onDelete={() => { if (confirm(`Delete "${t.name}"?`)) deleteTemplate.mutate(t.id); }} />
                ))}
              </div>
            </div>
          )}

          {/* Add-on Profiles */}
          {addonTemplates.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Borrower Profile Add-ons
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {addonTemplates.map((t) => (
                  <div key={t.id} className="border border-border rounded-lg px-4 py-3 bg-background flex items-start gap-3 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{t.name}</p>
                      {t.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{t.itemCount} item{t.itemCount !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/app/templates/${t.id}/edit`} className="text-muted-foreground hover:text-foreground p-1"><Edit2 className="h-3.5 w-3.5" /></Link>
                      <button onClick={() => { if (confirm(`Delete "${t.name}"?`)) deleteTemplate.mutate(t.id); }} className="text-muted-foreground hover:text-foreground p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function TemplateRow({ template, onDelete }: { template: { id: string; name: string; borrowerType: string | null; description: string | null; itemCount: number; isDefault: boolean }; onDelete: () => void }) {
  return (
    <div className="border border-border rounded-lg px-4 py-3 bg-background flex items-center gap-3 group">
      <div className="h-10 w-10 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0">
        <FileText className="h-5 w-5 text-foreground/60" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{template.name}</p>
          {template.borrowerType && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{template.borrowerType}</span>}
          {template.isDefault && <span className="text-[10px] bg-foreground/10 text-foreground px-1.5 py-0.5 rounded">Default</span>}
        </div>
        {template.description && <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{template.itemCount} items</span>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link to={`/app/templates/${template.id}/edit`} className="text-muted-foreground hover:text-foreground p-1"><Edit2 className="h-3.5 w-3.5" /></Link>
        <button onClick={onDelete} className="text-muted-foreground hover:text-foreground p-1"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}
