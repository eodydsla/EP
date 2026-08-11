"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DashIndicator } from "@/lib/data";
import { STATUSES, formatValue, type Status } from "@/lib/progress";
import { StatusBadge } from "@/components/status-badge";
import { AdminForm } from "@/components/admin/form";
import { toggleIndicatorPublished } from "@/lib/admin-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon, SearchIcon, XIcon } from "lucide-react";

export function AdminIndicatorTable({
  indicators,
  goals,
  targets,
  initialGoal,
  initialTarget,
}: {
  indicators: DashIndicator[];
  goals: { id: string; no: string; name: string; color: string }[];
  targets: { id: string; code: string; name: string; goalId: string }[];
  initialGoal?: string;
  initialTarget?: string;
}) {
  const [goalId, setGoalId] = useState(initialGoal ?? "all");
  const [targetId, setTargetId] = useState(initialTarget ?? "all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [visibility, setVisibility] = useState<"all" | "published" | "draft">("all");
  const [q, setQ] = useState("");

  const visibleTargets = targets.filter((t) => goalId === "all" || t.goalId === goalId);

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return indicators.filter((i) => {
      if (goalId !== "all" && i.goalId !== goalId) return false;
      if (targetId !== "all" && i.targetId !== targetId) return false;
      if (status !== "all" && i.computed.status !== status) return false;
      if (visibility === "published" && !i.published) return false;
      if (visibility === "draft" && i.published) return false;
      if (kw && !`${i.code} ${i.name} ${i.custodian ?? ""} ${i.source ?? ""}`.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [indicators, goalId, targetId, status, visibility, q]);

  const hasFilter = goalId !== "all" || targetId !== "all" || status !== "all" || visibility !== "all" || q !== "";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <select
          value={goalId}
          onChange={(e) => {
            setGoalId(e.target.value);
            setTargetId("all");
          }}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="all">목표 전체</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.no}. {g.name}
            </option>
          ))}
        </select>
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="h-9 max-w-[260px] rounded-md border bg-background px-2 text-sm"
        >
          <option value="all">세부목표 전체</option>
          {visibleTargets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.code} {t.name.slice(0, 24)}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status | "all")}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="all">상태 전체</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as "all" | "published" | "draft")}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="all">공개여부 전체</option>
          <option value="published">공개</option>
          <option value="draft">임시저장</option>
        </select>
        <div className="relative min-w-[160px] flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="지표 검색" className="pl-8" />
        </div>
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setGoalId("all");
              setTargetId("all");
              setStatus("all");
              setVisibility("all");
              setQ("");
            }}
          >
            <XIcon /> 초기화
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{rows.length}개 표시 중</p>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">번호</th>
              <th className="px-3 py-2 text-left font-medium">지표명</th>
              <th className="px-3 py-2 text-left font-medium">세부목표</th>
              <th className="px-3 py-2 text-right font-medium">최신값</th>
              <th className="px-3 py-2 text-right font-medium">달성도</th>
              <th className="px-3 py-2 text-left font-medium">상태</th>
              <th className="px-3 py-2 text-center font-medium">공개</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} className="border-t hover:bg-muted/40">
                <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap">
                  <span className="mr-1.5 inline-block size-2 rounded-full align-middle" style={{ backgroundColor: i.color }} />
                  {i.code}
                </td>
                <td className="px-3 py-2">
                  <Link href={`/admin/indicators/${i.id}`} className="font-medium hover:underline">
                    {i.name}
                  </Link>
                  <div className="text-[11px] text-muted-foreground">
                    {i.unit ?? "단위 없음"}
                    {i.custodian ? ` · ${i.custodian}` : ""}
                    {i.isHeadline ? " · 대표지표" : ""}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-mono">{i.targetCode}</span> {i.targetName.slice(0, 20)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                  {formatValue(i.computed.latest?.value ?? null)}
                  {i.computed.latest && (
                    <span className="ml-1 text-[10px] text-muted-foreground">({i.computed.latest.year})</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {i.computed.progress === null ? "—" : `${Math.round(i.computed.progress)}%`}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={i.computed.status} size="sm" />
                </td>
                <td className="px-3 py-2 text-center">
                  <AdminForm action={toggleIndicatorPublished}>
                    <input type="hidden" name="id" value={i.id} />
                    <button
                      type="submit"
                      className="rounded p-1.5 hover:bg-muted"
                      title={i.published ? "공개 중 — 클릭하면 임시저장" : "임시저장 — 클릭하면 공개"}
                    >
                      {i.published ? (
                        <EyeIcon className="size-4 text-emerald-600" />
                      ) : (
                        <EyeOffIcon className="size-4 text-amber-600" />
                      )}
                    </button>
                  </AdminForm>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-sm text-muted-foreground">
                  조건에 맞는 지표가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
