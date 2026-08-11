import Link from "next/link";
import { getDashboard } from "@/lib/data";
import { averageProgress, countByStatus } from "@/lib/progress";
import { SummaryCards } from "@/components/summary-cards";
import { GoalCard } from "@/components/goal-card";
import { IndicatorsExplorer } from "@/components/indicators-explorer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EyeIcon, ExternalLinkIcon } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * 관리자 미리보기 — 임시저장(비공개) 항목까지 포함해서
 * 공개 화면과 동일한 컴포넌트로 렌더한다.
 */
export default async function PreviewPage() {
  const { goals, indicators, config } = await getDashboard(true);
  const computed = indicators.map((i) => i.computed);
  const drafts = indicators.filter((i) => !i.published).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">대시보드 미리보기</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            공개 화면과 동일한 화면이되, <strong>임시저장 항목까지 포함</strong>해서 보여줍니다.
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/" target="_blank" />}>
          실제 공개 화면 열기 <ExternalLinkIcon />
        </Button>
      </div>

      <Alert>
        <EyeIcon />
        <AlertDescription>
          전체 {indicators.length}개 중 <strong>{drafts}개</strong>가 임시저장 상태입니다. 이 항목들은 공개 화면에는
          나타나지 않으며, 미리보기에서는 카드에 「임시저장」 표시가 붙습니다.
        </AlertDescription>
      </Alert>

      <section>
        <h2 className="mb-3 text-base font-bold">개요</h2>
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{config.framework_name}</p>
              <h3 className="text-xl font-bold">{config.site_title}</h3>
              <p className="text-sm text-muted-foreground">{config.site_subtitle}</p>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">전체 평균 달성도</div>
              <div className="text-3xl font-bold tabular-nums">
                {averageProgress(computed) === null ? "—" : `${Math.round(averageProgress(computed)!)}%`}
              </div>
            </div>
          </div>
          <SummaryCards total={indicators.length} counts={countByStatus(computed)} />
          <div className="mt-4 grid gap-4 grid-cols-[repeat(auto-fit,minmax(340px,1fr))]">
            {goals.map((g) => (
              <GoalCard key={g.id} goal={g} level3Label={config.level3_label} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold">{config.level3_label}</h2>
        <IndicatorsExplorer goals={goals} indicators={indicators} level2Label={config.level2_label} />
      </section>
    </div>
  );
}
