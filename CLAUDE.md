# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

환경계획 통합 모니터링 대시보드 — 공개 대시보드 + 이행과제 트래커 + 관리자 CRUD를 한 Next.js 앱에 합친 구조.
**모니터링 영역(Track) 3개**(계획이행 / 환경상태 / 환경체감)로 나뉘며, 영역은 DB에서 오므로 추가하면 메뉴도 늘어난다.
자세한 배경은 `REQUIREMENTS.md`(복원용 명세), `PLAN.md`(설계 결정 기록), `README.md`(실행 안내) 참고.

## Commands

```bash
npm run dev                 # 개발 서버 (기본 3000, PORT=8006 npm run dev 로 포트 지정)
npm run build && npm start  # 운영 빌드·실행
npm run lint                # eslint
npx tsc --noEmit            # 타입체크 (빌드 전 빠른 확인용)

npm run db:push             # prisma/schema.prisma → SQLite 반영
npm run db:seed             # sheets/*.csv → DB (기존 데이터 전부 삭제 후 재주입)
npm run db:studio           # Prisma Studio
```

**dev 서버를 켜둔 채 `npm run build`를 실행하지 말 것.** 둘 다 `.next`를 쓰기 때문에 실행 중인 dev 서버가
`MODULE_NOT_FOUND` / `Cannot read properties of undefined (reading '/_app')`로 깨진다. 그렇게 됐으면
`rm -rf .next` 후 재시작.

**자동화된 테스트 스위트가 없다.** 검증은 서버를 띄운 뒤 렌더된 HTML에서 `<form>`의 `$ACTION_*` 히든 필드를
추출해 그대로 재전송하는 방식으로 했다. 수용 기준 20개 항목은 `REQUIREMENTS.md` 14장에 있다.
서버 액션은 `useActionState` 시그니처(`(prevState, formData)`)라 히든 필드 없이 POST하면
`fd.get is not a function`이 난다.

### Node 버전

Node 20+ 권장. Node 18에서는 Tailwind v4 네이티브 모듈(`@tailwindcss/oxide`)이 engines 불일치로
조용히 건너뛰어져 빌드 시 `Cannot find native binding`이 난다 → `npm run fix:node18` 한 번 실행.
플랫폼 전용 패키지는 반드시 `optionalDependencies`에 둘 것(`dependencies`에 넣으면 다른 OS에서
`npm install` 자체가 실패).

## Architecture

### 프레임워크 중립성 — 이 저장소의 최우선 제약

**코드에 K-SDGs를 하드코딩하지 않는다.** 이 앱은 나중에 자체 환경계획 지표로 교체될 예정이고,
그 전환이 "관리자에서 내용만 갈아끼우기"로 끝나야 한다.

금지: 영역/목표/지표 개수 상수, `13`·`G13`·`"state"` 같은 값이 로직에 등장, "모니터링 영역"·"목표"·
"세부목표"·"지표"라는 **단어를 화면에 직접 쓰는 것**. 계층 명칭은 `Config` 테이블의
`level0_label`~`level3_label`에서 주입한다 (`getConfig()` → `config.level3_label`).

**영역 코드를 코드에 넣지 말 것.** `/plan`·`/state`·`/perception`은 전부 DB의 `Track.code`에서 온다.
메뉴, 라우팅(`[track]` 동적 세그먼트), 영역별 필터가 모두 여기에 의존한다.

이 제약 때문에 파생되는 것들:
- 그리드는 고정 열 수가 아니라 `grid-cols-[repeat(auto-fit,minmax(NNNpx,1fr))]` — 항목이 몇 개든 한 줄을 채운다
- 목표색은 지정 안 하면 팔레트에서 순서대로 자동 배정 (`goalColor(color, index)`)
- 연도 범위는 코드가 아니라 데이터의 min/max에서 도출
- 정렬은 `order` 우선, 없으면 `code` 자연정렬

기능을 추가할 때 "목표가 4개, 6개로 늘어도 그대로 동작하는가"를 항상 확인할 것.

### 데이터 흐름

