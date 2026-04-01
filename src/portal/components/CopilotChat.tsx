import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, MessageCircle, X } from "lucide-react";
import { cn } from "@/demo/lib/utils";
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
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
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
      {/* Toggle tab */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-foreground text-background px-1.5 py-3 rounded-l-lg shadow-lg hover:bg-foreground/90 transition-colors"
          style={{ writingMode: "vertical-rl" }}>
          <span className="flex items-center gap-1.5 text-xs font-medium">
            <MessageCircle className="h-3.5 w-3.5" /> Ask AI
          </span>
        </button>
      )}

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setOpen(false)} />}

      {/* Panel */}
      <div className={cn(
        "fixed top-0 right-0 z-50 flex flex-col bg-background border-l border-border shadow-xl transition-transform duration-200 ease-in-out",
        open ? "translate-x-0" : "translate-x-full"
      )} style={{ width: 320, height: "100dvh" }}>

        {/* Header */}
        <div className="h-14 shrink-0 px-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-[13px] font-semibold leading-tight">Assistant</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Ask about your application</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages — anchored to bottom */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          <div className="mt-auto" /> {/* Spacer pushes messages to bottom */}
          <div className="px-5 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3 w-3 text-foreground" />
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">How can I help with your application?</p>
                </div>
                <div className="space-y-1.5 pl-[34px]">
                  {["What documents do I need?", "What is a DSCR loan?", "How long does this take?"].map((q) => (
                    <button key={q} onClick={() => setInput(q)}
                      className="block text-[12px] text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted px-3 py-2 rounded-lg transition-colors w-full text-left">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "items-start gap-2.5")}>
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3 w-3 text-foreground" />
                  </div>
                )}
                <div
                  className={cn("text-[13px] leading-relaxed",
                    msg.role === "user" ? "bg-foreground text-background" : "bg-muted text-foreground"
                  )}
                  style={{
                    padding: "10px 14px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    maxWidth: "75%",
                  }}
                >
                  {msg.content || <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="shrink-0 px-4 py-3 border-t border-border">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 w-full">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..." disabled={isLoading}
              className="flex-1 h-10 rounded-xl border border-border bg-background px-3.5 text-[13px] placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-colors disabled:opacity-50" />
            <button type="submit" disabled={!input.trim() || isLoading}
              className="h-10 w-10 shrink-0 rounded-xl bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
