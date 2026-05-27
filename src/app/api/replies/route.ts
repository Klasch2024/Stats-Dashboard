import { NextRequest, NextResponse } from 'next/server';
import { fetchReplies } from '@/lib/queries';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const range = searchParams.get('range') ?? '30d';
  const channel = searchParams.get('channel') ?? 'all';
  const sentiment = searchParams.get('sentiment') ?? 'all';

  try {
    const data = await fetchReplies(range as any, channel as any, sentiment as any);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
