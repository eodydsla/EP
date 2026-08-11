"use client";

import { deleteValue, saveValue } from "@/lib/admin-actions";
import { AdminForm, SubmitButton } from "@/components/admin/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatValue } from "@/lib/progress";
import { PlusIcon, TrashIcon } from "lucide-react";

export interface ValueRow {
  id: string;
  year: number;
  value: number;
  region: string;
  note: string | null;
}

/** 연도별 실적값 인라인 편집 — 행 추가하면 대시보드 최신값·차트가 바로 갱신된다 */
export function ValuesEditor({
  indicatorId,
  values,
  unit,
}: {
  indicatorId: string;
  values: ValueRow[];
  unit: string | null;
}) {
  const sorted = [...values].sort((a, b) => b.year - a.year);
  const nextYear = sorted.length ? sorted[0].year + 1 : new Date().getFullYear() - 1;

  return (
    <div className="flex flex-col gap-3">
      {/* 새 값 추가 */}
      <AdminForm
        action={saveValue}
        resetOnSuccess
        className="flex flex-wrap items-end gap-2 rounded-lg border-2 border-dashed p-3"
      >
        <input type="hidden" name="indicatorId" value={indicatorId} />
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium">연도</label>
          <Input name="year" type="number" defaultValue={nextYear} className="w-24" required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium">값{unit ? ` (${unit})` : ""}</label>
          <Input name="value" type="number" step="any" className="w-32" required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium">지역</label>
          <Input name="region" defaultValue="전국" className="w-24" />
        </div>
        <div className="flex min-w-[140px] flex-1 flex-col gap-1">
          <label className="text-[11px] font-medium">비고</label>
          <Input name="note" placeholder="잠정치 등" />
        </div>
        <SubmitButton size="default">
          <PlusIcon /> 추가
        </SubmitButton>
      </AdminForm>

      {/* 기존 값 목록 */}
      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          입력된 실적값이 없습니다. 위에서 연도와 값을 추가해 주세요.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">연도</th>
                <th className="px-3 py-2 text-left font-medium">값{unit ? ` (${unit})` : ""}</th>
                <th className="px-3 py-2 text-left font-medium">지역</th>
                <th className="px-3 py-2 text-left font-medium">비고</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="px-3 py-1.5 tabular-nums">{v.year}</td>
                  <td className="px-3 py-1.5">
                    {/* 값·비고는 인라인 수정 가능 */}
                    <AdminForm action={saveValue} className="flex items-center gap-1.5">
                      <input type="hidden" name="indicatorId" value={indicatorId} />
                      <input type="hidden" name="year" value={v.year} />
                      <input type="hidden" name="region" value={v.region} />
                      <Input name="value" type="number" step="any" defaultValue={v.value} className="h-8 w-28" />
                      <Input name="note" defaultValue={v.note ?? ""} className="h-8 w-40" placeholder="비고" />
                      <SubmitButton variant="outline" size="sm">
                        저장
                      </SubmitButton>
                    </AdminForm>
                  </td>
                  <td className="px-3 py-1.5 text-xs text-muted-foreground">{v.region}</td>
                  <td className="px-3 py-1.5 text-xs text-muted-foreground">
                    {v.note ?? ""}
                    <span className="ml-2 tabular-nums opacity-60">현재 {formatValue(v.value)}</span>
                  </td>
                  <td className="px-1 py-1.5">
                    <AdminForm action={deleteValue}>
                      <input type="hidden" name="id" value={v.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          if (!confirm(`${v.year}년 값을 삭제할까요?`)) e.preventDefault();
                        }}
                      >
                        <TrashIcon />
                      </Button>
                    </AdminForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
