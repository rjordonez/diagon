import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowUp, Square, Plus, Clock, Trash2, Copy, ThumbsUp, ThumbsDown, RefreshCw, Loader2, Home, HelpCircle, Star, Zap, ChevronRight, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useBorrowers } from "../hooks/useSupabaseData";
import { getAuthToken } from "../hooks/useAIData";

interface ChatMessage { id: string; role: "user" | "assistant"; content: string; }

// Inject shimmer CSS once
if (typeof document !== "undefined" && !document.getElementById("shimmer-style")) {
  const style = document.createElement("style");
  style.id = "shimmer-style";
  style.textContent = `
    .analyzing-shimmer {
      font-size: 14px;
      font-weight: 500;
      background: linear-gradient(90deg, #9ca3af 0%, #d1d5db 50%, #9ca3af 100%);
      background-size: 200% 100%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 1.5s ease-in-out infinite;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}

function getGreeting(name: string) {
  const h = new Date().getHours();
  return `Good ${h < 12 ? "morning" : h < 18 ? "afternoon" : "evening"}, ${name}.`;
}

// ── Textarea with send button inside ──
function ChatInput({ value, onChange, onSend, onStop, isLoading, rows = 3 }: {
  value: string; onChange: (v: string) => void; onSend: () => void; onStop?: () => void; isLoading: boolean; rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 200) + "px"; }
  }, [value]);

  return (
    <div style={{ position: "relative", borderRadius: 24, border: "1px solid #d4d6db", overflow: "hidden", background: "white" }}>
      <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
        placeholder="Ask anything..." rows={rows} disabled={isLoading}
        style={{ width: "100%", resize: "none", border: "none", outline: "none", padding: "16px 20px 48px 20px", fontSize: 15, lineHeight: 1.6, background: "transparent" }}
      />
      <div style={{ position: "absolute", bottom: 12, right: 16, display: "flex", alignItems: "center", gap: 8 }}>
        {isLoading ? (
          <button onClick={onStop}
            style={{ width: 32, height: 32, borderRadius: 10, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
            <Square style={{ width: 14, height: 14 }} />
          </button>
        ) : (
          <button onClick={onSend} disabled={!value.trim()}
            style={{ width: 32, height: 32, borderRadius: 10, background: value.trim() ? "#818cf8" : "#e0e2e7", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: value.trim() ? "pointer" : "default" }}>
            <ArrowUp style={{ width: 16, height: 16, color: "white" }} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main ──
export const AIAgentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const convIdFromUrl = searchParams.get("c");

  const [conversationId, setConversationId] = useState<string | null>(convIdFromUrl);
  const [conversationTitle, setConversationTitle] = useState("");
  const [recentChat, setRecentChat] = useState<{ id: string; title: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  const skipReloadRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    // Skip reload if we just sent a message and navigated (messages already in state)
    if (skipReloadRef.current && convIdFromUrl && messages.length > 0) {
      skipReloadRef.current = false;
      setInitialLoading(false);
      return;
    }

    const init = async () => {
      setInitialLoading(true);
      const { data: recent } = await supabase.from("ai_conversations").select("id, title")
        .eq("user_id", user.id).is("borrower_id", null).order("updated_at", { ascending: false }).limit(1);
      if (recent?.[0]) setRecentChat({ id: recent[0].id, title: recent[0].title || "New chat" });

      if (convIdFromUrl) {
        setConversationId(convIdFromUrl);
        const { data: conv } = await supabase.from("ai_conversations").select("title").eq("id", convIdFromUrl).maybeSingle();
        setConversationTitle(conv?.title || "New chat");
        const { data: msgs } = await supabase.from("ai_messages").select("id, role, content")
          .eq("conversation_id", convIdFromUrl).in("role", ["user", "assistant"]).order("created_at", { ascending: true });
        setMessages(msgs?.map((m: any) => ({ id: m.id, role: m.role, content: m.content })) || []);
      } else { setConversationId(null); setMessages([]); setConversationTitle(""); }
      setInitialLoading(false);
    };
    init();
  }, [user, convIdFromUrl]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleNewChat = async () => {
    if (!user) return;
    const { data } = await supabase.from("ai_conversations").insert({ user_id: user.id }).select().single();
    if (data) navigate(`/app/ai?c=${data.id}`);
  };

  const handleDelete = async () => {
    if (!conversationId) return;
    await supabase.from("ai_messages").delete().eq("conversation_id", conversationId);
    await supabase.from("ai_conversations").delete().eq("id", conversationId);
    navigate("/app");
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    let convId = conversationId;
    if (!convId && user) {
      const { data } = await supabase.from("ai_conversations").insert({ user_id: user.id }).select().single();
      if (data) { convId = data.id; setConversationId(data.id); skipReloadRef.current = true; navigate(`/app/ai?c=${data.id}`, { replace: true }); }
    }
    if (!convId) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    const userText = input.trim();
    setInput("");
    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = await getAuthToken();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: newMsgs.map((m) => ({ id: m.id, role: m.role, parts: [{ type: "text", text: m.content }] })), conversationId: convId }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Request failed");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aText = "";
      const aId = crypto.randomUUID();
      setMessages((p) => [...p, { id: aId, role: "assistant", content: "" }]);
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "))) {
            try { const d = JSON.parse(line.slice(6)); if (d.type === "text") { aText += d.text; setMessages((p) => p.map((m) => m.id === aId ? { ...m, content: aText } : m)); } } catch {}
          }
        }
      }
      if (!conversationTitle || conversationTitle === "New chat") setConversationTitle(userText.slice(0, 60));
      await supabase.from("ai_conversations").update({ title: userText.slice(0, 60), updated_at: new Date().toISOString() }).eq("id", convId);
    } catch (err: any) {
      if (err.name !== "AbortError") setMessages((p) => [...p, { id: crypto.randomUUID(), role: "assistant", content: `Error: ${err.message}` }]);
    } finally { setIsLoading(false); abortRef.current = null; }
  };

  if (initialLoading) return <div style={{ height: "100%" }} />;

  // ── HOME ──
  if (!convIdFromUrl) {
    return <HomeView userName={userName} recentChat={recentChat} input={input} setInput={setInput} handleSend={handleSend} isLoading={isLoading} navigate={navigate} />;
  }

  // ── CHAT ──
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ height: 56, flexShrink: 0, borderBottom: "1px solid #d9d9d9", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conversationTitle || "New chat"}</span>
          <Star style={{ width: 14, height: 14, color: "#d1d5db", flexShrink: 0 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {[
            { icon: Plus, action: handleNewChat },
            { icon: Trash2, action: () => { if (window.confirm("Delete this conversation?")) handleDelete(); } },
          ].map(({ icon: Icon, action }, i) => (
            <button key={i} onClick={action}
              style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", cursor: "pointer", color: "#6b7280" }}>
              <Icon style={{ width: 16, height: 16 }} />
            </button>
          ))}
        </div>
      </div>

      {/* Messages — only this scrolls */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: 32 }}>
              {msg.role === "user" ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: "#18181b", color: "white", borderRadius: 20, padding: "10px 18px", fontSize: 15, maxWidth: "70%" }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "#111" }}>
                    {msg.content || <span className="analyzing-shimmer">Analyzing</span>}
                  </div>
                  {msg.content && (
                    <div style={{ display: "flex", gap: 2, marginTop: 8 }}>
                      {[
                        { icon: Copy, action: () => navigator.clipboard.writeText(msg.content) },
                        { icon: ThumbsUp },
                        { icon: ThumbsDown },
                        { icon: RefreshCw },
                      ].map(({ icon: Icon, action }, i) => (
                        <button key={i} onClick={action}
                          style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", cursor: "pointer", color: "#c0c0c0" }}>
                          <Icon style={{ width: 15, height: 15 }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom input — fixed, does not scroll */}
      <div style={{ flexShrink: 0, padding: "12px 24px 20px", borderTop: "none" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {messages.length > 0 && !isLoading && (
            <div style={{ marginBottom: 8 }}>
              {["Show me borrowers who need follow-up", "Which documents are still pending?"].map((s) => (
                <button key={s} onClick={() => setInput(s)}
                  style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                  <RefreshCw style={{ width: 12, height: 12 }} /> {s}
                </button>
              ))}
            </div>
          )}
          <ChatInput value={input} onChange={setInput} onSend={handleSend} onStop={() => abortRef.current?.abort()} isLoading={isLoading} rows={2} />
        </div>
      </div>
    </div>
  );
};

// ── Home View ──
const STAGE_LABELS: Record<string, string> = {
  "new-lead": "New Lead", contacted: "Contacted", "app-sent": "App Sent", "app-in-progress": "In Progress",
  "app-submitted": "Submitted", "in-review": "In Review", "conditionally-approved": "Cond. Approved",
  "clear-to-close": "Clear to Close", closed: "Closed", "on-hold": "On Hold", dead: "Dead",
};
const TEMP_DOT: Record<string, string> = { hot: "#ef4444", warm: "#f59e0b", cold: "#3b82f6" };

const MOCK_AUTOMATIONS = [
  { id: "a1", label: "Follow up with new leads", time: "Daily, 9:00 AM", active: true },
  { id: "a2", label: "Send doc reminder to stalled apps", time: "Every 3 days", active: true },
  { id: "a3", label: "Re-engage cold leads", time: "Weekly, Monday", active: false },
];

function HomeView({ userName, recentChat, input, setInput, handleSend, isLoading, navigate }: {
  userName: string; recentChat: { id: string; title: string } | null;
  input: string; setInput: (v: string) => void; handleSend: () => void;
  isLoading: boolean; navigate: (path: string) => void;
}) {
  const { data: borrowers = [] } = useBorrowers();
  const recentLeads = borrowers.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ height: 56, flexShrink: 0, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#6b7280" }}>
          <Home style={{ width: 16, height: 16 }} /> Home
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#6b7280" }}>
          <HelpCircle style={{ width: 16, height: 16 }} /> Help
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: "auto", background: "#fafafa" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 48px" }}>
          {/* Greeting */}
          <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 16, color: "#111" }}>{getGreeting(userName)}</h1>

          {recentChat && (
            <button onClick={() => navigate(`/app/ai?c=${recentChat.id}`)}
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#6b7280", background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>
              <Clock style={{ width: 16, height: 16 }} />
              <span>Recent chat · <span style={{ fontWeight: 500, color: "#111" }}>{recentChat.title}</span></span>
            </button>
          )}

          {/* Chat input */}
          <ChatInput value={input} onChange={setInput} onSend={handleSend} isLoading={isLoading} rows={4} />

          {/* Upcoming Automations */}
          <div style={{ marginTop: 36 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111", margin: 0 }}>Upcoming Automations</h2>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>Today, {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              {MOCK_AUTOMATIONS.map((auto, i) => (
                <div key={auto.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  borderBottom: i < MOCK_AUTOMATIONS.length - 1 ? "1px solid #f3f4f6" : "none",
                  cursor: "pointer", transition: "background 0.1s",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: auto.active ? "#22c55e" : "#d1d5db",
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: auto.active ? "#111" : "#9ca3af" }}>{auto.label}</p>
                  </div>
                  <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>{auto.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Leads */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111", margin: 0 }}>Recent Leads</h2>
                <span style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", background: "#f3f4f6", padding: "1px 6px", borderRadius: 4 }}>{borrowers.length}</span>
              </div>
              <button onClick={() => navigate("/app/leads")}
                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#111")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
              >
                View all <ChevronRight style={{ width: 12, height: 12 }} />
              </button>
            </div>
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              {recentLeads.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center" }}>
                  <Users style={{ width: 24, height: 24, color: "#d1d5db", margin: "0 auto 8px" }} />
                  <p style={{ fontSize: 13, color: "#9ca3af" }}>No leads yet</p>
                </div>
              ) : (
                recentLeads.map((b, i) => (
                  <div key={b.id}
                    onClick={() => navigate(`/app/borrower/${b.id}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                      borderBottom: i < recentLeads.length - 1 ? "1px solid #f3f4f6" : "none",
                      cursor: "pointer", transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: TEMP_DOT[b.leadTemp] || "#d1d5db",
                    }} />
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", background: "#f3f4f6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 600, color: "#374151", flexShrink: 0,
                    }}>
                      {b.firstName[0]}{b.lastName[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.firstName} {b.lastName}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 6px", borderRadius: 4, background: "#f3f4f6", color: "#6b7280", flexShrink: 0 }}>
                      {STAGE_LABELS[b.stage] || b.stage}
                    </span>
                    <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>{b.createdAt}</span>
                    <ChevronRight style={{ width: 14, height: 14, color: "#d1d5db", flexShrink: 0 }} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
