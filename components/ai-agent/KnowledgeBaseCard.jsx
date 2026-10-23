"use client";

import { useState } from "react";
import { Plus, MoreVertical, FileText, Link as LinkIcon, Trash2, RefreshCw, ExternalLink } from "lucide-react";

export function SourceCard({ source, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const getIcon = () => {
    if (source.type === "url") {
      return (
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
          <LinkIcon size={16} />
        </div>
      );
    }
    if (source.title.toLowerCase().includes("product")) {
      return (
        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
          <FileText size={16} />
        </div>
      );
    }
    if (source.title.toLowerCase().includes("faq")) {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <FileText size={16} />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
        <FileText size={16} />
      </div>
    );
  };

  return (
    <div className="relative bg-white rounded-xl p-3.5 border border-gray-100/90 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-indigo-100 hover:shadow-xs transition-all flex flex-col justify-between group">
      <div className="flex items-start justify-between gap-2 mb-2">
        {getIcon()}
        
        {/* Dropdown 3 dots */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50 transition-colors"
          >
            <MoreVertical size={14} />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-6 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-40 text-xs text-gray-700">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    alert(`Re-indexing ${source.title}...`);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2"
                >
                  <RefreshCw size={12} className="text-gray-400" /> Re-sync Vectors
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (onDelete) onDelete(source.id);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 size={12} /> Remove Source
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title & Metadata */}
      <div>
        <h4 className="text-xs font-bold text-gray-900 truncate" title={source.title}>
          {source.title}
        </h4>
        <p className="text-[11px] text-gray-400 truncate mt-0.5" title={source.meta}>
          {source.meta}
        </p>
      </div>

      {/* Active Status Badge */}
      <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
          Active
        </span>
        <span className="text-[10px] text-gray-400">{source.syncedAt || "Synced"}</span>
      </div>
    </div>
  );
}

export default function KnowledgeBaseCard({ sources = [], onAddClick, onDeleteSource }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Knowledge Base</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Add your business information to help the AI provide accurate answers.
          </p>
        </div>
        <button
          onClick={onAddClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-100 rounded-lg transition-all self-start sm:self-auto shadow-2xs cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Source</span>
        </button>
      </div>

      {/* Sources Grid or Clean Empty State */}
      {sources.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {sources.map((src) => (
            <SourceCard key={src.id} source={src} onDelete={onDeleteSource} />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/40">
          <FileText size={28} className="text-gray-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-700">No knowledge sources connected yet</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Add documents, URLs, or FAQs above to train your AI agent with business context.
          </p>
        </div>
      )}
    </div>
  );
}

