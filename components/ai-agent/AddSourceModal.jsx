"use client";

import { useState } from "react";
import { X, FileText, Link, HelpCircle, UploadCloud, Check } from "lucide-react";

export default function AddSourceModal({ isOpen, onClose, onAddSource }) {
  const [sourceType, setSourceType] = useState("file");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() && !url.trim()) return;

    setLoading(true);
    try {
      if (onAddSource) {
        await onAddSource({
          title: title.trim() || (url ? url.replace(/^https?:\/\//, "") : "New Document"),
          type: sourceType === "url" ? "url" : sourceType === "faq" ? "faq" : "document",
          url: url.trim() || null,
        });
      }
      onClose();
      setTitle("");
      setUrl("");
    } catch (err) {
      console.error("Failed to add knowledge source:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Add Knowledge Source</h3>
        <p className="text-xs text-gray-500 mt-1 mb-5">
          Train your AI agent with business documentation, website URLs, or custom policies.
        </p>

        {/* Source Type Selector */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <button
            type="button"
            onClick={() => setSourceType("file")}
            className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
              sourceType === "file"
                ? "border-indigo-600 bg-indigo-50/60 text-indigo-700 font-semibold"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FileText size={18} className={sourceType === "file" ? "text-indigo-600" : "text-gray-400"} />
            <span className="text-xs">Document</span>
          </button>

          <button
            type="button"
            onClick={() => setSourceType("url")}
            className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
              sourceType === "url"
                ? "border-indigo-600 bg-indigo-50/60 text-indigo-700 font-semibold"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Link size={18} className={sourceType === "url" ? "text-indigo-600" : "text-gray-400"} />
            <span className="text-xs">Website URL</span>
          </button>

          <button
            type="button"
            onClick={() => setSourceType("faq")}
            className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
              sourceType === "faq"
                ? "border-indigo-600 bg-indigo-50/60 text-indigo-700 font-semibold"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <HelpCircle size={18} className={sourceType === "faq" ? "text-indigo-600" : "text-gray-400"} />
            <span className="text-xs">FAQ / Text</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {sourceType === "file" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Document Name / Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sales Playbook Q3.pdf"
                required
                className="w-full px-3 py-2 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="mt-3 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50/50">
                <UploadCloud size={24} className="text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-600 font-medium">Click to select PDF or DOCX</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Maximum file size 25MB</p>
              </div>
            </div>
          )}

          {sourceType === "url" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Webpage or Sitemap URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://workpilot.io/docs"
                required
                className="w-full px-3 py-2 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Our crawler will parse sub-pages automatically and generate vector embeddings.
              </p>
            </div>
          )}

          {sourceType === "faq" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">FAQ Topic / Category</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Billing & Refund Policy"
                  required
                  className="w-full px-3 py-2 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Answers & Rules</label>
                <textarea
                  rows={3}
                  placeholder="Enter specific Q&A pairs or instructions..."
                  className="w-full p-2.5 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/20 transition-all disabled:opacity-60 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Embedding Vectors...</span>
                </>
              ) : (
                <span>Add Source</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
