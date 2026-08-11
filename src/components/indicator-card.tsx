"use client";

import type { DashIndicator } from "@/lib/data";
import { formatDelta, formatValue } from "@/lib/progress";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { Sparkline } from "@/components/sparkline";
import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon, ClockAlertIcon, EyeOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function IndicatorCard({
  indicator,
  onOpen,
  showGoal = true,
}: {
  indicator: DashIndicator;
  onOpen: (i: DashIndicator) => void;
  showGoal?: boolean;
}) {
  const c = indicator.computed;
  const TrendIcon = c.trend === "flat" || c.trend === null ? ArrowRightIcon : c.delta! > 0 ? ArrowUpRightIcon : ArrowDownRightIcon;
  const trendColor =
    c.trend === "good" ? "text-emerald-600" : c.trend === "bad" ? "text-rose-600" : "text-muted-foreground";

  return (
    <button
      type="button"
      onClick={() => onOpen(indicator)}
      className="group relative flex w-full flex-col gap-3 overflow-hidden rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      style={{ borderColor: indicator.tone.border, backgroundColor: indicator.tone.tint }}
    >
      {/* 좌측 목표색 액센트 바 */}
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: indicator.color }} />

      <div className="flex items-start justify-between gap-2 pl-1.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
              style={{ backgroundColor: indicator.tone.a15, color: indicator.tone.text }}
            >
              {indicator.code}
            </span>
            {showGoal && (
              <span className="truncate text-[11px] text-muted-foreground">
                {indicator.goalNo}. {indicator.goalName}
              </span>
            )}
            {!indicator.published && (
              <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                <EyeOffIcon className="size-2.5" /> 임시저장
              </span>
            )}
          </div>
          <h3 className="mt-1 line-clamp-2 text-sm leading-snug font-semibold">{indicator.name}</h3>
        </div>
        <StatusBadge status={c.status} />
      </div>

      <div className="flex items-end justify-between gap-3 pl-1.5">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl leading-none font-bold tabular-nums" style={{ color: indicator.tone.deep }}>
              {formatValue(c.latest?.value ?? null)}
            </span>
            {indicator.unit && <span className="text-xs text-muted-foreground">{indicator.unit}</span>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            {c.latest && <span className="tabular-nums">{c.latest.year}년</span>}
            {c.delta !== null && (
              <span className={cn("inline-flex items-center gap-0.5 tabular-nums", trendColor)}>
                <TrendIcon className="size-3" />
                {formatDelta(c.delta)}
              </span>
            )}
            {c.latest?.note && <span className="rounded bg-muted px-1">{c.latest.note}</span>}
            {c.stale && (
              <span className="inline-flex items-center gap-0.5 text-amber-700">
                <ClockAlertIcon className="size-3" /> 자료 갱신 필요
              </span>
            )}
          </div>
        </div>
        <Sparkline values={c.series.map((s) => s.value)} color={indicator.color} width={104} height={32} />
      </div>

      <div className="pl-1.5">
        {c.progress !== null ? (
          <>
            <ProgressBar
              progress={c.progress}
              expected={c.expected}
              color={indicator.color}
              status={c.status}
              height={7}
            />
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="tabular-nums">
                기준 {formatValue(indicator.baselineValue)}
                {indicator.baselineYear ? ` (${indicator.baselineYear})` : ""}
              </span>
              <span className="font-semibold tabular-nums" style={{ color: indicator.tone.text }}>
                달성 {Math.round(c.progress)}%
              </span>
              <span className="tabular-nums">
                목표 {formatValue(indicator.targetValue)}
                {indicator.targetYear ? ` (${indicator.targetYear})` : ""}
              </span>
            </div>
          </>
        ) : (
          <div className="rounded-md border border-dashed px-2 py-1.5 text-[11px] text-muted-foreground">
            {c.status === "자료없음" ? "실적값이 아직 없습니다" : "목표값이 없는 모니터링 지표입니다"}
          </div>
        )}
      </div>
    </button>
  );
}
