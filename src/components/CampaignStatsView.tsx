import KpiCard from "./KpiCard";
import ReplyRateChart from "./ReplyRateChart";
import SendsByChannelChart from "./SendsByChannelChart";
import FunnelChart from "./FunnelChart";
import SentimentChart from "./SentimentChart";
import BestTimeChart from "./BestTimeChart";
import StepBreakdownChart from "./StepBreakdownChart";
import CampaignTable from "./CampaignTable";
import type {
  KpiData,
  ReplyRateDataPoint,
  SendsByChannelDataPoint,
  FunnelData,
  SentimentData,
  DayOfWeekData,
  HourData,
  StepData,
  CampaignRow,
  Channel,
} from "@/lib/queries";

function fmt(n: number) { return n.toLocaleString("en-US"); }
function fmtPct(n: number) { return `${n.toFixed(2)}%`; }

function Block({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-sm font-semibold text-zinc-200">{title}</p>
      {subtitle && <p className="text-xs text-zinc-500 mt-0.5 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

interface Props {
  kpi: KpiData;
  replyRateData: ReplyRateDataPoint[];
  sendsByChannelData: SendsByChannelDataPoint[];
  funnelData: FunnelData;
  sentimentData: SentimentData[];
  dayOfWeekData: DayOfWeekData[];
  hourOfDayData: HourData[];
  stepData: StepData[];
  campaignData: CampaignRow[];
  channel: Channel;
}

export default function CampaignStatsView({
  kpi, replyRateData, sendsByChannelData, funnelData,
  sentimentData, dayOfWeekData, hourOfDayData, stepData, campaignData, channel,
}: Props) {
  return (
    <div className="space-y-10">

      {/* ── KPIs ── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Key Metrics</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
          <KpiCard title="Total Sends" value={fmt(kpi.totalSends)} subtitle="messages sent" accent="yellow" icon={<SendIcon />} />
          <KpiCard title="Email Open Rate" value={channel === "whatsapp" ? "—" : fmtPct(kpi.emailOpenRate)} subtitle="of email sends" accent="sky" icon={<OpenIcon />} />
          <KpiCard title="WhatsApp Read Rate" value={channel === "email" ? "—" : fmtPct(kpi.whatsappReadRate)} subtitle="of WA sends" accent="amber" icon={<WaIcon />} />
          <KpiCard title="Bounce Rate" value={fmtPct(kpi.bounceRate)} subtitle="hard bounces" accent="rose" icon={<BounceIcon />} />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KpiCard title="Positive Reply Rate" value={fmtPct(kpi.positiveReplyRate)} subtitle={`${fmt(kpi.positiveReplies)} of ${fmt(kpi.totalSends)}`} accent="emerald" icon={<ThumbUpIcon />} />
          <KpiCard title="Positive Replies" value={fmt(kpi.positiveReplies)} subtitle={`of ${fmt(kpi.totalReplies)} total`} accent="emerald" icon={<ThumbUpIcon />} />
          <KpiCard title="Negative Replies" value={fmt(kpi.negativeReplies)} subtitle="non-auto negative" accent="rose" icon={<ThumbDownIcon />} />
          <KpiCard title="Total Replies" value={fmt(kpi.totalReplies)} subtitle="all reply intents" accent="violet" icon={<ReplyIcon />} />
        </div>
      </section>

      {/* ── Trends ── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Volume & Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Block title="Positive Reply Rate Over Time" subtitle="Weekly positive reply rate (%)">
            <ReplyRateChart data={replyRateData} />
          </Block>
          <Block title="Sends by Channel" subtitle="Monthly volume — Email vs WhatsApp">
            <SendsByChannelChart data={sendsByChannelData} />
          </Block>
        </div>
      </section>

      {/* ── Conversion ── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Conversion</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Block title="Conversion Funnel" subtitle="Sent → Opened → Replied → Positive reply">
            <FunnelChart data={funnelData} />
          </Block>
          <Block title="Reply Sentiment" subtitle="Distribution of reply intent">
            <SentimentChart data={sentimentData} />
          </Block>
        </div>
      </section>

      {/* ── Optimisation ── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Optimisation Insights</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Block title="Best Time to Send" subtitle="Reply rate by day of week and hour (UTC)">
            <BestTimeChart dayData={dayOfWeekData} hourData={hourOfDayData} />
          </Block>
          <Block title="Sequence Step Performance" subtitle="Open rate and reply rate per step">
            <StepBreakdownChart data={stepData} />
          </Block>
        </div>
      </section>

      {/* ── Campaigns ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Campaigns</h2>
          <span className="text-xs text-zinc-600 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-0.5">
            {campaignData.length} campaigns
          </span>
        </div>
        <CampaignTable data={campaignData} />
      </section>

    </div>
  );
}

function SendIcon() { return <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" /></svg>; }
function OpenIcon() { return <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" /><path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" /></svg>; }
function WaIcon() { return <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>; }
function BounceIcon() { return <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>; }
function ThumbUpIcon() { return <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.166-1.73c.432-.143.853-.386 1.011-.814.16-.432.248-.9.248-1.388z" /></svg>; }
function ThumbDownIcon() { return <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M18.905 12.75a1.25 1.25 0 01-2.5 0v-7.5a1.25 1.25 0 112.5 0v7.5zM8.905 17v1.3c0 .268-.14.526-.395.607A2 2 0 015.905 17c0-.995.182-1.948.514-2.826.204-.54-.166-1.174-.744-1.174h-2.52c-1.243 0-2.261-1.01-2.146-2.247a23.864 23.864 0 011.341-5.974C2.752 3.677 3.833 3 5.005 3h3.192a3 3 0 011.341.317l2.734 1.366A3 3 0 0013.613 5h1.292v7h-.963c-.685 0-1.258.483-1.612 1.068a4.011 4.011 0 01-2.166 1.73c-.432.143-.853.386-1.011.814-.16.432-.248.9.248 1.388z" /></svg>; }
function ReplyIcon() { return <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z" clipRule="evenodd" /></svg>; }
