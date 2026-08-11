"use client";

import { useState } from "react";
import Link from "next/link";
import { GOAL_PALETTE } from "@/lib/colors";
import { deleteGoal, deleteTarget, deleteTrack, saveGoal, saveTarget, saveTrack } from "@/lib/admin-actions";
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
interface TrackRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  resolvedColor: string;
  icon: string | null;
  order: number;
  published: boolean;
  goals: GoalRow[];
}

/** 다음 코드 자동 제안 — 13-1, 13-2 다음은 13-3 */
function nextTargetCode(goalNo: string, targets: TargetRow[]) {
  const nums = targets
    .map((t) => Number(t.code.split("-").pop()))
    .filter((x) => Number.isFinite(x)) as number[];
  return `${goalNo}-${nums.length ? Math.max(...nums) + 1 : 1}`;
}

const countIndicators = (g: GoalRow) => g.targets.reduce((a, t) => a + t.indicatorCount, 0);

export function StructureManager({
  tracks,
  level0Label,
  level1Label,
  level2Label,
  level3Label,
}: {
  tracks: TrackRow[];
  level0Label: string;
  level1Label: string;
  level2Label: string;
  level3Label: string;
}) {
  const [openTracks, setOpenTracks] = useState<Set<string>>(new Set(tracks.map((t) => t.id)));
  const [openGoals, setOpenGoals] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null); // "track:<id>" | "goal:<id>" | "target:<id>"
  const [adding, setAdding] = useState<string | null>(null); // "track" | "goal:<trackId>" | "target:<goalId>"

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 영역 추가 */}
      {adding === "track" ? (
        <div className="rounded-xl border-2 border-dashed bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">{level0Label} 추가</h3>
            <Button variant="ghost" size="sm" onClick={() => setAdding(null)}>
              <XIcon /> 닫기
            </Button>
          </div>
          <TrackForm
            onDone={() => setAdding(null)}
            defaultOrder={tracks.length + 1}
            paletteIndex={tracks.length}
            level0Label={level0Label}
          />
        </div>
      ) : (
        <Button variant="outline" className="w-full border-dashed" onClick={() => setAdding("track")}>
          <PlusIcon /> {level0Label} 추가
        </Button>
      )}

      {tracks.map((tr) => {
        const trOpen = openTracks.has(tr.id);
        const trIndicators = tr.goals.reduce((a, g) => a + countIndicators(g), 0);
        return (
          <div key={tr.id} className="overflow-hidden rounded-xl border-2 bg-card" style={{ borderColor: tr.resolvedColor + "55" }}>
            {/* 영역 헤더 */}
            <div className="flex items-start gap-3 p-4" style={{ backgroundColor: tr.resolvedColor + "18" }}>
              <button type="button" onClick={() => toggle(openTracks, setOpenTracks, tr.id)} className="mt-1 shrink-0">
                <ChevronDownIcon
                  className={cn("size-4 text-muted-foreground transition-transform", !trOpen && "-rotate-90")}
                />
              </button>
              <span className="text-2xl leading-none">{tr.icon ?? "◆"}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white"
                    style={{ backgroundColor: tr.resolvedColor }}
                  >
                    /{tr.code}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {level1Label} {tr.goals.length}개 · {level3Label} {trIndicators}개
                  </span>
                  {!tr.published && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                      <EyeOffIcon className="size-2.5" /> 비공개
                    </span>
                  )}
                </div>
                <h3 className="mt-0.5 text-base font-bold">{tr.name}</h3>
                {tr.description && <p className="mt-0.5 text-xs text-muted-foreground">{tr.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(editing === `track:${tr.id}` ? null : `track:${tr.id}`)}
                >
                  <PencilIcon /> 편집
                </Button>
                <AdminForm action={deleteTrack}>
                  <input type="hidden" name="id" value={tr.id} />
                  <DeleteButton
                    label={`${level0Label} "${tr.name}" (하위 ${level1Label} ${tr.goals.length}개, ${level3Label} ${trIndicators}개)`}
                    small
                  />
                </AdminForm>
              </div>
            </div>

            {editing === `track:${tr.id}` && (
              <div className="border-t bg-muted/30 p-4">
                <TrackForm
                  track={tr}
                  onDone={() => setEditing(null)}
                  defaultOrder={tr.order}
                  paletteIndex={0}
                  level0Label={level0Label}
                />
              </div>
            )}

            {trOpen && (
              <div className="border-t p-3 pl-8">
                <div className="flex flex-col gap-3">
                  {tr.goals.map((g) => {
                    const gOpen = openGoals.has(g.id);
                    return (
                      <div key={g.id} className="overflow-hidden rounded-lg border bg-background">
                        {/* 목표 헤더 */}
                        <div className="flex items-start gap-3 p-3" style={{ backgroundColor: g.resolvedColor + "0f" }}>
                          <button type="button" onClick={() => toggle(openGoals, setOpenGoals, g.id)} className="mt-0.5 shrink-0">
                            <ChevronDownIcon
                              className={cn("size-4 text-muted-foreground transition-transform", !gOpen && "-rotate-90")}
                            />
                          </button>
                          <span className="text-xl leading-none">{g.icon ?? "◆"}</span>
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
                                {countIndicators(g)}개
                              </span>
                              {!g.published && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                                  <EyeOffIcon className="size-2.5" /> 비공개
                                </span>
                              )}
                              {!g.color && (
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  색 자동배정
                                </span>
                              )}
                            </div>
                            <h4 className="mt-0.5 font-bold">{g.name}</h4>
                            {g.description && <p className="mt-0.5 text-xs text-muted-foreground">{g.description}</p>}
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditing(editing === `goal:${g.id}` ? null : `goal:${g.id}`)}
                            >
                              <PencilIcon />
                            </Button>
                            <AdminForm action={deleteGoal}>
                              <input type="hidden" name="id" value={g.id} />
                              <DeleteButton
                                label={`${level1Label} "${g.name}" (하위 ${level2Label} ${g.targets.length}개, ${level3Label} ${countIndicators(g)}개)`}
                                small
                              />
                            </AdminForm>
                          </div>
                        </div>

                        {editing === `goal:${g.id}` && (
                          <div className="border-t bg-muted/30 p-3">
                            <GoalForm
                              goal={g}
                              trackId={tr.id}
                              tracks={tracks}
                              onDone={() => setEditing(null)}
                              defaultOrder={g.order}
                              paletteIndex={0}
                              level0Label={level0Label}
                              level1Label={level1Label}
                            />
                          </div>
                        )}

                        {gOpen && (
                          <div className="border-t">
                            <ul>
                              {g.targets.map((t) => (
                                <li key={t.id} className="border-b last:border-b-0">
                                  <div className="flex items-start gap-3 py-2.5 pr-3 pl-9">
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
                                        onClick={() => setEditing(editing === `target:${t.id}` ? null : `target:${t.id}`)}
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
                                  {editing === `target:${t.id}` && (
                                    <div className="bg-muted/30 p-3 pl-9">
                                      <TargetForm
                                        goalId={g.id}
                                        target={t}
                                        onDone={() => setEditing(null)}
                                        level2Label={level2Label}
                                      />
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>

                            <div className="p-3 pl-9">
                              {adding === `target:${g.id}` ? (
                                <div className="rounded-lg border-2 border-dashed p-3">
                                  <div className="mb-2 flex items-center justify-between">
                                    <h5 className="text-xs font-bold">{level2Label} 추가</h5>
                                    <Button variant="ghost" size="sm" onClick={() => setAdding(null)}>
                                      <XIcon />
                                    </Button>
                                  </div>
                                  <TargetForm
                                    goalId={g.id}
                                    defaultCode={nextTargetCode(g.no, g.targets)}
                                    defaultOrder={g.targets.length + 1}
                                    onDone={() => setAdding(null)}
                                    level2Label={level2Label}
                                  />
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-dashed"
                                  onClick={() => setAdding(`target:${g.id}`)}
                                >
                                  <PlusIcon /> {level2Label} 추가
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* 목표 추가 */}
                  {adding === `goal:${tr.id}` ? (
                    <div className="rounded-lg border-2 border-dashed bg-background p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-xs font-bold">
                          {tr.name} 안에 {level1Label} 추가
                        </h4>
                        <Button variant="ghost" size="sm" onClick={() => setAdding(null)}>
                          <XIcon />
                        </Button>
                      </div>
                      <GoalForm
                        trackId={tr.id}
                        tracks={tracks}
                        onDone={() => setAdding(null)}
                        defaultOrder={tr.goals.length + 1}
                        paletteIndex={tr.goals.length}
                        level0Label={level0Label}
                        level1Label={level1Label}
                      />
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => setAdding(`goal:${tr.id}`)}
                    >
                      <PlusIcon /> {level1Label} 추가
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {tracks.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          등록된 {level0Label}이 없습니다. 위 버튼으로 추가해 주세요.
        </div>
      )}
    </div>
  );
}

function TrackForm({
  track,
  onDone,
  defaultOrder,
  paletteIndex,
  level0Label,
}: {
  track?: TrackRow;
  onDone: () => void;
  defaultOrder: number;
  paletteIndex: number;
  level0Label: string;
}) {
  return (
    <AdminForm action={saveTrack} className="flex flex-col gap-3" onSuccess={onDone}>
      {track && <input type="hidden" name="id" value={track.id} />}
      <div className="grid gap-3 sm:grid-cols-4">
        <Field
          label="주소 코드"
          name="code"
          defaultValue={track?.code}
          placeholder="state"
          required
          hint="공개 화면 주소가 됩니다 (/state). 영문 소문자·숫자·하이픈"
          className="sm:col-span-2"
        />
        <Field label="아이콘" name="icon" defaultValue={track?.icon} placeholder="🌍" hint="이모지 1개" />
        <Field label="정렬 순서" name="order" type="number" defaultValue={track?.order ?? defaultOrder} />
      </div>
      <Field label={`${level0Label}명`} name="name" defaultValue={track?.name} placeholder="환경상태 모니터링" required />
      <Field label="설명" name="description" defaultValue={track?.description} textarea rows={2} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">테마 색</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="color"
              defaultValue={track?.color ?? GOAL_PALETTE[paletteIndex % GOAL_PALETTE.length]}
              className="h-9 w-14 cursor-pointer rounded border bg-background p-1"
            />
            <span className="text-[11px] text-muted-foreground">
              상단 메뉴·띠·카드에 이 색이 쓰입니다. 지정하지 않으면 팔레트에서 자동 배정됩니다.
            </span>
          </div>
        </div>
        <CheckField
          label="공개"
          name="published"
          defaultChecked={track?.published ?? true}
          hint="끄면 메뉴에서 사라지고 공개 화면에 나타나지 않습니다."
        />
      </div>
      <div className="flex gap-2">
        <SubmitButton>{track ? "저장" : "추가"}</SubmitButton>
        <Button type="button" variant="ghost" onClick={onDone}>
          취소
        </Button>
      </div>
    </AdminForm>
  );
}

function GoalForm({
  goal,
  trackId,
  tracks,
  onDone,
  defaultOrder,
  paletteIndex,
  level0Label,
  level1Label,
}: {
  goal?: GoalRow;
  trackId: string;
  tracks: TrackRow[];
  onDone: () => void;
  defaultOrder: number;
  paletteIndex: number;
  level0Label: string;
  level1Label: string;
}) {
  return (
    <AdminForm action={saveGoal} className="flex flex-col gap-3" onSuccess={onDone}>
      {goal && <input type="hidden" name="id" value={goal.id} />}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">상위 {level0Label}</label>
          <select
            name="trackId"
            defaultValue={trackId}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            required
          >
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">바꾸면 다른 {level0Label}으로 옮겨집니다.</p>
        </div>
        <Field label="코드" name="code" defaultValue={goal?.code} placeholder="S1" required hint="고유값" />
        <Field label="표시 번호" name="no" defaultValue={goal?.no} placeholder="1" required />
        <Field label="정렬 순서" name="order" type="number" defaultValue={goal?.order ?? defaultOrder} />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label={`${level1Label}명`} name="name" defaultValue={goal?.name} required className="sm:col-span-3" />
        <Field label="아이콘" name="icon" defaultValue={goal?.icon} placeholder="🌫️" />
      </div>
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
              카드·차트·진행률 바에 전파됩니다. 비우면 자동 배정됩니다.
            </span>
          </div>
        </div>
        <CheckField label="공개" name="published" defaultChecked={goal?.published ?? true} />
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
  level2Label,
}: {
  goalId: string;
  target?: TargetRow;
  defaultCode?: string;
  defaultOrder?: number;
  onDone: () => void;
  level2Label: string;
}) {
  return (
    <AdminForm action={saveTarget} className="flex flex-col gap-3" onSuccess={onDone}>
      {target && <input type="hidden" name="id" value={target.id} />}
      <input type="hidden" name="goalId" value={goalId} />
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="코드" name="code" defaultValue={target?.code ?? defaultCode} required hint="예: S1-1" />
        <Field label="정렬 순서" name="order" type="number" defaultValue={target?.order ?? defaultOrder ?? 1} />
        <CheckField label="공개" name="published" defaultChecked={target?.published ?? true} />
      </div>
      <Field label={`${level2Label}명`} name="name" defaultValue={target?.name} required />
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
