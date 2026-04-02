import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageSquare, Search, ArrowUp } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAllMessages, type StoreMessage } from "../hooks/useAIData";
import { useBorrowers } from "../hooks/useSupabaseData";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFull(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}

export const MessagingPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: messages = [], isLoading } = useAllMessages();
  const { data: borrowers = [] } = useBorrowers();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  // Build a map of borrowerId → isActiveLead (null = no invite, "pending" = invited, true = confirmed, false = opted out)
  const activeLookup = new Map<string, boolean | null | "pending">();
  for (const b of borrowers) activeLookup.set(b.id, b.isActiveLead);

  const borrowerMap = new Map<string, { name: string; messages: StoreMessage[] }>();
  for (const msg of messages) {
    if (!borrowerMap.has(msg.borrowerId)) {
      borrowerMap.set(msg.borrowerId, { name: msg.borrowerName, messages: [] });
    }
    borrowerMap.get(msg.borrowerId)!.messages.push(msg);
  }
  let borrowerList = Array.from(borrowerMap.entries());
  if (search.trim()) {
    const q = search.toLowerCase();
    borrowerList = borrowerList.filter(([, { name }]) => name.toLowerCase().includes(q));
  }

  const borrowerIdFromUrl = searchParams.get("b");
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string | null>(borrowerIdFromUrl);

  // Auto-select borrower from URL param
  useEffect(() => {
    if (borrowerIdFromUrl) setSelectedBorrowerId(borrowerIdFromUrl);
  }, [borrowerIdFromUrl]);
  const selectedMessages = selectedBorrowerId ? borrowerMap.get(selectedBorrowerId)?.messages || [] : [];
  const selectedName = selectedBorrowerId ? borrowerMap.get(selectedBorrowerId)?.name || "" : "";

  // iMessage-style bubble colors
  const SENT_BG = "#007aff";
  const SENT_TEXT = "#fff";
  const RECV_BG = "#e9e9eb";
  const RECV_TEXT = "#111";

  return (
    <div style={{ height: "100%", display: "flex", overflow: "hidden" }}>
      {/* ── Left: Conversation list ── */}
      <div style={{ width: 340, display: "flex", flexDirection: "column", borderRight: "1px solid #e5e7eb", background: "#f9f9f9" }}>
        {/* Header */}
        <div style={{ padding: "16px 16px 0" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: "0 0 12px" }}>Messages</h2>
          {/* Search */}
          <div style={{ position: "relative", marginBottom: 8 }}>
            <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#9ca3af" }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              style={{
                width: "100%", height: 34, borderRadius: 10, border: "none",
                background: "#e9e9eb", padding: "0 12px 0 32px", fontSize: 14,
                outline: "none", fontFamily: "inherit", color: "#111",
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {isLoading ? (
            <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: 32 }}>Loading...</p>
          ) : borrowerList.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <MessageSquare style={{ width: 28, height: 28, color: "#d1d5db", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 14, color: "#9ca3af" }}>No messages yet</p>
            </div>
          ) : (
            borrowerList.map(([borrowerId, { name, messages: msgs }]) => {
              const lastMsg = msgs[0];
              const isSelected = selectedBorrowerId === borrowerId;
              const initials = getInitials(name).toUpperCase();
              const activeStatus = activeLookup.get(borrowerId); // null = not contacted, true = active, false = opted out
              return (
                <div
                  key={borrowerId}
                  onClick={() => setSelectedBorrowerId(borrowerId)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", cursor: "pointer",
                    background: isSelected ? "#007aff" : "transparent",
                    borderRadius: isSelected ? 10 : 0,
                    margin: isSelected ? "0 8px" : 0,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Avatar + active dot */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: isSelected ? "rgba(255,255,255,0.2)" : "#d1d5db",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700, color: isSelected ? "white" : "#4b5563",
                    }}>
                      {initials}
                    </div>
                    <div style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: 10, height: 10, borderRadius: "50%",
                      background: activeStatus === true || activeStatus === "true" as any ? "#22c55e"
                        : activeStatus === false || activeStatus === "false" as any ? "#ef4444"
                        : activeStatus === "pending" ? "#eab308"
                        : "#d1d5db",
                      border: "2px solid white",
                    }} />
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: isSelected ? "white" : "#111" }}>{name}</span>
                      <span style={{ fontSize: 12, color: isSelected ? "rgba(255,255,255,0.7)" : "#9ca3af", flexShrink: 0 }}>
                        {formatTime(lastMsg.createdAt)}
                      </span>
                    </div>
                    <p style={{
                      fontSize: 13, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      color: isSelected ? "rgba(255,255,255,0.8)" : "#6b7280",
                    }}>
                      {lastMsg.direction === "outbound" ? "You: " : ""}{lastMsg.body}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right: Message thread ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white" }}>
        {!selectedBorrowerId ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <MessageSquare style={{ width: 40, height: 40, color: "#d1d5db", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 16, fontWeight: 500, color: "#9ca3af" }}>Select a conversation</p>
              <p style={{ fontSize: 13, color: "#d1d5db", marginTop: 4 }}>{borrowerList.length} conversation{borrowerList.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div style={{
              padding: "12px 0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              borderBottom: "1px solid #e5e7eb", background: "white",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", background: "#d1d5db",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#4b5563", margin: "0 auto 2px",
                }}>
                  {getInitials(selectedName).toUpperCase()}
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{selectedName}</p>
                {selectedBorrowerId && (() => {
                  const s = activeLookup.get(selectedBorrowerId);
                  if (s === null || s === undefined) return null;
                  const label = s === "pending" ? "Pending" : (s === true || s === "true" as any) ? "Active" : "Opted Out";
                  const bg = s === "pending" ? "#fefce8" : (s === true || s === "true" as any) ? "#f0fdf4" : "#fef2f2";
                  const color = s === "pending" ? "#a16207" : (s === true || s === "true" as any) ? "#16a34a" : "#ef4444";
                  return (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, marginTop: 2, display: "inline-block",
                      background: bg, color,
                    }}>
                      {label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
              <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 4 }}>
                {[...selectedMessages].reverse().map((msg, i, arr) => {
                  const isOutbound = msg.direction === "outbound";
                  // Show timestamp if first message or different day/time gap > 30min from previous
                  const prev = i > 0 ? arr[i - 1] : null;
                  const showTime = !prev || (new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime()) > 1800000;
                  // Tail: last message in a group or next message is different direction
                  const next = i < arr.length - 1 ? arr[i + 1] : null;
                  const isLast = !next || next.direction !== msg.direction;

                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", margin: "12px 0 8px" }}>
                          {formatFull(msg.createdAt)}
                        </p>
                      )}
                      <div style={{
                        display: "flex",
                        justifyContent: isOutbound ? "flex-end" : "flex-start",
                        marginBottom: isLast ? 8 : 2,
                      }}>
                        <div style={{
                          maxWidth: "65%", padding: "8px 14px",
                          fontSize: 15, lineHeight: 1.4,
                          background: isOutbound ? SENT_BG : RECV_BG,
                          color: isOutbound ? SENT_TEXT : RECV_TEXT,
                          borderRadius: isOutbound
                            ? `18px 18px ${isLast ? "4px" : "18px"} 18px`
                            : `18px 18px 18px ${isLast ? "4px" : "18px"}`,
                        }}>
                          {msg.body}
                        </div>
                      </div>
                      {isLast && (
                        <p style={{
                          fontSize: 10, color: "#9ca3af",
                          textAlign: isOutbound ? "right" : "left",
                          margin: "0 0 4px",
                          padding: isOutbound ? "0 4px 0 0" : "0 0 0 4px",
                        }}>
                          {isOutbound ? "Sent" : "Received"} · {msg.status}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Input bar */}
            {selectedBorrowerId && (activeLookup.get(selectedBorrowerId) === false || activeLookup.get(selectedBorrowerId) === "false" as any) ? (
              <div style={{
                flexShrink: 0, padding: "12px 16px",
                borderTop: "1px solid #e5e7eb", background: "#fef2f2",
                textAlign: "center", fontSize: 13, color: "#ef4444",
              }}>
                This lead has opted out. You can no longer send messages.
              </div>
            ) : (
            <div style={{
              flexShrink: 0, padding: "8px 16px 12px",
              borderTop: "1px solid #e5e7eb", background: "#f9f9f9",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && !e.shiftKey && draft.trim() && selectedBorrowerId && !sending) {
                    e.preventDefault();
                    const recipient = selectedMessages[0]?.recipient || "";
                    if (!recipient || !user) return;
                    setSending(true);
                    const body = draft.trim();
                    setDraft("");
                    await supabase.from("messages").insert({
                      user_id: user.id, borrower_id: selectedBorrowerId,
                      direction: "outbound", recipient, body, status: "queued",
                    });
                    queryClient.invalidateQueries({ queryKey: ["store_messages"] });
                    setSending(false);
                  }
                }}
                placeholder="iMessage"
                disabled={sending}
                style={{
                  flex: 1, height: 36, borderRadius: 18, border: "1px solid #d1d5db",
                  padding: "0 16px", fontSize: 15, outline: "none", background: "white",
                  fontFamily: "inherit", opacity: sending ? 0.5 : 1,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#007aff")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
              />
              <button
                onClick={async () => {
                  if (!draft.trim() || !selectedBorrowerId || sending || !user) return;
                  const recipient = selectedMessages[0]?.recipient || "";
                  if (!recipient) return;
                  setSending(true);
                  const body = draft.trim();
                  setDraft("");
                  await supabase.from("messages").insert({
                    user_id: user.id, borrower_id: selectedBorrowerId,
                    direction: "outbound", recipient, body, status: "queued",
                  });
                  queryClient.invalidateQueries({ queryKey: ["store_messages"] });
                  setSending(false);
                }}
                disabled={!draft.trim() || sending}
                style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: draft.trim() ? "#007aff" : "#d1d5db",
                  border: "none", cursor: draft.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "background 0.15s",
                }}
              >
                <ArrowUp style={{ width: 16, height: 16, color: "white" }} />
              </button>
            </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
