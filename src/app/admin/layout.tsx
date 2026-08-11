import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import { logoutAction } from "@/lib/admin-actions";
import { NavLinks } from "@/components/nav-links";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, LogOutIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "개요" },
  { href: "/admin/structure", label: "목표·세부목표" },
  { href: "/admin/indicators", label: "지표" },
  { href: "/admin/actions", label: "이행과제" },
  { href: "/admin/data", label: "가져오기·내보내기" },
  { href: "/admin/config", label: "사이트 설정" },
  { href: "/admin/logs", label: "수정 이력" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/login");
  const config = await getConfig();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="rounded bg-foreground px-1.5 py-0.5 text-[10px] font-bold text-background">관리자</span>
            <span className="truncate text-sm font-bold">{config.site_title}</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/admin/preview" />}>
              미리보기
            </Button>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/" target="_blank" />}>
              공개 사이트 <ExternalLinkIcon />
            </Button>
            <form action={logoutAction}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOutIcon /> 로그아웃
              </Button>
            </form>
          </div>
          <NavLinks items={NAV} className="order-3 w-full border-t pt-2" />
        </div>
      </header>
      <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
