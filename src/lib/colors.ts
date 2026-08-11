/**
 * 목표별 아이덴티티 컬러.
 * 시트/관리자에서 색을 지정하지 않으면 팔레트에서 순서대로 자동 배정하므로
 * 목표를 몇 개 추가하든 색이 겹치거나 비어 보이지 않는다.
 */

export const GOAL_PALETTE = [
  "#E8590C", // 앰버
  "#0B7285", // 딥 틸
  "#2F9E44", // 포레스트
  "#5F3DC4", // 바이올렛
  "#0B5394", // 딥 블루
  "#B02A37", // 크림슨
  "#7048E8", // 인디고
  "#087F5B", // 에메랄드
  "#D6336C", // 마젠타
  "#A9761A", // 브론즈
];

export function goalColor(color: string | null | undefined, index: number): string {
  const c = (color ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(c) ? c : GOAL_PALETTE[index % GOAL_PALETTE.length];
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

/** 서버 → 클라이언트로 그대로 넘길 수 있도록 전부 문자열(직렬화 가능)로만 구성 */
export interface Tones {
  /** 원색 */
  base: string;
  /** 아주 옅은 배경 */
  tint: string;
  /** 카드 보더 */
  border: string;
  /** 색 위에 얹는 진한 텍스트 */
  text: string;
  /** 그라디언트 끝 색 */
  deep: string;
  a08: string;
  a15: string;
  a30: string;
}

/** 색 하나에서 배경·보더·텍스트 톤을 파생 — 색 하나만 지정해도 조화롭게 보인다 */
export function tones(hex: string): Tones {
  const [r, g, b] = hexToRgb(hex);
  const [h, s] = rgbToHsl(r, g, b);
  const a = (v: number) => `rgba(${r}, ${g}, ${b}, ${v})`;
  return {
    base: hex,
    tint: `hsl(${h.toFixed(0)} ${Math.min(s, 70).toFixed(0)}% 96.5%)`,
    border: `hsl(${h.toFixed(0)} ${Math.min(s, 60).toFixed(0)}% 87%)`,
    text: `hsl(${h.toFixed(0)} ${Math.min(s + 5, 75).toFixed(0)}% 30%)`,
    deep: `hsl(${h.toFixed(0)} ${Math.min(s + 8, 85).toFixed(0)}% 32%)`,
    a08: a(0.08),
    a15: a(0.15),
    a30: a(0.3),
  };
}
