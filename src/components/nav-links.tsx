"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  /** true 면 정확히 일치할 때만 활성 (홈처럼 모든 경로의 접두사인 항목에 필요) */
  exact?: boolean;
  /** 활성 상태 배경색. 없으면 기본 전경색 */
  color?: string;
}

export function NavLinks({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-1 overflow-x-auto", className)}>
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              active ? "text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            style={
              active
                ? { backgroundColor: item.color ?? "var(--foreground)" }
                : item.color
                  ? { color: item.color }
                  : undefined
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
