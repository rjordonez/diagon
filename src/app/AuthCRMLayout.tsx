import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Kanban, Send, Settings, Bell, Plus, Search, Menu, X, LogOut, Bot, Archive, FileText, MessageSquare, ChevronDown, ChevronRight, Trash2,
} from "lucide-react";
import { cn } from "@/demo/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { AuthAddLeadModal } from "./components/AuthAddLeadModal";

const NAV_ITEMS = [
  { to: "/app", icon: LayoutDashboard, label: "Home", end: true },
  { to: "/app/leads", icon: Kanban, label: "Leads" },
  { to: "/app/templates", icon: FileText, label: "Templates" },
];

export const AuthCRMLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [chats, setChats] = useState<{ id: string; title: string }[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Load chats
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("ai_conversations")
        .select("id, title")
        .eq("user_id", user.id)
        .is("borrower_id", null)
        .order("updated_at", { ascending: false })
        .limit(20);
      if (data) setChats(data.map((c: any) => ({ id: c.id, title: c.title || "New chat" })));
    };
    load();
    // Refresh chats every 5s
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const location = useLocation();
  const isFullBleedPage = location.pathname === "/app" || location.pathname === "/app/ai" || location.pathname === "/app/leads" || location.pathname === "/app/pipeline" || location.pathname.startsWith("/app/borrower/") || location.pathname.startsWith("/app/templates") || location.pathname === "/app/settings";
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  const loadConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ai_conversations")
      .select("id, title")
      .eq("user_id", user.id)
      .is("borrower_id", null)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) setChats(data.map((c: any) => ({ id: c.id, title: c.title || "New chat" })));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMove = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(400, startWidth + (e.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const handleUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
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
          "shrink-0 flex flex-col z-50",
          "fixed inset-y-0 left-0 lg:relative lg:translate-x-0",
          !isResizing && "transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )} style={{ width: sidebarWidth, backgroundColor: "#f0f0f0" }}>
          {/* Border line + resize handle */}
          <div
            onMouseDown={handleResizeStart}
            style={{ position: "absolute", right: -4, top: 0, bottom: 0, width: 8, cursor: "col-resize", zIndex: 10 }}
          >
            <div style={{
              position: "absolute", left: "50%", transform: "translateX(-50%)",
              top: 0, bottom: 0,
              width: isResizing ? 3 : 1,
              backgroundColor: isResizing ? "#3b82f6" : "#e0e0e0",
              transition: "width 0.15s, background-color 0.15s",
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.width = "3px"; (e.target as HTMLElement).style.backgroundColor = "#3b82f6"; }}
            onMouseLeave={(e) => { if (!isResizing) { (e.target as HTMLElement).style.width = "1px"; (e.target as HTMLElement).style.backgroundColor = "#e0e0e0"; } }}
            />
          </div>
          <div style={{ height: 56, flexShrink: 0, borderBottom: "1px solid #d9d9d9", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Diagon</h2>
              <p className="text-xs text-muted-foreground truncate max-w-[160px]">{userName}</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 px-3 py-3 overflow-y-auto">
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={(item as any).end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 h-9 px-3 rounded-lg text-[13px] transition-colors",
                      isActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )
                  }
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Chats section */}
            <div className="mt-4">
              <ChatSectionHeader
                chatsOpen={chatsOpen}
                onToggle={() => setChatsOpen(!chatsOpen)}
                onNewChat={() => {
                  if (!user) return;
                  supabase.from("ai_conversations").insert({ user_id: user.id }).select().single().then(({ data }) => {
                    if (data) { navigate(`/app/ai?c=${data.id}`); loadConversations(); }
                  });
                }}
              />

              {chatsOpen && (
                <div className="mt-1 space-y-0.5">
                  <ChatLinks chats={chats} setSidebarOpen={setSidebarOpen} />
                  {chats.length === 0 && (
                    <p className="px-3 py-1 text-[11px] text-muted-foreground">No chats yet</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom nav */}
          <div style={{ padding: "8px 12px", borderTop: "1px solid #d9d9d9" }}>
            <NavLink
              to="/app/settings"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 h-8 px-3 rounded-lg text-[13px] transition-colors",
                  isActive
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )
              }
            >
              <Settings className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              Settings
            </NavLink>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 h-8 px-3 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors w-full"
            >
              <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              Sign Out
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Bar — hidden on AI/Home page (it has its own) */}
          {!isFullBleedPage && (
            <header style={{ height: 56, flexShrink: 0, borderBottom: "1px solid #d9d9d9", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "white" }}>
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                  <Menu className="h-4 w-4" />
                </button>
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search leads..."
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
          )}

          {/* Page Content */}
          <main className="flex-1 min-h-0 overflow-y-auto bg-background">
            <Outlet key={refreshKey} />
          </main>
        </div>
      </div>

      <AuthAddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} onCreated={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
};

function ChatSectionHeader({ chatsOpen, onToggle, onNewChat }: { chatsOpen: boolean; onToggle: () => void; onNewChat: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-center px-3 py-1.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button onClick={onToggle}
        className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors flex-1">
        {chatsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Chats
      </button>
      <button onClick={(e) => { e.stopPropagation(); onNewChat(); }}
        style={{ opacity: hovered ? 1 : 0 }}
        className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-opacity">
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

// Separate component to use useSearchParams for active chat detection
function ChatLinks({ chats, setSidebarOpen }: { chats: { id: string; title: string }[]; setSidebarOpen: (v: boolean) => void }) {
  const [searchParams] = useSearchParams();
  const activeChat = searchParams.get("c");

  return (
    <>
      {chats.map((chat) => {
        const isActive = activeChat === chat.id;
        return (
          <NavLink
            key={chat.id}
            to={`/app/ai?c=${chat.id}`}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-2.5 h-8 px-3 rounded-lg text-[13px] transition-colors",
              isActive
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            <span className="truncate flex-1">{chat.title}</span>
          </NavLink>
        );
      })}
    </>
  );
}
