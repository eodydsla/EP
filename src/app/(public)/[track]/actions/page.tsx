import { notFound } from "next/navigation";
import { getDashboard, findTrack } from "@/lib/data";
import { ActionsBoard } from "@/components/actions-board";

export const dynamic = "force-dynamic";

export default async function ActionsPage({ params }: { params: Promise<{ track: string }> }) {
  const { track: code } = await params;
  const dashboard = await getDashboard();
  const track = findTrack(dashboard, code);
  if (!track) notFound();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">{track.name} · 이행과제 트래커</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          목표 달성을 위한 개별 과제의 추진 상태와 근거 자료를 추적합니다. 과제를 클릭하면 상세 내용이 펼쳐집니다.
        </p>
      </div>
      {track.actions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          이 {dashboard.config.level0_label}에는 등록된 이행과제가 없습니다.
          <br />
          관측·조사 중심 영역이라면 {dashboard.config.level3_label} 화면을 확인해 주세요.
        </div>
      ) : (
        <ActionsBoard
          actions={track.actions}
          goals={track.goals.map((g) => ({ id: g.id, no: g.no, name: g.name, color: g.color }))}
          level1Label={dashboard.config.level1_label}
        />
      )}
    </div>
  );
}
