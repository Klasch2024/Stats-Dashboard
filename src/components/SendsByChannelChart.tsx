"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { SendsByChannelDataPoint } from "@/lib/queries";

interface Props {
  data: SendsByChannelDataPoint[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const email = payload.find((p) => p.name === "email")?.value ?? 0;
  const whatsapp = payload.find((p) => p.name === "whatsapp")?.value ?? 0;
  const total = email + whatsapp;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1.5">{label}</p>
      <p className="font-semibold" style={{ color: "#eab308" }}>
        Email: {email.toLocaleString()}
      </p>
      <p className="font-semibold mt-0.5" style={{ color: "#8b5cf6" }}>
        WhatsApp: {whatsapp.toLocaleString()}
      </p>
      <div className="border-t border-zinc-700 mt-2 pt-1.5">
        <p className="text-zinc-500">Total: {total.toLocaleString()}</p>
      </div>
    </div>
  );
}

export default function SendsByChannelChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
        No data for this period
      </div>
    );
  }

  const totalEmail = data.reduce((sum, d) => sum + d.email, 0);
  const totalWhatsApp = data.reduce((sum, d) => sum + d.whatsapp, 0);

  return (
    <div>
      {/* Summary row */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        <span>
          <span className="text-zinc-500">Email </span>
          <span className="font-semibold text-yellow-300">
            {totalEmail.toLocaleString()}
          </span>
        </span>
        <span>
          <span className="text-zinc-500">WhatsApp </span>
          <span className="font-semibold" style={{ color: "#8b5cf6" }}>
            {totalWhatsApp.toLocaleString()}
          </span>
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          barSize={14}
          barGap={4}
          margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
        >
          <CartesianGrid stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#71717a", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontSize: "11px",
              color: "#71717a",
              paddingTop: "12px",
            }}
          />
          <Bar
            dataKey="email"
            name="email"
            fill="#eab308"
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="whatsapp"
            name="whatsapp"
            fill="#8b5cf6"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
