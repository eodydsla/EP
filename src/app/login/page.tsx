import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex h-1.5 w-full">
          <div className="flex-1" style={{ backgroundColor: "#E8590C" }} />
          <div className="flex-1" style={{ backgroundColor: "#0B7285" }} />
          <div className="flex-1" style={{ backgroundColor: "#2F9E44" }} />
        </div>
        <div className="p-6">
          <h1 className="text-lg font-bold">관리자 로그인</h1>
          <p className="mt-1 mb-5 text-xs text-muted-foreground">
            지표·이행과제 데이터를 수정하려면 공용 비밀번호가 필요합니다.
          </p>
          <LoginForm />
          <Link href="/" className="mt-4 block text-center text-xs text-muted-foreground underline underline-offset-2">
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
