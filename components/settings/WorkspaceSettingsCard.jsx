"use client";

import { Clock, Globe, Calendar, CreditCard, ChevronRight } from "lucide-react";

export default function WorkspaceSettingsCard({ settings }) {
  const items = [
    {
      id: "tz",
      title: "Workspace Timezone",
      description: settings?.timezone || "(GMT+05:30) Asia/Kolkata",
      icon: Clock,
      iconColor: "text-purple-600 bg-purple-50",
    },
    {
      id: "plan",
      title: "Workspace Plan",
      description: `${(settings?.plan || "Starter").toUpperCase()} Tier`,
      status: "Active",
      icon: CreditCard,
      iconColor: "text-emerald-600 bg-emerald-50",
    },
    {
      id: "billing",
      title: "Billing Email",
      description: settings?.billingEmail || "Not configured",
      icon: Globe,
      iconColor: "text-blue-600 bg-blue-50",
    },
    {
      id: "role",
      title: "Your Workspace Role",
      description: (settings?.userRole || "Admin").toUpperCase(),
      status: settings?.isOwnerOrAdmin ? "Admin" : "Member",
      icon: Calendar,
      iconColor: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="mb-4 pb-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">
            Workspace Details
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Active configuration for {settings?.workspaceName || "this workspace"}.
          </p>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50/80 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconColor} group-hover:scale-105 transition-transform`}
                  >
                    <Icon size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.status && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                      {item.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 mt-2 border-t border-gray-100 flex justify-end">
        <div className="text-[11px] text-gray-400 font-medium">
          Multi-tenant isolated workspace
        </div>
      </div>
    </div>
  );
}
