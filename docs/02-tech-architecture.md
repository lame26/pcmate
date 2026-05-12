# 기술 아키텍처 설계

## 기술 스택

MVP 기준 스택:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- localStorage
- Next.js Route Handler
- 브라우저 DOM 캡처 기반 이미지 저장

권장 패키지:

- `zustand`: 전역 빌드 상태 관리
- `zod`: 입력, 파싱 결과, API 응답 검증
- `lucide-react`: 아이콘
- `html-to-image` 또는 `modern-screenshot`: 최종 견적 이미지 저장
- `clsx`, `tailwind-merge`: 클래스 조합

크롤러 관련 패키지는 선택한 GitHub 오픈소스 크롤러의 방식에 맞춰 결정한다.
브라우저 자동화가 필요하면 서버리스 배포 제약을 별도로 검토한다.

## 런타임 구조

클라이언트:
- 입력 화면
- 상태 저장
- 추천 결과 표시
- 가격 텍스트 파싱 일부
- 최종 견적 이미지 저장

서버 Route Handler:
- 다나와 pcode 기반 가격 조회
- 크롤러 어댑터 호출
- 요청 제한과 캐시 정책 적용

MVP 저장소:
- 사용자 상태: localStorage
- 정적 데이터: `/data/*.ts`
- 크롤러 캐시: MVP에서는 파일/메모리 캐시보다 localStorage 가격 스냅샷과 서버 응답 캐시를 우선한다.

운영 배포 시 주의:
- 서버리스 환경에서는 메모리 캐시가 영속적이지 않다.
- 크롤링이 불안정하면 수동 입력과 붙여넣기 가격으로 fallback해야 한다.

## 폴더 구조

```text
/app
  /page.tsx
  /spec/page.tsx
  /cards/page.tsx
  /games/page.tsx
  /usage/page.tsx
  /preferences/page.tsx
  /diagnosis/page.tsx
  /pricing/page.tsx
  /builder/page.tsx
  /summary/page.tsx
  /api
    /prices
      /danawa/route.ts
    /spec
      /parse/route.ts

/components
  /layout
  /cards
  /spec
  /games
  /usage
  /preferences
  /diagnosis
  /pricing
  /builder
  /summary
  /ui

/data
  cards.ts
  games.ts
  parts.ts
  brand-lines.ts
  benefit-rules.ts
  sample-builds.ts
  score-rules.ts

/lib
  /compatibility
    check.ts
    rules.ts
  /crawler
    danawa-adapter.ts
    cache.ts
    rate-limit.ts
  /diagnosis
    requirements.ts
    summarize.ts
  /pricing
    benefit.ts
    confidence.ts
    danawa-parser.ts
    price.ts
  /recommendation
    candidates.ts
    score.ts
    reasons.ts
  /spec
    powershell-json.ts
    powershell-text.ts
    requirement-parser.ts
  /storage
    build-store.ts
    local-storage.ts
  /utils
    format.ts
    ids.ts

/stores
  build-store.ts

/types
  build.ts
  cards.ts
  diagnosis.ts
  games.ts
  parts.ts
  pricing.ts
  spec.ts
```

## 상태 관리

Zustand store 하나를 MVP 기본으로 둔다.
도메인이 커지면 slice 형태로 분리한다.

상태 영역:
- `profile`: 빌드 모드, 예산
- `cards`: 보유 카드
- `currentSpec`: 현재 PC
- `usage`: 게임, 작업, 모니터, 선호도
- `pricing`: 가격 스냅샷, 수동 입력, 크롤링 결과
- `diagnosis`: 산출된 요구치
- `builder`: 후보와 선택 부품
- `summary`: 최종 견적

저장 정책:
- 입력 변경 시 debounce 후 localStorage 저장
- 스키마 버전을 함께 저장
- 스키마 버전이 다르면 migration 또는 초기화

## API Route 설계

### `POST /api/spec/parse`

목적:
- PowerShell 일반 텍스트 또는 JSON 결과를 `CurrentPcSpec`로 정규화한다.

입력:

```ts
type ParseSpecRequest = {
  format: "json" | "text" | "auto";
  raw: string;
};
```

출력:

```ts
type ParseSpecResponse = {
  spec: Partial<CurrentPcSpec>;
  confidence: Confidence;
  warnings: string[];
};
```

### `POST /api/prices/danawa`

목적:
- pcode 또는 검색어 기반 가격 조회를 수행한다.

입력:

```ts
type DanawaPriceRequest = {
  pcode?: string;
  searchQuery?: string;
  category?: PartCategory;
  forceRefresh?: boolean;
};
```

출력:

```ts
type DanawaPriceResponse = {
  snapshot: PriceSnapshot;
  fromCache: boolean;
  warnings: string[];
};
```

정책:
- 같은 pcode는 6시간 이내 재요청 금지
- `forceRefresh`가 true여도 제한 시간 내에는 캐시 우선
- 실패 시 캐시 또는 빈 스냅샷 반환

## 클라이언트 라우팅

각 페이지는 독립 저장이 가능해야 한다.
사용자가 새로고침해도 이전 입력을 복구한다.

권장 네비게이션:

```text
/ -> /cards -> /spec -> /games -> /usage -> /preferences -> /diagnosis -> /pricing -> /builder -> /summary
```

## 오류 처리

오류는 세 등급으로 나눈다.

- `info`: 참고 정보
- `warning`: 추천 품질에 영향
- `critical`: 선택 불가 또는 호환 불가

크롤링, 파싱, 가격 신뢰도 오류는 `critical`로 올리지 않는다.
호환성 불가만 `critical`로 처리한다.
