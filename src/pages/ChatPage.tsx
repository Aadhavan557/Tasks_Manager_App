import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Send,
  MessageCircle,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
}

export function ChatPage() {
  const { profile, partnerProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const STORAGE_KEY = "duomate_chat_messages";

  useEffect(() => {
    loadMessages();

    // Listen to local storage changes across tabs or user switch
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setMessages(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  };

  const saveMessages = (updated: ChatMessage[]) => {
    setMessages(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !profile) return;

    const newMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      sender_id: profile.id,
      sender_name: profile.full_name,
      text: inputText.trim(),
      created_at: new Date().toISOString(),
    };

    const updated = [...messages, newMsg];
    saveMessages(updated);
    setInputText("");
  };

  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear this chat history?")) {
      saveMessages([]);
      toast.success("Chat history cleared");
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-7rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-1 ring-border">
            <AvatarImage src={partnerProfile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs font-bold">
              {partnerProfile ? getInitials(partnerProfile.full_name) : "P"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-base font-bold flex items-center gap-1.5 leading-tight">
              {partnerProfile?.full_name || "Partner"}
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Private study chat for Aadhavan &amp; Narmatha
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <Card className="flex-1 border border-border p-4 flex flex-col justify-between overflow-hidden bg-card/60 backdrop-blur-sm">
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold text-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Start a discussion about your GATE preparation, Verilog code, or daily study plan!
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.sender_id === profile?.id;

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {isMine ? "You" : m.sender_name}
                    </span>
                    <span className="text-[9px] text-muted-foreground/60">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div
                    className={`px-3.5 py-2.5 rounded-2xl max-w-md text-sm break-words shadow-sm ${
                      isMine
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-tr-none"
                        : "bg-muted text-foreground border border-border/50 rounded-tl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSend} className="pt-3 mt-2 border-t border-border flex gap-2">
          <Input
            type="text"
            placeholder={`Message ${partnerProfile?.full_name || "partner"}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="text-sm h-11"
          />
          <Button
            type="submit"
            variant="gradient"
            className="h-11 px-5 gap-1.5 flex-shrink-0"
            disabled={!inputText.trim()}
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
