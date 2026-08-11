"use client";

import Link from "next/link";
import { saveIndicator, deleteIndicator } from "@/lib/admin-actions";
import { AdminForm, CheckField, DeleteButton, Field, SelectField, SubmitButton } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { STATUSES } from "@/lib/progress";

export interface IndicatorFormValues {
  id?: string;
  code?: string;
  targetId?: string;
  name?: string;
  definition?: string | null;
  method?: string | null;
  unit?: string | null;
  direction?: string;
  baselineYear?: number | null;
  baselineValue?: number | null;
  targetYear?: number | null;
  targetValue?: number | null;
  source?: string | null;
  sourceUrl?: string | null;
  updateCycle?: string | null;
  custodian?: string | null;
  statusOverride?: string | null;
  isHeadline?: boolean;
  published?: boolean;
  note?: string | null;
  order?: number;
}

export function IndicatorForm({
  values,
  targets,
  level2Label,
  level3Label,
}: {
  values: IndicatorFormValues;
  targets: { id: string; code: string; name: string; goalLabel: string }[];
  level2Label: string;
  level3Label: string;
}) {
  const isNew = !values.id;

  return (
    <div className="flex flex-col gap-4">
      <AdminForm action={saveIndicator} className="flex flex-col gap-6">
        {values.id && <input type="hidden" name="id" value={values.id} />}

        <Section title="기본 정보">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field
              label={`${level3Label} 번호`}
              name="code"
              defaultValue={values.code}
              required
              hint="고유값. 예: 13-1-1"
            />
            <SelectField
              label={`상위 ${level2Label}`}
              name="targetId"
              defaultValue={values.targetId}
              required
              options={[
                { value: "", label: `${level2Label} 선택` },
                ...targets.map((t) => ({ value: t.id, label: `${t.goalLabel} › ${t.code} ${t.name}` })),
              ]}
              className="sm:col-span-2"
            />
          </div>
          <Field label={`${level3Label}명`} name="name" defaultValue={values.name} required />
          <Field
            label="지표 설명(정의)"
            name="definition"
            defaultValue={values.definition}
            textarea
            rows={2}
            hint="공개 대시보드의 상세 패널에 그대로 표시됩니다."
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="산출식" name="method" defaultValue={values.method} placeholder="(집행액 ÷ 예산) × 100" className="sm:col-span-2" />
            <Field label="단위" name="unit" defaultValue={values.unit} placeholder="%" />
          </div>
        </Section>

        <Section title="목표 설정" desc="기준값과 목표값을 넣으면 달성도가 자동 계산됩니다. 목표값을 비워두면 「모니터링 지표」로 표시됩니다.">
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="기준연도" name="baselineYear" type="number" defaultValue={values.baselineYear} />
            <Field label="기준값" name="baselineValue" type="number" step="any" defaultValue={values.baselineValue} />
            <Field label="목표연도" name="targetYear" type="number" defaultValue={values.targetYear} />
            <Field label="목표값" name="targetValue" type="number" step="any" defaultValue={values.targetValue} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="방향"
              name="direction"
              defaultValue={values.direction ?? "up"}
              options={[
                { value: "up", label: "값이 클수록 좋음 (증가 목표)" },
                { value: "down", label: "값이 작을수록 좋음 (감소 목표)" },
              ]}
              hint="추세 화살표 색상 판정에 사용됩니다."
            />
            <SelectField
              label="상태 직접 지정"
              name="statusOverride"
              defaultValue={values.statusOverride ?? ""}
              options={[
                { value: "", label: "자동 판정 (권장)" },
                ...STATUSES.map((s) => ({ value: s, label: s })),
              ]}
              hint="자동 판정이 실제와 다를 때만 사용하세요."
            />
          </div>
        </Section>

        <Section title="출처 · 관리 정보">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="출처 기관" name="source" defaultValue={values.source} placeholder="환경부" />
            <Field label="출처 링크" name="sourceUrl" defaultValue={values.sourceUrl} placeholder="https://" />
            <Field label="갱신주기" name="updateCycle" defaultValue={values.updateCycle} placeholder="연간" />
            <Field label="담당 부서" name="custodian" defaultValue={values.custodian} placeholder="자연보전팀" />
          </div>
          <Field label="비고" name="note" defaultValue={values.note} textarea rows={2} />
        </Section>

        <Section title="표시 설정">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="정렬 순서" name="order" type="number" defaultValue={values.order ?? 0} />
            <CheckField
              label="대표지표"
              name="isHeadline"
              defaultChecked={values.isHeadline ?? false}
              hint="목표 카드에 요약 노출"
            />
            <CheckField
              label="공개"
              name="published"
              defaultChecked={values.published ?? true}
              hint="끄면 임시저장 — 공개 대시보드에 안 보임"
            />
          </div>
        </Section>

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <SubmitButton>{isNew ? `${level3Label} 추가` : "저장"}</SubmitButton>
          <Button type="button" variant="ghost" nativeButton={false} render={<Link href="/admin/indicators" />}>
            목록으로
          </Button>
        </div>
      </AdminForm>

      {values.id && (
        <AdminForm action={deleteIndicator} className="border-t pt-4">
          <input type="hidden" name="id" value={values.id} />
          <DeleteButton label={`${level3Label} "${values.name}" (실적값 포함)`} />
        </AdminForm>
      )}
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-bold">{title}</h3>
        {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </section>
  );
}
