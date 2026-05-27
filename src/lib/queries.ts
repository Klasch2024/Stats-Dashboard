import { createServerSupabaseClient } from "./supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Channel = "all" | "email" | "whatsapp";
export type DateRange = "24h" | "7d" | "30d" | "90d" | "all";

export interface KpiData {
  totalSends: number;
  totalReplies: number;
  positiveReplies: number;
  negativeReplies: number;
  positiveReplyRate: number;
  emailOpenRate: number;
  whatsappReadRate: number;
  bounceRate: number;
}

export interface ReplyRateDataPoint {
  week: string; // ISO week label e.g. "2024-W03"
  sends: number;
  positiveReplies: number;
  positiveReplyRate: number;
}

export interface SendsByChannelDataPoint {
  month: string; // e.g. "Jan 2024"
  email: number;
  whatsapp: number;
}

export interface CampaignRow {
  campaignId: string;
  campaignName: string | null;
  channel: string;
  sends: number;
  replies: number;
  positiveReplies: number;
  positiveReplyRate: number;
  openRate: number;
  bounceRate: number;
  unsubscribes: number;
  unsubscribeRate: number;
}

export interface FunnelData {
  sent: number;
  opened: number;
  replied: number;
  positiveReplied: number;
}

export interface DayOfWeekData {
  day: string;
  sends: number;
  positiveReplies: number;
  positiveReplyRate: number;
}

export interface HourData {
  hour: string;
  sends: number;
  positiveReplies: number;
  positiveReplyRate: number;
}

export interface StepData {
  step: number;
  sends: number;
  opens: number;
  replies: number;
  positiveReplies: number;
  openRate: number;
  positiveReplyRate: number;
}

