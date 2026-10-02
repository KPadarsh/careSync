"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface MessageBubble {
  id: string;
  sender: "doctor" | "patient";
  text: string;
  time: string;
}

export interface MessageThread {
  id: string;
  doctor: string;
  specialty: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  messages: MessageBubble[];
}

export function MessagesView() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeMessage, setActiveMessage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const filteredThreads = threads.filter(
    (t) =>
      t.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setNotice("Clinical messaging endpoint is pending backend integration.");
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-h2 font-bold text-foreground tracking-tight">Messages</h2>
        <p className="text-body text-muted-foreground mt-1">
          Direct, secure communication with your primary doctors and clinical support staff.
        </p>
      </div>

      {notice && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-amber-900 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {threads.length === 0 ? (
        <Card className="p-12 text-center border border-border shadow-xs">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-foreground">No Message Conversations</h3>
          <p className="text-caption text-muted-foreground mt-1 max-w-sm mx-auto">
            You do not have any active message threads with your care team. When your doctors or clinical staff message you, they will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[500px]">
          {/* Thread List Column */}
          <Card className="md:col-span-4 p-3 border border-border shadow-sm divide-y divide-border/60 overflow-hidden">
            <div className="p-2 mb-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-surface-muted/60 border border-border rounded-md px-3 py-1.5 text-caption text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {filteredThreads.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setActiveMessage(idx)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  activeMessage === idx ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-surface-muted/40"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-small font-semibold text-foreground">{item.doctor}</span>
                  <span className="text-[11px] text-muted-foreground">{item.time}</span>
                </div>
                <p className="text-caption text-muted-foreground truncate">{item.lastMessage}</p>
              </div>
            ))}
          </Card>

          {/* Message Thread Content Column */}
          {filteredThreads[activeMessage] && (
            <Card className="md:col-span-8 p-6 border border-border shadow-sm flex flex-col justify-between">
              <div className="space-y-6">
                <div className="border-b border-border pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-h4 font-bold text-foreground">
                      {filteredThreads[activeMessage].doctor}
                    </h3>
                    <p className="text-caption text-muted-foreground">
                      {filteredThreads[activeMessage].specialty}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-caption text-success font-medium">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    Active Care Team
                  </span>
                </div>

                {/* Bubble Messages */}
                <div className="space-y-4">
                  {filteredThreads[activeMessage].messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex gap-3 ${m.sender === "patient" ? "justify-end" : ""}`}
                    >
                      {m.sender === "doctor" && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-caption font-bold text-primary shrink-0">
                          DR
                        </div>
                      )}
                      <div
                        className={`p-4 rounded-xl max-w-lg space-y-1 ${
                          m.sender === "patient"
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-surface-muted rounded-tl-none text-foreground"
                        }`}
                      >
                        <p className="text-small">{m.text}</p>
                        <span
                          className={`text-[10px] block text-right ${
                            m.sender === "patient" ? "opacity-75" : "text-muted-foreground"
                          }`}
                        >
                          {m.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Input Box */}
              <form onSubmit={handleSendMessage} className="mt-8 pt-4 border-t border-border flex items-center gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your secure message to clinical staff..."
                  className="flex-1 bg-surface-muted/60 border border-border rounded-lg px-4 py-2 text-small text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button variant="primary" size="md" type="submit">
                  Send
                </Button>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
