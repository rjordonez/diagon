import { useState, useRef, useEffect } from "react";
import { Bot, Plus, Send, Loader2, MessageSquare, FileText, ArrowUpRight, ArrowDownLeft, Archive } from "lucide-react";
import { cn } from "@/demo/lib/utils";
import { useBorrowers } from "../hooks/useSupabaseData";
import {
  useAIConversations,
  useCreateAIConversation,
  useConversationMessages,
  useAllMessages,
  useDocuments,
  getAuthToken,
  type StoreMessage,
} from "../hooks/useAIData";
import type { UIMessage } from "ai";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const TABS = [
  { id: "chat", label: "AI Chat", icon: Bot },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "documents", label: "Documents", icon: FileText },
];

export const AIAgentPage = () => {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-4 md:-m-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border px-4 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5",
              activeTab === tab.id ? "text-foreground border-foreground" : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "chat" && <ChatPanel />}
      {activeTab === "messages" && <MessagesPanel />}
      {activeTab === "documents" && <DocumentsPanel />}
    </div>
  );
};

// ── Chat Panel ──

function ChatPanel() {
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

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !activeConvId) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: inputValue.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const token = await getAuthToken();
      const uiMessages = newMessages.map((m) => ({ id: m.id, role: m.role, parts: [{ type: "text", text: m.content }] }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: uiMessages, conversationId: activeConvId, borrowerId: activeBorrowerId }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Request failed"); }
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
    <div className="flex flex-1 min-h-0">
      {/* Left: Conversations */}
      <div className="w-[280px] border-r border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <button onClick={() => setShowBorrowerPicker(!showBorrowerPicker)}
              className="w-full h-9 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New Conversation
            </button>
            {showBorrowerPicker && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                <button onClick={() => handleNewConversation(null)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors border-b border-border">General (no borrower)</button>
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
          ) : conversations.map((conv) => (
            <button key={conv.id} onClick={() => { setActiveConvId(conv.id); setActiveBorrowerId(conv.borrowerId); }}
              className={cn("w-full px-3 py-3 text-left border-b border-border transition-colors", activeConvId === conv.id ? "bg-muted" : "hover:bg-muted/50")}>
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{conv.borrowerName || conv.title || "General"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(conv.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConvId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-1">AI Agent</h2>
              <p className="text-sm text-muted-foreground max-w-sm">Start a conversation to instruct the AI to text your borrowers, request documents, or manage your pipeline.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className="flex items-start gap-2 max-w-[75%]">
                    {msg.role === "assistant" && (
                      <div className="h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5"><Bot className="h-4 w-4 text-foreground" /></div>
                    )}
                    <div className={cn("rounded-lg px-3 py-2 text-sm whitespace-pre-wrap", msg.role === "user" ? "bg-foreground text-background" : "bg-muted text-foreground")}>{msg.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> AI is thinking...</div>}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="border-t border-border p-3 flex gap-2">
              <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Tell the AI what to do..." disabled={isLoading}
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
}

// ── Messages Panel (from Store) ──

function MessagesPanel() {
  const { data: messages = [], isLoading } = useAllMessages();
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string | null>(null);

  const borrowerMap = new Map<string, { name: string; messages: StoreMessage[] }>();
  for (const msg of messages) {
    if (!borrowerMap.has(msg.borrowerId)) borrowerMap.set(msg.borrowerId, { name: msg.borrowerName, messages: [] });
    borrowerMap.get(msg.borrowerId)!.messages.push(msg);
  }
  const borrowerList = Array.from(borrowerMap.entries());
  const selectedMessages = selectedBorrowerId ? borrowerMap.get(selectedBorrowerId)?.messages || [] : [];

  return (
    <div className="flex flex-1 min-h-0 border-t border-border">
      <div className="w-[260px] border-r border-border overflow-y-auto shrink-0">
        {isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-6">Loading...</p>
        ) : borrowerList.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No messages yet</p>
        ) : borrowerList.map(([borrowerId, { name, messages: msgs }]) => (
          <button key={borrowerId} onClick={() => setSelectedBorrowerId(borrowerId)}
            className={cn("w-full px-3 py-3 text-left border-b border-border transition-colors", selectedBorrowerId === borrowerId ? "bg-muted" : "hover:bg-muted/50")}>
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{msgs[0].direction === "outbound" ? "You: " : ""}{msgs[0].body.slice(0, 50)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{msgs.length} message{msgs.length !== 1 ? "s" : ""}</p>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {!selectedBorrowerId ? (
          <p className="text-sm text-muted-foreground text-center py-8">Select a borrower to view messages</p>
        ) : [...selectedMessages].reverse().map((msg) => (
          <div key={msg.id} className={cn("flex", msg.direction === "outbound" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[70%] rounded-lg px-3 py-2 text-sm", msg.direction === "outbound" ? "bg-foreground text-background" : "bg-muted text-foreground")}>
              <div className="flex items-center gap-1 mb-0.5">
                {msg.direction === "outbound" ? <ArrowUpRight className="h-3 w-3 opacity-60" /> : <ArrowDownLeft className="h-3 w-3 opacity-60" />}
                <span className={cn("text-[10px]", msg.direction === "outbound" ? "text-background/60" : "text-muted-foreground")}>
                  {msg.direction === "outbound" ? "Sent" : "Received"} · {msg.status}
                </span>
              </div>
              <p>{msg.body}</p>
              <p className={cn("text-[10px] mt-1", msg.direction === "outbound" ? "text-background/60" : "text-muted-foreground")}>
                {new Date(msg.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Documents Panel (from Store) ──

function DocumentsPanel() {
  const { data: documents = [], isLoading } = useDocuments();

  return (
    <div className="flex-1 overflow-y-auto">
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
      ) : documents.length === 0 ? (
        <div className="text-center py-8">
          <Archive className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No documents received yet. Documents uploaded by borrowers will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 px-4 py-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.fileName}</p>
                <p className="text-xs text-muted-foreground">{doc.borrowerName} · {doc.category || doc.fileType || "Document"}</p>
                {doc.aiSummary && <p className="text-xs text-muted-foreground mt-0.5">{doc.aiSummary}</p>}
              </div>
              <div className="text-right shrink-0">
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded",
                  doc.status === "verified" ? "bg-foreground text-background" : "bg-muted text-foreground")}>{doc.status}</span>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
