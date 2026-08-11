"use client";

import { useState } from "react";
import { deleteActionItem, saveActionItem } from "@/lib/admin-actions";
import { AdminForm, CheckField, DeleteButton, Field, SelectField, SubmitButton } from "@/components/admin/form";
import { ActionStatusChip, ACTION_STATUSES } from "@/components/actions-board";
import { Button } from "@/components/ui/button";
import { EyeOffIcon, PencilIcon, PlusIcon, XIcon } from "lucide-react";

interface ActionRow {
  id: string;
  code: string;
  goalId: string | null;
  targetId: string | null;
  title: string;
  summary: string | null;
  status: string;
  dueYear: number | null;
  responsible: string | null;
  lastUpdate: string | null;
  links: string | null;
  order: number;
  published: boolean;
}

export function ActionsManager({
  actions,
  goals,
  targets,
  level1Label,
}: {
  actions: ActionRow[];
  goals: { id: string; label: string; color: string }[];
  targets: { id: string; label: string; goalId: string }[];
  level1Label: string;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const rows = actions.filter((a) => filter === "all" || a.status === filter);
  const colorOf = (goalId: string | null) => goals.find((g) => g.id === goalId)?.color ?? "#94a3b8";
  const nextCode = `A-${String(actions.length + 1).padStart(3, "0")}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${filter === "all" ? "bg-foreground text-background" : "bg-background hover:bg-muted"}`}
        >
          전체 {actions.length}
        </button>
        {ACTION_STATUSES.map((s) => {
          const n = actions.filter((a) => a.status === s).length;
          return (
            <button key={s} type="button" onClick={() => setFilter(filter === s ? "all" : s)} className="rounded-full">
              <ActionStatusChip status={`${s} ${n}`} />
            </button>
          );
        })}
        <div className="ml-auto">
          {adding ? (
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
              <XIcon /> 닫기
            </Button>
          ) : (
            <Button size="sm" onClick={() => setAdding(true)}>
              <PlusIcon /> 이행과제 추가
            </Button>
          )}
        </div>
      </div>

      {adding && (
        <div className="rounded-xl border-2 border-dashed bg-card p-4">
          <h3 className="mb-3 text-sm font-bold">이행과제 추가</h3>
          <ActionForm
            goals={goals}
            targets={targets}
            level1Label={level1Label}
            defaultCode={nextCode}
            defaultOrder={actions.length + 1}
            onDone={() => setAdding(false)}
          />
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {rows.map((a) => (
          <li key={a.id} className="overflow-hidden rounded-xl border bg-card">
            <div className="flex items-start gap-3 p-4">
              <span className="mt-1 h-10 w-1 shrink-0 rounded" style={{ backgroundColor: colorOf(a.goalId) }} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10px] text-muted-foreground">{a.code}</span>
                  <ActionStatusChip status={a.status} size="sm" />
                  {a.dueYear && (
                    <span className="rounded-full border px-1.5 text-[10px] text-muted-foreground">{a.dueYear}</span>
                  )}
                  {!a.published && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                      <EyeOffIcon className="size-2.5" /> 비공개
                    </span>
                  )}
                </div>
                <div className="mt-1 font-semibold">{a.title}</div>
                {a.summary && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.summary}</p>}
                <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                  {a.responsible && <span>{a.responsible}</span>}
                  {a.lastUpdate && <span>최종 수정 {a.lastUpdate}</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditing(editing === a.id ? null : a.id)}>
                  <PencilIcon />
                </Button>
                <AdminForm action={deleteActionItem}>
                  <input type="hidden" name="id" value={a.id} />
                  <DeleteButton label={`이행과제 "${a.title}"`} small />
                </AdminForm>
              </div>
            </div>
            {editing === a.id && (
              <div className="border-t bg-muted/30 p-4">
                <ActionForm
                  action={a}
                  goals={goals}
                  targets={targets}
                  level1Label={level1Label}
                  onDone={() => setEditing(null)}
                />
              </div>
            )}
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            이행과제가 없습니다.
          </li>
        )}
      </ul>
    </div>
  );
}

function ActionForm({
  action,
  goals,
  targets,
  level1Label,
  defaultCode,
  defaultOrder,
  onDone,
}: {
  action?: ActionRow;
  goals: { id: string; label: string }[];
  targets: { id: string; label: string; goalId: string }[];
  level1Label: string;
  defaultCode?: string;
  defaultOrder?: number;
  onDone: () => void;
}) {
  return (
    <AdminForm action={saveActionItem} className="flex flex-col gap-3" onSuccess={onDone}>
      {action && <input type="hidden" name="id" value={action.id} />}
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="과제 번호" name="code" defaultValue={action?.code ?? defaultCode} required hint="고유값" />
        <SelectField
          label="상태"
          name="status"
          defaultValue={action?.status ?? "추진중"}
          options={ACTION_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <Field label="기한(연도)" name="dueYear" type="number" defaultValue={action?.dueYear} />
        <Field label="정렬 순서" name="order" type="number" defaultValue={action?.order ?? defaultOrder ?? 0} />
      </div>
      <Field label="과제명" name="title" defaultValue={action?.title} required />
      <Field label="추진 경과" name="summary" defaultValue={action?.summary} textarea rows={3} />
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label={`상위 ${level1Label}`}
          name="goalId"
          defaultValue={action?.goalId ?? ""}
          options={[{ value: "", label: "미분류" }, ...goals.map((g) => ({ value: g.id, label: g.label }))]}
        />
        <SelectField
          label="상위 세부목표 (선택)"
          name="targetId"
          defaultValue={action?.targetId ?? ""}
          options={[{ value: "", label: "지정 안 함" }, ...targets.map((t) => ({ value: t.id, label: t.label }))]}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="담당 기관" name="responsible" defaultValue={action?.responsible} placeholder="환경부 기후정책과" />
        <Field label="최종 수정일" name="lastUpdate" defaultValue={action?.lastUpdate} placeholder="2026-06-30" />
      </div>
      <Field
        label="근거 링크"
        name="links"
        defaultValue={action?.links}
        placeholder="시행계획|https://a.kr;보도자료|https://b.kr"
        hint="제목|URL 형식, 여러 개는 세미콜론(;)으로 구분"
      />
      <CheckField label="공개" name="published" defaultChecked={action?.published ?? true} />
      <div className="flex gap-2">
        <SubmitButton>{action ? "저장" : "추가"}</SubmitButton>
        <Button type="button" variant="ghost" onClick={onDone}>
          취소
        </Button>
      </div>
    </AdminForm>
  );
}
