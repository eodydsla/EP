import Link from "next/link";
import { getDashboard } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { AdminIndicatorTable } from "./indicator-table";

export const dynamic = "force-dynamic";

export default async function AdminIndicatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ goal?: string; target?: string }>;
}) {
  const sp = await searchParams;
  const { tracks, goals, indicators, config } = await getDashboard(true);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{config.level3_label} 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            총 {indicators.length}개. 행을 클릭하면 지표 메타데이터와 연도별 실적값을 편집합니다.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/indicators/new" />}>
          <PlusIcon /> {config.level3_label} 추가
        </Button>
      </div>

      <AdminIndicatorTable
        indicators={indicators}
        tracks={tracks.map((t) => ({ id: t.id, name: t.name, color: t.color }))}
        goals={goals.map((g) => ({ id: g.id, no: g.no, name: g.name, color: g.color, trackId: g.trackId }))}
        targets={goals.flatMap((g) => g.targets.map((t) => ({ id: t.id, code: t.code, name: t.name, goalId: g.id })))}
        initialGoal={sp.goal}
        initialTarget={sp.target}
        level0Label={config.level0_label}
        level1Label={config.level1_label}
        level2Label={config.level2_label}
      />
    </div>
  );
}
