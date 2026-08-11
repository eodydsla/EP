import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/data";
import { IndicatorForm } from "@/components/admin/indicator-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewIndicatorPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string }>;
}) {
  const sp = await searchParams;
  const [targets, config, count] = await Promise.all([
    prisma.target.findMany({ orderBy: [{ order: "asc" }, { code: "asc" }], include: { goal: true } }),
    getConfig(),
    prisma.indicator.count(),
  ]);

  if (targets.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{config.level3_label} 추가</h1>
        <Alert>
          <InfoIcon />
          <AlertDescription>
            먼저 {config.level1_label}과 {config.level2_label}을 만들어야 합니다.{" "}
            <Link href="/admin/structure" className="underline underline-offset-2">
              목표·세부목표 관리로 이동
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">{config.level3_label} 추가</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          저장하면 실적값을 입력할 수 있는 편집 화면으로 이동합니다.
        </p>
      </div>
      <div className="rounded-xl border bg-card p-5">
        <IndicatorForm
          values={{ targetId: sp.target, published: true, direction: "up", order: count + 1 }}
          targets={targets.map((t) => ({
            id: t.id,
            code: t.code,
            name: t.name,
            goalLabel: `${t.goal.no}. ${t.goal.name}`,
          }))}
          level2Label={config.level2_label}
          level3Label={config.level3_label}
        />
      </div>
    </div>
  );
}
