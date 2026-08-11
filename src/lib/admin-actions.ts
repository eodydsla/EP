"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, login, logout } from "@/lib/auth";
import { CSV_TYPES, type CsvType } from "@/lib/csv";
import Papa from "papaparse";

export interface ActionResult {
  ok: boolean;
  message: string;
}

// ── 유틸 ────────────────────────────────────────────────────────
const s = (fd: FormData, k: string) => {
  const v = fd.get(k);
  const t = typeof v === "string" ? v.trim() : "";
  return t === "" ? null : t;
};
const req = (fd: FormData, k: string, label: string) => {
  const v = s(fd, k);
  if (!v) throw new Error(`${label}은(는) 필수 입력입니다.`);
  return v;
};
const n = (fd: FormData, k: string) => {
  const v = s(fd, k);
  if (v === null) return null;
  const x = Number(v.replace(/,/g, ""));
  if (!Number.isFinite(x)) throw new Error(`숫자가 아닌 값이 있습니다: ${v}`);
  return x;
};
const i = (fd: FormData, k: string) => {
  const x = n(fd, k);
  return x === null ? null : Math.round(x);
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";

async function log(action: string, entity: string, entityId: string | null, label: string, detail?: unknown) {
  await prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      label,
      detail: detail === undefined ? null : JSON.stringify(detail),
    },
  });
}

function refresh() {
  revalidatePath("/", "layout");
}

function fail(e: unknown): ActionResult {
  const message = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
  // Prisma 고유키 위반을 사람이 읽을 수 있게
  if (message.includes("Unique constraint")) {
    return { ok: false, message: "이미 같은 번호(코드)가 존재합니다. 다른 번호를 사용해 주세요." };
  }
  return { ok: false, message };
}

// ── 인증 ────────────────────────────────────────────────────────
export async function loginAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const pw = String(fd.get("password") ?? "");
  if (!pw) return { ok: false, message: "비밀번호를 입력해 주세요." };
  const ok = await login(pw);
  if (!ok) return { ok: false, message: "비밀번호가 일치하지 않습니다." };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  // 로그아웃하면 로그인 화면이 아니라 공개 대시보드로 보낸다
  redirect("/");
}

