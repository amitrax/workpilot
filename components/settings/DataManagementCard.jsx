"use client";

import { Download, FileText, Calendar, ChevronRight } from "lucide-react";
import { dataManagementOptionsList } from "@/lib/settingsData";

const iconMap = {
  download: Download,
  "file-text": FileText,
  calendar: Calendar,
};

export default function DataManagementCard() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
          Data Management
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage and export your workspace data.
        </p>
      </div>

      {/* Options List */}
      <div className="space-y-3">
        {dataManagementOptionsList.map((item) => {
          const Icon = iconMap[item.icon] || Download;

          return (
            <div
              key={item.id}
              onClick={() => alert(`Opening ${item.title}...`)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50/80 transition-colors cursor-pointer group"
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

              <ChevronRight
                size={14}
                className="text-gray-400 group-hover:text-gray-600 transition-colors"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
