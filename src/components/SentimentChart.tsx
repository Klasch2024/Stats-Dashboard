"use client";

import type { SentimentData } from "@/lib/queries";

interface Props {
  data: SentimentData[];
  onFilter?: (sentiment: string) => void;
}

const SENTIMENT_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; text: string; stroke: string }
> = {
  positive: {
    label: "Positive",
    color: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    text: "text-emerald-300",
    stroke: "#10b981",
  },
  negative: {
    label: "Negative",
    color: "bg-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/25",
    text: "text-rose-300",
    stroke: "#f43f5e",
  },
  neutral: {
    label: "Neutral",
    color: "bg-zinc-400",
    bg: "bg-zinc-700/40",
    border: "border-zinc-600/40",
    text: "text-zinc-400",
    stroke: "#52525b",
  },
  auto_reply: {
    label: "Auto-Reply",
    color: "bg-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    text: "text-amber-300",
    stroke: "#f59e0b",
  },
};

const DISPLAY_ORDER = ["positive", "negative", "neutral", "auto_reply"];

// Build SVG donut arcs from proportional data
function buildDonutArcs(
  segments: Array<{ pct: number; stroke: string }>
): Array<{ d: string; stroke: string; strokeDasharray: string; strokeDashoffset: string }> {
  const r = 32;
  const cx = 40;
  const cy = 40;
  const circumference = 2 * Math.PI * r;
  const gap = 2; // gap in px between segments

  let cumulative = 0;
  return segments.map(({ pct, stroke }) => {
    const segLen = (pct / 100) * circumference - gap;
    const offset = circumference - cumulative * circumference / 100;
    cumulative += pct;
    return {
      d: `M ${cx},${cy} m -${r},0 a ${r},${r} 0 1,1 0,0.0001`,
      stroke,
      strokeDasharray: `${Math.max(segLen, 0)} ${circumference}`,
      strokeDashoffset: `${offset}`,
    };
  });
}

export default function SentimentChart({ data, onFilter }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500 text-sm mt-4">
        No reply data for this period
      </div>
    );
  }

  // Sort by preferred display order
  const sorted = [...data].sort((a, b) => {
    const ai = DISPLAY_ORDER.indexOf(a.sentiment);
    const bi = DISPLAY_ORDER.indexOf(b.sentiment);
    if (ai === -1 && bi === -1) return a.sentiment.localeCompare(b.sentiment);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const max = Math.max(...sorted.map((d) => d.count), 1);

  // Build donut segments
  const r = 32;
  const cx = 40;
  const cy = 40;
  const circumference = 2 * Math.PI * r;
  const gapDeg = 3; // gap in px between arcs

  let cumulativePct = 0;
  const arcs = sorted.map((item) => {
    const cfg = SENTIMENT_CONFIG[item.sentiment] ?? {
      stroke: "#52525b",
      label: item.sentiment,
    };
    const pct = total > 0 ? (item.count / total) * 100 : 0;
    const arcLen = (pct / 100) * circumference - gapDeg;
    // SVG dashoffset: rotate to start at top (offset by -circumference/4)
    const startOffset = circumference - (cumulativePct / 100) * circumference + circumference / 4;
    cumulativePct += pct;
    return {
      stroke: cfg.stroke,
      strokeDasharray: `${Math.max(arcLen, 0).toFixed(2)} ${circumference.toFixed(2)}`,
      strokeDashoffset: `${startOffset.toFixed(2)}`,
    };
  });

  return (
    <div className="mt-4 space-y-4">
      {/* Donut ring */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="80" height="80" viewBox="0 0 80 80">
            {/* Track */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#27272a"
              strokeWidth={8}
            />
            {/* Segments */}
            {arcs.map((arc, i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={arc.stroke}
                strokeWidth={8}
                strokeDasharray={arc.strokeDasharray}
                strokeDashoffset={arc.strokeDashoffset}
                strokeLinecap="butt"
                style={{ transition: "stroke-dasharray 0.5s ease" }}
              />
            ))}
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-white leading-none">
              {total.toLocaleString()}
            </span>
            <span className="text-[9px] text-zinc-500 mt-0.5 leading-none">
              replies
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-3">
        {sorted.map((item) => {
          const cfg = SENTIMENT_CONFIG[item.sentiment] ?? {
            label: item.sentiment,
            color: "bg-zinc-500",
            bg: "bg-zinc-700/40",
            border: "border-zinc-600/40",
            text: "text-zinc-400",
            stroke: "#52525b",
          };
          const widthPct = (item.count / max) * 100;

          return (
            <div
              key={item.sentiment}
              onClick={() => onFilter?.(item.sentiment)}
              className={`rounded-lg border ${cfg.border} ${cfg.bg} px-4 py-3${
                onFilter
                  ? " cursor-pointer hover:brightness-110 transition-[filter]"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${cfg.text}`}>
                  {cfg.label}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {item.percentage.toFixed(1)}%
                  </span>
                  <span className="text-sm font-bold text-zinc-100 tabular-nums">
                    {item.count.toLocaleString("en-US")}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${cfg.color} rounded-full transition-all duration-500`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-600 pt-1 text-right">
        {total.toLocaleString("en-US")} total replies
      </p>
    </div>
  );
}
