import { STATUS_META, type Status } from "@/lib/progress";
import { cn } from "@/lib/utils";

const ICON: Record<Status, string> = {
  달성: "●",
  순조: "▲",
  지연: "▼",
  악화: "✕",
  모니터링: "◇",
  자료없음: "–",
};

export function StatusBadge({
  status,
  size = "default",
  className,
}: {
  status: Status;
  size?: "sm" | "default";
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs",
        className,
      )}
      style={{ backgroundColor: meta.bg, color: meta.text, borderColor: meta.color + "33" }}
      title={meta.desc}
    >
      <span aria-hidden className="text-[0.7em] leading-none">
        {ICON[status]}
      </span>
      {status}
    </span>
  );
}
