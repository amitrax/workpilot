"use client";

import { useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { ChevronDown, TrendingUp, Users, PieChart as PieIcon } from "lucide-react";

// ── Custom tooltips ──────────────────────────────────────────────────────────
const PieTip = ({ active, payload }) =>
  active && payload?.length ? (
    <div className="bg-white border border-gray-100 shadow-lg rounded-lg px-3 py-2 text-sm z-50">
      <span className="font-semibold text-gray-700">{payload[0].name}: </span>
      <span className="text-gray-500 font-medium">
        {payload[0].value}% ({payload[0].payload.count} customer{payload[0].payload.count === 1 ? "" : "s"})
      </span>
    </div>
  ) : null;

const AreaTip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div className="bg-white border border-gray-100 shadow-lg rounded-lg px-3 py-2 text-sm z-50">
      <p className="font-semibold text-gray-700 mb-0.5">{label}</p>
      <span className="text-indigo-600 font-bold">
        {payload[0].value.toLocaleString()} customer{payload[0].value === 1 ? "" : "s"}
      </span>
    </div>
  ) : null;

// ── Segment Colors ───────────────────────────────────────────────────────────
const SEGMENT_COLORS = {
  Enterprise: "#6366f1",
  SMB:        "#22c55e",
  Startup:    "#f59e0b",
  Other:      "#94a3b8",
};

// ── Source Colors ────────────────────────────────────────────────────────────
const SOURCE_COLORS = {
  WhatsApp:       "#22c55e",
  Website:        "#6366f1",
  Referral:       "#8b5cf6",
  "Email Campaign":"#f59e0b",
  Instagram:      "#ec4899",
  Others:         "#94a3b8",
};

// ── 1. Customers by Segment (Donut) ──────────────────────────────────────────
function SegmentChart({ customers = [] }) {
  const { segmentData, total } = useMemo(() => {
    const totalCount = customers.length;
    const counts = {
      Enterprise: 0,
      SMB: 0,
      Startup: 0,
      Other: 0,
    };

    customers.forEach((c) => {
      const seg = c.segment;
      if (counts[seg] !== undefined) {
        counts[seg]++;
      } else {
        counts.Other++;
      }
    });

    const data = Object.entries(counts).map(([label, count]) => {
      const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      return {
        name: label,
        label,
        count,
        value: pct,
        color: SEGMENT_COLORS[label] || "#94a3b8",
      };
    });

    return { segmentData: data, total: totalCount };
  }, [customers]);

  const hasData = total > 0;
  const pieDisplayData = hasData
    ? segmentData.filter((s) => s.count > 0)
    : [{ name: "No Customers", value: 100, count: 0, color: "#f1f5f9" }];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1 min-w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Customers by Segment</h3>
        <span className="text-xs text-gray-400 font-medium">{total} total</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut Chart */}
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={150} height={150}>
            <PieChart>
              <Pie
                data={pieDisplayData}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={70}
                paddingAngle={hasData ? 2 : 0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {pieDisplayData.map((e, i) => (
                  <Cell key={`cell-${i}`} fill={e.color} />
                ))}
              </Pie>
              {hasData && <Tooltip content={<PieTip />} />}
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-gray-900">{total.toLocaleString()}</span>
            <span className="text-[11px] text-gray-400">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5 min-w-0">
          {segmentData.map((s, i) => (
            <div key={i} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: s.color }}
                  />
                  <span className="text-xs font-medium text-gray-600 truncate">{s.label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-800 ml-2">{s.value}%</span>
              </div>
              <p className="text-[11px] text-gray-400 pl-4.5">
                {s.count.toLocaleString()} customer{s.count === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 2. Customers by Source (Horizontal Bar) ───────────────────────────────────
function SourceChart({ customers = [] }) {
  const { sourceData, total } = useMemo(() => {
    const totalCount = customers.length;
    const counts = {
      WhatsApp: 0,
      Website: 0,
      Referral: 0,
      "Email Campaign": 0,
      Others: 0,
    };

    customers.forEach((c) => {
      const src = c.source;
      if (counts[src] !== undefined) {
        counts[src]++;
      } else if (src === "Email" || src === "email_campaign") {
        counts["Email Campaign"]++;
      } else {
        counts.Others++;
      }
    });

    const data = Object.entries(counts).map(([label, count]) => {
      const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      return {
        label,
        count,
        value: pct,
        color: SOURCE_COLORS[label] || "#94a3b8",
      };
    });

    return { sourceData: data, total: totalCount };
  }, [customers]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1 min-w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Customers by Source</h3>
        <span className="text-xs text-gray-400 font-medium">Real-time attribution</span>
      </div>

      <div className="space-y-3">
        {sourceData.map((s, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-600">{s.label}</span>
              <span className="font-semibold text-gray-800">
                {s.value}% <span className="text-gray-400 font-normal">({s.count})</span>
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${s.value}%`,
                  background: s.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 3. Customer Growth (Area Chart) ──────────────────────────────────────────
function GrowthChart({ customers = [] }) {
  const { growthData, maxVal } = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      months.push({
        label: monthNames[d.getMonth()],
        endOfMonth,
      });
    }

    let peak = 0;
    const data = months.map((m) => {
      const count = customers.filter((c) => {
        const createdDate = new Date(c.createdAt || c.customerSince || now);
        return createdDate <= m.endOfMonth;
      }).length;

      if (count > peak) peak = count;
      return {
        month: m.label,
        customers: count,
      };
    });

    return { growthData: data, maxVal: peak };
  }, [customers]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1 min-w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Customer Growth</h3>
          <p className="text-[11px] text-gray-400">Cumulative accounts over time</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1 bg-gray-50/50">
          Last 6 Months
        </span>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={growthData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            allowDecimals={false}
            domain={[0, maxVal > 4 ? "auto" : 4]}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v)))}
          />
          <Tooltip content={<AreaTip />} />
          <Area
            type="monotone"
            dataKey="customers"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#custGrad)"
            dot={{ fill: "#6366f1", r: 3, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * AnalyticsSection — Three real-time customer analytics cards:
 * 1. Segment donut breakdown
 * 2. Source attribution horizontal bars
 * 3. Monthly growth trendline
 */
export default function AnalyticsSection({ customers = [] }) {
  return (
    <div className="flex gap-4 mt-6 flex-wrap">
      <SegmentChart customers={customers} />
      <SourceChart customers={customers} />
      <GrowthChart customers={customers} />
    </div>
  );
}
