const ACTION_LABEL: Record<string, { label: string; className: string }> = {
  create: { label: "추가", className: "bg-emerald-100 text-emerald-800" },
  update: { label: "수정", className: "bg-blue-100 text-blue-800" },
  delete: { label: "삭제", className: "bg-rose-100 text-rose-800" },
  import: { label: "가져오기", className: "bg-violet-100 text-violet-800" },
  publish: { label: "공개전환", className: "bg-amber-100 text-amber-800" },
};

export function ActionChip({ action }: { action: string }) {
  const meta = ACTION_LABEL[action] ?? { label: action, className: "bg-muted text-muted-foreground" };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${meta.className}`}>{meta.label}</span>;
}
