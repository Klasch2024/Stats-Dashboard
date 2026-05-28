interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: "yellow" | "violet" | "emerald" | "amber" | "rose" | "sky";
}

const accentClasses: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  yellow:  "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  violet:  "text-violet-400 bg-violet-500/10 border-violet-500/20",
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  amber:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
  rose:    "text-rose-400 bg-rose-500/10 border-rose-500/20",
  sky:     "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

const valueAccentClasses: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  yellow:  "text-yellow-300",
  violet:  "text-violet-300",
  emerald: "text-emerald-300",
  amber:   "text-amber-300",
  rose:    "text-rose-300",
  sky:     "text-sky-300",
};

export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  accent = "yellow",
}: KpiCardProps) {
  const iconClass = accentClasses[accent];
  const valClass = valueAccentClasses[accent];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-5 flex flex-col gap-2 md:gap-3 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          {title}
        </span>
        {icon && (
          <span
            className={`flex items-center justify-center w-8 h-8 rounded-lg border text-base ${iconClass}`}
          >
            {icon}
          </span>
        )}
      </div>

      <div>
        <p className={`text-xl md:text-3xl font-bold tracking-tight ${valClass}`}>
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
