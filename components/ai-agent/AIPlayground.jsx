"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Sparkles, Bot, Trash2, HelpCircle, ChevronDown, AlertCircle } from "lucide-react";
import { sampleQuestions } from "@/lib/aiAgentData";

export default function AIPlayground({
  agentName = "WorkPilot Assistant",
  systemPrompt = "",
  workspaceId = null,
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || isTyping) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setShowSamples(false);
    setIsTyping(true);

    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const res = await fetch("/api/ai/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          workspaceId,
          conversationHistory: history,
          systemPromptOverride: systemPrompt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            sender: "system",
            text: data.error || "Failed to generate AI response. Please verify OPENAI_API_KEY.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          sender: "system",
          text: err.message || "Network error requesting AI response.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between pb-3.5 border-b border-gray-100/80 mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">Test Your AI Agent</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Test how your AI agent responds to customer queries.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            title="Clear chat history"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Chat Messages Stream or Clean Empty State */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 max-h-[380px] min-h-[300px] scrollbar-none text-xs flex flex-col justify-start">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-6 my-auto">
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-2.5">
              <Bot size={20} />
            </div>
            <h4 className="text-xs font-semibold text-gray-900 mb-1">
              Interactive Agent Sandbox
            </h4>
            <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
              Send a test message below or pick a sample question to preview how {agentName} processes customer inquiries.
            </p>
            <div className="mt-4 p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-800 flex items-start gap-2 text-left max-w-xs">
              <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <span>Live inference runs via server-side OpenAI. Set OPENAI_API_KEY in .env.local to activate.</span>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === "user";
            const isSystem = msg.sender === "system";

            return (
              <div key={msg.id} className="flex gap-2.5 items-start">
                {/* Avatar */}
                {isUser ? (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-xs mt-0.5">
                    You
                  </div>
                ) : (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5 ${
                    isSystem ? "bg-amber-100 border border-amber-200 text-amber-700" : "bg-indigo-100 border border-indigo-200 text-indigo-600"
                  }`}>
                    {isSystem ? <AlertCircle size={14} /> : <Bot size={15} />}
                  </div>
                )}

                {/* Message Content Bubble */}
                <div className="flex-1 max-w-[88%]">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-gray-800 text-[11px]">
                      {isUser ? "You" : isSystem ? "System Notice" : agentName}
                    </span>
                    <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-2xs ${
                      isUser
                        ? "bg-indigo-50 text-indigo-950 rounded-tl-sm border border-indigo-100/60"
                        : isSystem
                        ? "bg-amber-50/80 text-amber-900 rounded-tl-sm border border-amber-200/80"
                        : "bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2.5 items-center text-gray-400 text-xs italic">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Bot size={14} />
            </div>
            <div className="bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Sample Questions Dropdown */}
      <div className="relative mt-2 mb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSamples(!showSamples)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
          >
            <Sparkles size={11} />
            <span>Try Sample Questions</span>
            <ChevronDown size={11} className={`transition-transform ${showSamples ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showSamples && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowSamples(false)}
            />
            <div className="absolute left-0 bottom-8 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-1.5 z-40 space-y-0.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                Preset Queries
              </p>
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors truncate cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative flex items-center gap-2 pt-2 border-t border-gray-100"
      >
        <button
          type="button"
          onClick={() => {}}
          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          title="Multimodal upload"
        >
          <Paperclip size={16} />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a test message..."
          className="flex-1 py-2 px-3 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-all flex-shrink-0 shadow-sm shadow-indigo-500/20 cursor-pointer"
          title="Send message"
        >
          <Send size={13} className="translate-x-0.5" />
        </button>
      </form>
    </div>
  );
}
