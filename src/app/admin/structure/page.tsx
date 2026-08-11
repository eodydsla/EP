import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/data";
import { goalColor } from "@/lib/colors";
import { StructureManager } from "./structure-manager";

export const dynamic = "force-dynamic";

export default async function StructurePage() {
  const [tracks, config] = await Promise.all([
    prisma.track.findMany({
      orderBy: [{ order: "asc" }, { code: "asc" }],
      include: {
        goals: {
          orderBy: [{ order: "asc" }, { code: "asc" }],
          include: {
            targets: {
              orderBy: [{ order: "asc" }, { code: "asc" }],
              include: { _count: { select: { indicators: true } } },
            },
          },
        },
      },
    }),
    getConfig(),
  ]);

  const data = tracks.map((tr, ti) => ({
    id: tr.id,
    code: tr.code,
    name: tr.name,
    description: tr.description,
    color: tr.color,
    resolvedColor: goalColor(tr.color, ti),
    icon: tr.icon,
    order: tr.order,
    published: tr.published,
    goals: tr.goals.map((g, gi) => ({
      id: g.id,
      code: g.code,
      no: g.no,
      name: g.name,
      description: g.description,
      color: g.color,
      resolvedColor: goalColor(g.color, gi),
      icon: g.icon,
      order: g.order,
      published: g.published,
      targets: g.targets.map((t) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        description: t.description,
        order: t.order,
        published: t.published,
        indicatorCount: t._count.indicators,
      })),
    })),
  }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">
          {config.level0_label} · {config.level1_label} · {config.level2_label} 관리
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          계층을 자유롭게 추가·수정할 수 있습니다. 여기서 만든 {config.level0_label}은 공개 화면의 상단 메뉴에 자동으로
          추가되고, 색을 비워두면 팔레트에서 자동 배정됩니다.
        </p>
      </div>
      <StructureManager
        tracks={data}
        level0Label={config.level0_label}
        level1Label={config.level1_label}
        level2Label={config.level2_label}
        level3Label={config.level3_label}
      />
    </div>
  );
}
