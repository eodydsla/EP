"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/admin-actions";
import { Loader2Icon, TrashIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Action = (prev: ActionResult | null, fd: FormData) => Promise<ActionResult>;

/** 서버 액션 + 토스트 + 제출중 상태를 묶은 폼 */
export function AdminForm({
  action,
  children,
  className,
  resetOnSuccess,
  onSuccess,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const seen = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (!state || state === seen.current) return;
    seen.current = state;
    if (state.ok) {
      toast.success(state.message);
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.();
    } else {
      toast.error(state.message);
    }
  }, [state, resetOnSuccess, onSuccess]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
    </form>
  );
}

export function SubmitButton({
  children = "저장",
  variant = "default",
  size = "default",
  className,
}: {
  children?: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} className={className}>
      {pending && <Loader2Icon className="animate-spin" />}
      {children}
    </Button>
  );
}

/** 확인 후 삭제하는 버튼 (form 안에 hidden id 필요) */
export function DeleteButton({ label, small }: { label: string; small?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size={small ? "sm" : "default"}
      disabled={pending}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={(e) => {
        if (!confirm(`${label}\n\n정말 삭제할까요? 하위 항목도 함께 삭제되며 되돌릴 수 없습니다.`)) {
          e.preventDefault();
        }
      }}
    >
      {pending ? <Loader2Icon className="animate-spin" /> : <TrashIcon />}
      {small ? null : "삭제"}
    </Button>
  );
}

/** 라벨 + 입력을 묶은 필드 */
export function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  required,
  hint,
  className,
  textarea,
  rows = 3,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  textarea?: boolean;
  rows?: number;
  step?: string;
}) {
  const id = `f-${name}-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-xs">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {textarea ? (
        <Textarea id={id} name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} rows={rows} />
      ) : (
        <Input
          id={id}
          name={name}
          type={type}
          step={step}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          required={required}
        />
      )}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SelectField({
  label,
  name,
  defaultValue,
  options,
  hint,
  className,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: { value: string; label: string }[];
  hint?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CheckField({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-md border p-2.5">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-foreground" />
      <span>
        <span className="text-xs font-medium">{label}</span>
        {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}
