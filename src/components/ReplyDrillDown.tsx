"use client";

import { useEffect, useState } from "react";
import type { ReplyRow } from "@/lib/queries";

interface Props {
  range: string;
  channel: string;
}

type SentimentTab = "all" | "positive" | "negative" | "auto_reply";

const TABS: { key: SentimentTab; label: string; dot: string }[] = [
  { key: "all",        label: "All",        dot: "bg-zinc-400" },
  { key: "positive",   label: "Positive",   dot: "bg-emerald-400" },
  { key: "negative",   label: "Negative",   dot: "bg-rose-400" },
  { key: "auto_reply", label: "Auto-reply", dot: "bg-amber-400" },
];

const SENTIMENT: Record<string, {
  label: string;
  pill: string;
  text: string;
  bar: string;
  leftBorder: string;
}> = {
  positive: {
    label: "Positive",
    pill: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
    text: "text-emerald-300",
    bar: "bg-emerald-500",
    leftBorder: "border-l-emerald-500",
  },
  negative: {
    label: "Negative",
    pill: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
    text: "text-rose-300",
    bar: "bg-rose-500",
    leftBorder: "border-l-rose-500",
  },
  neutral: {
    label: "Neutral",
    pill: "bg-zinc-700/60 text-zinc-400 ring-1 ring-zinc-600/40",
    text: "text-zinc-400",
    bar: "bg-zinc-500",
    leftBorder: "border-l-zinc-600",
  },
  auto_reply: {
    label: "Auto-Reply",
    pill: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
    text: "text-amber-300",
    bar: "bg-amber-500",
    leftBorder: "border-l-amber-500",
  },
};

