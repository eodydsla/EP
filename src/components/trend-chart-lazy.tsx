"use client";

import dynamic from "next/dynamic";
import type { TrendChartProps } from "./trend-chart";

/**
 * 차트 라이브러리(recharts)는 무겁고 상세 화면을 열기 전에는 필요 없다.
 * 첫 로딩 번들에서 빼고 실제로 그릴 때 가져온다.
 */
const Chart = dynamic(() => import("./trend-chart").then((m) => m.TrendChart), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[200px] w-full items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
      차트를 불러오는 중…
    </div>
  ),
});

export function TrendChart(props: TrendChartProps) {
  return (
    <div style={{ height: props.height ?? 260 }}>
      <Chart {...props} />
    </div>
  );
}
