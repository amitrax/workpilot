"use client";

import { MessageSquare, Mail, Calendar, Video, Bot, Globe, Shield, RefreshCw, Sliders, Zap, Send, PhoneCall } from "lucide-react";

export function IntegrationLogo({ name = "", size = 20, className = "" }) {
  const n = name.toLowerCase();

  if (n.includes("whatsapp")) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs ${className}`}>
        <PhoneCall size={size} />
      </div>
    );
  }

  if (n.includes("gmail") || n.includes("email") || n.includes("smtp")) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 border border-red-100 ${className}`}>
        <Mail size={size} />
      </div>
    );
  }

  if (n.includes("calendar") || n.includes("gcal") || n.includes("outlook")) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100 ${className}`}>
        <Calendar size={size} />
      </div>
    );
  }

  if (n.includes("slack")) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100 ${className}`}>
        <MessageSquare size={size} />
      </div>
    );
  }

  if (n.includes("teams")) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100 ${className}`}>
        <MessageSquare size={size} />
      </div>
    );
  }

  if (n.includes("zoom")) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 border border-sky-100 ${className}`}>
        <Video size={size} />
      </div>
    );
  }

  if (n.includes("calendly")) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0 border border-blue-100 ${className}`}>
        <Calendar size={size} />
      </div>
    );
  }

  if (n.includes("salesforce") || n.includes("hubspot") || n.includes("pipedrive") || n.includes("zoho")) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100 ${className}`}>
        <Globe size={size} />
      </div>
    );
  }

  if (n.includes("stripe") || n.includes("razorpay") || n.includes("paypal")) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 border border-teal-100 ${className}`}>
        <Zap size={size} />
      </div>
    );
  }

  if (n.includes("telegram")) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center flex-shrink-0 border border-sky-100 ${className}`}>
        <Send size={size} />
      </div>
    );
  }

  return (
    <div className={`w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100 ${className}`}>
      <Bot size={size} />
    </div>
  );
}
