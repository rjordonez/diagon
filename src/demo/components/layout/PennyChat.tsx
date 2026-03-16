import React, { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/demo/lib/utils";

interface Message {
  id: string;
  sender: "user" | "penny";
  text: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    sender: "penny",
    text: "Hi there! 👋 I'm Penny, your mortgage application assistant. I'm here to help you through each step of the application. Feel free to ask me anything about the process, terminology, or what information you'll need.",
    time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
  },
];

export const PennyChat = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"penny" | "lo">("penny");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulated Penny response
    setTimeout(() => {
      const pennyMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "penny",
        text: "That's a great question! I'd be happy to help clarify that for you. The URLA (Uniform Residential Loan Application) is a standard form used across the mortgage industry. Each section collects specific information needed for your loan approval.",
        time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, pennyMsg]);
    }, 1000);
  };

  return (
    <div className="w-[300px] shrink-0 border-l border-border bg-card flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["penny", "lo"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "penny" ? "Penny" : "Loan Officer"}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex flex-col", msg.sender === "user" ? "items-end" : "items-start")}>
            {msg.sender === "penny" && (
              <p className="text-[11px] text-muted-foreground mb-1">Penny · {msg.time}</p>
            )}
            <div className={msg.sender === "user" ? "chat-bubble-user" : "chat-bubble-penny"}>
              {msg.text}
            </div>
            {msg.sender === "user" && (
              <p className="text-[11px] text-muted-foreground mt-1">{msg.time}</p>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask Penny anything..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button onClick={handleSend} className="text-muted-foreground hover:text-primary transition-colors">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
