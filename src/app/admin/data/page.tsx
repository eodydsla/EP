import { prisma } from "@/lib/prisma";
import { CSV_HEADERS, CSV_LABELS, CSV_TYPES } from "@/lib/csv";
import { ImportPanel } from "./import-panel";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DataPage() {
  const [goals, targets, indicators, values, actions, configs] = await Promise.all([
    prisma.goal.count(),
    prisma.target.count(),
    prisma.indicator.count(),
    prisma.indicatorValue.count(),
    prisma.action.count(),
    prisma.config.count(),
  ]);
  const counts: Record<string, number> = {
    goals,
    targets,
    indicators,
    values,
    actions,
    config: configs,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">가져오기 · 내보내기</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          엑셀·구글시트에서 작업한 표를 CSV로 한 번에 넣고, 현재 데이터를 CSV로 받을 수 있습니다.
        </p>
      </div>

      {/* 내보내기 */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-bold">CSV 내려받기</h2>
        <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
          내려받은 파일은 그대로 다시 업로드할 수 있는 형식입니다. 엑셀에서 열어 수정한 뒤 다시 올리면 됩니다.
        </p>
        <div className="flex flex-wrap gap-2">
          {CSV_TYPES.map((t) => (
            <Button key={t} variant="outline" size="sm" nativeButton={false} render={<Link href={`/api/export?type=${t}`} />}>
              <DownloadIcon /> {CSV_LABELS[t]} ({counts[t]})
            </Button>
          ))}
        </div>
      </section>

      {/* 가져오기 */}
      <ImportPanel counts={counts} />

      {/* 컬럼 안내 */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 text-base font-bold">CSV 컬럼 형식</h2>
        <div className="flex flex-col gap-4">
          {CSV_TYPES.map((t) => (
            <div key={t}>
              <h3 className="text-sm font-semibold">
                {CSV_LABELS[t]} <span className="font-mono text-xs text-muted-foreground">{t}</span>
              </h3>
              <div className="mt-1 overflow-x-auto">
                <code className="text-[11px] whitespace-nowrap text-muted-foreground">
                  {CSV_HEADERS[t].join(", ")}
                </code>
              </div>
            </div>
          ))}
        </div>
        <ul className="mt-4 flex list-disc flex-col gap-1 pl-4 text-xs text-muted-foreground">
          <li>첫 줄은 반드시 헤더여야 하며, 컬럼 순서는 달라도 됩니다(이름으로 찾습니다).</li>
          <li>탭으로 구분된 표(구글시트에서 복사한 내용)를 붙여넣어도 그대로 인식합니다.</li>
          <li>
            고유번호(<code>goal_id</code>, <code>target_id</code>, <code>indicator_id</code>, <code>action_id</code>)
            기준으로 이미 있으면 수정, 없으면 추가합니다.
          </li>
          <li>값이 없으면 빈 칸으로 두세요. 숫자 칸에 쉼표·% 기호를 넣지 마세요.</li>
          <li>
            <code>display</code> 컬럼에 <code>FALSE</code>를 넣으면 임시저장(비공개) 상태로 들어갑니다.
          </li>
        </ul>
      </section>
    </div>
  );
}
