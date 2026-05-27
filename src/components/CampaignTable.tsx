"use client";

import { useState } from "react";
import type { CampaignRow } from "@/lib/queries";

interface Props {
  data: CampaignRow[];
}

type SortKey = keyof Omit<CampaignRow, "campaignId" | "channel">;

const CHANNEL_BADGE: Record<string, string> = {
  email: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  whatsapp: "bg-violet-500/15 text-violet-300 border-violet-500/25",
};

function ChannelBadge({ channel }: { channel: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${
        CHANNEL_BADGE[channel] ?? "bg-zinc-700 text-zinc-300 border-zinc-600"
      }`}
    >
      {channel}
    </span>
  );
}

function pct(v: number) {
  return `${v.toFixed(2)}%`;
}

export default function CampaignTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("sends");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<CampaignRow | null>(null);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...data].sort((a, b) => {
    const dir = sortDir === "desc" ? -1 : 1;
    return ((a[sortKey] as number) - (b[sortKey] as number)) * dir;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <span className="text-zinc-600 ml-1">↕</span>;
    return (
      <span className="text-yellow-400 ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>
    );
  }

  function Th({
    col,
    label,
    align = "right",
  }: {
    col: SortKey;
    label: string;
    align?: "left" | "right";
  }) {
    return (
      <th
        className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 cursor-pointer select-none hover:text-zinc-300 transition-colors ${
          align === "right" ? "text-right" : "text-left"
        }`}
        onClick={() => handleSort(col)}
      >
        {label}
        <SortIcon col={col} />
      </th>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/80 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-left">
                Campaign
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-left">
                Channel
              </th>
              <Th col="sends" label="Sends" />
              <Th col="replies" label="Replies" />
              <Th col="positiveReplies" label="Pos. Replies" />
              <Th col="positiveReplyRate" label="Reply Rate" />
              <Th col="openRate" label="Open / Read %" />
              <Th col="bounceRate" label="Bounce %" />
              <Th col="unsubscribes" label="Unsubs" />
              <Th col="unsubscribeRate" label="Unsub %" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-10 text-center text-zinc-500"
                >
                  No campaign data for this period
                </td>
              </tr>
            )}
            {sorted.map((row) => (
              <tr
                key={`${row.campaignId}-${row.channel}`}
                onClick={() =>
                  setSelected(selected?.campaignId === row.campaignId && selected?.channel === row.channel ? null : row)
                }
                className={`cursor-pointer transition-colors ${
                  selected?.campaignId === row.campaignId &&
                  selected?.channel === row.channel
                    ? "bg-yellow-500/10"
                    : "hover:bg-zinc-800/50"
                }`}
              >
                <td className="px-4 py-3 max-w-[220px]">
                  {row.campaignName ? (
                    <div>
                      <p className="text-sm text-zinc-100 truncate font-medium">{row.campaignName}</p>
                      <p className="font-mono text-[10px] text-zinc-600 truncate mt-0.5">
                        {row.campaignId.slice(0, 8)}…{row.campaignId.slice(-6)}
                      </p>
                    </div>
                  ) : (
                    <span className="font-mono text-xs text-zinc-400">
                      {row.campaignId.slice(0, 8)}…{row.campaignId.slice(-6)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ChannelBadge channel={row.channel} />
                </td>
                <td className="px-4 py-3 text-right text-zinc-200 tabular-nums">
                  {row.sends.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-zinc-200 tabular-nums">
                  {row.replies.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-emerald-400 tabular-nums font-medium">
                  {row.positiveReplies.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <RateCell value={row.positiveReplyRate} thresholds={[2, 5]} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <RateCell value={row.openRate} thresholds={[20, 40]} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <RateCell value={row.bounceRate} thresholds={[2, 5]} invert />
                </td>
                <td className="px-4 py-3 text-right text-zinc-200 tabular-nums">
                  {row.unsubscribes.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <RateCell value={row.unsubscribeRate} thresholds={[0.5, 2]} invert />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-200">
              {selected.campaignName ?? (
                <span className="font-mono text-yellow-300">{selected.campaignId}</span>
              )}
              {selected.campaignName && (
                <span className="ml-2 font-mono text-[11px] text-zinc-600 font-normal">
                  {selected.campaignId.slice(0, 8)}…{selected.campaignId.slice(-6)}
                </span>
              )}
            </h3>
            <button
              onClick={() => setSelected(null)}
              className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Channel" value={selected.channel} />
            <Stat label="Total Sends" value={selected.sends.toLocaleString()} />
            <Stat label="Replies" value={selected.replies.toLocaleString()} />
            <Stat
              label="Positive Replies"
              value={selected.positiveReplies.toLocaleString()}
            />
            <Stat
              label="Positive Reply Rate"
              value={pct(selected.positiveReplyRate)}
              highlight
            />
            <Stat label="Open / Read Rate" value={pct(selected.openRate)} />
            <Stat label="Bounce Rate" value={pct(selected.bounceRate)} />
            <Stat label="Unsubscribes" value={selected.unsubscribes.toLocaleString()} />
            <Stat label="Unsub Rate" value={pct(selected.unsubscribeRate)} />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-zinc-800/60 rounded-lg px-4 py-3">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p
        className={`text-sm font-semibold ${
          highlight ? "text-yellow-300" : "text-zinc-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/** Colour-codes a rate value against two thresholds */
function RateCell({
  value,
  thresholds,
  invert = false,
}: {
  value: number;
  thresholds: [number, number];
  invert?: boolean;
}) {
  const [low, high] = thresholds;
  let cls = "text-zinc-400";

  if (!invert) {
    if (value >= high) cls = "text-emerald-400 font-semibold";
    else if (value >= low) cls = "text-amber-400";
    else cls = "text-zinc-500";
  } else {
    // For bounce rate: low is good, high is bad
    if (value <= low) cls = "text-emerald-400 font-semibold";
    else if (value <= high) cls = "text-amber-400";
    else cls = "text-rose-400 font-semibold";
  }

  return <span className={cls}>{value.toFixed(2)}%</span>;
}
