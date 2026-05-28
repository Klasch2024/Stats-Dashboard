"use client";

import { useEffect, useState } from "react";
import type { CampaignListItem, SingleCampaignStats, StepData, SentimentData } from "@/lib/queries";

interface Props {
  range: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number, decimals = 1): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtPct(n: number): string {
  return `${fmt(n)}%`;
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${fmt(n / 1_000_000)}M`;
  if (n >= 1_000) return `${fmt(n / 1_000)}k`;
  return String(n);
}

const SENTIMENT_CONFIG: Record<
  string,
  { label: string; color: string; bar: string; pill: string }
> = {
  positive: {
    label: "Positive",
    color: "text-emerald-400",
    bar: "bg-emerald-500",
    pill: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  },
  negative: {
    label: "Negative",
    color: "text-rose-400",
    bar: "bg-rose-500",
    pill: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
  },
  neutral: {
    label: "Neutral",
    color: "text-zinc-400",
    bar: "bg-zinc-500",
    pill: "bg-zinc-700/60 text-zinc-400 ring-1 ring-zinc-600/40",
  },
  auto_reply: {
    label: "Auto-reply",
    color: "text-amber-400",
    bar: "bg-amber-500",
    pill: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function CampaignCardSkeleton() {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 animate-pulse">
      <div className="h-3.5 bg-zinc-800 rounded w-3/4 mb-2" />
      <div className="h-3 bg-zinc-800/60 rounded w-1/2 mb-3" />
      <div className="flex items-center justify-between">
        <div className="h-3 bg-zinc-800/60 rounded w-1/3" />
        <div className="h-5 w-14 bg-zinc-800 rounded-full" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Campaign list card
// ---------------------------------------------------------------------------

function CampaignCard({
  campaign,
  selected,
  onClick,
}: {
  campaign: CampaignListItem;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border transition-all duration-150 p-4 ${
        selected
          ? "bg-zinc-800 border-yellow-500/40"
          : "bg-zinc-900/60 border-zinc-800/60 hover:bg-zinc-800/80 hover:border-zinc-700/80"
      }`}
    >
      <p className="text-sm font-medium text-zinc-100 truncate mb-0.5">
        {campaign.name ?? (
          <span className="font-mono text-xs text-zinc-500">
            {campaign.id.slice(0, 16)}…
          </span>
        )}
      </p>
      <p className="text-xs text-zinc-500 mb-3">
        {fmtCount(campaign.sends)} sends · {campaign.replies} replies
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-600">Positive reply rate</span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            campaign.positiveReplyRate >= 5
              ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
              : campaign.positiveReplyRate >= 2
              ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
              : "bg-zinc-700/60 text-zinc-400 ring-1 ring-zinc-600/40"
          }`}
        >
          {fmtPct(campaign.positiveReplyRate)}
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "emerald" | "rose" | "amber" | "yellow";
}) {
  const accentClass =
    accent === "emerald"
      ? "text-emerald-400"
      : accent === "rose"
      ? "text-rose-400"
      : accent === "amber"
      ? "text-amber-400"
      : accent === "yellow"
      ? "text-yellow-400"
      : "text-zinc-100";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-xs text-zinc-500 mb-1.5">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accentClass}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step breakdown table
// ---------------------------------------------------------------------------

function StepBreakdownTable({ steps }: { steps: StepData[] }) {
  if (steps.length === 0) {
    return (
      <p className="text-xs text-zinc-600 italic">No step data available.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-2 pr-4 text-zinc-500 font-medium">Step</th>
            <th className="text-right py-2 pr-4 text-zinc-500 font-medium">Sends</th>
            <th className="text-right py-2 pr-4 text-zinc-500 font-medium">Opens</th>
            <th className="text-right py-2 pr-4 text-zinc-500 font-medium">Open%</th>
            <th className="text-right py-2 pr-4 text-zinc-500 font-medium">Replies</th>
            <th className="text-right py-2 text-zinc-500 font-medium">+Reply%</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s) => (
            <tr
              key={s.step}
              className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
            >
              <td className="py-2 pr-4 text-zinc-300 font-medium">#{s.step}</td>
              <td className="py-2 pr-4 text-right text-zinc-400 tabular-nums">
                {s.sends.toLocaleString()}
              </td>
              <td className="py-2 pr-4 text-right text-zinc-400 tabular-nums">
                {s.opens.toLocaleString()}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                <span
                  className={
                    s.openRate >= 30
                      ? "text-emerald-400"
                      : s.openRate >= 15
                      ? "text-amber-400"
                      : "text-zinc-500"
                  }
                >
                  {fmtPct(s.openRate)}
                </span>
              </td>
              <td className="py-2 pr-4 text-right text-zinc-400 tabular-nums">
                {s.replies.toLocaleString()}
              </td>
              <td className="py-2 text-right tabular-nums">
                <span
                  className={
                    s.positiveReplyRate >= 5
                      ? "text-emerald-400"
                      : s.positiveReplyRate >= 2
                      ? "text-amber-400"
                      : "text-zinc-500"
                  }
                >
                  {fmtPct(s.positiveReplyRate)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sentiment breakdown
// ---------------------------------------------------------------------------

function SentimentBreakdown({ data }: { data: SentimentData[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const DISPLAY_ORDER = ["positive", "negative", "auto_reply", "neutral"];
  const sorted = [...data].sort(
    (a, b) =>
      DISPLAY_ORDER.indexOf(a.sentiment) - DISPLAY_ORDER.indexOf(b.sentiment)
  );

  return (
    <div className="space-y-3">
      {sorted.map((d) => {
        const cfg = SENTIMENT_CONFIG[d.sentiment] ?? {
          label: d.sentiment,
          color: "text-zinc-400",
          bar: "bg-zinc-500",
          pill: "bg-zinc-700/60 text-zinc-400 ring-1 ring-zinc-600/40",
        };
        return (
          <div key={d.sentiment}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-medium ${cfg.color}`}>
                {cfg.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 tabular-nums">
                  {d.count}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.pill}`}>
                  {total > 0
                    ? fmtPct((d.count / total) * 100)
                    : "0.0%"}
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                style={{
                  width: total > 0 ? `${(d.count / total) * 100}%` : "0%",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail panel skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="h-full flex flex-col gap-6 p-6 animate-pulse">
      <div className="h-6 bg-zinc-800 rounded w-1/2" />
      <div className="grid grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-zinc-800 rounded-xl h-20" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="bg-zinc-800 rounded-xl" />
        <div className="bg-zinc-800 rounded-xl" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail panel
// ---------------------------------------------------------------------------

function CampaignDetail({
  campaignId,
  range,
}: {
  campaignId: string;
  range: string;
}) {
  const [stats, setStats] = useState<SingleCampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setStats(null);

    fetch(`/api/campaigns/${encodeURIComponent(campaignId)}?range=${range}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: SingleCampaignStats) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load campaign");
        setLoading(false);
      });
  }, [campaignId, range]);

  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-5 text-sm text-rose-300 max-w-sm text-center">
          Failed to load campaign stats: {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-800 shrink-0">
        <h2 className="text-base font-semibold text-zinc-100 truncate">
          {stats.campaignName ?? (
            <span className="font-mono text-sm text-zinc-500">
              {campaignId.slice(0, 20)}…
            </span>
          )}
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          {stats.emailSends} email · {stats.waSends} WhatsApp
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 px-6 py-5 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard
            label="Sends"
            value={stats.sends.toLocaleString()}
          />
          <KpiCard
            label="Replies"
            value={stats.replies.toLocaleString()}
          />
          <KpiCard
            label="Positive Reply Rate"
            value={fmtPct(stats.positiveReplyRate)}
            accent={stats.positiveReplyRate >= 5 ? "emerald" : stats.positiveReplyRate >= 2 ? "amber" : undefined}
          />
          <KpiCard
            label="Email Open Rate"
            value={fmtPct(stats.emailOpenRate)}
            accent={stats.emailOpenRate >= 30 ? "emerald" : stats.emailOpenRate >= 15 ? "amber" : undefined}
          />
          <KpiCard
            label="Bounce Rate"
            value={fmtPct(stats.bounceRate)}
            accent={stats.bounceRate >= 5 ? "rose" : undefined}
          />
        </div>

        {/* Step + Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Step Breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
              Step Breakdown
            </h3>
            <StepBreakdownTable steps={stats.stepBreakdown} />
          </div>

          {/* Sentiment */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
              Reply Sentiment
            </h3>
            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-3xl font-bold text-zinc-100 tabular-nums">
                {stats.replies}
              </span>
              <span className="text-xs text-zinc-500">total replies</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-zinc-800/60 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-emerald-400 tabular-nums">
                  {stats.positiveReplies}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Positive</p>
              </div>
              <div className="bg-zinc-800/60 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-rose-400 tabular-nums">
                  {stats.negativeReplies}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Negative</p>
              </div>
              <div className="bg-zinc-800/60 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-amber-400 tabular-nums">
                  {stats.autoReplies}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Auto-reply</p>
              </div>
            </div>
            <SentimentBreakdown data={stats.sentimentBreakdown} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CampaignsView({ range }: Props) {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/campaigns?range=${range}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: CampaignListItem[]) => {
        setCampaigns(data);
        setLoading(false);
        // Auto-select first campaign
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load campaigns");
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Left panel — campaign list */}
      <div className={`${mobileView === "detail" ? "hidden md:flex" : "flex"} md:w-72 w-full shrink-0 flex-col min-h-0`}>
        <div className="flex items-center justify-between mb-3 shrink-0">
          <p className="text-xs text-zinc-500">
            {loading ? "Loading…" : `${campaigns.length} campaigns`}
          </p>
        </div>

        {error ? (
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-4 text-xs text-rose-300">
            {error}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading
              ? [...Array(6)].map((_, i) => <CampaignCardSkeleton key={i} />)
              : campaigns.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    selected={selectedId === c.id}
                    onClick={() => { setSelectedId(c.id); setMobileView("detail"); }}
                  />
                ))}
          </div>
        )}
      </div>

      {/* Right panel — detail */}
      <div className={`${mobileView === "list" ? "hidden md:flex" : "flex"} flex-1 flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden min-h-0`}>
        {/* Mobile back button */}
        <button
          onClick={() => setMobileView("list")}
          className="md:hidden flex items-center gap-2 px-4 py-3 text-xs text-zinc-400 border-b border-zinc-800 shrink-0"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" /></svg>
          All campaigns
        </button>
        <div className="flex-1 overflow-hidden min-h-0">
          {selectedId ? (
            <CampaignDetail campaignId={selectedId} range={range} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-zinc-600">
                    <path d="M2 4.5A2.5 2.5 0 014.5 2h11A2.5 2.5 0 0118 4.5v11a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 012 15.5v-11zM4.5 4a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z" />
                    <path d="M6 7h8M6 10h8M6 13h5" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-500">Select a campaign</p>
                <p className="text-xs text-zinc-700 mt-1">Choose a campaign from the list to view its stats</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
