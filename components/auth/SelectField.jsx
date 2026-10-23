"use client";

import { Building2, Briefcase, ChevronDown } from "lucide-react";

const iconMap = {
  building: Building2,
  briefcase: Briefcase,
};

export default function SelectField({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select option",
  icon = "building",
  required = true,
}) {
  const Icon = iconMap[icon] || Building2;

  return (
    <div className="space-y-1.5 text-left">
      <label htmlFor={id} className="block text-xs font-semibold text-gray-800">
        {label}
      </label>

      <div className="relative">
        {/* Left Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Icon size={14} />
        </div>

        {/* Select element */}
        <select
          id={id}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full pl-8.5 pr-8 py-2.5 text-xs text-gray-900 bg-white border border-gray-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer hover:border-gray-300 font-medium"
        >
          <option value="" disabled className="text-gray-400">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>

        {/* Dropdown Chevron */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
          <ChevronDown size={13} />
        </div>
      </div>
    </div>
  );
}
