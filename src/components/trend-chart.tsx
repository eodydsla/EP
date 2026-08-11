"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatValue } from "@/lib/progress";

export interface TrendPoint {
  year: number;
  value: number;
  note?: string | null;
}

export interface TrendChartProps {
  data: TrendPoint[];
  color: string;
  unit?: string | null;
  baselineValue?: number | null;
  baselineYear?: number | null;
  targetValue?: number | null;
  targetYear?: number | null;
  height?: number;
}

/** 지표 상세의 시계열 차트 — 기준선·목표선을 함께 표시한다. */
export function TrendChart({
  data,
  color,
  unit,
  baselineValue,
  baselineYear,
  targetValue,
  targetYear,
  height = 260,
}: TrendChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
        style={{ height }}
      >
        실적값이 아직 입력되지 않았습니다.
      </div>
    );
  }

  const years = data.map((d) => d.year);
  const values = data.map((d) => d.value);
  const candidates = [...values];
  if (typeof targetValue === "number") candidates.push(targetValue);
  if (typeof baselineValue === "number") candidates.push(baselineValue);
  const min = Math.min(...candidates);
  const max = Math.max(...candidates);
  const pad = (max - min || Math.abs(max) || 1) * 0.15;

  const domainMaxYear = Math.max(...years, targetYear ?? -Infinity);
  const showTargetYear = typeof targetYear === "number" && targetYear > Math.max(...years);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id={`grad-${color.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
          <XAxis
            dataKey="year"
            type="number"
            domain={[Math.min(...years), showTargetYear ? domainMaxYear : Math.max(...years)]}
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            ticks={
              showTargetYear
                ? Array.from(new Set([...years, targetYear as number]))
                : years
            }
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={54}
            tickFormatter={(v: number) => formatValue(v)}
          />
          <Tooltip
            formatter={(v) => [`${formatValue(Number(v))}${unit ? ` ${unit}` : ""}`, "실적"]}
            labelFormatter={(l) => `${l}년`}
            contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid var(--border)" }}
          />
          {typeof baselineValue === "number" && (
            <ReferenceLine
              y={baselineValue}
              stroke="#868E96"
              strokeDasharray="4 4"
              label={{ value: `기준 ${baselineYear ?? ""}`, position: "insideBottomLeft", fontSize: 10, fill: "#868E96" }}
            />
          )}
          {typeof targetValue === "number" && (
            <ReferenceLine
              y={targetValue}
              stroke="#2B8A3E"
              strokeDasharray="6 3"
              label={{ value: `목표 ${targetYear ?? ""}`, position: "insideTopLeft", fontSize: 10, fill: "#2B8A3E" }}
            />
          )}
          <Area type="monotone" dataKey="value" stroke="none" fill={`url(#grad-${color.replace(/[^a-zA-Z0-9]/g, "")})`} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.4}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