// ── 목표 ────────────────────────────────────────────────────────
export async function saveGoal(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = s(fd, "id");
    const data = {
      code: req(fd, "code", "목표 코드"),
      no: req(fd, "no", "목표 번호"),
      name: req(fd, "name", "목표명"),
      description: s(fd, "description"),
      color: s(fd, "color"),
      icon: s(fd, "icon"),
      order: i(fd, "order") ?? 0,
      published: bool(fd, "published"),
    };
    if (id) {
      const g = await prisma.goal.update({ where: { id }, data });
      await log("update", "Goal", g.id, `${g.no}. ${g.name}`, data);
    } else {
      const g = await prisma.goal.create({ data });
      await log("create", "Goal", g.id, `${g.no}. ${g.name}`, data);
    }
    refresh();
    return { ok: true, message: id ? "목표를 저장했습니다." : "목표를 추가했습니다." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteGoal(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = req(fd, "id", "id");
    const g = await prisma.goal.findUnique({ where: { id }, include: { targets: true } });
    if (!g) return { ok: false, message: "이미 삭제된 목표입니다." };
    await prisma.goal.delete({ where: { id } });
    await log("delete", "Goal", id, `${g.no}. ${g.name}`, { 하위세부목표: g.targets.length });
    refresh();
    return { ok: true, message: `"${g.name}" 및 하위 항목을 삭제했습니다.` };
  } catch (e) {
    return fail(e);
  }
}

// ── 세부목표 ─────────────────────────────────────────────────────
export async function saveTarget(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = s(fd, "id");
    const data = {
      code: req(fd, "code", "세부목표 코드"),
      goalId: req(fd, "goalId", "상위 목표"),
      name: req(fd, "name", "세부목표명"),
      description: s(fd, "description"),
      order: i(fd, "order") ?? 0,
      published: bool(fd, "published"),
    };
    if (id) {
      const t = await prisma.target.update({ where: { id }, data });
      await log("update", "Target", t.id, `${t.code} ${t.name}`, data);
    } else {
      const t = await prisma.target.create({ data });
      await log("create", "Target", t.id, `${t.code} ${t.name}`, data);
    }
    refresh();
    return { ok: true, message: id ? "세부목표를 저장했습니다." : "세부목표를 추가했습니다." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTarget(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = req(fd, "id", "id");
    const t = await prisma.target.findUnique({ where: { id }, include: { indicators: true } });
    if (!t) return { ok: false, message: "이미 삭제된 세부목표입니다." };
    await prisma.target.delete({ where: { id } });
    await log("delete", "Target", id, `${t.code} ${t.name}`, { 하위지표: t.indicators.length });
    refresh();
    return { ok: true, message: `"${t.code}" 및 하위 지표를 삭제했습니다.` };
  } catch (e) {
    return fail(e);
  }
}

// ── 지표 ────────────────────────────────────────────────────────
export async function saveIndicator(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = s(fd, "id");
    const data = {
      code: req(fd, "code", "지표 번호"),
      targetId: req(fd, "targetId", "상위 세부목표"),
      name: req(fd, "name", "지표명"),
      definition: s(fd, "definition"),
      method: s(fd, "method"),
      unit: s(fd, "unit"),
      direction: s(fd, "direction") === "down" ? "down" : "up",
      baselineYear: i(fd, "baselineYear"),
      baselineValue: n(fd, "baselineValue"),
      targetYear: i(fd, "targetYear"),
      targetValue: n(fd, "targetValue"),
      source: s(fd, "source"),
      sourceUrl: s(fd, "sourceUrl"),
      updateCycle: s(fd, "updateCycle"),
      custodian: s(fd, "custodian"),
      statusOverride: s(fd, "statusOverride"),
      isHeadline: bool(fd, "isHeadline"),
      published: bool(fd, "published"),
      note: s(fd, "note"),
      order: i(fd, "order") ?? 0,
    };
    if (id) {
      const ind = await prisma.indicator.update({ where: { id }, data });
      await log("update", "Indicator", ind.id, `${ind.code} ${ind.name}`, data);
      refresh();
      return { ok: true, message: "지표를 저장했습니다." };
    }
    const ind = await prisma.indicator.create({ data });
    await log("create", "Indicator", ind.id, `${ind.code} ${ind.name}`, data);
    refresh();
    redirect(`/admin/indicators/${ind.id}`);
  } catch (e) {
    // redirect()는 예외로 동작하므로 그대로 흘려보낸다
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    return fail(e);
  }
}

export async function deleteIndicator(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = req(fd, "id", "id");
    const ind = await prisma.indicator.findUnique({ where: { id }, include: { values: true } });
    if (!ind) return { ok: false, message: "이미 삭제된 지표입니다." };
    await prisma.indicator.delete({ where: { id } });
    await log("delete", "Indicator", id, `${ind.code} ${ind.name}`, { 실적값: ind.values.length });
    refresh();
    return { ok: true, message: `"${ind.name}"을(를) 삭제했습니다.` };
  } catch (e) {
    return fail(e);
  }
}

/** 목록에서 공개/비공개 토글 */
export async function toggleIndicatorPublished(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = req(fd, "id", "id");
    const ind = await prisma.indicator.findUnique({ where: { id } });
    if (!ind) return { ok: false, message: "지표를 찾을 수 없습니다." };
    const updated = await prisma.indicator.update({ where: { id }, data: { published: !ind.published } });
    await log("publish", "Indicator", id, `${ind.code} ${ind.name}`, { published: updated.published });
    refresh();
    return { ok: true, message: updated.published ? "공개로 전환했습니다." : "임시저장(비공개)으로 전환했습니다." };
  } catch (e) {
    return fail(e);
  }
}

