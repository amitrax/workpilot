"use client";

import { useState } from "react";
import { Mail, Lock, User, Building2, Eye, EyeOff } from "lucide-react";

const iconMap = {
  email: Mail,
  password: Lock,
  user: User,
  building: Building2,
};

export default function InputField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon = "email",
  required = true,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const Icon = iconMap[icon] || Mail;

  const isPasswordType = type === "password";
  const currentInputType = isPasswordType ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1.5 text-left">
      <label htmlFor={id} className="block text-xs font-semibold text-gray-800">
        {label}
      </label>

      <div className="relative">
        {/* Left Icon */}
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <Icon size={15} />
        </div>

        {/* Input */}
        <input
          id={id}
          type={currentInputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full pl-9.5 pr-10 py-2.5 text-xs text-gray-900 bg-white border border-gray-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 hover:border-gray-300"
        />

        {/* Password Eye Toggle */}
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}
