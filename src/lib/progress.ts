/**
 * 달성도 계산 — 대시보드 전체가 이 파일의 규칙을 따른다.
 *
 * 진행률(%)   = (최신값 − 기준값) / (목표값 − 기준값) × 100
 *   분모 부호가 방향(증가/감소 목표)을 자동으로 흡수하므로 direction 없이도 성립한다.
 *   direction은 추세 화살표 색과 "높을수록 좋음" 문구에만 쓴다.
 *
 * 기대진행률 = (최신 데이터 연도 − 기준연도) / (목표연도 − 기준연도) × 100
 *   현재연도가 아니라 최신 데이터 연도 기준. 통계 공표가 1~2년 늦는 지표를
 *   현재연도 기대치와 비교하면 멀쩡한 지표가 전부 "지연"으로 찍히기 때문.
 */

export const STATUSES = ["달성", "순조", "지연", "악화", "모니터링", "자료없음"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_META: Record<Status, { color: string; bg: string; text: string; desc: string }> = {
  달성: {
    color: "#2B8A3E",
    bg: "rgba(43,138,62,0.10)",
    text: "#1F6E31",
    desc: "목표값에 도달했습니다.",
  },
  순조: {
    color: "#1971C2",
    bg: "rgba(25,113,194,0.10)",
    text: "#155FA6",
    desc: "기대 진행 속도를 따라가고 있습니다.",
  },
  지연: {
    color: "#E8590C",
    bg: "rgba(232,89,12,0.10)",
    text: "#C2490A",
    desc: "기대 진행 속도에 못 미칩니다.",
  },
  악화: {
    color: "#C92A2A",
    bg: "rgba(201,42,42,0.10)",
    text: "#A82323",
    desc: "기준값보다 후퇴했습니다.",
  },
  모니터링: {
    color: "#868E96",
    bg: "rgba(134,142,150,0.12)",
    text: "#5C6369",
    desc: "목표값이 설정되지 않은 관찰용 지표입니다.",
  },
  자료없음: {
    color: "#ADB5BD",
    bg: "rgba(173,181,189,0.15)",
    text: "#6C757D",
    desc: "실적값이 아직 입력되지 않았습니다.",
  },
};

/** 최신 데이터가 이 햇수보다 오래되면 "자료 갱신 필요" 배지 */
export const STALE_YEARS = 3;

export interface IndicatorLike {
  direction: string;
  baselineYear: number | null;
  baselineValue: number | null;
  targetYear: number | null;
  targetValue: number | null;
  statusOverride?: string | null;
}

export interface ValueLike {
  year: number;
  value: number;
  note?: string | null;
}

export interface Computed {
  latest: ValueLike | null;
  previous: ValueLike | null;
  /** 표시용 진행률 0~100 (초과달성도 100으로 클램프) */
  progress: number | null;
  /** 클램프 전 실제 진행률 (음수 가능) */
  rawProgress: number | null;
  /** 기대진행률 0~100 */
  expected: number | null;
  status: Status;
  /** 자동 판정 대신 관리자가 지정한 값이면 true */
  overridden: boolean;
  /** 직전 연도 대비 변화량 */
  delta: number | null;
  /** 변화가 개선 방향이면 "good", 악화 방향이면 "bad", 변화 없으면 "flat" */
  trend: "good" | "bad" | "flat" | null;
  /** 최신 데이터가 오래됐는지 */
  stale: boolean;
  series: ValueLike[];
}

function isStatus(v: string): v is Status {
  return (STATUSES as readonly string[]).includes(v);
}

export function compute(indicator: IndicatorLike, values: ValueLike[], now = new Date().getFullYear()): Computed {
  const series = [...values].sort((a, b) => a.year - b.year);
  const latest = series.length ? series[series.length - 1] : null;
  const previous = series.length > 1 ? series[series.length - 2] : null;

  const { baselineValue, baselineYear, targetValue, targetYear } = indicator;

  let rawProgress: number | null = null;
  let expected: number | null = null;

  const hasTarget = targetValue !== null && targetValue !== undefined;
  const hasBaseline = baselineValue !== null && baselineValue !== undefined;

  if (latest && hasTarget && hasBaseline && targetValue !== baselineValue) {
    rawProgress = ((latest.value - baselineValue!) / (targetValue! - baselineValue!)) * 100;
  }
  if (latest && baselineYear && targetYear && targetYear !== baselineYear) {
    expected = ((latest.year - baselineYear) / (targetYear - baselineYear)) * 100;
    expected = Math.max(0, Math.min(100, expected));
  }

  let status: Status;
  if (!latest) status = "자료없음";
  else if (!hasTarget) status = "모니터링";
  else if (rawProgress === null) status = "모니터링";
  else if (rawProgress >= 100) status = "달성";
  else if (rawProgress < 0) status = "악화";
  else if (expected === null) status = rawProgress >= 50 ? "순조" : "지연";
  else status = rawProgress >= expected * 0.9 ? "순조" : "지연";

  const override = indicator.statusOverride?.trim();
  const overridden = !!override && isStatus(override);
  if (overridden) status = override as Status;

  const delta = latest && previous ? latest.value - previous.value : null;
  let trend: Computed["trend"] = null;
  if (delta !== null) {
    if (Math.abs(delta) < 1e-9) trend = "flat";
    else if (indicator.direction === "down") trend = delta < 0 ? "good" : "bad";
    else trend = delta > 0 ? "good" : "bad";
  }

  return {
    latest,
    previous,
    progress: rawProgress === null ? null : Math.max(0, Math.min(100, rawProgress)),
    rawProgress,
    expected,
    status,
    overridden,
    delta,
    trend,
    stale: !!latest && now - latest.year > STALE_YEARS,
    series,
  };
}

/** 숫자를 단위에 맞춰 보기 좋게 — 큰 수는 천단위 콤마, 소수는 최대 2자리 */
export function formatValue(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  const digits = abs >= 1000 ? 0 : abs >= 100 ? 1 : 2;
  return v.toLocaleString("ko-KR", { maximumFractionDigits: digits });
}

export function formatDelta(v: number | null): string {
  if (v === null) return "—";
  const s = formatValue(Math.abs(v));
  return v > 0 ? `+${s}` : v < 0 ? `−${s}` : "0";
}

/** 여러 지표의 평균 달성도 (자료없음·모니터링 제외) */
export function averageProgress(items: Computed[]): number | null {
  const xs = items.map((c) => c.progress).filter((p): p is number => p !== null);
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function countByStatus(items: Computed[]): Record<Status, number> {
  const out = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const c of items) out[c.status]++;
  return out;
}
