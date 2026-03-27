import { useState } from "react";
import { MessageSquare, FileText, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn } from "@/demo/lib/utils";
import { useAllMessages, useDocuments, type StoreMessage } from "../hooks/useAIData";

const TABS = [
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "documents", label: "Documents", icon: FileText },
];

export const StorePage = () => {
  const [activeTab, setActiveTab] = useState("messages");
  const { data: messages = [], isLoading: messagesLoading } = useAllMessages();
  const { data: documents = [], isLoading: docsLoading } = useDocuments();

  // Group messages by borrower
  const borrowerMap = new Map<string, { name: string; messages: StoreMessage[] }>();
  for (const msg of messages) {
    if (!borrowerMap.has(msg.borrowerId)) {
      borrowerMap.set(msg.borrowerId, { name: msg.borrowerName, messages: [] });
    }
    borrowerMap.get(msg.borrowerId)!.messages.push(msg);
  }
  const borrowerList = Array.from(borrowerMap.entries());

  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string | null>(null);
  const selectedMessages = selectedBorrowerId
    ? borrowerMap.get(selectedBorrowerId)?.messages || []
    : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Store</h1>
        <p className="text-sm text-muted-foreground">All conversations and documents across borrowers</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5",
              activeTab === tab.id
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span className="text-xs text-muted-foreground ml-1">
              ({tab.id === "messages" ? messages.length : documents.length})
            </span>
          </button>
        ))}
      </div>

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <div className="flex border border-border rounded-lg overflow-hidden h-[calc(100vh-220px)]">
          {/* Borrower list */}
          <div className="w-[260px] border-r border-border overflow-y-auto shrink-0">
            {messagesLoading ? (
              <p className="text-xs text-muted-foreground text-center py-6">Loading...</p>
            ) : borrowerList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No messages yet</p>
            ) : (
              borrowerList.map(([borrowerId, { name, messages: msgs }]) => {
                const lastMsg = msgs[0];
                return (
                  <button
                    key={borrowerId}
                    onClick={() => setSelectedBorrowerId(borrowerId)}
                    className={cn(
                      "w-full px-3 py-3 text-left border-b border-border transition-colors",
                      selectedBorrowerId === borrowerId ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {lastMsg.direction === "outbound" ? "You: " : ""}
                      {lastMsg.body.slice(0, 50)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {msgs.length} message{msgs.length !== 1 ? "s" : ""}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Message thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {!selectedBorrowerId ? (
              <p className="text-sm text-muted-foreground text-center py-8">Select a borrower to view messages</p>
            ) : selectedMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No messages</p>
            ) : (
              [...selectedMessages].reverse().map((msg) => (
                <div key={msg.id} className={cn("flex", msg.direction === "outbound" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[70%] rounded-lg px-3 py-2 text-sm",
                    msg.direction === "outbound"
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground"
                  )}>
                    <div className="flex items-center gap-1 mb-0.5">
                      {msg.direction === "outbound" ? (
                        <ArrowUpRight className="h-3 w-3 opacity-60" />
                      ) : (
                        <ArrowDownLeft className="h-3 w-3 opacity-60" />
                      )}
                      <span className={cn(
                        "text-[10px]",
                        msg.direction === "outbound" ? "text-background/60" : "text-muted-foreground"
                      )}>
                        {msg.direction === "outbound" ? "Sent" : "Received"} · {msg.status}
                      </span>
                    </div>
                    <p>{msg.body}</p>
                    <p className={cn(
                      "text-[10px] mt-1",
                      msg.direction === "outbound" ? "text-background/60" : "text-muted-foreground"
                    )}>
                      {new Date(msg.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="bg-background border border-border rounded-lg">
          {docsLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No documents received yet. Documents sent by borrowers via iMessage will appear here.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.borrowerName} · {doc.category || doc.fileType || "Document"}
                    </p>
                    {doc.aiSummary && (
                      <p className="text-xs text-muted-foreground mt-0.5">{doc.aiSummary}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded",
                      doc.status === "verified" ? "bg-foreground text-background" :
                      doc.status === "processing" ? "bg-muted text-muted-foreground" :
                      "bg-muted text-foreground"
                    )}>
                      {doc.status}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
