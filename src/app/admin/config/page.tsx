import { prisma } from "@/lib/prisma";
import { CONFIG_DEFAULTS } from "@/lib/data";
import { ConfigEditor } from "./config-editor";

export const dynamic = "force-dynamic";

/** 화면에 보여줄 설정 키 설명 */
const DESCRIPTIONS: Record<string, string> = {
  site_title: "브라우저 탭·헤더·푸터에 표시되는 사이트 이름",
  site_subtitle: "제목 아래 한 줄 설명",
  level1_label: "최상위 계층 명칭 — 나중에 「부문」 등으로 바꾸면 화면 전체 용어가 함께 바뀝니다",
  level2_label: "중간 계층 명칭 — 예: 세부목표 → 추진전략",
  level3_label: "지표 계층 명칭 — 예: 지표 → 계획지표",
  framework_name: "지표 체계 이름 (푸터·개요에 표시)",
  org_name: "운영 기관명",
  contact: "문의처",
  last_updated: "헤더·푸터에 표시할 최종 갱신일",
  footer_note: "푸터 하단 안내 문구",
};

export default async function ConfigPage() {
  const rows = await prisma.config.findMany({ orderBy: { key: "asc" } });
  const existing = new Map(rows.map((r) => [r.key, r.value]));

  // 기본 키를 먼저, 그 뒤에 사용자가 추가한 키
  const keys = [
    ...Object.keys(CONFIG_DEFAULTS),
    ...rows.map((r) => r.key).filter((k) => !(k in CONFIG_DEFAULTS)),
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">사이트 설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          계층 명칭을 바꾸면 공개 대시보드와 관리자 화면의 용어가 한 번에 바뀝니다. 나중에 자체 환경계획 지표로 전환할 때
          여기만 수정하면 됩니다.
        </p>
      </div>
      <ConfigEditor
        items={keys.map((k) => ({
          key: k,
          value: existing.get(k) ?? CONFIG_DEFAULTS[k] ?? "",
          description: DESCRIPTIONS[k] ?? "",
          isCustom: !(k in CONFIG_DEFAULTS),
        }))}
      />
    </div>
  );
}
