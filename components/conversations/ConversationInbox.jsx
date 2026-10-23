"use client";

import { useState } from "react";
import { Search, Edit2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Channel icon (inline SVG) ────────────────────────────────────────────────
function ChannelDot({ channel }) {
  const map = {
    whatsapp: "bg-green-500",
    website:  "bg-blue-500",
    email:    "bg-amber-500",
  };
  return <span className={cn("w-2 h-2 rounded-full flex-shrink-0", map[channel] || "bg-gray-400")} />;
}

// ── Conversation list item ───────────────────────────────────────────────────
function ConvItem({ conv, isActive, onClick }) {
  const palette = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#22c55e","#3b82f6","#14b8a6"];
  const bg      = palette[conv.name.charCodeAt(0) % palette.length];
  const initials= conv.name.split(" ").map(n => n[0]).join("").slice(0,2);

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 px-3 py-3 cursor-pointer transition-colors duration-100 border-b border-gray-50 last:border-0 group",
        isActive ? "bg-indigo-50/80 border-l-2 border-l-indigo-500" : "hover:bg-gray-50"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ background: bg }}>
          {initials}
        </div>
        <ChannelDot channel={conv.channel} />
        {/* Channel pip bottom-right */}
        <span className={cn(
          "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center",
          conv.channel === "whatsapp" ? "bg-green-500" :
          conv.channel === "website"  ? "bg-blue-500"  : "bg-amber-500"
        )}>
          {conv.channel === "whatsapp" && (
            <svg width="7" height="7" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
          )}
          {conv.channel === "website" && (
            <svg width="7" height="7" viewBox="0 0 24 24" fill="white" stroke="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="white" strokeWidth="2" fill="none"/></svg>
          )}
          {conv.channel === "email" && (
            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          )}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={cn("text-sm font-semibold truncate", isActive ? "text-indigo-700" : "text-gray-800")}>
            {conv.name}
          </span>
          <span className="text-[11px] text-gray-400 flex-shrink-0 ml-1">{conv.time}</span>
        </div>
        <p className="text-[11px] text-gray-400 truncate mb-0.5">{conv.company}</p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 truncate flex-1">{conv.lastMessage}</p>
          {conv.unread > 0 && (
            <span className="ml-1.5 flex-shrink-0 min-w-[18px] h-[18px] bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {conv.unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ConversationInbox — left column: search + channel filters + scrollable conv list.
 * Props: conversations, activeId, onSelect, loading, onNewConversation
 */
export default function ConversationInbox({
  conversations = [],
  activeId,
  onSelect,
  loading = false,
  onNewConversation,
}) {
  const [search,        setSearch]       = useState("");
  const [activeChannel, setActiveChannel]= useState("all");

  const channelCounts = {
    all: conversations.length,
    whatsapp: conversations.filter(c => c.channel === "whatsapp").length,
    website: conversations.filter(c => c.channel === "website").length,
    email: conversations.filter(c => c.channel === "email").length,
  };

  const channelList = [
    { id: "all",      label: "All",      count: channelCounts.all },
    { id: "whatsapp", label: "WhatsApp", count: channelCounts.whatsapp, color: "bg-green-500" },
    { id: "website",  label: "Website",  count: channelCounts.website,  color: "bg-blue-500" },
    { id: "email",    label: "Email",    count: channelCounts.email,    color: "bg-amber-500" },
  ];

  const filtered = conversations.filter(c => {
    const matchesChannel = activeChannel === "all" || c.channel === activeChannel;
    const matchesSearch  = !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900">Conversations</h2>
            <span className="bg-indigo-100 text-indigo-700 text-[11px] font-bold px-1.5 py-0.5 rounded-full">
              {conversations.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {onNewConversation && (
              <button
                onClick={onNewConversation}
                title="Start new conversation"
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
              >
                <Edit2 size={13} />
              </button>
            )}
            <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <Filter size={13} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 placeholder:text-gray-400 transition-all"
          />
        </div>

        {/* Channel filters */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {channelList.map(ch => (
            <button key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors",
                activeChannel === ch.id
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}>
              {ch.label}
              {ch.count !== null && (
                <span className={cn(
                  "text-[10px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center",
                  activeChannel === ch.id ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-600"
                )}>
                  {ch.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-24 h-3 bg-gray-200 rounded" />
                  <div className="w-36 h-2.5 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-xs px-4 text-center">
            <p className="font-semibold text-gray-600">No conversations</p>
            <p className="mt-1">Click the pencil icon above to start your first chat.</p>
          </div>
        ) : (
          filtered.map(conv => (
            <ConvItem
              key={conv.id}
              conv={conv}
              isActive={activeId === conv.id}
              onClick={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
