import { NextRequest, NextResponse } from "next/server";
import { fetchCampaignList } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const range = searchParams.get("range") ?? "30d";

  try {
    const data = await fetchCampaignList(range as any);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
