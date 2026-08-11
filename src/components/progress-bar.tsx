import { cn } from "@/lib/utils";
import { STATUS_META, type Status } from "@/lib/progress";

/**
 * 목표 대비 진행률 바.
 * - 채움은 목표색 그라디언트 (단색보다 덜 밋밋하게)
 * - 기대진행률 위치에 눈금 마커를 세워 "지금쯤 여기 있어야 한다"를 보여준다
 */
export function ProgressBar({
  progress,
  expected,
  color,
  status,
  height = 8,
  showTicks = true,
  className,
}: {
  progress: number | null;
  expected: number | null;
  color: string;
  status: Status;
  height?: number;
  showTicks?: boolean;
  className?: string;
}) {
  const p = Math.max(0, Math.min(100, progress ?? 0));
  const isBad = status === "지연" || status === "악화";
  const fillColor = isBad ? STATUS_META[status].color : color;

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className="relative w-full overflow-hidden rounded-full bg-muted"
        style={{ height }}
        role="progressbar"
        aria-valuenow={Math.round(p)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${p}%`,
            background: `linear-gradient(90deg, ${fillColor}bb 0%, ${fillColor} 100%)`,
          }}
        />
      </div>
      {showTicks && expected !== null && expected > 2 && expected < 99 && (
        <div
          className="absolute top-1/2 w-px -translate-y-1/2 bg-foreground/35"
          style={{ left: `${expected}%`, height: height + 6 }}
          title={`기대 진행률 ${Math.round(expected)}%`}
        />
      )}
    </div>
  );
}