export interface SentimentData {
  sentiment: string;
  count: number;
  percentage: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns an ISO date string for `daysAgo` days before now, or null for "all".
 */
function getFromDate(range: DateRange): string | null {
  if (range === "all") return null;
  const d = new Date();
  if (range === "24h") {
    d.setUTCHours(d.getUTCHours() - 24);
  } else {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    d.setUTCDate(d.getUTCDate() - days);
  }
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// KPI query
// ---------------------------------------------------------------------------

export async function fetchKpiData(
  range: DateRange,
  channel: Channel
): Promise<KpiData> {
  const supabase = createServerSupabaseClient();
  const fromDate = getFromDate(range);

  // Build base query for outreach_sends
  let sendsQuery = supabase.from("outreach_sends").select(
    "message_id, channel, email_opened, whatsapp_read, deliverability_status",
    { count: "exact" }
  );
  if (fromDate) sendsQuery = sendsQuery.gte("sent_at", fromDate);
  if (channel !== "all") sendsQuery = sendsQuery.eq("channel", channel);

  const { data: sendsData, error: sendsError } = await sendsQuery;
  if (sendsError) throw new Error(`KPI sends query failed: ${sendsError.message}`);

  const sends = sendsData ?? [];
  const totalSends = sends.length;

  const emailSends = sends.filter((r) => r.channel === "email");
  const waSends = sends.filter((r) => r.channel === "whatsapp");
  const openedEmails = emailSends.filter((r) => r.email_opened === true).length;
  const readWa = waSends.filter((r) => r.whatsapp_read === true).length;
  const bounced = sends.filter(
    (r) => r.deliverability_status === "hard_bounce"
  ).length;

  // Replies
  let repliesQuery = supabase
    .from("replies")
    .select("reply_id, is_positive_reply, is_auto_reply, channel");
  if (fromDate)
    repliesQuery = repliesQuery.gte("received_at", fromDate);
  if (channel !== "all") repliesQuery = repliesQuery.eq("channel", channel);

  const { data: repliesData, error: repliesError } = await repliesQuery;
  if (repliesError)
    throw new Error(`KPI replies query failed: ${repliesError.message}`);

  const replies = repliesData ?? [];
  const totalReplies = replies.length;
  const positiveReplies = replies.filter((r) => r.is_positive_reply === true).length;
  const negativeReplies = replies.filter(
    (r) => r.is_positive_reply === false && !r.is_auto_reply
  ).length;

  return {
    totalSends,
    totalReplies,
    positiveReplies,
    negativeReplies,
    positiveReplyRate: totalSends > 0 ? (positiveReplies / totalSends) * 100 : 0,
    emailOpenRate:
      emailSends.length > 0 ? (openedEmails / emailSends.length) * 100 : 0,
    whatsappReadRate:
      waSends.length > 0 ? (readWa / waSends.length) * 100 : 0,
    bounceRate: totalSends > 0 ? (bounced / totalSends) * 100 : 0,
  };
}

// ---------------------------------------------------------------------------
// Reply rate over time (weekly)
// ---------------------------------------------------------------------------

export async function fetchReplyRateOverTime(
  range: DateRange,
  channel: Channel
): Promise<ReplyRateDataPoint[]> {
  const supabase = createServerSupabaseClient();
  const fromDate = getFromDate(range);

  // Fetch sends with week info
  let sendsQuery = supabase
    .from("outreach_sends")
    .select("message_id, sent_week_of_year, sent_at, channel");
  if (fromDate) sendsQuery = sendsQuery.gte("sent_at", fromDate);
  if (channel !== "all") sendsQuery = sendsQuery.eq("channel", channel);

  const { data: sendsData, error: sendsError } = await sendsQuery;
  if (sendsError)
    throw new Error(`Reply rate sends query failed: ${sendsError.message}`);

  // Fetch positive replies with their send date (via message_id join)
  let repliesQuery = supabase
    .from("replies")
    .select("reply_id, message_id, is_positive_reply, received_at, channel")
    .eq("is_positive_reply", true);
  if (fromDate) repliesQuery = repliesQuery.gte("received_at", fromDate);
  if (channel !== "all") repliesQuery = repliesQuery.eq("channel", channel);

  const { data: repliesData, error: repliesError } = await repliesQuery;
  if (repliesError)
    throw new Error(`Reply rate replies query failed: ${repliesError.message}`);

  // Group sends by ISO year-week
  const sendsByWeek = new Map<string, number>();
  const sends = sendsData ?? [];

  for (const send of sends) {
    const week = getIsoWeekLabel(send.sent_at);
    sendsByWeek.set(week, (sendsByWeek.get(week) ?? 0) + 1);
  }

  // Build a lookup: message_id → week from the sends data
  const sendWeekByMessageId = new Map<string, string>();
  for (const send of sends) {
    sendWeekByMessageId.set(send.message_id, getIsoWeekLabel(send.sent_at));
  }

  // Group positive replies by the week their send was sent
  const positiveRepliesByWeek = new Map<string, number>();
  for (const reply of repliesData ?? []) {
    const week = sendWeekByMessageId.get(reply.message_id);
    if (week) {
      positiveRepliesByWeek.set(week, (positiveRepliesByWeek.get(week) ?? 0) + 1);
    }
  }

  // Merge into sorted array
  const allWeeks = Array.from(
    new Set([...sendsByWeek.keys(), ...positiveRepliesByWeek.keys()])
  ).sort();

  return allWeeks.map((week) => {
    const s = sendsByWeek.get(week) ?? 0;
    const pr = positiveRepliesByWeek.get(week) ?? 0;
    return {
      week,
      sends: s,
      positiveReplies: pr,
      positiveReplyRate: s > 0 ? parseFloat(((pr / s) * 100).toFixed(2)) : 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Sends by channel per month
// ---------------------------------------------------------------------------

export async function fetchSendsByChannel(
  range: DateRange
): Promise<SendsByChannelDataPoint[]> {
  const supabase = createServerSupabaseClient();
  const fromDate = getFromDate(range);

  let query = supabase
    .from("outreach_sends")
    .select("channel, sent_at, sent_month");
  if (fromDate) query = query.gte("sent_at", fromDate);

  const { data, error } = await query;
  if (error) throw new Error(`Sends by channel query failed: ${error.message}`);

  // Group by year-month
  const grouped = new Map<string, { email: number; whatsapp: number }>();

  for (const row of data ?? []) {
    const label = getMonthLabel(row.sent_at);
    if (!grouped.has(label)) grouped.set(label, { email: 0, whatsapp: 0 });
    const bucket = grouped.get(label)!;
    if (row.channel === "email") bucket.email += 1;
    else if (row.channel === "whatsapp") bucket.whatsapp += 1;
  }

  // Sort chronologically
  const sorted = Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, counts]) => ({
      month: formatMonthLabel(month),
      email: counts.email,
      whatsapp: counts.whatsapp,
    }));

  return sorted;
}

// ---------------------------------------------------------------------------
// Instantly campaign name lookup
// ---------------------------------------------------------------------------

export async function fetchInstantlyCampaignNames(): Promise<Map<string, string>> {
  const apiKey = process.env.INSTANTLY_API_KEY;
  if (!apiKey) return new Map();

  const nameMap = new Map<string, string>();
  let startingAfter: string | null = null;

  try {
    do {
      const url = new URL("https://api.instantly.ai/api/v2/campaigns");
      url.searchParams.set("limit", "100");
      if (startingAfter) url.searchParams.set("starting_after", startingAfter);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 300 }, // cache for 5 min
      });

      if (!res.ok) break;

      const json = await res.json() as {
        items?: { id: string; name: string }[];
        nextStartingAfter?: string | null;
      };

      for (const c of json.items ?? []) {
        nameMap.set(c.id, c.name);
      }

      startingAfter = json.nextStartingAfter ?? null;
    } while (startingAfter);
  } catch {
    // Non-fatal — fall back to IDs
  }