// ── 실적값 ───────────────────────────────────────────────────────
export async function saveValue(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const indicatorId = req(fd, "indicatorId", "지표");
    const year = i(fd, "year");
    const value = n(fd, "value");
    if (year === null) return { ok: false, message: "연도를 입력해 주세요." };
    if (value === null) return { ok: false, message: "값을 입력해 주세요." };
    const region = s(fd, "region") ?? "전국";
    const note = s(fd, "note");

    const ind = await prisma.indicator.findUnique({ where: { id: indicatorId } });
    await prisma.indicatorValue.upsert({
      where: { indicatorId_year_region: { indicatorId, year, region } },
      create: { indicatorId, year, value, region, note },
      update: { value, note },
    });
    await log("update", "IndicatorValue", indicatorId, `${ind?.code ?? ""} ${year}년`, { year, value, region, note });
    refresh();
    return { ok: true, message: `${year}년 실적값을 저장했습니다.` };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteValue(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = req(fd, "id", "id");
    const v = await prisma.indicatorValue.findUnique({ where: { id }, include: { indicator: true } });
    if (!v) return { ok: false, message: "이미 삭제된 값입니다." };
    await prisma.indicatorValue.delete({ where: { id } });
    await log("delete", "IndicatorValue", id, `${v.indicator.code} ${v.year}년`, { value: v.value });
    refresh();
    return { ok: true, message: `${v.year}년 값을 삭제했습니다.` };
  } catch (e) {
    return fail(e);
  }
}

