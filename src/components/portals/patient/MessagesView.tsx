"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function MessagesView() {
  const [activeMessage, setActiveMessage] = useState(0);

  const threads = [
    {
      id: "msg-1",
      doctor: "Dr. Anjali Menon",
      specialty: "General Medicine",
      lastMessage: "Your recent blood panel looks stable. Continue current daily vitamins.",
      time: "10:30 AM",
      unread: true,
    },
    {
      id: "msg-2",
      doctor: "Dr. Sarah Jenkins",
      specialty: "Cardiology Center",
      lastMessage: "Please remember to monitor your blood pressure morning and evening before our visit.",
      time: "Yesterday",
      unread: false,
    },
    {
      id: "msg-3",
      doctor: "CareSync Nursing Station",
      specialty: "Triage & Vitals",
      lastMessage: "Your appointment for tomorrow at 10:30 AM has been confirmed.",
      time: "Oct 20",
      unread: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-h2 font-bold text-foreground tracking-tight">Messages</h2>
        <p className="text-body text-muted-foreground mt-1">
          Direct, secure communication with your primary doctors and clinical support staff.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[500px]">
        {/* Thread List Column */}
        <Card className="md:col-span-4 p-3 border border-border shadow-sm divide-y divide-border/60 overflow-hidden">
          <div className="p-2 mb-1">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-surface-muted/60 border border-border rounded-md px-3 py-1.5 text-caption text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {threads.map((item, idx) => (
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
        <Card className="md:col-span-8 p-6 border border-border shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-h4 font-bold text-foreground">{threads[activeMessage].doctor}</h3>
                <p className="text-caption text-muted-foreground">{threads[activeMessage].specialty}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-caption text-success font-medium">
                <span className="w-2 h-2 rounded-full bg-success" />
                Active Care Team
              </span>
            </div>

            {/* Bubble Messages */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-caption font-bold text-primary shrink-0">
                  DR
                </div>
                <div className="bg-surface-muted p-4 rounded-xl rounded-tl-none max-w-lg space-y-1">
                  <p className="text-small text-foreground">
                    Hello Rahul, I have reviewed your latest CBC blood results and everything is within the expected physiological range. Please continue taking your prescribed daily vitamins.
                  </p>
                  <span className="text-[10px] text-muted-foreground block text-right">Today, 10:30 AM</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <div className="bg-primary text-primary-foreground p-4 rounded-xl rounded-tr-none max-w-lg space-y-1">
                  <p className="text-small">
                    Thank you Dr. Menon, I will continue with the vitamins and will see you for our scheduled consultation tomorrow.
                  </p>
                  <span className="text-[10px] opacity-75 block text-right">Today, 10:38 AM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reply Input Box */}
          <div className="mt-8 pt-4 border-t border-border flex items-center gap-3">
            <input
              type="text"
              placeholder="Type your secure message to clinical staff..."
              className="flex-1 bg-surface-muted/60 border border-border rounded-lg px-4 py-2 text-small text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button variant="primary" size="md">
              Send
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
