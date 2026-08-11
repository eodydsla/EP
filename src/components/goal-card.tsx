import Link from "next/link";
import type { DashGoal } from "@/lib/data";
import { STATUSES, STATUS_META, averageProgress, countByStatus } from "@/lib/progress";
import { Donut } from "@/components/donut";
import { ArrowRightIcon } from "lucide-react";

export function GoalCard({ goal, level3Label }: { goal: DashGoal; level3Label: string }) {
  const computed = goal.indicators.map((i) => i.computed);
  const avg = averageProgress(computed);
  const counts = countByStatus(computed);
  const total = computed.length;

  const headline = goal.indicators.filter((i) => i.isHeadline).slice(0, 2);

  return (
    <Link
      href={`/indicators?goal=${goal.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ borderColor: goal.tone.border }}
    >
      {/* 목표색 그라디언트 헤더 */}
      <div
        className="relative p-4 text-white"
        style={{ background: `linear-gradient(135deg, ${goal.color} 0%, ${goal.tone.deep} 100%)` }}
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none drop-shadow-sm">{goal.icon ?? "◆"}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium opacity-85">목표 {goal.no}</div>
            <h3 className="text-lg leading-tight font-bold">{goal.name}</h3>
          </div>
        </div>
        {goal.description && (
          <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed opacity-85">{goal.description}</p>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 bg-card p-4">
        <div className="flex items-center gap-4">
          <Donut value={avg} color={goal.color} label="평균 달성" />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground">
              {level3Label} <strong className="text-foreground tabular-nums">{total}</strong>개 ·{" "}
              {goal.targets.length}개 세부목표
            </div>
            {/* 상태별 스택 바 */}
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-muted">
              {STATUSES.filter((s) => counts[s] > 0).map((s) => (
                <div
                  key={s}
                  style={{ width: `${(counts[s] / total) * 100}%`, backgroundColor: STATUS_META[s].color }}
                  title={`${s} ${counts[s]}개`}
                />
              ))}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
              {STATUSES.filter((s) => counts[s] > 0).map((s) => (
                <span key={s} className="inline-flex items-center gap-1">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: STATUS_META[s].color }} />
                  {s} {counts[s]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {headline.length > 0 && (
          <div className="rounded-lg p-2.5" style={{ backgroundColor: goal.tone.tint }}>
            <div className="mb-1 text-[10px] font-medium" style={{ color: goal.tone.text }}>
              대표지표
            </div>
            <ul className="flex flex-col gap-1">
              {headline.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate">{i.name}</span>
                  <span className="shrink-0 font-semibold tabular-nums" style={{ color: goal.tone.deep }}>
                    {i.computed.progress === null ? "—" : `${Math.round(i.computed.progress)}%`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <span
          className="mt-auto inline-flex items-center gap-1 text-xs font-medium group-hover:gap-2"
          style={{ color: goal.tone.text, transition: "gap 150ms" }}
        >
          지표 보기 <ArrowRightIcon className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}
