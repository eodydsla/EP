import { notFound } from "next/navigation";
import { getDashboard, findTrack } from "@/lib/data";
import { NavLinks } from "@/components/nav-links";

export const dynamic = "force-dynamic";

/**
 * 영역 안의 하위 메뉴. 이행과제가 없는 영역에서는 해당 탭을 아예 보여주지 않는다
 * (환경상태·환경체감처럼 관측·조사만 하는 영역).
 */
export default async function TrackLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ track: string }>;
}) {
  const { track: code } = await params;
  const dashboard = await getDashboard();
  const track = findTrack(dashboard, code);
  if (!track) notFound();

  const { config } = dashboard;
  const base = `/${track.code}`;

  const items = [
    { href: base, label: "개요", exact: true, color: track.color },
    { href: `${base}/indicators`, label: config.level3_label, color: track.color },
    ...(track.actions.length > 0
      ? [{ href: `${base}/actions`, label: "이행과제", color: track.color }]
      : []),
    { href: `${base}/data`, label: "데이터·방법론", color: track.color },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border p-3"
        style={{ backgroundColor: track.tone.tint, borderColor: track.tone.border }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xl leading-none">{track.icon ?? "◆"}</span>
          <div className="min-w-0">
            <div className="text-[10px] font-medium" style={{ color: track.tone.text }}>
              {config.level0_label}
            </div>
            <div className="truncate text-sm font-bold" style={{ color: track.tone.deep }}>
              {track.name}
            </div>
          </div>
        </div>
        <NavLinks items={items} className="sm:ml-2" />
      </div>
      {children}
    </div>
  );
}
