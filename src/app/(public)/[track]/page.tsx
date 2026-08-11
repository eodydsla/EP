import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboard, findTrack, type DashIndicator } from "@/lib/data";
import { averageProgress, countByStatus, formatValue } from "@/lib/progress";
import { SummaryCards } from "@/components/summary-cards";
import { GoalCard } from "@/components/goal-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, ChevronRightIcon, TriangleAlertIcon, TrophyIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const ACTION_STATUS_COLOR: Record<string, string> = {
  완료: "#2B8A3E",
  추진중: "#1971C2",
  지연: "#E8590C",
  예정: "#868E96",
};

export default async function TrackOverviewPage({ params }: { params: Promise<{ track: string }> }) {
  const { track: code } = await params;
  const dashboard = await getDashboard();
  const track = findTrack(dashboard, code);
  if (!track) notFound();

  const { config } = dashboard;
  const computed = track.indicators.map((i) => i.computed);
  const counts = countByStatus(computed);
  const avg = averageProgress(computed);

  const actionCounts = track.actions.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  const attention = [...track.indicators]
    .filter((i) => i.computed.status === "지연" || i.computed.status === "악화")
    .sort((a, b) => (a.computed.progress ?? 0) - (b.computed.progress ?? 0))
    .slice(0, 5);

  const best = [...track.indicators]
    .filter((i) => i.computed.progress !== null)
    .sort((a, b) => (b.computed.progress ?? 0) - (a.computed.progress ?? 0))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      {/* 히어로 */}
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="h-1.5 w-full" style={{ backgroundColor: track.color }} />
        <div className="flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{config.level0_label}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{track.name}</h1>
            {track.description && <p className="mt-1 text-sm text-muted-foreground">{track.description}</p>}
          </div>
          <div className="flex items-end gap-6">
            <div>
              <div className="text-xs text-muted-foreground">평균 달성도</div>
              <div className="text-4xl leading-none font-bold tabular-nums" style={{ color: track.tone.deep }}>
                {avg === null ? "—" : `${Math.round(avg)}%`}
              </div>
            </div>
            <Button nativeButton={false} render={<Link href={`/${track.code}/indicators`} />}>
              {config.level3_label} 전체 보기 <ArrowRightIcon />
            </Button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">{config.level3_label} 이행 현황</h2>
        <SummaryCards total={track.indicators.length} counts={counts} totalLabel={`전체 ${config.level3_label}`} />
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold">{config.level1_label}별 현황</h2>
          <span className="text-xs text-muted-foreground">
            카드를 클릭하면 해당 {config.level1_label}의 {config.level3_label}만 봅니다
          </span>
        </div>
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(340px,1fr))]">
          {track.goals.map((g) => (
            <GoalCard key={g.id} goal={g} level1Label={config.level1_label} level3Label={config.level3_label} />
          ))}
        </div>
        {track.goals.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            등록된 {config.level1_label}이 없습니다. 관리자 페이지에서 추가해 주세요.
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <HighlightList
          trackCode={track.code}
          title={`관리가 필요한 ${config.level3_label}`}
          desc="기대 진행 속도에 못 미치거나 기준값보다 후퇴한 항목"
          icon={<TriangleAlertIcon className="size-4 text-orange-600" />}
          items={attention}
          empty="현재 지연·악화 상태인 항목이 없습니다."
        />
        <HighlightList
          trackCode={track.code}
          title="목표에 근접한 항목"
          desc="목표 대비 달성도가 높은 항목"
          icon={<TrophyIcon className="size-4 text-emerald-600" />}
          items={best}
          empty="달성도를 계산할 수 있는 항목이 없습니다."
        />
      </section>

      {track.actions.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">이행과제</h2>
            <Link href={`/${track.code}/actions`} className="text-xs font-medium underline underline-offset-2">
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
      )}
    </div>
  );
}

function HighlightList({
  trackCode,
  title,
  desc,
  icon,
  items,
  empty,
}: {
  trackCode: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  items: DashIndicator[];
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
              {/* 클릭하면 지표 화면에서 해당 항목 상세가 바로 열린다 */}
              <Link
                href={`/${trackCode}/indicators?indicator=${i.id}`}
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
