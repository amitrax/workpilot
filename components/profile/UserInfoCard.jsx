"use client";

import { Mail, Phone, MapPin, Calendar, Camera } from "lucide-react";

export default function UserInfoCard({ profile }) {
  const initials = (profile?.name || "User")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center sm:items-start gap-6">
      {/* Avatar Container with Camera Icon */}
      <div className="relative flex-shrink-0">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-700 p-1 shadow-md shadow-indigo-500/20 flex items-center justify-center">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
          )}
        </div>

        {/* Change Photo Overlay Button */}
        <label
          onClick={() => alert("Avatar image upload requires Supabase Storage bucket integration.")}
          className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center cursor-pointer shadow-sm hover:bg-indigo-700 transition-colors border-2 border-white"
          title="Change Avatar"
        >
          <Camera size={13} />
        </label>
      </div>

      {/* User Details */}
      <div className="flex-1 text-center sm:text-left space-y-3">
        {/* Name and Role Badge */}
        <div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {profile?.name || "User"}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
              {profile?.role || "Member"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{profile?.bio || "Workspace member"}</p>
        </div>

        {/* 4 Metadata Icons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{profile?.email || "No email"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400 flex-shrink-0" />
            <span>{profile?.phone || "Not set"}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
            <span>{profile?.location || "Not set"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400 flex-shrink-0" />
            <span>Joined on {profile?.joinedDate || "Recently"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
