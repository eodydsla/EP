"use client";

import { loginAction } from "@/lib/admin-actions";
import { AdminForm, SubmitButton } from "@/components/admin/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  return (
    <AdminForm action={loginAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" className="text-xs">
          비밀번호
        </Label>
        <Input id="password" name="password" type="password" autoFocus autoComplete="current-password" />
      </div>
      <SubmitButton className="w-full">로그인</SubmitButton>
    </AdminForm>
  );
}