  return nameMap;
}

// ---------------------------------------------------------------------------
// Campaign breakdown table
// ---------------------------------------------------------------------------

export async function fetchCampaignBreakdown(
  range: DateRange,
  channel: Channel
): Promise<CampaignRow[]> {
  const supabase = createServerSupabaseClient();
  const fromDate = getFromDate(range);

  // Fetch sends
  let sendsQuery = supabase
    .from("outreach_sends")
    .select(
      "campaign_id, campaign_name, channel, email_opened, whatsapp_read, deliverability_status, message_id, is_unsubscribe"
    );
  if (fromDate) sendsQuery = sendsQuery.gte("sent_at", fromDate);
  if (channel !== "all") sendsQuery = sendsQuery.eq("channel", channel);

  const { data: sendsData, error: sendsError } = await sendsQuery;
  if (sendsError)
    throw new Error(`Campaign sends query failed: ${sendsError.message}`);

  // Fetch replies
  let repliesQuery = supabase
    .from("replies")
    .select("campaign_id, channel, is_positive_reply, reply_id");
  if (fromDate) repliesQuery = repliesQuery.gte("received_at", fromDate);
  if (channel !== "all") repliesQuery = repliesQuery.eq("channel", channel);

  const { data: repliesData, error: repliesError } = await repliesQuery;
  if (repliesError)
    throw new Error(`Campaign replies query failed: ${repliesError.message}`);

  // Aggregate sends per campaign
  type CampaignAgg = {
    channel: string;
    campaignName: string | null;
    sends: number;
    emailSends: number;
    waSends: number;
    opened: number;
    readWa: number;
    bounced: number;
    replies: number;
    positiveReplies: number;
    unsubscribes: number;
  };

  const campaigns = new Map<string, CampaignAgg>();

  for (const row of sendsData ?? []) {
    const key = `${row.campaign_id}::${row.channel}`;
    if (!campaigns.has(key)) {
      campaigns.set(key, {
        channel: row.channel,
        campaignName: row.campaign_name ?? null,
        sends: 0,
        emailSends: 0,
        waSends: 0,
        opened: 0,
        readWa: 0,
        bounced: 0,
        replies: 0,
        positiveReplies: 0,
        unsubscribes: 0,
      });
    }
    const agg = campaigns.get(key)!;
    agg.sends += 1;
    if (row.channel === "email") {
      agg.emailSends += 1;
      if (row.email_opened) agg.opened += 1;
    } else if (row.channel === "whatsapp") {
      agg.waSends += 1;
      if (row.whatsapp_read) agg.readWa += 1;
    }
    if (row.deliverability_status === "hard_bounce") agg.bounced += 1;
    if (row.is_unsubscribe === true) agg.unsubscribes += 1;
  }

  // Aggregate replies per campaign
  for (const row of repliesData ?? []) {
    const key = `${row.campaign_id}::${row.channel}`;
    if (!campaigns.has(key)) continue; // ignore orphan replies
    const agg = campaigns.get(key)!;
    agg.replies += 1;
    if (row.is_positive_reply) agg.positiveReplies += 1;
  }

  // Fetch campaign names from Instantly API
  const instantlyNames = await fetchInstantlyCampaignNames();

  // Convert to rows, compute rates, sort by sends desc, take top 20
  const rows: CampaignRow[] = Array.from(campaigns.entries()).map(
    ([key, agg]) => {
      const [campaignId] = key.split("::");
      const denomForOpen =
        agg.channel === "email" ? agg.emailSends : agg.waSends;
      const openMetric =
        agg.channel === "email"
          ? denomForOpen > 0
            ? (agg.opened / denomForOpen) * 100
            : 0
          : denomForOpen > 0
          ? (agg.readWa / denomForOpen) * 100
          : 0;

      return {
        campaignId,
        // Instantly API is source of truth; fall back to whatever was stored in DB
        campaignName: instantlyNames.get(campaignId) ?? agg.campaignName,
        channel: agg.channel,
        sends: agg.sends,
        replies: agg.replies,
        positiveReplies: agg.positiveReplies,
        positiveReplyRate:
          agg.sends > 0
            ? parseFloat(((agg.positiveReplies / agg.sends) * 100).toFixed(2))
            : 0,
        openRate: parseFloat(openMetric.toFixed(2)),
        bounceRate:
          agg.sends > 0
            ? parseFloat(((agg.bounced / agg.sends) * 100).toFixed(2))
            : 0,
        unsubscribes: agg.unsubscribes,
        unsubscribeRate:
          agg.sends > 0
            ? parseFloat(((agg.unsubscribes / agg.sends) * 100).toFixed(2))
            : 0,
      };
    }
  );

  return rows.sort((a, b) => b.sends - a.sends).slice(0, 20);
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** Returns "YYYY-Www" ISO week label from a timestamptz string */
function getIsoWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getUTCFullYear();
  const week = getIsoWeekNumber(d);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function getIsoWeekNumber(d: Date): number {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
}

/** Returns "YYYY-MM" for sorting */
function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Converts "YYYY-MM" → "Jan 2024" */
function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Funnel data
// ---------------------------------------------------------------------------

export async function fetchFunnelData(
  range: DateRange,
  channel: Channel
): Promise<FunnelData> {
  const supabase = createServerSupabaseClient();
  const fromDate = getFromDate(range);

  let sendsQuery = supabase
    .from("outreach_sends")
    .select(
      "message_id, channel, email_opened, whatsapp_read, whatsapp_delivery_status, replied"
    );
  if (fromDate) sendsQuery = sendsQuery.gte("sent_at", fromDate);
  if (channel !== "all") sendsQuery = sendsQuery.eq("channel", channel);

  const { data: sendsData, error: sendsError } = await sendsQuery;
  if (sendsError)
    throw new Error(`Funnel sends query failed: ${sendsError.message}`);

  const sends = sendsData ?? [];
  const sent = sends.length;

  const opened = sends.filter((r) => {
    if (r.channel === "email") return r.email_opened === true;
    if (r.channel === "whatsapp")
      return (
        r.whatsapp_read === true ||
        r.whatsapp_delivery_status === "delivered" ||
        r.whatsapp_delivery_status === "read"
      );
    // for "all" channel, check either
    return (
      r.email_opened === true ||
      r.whatsapp_read === true ||
      r.whatsapp_delivery_status === "delivered" ||
      r.whatsapp_delivery_status === "read"
    );
  }).length;

  const replied = sends.filter((r) => r.replied === true).length;

  // Positive replies from replies table
  let repliesQuery = supabase
    .from("replies")
    .select("reply_id, is_positive_reply, channel")
    .eq("is_positive_reply", true);
  if (fromDate) repliesQuery = repliesQuery.gte("received_at", fromDate);
  if (channel !== "all") repliesQuery = repliesQuery.eq("channel", channel);

  const { data: repliesData, error: repliesError } = await repliesQuery;
  if (repliesError)
    throw new Error(`Funnel replies query failed: ${repliesError.message}`);

  const positiveReplied = (repliesData ?? []).length;

  return { sent, opened, replied, positiveReplied };
}

// ---------------------------------------------------------------------------
// Best day of week
// ---------------------------------------------------------------------------

export async function fetchBestDayOfWeek(
  range: DateRange,
  channel: Channel
): Promise<DayOfWeekData[]> {
  const supabase = createServerSupabaseClient();
  const fromDate = getFromDate(range);

  let sendsQuery = supabase
    .from("outreach_sends")
    .select("message_id, sent_day_of_week, channel, sent_at");
  if (fromDate) sendsQuery = sendsQuery.gte("sent_at", fromDate);
  if (channel !== "all") sendsQuery = sendsQuery.eq("channel", channel);

  const { data: sendsData, error: sendsError } = await sendsQuery;
  if (sendsError)
    throw new Error(`Best day sends query failed: ${sendsError.message}`);

  let repliesQuery = supabase
    .from("replies")
    .select("message_id, is_positive_reply, channel")
    .eq("is_positive_reply", true);
  if (fromDate) repliesQuery = repliesQuery.gte("received_at", fromDate);
  if (channel !== "all") repliesQuery = repliesQuery.eq("channel", channel);

  const { data: repliesData, error: repliesError } = await repliesQuery;
  if (repliesError)
    throw new Error(`Best day replies query failed: ${repliesError.message}`);

  const sends = sendsData ?? [];

  // Build message_id → day_of_week map (fallback: compute from sent_at)
  const msgToDay = new Map<string, number>();
  for (const s of sends) {
    const dow =
      s.sent_day_of_week != null
        ? s.sent_day_of_week
        : new Date(s.sent_at).getUTCDay();
    msgToDay.set(s.message_id, dow);
  }

  // Count sends per day (0=Sun … 6=Sat)
  const sendsByDay = new Array(7).fill(0);
  for (const [, dow] of msgToDay) {
    sendsByDay[dow] += 1;
  }

  // Count positive replies per day of the originating send
  const posRepliesByDay = new Array(7).fill(0);
  for (const r of repliesData ?? []) {
    const dow = msgToDay.get(r.message_id);
    if (dow != null) posRepliesByDay[dow] += 1;
  }

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // Return Mon-Sun order (1..6, 0)
  const ORDER = [1, 2, 3, 4, 5, 6, 0];

  return ORDER.map((dow) => {
    const s = sendsByDay[dow];
    const pr = posRepliesByDay[dow];
    return {
      day: DAY_LABELS[dow],
      sends: s,
      positiveReplies: pr,
      positiveReplyRate: s > 0 ? parseFloat(((pr / s) * 100).toFixed(2)) : 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Best hour of day
// ---------------------------------------------------------------------------

export async function fetchBestHourOfDay(
  range: DateRange,
  channel: Channel
): Promise<HourData[]> {
  const supabase = createServerSupabaseClient();
  const fromDate = getFromDate(range);

  let sendsQuery = supabase
    .from("outreach_sends")
    .select("message_id, sent_hour_utc, channel, sent_at");
  if (fromDate) sendsQuery = sendsQuery.gte("sent_at", fromDate);
  if (channel !== "all") sendsQuery = sendsQuery.eq("channel", channel);

  const { data: sendsData, error: sendsError } = await sendsQuery;
  if (sendsError)
    throw new Error(`Best hour sends query failed: ${sendsError.message}`);

  let repliesQuery = supabase
    .from("replies")
    .select("message_id, is_positive_reply, channel")
    .eq("is_positive_reply", true);
  if (fromDate) repliesQuery = repliesQuery.gte("received_at", fromDate);
  if (channel !== "all") repliesQuery = repliesQuery.eq("channel", channel);

  const { data: repliesData, error: repliesError } = await repliesQuery;
  if (repliesError)
    throw new Error(`Best hour replies query failed: ${repliesError.message}`);

  const sends = sendsData ?? [];

  const msgToHour = new Map<string, number>();
  for (const s of sends) {
    const h =
      s.sent_hour_utc != null
        ? s.sent_hour_utc
        : new Date(s.sent_at).getUTCHours();
    msgToHour.set(s.message_id, h);
  }

  const sendsByHour = new Array(24).fill(0);
  for (const [, h] of msgToHour) {
    sendsByHour[h] += 1;
  }

  const posRepliesByHour = new Array(24).fill(0);
  for (const r of repliesData ?? []) {
    const h = msgToHour.get(r.message_id);
    if (h != null) posRepliesByHour[h] += 1;
  }

  return Array.from({ length: 24 }, (_, i) => {
    const s = sendsByHour[i];
    const pr = posRepliesByHour[i];
    return {
      hour: `${String(i).padStart(2, "0")}:00`,
      sends: s,
      positiveReplies: pr,
      positiveReplyRate: s > 0 ? parseFloat(((pr / s) * 100).toFixed(2)) : 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Sequence step breakdown
// ---------------------------------------------------------------------------

export async function fetchSequenceStepBreakdown(
  range: DateRange,
  channel: Channel
): Promise<StepData[]> {
  const supabase = createServerSupabaseClient();
  const fromDate = getFromDate(range);

  let sendsQuery = supabase
    .from("outreach_sends")
    .select(
      "message_id, sequence_step_number, channel, email_opened, whatsapp_read, replied"
    );
  if (fromDate) sendsQuery = sendsQuery.gte("sent_at", fromDate);
  if (channel !== "all") sendsQuery = sendsQuery.eq("channel", channel);

  const { data: sendsData, error: sendsError } = await sendsQuery;
  if (sendsError)
    throw new Error(`Step sends query failed: ${sendsError.message}`);

  let repliesQuery = supabase
    .from("replies")
    .select("message_id, is_positive_reply, channel")
    .eq("is_positive_reply", true);
  if (fromDate) repliesQuery = repliesQuery.gte("received_at", fromDate);
  if (channel !== "all") repliesQuery = repliesQuery.eq("channel", channel);

  const { data: repliesData, error: repliesError } = await repliesQuery;
  if (repliesError)
    throw new Error(`Step replies query failed: ${repliesError.message}`);

  const sends = sendsData ?? [];

  type StepAgg = {
    sends: number;
    opens: number;
    replies: number;
    positiveReplies: number;
  };

  const byStep = new Map<number, StepAgg>();

  const msgToStep = new Map<string, number>();
  for (const s of sends) {
    const step = s.sequence_step_number ?? 1;
    msgToStep.set(s.message_id, step);
    if (!byStep.has(step))
      byStep.set(step, { sends: 0, opens: 0, replies: 0, positiveReplies: 0 });
    const agg = byStep.get(step)!;
    agg.sends += 1;
    if (s.email_opened === true || s.whatsapp_read === true) agg.opens += 1;
    if (s.replied === true) agg.replies += 1;
  }

  for (const r of repliesData ?? []) {
    const step = msgToStep.get(r.message_id);
    if (step != null) {
      const agg = byStep.get(step);
      if (agg) agg.positiveReplies += 1;
    }
  }

  return Array.from(byStep.entries())
    .sort(([a], [b]) => a - b)
    .map(([step, agg]) => ({
      step,
      sends: agg.sends,
      opens: agg.opens,
      replies: agg.replies,
      positiveReplies: agg.positiveReplies,
      openRate:
        agg.sends > 0
          ? parseFloat(((agg.opens / agg.sends) * 100).toFixed(2))
          : 0,
      positiveReplyRate:
        agg.sends > 0
          ? parseFloat(((agg.positiveReplies / agg.sends) * 100).toFixed(2))
          : 0,
    }));
}

// ---------------------------------------------------------------------------
// Reply drill-down
// ---------------------------------------------------------------------------

export interface ReplyRow {
  reply_id: string;
  campaign_id: string;
  channel: string;
  received_at: string;
  reply_body_raw: string;
  is_positive_reply: boolean | null;
  is_auto_reply: boolean;
  prospect_id: string | null;
  // joined from outreach_sends via message_id:
  prospect_email: string | null;
}

export async function fetchReplies(
  range: DateRange,
  channel: Channel,
  sentiment?: "positive" | "negative" | "all"
): Promise<ReplyRow[]> {
  const supabase = createServerSupabaseClient();
  const fromDate = getFromDate(range);

  let repliesQuery = supabase
    .from("replies")
    .select(
      "reply_id, campaign_id, channel, received_at, reply_body_raw, is_positive_reply, is_auto_reply, prospect_id, message_id"
    )
    .order("received_at", { ascending: false })
    .limit(100);

  if (fromDate) repliesQuery = repliesQuery.gte("received_at", fromDate);
  if (channel !== "all") repliesQuery = repliesQuery.eq("channel", channel);

  if (sentiment === "positive") {
    repliesQuery = repliesQuery.eq("is_positive_reply", true);
  } else if (sentiment === "negative") {
    repliesQuery = repliesQuery
      .eq("is_positive_reply", false)
      .eq("is_auto_reply", false);
  }

  const { data: repliesData, error: repliesError } = await repliesQuery;
  if (repliesError)
    throw new Error(`Replies drill-down query failed: ${repliesError.message}`);

  const replies = repliesData ?? [];
  if (replies.length === 0) return [];

  // Batch-fetch outreach_sends to get prospect_email — avoid N+1
  const messageIds = replies
    .map((r) => r.message_id)
    .filter((id): id is string => id != null);

  const emailMap = new Map<string, string | null>();

  if (messageIds.length > 0) {
    const { data: sendsData } = await supabase
      .from("outreach_sends")
      .select("message_id, prospect_email")
      .in("message_id", messageIds);

    for (const s of sendsData ?? []) {
      emailMap.set(s.message_id, s.prospect_email ?? null);
    }
  }

  return replies.map((r) => ({
    reply_id: r.reply_id,
    campaign_id: r.campaign_id,
    channel: r.channel,
    received_at: r.received_at,
    reply_body_raw: r.reply_body_raw ?? "",
    is_positive_reply: r.is_positive_reply,
    is_auto_reply: r.is_auto_reply ?? false,
    prospect_id: r.prospect_id ?? null,
    prospect_email: emailMap.get(r.message_id) ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Campaign list (for Campaigns section)
// ---------------------------------------------------------------------------

export interface CampaignListItem {
  id: string;
  name: string | null;
  sends: number;
  replies: number;
  positiveReplies: number;
  positiveReplyRate: number;
}

export async function fetchCampaignList(range: DateRange): Promise<CampaignListItem[]> {
  const supabase = createServerSupabaseClient();
  const fromDate = getFromDate(range);

  // Fetch sends grouped by campaign_id
  let sendsQuery = supabase
    .from("outreach_sends")
    .select("campaign_id, message_id");
  if (fromDate) sendsQuery = sendsQuery.gte("sent_at", fromDate);

  const { data: sendsData, error: sendsError } = await sendsQuery;
  if (sendsError) throw new Error(`Campaign list sends query failed: ${sendsError.message}`);

  // Fetch replies grouped by campaign_id
  let repliesQuery = supabase
    .from("replies")
    .select("campaign_id, reply_id, is_positive_reply");
  if (fromDate) repliesQuery = repliesQuery.gte("received_at", fromDate);

  const { data: repliesData, error: repliesError } = await repliesQuery;
  if (repliesError) throw new Error(`Campaign list replies query failed: ${repliesError.message}`);

  // Aggregate sends per campaign
  const sendsByCampaign = new Map<string, number>();
  for (const row of sendsData ?? []) {
    if (!row.campaign_id) continue;
    sendsByCampaign.set(row.campaign_id, (sendsByCampaign.get(row.campaign_id) ?? 0) + 1);
  }

  // Aggregate replies per campaign
  const repliesByCampaign = new Map<string, { total: number; positive: number }>();
  for (const row of repliesData ?? []) {
    if (!row.campaign_id) continue;
    const agg = repliesByCampaign.get(row.campaign_id) ?? { total: 0, positive: 0 };
    agg.total += 1;
    if (row.is_positive_reply === true) agg.positive += 1;
    repliesByCampaign.set(row.campaign_id, agg);
  }

  // Get all campaign IDs from both sources
  const allIds = new Set<string>([
    ...sendsByCampaign.keys(),
    ...repliesByCampaign.keys(),
  ]);

  // Fetch names from Instantly API
  const instantlyNames = await fetchInstantlyCampaignNames();

  // Build result
  const items: CampaignListItem[] = [];
  for (const id of allIds) {
    const sends = sendsByCampaign.get(id) ?? 0;
    const replyAgg = repliesByCampaign.get(id) ?? { total: 0, positive: 0 };
    items.push({
      id,
      name: instantlyNames.get(id) ?? null,
      sends,
      replies: replyAgg.total,
      positiveReplies: replyAgg.positive,
      positiveReplyRate: sends > 0
        ? parseFloat(((replyAgg.positive / sends) * 100).toFixed(2))
        : 0,
    });
  }

  return items.sort((a, b) => b.sends - a.sends);
}

// ---------------------------------------------------------------------------
// Single campaign stats (for Campaigns detail panel)
// ---------------------------------------------------------------------------

export interface SingleCampaignStats {
  campaignName: string | null;
  sends: number;
  emailSends: number;
  waSends: number;
  replies: number;
  positiveReplies: number;
  negativeReplies: number;
  autoReplies: number;
  positiveReplyRate: number;
  emailOpenRate: number;
  bounceRate: number;
  stepBreakdown: StepData[];
  sentimentBreakdown: SentimentData[];
}

export async function fetchSingleCampaignStats(
  campaignId: string,
  range: DateRange
): Promise<SingleCampaignStats> {
  const supabase = createServerSupabaseClient();
  const fromDate = getFromDate(range);

  // Fetch sends for this campaign
  let sendsQuery = supabase
    .from("outreach_sends")
    .select(
      "message_id, channel, email_opened, whatsapp_read, deliverability_status, sequence_step_number, replied"
    )
    .eq("campaign_id", campaignId);
  if (fromDate) sendsQuery = sendsQuery.gte("sent_at", fromDate);

  const { data: sendsData, error: sendsError } = await sendsQuery;
  if (sendsError)
    throw new Error(`Single campaign sends query failed: ${sendsError.message}`);

  // Fetch replies for this campaign
  let repliesQuery = supabase
    .from("replies")
    .select("reply_id, message_id, is_positive_reply, is_auto_reply")
    .eq("campaign_id", campaignId);
  if (fromDate) repliesQuery = repliesQuery.gte("received_at", fromDate);

  const { data: repliesData, error: repliesError } = await repliesQuery;
  if (repliesError)
    throw new Error(`Single campaign replies query failed: ${repliesError.message}`);

  const sends = sendsData ?? [];
  const replies = repliesData ?? [];

  // Basic counts
  const totalSends = sends.length;
  const emailSends = sends.filter((s) => s.channel === "email");
  const waSends = sends.filter((s) => s.channel === "whatsapp");

  const openedEmails = emailSends.filter((s) => s.email_opened === true).length;
  const bounced = sends.filter(
    (s) => s.deliverability_status === "hard_bounce"
  ).length;

  const totalReplies = replies.length;
  const positiveReplies = replies.filter((r) => r.is_positive_reply === true).length;
  const negativeReplies = replies.filter(
    (r) => r.is_positive_reply === false && !r.is_auto_reply
  ).length;
  const autoReplies = replies.filter((r) => r.is_auto_reply === true).length;

  // Step breakdown
  type StepAgg = {
    sends: number;
    opens: number;
    replies: number;
    positiveReplies: number;
  };

  const byStep = new Map<number, StepAgg>();
  const msgToStep = new Map<string, number>();

  for (const s of sends) {
    const step = s.sequence_step_number ?? 1;
    msgToStep.set(s.message_id, step);
    if (!byStep.has(step))
      byStep.set(step, { sends: 0, opens: 0, replies: 0, positiveReplies: 0 });
    const agg = byStep.get(step)!;
    agg.sends += 1;
    if (s.email_opened === true || s.whatsapp_read === true) agg.opens += 1;
    if (s.replied === true) agg.replies += 1;
  }

  for (const r of replies) {
    const step = msgToStep.get(r.message_id);
    if (step != null) {
      const agg = byStep.get(step);
      if (agg && r.is_positive_reply === true) agg.positiveReplies += 1;
    }
  }

  const stepBreakdown: StepData[] = Array.from(byStep.entries())
    .sort(([a], [b]) => a - b)
    .map(([step, agg]) => ({
      step,
      sends: agg.sends,
      opens: agg.opens,
      replies: agg.replies,
      positiveReplies: agg.positiveReplies,
      openRate:
        agg.sends > 0
          ? parseFloat(((agg.opens / agg.sends) * 100).toFixed(2))
          : 0,
      positiveReplyRate:
        agg.sends > 0
          ? parseFloat(((agg.positiveReplies / agg.sends) * 100).toFixed(2))
          : 0,
    }));

  // Sentiment breakdown
  const sentimentCounts = new Map<string, number>([
    ["positive", 0],
    ["negative", 0],
    ["neutral", 0],
    ["auto_reply", 0],
  ]);
  for (const r of replies) {
    let s = "neutral";
    if (r.is_auto_reply) s = "auto_reply";
    else if (r.is_positive_reply === true) s = "positive";
    else if (r.is_positive_reply === false) s = "negative";
    sentimentCounts.set(s, (sentimentCounts.get(s) ?? 0) + 1);
  }

  const sentimentBreakdown: SentimentData[] = Array.from(sentimentCounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sentiment, count]) => ({
      sentiment,
      count,
      percentage:
        totalReplies > 0
          ? parseFloat(((count / totalReplies) * 100).toFixed(2))
          : 0,
    }));

  // Campaign name from Instantly
  const instantlyNames = await fetchInstantlyCampaignNames();

  return {
    campaignName: instantlyNames.get(campaignId) ?? null,
    sends: totalSends,
    emailSends: emailSends.length,
    waSends: waSends.length,
    replies: totalReplies,
    positiveReplies,
    negativeReplies,
    autoReplies,
    positiveReplyRate:
      totalSends > 0
        ? parseFloat(((positiveReplies / totalSends) * 100).toFixed(2))
        : 0,
    emailOpenRate:
      emailSends.length > 0
        ? parseFloat(((openedEmails / emailSends.length) * 100).toFixed(2))
        : 0,
    bounceRate:
      totalSends > 0
        ? parseFloat(((bounced / totalSends) * 100).toFixed(2))
        : 0,
    stepBreakdown,
    sentimentBreakdown,
  };
}

// ---------------------------------------------------------------------------
// Reply sentiment breakdown
// ---------------------------------------------------------------------------

export async function fetchReplySentiment(
  range: DateRange,
  channel: Channel
): Promise<SentimentData[]> {
  const supabase = createServerSupabaseClient();
  const fromDate = getFromDate(range);

  let repliesQuery = supabase
    .from("replies")
    .select("reply_id, is_positive_reply, is_auto_reply, channel");
  if (fromDate) repliesQuery = repliesQuery.gte("received_at", fromDate);
  if (channel !== "all") repliesQuery = repliesQuery.eq("channel", channel);

  const { data: repliesData, error: repliesError } = await repliesQuery;
  if (repliesError)
    throw new Error(`Sentiment query failed: ${repliesError.message}`);

  const replies = repliesData ?? [];
  const total = replies.length;

  const counts = new Map<string, number>();
  for (const r of replies) {
    let s = "neutral";
    if (r.is_auto_reply) s = "auto_reply";
    else if (r.is_positive_reply === true) s = "positive";
    else if (r.is_positive_reply === false) s = "negative";
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }

  // Ensure all four standard sentiments always appear
  for (const s of ["positive", "negative", "neutral", "auto_reply"]) {
    if (!counts.has(s)) counts.set(s, 0);
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sentiment, count]) => ({
      sentiment,
      count,
      percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0,
    }));
}
