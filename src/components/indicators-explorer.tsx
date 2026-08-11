"use client";

import { useMemo, useState } from "react";
import type { DashGoal, DashIndicator } from "@/lib/data";
import { STATUSES, type Status } from "@/lib/progress";
import { IndicatorCard } from "@/components/indicator-card";
import { IndicatorDrawer } from "@/components/indicator-drawer";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LayoutGridIcon, ListIcon, SearchIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatValue } from "@/lib/progress";

type Sort = "code" | "progress-desc" | "progress-asc" | "latest";

export function IndicatorsExplorer({
  goals,
  indicators,
  initialGoal,
  initialIndicator,
  level1Label,
  level2Label,
}: {
  goals: { id: string; no: string; name: string; color: string }[] | DashGoal[];
  indicators: DashIndicator[];
  initialGoal?: string;
  /** ?indicator=<id> 로 들어오면 해당 지표 상세를 바로 연다 (개요 화면에서 클릭했을 때) */
  initialIndicator?: string;
  level1Label: string;
  level2Label: string;
}) {
  const [goalId, setGoalId] = useState<string>(initialGoal ?? "all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("code");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [open, setOpen] = useState<DashIndicator | null>(
    () => indicators.find((i) => i.id === initialIndicator || i.code === initialIndicator) ?? null,
  );

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const out = indicators.filter((i) => {
      if (goalId !== "all" && i.goalId !== goalId) return false;
      if (status !== "all" && i.computed.status !== status) return false;
      if (kw) {
        const hay = `${i.code} ${i.name} ${i.definition ?? ""} ${i.targetName} ${i.goalName} ${i.custodian ?? ""} ${i.source ?? ""}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
    const byProgress = (i: DashIndicator) => i.computed.progress ?? -1;
    out.sort((a, b) => {
      if (sort === "progress-desc") return byProgress(b) - byProgress(a);
      if (sort === "progress-asc") return byProgress(a) - byProgress(b);
      if (sort === "latest") return (b.computed.latest?.year ?? 0) - (a.computed.latest?.year ?? 0);
      return a.code.localeCompare(b.code, "ko", { numeric: true });
    });
    return out;
  }, [indicators, goalId, status, q, sort]);

  // 세부목표별 그룹 (코드 정렬 기준일 때만 그룹 헤더를 보여준다)
  const grouped = useMemo(() => {
    const map = new Map<string, { code: string; name: string; goalName: string; color: string; items: DashIndicator[] }>();
    for (const i of filtered) {
      const g = map.get(i.targetId) ?? {
        code: i.targetCode,
        name: i.targetName,
        goalName: i.goalName,
        color: i.color,
        items: [],
      };
      g.items.push(i);
      map.set(i.targetId, g);
    }
    return [...map.values()].sort((a, b) => a.code.localeCompare(b.code, "ko", { numeric: true }));
  }, [filtered]);

  const statusCounts = useMemo(() => {
    const base = indicators.filter((i) => goalId === "all" || i.goalId === goalId);
    return Object.fromEntries(STATUSES.map((s) => [s, base.filter((i) => i.computed.status === s).length])) as Record<Status, number>;
  }, [indicators, goalId]);

  const hasFilter = goalId !== "all" || status !== "all" || q.trim() !== "";

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 바 */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={goalId === "all"} onClick={() => setGoalId("all")}>
            {level1Label} 전체 {indicators.length}
          </FilterChip>
          {goals.map((g) => {
            const n = indicators.filter((i) => i.goalId === g.id).length;
            return (
              <FilterChip key={g.id} active={goalId === g.id} color={g.color} onClick={() => setGoalId(g.id)}>
                {g.no}. {g.name} {n}
              </FilterChip>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={status === "all"} onClick={() => setStatus("all")}>
            상태 전체
          </FilterChip>
          {STATUSES.filter((s) => statusCounts[s] > 0).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(status === s ? "all" : s)}
              className={cn(
                "rounded-full transition-opacity",
                status !== "all" && status !== s ? "opacity-40 hover:opacity-70" : "",
              )}
            >
              <StatusBadge status={s} className={cn(status === s && "ring-2 ring-foreground/20")} />
              <span className="sr-only">{statusCounts[s]}건</span>
            </button>
          ))}
          <span className="text-xs text-muted-foreground">
            {status !== "all" ? `${statusCounts[status] ?? 0}건` : ""}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="지표명·설명·담당·출처 검색"
              className="pl-8"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
            aria-label="정렬"
          >
            <option value="code">지표번호순</option>
            <option value="progress-desc">달성도 높은순</option>
            <option value="progress-asc">달성도 낮은순</option>
            <option value="latest">최신 자료순</option>
          </select>
          <div className="flex overflow-hidden rounded-md border">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn("px-2.5 py-2", view === "grid" ? "bg-foreground text-background" : "hover:bg-muted")}
              aria-label="카드 보기"
            >
              <LayoutGridIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn("px-2.5 py-2", view === "list" ? "bg-foreground text-background" : "hover:bg-muted")}
              aria-label="목록 보기"
            >
              <ListIcon className="size-4" />
            </button>
          </div>
          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setGoalId("all");
                setStatus("all");
                setQ("");
              }}
            >
              <XIcon /> 필터 초기화
            </Button>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">{filtered.length}</strong>개 지표
        {hasFilter && ` (전체 ${indicators.length}개 중)`}
      </p>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          조건에 맞는 지표가 없습니다.
        </div>
      )}

      {view === "grid" ? (
        <div className="flex flex-col gap-7">
          {grouped.map((g) => (
            <section key={g.code}>
              <div className="mb-2.5 flex items-baseline gap-2 border-l-3 pl-2.5" style={{ borderColor: g.color }}>
                <span className="font-mono text-xs font-semibold" style={{ color: g.color }}>
                  {g.code}
                </span>
                <h3 className="text-sm font-semibold">{g.name}</h3>
                <span className="text-xs text-muted-foreground">
                  {level2Label} · {g.items.length}개 지표
                </span>
              </div>
              <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(330px,1fr))]">
                {g.items.map((i) => (
                  <IndicatorCard key={i.id} indicator={i} onOpen={setOpen} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">지표</th>
                <th className="px-3 py-2 text-right font-medium">최신값</th>
                <th className="px-3 py-2 text-right font-medium">기준</th>
                <th className="px-3 py-2 text-right font-medium">목표</th>
                <th className="px-3 py-2 text-right font-medium">달성도</th>
                <th className="px-3 py-2 text-left font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr
                  key={i.id}
                  className="cursor-pointer border-t hover:bg-muted/40"
                  onClick={() => setOpen(i)}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-1 shrink-0 rounded" style={{ backgroundColor: i.color }} />
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] text-muted-foreground">{i.code}</div>
                        <div className="truncate font-medium">{i.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatValue(i.computed.latest?.value ?? null)}
                    {i.unit ? <span className="ml-0.5 text-[10px] text-muted-foreground">{i.unit}</span> : null}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{formatValue(i.baselineValue)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{formatValue(i.targetValue)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {i.computed.progress === null ? "—" : `${Math.round(i.computed.progress)}%`}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={i.computed.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <IndicatorDrawer indicator={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function FilterChip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "text-white" : "bg-background hover:bg-muted",
      )}
      style={
        active
          ? { backgroundColor: color ?? "var(--foreground)", borderColor: color ?? "var(--foreground)" }
          : color
            ? { borderColor: color + "55", color: color }
            : undefined
      }
    >
      {children}
    </button>
  );
}
