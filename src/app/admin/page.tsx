import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDashboard } from "@/lib/data";
import { countByStatus } from "@/lib/progress";
import { SummaryCards } from "@/components/summary-cards";
import { ActionChip } from "@/components/admin/action-chip";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  ClipboardListIcon,
  DatabaseIcon,
  EyeOffIcon,
  LayersIcon,
  LayoutListIcon,
  ListTreeIcon,
  SettingsIcon,
  TriangleAlertIcon,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  // 관리자 화면에서는 비공개(임시저장) 항목까지 모두 본다
  const { tracks, goals, indicators, actions, config } = await getDashboard(true);
  const counts = countByStatus(indicators.map((i) => i.computed));

  const [logs, valueCount] = await Promise.all([
    prisma.auditLog.findMany({ orderBy: { at: "desc" }, take: 8 }),
    prisma.indicatorValue.count(),
  ]);

  const drafts = indicators.filter((i) => !i.published);
  const noValues = indicators.filter((i) => i.computed.series.length === 0);
  const stale = indicators.filter((i) => i.computed.stale);
  const noTarget = indicators.filter((i) => i.targetValue === null);

  const cards = [
    { href: "/admin/structure", icon: LayoutListIcon, label: config.level0_label, value: String(tracks.length) },
    {
      href: "/admin/structure",
      icon: ListTreeIcon,
      label: `${config.level1_label}·${config.level2_label}`,
      value: `${goals.length} · ${goals.reduce((a, g) => a + g.targets.length, 0)}`,
    },
    { href: "/admin/indicators", icon: LayersIcon, label: config.level3_label, value: String(indicators.length) },
    { href: "/admin/indicators", icon: DatabaseIcon, label: "실적값", value: String(valueCount) },
    { href: "/admin/actions", icon: ClipboardListIcon, label: "이행과제", value: String(actions.length) },
  ];

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">관리자 개요</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            여기서 수정한 내용은 공개 대시보드에 바로 반영됩니다. 임시저장 항목은 공개 화면에 나타나지 않습니다.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/indicators/new" />}>
          {config.level3_label} 추가 <ArrowRightIcon />
        </Button>
      </div>

      {/* 데이터 규모 */}
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <c.icon className="size-5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="text-2xl font-bold tabular-nums">{c.value}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* 이행 현황 */}
      <section>
        <h2 className="mb-3 text-base font-bold">지표 이행 현황 (임시저장 포함)</h2>
        <SummaryCards total={indicators.length} counts={counts} />
      </section>

      {/* 점검 필요 */}
      <section>
        <h2 className="mb-3 text-base font-bold">점검이 필요한 항목</h2>
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
          <CheckList
            icon={<EyeOffIcon className="size-4 text-amber-600" />}
            title="임시저장 상태"
            desc="공개 대시보드에 나타나지 않는 지표"
            items={drafts.map((i) => ({ id: i.id, code: i.code, name: i.name }))}
          />
          <CheckList
            icon={<TriangleAlertIcon className="size-4 text-rose-600" />}
            title="실적값 없음"
            desc="연도별 값이 하나도 입력되지 않은 지표"
            items={noValues.map((i) => ({ id: i.id, code: i.code, name: i.name }))}
          />
          <CheckList
            icon={<TriangleAlertIcon className="size-4 text-orange-600" />}
            title="자료 갱신 필요"
            desc="최신 실적이 3년 넘게 갱신되지 않은 지표"
            items={stale.map((i) => ({ id: i.id, code: i.code, name: i.name }))}
          />
          <CheckList
            icon={<SettingsIcon className="size-4 text-slate-500" />}
            title="목표값 미설정"
            desc="달성도를 계산할 수 없는 모니터링 지표"
            items={noTarget.map((i) => ({ id: i.id, code: i.code, name: i.name }))}
          />
        </div>
      </section>

      {/* 최근 수정 이력 */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-bold">최근 수정 이력</h2>
          <Link href="/admin/logs" className="text-xs underline underline-offset-2">
            전체 보기
          </Link>
        </div>
        <ul className="overflow-hidden rounded-xl border bg-card">
          {logs.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">기록이 없습니다.</li>}
          {logs.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-2 border-b p-3 text-sm last:border-b-0">
              <ActionChip action={l.action} />
              <span className="text-muted-foreground">{l.entity}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{l.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {l.at.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CheckList({
  icon,
  title,
  desc,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  items: { id: string; code: string; name: string }[];
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold">{title}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">{items.length}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      {items.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {items.slice(0, 5).map((i) => (
            <li key={i.id}>
              <Link
                href={`/admin/indicators/${i.id}`}
                className="flex items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-muted"
              >
                <span className="font-mono text-[10px] text-muted-foreground">{i.code}</span>
                <span className="truncate">{i.name}</span>
              </Link>
            </li>
          ))}
          {items.length > 5 && <li className="px-1 text-[11px] text-muted-foreground">외 {items.length - 5}건</li>}
        </ul>
      )}
    </div>
  );
}

