"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { CalendarDays, Plus } from "lucide-react";
import { useWorkspace } from "@/components/layout/WorkspaceContext";

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHeader({ onNewLead }) {
  const { profile, user } = useWorkspace();

  const greeting = getTimeGreeting();
  const firstName =
    profile?.firstName ||
    user?.user_metadata?.full_name?.trim()?.split(/\s+/)[0] ||
    "there";

  return (
    <div className="flex items-start justify-between mb-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here's what your AI agent and team handled across the workspace.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <Link href="/appointments">
          <Button
            variant="secondary"
            size="md"
            icon={<CalendarDays size={15} />}
          >
            Schedule
          </Button>
        </Link>
        <Link href="/leads">
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={15} />}
          >
            New lead
          </Button>
        </Link>
      </div>
    </div>
  );
}

