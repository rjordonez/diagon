import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";
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

      // Read streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      const assistantId = crypto.randomUUID();

      // Add empty assistant message
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
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, content: assistantText } : m)
                );
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-foreground text-background shadow-lg hover:bg-foreground/90 transition-all flex items-center justify-center">
          <MessageCircle className="h-5 w-5" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Application Assistant</p>
                <p className="text-[10px] text-muted-foreground">Ask anything about your application</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">How can I help you with your application?</p>
                <div className="mt-3 space-y-1.5">
                  {["What documents do I still need?", "What is a DSCR loan?", "How long does this process take?"].map((q) => (
                    <button key={q} onClick={() => { setInput(q); }}
                      className="w-full text-left text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted px-3 py-2 rounded-lg transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                  msg.role === "user"
                    ? "bg-foreground text-background rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}>
                  {msg.content || (isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-border shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..." disabled={isLoading}
                className="flex-1 h-9 rounded-xl border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-colors disabled:opacity-50" />
              <button type="submit" disabled={!input.trim() || isLoading}
                className="h-9 w-9 rounded-xl bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors disabled:opacity-50 shrink-0">
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