```
Prisma (SQLite)
  └─ lib/data.ts  getDashboard(includeUnpublished)
       ├─ Track ⊃ Goal ⊃ Target ⊃ Indicator ⊃ IndicatorValue 를 한 번에 조회
       ├─ 각 Indicator 에 compute() 결과를 붙임 (lib/progress.ts)
       ├─ 목표색·톤을 지표까지 평탄화해 내려줌 (color, tone, goalName, targetCode …)
       ├─ 이행과제는 goal→track 을 되짚어 각 Track.actions 에 배분
       └─ DashTrack / DashGoal / DashIndicator / DashAction / config 반환
  └─ findTrack(dashboard, code) 로 URL 의 영역 코드를 해석 (없으면 notFound())
  └─ 서버 컴포넌트가 받아 클라이언트 컴포넌트에 props 로 전달
```

`getDashboard(true)`는 임시저장(`published=false`) 항목까지 포함한다. 관리자 화면과 `/admin/preview`만
`true`를 쓰고, 공개 화면은 기본값(`false`).

`DashIndicator`는 상위 계층 정보(trackCode·goalName·targetCode·color·tone)를 **평탄화해서** 들고 있다.
필터·카드에서 매번 조인을 되짚지 않기 위한 의도이므로 유지할 것.

### 달성도 계산 — `src/lib/progress.ts` 한 곳에서만

```
진행률(%)     = (최신값 − 기준값) ÷ (목표값 − 기준값) × 100
기대진행률(%) = (최신 데이터 연도 − 기준연도) ÷ (목표연도 − 기준연도) × 100
```

- 분모의 부호가 증감 방향을 자동 흡수하므로 `direction`(up/down)은 **계산에 쓰지 않는다**.
  추세 화살표 색과 안내 문구에만 쓴다.
- 기대진행률은 **현재연도가 아니라 최신 데이터 연도** 기준. 통계 공표가 1~2년 늦는 지표를
  현재연도 기대치와 비교하면 정상 지표까지 전부 「지연」으로 찍힌다. 이 규칙을 바꾸지 말 것.
- 상태 6종(달성/순조/지연/악화/모니터링/자료없음)과 색은 `STATUS_META`에 있다.
  상태색은 전 화면에서 동일 의미로만 쓰고 변주하지 않는다.

### 색상 2층 구조 — `src/lib/colors.ts`

- **목표색(다양성)**: 색 하나를 HSL로 분해해 `tint`/`border`/`text`/`deep`/투명도 3단계를 파생.
  헤더 그라디언트·카드 액센트 바·도넛·차트·필터 칩에 전파된다.
- **상태색(일관성)**: `STATUS_META`. 절대 변주 금지.

`Tones`는 **전부 문자열이어야 한다.** 함수(`alpha(a) => string` 같은)를 넣으면 서버 컴포넌트에서
클라이언트 컴포넌트로 props 전달이 불가능해진다.

### 쓰기 경로 — 서버 액션

모든 변경은 `src/lib/admin-actions.ts`의 서버 액션을 거친다. 새 액션을 추가할 때 지킬 패턴:

1. `await requireAdmin()` — 화면 보호(admin layout)만으로는 부족하다
2. 작업 수행
3. `await log(action, entity, id, label, detail)` — AuditLog 필수
4. `refresh()` (= `revalidatePath("/", "layout")`)
5. `return { ok, message }` (`ActionResult`), 예외는 `fail(e)`로 감싸 사람이 읽을 메시지로 변환
   (Prisma unique 위반 → "이미 같은 번호가 존재합니다")

`redirect()`는 예외로 동작하므로 `catch`에서 `NEXT_REDIRECT` digest를 확인해 다시 throw해야 한다
(`saveIndicator` 참고).

폼 쪽은 `src/components/admin/form.tsx`의 `AdminForm`(useActionState + 토스트) /
`SubmitButton`(useFormStatus) / `DeleteButton`(확인창) / `Field` / `SelectField` / `CheckField`를 재사용한다.

### CSV 왕복

