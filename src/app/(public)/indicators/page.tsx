import { getDashboard } from "@/lib/data";
import { IndicatorsExplorer } from "@/components/indicators-explorer";

export const dynamic = "force-dynamic";

export default async function IndicatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ goal?: string; indicator?: string }>;
}) {
  const { goal, indicator } = await searchParams;
  const { goals, indicators, config } = await getDashboard();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">{config.level3_label} 현황</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          카드를 클릭하면 지표 정의·산출식·출처와 연도별 추이를 볼 수 있습니다.
        </p>
      </div>
      <IndicatorsExplorer
        goals={goals}
        indicators={indicators}
        initialGoal={goal}
        initialIndicator={indicator}
        level2Label={config.level2_label}
      />
    </div>
  );
}
