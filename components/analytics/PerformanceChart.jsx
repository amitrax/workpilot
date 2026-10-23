"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function PerformanceChart({ data = [] }) {
  const [period, setPeriod] = useState("Daily");

  const metrics = [
    { key: "revenue", label: "Revenue", color: "#6366f1" },
    { key: "leads", label: "Leads", color: "#10b981" },
    { key: "appointments", label: "Appointments", color: "#3b82f6" },
    { key: "customers", label: "Customers", color: "#f59e0b" },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
          Performance Overview
        </h3>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() =>
              setPeriod(period === "Daily" ? "Weekly" : period === "Weekly" ? "Monthly" : "Daily")
            }
            className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
          >
            <span>{period}</span>
            <ChevronDown size={12} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Legend Row */}
      <div className="flex items-center gap-4 flex-wrap mb-4 text-xs font-medium">
        {metrics.map((m) => (
          <div key={m.key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
            <span className="text-gray-600">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Recharts Multi-line Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickFormatter={(v) => `${v / 1000}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#6366f1" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="leads"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#10b981" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="appointments"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#3b82f6" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="customers"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#f59e0b" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
