"use client";

import { ShieldCheck } from "lucide-react";

export default function SecurityBadge() {
  return (
    <div className="flex items-center gap-3 pt-4 border-t border-indigo-100/50">
      <div className="w-9 h-9 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center flex-shrink-0 shadow-2xs border border-purple-200/50">
        <ShieldCheck size={18} />
      </div>
      <div>
        <h5 className="text-xs font-bold text-gray-900 leading-tight">
          Enterprise Grade Security
        </h5>
        <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
          Your data is encrypted and 100% secure with us.
        </p>
      </div>
    </div>
  );
}
