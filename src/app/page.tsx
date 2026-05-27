import { Suspense } from "react";
import {
  fetchKpiData,
  fetchReplyRateOverTime,
  fetchSendsByChannel,
  fetchCampaignBreakdown,
  fetchFunnelData,
  fetchBestDayOfWeek,
  fetchBestHourOfDay,
  fetchSequenceStepBreakdown,
  fetchReplySentiment,
  type DateRange,
  type Channel,
} from "@/lib/queries";
import DateRangeFilter from "@/components/DateRangeFilter";
import Sidebar from "@/components/Sidebar";
import CampaignStatsView from "@/components/CampaignStatsView";
import ReplyDrillDown from "@/components/ReplyDrillDown";
import CampaignsView from "@/components/CampaignsView";

export const dynamic = "force-dynamic";

function parseRange(raw: unknown): DateRange {
  if (raw === "24h" || raw === "7d" || raw === "30d" || raw === "90d" || raw === "all") return raw;
  return "30d";
}
function parseChannel(raw: unknown): Channel {
  if (raw === "email" || raw === "whatsapp") return raw;
  return "all";
}
function parseSection(raw: unknown): "stats" | "replies" | "campaigns" {
  if (raw === "replies") return "replies";
  if (raw === "campaigns") return "campaigns";
  return "stats";
}

interface PageProps {
  searchParams: { range?: string; channel?: string; section?: string };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const range   = parseRange(searchParams.range);
  const channel = parseChannel(searchParams.channel);
  const section = parseSection(searchParams.section);

  // Fetch all data needed for Campaign Stats in parallel
  const [
    kpi,
    replyRateData,
    sendsByChannelData,
    campaignData,
    funnelData,
    dayOfWeekData,
    hourOfDayData,
    stepData,
    sentimentData,
  ] = await Promise.all([
    fetchKpiData(range, channel),
    fetchReplyRateOverTime(range, channel),
    fetchSendsByChannel(range),
    fetchCampaignBreakdown(range, channel),
    fetchFunnelData(range, channel),
    fetchBestDayOfWeek(range, channel),
    fetchBestHourOfDay(range, channel),
    fetchSequenceStepBreakdown(range, channel),
    fetchReplySentiment(range, channel),
  ]);

  const sectionTitle =
    section === "replies"
      ? "Reply Box"
      : section === "campaigns"
      ? "Campaigns"
      : "Campaign Stats";
  const sectionDesc =
    section === "replies"
      ? "All incoming email and WhatsApp replies"
      : section === "campaigns"
      ? "Per-campaign performance breakdown and step analysis"
      : "Performance metrics and analytics across all campaigns";

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b]">

      {/* ── Sidebar ── */}
      <Suspense fallback={<div className="w-56 shrink-0 border-r border-zinc-800 bg-[#09090b]" />}>
        <Sidebar activeSection={section} />
      </Suspense>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur-sm">
          <div className="px-8 h-16 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-sm font-semibold text-zinc-100">{sectionTitle}</h1>
              <p className="text-xs text-zinc-500">{sectionDesc}</p>
            </div>
            <Suspense fallback={<div className="h-9 w-72 bg-zinc-800 rounded-lg animate-pulse" />}>
              <DateRangeFilter currentRange={range} currentChannel={channel} />
            </Suspense>
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 px-8 py-8 ${section === "stats" ? "overflow-y-auto" : "overflow-hidden flex flex-col"}`}>
          {section === "stats" ? (
            <CampaignStatsView
              kpi={kpi}
              replyRateData={replyRateData}
              sendsByChannelData={sendsByChannelData}
              funnelData={funnelData}
              sentimentData={sentimentData}
              dayOfWeekData={dayOfWeekData}
              hourOfDayData={hourOfDayData}
              stepData={stepData}
              campaignData={campaignData}
              channel={channel}
            />
          ) : section === "campaigns" ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <CampaignsView range={range} />
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              <ReplyDrillDown range={range} channel={channel} />
            </div>
          )}
        </main>

        <footer className="px-8 py-4 border-t border-zinc-800/40 text-xs text-zinc-700">
          Fulcrum Analytics · Live data · All times UTC
        </footer>
      </div>
    </div>
  );
}
