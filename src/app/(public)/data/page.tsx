import Link from "next/link";
import { getDashboard } from "@/lib/data";
import { STATUSES, STATUS_META, formatValue } from "@/lib/progress";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DataPage() {
  const { indicators, config } = await getDashboard();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">데이터 · 방법론</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          전체 {config.level3_label} 메타데이터와 달성도 판정 기준입니다.
        </p>
      </div>

      {/* 판정 기준 */}
      <section>
        <h2 className="mb-3 text-lg font-bold">달성도 계산 방법</h2>
        <div className="rounded-xl border bg-card p-4 text-sm leading-relaxed">
          <p className="font-mono text-xs">
            진행률(%) = (최신값 − 기준값) ÷ (목표값 − 기준값) × 100
          </p>
          <p className="mt-1 text-muted-foreground">
            분모의 부호가 증가·감소 방향을 자동으로 흡수하므로, 온실가스 배출량처럼 값이 작아져야 좋은 지표도 같은 식으로
            계산됩니다.
          </p>
          <p className="mt-3 font-mono text-xs">
            기대진행률(%) = (최신 데이터 연도 − 기준연도) ÷ (목표연도 − 기준연도) × 100
          </p>
          <p className="mt-1 text-muted-foreground">
            현재연도가 아니라 <strong className="text-foreground">최신 데이터 연도</strong>를 기준으로 계산합니다. 통계
            공표가 1~2년 늦는 지표를 현재연도 기대치와 비교하면 정상적인 지표까지 지연으로 판정되기 때문입니다.
          </p>

          <ul className="mt-4 flex flex-col gap-1.5">
            {STATUSES.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <StatusBadge status={s} />
                <span className="text-xs text-muted-foreground">
                  {s === "달성" && "진행률 100% 이상"}
                  {s === "순조" && "진행률이 기대진행률의 90% 이상"}
                  {s === "지연" && "진행률이 기대진행률의 90% 미만"}
                  {s === "악화" && "진행률 음수 — 기준값보다 후퇴"}
                  {s === "모니터링" && "목표값이 설정되지 않은 관찰용 지표"}
                  {s === "자료없음" && "실적값이 아직 입력되지 않음"}
                  {" · "}
                  {STATUS_META[s].desc}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            최신 자료가 3년 넘게 갱신되지 않으면 카드에 「자료 갱신 필요」 배지가 함께 표시됩니다. 관리자가 상태를 직접
            지정한 지표는 자동 판정 대신 지정값을 따릅니다.
          </p>
        </div>
      </section>

      {/* 메타데이터 표 */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{config.level3_label} 메타데이터 ({indicators.length})</h2>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/api/export?type=indicators" />}>
            <DownloadIcon /> 전체 CSV 내려받기
          </Button>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">번호</th>
                <th className="px-3 py-2 text-left font-medium">지표명</th>
                <th className="px-3 py-2 text-left font-medium">정의</th>
                <th className="px-3 py-2 text-left font-medium">단위</th>
                <th className="px-3 py-2 text-right font-medium">기준</th>
                <th className="px-3 py-2 text-right font-medium">최신</th>
                <th className="px-3 py-2 text-right font-medium">목표</th>
                <th className="px-3 py-2 text-left font-medium">출처</th>
                <th className="px-3 py-2 text-left font-medium">갱신주기</th>
                <th className="px-3 py-2 text-left font-medium">담당</th>
                <th className="px-3 py-2 text-left font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((i) => (
                <tr key={i.id} className="border-t align-top">
                  <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap">
                    <span className="mr-1.5 inline-block size-2 rounded-full align-middle" style={{ backgroundColor: i.color }} />
                    {i.code}
                  </td>
                  <td className="px-3 py-2 font-medium">{i.name}</td>
                  <td className="max-w-[280px] px-3 py-2 text-xs text-muted-foreground">{i.definition ?? "—"}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{i.unit ?? "—"}</td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums whitespace-nowrap">
                    {formatValue(i.baselineValue)}
                    {i.baselineYear ? <span className="text-muted-foreground"> ({i.baselineYear})</span> : null}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-semibold tabular-nums whitespace-nowrap">
                    {formatValue(i.computed.latest?.value ?? null)}
                    {i.computed.latest ? <span className="font-normal text-muted-foreground"> ({i.computed.latest.year})</span> : null}
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums whitespace-nowrap">
                    {i.targetValue === null ? "—" : formatValue(i.targetValue)}
                    {i.targetYear ? <span className="text-muted-foreground"> ({i.targetYear})</span> : null}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {i.sourceUrl ? (
                      <a href={i.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                        {i.source ?? "링크"}
                      </a>
                    ) : (
                      (i.source ?? "—")
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{i.updateCycle ?? "—"}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{i.custodian ?? "—"}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={i.computed.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