// ── 이행과제 ─────────────────────────────────────────────────────
export async function saveActionItem(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = s(fd, "id");
    const data = {
      code: req(fd, "code", "과제 번호"),
      goalId: s(fd, "goalId"),
      targetId: s(fd, "targetId"),
      title: req(fd, "title", "과제명"),
      summary: s(fd, "summary"),
      status: s(fd, "status") ?? "추진중",
      dueYear: i(fd, "dueYear"),
      responsible: s(fd, "responsible"),
      lastUpdate: s(fd, "lastUpdate"),
      links: s(fd, "links"),
      order: i(fd, "order") ?? 0,
      published: bool(fd, "published"),
    };
    if (id) {
      const a = await prisma.action.update({ where: { id }, data });
      await log("update", "Action", a.id, `${a.code} ${a.title}`, data);
    } else {
      const a = await prisma.action.create({ data });
      await log("create", "Action", a.id, `${a.code} ${a.title}`, data);
    }
    refresh();
    return { ok: true, message: id ? "이행과제를 저장했습니다." : "이행과제를 추가했습니다." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteActionItem(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = req(fd, "id", "id");
    const a = await prisma.action.findUnique({ where: { id } });
    if (!a) return { ok: false, message: "이미 삭제된 과제입니다." };
    await prisma.action.delete({ where: { id } });
    await log("delete", "Action", id, `${a.code} ${a.title}`);
    refresh();
    return { ok: true, message: `"${a.title}"을(를) 삭제했습니다.` };
  } catch (e) {
    return fail(e);
  }
}

// ── 사이트 설정 ───────────────────────────────────────────────────
export async function saveConfig(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const entries: [string, string][] = [];
    for (const [k, v] of fd.entries()) {
      if (!k.startsWith("cfg_")) continue;
      entries.push([k.slice(4), typeof v === "string" ? v : ""]);
    }
    // 새 항목 추가 지원
    const newKey = s(fd, "new_key");
    const newValue = fd.get("new_value");
    if (newKey) entries.push([newKey, typeof newValue === "string" ? newValue : ""]);

    for (const [key, value] of entries) {
      await prisma.config.upsert({ where: { key }, create: { key, value }, update: { value } });
    }
    await log("update", "Config", null, `설정 ${entries.length}건`, Object.fromEntries(entries));
    refresh();
    return { ok: true, message: "설정을 저장했습니다." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteConfig(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const key = req(fd, "key", "key");
    await prisma.config.delete({ where: { key } });
    await log("delete", "Config", null, `설정 ${key}`);
    refresh();
    return { ok: true, message: `"${key}" 설정을 삭제했습니다.` };
  } catch (e) {
    return fail(e);
  }
}

// ── CSV 가져오기 ──────────────────────────────────────────────────
type Row = Record<string, string>;

const t = (r: Row, k: string) => {
  const v = (r[k] ?? "").trim();
  return v === "" ? null : v;
};
const tn = (r: Row, k: string) => {
  const v = t(r, k);
  if (v === null) return null;
  const x = Number(v.replace(/,/g, ""));
  return Number.isFinite(x) ? x : null;
};
const ti = (r: Row, k: string) => {
  const x = tn(r, k);
  return x === null ? null : Math.round(x);
};
const tb = (r: Row, k: string, fallback: boolean) => {
  const v = (r[k] ?? "").trim().toUpperCase();
  if (["TRUE", "Y", "1", "O"].includes(v)) return true;
  if (["FALSE", "N", "0", "X"].includes(v)) return false;
  return fallback;
};

/**
 * CSV 업로드. 기존 행은 코드(고유번호) 기준으로 덮어쓰고 없으면 새로 만든다(upsert).
 * replace = true 이면 해당 종류의 기존 데이터를 모두 지우고 넣는다.
 */
export async function importCsv(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const type = String(fd.get("type") ?? "") as CsvType;
    if (!CSV_TYPES.includes(type)) return { ok: false, message: "가져올 데이터 종류를 선택해 주세요." };

    const file = fd.get("file");
    let text = typeof fd.get("text") === "string" ? String(fd.get("text")) : "";
    if (file && typeof file === "object" && "arrayBuffer" in file && (file as File).size > 0) {
      text = new TextDecoder("utf-8").decode(await (file as File).arrayBuffer());
    }
    text = text.replace(/^﻿/, "").trim();
    if (!text) return { ok: false, message: "CSV 파일을 선택하거나 내용을 붙여넣어 주세요." };

    // 탭 구분(TSV)도 그대로 받아준다
    const delimiter = text.split("\n")[0].includes("\t") ? "\t" : ",";
    const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: true, delimiter });
    const rows = parsed.data.filter((r) => Object.values(r).some((v) => (v ?? "").trim() !== ""));
    if (!rows.length) return { ok: false, message: "읽을 수 있는 행이 없습니다. 첫 줄이 헤더인지 확인해 주세요." };

    const replace = fd.get("replace") === "on";
    const warnings: string[] = [];
    let created = 0;
    let updated = 0;

    const goals = new Map((await prisma.goal.findMany()).map((g) => [g.code, g.id]));
    const targets = new Map((await prisma.target.findMany()).map((x) => [x.code, x.id]));
    const indicators = new Map((await prisma.indicator.findMany()).map((x) => [x.code, x.id]));

    if (replace) {
      if (type === "goals") await prisma.goal.deleteMany();
      if (type === "targets") await prisma.target.deleteMany();
      if (type === "indicators") await prisma.indicator.deleteMany();
      if (type === "values") await prisma.indicatorValue.deleteMany();
      if (type === "actions") await prisma.action.deleteMany();
      if (type === "config") await prisma.config.deleteMany();
      goals.clear();
      targets.clear();
      indicators.clear();
    }

    for (const [idx, r] of rows.entries()) {
      const line = idx + 2;
      try {
        if (type === "goals") {
          const code = t(r, "goal_id");
          if (!code) throw new Error("goal_id 없음");
          const data = {
            no: t(r, "goal_no") ?? code,
            name: t(r, "goal_name") ?? code,
            description: t(r, "goal_desc"),
            color: t(r, "color"),
            icon: t(r, "icon"),
            order: ti(r, "order") ?? idx + 1,
            published: tb(r, "display", true),
          };
          const existing = goals.get(code);
          const g = await prisma.goal.upsert({ where: { code }, create: { code, ...data }, update: data });
          goals.set(code, g.id);
          if (existing) updated++;
          else created++;
        } else if (type === "targets") {
          const code = t(r, "target_id");
          const goalCode = t(r, "goal_id");
          if (!code) throw new Error("target_id 없음");
          const goalId = goalCode ? goals.get(goalCode) : undefined;
          if (!goalId) throw new Error(`상위 목표 ${goalCode ?? "(비어있음)"} 를 찾을 수 없음`);
          const data = {
            goalId,
            name: t(r, "target_name") ?? code,
            description: t(r, "target_desc"),
            order: ti(r, "order") ?? idx + 1,
            published: tb(r, "display", true),
          };
          const existing = targets.get(code);
          const x = await prisma.target.upsert({ where: { code }, create: { code, ...data }, update: data });
          targets.set(code, x.id);
          if (existing) updated++;
          else created++;
        } else if (type === "indicators") {
          const code = t(r, "indicator_id");
          const targetCode = t(r, "target_id");
          if (!code) throw new Error("indicator_id 없음");
          const targetId = targetCode ? targets.get(targetCode) : undefined;
          if (!targetId) throw new Error(`상위 세부목표 ${targetCode ?? "(비어있음)"} 를 찾을 수 없음`);
          const data = {
            targetId,
            name: t(r, "indicator_name") ?? code,
            definition: t(r, "definition"),
            method: t(r, "method"),
            unit: t(r, "unit"),
            direction: (t(r, "direction") ?? "up").toLowerCase() === "down" ? "down" : "up",
            baselineYear: ti(r, "baseline_year"),
            baselineValue: tn(r, "baseline_value"),
            targetYear: ti(r, "target_year"),
            targetValue: tn(r, "target_value"),
            source: t(r, "source"),
            sourceUrl: t(r, "source_url"),
            updateCycle: t(r, "update_cycle"),
            custodian: t(r, "custodian"),
            statusOverride: t(r, "status_override"),
            isHeadline: tb(r, "is_headline", false),
            published: tb(r, "display", true),
            note: t(r, "note"),
            order: ti(r, "order") ?? idx + 1,
          };
          const existing = indicators.get(code);
          const x = await prisma.indicator.upsert({ where: { code }, create: { code, ...data }, update: data });
          indicators.set(code, x.id);
          if (existing) updated++;
          else created++;
        } else if (type === "values") {
          const indCode = t(r, "indicator_id");
          const year = ti(r, "year");
          const value = tn(r, "value");
          const region = t(r, "region") ?? "전국";
          if (!indCode) throw new Error("indicator_id 없음");
          const indicatorId = indicators.get(indCode);
          if (!indicatorId) throw new Error(`지표 ${indCode} 를 찾을 수 없음`);
          if (year === null) throw new Error("year 없음");
          if (value === null) throw new Error("value 없음");
          const res = await prisma.indicatorValue.upsert({
            where: { indicatorId_year_region: { indicatorId, year, region } },
            create: { indicatorId, year, value, region, note: t(r, "note") },
            update: { value, note: t(r, "note") },
          });
          if (res.createdAt.getTime() === res.updatedAt.getTime()) created++;
          else updated++;
        } else if (type === "actions") {
          const code = t(r, "action_id");
          if (!code) throw new Error("action_id 없음");
          const goalCode = t(r, "goal_id");
          const targetCode = t(r, "target_id");
          const data = {
            goalId: goalCode ? (goals.get(goalCode) ?? null) : null,
            targetId: targetCode ? (targets.get(targetCode) ?? null) : null,
            title: t(r, "title") ?? code,
            summary: t(r, "summary"),
            status: t(r, "status") ?? "추진중",
            dueYear: ti(r, "due_year"),
            responsible: t(r, "responsible"),
            lastUpdate: t(r, "last_update"),
            links: t(r, "links"),
            order: ti(r, "order") ?? idx + 1,
            published: tb(r, "display", true),
          };
          const before = await prisma.action.findUnique({ where: { code } });
          await prisma.action.upsert({ where: { code }, create: { code, ...data }, update: data });
          if (before) updated++;
          else created++;
        } else if (type === "config") {
          const key = t(r, "key");
          if (!key) throw new Error("key 없음");
          const value = r["value"] ?? "";
          const before = await prisma.config.findUnique({ where: { key } });
          await prisma.config.upsert({ where: { key }, create: { key, value }, update: { value } });
          if (before) updated++;
          else created++;
        }
      } catch (rowErr) {
        warnings.push(`${line}행: ${rowErr instanceof Error ? rowErr.message : "오류"}`);
      }
    }

    await log("import", type, null, `CSV 가져오기 (${type})`, { created, updated, skipped: warnings.length, replace });
    refresh();

    const base = `${created}건 추가, ${updated}건 수정`;
    if (warnings.length) {
      return {
        ok: true,
        message: `${base}, ${warnings.length}건 건너뜀 — ${warnings.slice(0, 3).join(" / ")}${warnings.length > 3 ? " …" : ""}`,
      };
    }
    return { ok: true, message: `${base} 완료했습니다.` };
  } catch (e) {
    return fail(e);
  }
}
