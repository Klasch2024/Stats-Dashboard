"use client";

import type { FunnelData } from "@/lib/queries";

interface Props {
  data: FunnelData;
}

const STAGES = [
  {
    key: "sent" as keyof FunnelData,
    label: "Sent",
    color: "bg-yellow-400",
    textColor: "text-yellow-300",
    borderColor: "border-yellow-500/30",
  },
  {
    key: "opened" as keyof FunnelData,
    label: "Opened / Delivered",
    color: "bg-violet-500",
    textColor: "text-violet-300",
    borderColor: "border-violet-500/30",
  },
  {
    key: "replied" as keyof FunnelData,
    label: "Replied",
    color: "bg-emerald-500",
    textColor: "text-emerald-300",
    borderColor: "border-emerald-500/30",
  },
  {
    key: "positiveReplied" as keyof FunnelData,
    label: "Positive Reply",
    color: "bg-emerald-400",
    textColor: "text-emerald-200",
    borderColor: "border-emerald-400/30",
  },
] as const;

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function pctOfTotal(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

function conversionRate(from: number, to: number): string {
  if (from === 0) return "0%";
  return `${((to / from) * 100).toFixed(1)}%`;
}

export default function FunnelChart({ data }: Props) {
  const values: number[] = [
    data.sent,
    data.opened,
    data.replied,
    data.positiveReplied,
  ];
  const max = Math.max(data.sent, 1);
  const overallConversion =
    data.sent > 0
      ? ((data.positiveReplied / data.sent) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-3 mt-4">
      {STAGES.map((stage, i) => {
        const value = values[i];
        const widthPct = Math.max((value / max) * 100, 0);
        const prevValue = i > 0 ? values[i - 1] : null;

        return (
          <div key={stage.key}>
            {/* Conversion arrow between stages */}
            {prevValue !== null && (
              <div className="flex items-center gap-2 mb-2 ml-3">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-px h-3 bg-zinc-700" />
                  <span className="text-emerald-500 text-xs leading-none">&#8964;</span>
                </div>
                <span className="text-xs text-zinc-500">
                  <span className="text-emerald-400 font-medium">
                    {conversionRate(prevValue, value)}
                  </span>{" "}
                  conversion
                </span>
              </div>
            )}

            {/* Stage bar */}
            <div
              className={`rounded-lg border ${stage.borderColor} bg-zinc-800/40 px-4 py-3`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${stage.textColor}`}>
                  {stage.label}
                </span>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {pctOfTotal(value, data.sent)} of total
                  </span>
                  <span className="text-sm font-bold text-zinc-100 tabular-nums">
                    {fmt(value)}
                  </span>
                </div>
              </div>
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Overall conversion mini-stat */}
      <div className="mt-4 pt-3 border-t border-zinc-800 text-xs text-center">
        <span className="text-zinc-500">Overall conversion </span>
        <span className="font-bold text-yellow-400">{overallConversion}%</span>
        <span className="text-zinc-600 ml-1">(sent → positive reply)</span>
      </div>
    </div>
  );
}
