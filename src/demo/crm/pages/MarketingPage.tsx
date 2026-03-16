import React, { useState } from "react";
import {
  CheckCircle2, XCircle, Clock, AlertCircle, ShieldCheck, Fingerprint, Copy,
  Play, Pause, Plus, ToggleLeft, ToggleRight, ChevronDown, ChevronRight,
  Undo2, Bell, Webhook, Settings2, Filter,
} from "lucide-react";
import { cn } from "@/demo/lib/utils";
import {
  MY_PROFILE,
  MY_CAMPAIGNS,
  MY_INCOMING_LEADS,
  type IncomingLead,
} from "../data/mockData";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const STATUS_BADGE: Record<IncomingLead["status"], string> = {
  new: "bg-stage-new text-stage-new-foreground",
  accepted: "bg-stage-approved text-stage-approved-foreground",
  rejected: "bg-stage-dead text-stage-dead-foreground",
  returned: "bg-stage-hold text-stage-hold-foreground",
};

const CAMPAIGN_STATUS_BADGE: Record<string, string> = {
  active: "bg-stage-approved text-stage-approved-foreground",
  paused: "bg-stage-hold text-stage-hold-foreground",
};

type Tab = "leads" | "campaigns" | "analytics" | "settings";

// Computed KPIs
const todayLeads = MY_INCOMING_LEADS.filter((l) => l.timestamp.startsWith("Today"));
const pendingLeads = MY_INCOMING_LEADS.filter((l) => l.status === "new");
const acceptedLeads = MY_INCOMING_LEADS.filter((l) => l.status === "accepted");
const rejectedLeads = MY_INCOMING_LEADS.filter((l) => l.status === "rejected");
const returnedLeads = MY_INCOMING_LEADS.filter((l) => l.status === "returned");
const spendToday = todayLeads.filter((l) => l.status === "accepted").reduce((s, l) => s + l.price, 0);

