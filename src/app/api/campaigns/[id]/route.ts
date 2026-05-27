import { NextRequest, NextResponse } from "next/server";
import { fetchSingleCampaignStats } from "@/lib/queries";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = req.nextUrl;
  const range = searchParams.get("range") ?? "30d";
  const campaignId = params.id;

  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaign id" }, { status: 400 });
  }

  try {
    const data = await fetchSingleCampaignStats(campaignId, range as any);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
