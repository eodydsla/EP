import { getDashboard } from "@/lib/data";
import { ActionsBoard } from "@/components/actions-board";

export const dynamic = "force-dynamic";

export default async function ActionsPage() {
  const { actions, goals } = await getDashboard();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">이행과제 트래커</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          목표 달성을 위한 개별 과제의 추진 상태와 근거 자료를 추적합니다. 과제를 클릭하면 상세 내용이 펼쳐집니다.
        </p>
      </div>
      <ActionsBoard actions={actions} goals={goals} />
    </div>
  );
}
