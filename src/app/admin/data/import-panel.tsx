"use client";

import { useState } from "react";
import { importCsv } from "@/lib/admin-actions";
import { AdminForm, SubmitButton } from "@/components/admin/form";
import { CSV_LABELS, CSV_TYPES, type CsvType } from "@/lib/csv";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TriangleAlertIcon, UploadIcon } from "lucide-react";

/** 가져오는 순서 안내 — 상위 계층부터 넣어야 참조가 연결된다 */
const ORDER = ["goals", "targets", "indicators", "values", "actions", "config"];

export function ImportPanel({ counts }: { counts: Record<string, number> }) {
  const [type, setType] = useState<CsvType>("values");
  const [replace, setReplace] = useState(false);

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-base font-bold">CSV 올리기</h2>
      <p className="mt-0.5 mb-4 text-xs text-muted-foreground">
        파일을 선택하거나, 엑셀·구글시트에서 표를 복사해 아래 칸에 그대로 붙여넣으세요.
      </p>

      <AdminForm action={importCsv} className="flex flex-col gap-4" resetOnSuccess>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">데이터 종류</Label>
          <div className="flex flex-wrap gap-2">
            {CSV_TYPES.map((t) => (
              <label
                key={t}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  type === t ? "bg-foreground text-background" : "bg-background hover:bg-muted"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={type === t}
                  onChange={() => setType(t)}
                  className="sr-only"
                />
                {CSV_LABELS[t]} <span className="opacity-60">({counts[t] ?? 0})</span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            처음부터 전체를 넣을 때는 {ORDER.map((o) => CSV_LABELS[o as CsvType]).join(" → ")} 순서로 올려야 상위 항목
            참조가 연결됩니다.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="file" className="text-xs">
              CSV 파일
            </Label>
            <Input id="file" name="file" type="file" accept=".csv,.tsv,.txt,text/csv" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">가져오기 방식</Label>
            <label className="flex cursor-pointer items-start gap-2 rounded-md border p-2.5">
              <input
                type="checkbox"
                name="replace"
                checked={replace}
                onChange={(e) => setReplace(e.target.checked)}
                className="mt-0.5 size-4 accent-destructive"
              />
              <span>
                <span className="text-xs font-medium">기존 데이터를 모두 지우고 넣기</span>
                <span className="block text-[11px] text-muted-foreground">
                  끄면 고유번호 기준으로 있으면 수정, 없으면 추가합니다(권장).
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="text" className="text-xs">
            또는 표 붙여넣기
          </Label>
          <Textarea
            id="text"
            name="text"
            rows={6}
            placeholder={"indicator_id\tyear\tvalue\tregion\tnote\n15-1-1\t2025\t17.9\t전국\t잠정치"}
            className="font-mono text-xs"
          />
        </div>

        {replace && (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertDescription>
              <strong>{CSV_LABELS[type]}</strong>의 기존 데이터가 모두 삭제된 뒤 업로드 내용으로 대체됩니다. 하위 항목도
              함께 지워질 수 있으니 먼저 CSV로 내려받아 백업하세요.
            </AlertDescription>
          </Alert>
        )}

        <div>
          <SubmitButton>
            <UploadIcon /> {CSV_LABELS[type]} 가져오기
          </SubmitButton>
        </div>
      </AdminForm>
    </section>
  );
}
