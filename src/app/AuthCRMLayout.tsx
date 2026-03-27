import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Kanban, Send, Settings, Bell, Plus, Search, Menu, X, LogOut, Bot, Archive,
} from "lucide-react";
import { cn } from "@/demo/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { AuthAddLeadModal } from "./components/AuthAddLeadModal";

const NAV_ITEMS = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/app/pipeline", icon: Kanban, label: "Pipeline" },
  { to: "/app/marketing", icon: Send, label: "Lead Distribution" },
  { to: "/app/ai", icon: Bot, label: "AI Agent" },
  { to: "/app/store", icon: Archive, label: "Store" },
  { to: "/app/settings", icon: Settings, label: "Settings" },
];

export const AuthCRMLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Left Sidebar */}
        <nav className={cn(
          "w-[220px] shrink-0 bg-background border-r border-border flex flex-col z-50 transition-transform duration-200",
          "fixed inset-y-0 left-0 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">LO CRM</h2>
              <p className="text-[11px] text-muted-foreground truncate max-w-[140px]">{userName}</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 h-9 px-3 rounded-lg text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Sign out */}
          <div className="p-3 border-t border-border">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 h-9 px-3 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign Out
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Bar */}
          <header className="h-14 shrink-0 bg-background border-b border-border flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <Menu className="h-4 w-4" />
              </button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search borrowers..."
                  className="h-9 w-48 md:w-72 pl-9 pr-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAddLeadOpen(true)}
                className="h-9 px-3 md:px-4 rounded-lg bg-foreground text-background text-sm font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Lead</span>
              </button>
              <button className="relative h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
            <Outlet key={refreshKey} />
          </main>
        </div>
      </div>

      <AuthAddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} onCreated={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
};
