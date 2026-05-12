# MVP 구현 계획

## 개발 순서

### 1. 프로젝트 스캐폴딩

작업:
- Next.js App Router 프로젝트 생성
- TypeScript, Tailwind CSS, shadcn/ui 설정
- 기본 레이아웃과 라우팅 생성
- Zustand와 localStorage 저장소 준비

완료 기준:
- 모든 MVP 페이지 경로가 열림
- 기본 네비게이션 가능
- localStorage 저장/복구 동작

### 2. 공통 타입과 정적 데이터

작업:
- `/types` 타입 작성
- `/data/cards.ts`
- `/data/games.ts`
- `/data/parts.ts`
- `/data/brand-lines.ts`
- `/data/score-rules.ts`

완료 기준:
- 샘플 게임 30개 이상
- 샘플 부품이 카테고리별 3개 이상
- 타입 에러 없음

### 3. 입력 플로우

작업:
- 카드 선택
- 현재 사양 수동 입력
- PowerShell JSON/텍스트 파싱
- 게임 선택
- 작업/멀티태스킹 선택
- 모니터/VR 선택
- 예산/선호도 입력

완료 기준:
- 입력값이 store와 localStorage에 저장됨
- 새로고침 후 복구됨
- 파싱 실패 warning 표시

### 4. 진단 엔진

작업:
- 게임 요구치 산출
- 작업/RAM/VRAM 가중치
- 모니터/주사율 가중치
- `RequirementProfile` 생성
- 사양 판독 화면

완료 기준:
- 선택 조건에 따라 CPU/GPU/RAM/PSU 요구치가 변함
- reason과 warning이 표시됨

### 5. 가격 모듈

작업:
- 다나와 텍스트 파서
- URL/pcode 추출
- 수동 가격 입력
- `PriceSnapshot` 저장
- 가격 신뢰도 계산

완료 기준:
- 붙여넣기 예시에서 offer 생성
- warning과 confidence 표시
- 후보 가격에 연결 가능

### 6. 크롤러 어댑터

작업:
- 사용할 GitHub 오픈소스 크롤러 조사
- 라이선스와 요청 제한 확인
- `PriceCrawler` 인터페이스 구현
- API Route 연결
- 6시간 캐시와 실패 fallback 구현

완료 기준:
- pcode 입력 시 snapshot 반환
- 실패해도 앱이 중단되지 않음
- 캐시 사용 여부 표시

### 7. 추천 엔진

작업:
- 카테고리별 후보 생성
- 카드 혜택가 계산
- 호환성 체크
- 점수 계산
- budget/recommended/premium 후보 선정
- reason 생성

완료 기준:
- 각 단계에서 후보 3개 표시
- 점수와 추천 이유 표시
- critical 호환성 오류 표시

### 8. 단계별 빌더

작업:
- 단계 진행 UI
- 후보 카드
- 현재 선택 견적 요약
- 선택/되돌아가기
- 선택에 따른 다음 후보 재계산

완료 기준:
- CPU부터 케이스까지 선택 가능
- 최종 견적으로 이동 가능

### 9. 최종 견적

작업:
- 가격 요약
- 카드별 결제 요약
- warning 목록
- 텍스트 복사
- 이미지 저장

완료 기준:
- 최종 견적표가 화면에 표시됨
- 클립보드 복사 가능
- PNG 이미지 저장 가능

### 10. 검증과 마감

작업:
- 모바일 기본 반응형 확인
- 빈 데이터/파싱 실패/가격 없음 상태 확인
- 타입 체크
- lint
- 빌드

완료 기준:
- `npm run build` 성공
- 주요 플로우 수동 테스트 통과

## 작업 단위별 Codex CLI 프롬프트 초안

### 스캐폴딩

```text
docs/mvp-decisions.md와 docs/02-tech-architecture.md 기준으로 Next.js App Router, TypeScript, Tailwind, shadcn/ui, Zustand 프로젝트 뼈대를 구성해줘. MVP 페이지 라우팅과 기본 레이아웃, localStorage store까지 구현해줘.
```

### 타입과 데이터

```text
docs/03-data-model.md 기준으로 /types와 /data 파일을 작성해줘. 게임은 최소 30개, 부품은 카테고리별 샘플 3개 이상 포함하고, Supabase 이전을 고려한 id/source/updatedAt/confidence 필드를 모두 채워줘.
```

### 입력 플로우

```text
docs/01-product-flow.md와 docs/04-feature-design.md 기준으로 카드, 현재 사양, 게임, 작업, 모니터, 선호도 입력 화면을 구현해줘. 모든 입력은 Zustand store와 localStorage에 저장되게 해줘.
```

### PowerShell 파서

```text
docs/04-feature-design.md 기준으로 PowerShell JSON/텍스트 결과를 CurrentPcSpec으로 파싱하는 모듈과 /api/spec/parse Route Handler를 구현해줘. 파싱 confidence와 warnings를 반환하게 해줘.
```

### 진단 엔진

```text
docs/05-recommendation-pricing.md 기준으로 게임/작업/모니터 조건에서 RequirementProfile을 산출하는 진단 엔진을 구현해줘. 결과 화면에는 요구 CPU/GPU/RAM/PSU 티어와 reason, warning을 표시해줘.
```

### 가격 모듈

```text
docs/04-feature-design.md와 docs/05-recommendation-pricing.md 기준으로 다나와 텍스트 붙여넣기 파서, pcode 추출기, 수동 가격 입력, PriceSnapshot 저장, 가격 신뢰도 계산을 구현해줘.
```

### 크롤러 어댑터

```text
GitHub 오픈소스 다나와 크롤러 후보를 조사하고, 라이선스/요청제한/캐시/robots.txt 준수 여부를 비교해줘. 선택한 방식으로 docs/05-recommendation-pricing.md의 PriceCrawler 인터페이스와 /api/prices/danawa Route Handler를 구현해줘.
```

### 추천 엔진

```text
docs/05-recommendation-pricing.md 기준으로 후보 생성, 카드 혜택가 계산, 호환성 체크, 점수 계산, budget/recommended/premium 선정 로직을 구현해줘. 각 후보에는 점수와 reason, warning을 포함해줘.
```

### 빌더와 최종 견적

```text
docs/01-product-flow.md 기준으로 단계별 빌더와 최종 견적 화면을 구현해줘. CPU부터 케이스까지 후보를 선택하고, 최종 견적에서 일반가/혜택가/절감액/카드별 요약/주의사항을 보여줘. 텍스트 복사와 이미지 저장도 포함해줘.
```

## 테스트 기준

필수 수동 테스트:
- 새 견적 시작 후 마지막 견적까지 완료
- 새로고침 후 입력 복구
- 가격 데이터가 없어도 후보 표시
- 크롤러 실패 시 fallback 표시
- 호환 불가 후보 warning 표시
- 모바일 폭에서 주요 입력 가능

자동 테스트 우선순위:
- 가격 파서
- PowerShell 파서
- 추천 점수 계산
- 호환성 체크
- 카드 혜택가 계산