export const MarketingPage = () => {
  const [tab, setTab] = useState<Tab>("leads");

  return (
    <div className="max-w-[1200px] mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-foreground tracking-tight">Lead Distribution</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your incoming leads from Diagon</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto">
        {([
          { id: "leads" as Tab, label: "Incoming Leads" },
          { id: "campaigns" as Tab, label: "My Campaigns" },
          { id: "analytics" as Tab, label: "Analytics" },
          { id: "settings" as Tab, label: "Settings" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-3 py-2 text-[13px] font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
              tab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "leads" && <IncomingLeadsTab />}
      {tab === "campaigns" && <MyCampaignsTab />}
      {tab === "analytics" && <AnalyticsTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
};

/* ── Incoming Leads Tab ── */
const IncomingLeadsTab = () => {
  const [filter, setFilter] = useState<"all" | IncomingLead["status"]>("all");
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const filtered = filter === "all" ? MY_INCOMING_LEADS : MY_INCOMING_LEADS.filter((l) => l.status === filter);

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Leads Today", value: String(todayLeads.length) },
          { label: "Pending Review", value: String(pendingLeads.length) },
          { label: "Accepted", value: String(acceptedLeads.length) },
          { label: "Spend Today", value: formatCurrency(spendToday) },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-background rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-1.5 overflow-x-auto">
        {([
          { id: "all" as const, label: "All", count: MY_INCOMING_LEADS.length },
          { id: "new" as const, label: "New", count: pendingLeads.length },
          { id: "accepted" as const, label: "Accepted", count: acceptedLeads.length },
          { id: "rejected" as const, label: "Rejected", count: rejectedLeads.length },
          { id: "returned" as const, label: "Returned", count: returnedLeads.length },
        ]).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
              filter === f.id
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
            <span className="ml-1.5 opacity-70">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="bg-background rounded-lg border border-border">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Lead</th>
                <th className="px-5 py-3 font-medium">State</th>
                <th className="px-5 py-3 font-medium">Loan Type</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Validations</th>
                <th className="px-5 py-3 font-medium">Received</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((lead) => (
                <React.Fragment key={lead.id}>
                  <tr
                    className={cn(
                      "hover:bg-muted/50 transition-colors cursor-pointer",
                      lead.status === "new" && "bg-stage-new/5",
                      expandedLead === lead.id && "bg-muted/50"
                    )}
                    onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {expandedLead === lead.id ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-medium text-foreground">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{lead.state}</td>
                    <td className="px-5 py-3 text-muted-foreground">{lead.loanType}</td>
                    <td className="px-5 py-3 text-foreground font-medium">{formatCurrency(lead.loanAmount)}</td>
                    <td className="px-5 py-3 text-foreground font-medium">{formatCurrency(lead.price)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className={cn("h-3.5 w-3.5", lead.trustedFormCert ? "text-stage-approved-foreground" : "text-muted-foreground/30")} />
                        <Fingerprint className={cn("h-3.5 w-3.5", lead.leadIdToken ? "text-stage-approved-foreground" : "text-muted-foreground/30")} />
                        <Copy className={cn("h-3.5 w-3.5", lead.dupeCheck ? "text-stage-approved-foreground" : "text-muted-foreground/30")} />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{lead.timestamp}</td>
                    <td className="px-5 py-3">
                      <span className={cn("px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide", STATUS_BADGE[lead.status])}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <LeadActions lead={lead} />
                    </td>
                  </tr>
                  {/* Expanded detail row */}
                  {expandedLead === lead.id && (
                    <tr>
                      <td colSpan={9} className="px-5 py-4 bg-muted/30 border-t border-border">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="font-bold uppercase tracking-wider text-muted-foreground mb-1">Contact</p>
                            <p className="text-foreground">{lead.email}</p>
                            <p className="text-foreground">{lead.phone}</p>
                            {lead.propertyAddress && <p className="text-muted-foreground mt-1">{lead.propertyAddress}</p>}
                          </div>
                          <div>
                            <p className="font-bold uppercase tracking-wider text-muted-foreground mb-1">TrustedForm</p>
                            <p className="text-foreground font-mono">{lead.trustedFormCert}</p>
                          </div>
                          <div>
                            <p className="font-bold uppercase tracking-wider text-muted-foreground mb-1">LeadID</p>
                            <p className="text-foreground font-mono">{lead.leadIdToken}</p>
                          </div>
                          <div>
                            <p className="font-bold uppercase tracking-wider text-muted-foreground mb-1">Dupe Check</p>
                            <p className={cn("font-medium", lead.dupeCheck ? "text-stage-approved-foreground" : "text-stage-dead-foreground")}>
                              {lead.dupeCheck ? "Passed" : "Failed"}
                            </p>
                            <p className="text-muted-foreground mt-1">Source: {lead.source}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {filtered.map((lead) => (
            <div key={lead.id} className={cn("p-4", lead.status === "new" && "bg-stage-new/5")}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{lead.name}</h3>
                  <p className="text-xs text-muted-foreground">{lead.state} · {lead.loanType} · {formatCurrency(lead.loanAmount)}</p>
                </div>
                <span className={cn("px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide shrink-0", STATUS_BADGE[lead.status])}>
                  {lead.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{lead.timestamp}</span>
                <span className="text-foreground font-medium">{formatCurrency(lead.price)}</span>
              </div>
              <div className="flex items-center gap-1.5 mb-3">
                <ShieldCheck className={cn("h-3 w-3", lead.trustedFormCert ? "text-stage-approved-foreground" : "text-muted-foreground/30")} />
                <Fingerprint className={cn("h-3 w-3", lead.leadIdToken ? "text-stage-approved-foreground" : "text-muted-foreground/30")} />
                <Copy className={cn("h-3 w-3", lead.dupeCheck ? "text-stage-approved-foreground" : "text-muted-foreground/30")} />
              </div>
              <LeadActions lead={lead} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Lead action buttons ── */
const LeadActions = ({ lead }: { lead: IncomingLead }) => {
  if (lead.status === "new") {
    return (
      <div className="flex items-center gap-1.5">
        <button className="h-7 px-2.5 rounded-md bg-foreground text-background text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity">
          <CheckCircle2 className="h-3 w-3" /> Accept
        </button>
        <button className="h-7 px-2.5 rounded-md border border-border text-xs font-medium flex items-center gap-1 hover:bg-muted transition-colors">
          <XCircle className="h-3 w-3" /> Reject
        </button>
      </div>
    );
  }
  if (lead.status === "accepted") {
    return (
      <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
        <Undo2 className="h-3 w-3" /> Return
      </button>
    );
  }
  return null;
};

/* ── My Campaigns Tab ── */
const MyCampaignsTab = () => (
  <div className="space-y-3">
    {MY_CAMPAIGNS.map((campaign) => (
      <div key={campaign.id} className="bg-background rounded-lg border border-border p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{campaign.name}</h3>
              <span className={cn("px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide", CAMPAIGN_STATUS_BADGE[campaign.status])}>
                {campaign.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                {campaign.type === "direct-post" ? "Direct Post" : "Ping/Post"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {campaign.status === "active" ? (
              <button className="h-7 px-2.5 rounded-md border border-border text-xs font-medium flex items-center gap-1 hover:bg-muted transition-colors">
                <Pause className="h-3 w-3" /> Pause
              </button>
            ) : (
              <button className="h-7 px-2.5 rounded-md border border-border text-xs font-medium flex items-center gap-1 hover:bg-muted transition-colors">
                <Play className="h-3 w-3" /> Resume
              </button>
            )}
          </div>
        </div>

        {/* Filter criteria tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {campaign.filters.map((f) => (
            <span key={f} className="px-2 py-0.5 bg-muted rounded text-[11px] font-medium text-muted-foreground">
              {f}
            </span>
          ))}
        </div>

        {/* Campaign stats */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground border-t border-border pt-3">
          <span>{campaign.leadsReceived} leads received</span>
          <span>{formatCurrency(campaign.totalSpend)} total spend</span>
        </div>
      </div>
    ))}

    <button className="w-full h-10 rounded-lg border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-1.5">
      <Plus className="h-4 w-4" /> Request New Campaign
    </button>
  </div>
);

/* ── Analytics Tab ── */
const totalReceived = MY_INCOMING_LEADS.length;
const totalAccepted = acceptedLeads.length;
const totalRejected = rejectedLeads.length;
const totalReturned = returnedLeads.length;
const totalSpend = MY_INCOMING_LEADS.filter((l) => l.status === "accepted").reduce((s, l) => s + l.price, 0);
const avgPerLead = totalAccepted > 0 ? Math.round(totalSpend / totalAccepted) : 0;

// Leads by campaign
const leadsByCampaign = MY_CAMPAIGNS.map((c) => ({
  label: c.name,
  value: MY_INCOMING_LEADS.filter((l) => l.source === c.name).length,
}));
const maxByCampaign = Math.max(...leadsByCampaign.map((c) => c.value), 1);

// Leads by loan type
const loanTypes = [...new Set(MY_INCOMING_LEADS.map((l) => l.loanType))];
const leadsByLoanType = loanTypes.map((lt) => ({
  label: lt,
  value: MY_INCOMING_LEADS.filter((l) => l.loanType === lt).length,
}));
const maxByLoanType = Math.max(...leadsByLoanType.map((c) => c.value), 1);

const AnalyticsTab = () => (
  <div className="space-y-4">
    {/* KPI grid */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {[
        { label: "Total Received", value: String(totalReceived) },
        { label: "Accepted", value: String(totalAccepted) },
        { label: "Rejected", value: String(totalRejected) },
        { label: "Returned", value: String(totalReturned) },
        { label: "Total Spend", value: formatCurrency(totalSpend) },
        { label: "Avg $/Lead", value: formatCurrency(avgPerLead) },
      ].map((kpi) => (
        <div key={kpi.label} className="bg-background rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
        </div>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Leads by Campaign */}
      <div className="bg-background rounded-lg border border-border p-4 md:p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Leads by Campaign</h3>
        <div className="space-y-3">
          {leadsByCampaign.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground truncate mr-2">{item.label}</span>
                <span className="text-foreground font-medium shrink-0">{item.value}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${(item.value / maxByCampaign) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leads by Loan Type */}
      <div className="bg-background rounded-lg border border-border p-4 md:p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Leads by Loan Type</h3>
        <div className="space-y-3">
          {leadsByLoanType.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground truncate mr-2">{item.label}</span>
                <span className="text-foreground font-medium shrink-0">{item.value}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${(item.value / maxByLoanType) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ── Settings Tab ── */
const VALIDATION_SERVICES = [
  { name: "TrustedForm", description: "TCPA compliance certificates — verify consumer consent", enabled: true, icon: ShieldCheck },
  { name: "LeadID", description: "Lead authentication tokens — unique identification for every lead", enabled: true, icon: Fingerprint },
  { name: "Dupe Check", description: "Pre-ping duplicate detection — prevent double-buying leads", enabled: true, icon: Copy },
  { name: "Anura", description: "Ad fraud detection — identify and block fraudulent traffic", enabled: false, icon: ShieldCheck },
  { name: "Xverify", description: "Email and phone verification — validate contact info in real time", enabled: false, icon: CheckCircle2 },
];

const MOCK_WEBHOOKS = [
  { url: "https://crm.sarahchen.io/webhook/new-lead", event: "Lead Accepted", active: true },
  { url: "https://crm.sarahchen.io/webhook/returns", event: "Lead Returned", active: true },
  { url: "https://analytics.sarahchen.io/postback", event: "All Events", active: false },
];

const ALERT_SETTINGS = [
  { label: "Daily cap reached", description: "Get notified when you hit your daily lead limit", enabled: true },
  { label: "New lead received", description: "Real-time alert for every incoming lead", enabled: true },
  { label: "Lead quality drop", description: "Alert when acceptance rate falls below threshold", enabled: false },
];

const SettingsTab = () => (
  <div className="space-y-4">
    {/* My Filters */}
    <div className="bg-background rounded-lg border border-border p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">My Filters</h2>
        </div>
        <button className="h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
          Edit Preferences
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">States</p>
          <div className="flex flex-wrap gap-1">
            {MY_PROFILE.states.map((s) => (
              <span key={s} className="px-2 py-0.5 bg-muted rounded text-xs font-medium text-foreground">{s}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Loan Types</p>
          <div className="flex flex-wrap gap-1">
            {MY_PROFILE.loanTypes.map((lt) => (
              <span key={lt} className="px-2 py-0.5 bg-muted rounded text-xs font-medium text-foreground">{lt}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Amount Range</p>
          <p className="text-foreground">{formatCurrency(MY_PROFILE.amountMin)} – {formatCurrency(MY_PROFILE.amountMax)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Daily Cap</p>
          <p className="text-foreground">{MY_PROFILE.todayReceived} / {MY_PROFILE.dailyCap} today</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Price per Lead</p>
          <p className="text-foreground">{formatCurrency(MY_PROFILE.pricePerLead)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Delivery Method</p>
          <p className="text-foreground">{MY_PROFILE.deliveryMethod === "direct-post" ? "Direct Post" : "Ping/Post"}</p>
        </div>
      </div>
    </div>

    {/* 3rd-Party Validations */}
    <div className="bg-background rounded-lg border border-border">
      <div className="p-4 md:p-5 border-b border-border flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">3rd-Party Validations</h2>
      </div>
      <div className="divide-y divide-border">
        {VALIDATION_SERVICES.map((service) => (
          <div key={service.name} className="flex items-center justify-between px-4 md:px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", service.enabled ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground")}>
                <service.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{service.name}</p>
                <p className="text-xs text-muted-foreground">{service.description}</p>
              </div>
            </div>
            <div className="shrink-0 ml-3">
              {service.enabled ? (
                <ToggleRight className="h-6 w-6 text-foreground" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Webhooks */}
    <div className="bg-background rounded-lg border border-border p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Webhooks</h2>
            <p className="text-xs text-muted-foreground">Push accepted leads to your external CRM</p>
          </div>
        </div>
        <button className="h-8 px-3 rounded-lg bg-foreground text-background text-xs font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <Plus className="h-3.5 w-3.5" /> Add Webhook
        </button>
      </div>
      <div className="space-y-2">
        {MOCK_WEBHOOKS.map((wh) => (
          <div key={wh.url} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-xs font-mono text-foreground truncate">{wh.url}</p>
              <p className="text-[11px] text-muted-foreground">{wh.event}</p>
            </div>
            <div className="shrink-0 ml-3">
              {wh.active ? (
                <ToggleRight className="h-5 w-5 text-foreground" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Alerts */}
    <div className="bg-background rounded-lg border border-border p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">Alerts</h2>
      </div>
      <div className="space-y-3">
        {ALERT_SETTINGS.map((alert) => (
          <div key={alert.label} className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{alert.label}</p>
              <p className="text-xs text-muted-foreground">{alert.description}</p>
            </div>
            <div className="shrink-0 ml-3">
              {alert.enabled ? (
                <ToggleRight className="h-5 w-5 text-foreground" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
