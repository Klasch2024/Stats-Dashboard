"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const NAV = [
  {
    key: "stats",
    label: "Campaign Stats",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 003 0v-13A1.5 1.5 0 0015.5 2zM10.5 6A1.5 1.5 0 009 7.5v9a1.5 1.5 0 003 0v-9A1.5 1.5 0 0010.5 6zM5.5 10A1.5 1.5 0 004 11.5v5a1.5 1.5 0 003 0v-5A1.5 1.5 0 005.5 10z" />
      </svg>
    ),
  },
  {
    key: "campaigns",
    label: "Campaigns",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    key: "replies",
    label: "Reply Box",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4V5z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export default function Sidebar({
  activeSection,
}: {
  activeSection: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", key);
    router.push(`?${params.toString()}`);
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-zinc-800 h-screen bg-[#09090b] pt-6 pb-8 px-3 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-yellow-400 text-black text-xs font-bold select-none">
          F
        </span>
        <div>
          <p className="text-sm font-bold tracking-tight text-zinc-100">Fulcrum</p>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600">Analytics</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 px-3 mb-2">Navigation</p>
        {NAV.map((item) => {
          const active = activeSection === item.key;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                active
                  ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <span className={active ? "text-yellow-400" : "text-zinc-500"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom: live indicator */}
      <div className="mt-auto px-3">
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Live data
        </div>
      </div>
    </aside>
  );
}
