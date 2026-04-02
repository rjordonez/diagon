import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, MessageCircle, X, ArrowUp } from "lucide-react";
import { getAuthToken } from "@/app/hooks/useAIData";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const CopilotChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const token = await getAuthToken();
      const uiMessages = newMessages.map((m) => ({
        id: m.id, role: m.role, parts: [{ type: "text", text: m.content }],
      }));

      const res = await fetch("/api/borrower-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: uiMessages }),
      });

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      const assistantId = crypto.randomUUID();

      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n").filter((l) => l.startsWith("data: "))) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "text") {
                assistantText += data.text;
                setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: assistantText } : m));
              }
            } catch {}
          }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 50,
            width: 48, height: 48, borderRadius: "50%",
            background: "#3b82f6", color: "white", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
          }}>
          <MessageCircle style={{ width: 20, height: 20 }} />
        </button>
      )}

      {/* Overlay */}
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.08)" }} onClick={() => setOpen(false)} />}

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, zIndex: 50,
        width: 340, height: "100dvh", display: "flex", flexDirection: "column",
        background: "white", borderLeft: "1px solid #e5e7eb",
        boxShadow: open ? "-4px 0 24px rgba(0,0,0,0.06)" : "none",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.2s ease-in-out",
      }}>
        {/* Header */}
        <div style={{
          height: 56, flexShrink: 0, padding: "0 20px", borderBottom: "1px solid #e5e7eb",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", background: "#eff6ff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bot style={{ width: 14, height: 14, color: "#3b82f6" }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Assistant</p>
              <p style={{ fontSize: 10, color: "#9ca3af" }}>Ask about your application</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)}
            style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#111")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ marginTop: "auto" }} />
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.length === 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <Bot style={{ width: 12, height: 12, color: "#3b82f6" }} />
                  </div>
                  <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>How can I help with your application?</p>
                </div>
                <div style={{ paddingLeft: 34, display: "flex", flexDirection: "column", gap: 6 }}>
                  {["What documents do I need?", "What is a DSCR loan?", "How long does this take?"].map((q) => (
                    <button key={q} onClick={() => setInput(q)}
                      style={{
                        textAlign: "left", fontSize: 12, color: "#6b7280", background: "#f9fafb",
                        padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                        fontFamily: "inherit", width: "100%", transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#f9fafb")}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                alignItems: "flex-start",
                gap: 8,
              }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <Bot style={{ width: 12, height: 12, color: "#3b82f6" }} />
                  </div>
                )}
                <div style={{
                  fontSize: 13, lineHeight: 1.5, padding: "8px 14px", maxWidth: "75%",
                  background: msg.role === "user" ? "#3b82f6" : "#f3f4f6",
                  color: msg.role === "user" ? "white" : "#111",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                }}>
                  {msg.content || <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{ flexShrink: 0, padding: "8px 16px 12px", borderTop: "1px solid #e5e7eb" }}>
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{ display: "flex", gap: 8 }}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..." disabled={isLoading}
              style={{
                flex: 1, height: 36, borderRadius: 18, border: "1px solid #e5e7eb",
                padding: "0 14px", fontSize: 13, color: "#111", outline: "none",
                fontFamily: "inherit", opacity: isLoading ? 0.5 : 1,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")} />
            <button type="submit" disabled={!input.trim() || isLoading}
              style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: input.trim() ? "#3b82f6" : "#e5e7eb",
                border: "none", cursor: input.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <ArrowUp style={{ width: 16, height: 16, color: "white" }} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
