import Link from "next/link";
import { getDashboard } from "@/lib/data";
import { averageProgress, countByStatus } from "@/lib/progress";
import { SummaryCards } from "@/components/summary-cards";
import { GoalCard } from "@/components/goal-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, ChevronRightIcon, TriangleAlertIcon, TrophyIcon } from "lucide-react";
import { formatValue } from "@/lib/progress";

export const dynamic = "force-dynamic";

const ACTION_STATUS_COLOR: Record<string, string> = {
  완료: "#2B8A3E",
  추진중: "#1971C2",
  지연: "#E8590C",
  예정: "#868E96",
};

export default async function OverviewPage() {
  const { goals, indicators, actions, config } = await getDashboard();
  const computed = indicators.map((i) => i.computed);
  const counts = countByStatus(computed);
  const avg = averageProgress(computed);

  const actionCounts = actions.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  const attention = [...indicators]
    .filter((i) => i.computed.status === "지연" || i.computed.status === "악화")
    .sort((a, b) => (a.computed.progress ?? 0) - (b.computed.progress ?? 0))
    .slice(0, 5);

  const best = [...indicators]
    .filter((i) => i.computed.progress !== null)
    .sort((a, b) => (b.computed.progress ?? 0) - (a.computed.progress ?? 0))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      {/* 히어로 */}
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex h-1.5 w-full">
          {goals.map((g) => (
            <div key={g.id} className="h-full flex-1" style={{ backgroundColor: g.color }} />
          ))}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{config.framework_name}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{config.site_title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{config.site_subtitle}</p>
          </div>
          <div className="flex items-end gap-6">
            <div>
              <div className="text-xs text-muted-foreground">전체 평균 달성도</div>
              <div className="text-4xl leading-none font-bold tabular-nums">
                {avg === null ? "—" : `${Math.round(avg)}%`}
              </div>
            </div>
            <Button nativeButton={false} render={<Link href="/indicators" />}>
              지표 전체 보기 <ArrowRightIcon />
            </Button>
          </div>
        </div>
      </section>

      {/* 집계 카드 */}
      <section>
        <h2 className="mb-3 text-lg font-bold">지표 이행 현황</h2>
        <SummaryCards total={indicators.length} counts={counts} />
      </section>

      {/* 목표 카드 */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold">{config.level1_label}별 현황</h2>
          <span className="text-xs text-muted-foreground">카드를 클릭하면 해당 {config.level1_label}의 지표만 봅니다</span>
        </div>
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(340px,1fr))]">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} level3Label={config.level3_label} />
          ))}
        </div>
        {goals.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            등록된 {config.level1_label}이 없습니다. 관리자 페이지에서 추가해 주세요.
          </div>
        )}
      </section>

      {/* 주의 필요 / 성과 좋은 지표 */}
      <section className="grid gap-4 lg:grid-cols-2">
        <HighlightList
          title="관리가 필요한 지표"
          desc="기대 진행 속도에 못 미치거나 기준값보다 후퇴한 지표"
          icon={<TriangleAlertIcon className="size-4 text-orange-600" />}
          items={attention}
          empty="현재 지연·악화 상태인 지표가 없습니다."
        />
        <HighlightList
          title="목표에 근접한 지표"
          desc="목표 대비 달성도가 높은 지표"
          icon={<TrophyIcon className="size-4 text-emerald-600" />}
          items={best}
          empty="달성도를 계산할 수 있는 지표가 없습니다."
        />
      </section>

      {/* 이행과제 요약 */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold">이행과제</h2>
          <Link href="/actions" className="text-xs font-medium underline underline-offset-2">
            전체 보기
          </Link>
        </div>
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
          {["완료", "추진중", "지연", "예정"].map((s) => (
            <div key={s} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: ACTION_STATUS_COLOR[s] }} />
                <span className="text-xs font-medium text-muted-foreground">{s}</span>
              </div>
              <div className="mt-1 text-3xl font-bold tabular-nums" style={{ color: ACTION_STATUS_COLOR[s] }}>
                {actionCounts[s] ?? 0}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function HighlightList({
  title,
  desc,
  icon,
  items,
  empty,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  items: Awaited<ReturnType<typeof getDashboard>>["indicators"];
  empty: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <p className="mt-0.5 mb-3 text-xs text-muted-foreground">{desc}</p>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {items.map((i) => (
            <li key={i.id}>
              {/* 클릭하면 지표 화면에서 해당 지표 상세가 바로 열린다 */}
              <Link
                href={`/indicators?indicator=${i.id}`}
                className="group/item -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
              >
                <span className="h-8 w-1 shrink-0 rounded" style={{ backgroundColor: i.color }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium group-hover/item:underline">{i.name}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="font-mono">{i.code}</span>
                    <span>·</span>
                    <span className="tabular-nums">
                      {formatValue(i.computed.latest?.value ?? null)}
                      {i.unit ? ` ${i.unit}` : ""}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums">
                  {i.computed.progress === null ? "—" : `${Math.round(i.computed.progress)}%`}
                </span>
                <StatusBadge status={i.computed.status} size="sm" />
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/item:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
