import { STATUSES, STATUS_META, type Status } from "@/lib/progress";
import { cn } from "@/lib/utils";

/** 상단 집계 카드 — EU Actions Tracker의 상태별 카운트 카드 패턴 */
export function SummaryCards({
  total,
  counts,
  totalLabel = "전체 지표",
  className,
}: {
  total: number;
  counts: Record<Status, number>;
  totalLabel?: string;
  className?: string;
}) {
  const shown = STATUSES.filter((s) => counts[s] > 0 || s === "달성" || s === "순조" || s === "지연");

  return (
    <div className={cn("grid gap-3 grid-cols-[repeat(auto-fit,minmax(210px,1fr))]", className)}>
      <div className="rounded-xl border bg-gradient-to-br from-foreground to-foreground/80 p-4 text-background">
        <div className="text-xs opacity-80">{totalLabel}</div>
        <div className="mt-1 text-3xl font-bold tabular-nums">{total}</div>
      </div>
      {shown.map((s) => {
        const meta = STATUS_META[s];
        const pct = total ? Math.round((counts[s] / total) * 100) : 0;
        return (
          <div
            key={s}
            className="rounded-xl border p-4"
            style={{ backgroundColor: meta.bg, borderColor: meta.color + "33" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: meta.text }}>
                {s}
              </span>
              <span className="text-[11px] tabular-nums" style={{ color: meta.text, opacity: 0.7 }}>
                {pct}%
              </span>
            </div>
            <div className="mt-1 text-3xl font-bold tabular-nums" style={{ color: meta.color }}>
              {counts[s]}
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/60">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
