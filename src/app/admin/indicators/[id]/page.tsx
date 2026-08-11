import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/data";
import { compute, formatValue } from "@/lib/progress";
import { goalColor, tones } from "@/lib/colors";
import { IndicatorForm } from "@/components/admin/indicator-form";
import { ValuesEditor } from "@/components/admin/values-editor";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { TrendChart } from "@/components/trend-chart-lazy";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditIndicatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [indicator, targets, config, goals] = await Promise.all([
    prisma.indicator.findUnique({
      where: { id },
      include: { values: { orderBy: { year: "asc" } }, target: { include: { goal: true } } },
    }),
    prisma.target.findMany({ orderBy: [{ order: "asc" }, { code: "asc" }], include: { goal: true } }),
    getConfig(),
    prisma.goal.findMany({ orderBy: [{ order: "asc" }, { code: "asc" }] }),
  ]);

  if (!indicator) notFound();

  const goalIndex = goals.findIndex((g) => g.id === indicator.target.goalId);
  const color = goalColor(indicator.target.goal.color, Math.max(0, goalIndex));
  const tone = tones(color);
  const c = compute(
    indicator,
    indicator.values.map((v) => ({ year: v.year, value: v.value, note: v.note })),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" className="-ml-2 mb-1" nativeButton={false} render={<Link href="/admin/indicators" />}>
            <ArrowLeftIcon /> {config.level3_label} 목록
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold"
              style={{ backgroundColor: tone.a15, color: tone.text }}
            >
              {indicator.code}
            </span>
            <StatusBadge status={c.status} />
            {!indicator.published && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">임시저장</span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-bold">{indicator.name}</h1>
          <p className="text-sm text-muted-foreground">
            {indicator.target.goal.no}. {indicator.target.goal.name} › {indicator.target.code} {indicator.target.name}
          </p>
        </div>
      </div>

      {/* 현재 계산 결과 미리보기 */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold">연도별 추이 (저장 즉시 반영)</h2>
          <TrendChart
            data={c.series.map((s) => ({ year: s.year, value: s.value, note: s.note }))}
            color={color}
            unit={indicator.unit}
            baselineValue={indicator.baselineValue}
            baselineYear={indicator.baselineYear}
            targetValue={indicator.targetValue}
            targetYear={indicator.targetYear}
            height={220}
          />
        </div>
        <div className="rounded-xl border p-4" style={{ backgroundColor: tone.tint, borderColor: tone.border }}>
          <h2 className="mb-3 text-sm font-bold">계산 결과</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="최신값">
              {formatValue(c.latest?.value ?? null)} {indicator.unit ?? ""}{" "}
              {c.latest && <span className="text-xs text-muted-foreground">({c.latest.year})</span>}
            </Row>
            <Row label="기준값">
              {formatValue(indicator.baselineValue)}{" "}
              {indicator.baselineYear && <span className="text-xs text-muted-foreground">({indicator.baselineYear})</span>}
            </Row>
            <Row label="목표값">
              {indicator.targetValue === null ? "미설정" : formatValue(indicator.targetValue)}{" "}
              {indicator.targetYear && <span className="text-xs text-muted-foreground">({indicator.targetYear})</span>}
            </Row>
            <Row label="진행률">
              {c.progress === null ? "—" : `${Math.round(c.progress)}%`}
              {c.rawProgress !== null && c.rawProgress < 0 && (
                <span className="ml-1 text-xs text-rose-600">(실제 {Math.round(c.rawProgress)}%)</span>
              )}
            </Row>
            <Row label="기대진행률">{c.expected === null ? "—" : `${Math.round(c.expected)}%`}</Row>
            <Row label="판정">
              <StatusBadge status={c.status} size="sm" />
              {c.overridden && <span className="ml-1 text-[11px] text-muted-foreground">직접 지정됨</span>}
            </Row>
          </dl>
          {c.progress !== null && (
            <div className="mt-3">
              <ProgressBar progress={c.progress} expected={c.expected} color={color} status={c.status} height={8} />
            </div>
          )}
        </div>
      </div>

      {/* 실적값 편집 */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-1 text-base font-bold">연도별 실적값</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          한 행이 한 연도입니다. 같은 연도·지역으로 저장하면 기존 값을 덮어씁니다.
        </p>
        <ValuesEditor
          indicatorId={indicator.id}
          unit={indicator.unit}
          values={indicator.values.map((v) => ({
            id: v.id,
            year: v.year,
            value: v.value,
            region: v.region,
            note: v.note,
          }))}
        />
      </section>

      {/* 메타데이터 편집 */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 text-base font-bold">{config.level3_label} 메타데이터</h2>
        <IndicatorForm
          values={{
            id: indicator.id,
            code: indicator.code,
            targetId: indicator.targetId,
            name: indicator.name,
            definition: indicator.definition,
            method: indicator.method,
            unit: indicator.unit,
            direction: indicator.direction,
            baselineYear: indicator.baselineYear,
            baselineValue: indicator.baselineValue,
            targetYear: indicator.targetYear,
            targetValue: indicator.targetValue,
            source: indicator.source,
            sourceUrl: indicator.sourceUrl,
            updateCycle: indicator.updateCycle,
            custodian: indicator.custodian,
            statusOverride: indicator.statusOverride,
            isHeadline: indicator.isHeadline,
            published: indicator.published,
            note: indicator.note,
            order: indicator.order,
          }}
          targets={targets.map((t) => ({
            id: t.id,
            code: t.code,
            name: t.name,
            goalLabel: `${t.goal.no}. ${t.goal.name}`,
          }))}
          level2Label={config.level2_label}
          level3Label={config.level3_label}
        />
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{children}</dd>
    </div>
  );
}
