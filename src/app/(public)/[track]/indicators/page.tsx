import { notFound } from "next/navigation";
import { getDashboard, findTrack } from "@/lib/data";
import { IndicatorsExplorer } from "@/components/indicators-explorer";

export const dynamic = "force-dynamic";

export default async function IndicatorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ track: string }>;
  searchParams: Promise<{ goal?: string; indicator?: string }>;
}) {
  const { track: code } = await params;
  const { goal, indicator } = await searchParams;
  const dashboard = await getDashboard();
  const track = findTrack(dashboard, code);
  if (!track) notFound();

  const { config } = dashboard;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">
          {track.name} · {config.level3_label} 현황
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          카드를 클릭하면 정의·산출식·출처와 연도별 추이를 볼 수 있습니다.
        </p>
      </div>
      <IndicatorsExplorer
        goals={track.goals}
        indicators={track.indicators}
        initialGoal={goal}
        initialIndicator={indicator}
        level1Label={config.level1_label}
        level2Label={config.level2_label}
      />
    </div>
  );
}
