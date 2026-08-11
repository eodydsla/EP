"use client";

import { useMemo, useState } from "react";
import type { DashAction } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronDownIcon, ExternalLinkIcon, SearchIcon, UserIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const ACTION_STATUSES = ["완료", "추진중", "지연", "예정"] as const;

export const ACTION_STATUS_META: Record<string, { color: string; bg: string }> = {
  완료: { color: "#2B8A3E", bg: "rgba(43,138,62,0.10)" },
  추진중: { color: "#1971C2", bg: "rgba(25,113,194,0.10)" },
  지연: { color: "#E8590C", bg: "rgba(232,89,12,0.10)" },
  예정: { color: "#868E96", bg: "rgba(134,142,150,0.12)" },
};

export function ActionStatusChip({ status, size = "default" }: { status: string; size?: "sm" | "default" }) {
  const meta = ACTION_STATUS_META[status] ?? { color: "#868E96", bg: "rgba(134,142,150,0.12)" };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs",
      )}
      style={{ backgroundColor: meta.bg, color: meta.color, borderColor: meta.color + "33" }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {status}
    </span>
  );
}

export function ActionsBoard({
  actions,
  goals,
}: {
  actions: DashAction[];
  goals: { id: string; no: string; name: string; color: string }[];
}) {
  const [status, setStatus] = useState<string>("all");
  const [goalId, setGoalId] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [q, setQ] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const years = useMemo(
    () => [...new Set(actions.map((a) => a.dueYear).filter((y): y is number => !!y))].sort(),
    [actions],
  );

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return actions.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (goalId !== "all" && a.goalId !== goalId) return false;
      if (year !== "all" && String(a.dueYear ?? "") !== year) return false;
      if (kw && !`${a.code} ${a.title} ${a.summary ?? ""} ${a.responsible ?? ""}`.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [actions, status, goalId, year, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; color: string; items: DashAction[] }>();
    for (const a of filtered) {
      const key = a.goalId ?? "__none";
      const g = map.get(key) ?? {
        name: a.goalNo ? `${a.goalNo}. ${a.goalName}` : "미분류",
        color: a.color ?? "#94a3b8",
        items: [],
      };
      g.items.push(a);
      map.set(key, g);
    }
    return [...map.values()];
  }, [filtered]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of actions) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [actions]);

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const hasFilter = status !== "all" || goalId !== "all" || year !== "all" || q.trim() !== "";

  return (
    <div className="flex flex-col gap-4">
      {/* 집계 카드 */}
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
        {ACTION_STATUSES.map((s) => {
          const meta = ACTION_STATUS_META[s];
          const active = status === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(active ? "all" : s)}
              className={cn(
                "rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm",
                active && "ring-2 ring-offset-1",
              )}
              style={{
                backgroundColor: meta.bg,
                borderColor: meta.color + "33",
                ...(active ? ({ ["--tw-ring-color" as string]: meta.color } as React.CSSProperties) : {}),
              }}
            >
              <div className="text-xs font-medium" style={{ color: meta.color }}>
                {s}
              </div>
              <div className="mt-1 text-3xl font-bold tabular-nums" style={{ color: meta.color }}>
                {counts[s] ?? 0}
              </div>
            </button>
          );
        })}
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <select
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
          aria-label="목표"
        >
          <option value="all">목표 전체</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.no}. {g.name}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
          aria-label="기한"
        >
          <option value="all">기한 전체</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}년
            </option>
          ))}
        </select>
        <div className="relative min-w-[180px] flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="과제명·담당기관 검색" className="pl-8" />
        </div>
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatus("all");
              setGoalId("all");
              setYear("all");
              setQ("");
            }}
          >
            <XIcon /> 초기화
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">{filtered.length}</strong>개 과제
        {hasFilter && ` (전체 ${actions.length}개 중)`}
      </p>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          조건에 맞는 이행과제가 없습니다.
        </div>
      )}

      {/* 목표별 아코디언 */}
      <div className="flex flex-col gap-6">
        {grouped.map((g) => (
          <section key={g.name}>
            <div className="mb-2 flex items-center gap-2 border-l-3 pl-2.5" style={{ borderColor: g.color }}>
              <h3 className="text-sm font-bold" style={{ color: g.color }}>
                {g.name}
              </h3>
              <span className="text-xs text-muted-foreground">{g.items.length}개 과제</span>
            </div>
            <ul className="overflow-hidden rounded-xl border bg-card">
              {g.items.map((a) => {
                const open = openIds.has(a.id);
                return (
                  <li key={a.id} className="border-b last:border-b-0">
                    <button
                      type="button"
                      onClick={() => toggle(a.id)}
                      className="flex w-full items-start gap-3 p-3.5 text-left hover:bg-muted/40"
                    >
                      <ChevronDownIcon
                        className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[10px] text-muted-foreground">{a.code}</span>
                          <ActionStatusChip status={a.status} size="sm" />
                          {a.dueYear && (
                            <span className="inline-flex items-center gap-0.5 rounded-full border px-1.5 text-[10px] text-muted-foreground">
                              <CalendarIcon className="size-2.5" /> {a.dueYear}
                            </span>
                          )}
                          {a.targetCode && (
                            <span className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">{a.targetCode}</span>
                          )}
                        </div>
                        <div className="mt-1 text-sm font-semibold">{a.title}</div>
                        {!open && a.summary && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{a.summary}</p>
                        )}
                      </div>
                    </button>
                    {open && (
                      <div className="border-t bg-muted/20 px-3.5 py-3 pl-10">
                        {a.summary && <p className="text-sm leading-relaxed">{a.summary}</p>}
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {a.responsible && (
                            <span className="inline-flex items-center gap-1">
                              <UserIcon className="size-3" /> {a.responsible}
                            </span>
                          )}
                          {a.lastUpdate && <span>최종 수정 {a.lastUpdate}</span>}
                        </div>
                        {a.links.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {a.links.map((l, idx) => (
                              <a
                                key={idx}
                                href={l.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-muted"
                              >
                                {l.label} <ExternalLinkIcon className="size-3" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
