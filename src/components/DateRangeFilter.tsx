"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

type DateRange = "24h" | "7d" | "30d" | "90d" | "all";
type Channel = "all" | "email" | "whatsapp";

const DATE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: "24h",      value: "24h" },
  { label: "7d",       value: "7d" },
  { label: "30d",      value: "30d" },
  { label: "90d",      value: "90d" },
  { label: "All time", value: "all" },
];

const CHANNEL_OPTIONS: { label: string; value: Channel }[] = [
  { label: "All Channels", value: "all" },
  { label: "Email", value: "email" },
  { label: "WhatsApp", value: "whatsapp" },
];

interface Props {
  currentRange: DateRange;
  currentChannel: Channel;
}

export default function DateRangeFilter({ currentRange, currentChannel }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-row items-center gap-2 overflow-x-auto pb-0.5 w-full md:w-auto scrollbar-none">
      {/* Channel tabs */}
      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5">
        {CHANNEL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParam("channel", opt.value)}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              currentChannel === opt.value
                ? "bg-yellow-400 text-black shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Date range pills */}
      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5">
        {DATE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParam("range", opt.value)}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              currentRange === opt.value
                ? "bg-yellow-400 text-black shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
