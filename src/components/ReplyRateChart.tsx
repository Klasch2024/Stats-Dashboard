"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ReplyRateDataPoint } from "@/lib/queries";

interface Props {
  data: ReplyRateDataPoint[];
}

function shortenWeek(week: string): string {
  // Handles formats like "2024-W03" → "W03", or "W03" → "W03"
  const match = week.match(/W\d+/);
  return match ? match[0] : week;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { sends: number; week: string } }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const rate = payload[0]?.value ?? 0;
  const sends = payload[0]?.payload?.sends ?? 0;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="font-semibold" style={{ color: "#eab308" }}>
        {rate.toFixed(2)}% reply rate
      </p>
      <p className="text-zinc-500 mt-0.5">{sends.toLocaleString()} sends</p>
    </div>
  );
}

export default function ReplyRateChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
        No data for this period
      </div>
    );
  }

  const avg =
    data.reduce((sum, d) => sum + d.positiveReplyRate, 0) / data.length;
  const peak = Math.max(...data.map((d) => d.positiveReplyRate));

  const chartData = data.map((d) => ({
    week: shortenWeek(d.week),
    positiveReplyRate: d.positiveReplyRate,
    sends: d.sends,
  }));

  return (
    <div>
      {/* Summary row */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-4">
          <span>
            <span className="text-zinc-500">Avg </span>
            <span className="font-semibold text-yellow-300">
              {avg.toFixed(2)}%
            </span>
          </span>
          <span>
            <span className="text-zinc-500">Peak </span>
            <span className="font-semibold text-emerald-300">
              {peak.toFixed(2)}%
            </span>
          </span>
        </div>
        <span className="text-zinc-500">{data.length} weeks</span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
        >
          <defs>
            <linearGradient id="replyRateGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eab308" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: "#71717a", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => v + "%"}
            tick={{ fill: "#71717a", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="positiveReplyRate"
            stroke="#eab308"
            strokeWidth={2}
            fill="url(#replyRateGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#eab308", stroke: "#09090b", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
