import "server-only";
import { prisma } from "@/lib/prisma";
import { compute, type Computed } from "@/lib/progress";
import { goalColor, tones, type Tones } from "@/lib/colors";

export interface DashIndicator {
  id: string;
  code: string;
  name: string;
  definition: string | null;
  method: string | null;
  unit: string | null;
  direction: string;
  baselineYear: number | null;
  baselineValue: number | null;
  targetYear: number | null;
  targetValue: number | null;
  source: string | null;
  sourceUrl: string | null;
  updateCycle: string | null;
  custodian: string | null;
  isHeadline: boolean;
  published: boolean;
  note: string | null;
  computed: Computed;
  // 상위 계층 정보 (필터·카드에서 바로 쓰기 위해 평탄화)
  targetId: string;
  targetCode: string;
  targetName: string;
  goalId: string;
  goalCode: string;
  goalNo: string;
  goalName: string;
  color: string;
  tone: Tones;
}

export interface DashTarget {
  id: string;
  code: string;
  name: string;
  description: string | null;
  published: boolean;
  indicators: DashIndicator[];
}

export interface DashGoal {
  id: string;
  code: string;
  no: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  tone: Tones;
  published: boolean;
  targets: DashTarget[];
  indicators: DashIndicator[]; // 목표에 속한 전체 지표(평탄화)
}

export interface DashAction {
  id: string;
  code: string;
  title: string;
  summary: string | null;
  status: string;
  dueYear: number | null;
  responsible: string | null;
  lastUpdate: string | null;
  links: { label: string; url: string }[];
  published: boolean;
  goalId: string | null;
  goalName: string | null;
  goalNo: string | null;
  color: string | null;
  targetCode: string | null;
}

export interface Dashboard {
  goals: DashGoal[];
  indicators: DashIndicator[];
  actions: DashAction[];
  config: Record<string, string>;
}

export const CONFIG_DEFAULTS: Record<string, string> = {
  site_title: "K-SDGs 환경분야 지표 대시보드",
  site_subtitle: "기후변화 대응·해양생태계·육상생태계 이행현황",
  level1_label: "목표",
  level2_label: "세부목표",
  level3_label: "지표",
  framework_name: "국가 지속가능발전목표(K-SDGs)",
  org_name: "",
  contact: "",
  footer_note: "",
  last_updated: "",
};

export function parseLinks(raw: string | null): { label: string; url: string }[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((chunk) => {
      const i = chunk.indexOf("|");
      if (i === -1) return { label: chunk, url: chunk };
      return { label: chunk.slice(0, i).trim(), url: chunk.slice(i + 1).trim() };
    })
    .filter((l) => l.url);
}

export async function getConfig(): Promise<Record<string, string>> {
  const rows = await prisma.config.findMany();
  const map = { ...CONFIG_DEFAULTS };
  for (const r of rows) map[r.key] = r.value;
  return map;
}

/**
 * 대시보드 전체 데이터.
 * includeUnpublished = true 이면 임시저장(비공개) 항목까지 포함한다(관리자 미리보기용).
 */
export async function getDashboard(includeUnpublished = false): Promise<Dashboard> {
  const [goals, actions, config] = await Promise.all([
    prisma.goal.findMany({
      where: includeUnpublished ? {} : { published: true },
      orderBy: [{ order: "asc" }, { code: "asc" }],
      include: {
        targets: {
          where: includeUnpublished ? {} : { published: true },
          orderBy: [{ order: "asc" }, { code: "asc" }],
          include: {
            indicators: {
              where: includeUnpublished ? {} : { published: true },
              orderBy: [{ order: "asc" }, { code: "asc" }],
              include: { values: { orderBy: { year: "asc" } } },
            },
          },
        },
      },
    }),
    prisma.action.findMany({
      where: includeUnpublished ? {} : { published: true },
      orderBy: [{ order: "asc" }, { code: "asc" }],
      include: { goal: true, target: true },
    }),
    getConfig(),
  ]);

  const dashGoals: DashGoal[] = goals.map((g, gi) => {
    const color = goalColor(g.color, gi);
    const tone = tones(color);
    const targets: DashTarget[] = g.targets.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      description: t.description,
      published: t.published,
      indicators: t.indicators.map((ind) => ({
        id: ind.id,
        code: ind.code,
        name: ind.name,
        definition: ind.definition,
        method: ind.method,
        unit: ind.unit,
        direction: ind.direction,
        baselineYear: ind.baselineYear,
        baselineValue: ind.baselineValue,
        targetYear: ind.targetYear,
        targetValue: ind.targetValue,
        source: ind.source,
        sourceUrl: ind.sourceUrl,
        updateCycle: ind.updateCycle,
        custodian: ind.custodian,
        isHeadline: ind.isHeadline,
        published: ind.published,
        note: ind.note,
        computed: compute(
          ind,
          ind.values.map((v) => ({ year: v.year, value: v.value, note: v.note })),
        ),
        targetId: t.id,
        targetCode: t.code,
        targetName: t.name,
        goalId: g.id,
        goalCode: g.code,
        goalNo: g.no,
        goalName: g.name,
        color,
        tone,
      })),
    }));

    return {
      id: g.id,
      code: g.code,
      no: g.no,
      name: g.name,
      description: g.description,
      icon: g.icon,
      color,
      tone,
      published: g.published,
      targets,
      indicators: targets.flatMap((t) => t.indicators),
    };
  });

  const colorByGoalId = new Map(dashGoals.map((g) => [g.id, g.color]));

  const dashActions: DashAction[] = actions.map((a) => ({
    id: a.id,
    code: a.code,
    title: a.title,
    summary: a.summary,
    status: a.status,
    dueYear: a.dueYear,
    responsible: a.responsible,
    lastUpdate: a.lastUpdate,
    links: parseLinks(a.links),
    published: a.published,
    goalId: a.goalId,
    goalName: a.goal?.name ?? null,
    goalNo: a.goal?.no ?? null,
    color: a.goalId ? (colorByGoalId.get(a.goalId) ?? null) : null,
    targetCode: a.target?.code ?? null,
  }));

  return {
    goals: dashGoals,
    indicators: dashGoals.flatMap((g) => g.indicators),
    actions: dashActions,
    config,
  };
}
