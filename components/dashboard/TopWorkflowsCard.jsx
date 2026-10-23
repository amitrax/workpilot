import Link from "next/link";
import { MessageCircle, UserCheck, Calendar, Moon, Zap } from "lucide-react";

const iconMap = {
  "message-circle": MessageCircle,
  "user-check": UserCheck,
  calendar: Calendar,
  moon: Moon,
  zap: Zap,
};

function WorkflowItem({ workflow }) {
  const Icon = iconMap[workflow.icon] || Zap;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${workflow.color}18` }}
      >
        <Icon size={16} style={{ color: workflow.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{workflow.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{workflow.metricLabel}</p>
      </div>
      <span className="text-base font-bold text-gray-900 flex-shrink-0">{typeof workflow.metric === "number" ? workflow.metric.toLocaleString() : workflow.metric}</span>
    </div>
  );
}

export default function TopWorkflowsCard({ workflows = [] }) {
  const hasWorkflows = workflows && workflows.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-gray-900">Top Performing AI Workflows</h2>
          <Link
            href="/automation"
            className="text-xs text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
          >
            View all
          </Link>
        </div>

        {/* Workflow List / Empty State */}
        {hasWorkflows ? (
          <div>
            {workflows.map((workflow) => (
              <WorkflowItem key={workflow.id} workflow={workflow} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mb-2">
              <Zap size={18} />
            </div>
            <p className="text-sm font-medium text-gray-700">No active workflows</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
              Set up automation workflows to auto-reply and qualify leads across channels.
            </p>
            <Link
              href="/automation"
              className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-block"
            >
              Create Workflow →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

