/**
 * 시드 스크립트 — sheets/*.csv 를 읽어 SQLite에 넣는다.
 * 실행: npm run db:seed  (기존 데이터를 모두 지우고 다시 채움)
 */
import { PrismaClient } from "@prisma/client";
import Papa from "papaparse";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const SHEETS_DIR = path.join(process.cwd(), "sheets");

function readCsv<T extends Record<string, string>>(name: string): T[] {
  const file = path.join(SHEETS_DIR, `${name}.csv`);
  const text = fs.readFileSync(file, "utf-8");
  const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    console.warn(`⚠ ${name}.csv 파싱 경고:`, parsed.errors.slice(0, 3));
  }
  return parsed.data;
}

const str = (v?: string) => {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
};
const num = (v?: string) => {
  const s = (v ?? "").trim();
  if (s === "") return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};
const int = (v?: string) => {
  const n = num(v);
  return n === null ? null : Math.round(n);
};
const bool = (v?: string, fallback = false) => {
  const s = (v ?? "").trim().toUpperCase();
  if (s === "TRUE" || s === "Y" || s === "1") return true;
  if (s === "FALSE" || s === "N" || s === "0") return false;
  return fallback;
};

async function main() {
  console.log("기존 데이터 삭제 중…");
  await prisma.auditLog.deleteMany();
  await prisma.indicatorValue.deleteMany();
  await prisma.action.deleteMany();
  await prisma.indicator.deleteMany();
  await prisma.target.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.config.deleteMany();

  // ── config ──────────────────────────────────────────────
  const configRows = readCsv<{ key: string; value: string }>("config");
  for (const r of configRows) {
    if (!str(r.key)) continue;
    await prisma.config.create({ data: { key: r.key.trim(), value: r.value ?? "" } });
  }
  console.log(`config: ${configRows.length}건`);

  // ── goals ───────────────────────────────────────────────
  const goalRows = readCsv<Record<string, string>>("goals");
  const goalIdByCode = new Map<string, string>();
  for (const [i, r] of goalRows.entries()) {
    const g = await prisma.goal.create({
      data: {
        code: r.goal_id.trim(),
        no: (r.goal_no ?? "").trim(),
        name: r.goal_name.trim(),
        description: str(r.goal_desc),
        color: str(r.color),
        icon: str(r.icon),
        order: int(r.order) ?? i + 1,
      },
    });
    goalIdByCode.set(g.code, g.id);
  }
  console.log(`goals: ${goalRows.length}건`);

  // ── targets ─────────────────────────────────────────────
  const targetRows = readCsv<Record<string, string>>("targets");
  const targetIdByCode = new Map<string, string>();
  for (const [i, r] of targetRows.entries()) {
    const goalId = goalIdByCode.get(r.goal_id.trim());
    if (!goalId) {
      console.warn(`⚠ targets ${r.target_id}: 목표 ${r.goal_id} 없음 — 건너뜀`);
      continue;
    }
    const t = await prisma.target.create({
      data: {
        code: r.target_id.trim(),
        goalId,
        name: r.target_name.trim(),
        description: str(r.target_desc),
        order: int(r.order) ?? i + 1,
      },
    });
    targetIdByCode.set(t.code, t.id);
  }
  console.log(`targets: ${targetRows.length}건`);

  // ── indicators ──────────────────────────────────────────
  const indicatorRows = readCsv<Record<string, string>>("indicators");
  const indicatorIdByCode = new Map<string, string>();
  for (const [i, r] of indicatorRows.entries()) {
    const targetId = targetIdByCode.get(r.target_id.trim());
    if (!targetId) {
      console.warn(`⚠ indicators ${r.indicator_id}: 세부목표 ${r.target_id} 없음 — 건너뜀`);
      continue;
    }
    const ind = await prisma.indicator.create({
      data: {
        code: r.indicator_id.trim(),
        targetId,
        name: r.indicator_name.trim(),
        definition: str(r.definition),
        method: str(r.method),
        unit: str(r.unit),
        direction: (str(r.direction) ?? "up").toLowerCase() === "down" ? "down" : "up",
        baselineYear: int(r.baseline_year),
        baselineValue: num(r.baseline_value),
        targetYear: int(r.target_year),
        targetValue: num(r.target_value),
        source: str(r.source),
        sourceUrl: str(r.source_url),
        updateCycle: str(r.update_cycle),
        custodian: str(r.custodian),
        statusOverride: str(r.status_override),
        isHeadline: bool(r.is_headline),
        published: bool(r.display, true),
        note: str(r.note),
        order: i + 1,
      },
    });
    indicatorIdByCode.set(ind.code, ind.id);
  }
  console.log(`indicators: ${indicatorRows.length}건`);

  // ── values ──────────────────────────────────────────────
  const valueRows = readCsv<Record<string, string>>("values");
  let valueCount = 0;
  for (const r of valueRows) {
    const indicatorId = indicatorIdByCode.get(r.indicator_id.trim());
    const year = int(r.year);
    const value = num(r.value);
    if (!indicatorId || year === null || value === null) {
      console.warn(`⚠ values ${r.indicator_id}/${r.year}: 유효하지 않음 — 건너뜀`);
      continue;
    }
    await prisma.indicatorValue.create({
      data: {
        indicatorId,
        year,
        value,
        region: str(r.region) ?? "전국",
        note: str(r.note),
      },
    });
    valueCount++;
  }
  console.log(`values: ${valueCount}건`);

  // ── actions ─────────────────────────────────────────────
  const actionRows = readCsv<Record<string, string>>("actions");
  for (const [i, r] of actionRows.entries()) {
    await prisma.action.create({
      data: {
        code: r.action_id.trim(),
        goalId: goalIdByCode.get((r.goal_id ?? "").trim()) ?? null,
        targetId: targetIdByCode.get((r.target_id ?? "").trim()) ?? null,
        title: r.title.trim(),
        summary: str(r.summary),
        status: str(r.status) ?? "추진중",
        dueYear: int(r.due_year),
        responsible: str(r.responsible),
        lastUpdate: str(r.last_update),
        links: str(r.links),
        order: i + 1,
      },
    });
  }
  console.log(`actions: ${actionRows.length}건`);

  await prisma.auditLog.create({
    data: {
      actor: "시스템",
      action: "import",
      entity: "Seed",
      label: "초기 시드 데이터 주입",
      detail: JSON.stringify({
        goals: goalRows.length,
        targets: targetRows.length,
        indicators: indicatorRows.length,
        values: valueCount,
        actions: actionRows.length,
      }),
    },
  });

  console.log("✔ 시드 완료");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
