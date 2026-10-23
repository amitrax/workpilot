"use client";

import { useState, useRef, useEffect } from "react";
import {
  Star, Tag, MoreHorizontal, Paperclip, Smile, Calendar, Mic,
  Send, Sparkles, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MessageBubble from "./MessageBubble";

import { MessageSquare } from "lucide-react";

const INPUT_TABS = ["Reply", "Customer (Test)", "Notes"];

/**
 * ChatWindow — center column with contact header, message thread, and input bar.
 * Props: conversation, messages, onSendMessage, loadingMessages, aiGenerating, onTriggerAIReply
 */
export default function ChatWindow({
  conversation,
  messages: propMessages,
  onSendMessage,
  loadingMessages = false,
  aiGenerating = false,
  onTriggerAIReply,
}) {
  const [inputValue, setInputValue] = useState("");
  const [activeInputTab, setActiveInputTab] = useState("Reply");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Use props if provided, otherwise fallback to conversation.messages
  const messages = propMessages || conversation?.messages || [];
  const contact = conversation?.contact;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingMessages, aiGenerating]);

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-400 p-6 text-center">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3">
          <MessageSquare size={24} />
        </div>
        <h3 className="text-sm font-bold text-gray-800">No conversation selected</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          Choose a conversation from the left inbox or start a new thread.
        </p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;
    const textToSend = inputValue.trim();
    const isCustomer = activeInputTab === "Customer (Test)";
    const isAI = false;
    setInputValue("");
    setSending(true);

    try {
      if (onSendMessage) {
        await onSendMessage({
          content: textToSend,
          isAI,
          senderType: isCustomer ? "customer" : "agent",
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      // Restore input if failed
      setInputValue(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const initials = (contact?.name || "RS")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ── Contact Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">{contact?.name || "Contact"}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-medium text-indigo-600">{contact?.statusQual || "Lead"}</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-50 border border-green-100 text-[10px] font-semibold text-green-700 capitalize">
                {contact?.channel || "WhatsApp"}
              </span>
            </div>
            <p className="text-xs text-gray-400">{contact?.phone || contact?.email || ""}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {[Star, Tag, MoreHorizontal].map((Icon, i) => (
            <button key={i} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Message Thread ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Date separator */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[11px] text-gray-400 font-medium">Message History</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {loadingMessages ? (
          <div className="py-8 space-y-3">
            <div className="flex items-end gap-2.5 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-gray-200" />
              <div className="w-48 h-10 bg-gray-200 rounded-2xl" />
            </div>
            <div className="flex items-end justify-end gap-2.5 animate-pulse">
              <div className="w-56 h-12 bg-indigo-100 rounded-2xl" />
              <div className="w-7 h-7 rounded-full bg-indigo-200" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No messages yet. Send a message to start chatting.
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}

        {/* AI Generating Indicator */}
        {aiGenerating && (
          <div className="flex gap-2.5 items-center text-gray-500 text-xs italic py-1">
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
              <Sparkles size={14} className="animate-pulse" />
            </div>
            <div className="bg-purple-50/80 px-3.5 py-2 rounded-2xl border border-purple-100/80 flex items-center gap-1.5 text-purple-700">
              <span className="font-medium text-xs">AI Assistant is formulating a reply</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input Area ── */}
      <div className="bg-white border-t border-gray-100 flex-shrink-0">
        {/* Tab row */}
        <div className="flex items-center gap-0 px-4 pt-2">
          {INPUT_TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveInputTab(tab)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors",
                activeInputTab === tab
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/40"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}>
              {tab}
            </button>
          ))}
        </div>

        {/* Text input */}
        <div className="px-4 pb-2 pt-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeInputTab === "Notes"
                ? "Add an internal note..."
                : activeInputTab === "Customer (Test)"
                ? "Simulate incoming customer message (triggers real AI agent reply)..."
                : "Type your message as agent..."
            }
            rows={2}
            className="w-full text-sm text-gray-700 bg-transparent resize-none focus:outline-none placeholder:text-gray-400 leading-relaxed"
          />
        </div>

        {/* Toolbar */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {[Smile, Paperclip, Calendar, Mic].map((Icon, i) => (
              <button key={i}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <Icon size={14} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onTriggerAIReply && !aiGenerating) {
                  onTriggerAIReply();
                }
              }}
              disabled={aiGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 cursor-pointer"
              title="Trigger real AI agent reply for this conversation"
            >
              <Sparkles size={12} className={aiGenerating ? "animate-spin" : ""} />
              {aiGenerating ? "AI Thinking..." : "AI Reply"}
            </button>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || sending}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors">
              <Send size={12} />
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
