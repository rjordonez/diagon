import { Link } from "react-router-dom";
import { FileText, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/demo/lib/utils";
import { useMyApplications } from "../hooks/usePortalData";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  invited: { label: "Invited", color: "text-muted-foreground bg-muted", icon: Clock },
  in_progress: { label: "In Progress", color: "text-foreground bg-foreground/10", icon: FileText },
  submitted: { label: "Submitted", color: "text-foreground bg-foreground/10", icon: CheckCircle2 },
  quoted: { label: "Quote Ready", color: "text-foreground bg-foreground text-background", icon: CheckCircle2 },
};

export const PortalDashboard = () => {
  const { data: applications = [], isLoading } = useMyApplications();

  if (isLoading) return <p className="text-sm text-muted-foreground py-12 text-center">Loading...</p>;

  if (applications.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <FileText className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-1">Welcome to Diagon</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          No applications yet. When your loan officer sends you an invitation link, your application will appear here.
        </p>
      </div>
    );
  }

  const app = applications[0]; // primary application
  const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.invited;
  const StatusIcon = status.icon;

  // Action items
  const actions: { label: string; to: string; icon: any; urgent?: boolean }[] = [];
  if (app.status === "invited" || app.status === "in_progress") {
    actions.push({ label: "Continue your application", to: `/portal/application/${app.id}`, icon: FileText });
  }
  if (app.status === "submitted" || app.status === "quoted") {
    actions.push({ label: "View your rate quote", to: `/portal/quote/${app.id}`, icon: CheckCircle2 });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track your loan application progress</p>
      </div>

      {/* Status Card */}
      <div className="border border-border rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Application Status</p>
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-semibold px-2.5 py-1 rounded-md", status.color)}>
                {status.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{app.templateName}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <StatusIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Action Items */}
      {actions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Action Items</h2>
          <div className="space-y-2">
            {actions.map((action, i) => (
              <Link key={i} to={action.to}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-muted/50 transition-colors group">
                <div className="h-9 w-9 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0">
                  <action.icon className="h-4 w-4 text-foreground" />
                </div>
                <span className="text-sm font-medium flex-1">{action.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Your Loan Officer */}
      <div className="border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-3">Your Loan Officer</h2>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-bold">
            {app.loName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium">{app.loName}</p>
            <p className="text-xs text-muted-foreground">Reach out with any questions about your application</p>
          </div>
        </div>
      </div>

      {/* All Applications */}
      {applications.length > 1 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">All Applications</h2>
          <div className="space-y-2">
            {applications.map((a) => {
              const s = STATUS_CONFIG[a.status] || STATUS_CONFIG.invited;
              return (
                <Link key={a.id} to={`/portal/application/${a.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1">{a.templateName}</span>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded", s.color)}>{s.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
