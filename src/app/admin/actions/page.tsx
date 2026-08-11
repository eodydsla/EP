import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/data";
import { goalColor } from "@/lib/colors";
import { ActionsManager } from "./actions-manager";

export const dynamic = "force-dynamic";

export default async function AdminActionsPage() {
  const [actions, goals, targets, config] = await Promise.all([
    prisma.action.findMany({ orderBy: [{ order: "asc" }, { code: "asc" }] }),
    prisma.goal.findMany({ orderBy: [{ order: "asc" }, { code: "asc" }] }),
    prisma.target.findMany({ orderBy: [{ order: "asc" }, { code: "asc" }] }),
    getConfig(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">이행과제 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          총 {actions.length}개. 상태·기한·담당기관과 근거 링크를 관리합니다.
        </p>
      </div>
      <ActionsManager
        actions={actions.map((a) => ({
          id: a.id,
          code: a.code,
          goalId: a.goalId,
          targetId: a.targetId,
          title: a.title,
          summary: a.summary,
          status: a.status,
          dueYear: a.dueYear,
          responsible: a.responsible,
          lastUpdate: a.lastUpdate,
          links: a.links,
          order: a.order,
          published: a.published,
        }))}
        goals={goals.map((g, i) => ({
          id: g.id,
          label: `${g.no}. ${g.name}`,
          color: goalColor(g.color, i),
        }))}
        targets={targets.map((t) => ({ id: t.id, label: `${t.code} ${t.name}`, goalId: t.goalId }))}
        level1Label={config.level1_label}
      />
    </div>
  );
}
