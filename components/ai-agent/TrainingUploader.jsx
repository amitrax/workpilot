"use client";

import { useState, useRef } from "react";
import { UploadCloud, Check, FileUp } from "lucide-react";

export default function TrainingUploader({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      if (onUploadSuccess) {
        await onUploadSuccess({
          title: file.name,
          type: file.type.includes("pdf") ? "pdf" : "document",
          file_size: file.size,
        });
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const checklistItems = [
    { title: "Product information", desc: "Catalogs, features, and release notes" },
    { title: "Company policies", desc: "Terms of service, refund rules, and SLAs" },
    { title: "FAQs & help articles", desc: "Standard customer queries and troubleshooting" },
    { title: "Custom knowledge", desc: "Raw text snippets, API specs, and URLs" },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.docx,.txt,.csv"
      />

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-base font-bold text-gray-900 tracking-tight">
          Training Data & Customization
        </h2>
        <p className="text-gray-500 text-xs mt-0.5">
          Improve your AI's performance with additional training data.
        </p>
      </div>

      {/* Split: Left Drag & Drop Box, Right Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left Drag & Drop Upload Zone */}
        <div className="md:col-span-7">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file && onUploadSuccess) {
                setUploading(true);
                onUploadSuccess({
                  title: file.name,
                  type: file.type.includes("pdf") ? "pdf" : "document",
                  file_size: file.size,
                }).finally(() => setUploading(false));
              }
            }}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isDragging
                ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]"
                : "border-indigo-200/80 bg-indigo-50/20 hover:bg-indigo-50/40 hover:border-indigo-300"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2.5 shadow-xs">
              <UploadCloud size={20} className={uploading ? "animate-bounce" : ""} />
            </div>

            <h4 className="text-xs font-bold text-gray-900">Upload Documents</h4>
            <p className="text-[11px] text-gray-500 mt-0.5 mb-3.5">
              PDF, DOCX, TXT, or add website URLs
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/20 transition-all disabled:opacity-60 cursor-pointer"
            >
              {uploading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Embeddings...</span>
                </>
              ) : (
                <>
                  <FileUp size={13} />
                  <span>Choose Files</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Checklist */}
        <div className="md:col-span-5 space-y-2.5">
          {checklistItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={11} className="stroke-[3]" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-800 leading-tight">
                  {item.title}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
