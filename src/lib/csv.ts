import { prisma } from "@/lib/prisma";

export const CSV_TYPES = ["goals", "targets", "indicators", "values", "actions", "config"] as const;
export type CsvType = (typeof CSV_TYPES)[number];

export const CSV_HEADERS: Record<CsvType, string[]> = {
  goals: ["goal_id", "goal_no", "goal_name", "goal_desc", "color", "icon", "order", "display"],
  targets: ["target_id", "goal_id", "target_name", "target_desc", "order", "display"],
  indicators: [
    "indicator_id",
    "target_id",
    "indicator_name",
    "definition",
    "method",
    "unit",
    "direction",
    "baseline_year",
    "baseline_value",
    "target_year",
    "target_value",
    "source",
    "source_url",
    "update_cycle",
    "custodian",
    "status_override",
    "is_headline",
    "display",
    "note",
  ],
  values: ["indicator_id", "year", "value", "region", "note"],
  actions: [
    "action_id",
    "goal_id",
    "target_id",
    "title",
    "summary",
    "status",
    "due_year",
    "responsible",
    "last_update",
    "links",
  ],
  config: ["key", "value"],
};

export const CSV_LABELS: Record<CsvType, string> = {
  goals: "목표",
  targets: "세부목표",
  indicators: "지표",
  values: "실적값",
  actions: "이행과제",
  config: "사이트 설정",
};

function esc(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  return [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\r\n");
}

const b = (v: boolean) => (v ? "TRUE" : "FALSE");

/** 관리자 CSV 내려받기 — 업로드 포맷과 동일해서 그대로 되돌릴 수 있다 */
export async function exportCsv(type: CsvType): Promise<string> {
  const h = CSV_HEADERS[type];

  switch (type) {
    case "goals": {
      const rows = await prisma.goal.findMany({ orderBy: [{ order: "asc" }, { code: "asc" }] });
      return toCsv(h, rows.map((g) => [g.code, g.no, g.name, g.description, g.color, g.icon, g.order, b(g.published)]));
    }
    case "targets": {
      const rows = await prisma.target.findMany({
        orderBy: [{ order: "asc" }, { code: "asc" }],
        include: { goal: true },
      });
      return toCsv(h, rows.map((t) => [t.code, t.goal.code, t.name, t.description, t.order, b(t.published)]));
    }
    case "indicators": {
      const rows = await prisma.indicator.findMany({
        orderBy: [{ order: "asc" }, { code: "asc" }],
        include: { target: true },
      });
      return toCsv(
        h,
        rows.map((i) => [
          i.code,
          i.target.code,
          i.name,
          i.definition,
          i.method,
          i.unit,
          i.direction,
          i.baselineYear,
          i.baselineValue,
          i.targetYear,
          i.targetValue,
          i.source,
          i.sourceUrl,
          i.updateCycle,
          i.custodian,
          i.statusOverride,
          b(i.isHeadline),
          b(i.published),
          i.note,
        ]),
      );
    }
    case "values": {
      const rows = await prisma.indicatorValue.findMany({
        orderBy: [{ indicatorId: "asc" }, { year: "asc" }],
        include: { indicator: true },
      });
      return toCsv(h, rows.map((v) => [v.indicator.code, v.year, v.value, v.region, v.note]));
    }
    case "actions": {
      const rows = await prisma.action.findMany({
        orderBy: [{ order: "asc" }, { code: "asc" }],
        include: { goal: true, target: true },
      });
      return toCsv(
        h,
        rows.map((a) => [
          a.code,
          a.goal?.code ?? "",
          a.target?.code ?? "",
          a.title,
          a.summary,
          a.status,
          a.dueYear,
          a.responsible,
          a.lastUpdate,
          a.links,
        ]),
      );
    }
    case "config": {
      const rows = await prisma.config.findMany({ orderBy: { key: "asc" } });
      return toCsv(h, rows.map((c) => [c.key, c.value]));
    }
  }
}
