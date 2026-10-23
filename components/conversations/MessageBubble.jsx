"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MessageBubble — single chat bubble, customer (left) or AI/agent (right).
 * Props: message: { sender, text, time, isAI }
 */
export default function MessageBubble({ message }) {
  const isCustomer = message.sender === "customer";

  return (
    <div className={cn("flex items-end gap-2.5 group", isCustomer ? "justify-start" : "justify-end")}>
      {/* Customer avatar */}
      {isCustomer && (
        <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-0.5">
          RS
        </div>
      )}

      <div className={cn("flex flex-col gap-1 max-w-[72%]", isCustomer ? "items-start" : "items-end")}>
        {/* Bubble */}
        <div className={cn(
          "relative px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
          isCustomer
            ? "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
            : "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-sm"
        )}>
          {/* Text — preserve newlines */}
          <p className="whitespace-pre-wrap">{message.text}</p>

          {/* AI badge on outbound messages */}
          {!isCustomer && message.isAI && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <Sparkles size={9} className="text-white" />
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-gray-400 px-1">{message.time}</span>
      </div>

      {/* AI avatar */}
      {!isCustomer && (
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mb-0.5">
          <Sparkles size={12} className="text-white" />
        </div>
      )}
    </div>
  );
}
