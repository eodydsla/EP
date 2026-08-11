"use client";

import type { DashIndicator } from "@/lib/data";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { TrendChart } from "@/components/trend-chart-lazy";
import { STATUS_META, formatValue } from "@/lib/progress";
import { DownloadIcon, ExternalLinkIcon } from "lucide-react";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children ?? "—"}</dd>
    </div>
  );
}

function downloadCsv(indicator: DashIndicator) {
  const rows = [
    ["indicator_id", "indicator_name", "year", "value", "unit", "note"],
    ...indicator.computed.series.map((v) => [
      indicator.code,
      indicator.name,
      String(v.year),
      String(v.value),
      indicator.unit ?? "",
      v.note ?? "",
    ]),
  ];
  const csv = rows.map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${indicator.code}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function IndicatorDrawer({
  indicator,
  onClose,
}: {
  indicator: DashIndicator | null;
  onClose: () => void;
}) {
  const open = !!indicator;
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-xl!">
        {indicator && <DrawerBody indicator={indicator} />}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({ indicator }: { indicator: DashIndicator }) {
  const c = indicator.computed;
  return (
    <>
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: indicator.color }} />
      <SheetHeader className="gap-2 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold"
            style={{ backgroundColor: indicator.tone.a15, color: indicator.tone.text }}
          >
            {indicator.code}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {indicator.goalNo}. {indicator.goalName} › {indicator.targetCode}
          </span>
          <StatusBadge status={c.status} />
        </div>
        <SheetTitle className="pr-8 text-lg leading-snug">{indicator.name}</SheetTitle>
        <SheetDescription>{indicator.targetName}</SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-5 px-4 pb-8">
        {/* 최신값 + 진행률 */}
        <div className="rounded-xl border p-4" style={{ backgroundColor: indicator.tone.tint, borderColor: indicator.tone.border }}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">
                최신 실적 {c.latest ? `(${c.latest.year}년)` : ""}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tabular-nums" style={{ color: indicator.tone.deep }}>
                  {formatValue(c.latest?.value ?? null)}
                </span>
                {indicator.unit && <span className="text-sm text-muted-foreground">{indicator.unit}</span>}
              </div>
            </div>
            {c.progress !== null && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">목표 대비 달성도</div>
                <div className="text-3xl font-bold tabular-nums" style={{ color: STATUS_META[c.status].color }}>
                  {Math.round(c.progress)}%
                </div>
              </div>
            )}
          </div>

          {c.progress !== null && (
            <div className="mt-3">
              <ProgressBar progress={c.progress} expected={c.expected} color={indicator.color} status={c.status} height={9} />
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="tabular-nums">
                  기준 {formatValue(indicator.baselineValue)} ({indicator.baselineYear})
                </span>
                {c.expected !== null && <span>기대 {Math.round(c.expected)}%</span>}
                <span className="tabular-nums">
                  목표 {formatValue(indicator.targetValue)} ({indicator.targetYear})
                </span>
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            {STATUS_META[c.status].desc}
            {c.overridden && " (관리자가 상태를 직접 지정)"}
            {c.stale && " · 최신 자료가 오래되어 갱신이 필요합니다."}
          </p>
        </div>

        {/* 시계열 */}
        <section>
          <h4 className="mb-2 text-sm font-semibold">연도별 추이</h4>
          <TrendChart
            data={c.series.map((s) => ({ year: s.year, value: s.value, note: s.note }))}
            color={indicator.color}
            unit={indicator.unit}
            baselineValue={indicator.baselineValue}
            baselineYear={indicator.baselineYear}
            targetValue={indicator.targetValue}
            targetYear={indicator.targetYear}
          />
        </section>

        <Separator />

        {/* 메타데이터 */}
        <section>
          <h4 className="mb-1 text-sm font-semibold">지표 설명</h4>
          <dl>
            <Field label="정의">{indicator.definition}</Field>
            <Field label="산출식">{indicator.method}</Field>
            <Field label="단위">{indicator.unit}</Field>
            <Field label="방향">
              {indicator.direction === "down" ? "값이 작을수록 좋음" : "값이 클수록 좋음"}
            </Field>
            <Field label="출처">
              {indicator.sourceUrl ? (
                <a
                  href={indicator.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline underline-offset-2"
                >
                  {indicator.source ?? indicator.sourceUrl}
                  <ExternalLinkIcon className="size-3" />
                </a>
              ) : (
                indicator.source
              )}
            </Field>
            <Field label="갱신주기">{indicator.updateCycle}</Field>
            <Field label="담당">{indicator.custodian}</Field>
            <Field label="비고">{indicator.note}</Field>
          </dl>
        </section>

        <Separator />

        {/* 원자료 */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold">원자료</h4>
            <Button variant="outline" size="sm" onClick={() => downloadCsv(indicator)}>
              <DownloadIcon /> CSV
            </Button>
          </div>
          {c.series.length ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-medium">연도</th>
                    <th className="px-3 py-1.5 text-right font-medium">값{indicator.unit ? ` (${indicator.unit})` : ""}</th>
                    <th className="px-3 py-1.5 text-left font-medium">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {[...c.series].reverse().map((v) => (
                    <tr key={v.year} className="border-t">
                      <td className="px-3 py-1.5 tabular-nums">{v.year}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatValue(v.value)}</td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">{v.note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">실적값이 아직 입력되지 않았습니다.</p>
          )}
        </section>
      </div>
    </>
  );
}
