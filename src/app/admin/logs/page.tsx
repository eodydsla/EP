import { prisma } from "@/lib/prisma";
import { ActionChip } from "@/components/admin/action-chip";

export const dynamic = "force-dynamic";

const ENTITY_LABEL: Record<string, string> = {
  Goal: "목표",
  Target: "세부목표",
  Indicator: "지표",
  IndicatorValue: "실적값",
  Action: "이행과제",
  Config: "설정",
  Seed: "시드",
  goals: "목표 CSV",
  targets: "세부목표 CSV",
  indicators: "지표 CSV",
  values: "실적값 CSV",
  actions: "이행과제 CSV",
  config: "설정 CSV",
};

export default async function LogsPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { at: "desc" }, take: 300 });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">수정 이력</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          최근 300건입니다. 어떤 값이 언제 어떻게 바뀌었는지 확인할 수 있습니다.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium whitespace-nowrap">시각</th>
              <th className="px-3 py-2 text-left font-medium">작업</th>
              <th className="px-3 py-2 text-left font-medium">대상</th>
              <th className="px-3 py-2 text-left font-medium">내용</th>
              <th className="px-3 py-2 text-left font-medium">변경 상세</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t align-top">
                <td className="px-3 py-2 text-xs whitespace-nowrap tabular-nums text-muted-foreground">
                  {l.at.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-3 py-2">
                  <ActionChip action={l.action} />
                </td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">{ENTITY_LABEL[l.entity] ?? l.entity}</td>
                <td className="px-3 py-2 font-medium">{l.label ?? "—"}</td>
                <td className="max-w-[420px] px-3 py-2">
                  {l.detail ? (
                    <details>
                      <summary className="cursor-pointer text-xs text-muted-foreground">보기</summary>
                      <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted p-2 text-[10px] whitespace-pre-wrap">
                        {formatDetail(l.detail)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-sm text-muted-foreground">
                  기록이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDetail(detail: string) {
  try {
    return JSON.stringify(JSON.parse(detail), null, 2);
  } catch {
    return detail;
  }
}
