import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NavLinks } from "@/components/nav-links";
import { LockIcon } from "lucide-react";

export interface TrackNavItem {
  code: string;
  name: string;
  icon: string | null;
  color: string;
}

/**
 * 상단 메뉴는 모니터링 영역 목록에서 만든다 — 영역을 추가하면 메뉴도 자동으로 늘어난다.
 */
export function SiteHeader({
  title,
  subtitle,
  tracks,
  lastUpdated,
}: {
  title: string;
  subtitle?: string;
  tracks: TrackNavItem[];
  lastUpdated?: string;
}) {
  const colors = tracks.map((t) => t.color);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      {/* 영역색이 가로로 흐르는 얇은 띠 — 영역이 몇 개든 자동으로 나뉜다 */}
      <div className="flex h-1 w-full">
        {(colors.length ? colors : ["#94a3b8"]).map((c, i) => (
          <div key={i} className="h-full flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] leading-tight font-bold">{title}</span>
          {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
        </Link>

        <NavLinks
          className="order-3 w-full sm:order-none sm:ml-4 sm:w-auto"
          items={[
            { href: "/", label: "통합 현황", exact: true },
            ...tracks.map((t) => ({
              href: `/${t.code}`,
              label: `${t.icon ? t.icon + " " : ""}${t.name}`,
              color: t.color,
            })),
          ]}
        />

        <div className="ml-auto flex items-center gap-2">
          {lastUpdated && (
            <span className="hidden text-xs text-muted-foreground md:inline">최종 갱신 {lastUpdated}</span>
          )}
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/admin" />}>
            <LockIcon /> 관리자
          </Button>
        </div>
      </div>
    </header>
  );
}
