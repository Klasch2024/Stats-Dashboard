"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { StepData } from "@/lib/queries";

interface Props {
  data: StepData[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload: StepData & { label: string };
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1.5 font-medium">{label}</p>
      <p className="text-zinc-300">
        Sends:{" "}
        <span className="font-semibold">{d.sends.toLocaleString()}</span>
      </p>
      <p className="text-sky-400 mt-0.5">
        Opens:{" "}
        <span className="font-semibold">
          {d.opens.toLocaleString()} ({d.openRate.toFixed(1)}%)
        </span>
      </p>
      <p className="text-zinc-300 mt-0.5">
        Pos. Replies:{" "}
        <span className="font-semibold">
          {d.positiveReplies.toLocaleString()}
        </span>
      </p>
      <p className="font-semibold mt-0.5" style={{ color: "#eab308" }}>
        Pos. Reply Rate: {d.positiveReplyRate.toFixed(1)}%
      </p>
    </div>
  );
}

export default function StepBreakdownChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
        No data for this period
      </div>
    );
  }

  const bestStep = data.reduce(
    (best, d) => (d.positiveReplyRate > best.positiveReplyRate ? d : best),
    data[0]
  );
  const worstStep = data.reduce(
    (worst, d) =>
      d.positiveReplyRate < worst.positiveReplyRate ? d : worst,
    data[0]
  );

  const chartData = data.map((d) => ({
    ...d,
    label: `Step ${d.step}`,
  }));

  return (
    <div>
      {/* Summary row */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        {bestStep && bestStep.positiveReplyRate > 0 && (
          <span>
            <span className="text-zinc-500">Best </span>
            <span className="font-semibold text-emerald-300">
              Step {bestStep.step} ({bestStep.positiveReplyRate.toFixed(1)}%)
            </span>
          </span>
        )}
        {worstStep && data.length > 1 && (
          <span>
            <span className="text-zinc-500">Worst </span>
            <span className="font-semibold text-rose-300">
              Step {worstStep.step} ({worstStep.positiveReplyRate.toFixed(1)}%)
            </span>
          </span>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart
          data={chartData}
          margin={{ top: 4, right: 40, left: -16, bottom: 0 }}
        >
          <CartesianGrid stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#71717a", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#71717a", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v) => v + "%"}
            tick={{ fill: "#71717a", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            yAxisId="left"
            dataKey="sends"
            fill="#3f3f46"
            radius={[3, 3, 0, 0]}
            barSize={18}
            name="sends"
          />
          <Bar
            yAxisId="left"
            dataKey="opens"
            fill="rgba(14,165,233,0.6)"
            radius={[3, 3, 0, 0]}
            barSize={18}
            name="opens"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="positiveReplyRate"
            stroke="#eab308"
            strokeWidth={2}
            dot={{ r: 4, fill: "#eab308", stroke: "#09090b", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "#eab308", stroke: "#09090b", strokeWidth: 2 }}
            name="positiveReplyRate"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
