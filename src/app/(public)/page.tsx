import Link from "next/link";
import { getDashboard } from "@/lib/data";
import { STATUSES, STATUS_META, averageProgress, countByStatus, formatValue } from "@/lib/progress";
import { SummaryCards } from "@/components/summary-cards";
import { Donut } from "@/components/donut";
import { StatusBadge } from "@/components/status-badge";
import { ArrowRightIcon, ChevronRightIcon, TriangleAlertIcon } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * 통합 현황 — 모니터링 영역 전체를 한 화면에서 비교한다.
 * 영역을 추가하면 카드가 자동으로 늘어난다(코드 수정 불필요).
 */
export default async function OverviewPage() {
  const { tracks, indicators, config } = await getDashboard();
  const computed = indicators.map((i) => i.computed);
  const avg = averageProgress(computed);

  const attention = [...indicators]
    .filter((i) => i.computed.status === "지연" || i.computed.status === "악화")
    .sort((a, b) => (a.computed.progress ?? 0) - (b.computed.progress ?? 0))
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-8">
      {/* 히어로 */}
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex h-1.5 w-full">
          {tracks.map((t) => (
            <div key={t.id} className="h-full flex-1" style={{ backgroundColor: t.color }} />
          ))}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6">
          <div className="min-w-0">
            {config.framework_name && (
              <p className="text-xs font-medium text-muted-foreground">{config.framework_name}</p>
            )}
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
            <div>
              <div className="text-xs text-muted-foreground">전체 {config.level3_label}</div>
              <div className="text-4xl leading-none font-bold tabular-nums">{indicators.length}</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">전체 이행 현황</h2>
        <SummaryCards total={indicators.length} counts={countByStatus(computed)} />
      </section>

      {/* 영역 카드 */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold">{config.level0_label}별 현황</h2>
          <span className="text-xs text-muted-foreground">
            카드를 클릭하면 해당 {config.level0_label}의 상세 화면으로 이동합니다
          </span>
        </div>
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(340px,1fr))]">
          {tracks.map((t) => {
            const c = t.indicators.map((i) => i.computed);
            const counts = countByStatus(c);
            const trackAvg = averageProgress(c);
            const total = c.length;
            return (
              <Link
                key={t.id}
                href={`/${t.code}`}
                className="group flex flex-col overflow-hidden rounded-2xl border shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderColor: t.tone.border }}
              >
                <div
                  className="p-5 text-white"
                  style={{ background: `linear-gradient(135deg, ${t.color} 0%, ${t.tone.deep} 100%)` }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl leading-none drop-shadow-sm">{t.icon ?? "◆"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium opacity-85">{config.level0_label}</div>
                      <h3 className="text-lg leading-tight font-bold">{t.name}</h3>
                    </div>
                  </div>
                  {t.description && (
                    <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed opacity-85">{t.description}</p>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-3 bg-card p-4">
                  <div className="flex items-center gap-4">
                    <Donut value={trackAvg} color={t.color} label="평균 달성" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground">
                        {config.level1_label} <strong className="text-foreground tabular-nums">{t.goals.length}</strong>
                        {" · "}
                        {config.level3_label} <strong className="text-foreground tabular-nums">{total}</strong>
                        {t.actions.length > 0 && (
                          <>
                            {" · "}이행과제 <strong className="text-foreground tabular-nums">{t.actions.length}</strong>
                          </>
                        )}
                      </div>
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

                  <ul className="flex flex-col gap-1 rounded-lg p-2.5" style={{ backgroundColor: t.tone.tint }}>
                    {t.goals.map((g) => (
                      <li key={g.id} className="flex items-center gap-2 text-[11px]">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: g.color }} />
                        <span className="truncate">{g.name}</span>
                        <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">
                          {g.indicators.length}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <span
                    className="mt-auto inline-flex items-center gap-1 text-xs font-medium group-hover:gap-2"
                    style={{ color: t.tone.text, transition: "gap 150ms" }}
                  >
                    자세히 보기 <ArrowRightIcon className="size-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        {tracks.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            등록된 {config.level0_label}이 없습니다. 관리자 페이지에서 추가해 주세요.
          </div>
        )}
      </section>

      {/* 전체 영역에서 관리가 필요한 지표 */}
      <section className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <TriangleAlertIcon className="size-4 text-orange-600" />
          <h2 className="text-sm font-bold">전체 {config.level0_label}에서 관리가 필요한 {config.level3_label}</h2>
        </div>
        <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
          기대 진행 속도에 못 미치거나 기준값보다 후퇴한 항목입니다. 클릭하면 상세가 열립니다.
        </p>
        {attention.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">현재 지연·악화 상태인 항목이 없습니다.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {attention.map((i) => (
              <li key={i.id}>
                <Link
                  href={`/${i.trackCode}/indicators?indicator=${i.id}`}
                  className="group/item -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
                >
                  <span className="h-8 w-1 shrink-0 rounded" style={{ backgroundColor: i.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium group-hover/item:underline">{i.name}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>{i.trackName}</span>
                      <span>·</span>
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
      </section>
    </div>
  );
}
