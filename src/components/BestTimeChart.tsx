"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { DayOfWeekData, HourData } from "@/lib/queries";

interface Props {
  dayData: DayOfWeekData[];
  hourData: HourData[];
}

function getBarColor(rate: number, maxRate: number): string {
  if (maxRate === 0) return "#3f3f46";
  if (rate >= maxRate * 0.8) return "#eab308";
  if (rate >= maxRate * 0.5) return "#ca8a04";
  if (rate > 0) return "#78716c";
  return "#3f3f46";
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: { sends?: number; day?: string; hour?: string };
  }>;
  label?: string;
}

function DayTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const rate = payload[0]?.value ?? 0;
  const sends = payload[0]?.payload?.sends ?? 0;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="font-semibold" style={{ color: "#eab308" }}>
        {rate.toFixed(1)}% reply rate
      </p>
      <p className="text-zinc-500 mt-0.5">{sends.toLocaleString()} sends</p>
    </div>
  );
}

function HourTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const rate = payload[0]?.value ?? 0;
  const sends = payload[0]?.payload?.sends ?? 0;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="font-semibold" style={{ color: "#eab308" }}>
        {rate.toFixed(1)}% reply rate
      </p>
      <p className="text-zinc-500 mt-0.5">{sends.toLocaleString()} sends</p>
    </div>
  );
}

export default function BestTimeChart({ dayData, hourData }: Props) {
  const maxDayRate = Math.max(...dayData.map((d) => d.positiveReplyRate), 0);
  const maxHourRate = Math.max(...hourData.map((h) => h.positiveReplyRate), 0);

  const bestDay = dayData.find((d) => d.positiveReplyRate === maxDayRate);
  const bestHour = hourData.find((h) => h.positiveReplyRate === maxHourRate);

  return (
    <div className="space-y-8">
      {/* Day of Week */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            By Day of Week
          </p>
          {bestDay && maxDayRate > 0 && (
            <span className="text-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-medium px-2 py-0.5 rounded-full">
              Best: {bestDay.day} ({maxDayRate.toFixed(1)}%)
            </span>
          )}
        </div>
        {dayData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
            No data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={dayData}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="day"
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
              <Tooltip content={<DayTooltip />} />
              <Bar dataKey="positiveReplyRate" radius={[3, 3, 0, 0]}>
                {dayData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={getBarColor(entry.positiveReplyRate, maxDayRate)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Hour of Day */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            By Hour of Day (UTC)
          </p>
          {bestHour && maxHourRate > 0 && (
            <span className="text-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-medium px-2 py-0.5 rounded-full">
              Best: {bestHour.hour} ({maxHourRate.toFixed(1)}%)
            </span>
          )}
        </div>
        {hourData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
            No data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={hourData}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="hour"
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
              <Tooltip content={<HourTooltip />} />
              <Bar dataKey="positiveReplyRate" radius={[3, 3, 0, 0]}>
                {hourData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={getBarColor(entry.positiveReplyRate, maxHourRate)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
