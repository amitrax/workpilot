"use client";

import { Trash2 } from "lucide-react";

export default function DangerZoneCard({ onDeleteWorkspace, workspaceName = "this workspace", isOwnerOrAdmin = true }) {
  const handleDelete = () => {
    if (!isOwnerOrAdmin) {
      alert("Only workspace owners and administrators can delete a workspace.");
      return;
    }

    const confirmed = prompt(`Type "DELETE" to permanently delete ${workspaceName}:`);
    if (confirmed === "DELETE") {
      if (onDeleteWorkspace) onDeleteWorkspace();
    }
  };

  return (
    <div className="bg-rose-50/60 border border-rose-100/90 rounded-2xl p-6 mt-6">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-rose-200/50">
        <h3 className="text-sm font-bold text-rose-950 tracking-tight">Danger Zone</h3>
        <p className="text-xs text-rose-600/80 mt-0.5">
          Irreversible and destructive actions.
        </p>
      </div>

      {/* Main Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center flex-shrink-0">
            <Trash2 size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-rose-900 leading-tight">
              Delete Workspace
            </h4>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">
              Permanently delete this workspace and all associated leads, customer records, and configurations.
            </p>
          </div>
        </div>

        {/* Delete Button */}
        <div className="self-start sm:self-auto">
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isOwnerOrAdmin}
            className="px-4 py-2 text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-100/50 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
