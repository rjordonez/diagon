import { useState, useRef, useEffect } from "react";
import { Bot, Plus, Send, Loader2, Wrench } from "lucide-react";
import { cn } from "@/demo/lib/utils";
import { useBorrowers } from "../hooks/useSupabaseData";
import {
  useAIConversations,
  useCreateAIConversation,
  useConversationMessages,
  getAuthToken,
} from "../hooks/useAIData";
import type { UIMessage } from "ai";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const AIAgentPage = () => {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showBorrowerPicker, setShowBorrowerPicker] = useState(false);
  const [activeBorrowerId, setActiveBorrowerId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], refetch: refetchConvos } = useAIConversations();
  const { data: borrowers = [] } = useBorrowers();
  const createConversation = useCreateAIConversation();
  const { data: initialMessages = [] } = useConversationMessages(activeConvId);

  // Load messages when switching conversations
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages.map((m: UIMessage) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") || "",
      })));
    } else if (activeConvId) {
      setMessages([]);
    }
  }, [activeConvId, initialMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewConversation = async (borrowerId: string | null) => {
    setShowBorrowerPicker(false);
    const result = await createConversation.mutateAsync(borrowerId);
    setActiveConvId(result.id);
    setActiveBorrowerId(borrowerId);
    setMessages([]);
  };

  const handleSelectConversation = (convId: string, borrowerId: string | null) => {
    setActiveConvId(convId);
    setActiveBorrowerId(borrowerId);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !activeConvId) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: inputValue.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const token = await getAuthToken();
      const uiMessages = newMessages.map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: "text", text: m.content }],
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: uiMessages,
          conversationId: activeConvId,
          borrowerId: activeBorrowerId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Request failed");
      }

      const data = await res.json();
      const assistantText = data.parts?.find((p: any) => p.type === "text")?.text || data.content || "";
      setMessages((prev) => [...prev, { id: data.id || crypto.randomUUID(), role: "assistant", content: assistantText }]);
      refetchConvos();
    } catch (err: any) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] -m-4 md:-m-6">
      {/* Left: Conversation List */}
      <div className="w-[280px] border-r border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <button
              onClick={() => setShowBorrowerPicker(!showBorrowerPicker)}
              className="w-full h-9 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              New Conversation
            </button>
            {showBorrowerPicker && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                <button onClick={() => handleNewConversation(null)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors border-b border-border">
                  General (no borrower)
                </button>
                {borrowers.map((b) => (
                  <button key={b.id} onClick={() => handleNewConversation(b.id)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors">
                    <span className="font-medium">{b.firstName} {b.lastName}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{b.stage}</span>
                  </button>
                ))}
                {borrowers.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No borrowers yet</p>}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <button key={conv.id} onClick={() => handleSelectConversation(conv.id, conv.borrowerId)}
                className={cn("w-full px-3 py-3 text-left border-b border-border transition-colors", activeConvId === conv.id ? "bg-muted" : "hover:bg-muted/50")}>
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{conv.borrowerName || conv.title || "General"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConvId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-1">AI Agent</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Start a conversation to instruct the AI to text your borrowers, request documents, or manage your pipeline.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className="flex items-start gap-2 max-w-[75%]">
                    {msg.role === "assistant" && (
                      <div className="h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-4 w-4 text-foreground" />
                      </div>
                    )}
                    <div className={cn("rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                      msg.role === "user" ? "bg-foreground text-background" : "bg-muted text-foreground")}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> AI is thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="border-t border-border p-3 flex gap-2">
              <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                placeholder="Tell the AI what to do..." disabled={isLoading}
                className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-colors disabled:opacity-50" />
              <button type="submit" disabled={!inputValue.trim() || isLoading}
                className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
