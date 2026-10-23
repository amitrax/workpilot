"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ConversationStatsCard from "@/components/conversations/ConversationStatsCard";
import ConversationInbox from "@/components/conversations/ConversationInbox";
import ChatWindow from "@/components/conversations/ChatWindow";
import CustomerPanel from "@/components/conversations/CustomerPanel";
import NewConversationModal from "@/components/conversations/NewConversationModal";

import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/layout/WorkspaceContext";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  createConversation,
  transformConversationFromDB,
  transformMessageFromDB,
} from "@/lib/supabase/conversations";

export default function ConversationsPage() {
  // ── Single shared Supabase client (no independent workspace resolution here)
  const [supabase] = useState(() => createClient());

  // ── Workspace state comes ENTIRELY from WorkspaceContext (provided by DashboardLayout)
  // This eliminates the duplicate workspace resolution race condition.
  const {
    workspaceId,
    user: currentUser,
    loading: workspaceLoading,
    error: workspaceError,
  } = useWorkspace();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // ── 1. Fetch Conversations — only fires when workspaceId is a valid UUID ──
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const loadConversations = useCallback(async () => {
    // Guard: never run without a valid workspace UUID
    if (!workspaceId || !UUID_REGEX.test(workspaceId) || workspaceId === currentUser?.id) {
      console.warn("[ConversationsPage] loadConversations called without valid workspaceId, skipping.", {
        workspaceId,
        currentUserId: currentUser?.id,
      });
      return;
    }

    setLoadingConversations(true);
    setError(null);

    console.log("[WORKSPACE DEBUG] loadConversations starting:", {
      workspaceId,
      currentUserId: currentUser?.id,
      currentUserEmail: currentUser?.email,
    });

    try {
      const rawConversations = await fetchConversations(supabase, workspaceId);
      const transformed = rawConversations.map((r) => transformConversationFromDB(r, currentUser));
      setConversations(transformed);

      if (transformed.length > 0) {
        setActiveId((prevId) => {
          if (prevId && transformed.some((c) => c.id === prevId)) return prevId;
          return transformed[0].id;
        });
      } else {
        setActiveId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("[ConversationsPage] Failed to load conversations:", err);
      setError(err.message || "Failed to load conversations from Supabase.");
    } finally {
      setLoadingConversations(false);
    }
  }, [supabase, workspaceId, currentUser]);

  // Reload whenever workspaceId becomes available (resolves race condition)
  useEffect(() => {
    if (workspaceId && UUID_REGEX.test(workspaceId) && workspaceId !== currentUser?.id) {
      loadConversations();
    }
  }, [workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 2. Fetch Messages & Realtime Subscription ─────────────────────────────
  useEffect(() => {
    if (!activeId || !supabase) return;

    let isMounted = true;
    setLoadingMessages(true);

    fetchMessages(supabase, activeId)
      .then((rawMsgs) => {
        if (isMounted) {
          setMessages(rawMsgs.map(transformMessageFromDB));
          setLoadingMessages(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("[ConversationsPage] Failed to fetch messages:", err);
          setLoadingMessages(false);
        }
      });

    const channel = supabase
      .channel(`realtime:messages:${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        (payload) => {
          if (!isMounted) return;
          const incoming = transformMessageFromDB(payload.new);
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });

          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeId
                ? { ...c, lastMessage: incoming.text, time: incoming.time }
                : c
            )
          );
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [activeId, supabase]);

  const currentConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );

  const [aiGenerating, setAiGenerating] = useState(false);

  // ── Trigger Real Server-Side AI Reply ───────────────────────────────────────
  const triggerAIReply = async (convId = activeId) => {
    if (!convId || !workspaceId || aiGenerating) return;
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          workspaceId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.warn("[ConversationsPage] AI reply error:", data.error);
        setError(data.error || "Failed to generate AI response.");
      } else if (data.aiPaused) {
        console.log("[ConversationsPage] AI Agent is paused for this workspace.");
      } else if (data.message) {
        const aiMsg = transformMessageFromDB(data.message);
        setMessages((prev) => {
          if (prev.some((m) => m.id === aiMsg.id)) return prev;
          return [...prev, aiMsg];
        });
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  lastMessage: aiMsg.text,
                  time: aiMsg.time,
                  raw: { ...(c.raw || {}), ai_handled: true },
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error("[ConversationsPage] Error triggering AI reply:", err);
      setError(err.message || "Network error requesting AI response.");
    } finally {
      setAiGenerating(false);
    }
  };

  // ── 3. Send Message Handler ───────────────────────────────────────────────
  const handleSendMessage = async ({ content, isAI, senderType = "agent" }) => {
    if (!activeId || !workspaceId) return;

    const isCustomer = senderType === "customer";
    const resolvedSenderType = isCustomer ? "customer" : isAI ? "ai" : "agent";

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender: resolvedSenderType,
      text: content,
      time: "Now",
      isAI: isAI || resolvedSenderType === "ai",
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const inserted = await sendMessage(supabase, {
        workspaceId,
        conversationId: activeId,
        content,
        senderType: resolvedSenderType,
        senderName: isCustomer
          ? currentConversation?.name || "Customer"
          : currentUser?.user_metadata?.full_name || "Agent",
        senderId: isCustomer ? null : currentUser?.id,
        isAI: isAI || resolvedSenderType === "ai",
      });

      const realMsg = transformMessageFromDB(inserted);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? realMsg : m)));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, lastMessage: realMsg.text, time: realMsg.time }
            : c
        )
      );

      // If a customer message was sent, automatically trigger the AI agent reply
      if (isCustomer) {
        triggerAIReply(activeId);
      }
    } catch (err) {
      console.error("[ConversationsPage] Failed to persist message:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      throw err;
    }
  };

  // ── 4. Create Conversation Handler ────────────────────────────────────────
  // Uses workspaceId directly from WorkspaceContext — no re-resolution needed.
  const handleCreateConversation = async (input) => {
    // Safety check: workspace must be valid before submitting
    if (!workspaceId || !UUID_REGEX.test(workspaceId) || workspaceId === currentUser?.id) {
      console.error("[CONVERSATION DEBUG] Cannot create conversation — invalid workspaceId:", {
        workspaceId,
        currentUserId: currentUser?.id,
        workspaceLoading,
        workspaceError: workspaceError?.message,
      });
      throw new Error(
        workspaceLoading
          ? "Workspace is still loading. Please wait a moment and try again."
          : "Unable to resolve active workspace. Please refresh the page."
      );
    }

    console.log("[CONVERSATION DEBUG] Starting conversation:", {
      workspaceId,
      workspaceIdType: typeof workspaceId,
      currentUserId: currentUser?.id,
      contactName: input?.name,
      channel: input?.channel,
      rpcStart: new Date().toISOString(),
    });

    const createdRaw = await createConversation(supabase, workspaceId, input);

    console.log("[CONVERSATION DEBUG] RPC success — created conversation:", createdRaw?.id);

    const newConv = transformConversationFromDB(createdRaw, currentUser);
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
  };

  // ── 5. Dynamic Stats Calculation ──────────────────────────────────────────
  const computedStats = useMemo(() => {
    const total = conversations.length;
    const aiHandled = conversations.filter((c) => c.raw?.ai_handled).length;
    const aiPercent = total > 0 ? ((aiHandled / total) * 100).toFixed(1) + "%" : "0%";

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = conversations.filter((c) => {
      const created = new Date(c.raw?.created_at || now);
      return created >= startOfThisMonth;
    }).length;

    const newLabel =
      total > 0 ? (newThisMonth > 0 ? `+${newThisMonth} this mo` : "0 this mo") : "—";

    return [
      {
        id: "total-conversations",
        label: "Total Conversations",
        value: total.toLocaleString(),
        growth: newLabel,
        growthPositive: true,
        subtitle:
          total === 1 ? "1 conversation in workspace" : `${total} active in workspace`,
        icon: "message-square",
        color: "indigo",
      },
      {
        id: "ai-handled",
        label: "AI Handled",
        value: aiHandled.toLocaleString(),
        growth:
          total > 0 && aiHandled > 0
            ? `${Math.round((aiHandled / total) * 100)}%`
            : "—",
        growthPositive: true,
        subtitle: total > 0 ? `${aiPercent} of total` : "0% of total",
        icon: "bot",
        color: "purple",
      },
      {
        id: "avg-response",
        label: "Avg. Response Time",
        value: "—",
        growth: "—",
        growthPositive: true,
        subtitle: "No response data",
        icon: "clock",
        color: "green",
      },
      {
        id: "csat",
        label: "Customer Satisfaction",
        value: "—",
        growth: "—",
        growthPositive: true,
        subtitle: "No rating data",
        icon: "smile",
        color: "orange",
      },
    ];
  }, [conversations]);

  // ── Workspace is loading — show spinner instead of broken UI ─────────────
  if (workspaceLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Loading workspace…</span>
        </div>
      </DashboardLayout>
    );
  }

  // ── Workspace failed to load — show actionable error ─────────────────────
  if (workspaceError && !workspaceId) {
    return (
      <DashboardLayout>
        <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-start gap-3 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Workspace could not be loaded</p>
              <p className="text-xs mt-1 text-red-600">{workspaceError?.message || String(workspaceError)}</p>
              <p className="text-xs mt-2 text-red-500">
                Please run the workspace fix SQL in your Supabase SQL Editor, then refresh this page.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Conversations</h1>
          <p className="text-gray-500 text-sm mt-1">
            Omnichannel inbox with AI-assisted conversations and lead intelligence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadConversations()}
            disabled={loadingConversations || workspaceLoading}
            title="Refresh conversations"
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loadingConversations ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>Error: {error}</span>
          </div>
          <button
            onClick={() => loadConversations()}
            className="px-3 py-1 bg-white border border-red-200 text-xs font-semibold text-red-700 rounded-lg hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Stats Cards ──────────────────────────────────────────────────────── */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-1">
        {computedStats.map((card) => (
          <ConversationStatsCard key={card.id} card={card} />
        ))}
      </div>

      {/* ── 3-Column Conversations Canvas Layout ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr_340px] h-[calc(100vh-270px)] min-h-[580px]">
        {/* Left Column: Inbox List */}
        <ConversationInbox
          conversations={conversations}
          activeId={activeId}
          onSelect={setActiveId}
          loading={loadingConversations}
          onNewConversation={() => {
            if (!workspaceId || workspaceLoading) return; // Guard: don't open modal without workspace
            setIsNewModalOpen(true);
          }}
        />

        {/* Center Column: Chat Window */}
        <ChatWindow
          key={activeId || "empty"}
          conversation={currentConversation}
          messages={messages}
          onSendMessage={handleSendMessage}
          loadingMessages={loadingMessages}
          aiGenerating={aiGenerating}
          onTriggerAIReply={() => triggerAIReply(activeId)}
        />

        {/* Right Column: Customer & AI Insights Panel */}
        <div className="hidden xl:block h-full overflow-hidden">
          <CustomerPanel
            contact={currentConversation?.contact}
            activityFeed={currentConversation?.activityFeed}
          />
        </div>
      </div>

      {/* ── New Conversation Modal ──────────────────────────────────────────── */}
      <NewConversationModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleCreateConversation}
        workspaceReady={!!workspaceId && !workspaceLoading}
      />
    </DashboardLayout>
  );
}