`src/lib/csv.ts`의 `CSV_HEADERS`가 내보내기 스키마이고, `admin-actions.ts`의 `importCsv`가 같은 컬럼명을
읽는다. **한쪽만 바꾸면 왕복이 깨진다.** 내보낸 파일을 그대로 다시 올릴 수 있어야 한다.

가져오기는 고유번호(`track_id`/`goal_id`/`target_id`/`indicator_id`/`action_id`) 기준 upsert이고, 탭 구분(TSV)을
자동 감지하며, 행 단위 실패는 전체를 중단하지 않고 몇 행에서 왜 실패했는지 메시지에 담는다.

### 라우팅

- `(public)` 라우트 그룹
  - `/` — 영역 전체를 비교하는 통합 현황
  - `/[track]` — 영역 개요, `/[track]/indicators`·`/actions`·`/data`
  - 공용 헤더·푸터는 그룹 layout, 영역 내 하위 메뉴는 `[track]/layout.tsx`
  - **이행과제가 0건인 영역은 하위 메뉴에서 이행과제 탭이 빠진다** (환경상태·환경체감처럼 관측·조사만 하는 영역)
- `/admin/*` — layout에서 `isAdmin()` 검사 후 미인증이면 `/login`으로 리다이렉트.
- 모든 페이지가 `export const dynamic = "force-dynamic"` (DB 조회가 매 요청마다 필요).
- 딥링크: `/[track]/indicators?goal=<id>` (필터), `?indicator=<id>` (상세 드로어 자동 열림).
- CSV 내보내기는 `?track=<code>`로 영역별 필터가 가능하다 (`exportCsv(type, trackCode)`).

### 인증 — `src/lib/auth.ts`

공용 비밀번호 1개 + HMAC-SHA256 서명 쿠키(httpOnly, 12시간). 계정 개념이 없으므로 추적성은
AuditLog가 담당한다. 비밀번호 비교는 `timingSafeEqual`.

## 알아둘 함정

- **Base UI Button**: `<Button render={<Link/>}>`처럼 버튼이 아닌 것을 렌더하면 `nativeButton={false}`가
  필요하다. 진짜 제출 버튼에는 붙이면 안 된다.
- **shadcn/ui v4는 Base UI 기반**(Radix 아님). Select/Tabs/Accordion API가 다르므로, 필터 등은
  네이티브 `<select>`와 직접 만든 컴포넌트를 쓰고 있다. 새 shadcn 컴포넌트를 추가하기 전에
  `src/components/ui/`의 기존 파일에서 실제 prop 시그니처를 확인할 것.
  (Node 18에서 `npx shadcn@latest`는 `File is not defined`로 죽는다 — `node:buffer`의 `File`/`Blob`을
  전역 주입하는 preload를 `NODE_OPTIONS="--require ..."`로 넘기면 우회된다.)
- **App Router `page.tsx`에서 named export 금지** — Next 타입 검증이 거부한다. 공용 컴포넌트는 별도 파일로.
- **Recharts는 지연 로딩**(`src/components/trend-chart-lazy.tsx`). 직접 `trend-chart`를 import하면
  첫 로딩 번들이 100KB 이상 커진다.
- **Base UI 다이얼로그는 포털**이라 서버 HTML에 드로어 내용이 없다. 하이드레이션 직후 열리는 것이 정상.
- **React SSR 텍스트 보간**은 `부문<!-- -->별 현황`처럼 주석이 낀다. HTML 문자열을 검사할 땐 먼저 제거.
- **`prisma db push --force-reset`은 차단되어 있다.** `db:seed`가 스스로 전체 삭제 후 재주입하므로
  그것만으로 충분하다.

## 데이터 주의

`sheets/*.csv`와 시드 DB의 수치는 **형식 예시**이며 실제 공식 통계와 다르다. 대외 공개 전 소관 부서
검수가 필요하다는 경고를 제거하지 말 것 (`footer_note`, README, `sheets/README.md`).

값 없음은 빈 칸으로 둔다 — `0`은 "실제로 0"이라는 뜻이다.