function getSentiment(reply: ReplyRow) {
  if (reply.is_auto_reply) return "auto_reply";
  if (reply.is_positive_reply === true) return "positive";
  if (reply.is_positive_reply === false) return "negative";
  return "neutral";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fullDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function initials(email: string | null) {
  if (!email) return "?";
  const local = email.split("@")[0];
  const parts = local.split(/[._\-+]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
      <path d="M1.5 3A1.5 1.5 0 000 4.5v.793l6.5 3.25 1.346-.673a1.5 1.5 0 011.308 0L10.5 8.543 16 5.293V4.5A1.5 1.5 0 0014.5 3h-13zM16 6.707l-5.5 2.75v4.293a1.5 1.5 0 001.5 1.5h.001L16 9.457V6.707zM10.5 9.457L5 6.707v6.543A1.5 1.5 0 006.5 14.75h4a1.5 1.5 0 001.5-1.5L10.5 9.457z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
      <path d="M13.601 2.326A7.854 7.854 0 007.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 003.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0013.6 2.326zM7.994 14.521a6.573 6.573 0 01-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 01-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 014.66 1.931 6.557 6.557 0 011.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 00-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
    </svg>
  );
}

function ReplyCard({ reply, selected, onClick }: {
  reply: ReplyRow;
  selected: boolean;
  onClick: () => void;
}) {
  const sk  = getSentiment(reply);
  const cfg = SENTIMENT[sk];
  const isEmail = reply.channel === "email";
  const email = reply.prospect_email ?? null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border-l-[3px] transition-all duration-150 ${cfg.leftBorder} ${
        selected
          ? "bg-zinc-800 border border-zinc-700 border-l-[3px]"
          : "bg-zinc-900/60 border border-zinc-800/60 hover:bg-zinc-800/80 hover:border-zinc-700/80"
      }`}
    >
      <div className="px-4 py-3.5">
        {/* Row 1: avatar + email + time */}
        <div className="flex items-center gap-3 mb-2">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 select-none">
            {initials(email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">
              {email ?? "Unknown sender"}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              {fullDate(reply.received_at)}
            </p>
          </div>
          <span className="text-xs text-zinc-600 shrink-0">{timeAgo(reply.received_at)}</span>
        </div>

        {/* Row 2: channel + sentiment badges */}
        <div className="flex items-center gap-2 mb-2.5">
          {/* Channel pill */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
            isEmail
              ? "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30"
              : "bg-green-500/15 text-green-300 ring-1 ring-green-500/30"
          }`}>
            {isEmail ? <EmailIcon /> : <WhatsAppIcon />}
            {isEmail ? "Email" : "WhatsApp"}
          </span>
          {/* Sentiment pill */}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${cfg.pill}`}>
            {cfg.label}
          </span>
        </div>

        {/* Row 3: message preview */}
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          {reply.reply_body_raw?.trim() || <span className="italic text-zinc-600">No content</span>}
        </p>
      </div>
    </button>
  );
}

function ReplyDetail({ reply }: { reply: ReplyRow }) {
  const sk  = getSentiment(reply);
  const cfg = SENTIMENT[sk];
  const isEmail = reply.channel === "email";
  const email = reply.prospect_email ?? null;

  return (
    <div className="h-full flex flex-col">
      {/* Detail header */}
      <div className="px-6 py-5 border-b border-zinc-800">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300 shrink-0">
            {initials(email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-zinc-100 truncate">
              {email ?? "Unknown sender"}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">{fullDate(reply.received_at)}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isEmail
              ? "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30"
              : "bg-green-500/15 text-green-300 ring-1 ring-green-500/30"
          }`}>
            {isEmail ? <EmailIcon /> : <WhatsAppIcon />}
            {isEmail ? "Email" : "WhatsApp"}
          </span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.pill}`}>
            {cfg.label}
          </span>
        </div>

        {/* Campaign */}
        {reply.campaign_id && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-zinc-600">Campaign</span>
            <span className="font-mono text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
              {reply.campaign_id.length > 24
                ? reply.campaign_id.slice(0, 12) + "…" + reply.campaign_id.slice(-8)
                : reply.campaign_id}
            </span>
          </div>
        )}
      </div>

      {/* Message body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">Message</p>
        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
          <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed break-words">
            {reply.reply_body_raw?.trim() || <span className="italic text-zinc-600">No content</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ReplyDrillDown({ range, channel }: Props) {
  const [activeTab, setActiveTab] = useState<SentimentTab>("all");
  const [replies, setReplies]     = useState<ReplyRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [selected, setSelected]   = useState<ReplyRow | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelected(null);

    const params = new URLSearchParams({ range, channel, sentiment: "all" });

    fetch(`/api/replies?${params.toString()}`)
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then((data: ReplyRow[]) => {
        setReplies(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Failed to load replies");
        setLoading(false);
      });
  }, [range, channel]);

  const tabCounts: Record<SentimentTab, number> = {
    all:        replies.length,
    positive:   replies.filter(r => r.is_positive_reply === true && !r.is_auto_reply).length,
    negative:   replies.filter(r => r.is_positive_reply === false && !r.is_auto_reply).length,
    auto_reply: replies.filter(r => r.is_auto_reply).length,
  };

  const visibleReplies = activeTab === "all" ? replies
    : activeTab === "positive"   ? replies.filter(r => r.is_positive_reply === true && !r.is_auto_reply)
    : activeTab === "negative"   ? replies.filter(r => r.is_positive_reply === false && !r.is_auto_reply)
    : replies.filter(r => r.is_auto_reply);

  // Update selected when tab changes
  useEffect(() => {
    setSelected(visibleReplies.length > 0 ? visibleReplies[0] : null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, replies]);

  return (
    <div className="flex flex-col h-full">

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-4 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-full md:w-fit overflow-x-auto scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key
                ? "bg-zinc-700 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />
            {tab.label}
            {!loading && (
              <span className={`text-[10px] tabular-nums ${activeTab === tab.key ? "text-zinc-400" : "text-zinc-700"}`}>
                {tabCounts[tab.key] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Two-panel layout */}
      {loading ? (
        <div className="flex-1 flex gap-4">
          <div className="w-96 shrink-0 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-zinc-800 rounded w-3/4" />
                    <div className="h-2.5 bg-zinc-800/60 rounded w-1/2" />
                  </div>
                </div>
                <div className="flex gap-2 mb-2.5">
                  <div className="h-4 w-14 bg-zinc-800 rounded-full" />
                  <div className="h-4 w-16 bg-zinc-800 rounded-full" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2.5 bg-zinc-800/60 rounded w-full" />
                  <div className="h-2.5 bg-zinc-800/60 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-5 text-sm text-rose-300 max-w-sm text-center">
            Failed to load replies: {error}
          </div>
        </div>
      ) : visibleReplies.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-zinc-600">
                <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4V5z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-zinc-500">No replies found</p>
            <p className="text-xs text-zinc-700 mt-1">Try a different filter or date range</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-4 min-h-0">

          {/* Left: reply list */}
          <div className={`${mobileView === "detail" ? "hidden md:flex" : "flex"} md:w-96 w-full shrink-0 flex-col min-h-0`}>
            <p className="text-xs text-zinc-600 mb-2 shrink-0">{visibleReplies.length} replies</p>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {visibleReplies.map(reply => (
                <ReplyCard
                  key={reply.reply_id}
                  reply={reply}
                  selected={selected?.reply_id === reply.reply_id}
                  onClick={() => { setSelected(reply); setMobileView("detail"); }}
                />
              ))}
            </div>
          </div>

          {/* Right: detail panel */}
          <div className={`${mobileView === "list" ? "hidden md:flex" : "flex"} flex-1 flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden min-h-0`}>
            {/* Mobile back button */}
            <button
              onClick={() => setMobileView("list")}
              className="md:hidden flex items-center gap-2 px-4 py-3 text-xs text-zinc-400 border-b border-zinc-800 shrink-0"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" /></svg>
              Back to replies
            </button>
            <div className="flex-1 overflow-hidden">
              {selected ? (
                <ReplyDetail reply={selected} />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-zinc-600">
                  Select a reply to view
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
