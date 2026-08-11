"use client";

import { useState } from "react";
import Link from "next/link";
import { GOAL_PALETTE } from "@/lib/colors";
import { deleteGoal, deleteTarget, saveGoal, saveTarget } from "@/lib/admin-actions";
import { AdminForm, CheckField, DeleteButton, Field, SubmitButton } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, EyeOffIcon, PencilIcon, PlusIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TargetRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  order: number;
  published: boolean;
  indicatorCount: number;
}
interface GoalRow {
  id: string;
  code: string;
  no: string;
  name: string;
  description: string | null;
  color: string | null;
  resolvedColor: string;
  icon: string | null;
  order: number;
  published: boolean;
  targets: TargetRow[];
}

/** 다음 코드 자동 제안 — 13-1, 13-2 다음은 13-3 */
function nextTargetCode(goalNo: string, targets: TargetRow[]) {
  const nums = targets
    .map((t) => Number(t.code.split("-").pop()))
    .filter((x) => Number.isFinite(x)) as number[];
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${goalNo}-${next}`;
}

export function StructureManager({
  goals,
  level1Label,
  level2Label,
  level3Label,
}: {
  goals: GoalRow[];
  level1Label: string;
  level2Label: string;
  level3Label: string;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set(goals.map((g) => g.id)));
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [addingTargetTo, setAddingTargetTo] = useState<string | null>(null);
  const [addingGoal, setAddingGoal] = useState(false);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const nextGoalOrder = goals.length ? Math.max(...goals.map((g) => g.order)) + 1 : 1;

  return (
    <div className="flex flex-col gap-4">
      {/* 목표 추가 */}
      {addingGoal ? (
        <div className="rounded-xl border-2 border-dashed bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">{level1Label} 추가</h3>
            <Button variant="ghost" size="sm" onClick={() => setAddingGoal(false)}>
              <XIcon /> 닫기
            </Button>
          </div>
          <GoalForm onDone={() => setAddingGoal(false)} defaultOrder={nextGoalOrder} paletteIndex={goals.length} />
        </div>
      ) : (
        <Button variant="outline" className="w-full border-dashed" onClick={() => setAddingGoal(true)}>
          <PlusIcon /> {level1Label} 추가
        </Button>
      )}

      {goals.map((g) => {
        const isOpen = open.has(g.id);
        return (
          <div key={g.id} className="overflow-hidden rounded-xl border bg-card">
            {/* 목표 헤더 */}
            <div className="flex items-start gap-3 p-4" style={{ backgroundColor: g.resolvedColor + "0f" }}>
              <button type="button" onClick={() => toggle(g.id)} className="mt-0.5 shrink-0">
                <ChevronDownIcon
                  className={cn("size-4 text-muted-foreground transition-transform", !isOpen && "-rotate-90")}
                />
              </button>
              <span className="text-2xl leading-none">{g.icon ?? "◆"}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white"
                    style={{ backgroundColor: g.resolvedColor }}
                  >
                    {g.code}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {level1Label} {g.no} · {level2Label} {g.targets.length}개 · {level3Label}{" "}
                    {g.targets.reduce((a, t) => a + t.indicatorCount, 0)}개
                  </span>
                  {!g.published && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                      <EyeOffIcon className="size-2.5" /> 비공개
                    </span>
                  )}
                  {!g.color && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">색 자동배정</span>
                  )}
                </div>
                <h3 className="mt-0.5 font-bold">{g.name}</h3>
                {g.description && <p className="mt-0.5 text-xs text-muted-foreground">{g.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditingGoal(editingGoal === g.id ? null : g.id)}>
                  <PencilIcon /> 편집
                </Button>
                <AdminForm action={deleteGoal}>
                  <input type="hidden" name="id" value={g.id} />
                  <DeleteButton
                    label={`${level1Label} "${g.name}" (하위 ${level2Label} ${g.targets.length}개, ${level3Label} ${g.targets.reduce((a, t) => a + t.indicatorCount, 0)}개)`}
                    small
                  />
                </AdminForm>
              </div>
            </div>

            {/* 목표 편집 폼 */}
            {editingGoal === g.id && (
              <div className="border-t bg-muted/30 p-4">
                <GoalForm goal={g} onDone={() => setEditingGoal(null)} defaultOrder={g.order} paletteIndex={0} />
              </div>
            )}

            {/* 세부목표 목록 */}
            {isOpen && (
              <div className="border-t">
                <ul>
                  {g.targets.map((t) => (
                    <li key={t.id} className="border-b last:border-b-0">
                      <div className="flex items-start gap-3 py-3 pr-3 pl-10">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[11px] font-semibold" style={{ color: g.resolvedColor }}>
                              {t.code}
                            </span>
                            <Link
                              href={`/admin/indicators?target=${t.id}`}
                              className="rounded bg-muted px-1.5 py-0.5 text-[10px] hover:underline"
                            >
                              {level3Label} {t.indicatorCount}개
                            </Link>
                            {!t.published && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                                <EyeOffIcon className="size-2.5" /> 비공개
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-sm font-medium">{t.name}</div>
                          {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTarget(editingTarget === t.id ? null : t.id)}
                          >
                            <PencilIcon />
                          </Button>
                          <AdminForm action={deleteTarget}>
                            <input type="hidden" name="id" value={t.id} />
                            <DeleteButton
                              label={`${level2Label} "${t.code} ${t.name}" (하위 ${level3Label} ${t.indicatorCount}개)`}
                              small
                            />
                          </AdminForm>
                        </div>
                      </div>
                      {editingTarget === t.id && (
                        <div className="bg-muted/30 p-4 pl-10">
                          <TargetForm goalId={g.id} target={t} onDone={() => setEditingTarget(null)} />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                {/* 세부목표 추가 */}
                <div className="p-3 pl-10">
                  {addingTargetTo === g.id ? (
                    <div className="rounded-lg border-2 border-dashed p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-xs font-bold">{level2Label} 추가</h4>
                        <Button variant="ghost" size="sm" onClick={() => setAddingTargetTo(null)}>
                          <XIcon />
                        </Button>
                      </div>
                      <TargetForm
                        goalId={g.id}
                        defaultCode={nextTargetCode(g.no, g.targets)}
                        defaultOrder={g.targets.length + 1}
                        onDone={() => setAddingTargetTo(null)}
                      />
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="border-dashed" onClick={() => setAddingTargetTo(g.id)}>
                      <PlusIcon /> {level2Label} 추가
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {goals.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          등록된 {level1Label}이 없습니다. 위 버튼으로 추가해 주세요.
        </div>
      )}
    </div>
  );
}

function GoalForm({
  goal,
  onDone,
  defaultOrder,
  paletteIndex,
}: {
  goal?: GoalRow;
  onDone: () => void;
  defaultOrder: number;
  paletteIndex: number;
}) {
  return (
    <AdminForm action={saveGoal} className="flex flex-col gap-3" onSuccess={onDone}>
      {goal && <input type="hidden" name="id" value={goal.id} />}
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="코드" name="code" defaultValue={goal?.code} placeholder="G13" required hint="고유값. 예: G13" />
        <Field label="표시 번호" name="no" defaultValue={goal?.no} placeholder="13" required />
        <Field label="아이콘" name="icon" defaultValue={goal?.icon} placeholder="🌡️" hint="이모지 1개" />
        <Field label="정렬 순서" name="order" type="number" defaultValue={goal?.order ?? defaultOrder} />
      </div>
      <Field label="목표명" name="name" defaultValue={goal?.name} placeholder="기후변화와 대응" required />
      <Field label="설명" name="description" defaultValue={goal?.description} textarea rows={2} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">테마 색</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="color"
              defaultValue={goal?.color ?? GOAL_PALETTE[paletteIndex % GOAL_PALETTE.length]}
              className="h-9 w-14 cursor-pointer rounded border bg-background p-1"
            />
            <span className="text-[11px] text-muted-foreground">
              지정하지 않으면 팔레트에서 자동 배정됩니다. 카드·차트·진행률 바에 이 색이 전파됩니다.
            </span>
          </div>
        </div>
        <CheckField
          label="공개"
          name="published"
          defaultChecked={goal?.published ?? true}
          hint="끄면 임시저장 상태가 되어 공개 대시보드에 나타나지 않습니다."
        />
      </div>
      <div className="flex gap-2">
        <SubmitButton>{goal ? "저장" : "추가"}</SubmitButton>
        <Button type="button" variant="ghost" onClick={onDone}>
          취소
        </Button>
      </div>
    </AdminForm>
  );
}

function TargetForm({
  goalId,
  target,
  defaultCode,
  defaultOrder,
  onDone,
}: {
  goalId: string;
  target?: TargetRow;
  defaultCode?: string;
  defaultOrder?: number;
  onDone: () => void;
}) {
  return (
    <AdminForm action={saveTarget} className="flex flex-col gap-3" onSuccess={onDone}>
      {target && <input type="hidden" name="id" value={target.id} />}
      <input type="hidden" name="goalId" value={goalId} />
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="코드" name="code" defaultValue={target?.code ?? defaultCode} required hint="예: 13-1" />
        <Field label="정렬 순서" name="order" type="number" defaultValue={target?.order ?? defaultOrder ?? 1} />
        <CheckField label="공개" name="published" defaultChecked={target?.published ?? true} />
      </div>
      <Field label="세부목표명" name="name" defaultValue={target?.name} required />
      <Field label="설명" name="description" defaultValue={target?.description} textarea rows={2} />
      <div className="flex gap-2">
        <SubmitButton>{target ? "저장" : "추가"}</SubmitButton>
        <Button type="button" variant="ghost" onClick={onDone}>
          취소
        </Button>
      </div>
    </AdminForm>
  );
}
