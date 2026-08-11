"use client";

import { deleteConfig, saveConfig } from "@/lib/admin-actions";
import { AdminForm, SubmitButton } from "@/components/admin/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TrashIcon } from "lucide-react";

export function ConfigEditor({
  items,
}: {
  items: { key: string; value: string; description: string; isCustom: boolean }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <AdminForm action={saveConfig} className="flex flex-col gap-4 rounded-xl border bg-card p-5">
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          {items.map((it) => (
            <div key={it.key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`cfg_${it.key}`} className="font-mono text-xs">
                  {it.key}
                </Label>
                {it.isCustom && (
                  <span className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">직접 추가</span>
                )}
              </div>
              <Input id={`cfg_${it.key}`} name={`cfg_${it.key}`} defaultValue={it.value} />
              {it.description && <p className="text-[11px] text-muted-foreground">{it.description}</p>}
            </div>
          ))}
        </div>

        <div className="rounded-lg border-2 border-dashed p-3">
          <p className="mb-2 text-xs font-medium">설정 항목 직접 추가</p>
          <div className="flex flex-wrap gap-2">
            <Input name="new_key" placeholder="키 (영문·밑줄)" className="w-48" />
            <Input name="new_value" placeholder="값" className="min-w-[200px] flex-1" />
          </div>
        </div>

        <div>
          <SubmitButton>설정 저장</SubmitButton>
        </div>
      </AdminForm>

      {items.some((i) => i.isCustom) && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-2 text-sm font-bold">직접 추가한 항목 삭제</h2>
          <ul className="flex flex-wrap gap-2">
            {items
              .filter((i) => i.isCustom)
              .map((i) => (
                <li key={i.key}>
                  <AdminForm action={deleteConfig}>
                    <input type="hidden" name="key" value={i.key} />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        if (!confirm(`"${i.key}" 설정을 삭제할까요?`)) e.preventDefault();
                      }}
                    >
                      <TrashIcon /> {i.key}
                    </Button>
                  </AdminForm>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
