# 작업 트리거와 히스토리

이 문서는 새 세션이 시작되었을 때 프로젝트 맥락을 빠르게 복구하고, 작업 종료 시 반드시 갱신해야 할 기준을 정의한다.

## 새 세션 시작 규칙

새 작업을 시작하면 먼저 이 문서를 읽는다.

그 다음 아래 순서로 문서를 확인한다.

1. `docs/mvp-decisions.md`
2. `docs/00-index.md`
3. 현재 작업과 직접 관련된 상세설계 문서
4. UI 구현 작업이면 `docs/07-ui-ux-guidelines.md`
5. `README.md`

문서 확인 후 다음을 파악한다.

- 현재 MVP 범위
- 최근 완료 작업
- 진행 중이던 작업
- 보류된 결정사항
- 다음으로 이어갈 작업

## 작업 종료 규칙

작업이 끝나면 이 문서의 `현재 상태`, `최근 작업 히스토리`, `보존 기록`을 필요한 만큼 갱신한다.

갱신 대상:
- 완료한 작업
- 수정 또는 추가한 주요 파일
- 다음 작업자가 이어가야 할 내용
- 남은 리스크 또는 보류사항
- 실행한 검증 명령과 결과

코드나 문서를 변경했는데 이 문서를 갱신하지 않으면 작업이 끝난 것으로 보지 않는다.

## 히스토리 관리 규칙

`최근 작업 히스토리`는 최근 5개 항목만 유지한다.

오래된 일반 작업 기록은 삭제하거나, 후속 작업에 계속 영향을 주는 내용만 `보존 기록`으로 이동한다.

최근 작업 히스토리에 남길 것:
- 최근 완료 작업
- 다음 작업에 바로 영향이 있는 변경
- 아직 검증이 덜 된 작업
- 사용자가 방금 결정한 사항

보존 기록에 남길 것:
- 중요한 제품/기술 의사결정
- 복잡한 문제 해결 과정과 결론
- 재발 가능성이 있는 오류와 해결 방법
- 외부 API, 크롤링, 라이선스, 배포 제약 관련 판단
- 후속 작업자가 반드시 알아야 하는 주의사항

삭제해도 되는 것:
- 단순 오타 수정
- 작은 문서 정리
- 이미 다른 설계 문서에 반영된 반복 설명
- 현재 상태와 무관한 오래된 진행 로그

## 문서 구조

현재 문서 구조:

- `README.md`: 초기 제품 설계안과 상세설계서 작성 요구사항
- `docs/work-trigger.md`: 새 세션 시작 기준과 작업 히스토리
- `docs/mvp-decisions.md`: 확정된 MVP 의사결정
- `docs/00-index.md`: 상세설계 문서 인덱스
- `docs/01-product-flow.md`: 사용자 플로우와 화면 구성
- `docs/02-tech-architecture.md`: 기술 스택, 폴더 구조, API 구조
- `docs/03-data-model.md`: 타입과 데이터 구조
- `docs/04-feature-design.md`: 기능별 상세 설계
- `docs/05-recommendation-pricing.md`: 추천, 가격, 호환성 로직
- `docs/06-implementation-plan.md`: MVP 개발 순서와 작업 프롬프트
- `docs/07-ui-ux-guidelines.md`: 상업용 MVP UI/UX 기준과 검수 체크리스트
- `docs/08-market-research-ui.md`: PC 견적 서비스 시장조사와 UI 차별화 시사점
- `docs/09-ui-benchmark-report.md`: 벤치마킹 대상 서비스와 화면별 적용/제외 기준

## 현재 상태

프로젝트는 스캐폴딩이 완료된 초기 구현 단계다.

완료:
- 초기 README 설계안 검토
- MVP 의사결정 확정
- `docs/mvp-decisions.md` 작성
- 상세설계 문서 세트 작성
- README 상단에 문서 기준 안내 추가
- 작업 트리거 문서 작성
- `docs/07-ui-ux-guidelines.md` UI/UX 기준 문서 작성
- `docs/00-index.md`에 UI/UX 기준 문서 연결
- `docs/07-ui-ux-guidelines.md` 검토
- 작업 히스토리를 최근 작업과 보존 기록으로 분리
- `docs/07-ui-ux-guidelines.md`의 미확정 UI/UX 항목을 MVP 기준으로 확정
- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui 스캐폴딩 완료
- MVP 기본 페이지 라우트와 API placeholder 추가
- Zustand/localStorage store 뼈대 추가
- 공통 타입과 정적 데이터 상세 구현
- 카드, 현재 사양, 게임, 작업/모니터, 예산/선호도 입력 플로우 구현
- UI 시장조사 문서와 벤치마킹 보고서 작성
- PowerShell JSON/텍스트 파서와 `/api/spec/parse` 실제 구현
- 현재 사양 입력 화면에 PowerShell 붙여넣기 파싱 UI 연결
- 현재 사양 입력 화면에 PowerShell 실행/붙여넣기 가이드 추가
- 게임/작업/모니터 조건 기반 `RequirementProfile` 진단 엔진 구현
- 사양 판독 결과 화면 구현
- 게임 선택 목록 UI 압축과 사양 상세 문구 제거
- 가격 스냅샷 상태 저장, 다나와 텍스트 파서, 수동 가격 입력, pcode placeholder API 구현
- 가격 수집 화면 구현
- 배틀그라운드 등 `high` 게임이 일반 조건에서 GPU 10/10으로 튀지 않도록 진단 로직 튜닝
- `sammy310/Danawa-Crawler` 공개 CSV 기반 다나와 자동 가격 어댑터 구현
- `/api/prices/danawa`를 상품명 또는 pcode 자동 조회로 연결
- 정적 부품 데이터 기반 추천 후보 생성/점수 계산/호환성 체크 구현
- 단계별 빌더 화면 구현
- 빌더 후보 카드에서 자동 가격 조회 연결
- 최종 견적 화면 구현
- 선택 부품 가격 합계, 혜택가, 배송비, 절감액, warning 요약 구현
- 최종 견적 텍스트 복사와 PNG 이미지 저장 구현
- 전문가 검수 피드백 기반 구매 안전장치 1차 반영
- critical 호환성 실패 후보 hard block 적용
- 케이스-메인보드 폼팩터 체크와 PSU 커넥터/ATX 확인 강화
- 위험/저신뢰 가격을 자동 추천·최종 합산에서 제외
- 최종 견적 구매 상태와 조건부 예상가 문구 고정 노출
- 다나와 주요부품 카테고리 랭킹 30위 직접 크롤링 가격 어댑터 구현
- `/api/prices/danawa`를 공개 CSV 기반 조회에서 직접 랭킹 30위 조회로 전환
- 카테고리별 랭킹 30위 스냅샷을 15분 서버 캐시로 재사용하도록 변경
- 혜택최저가 결제 조건을 `danawaBenefitCondition`/`danawaBenefitRawText`로 분리
- GPU 길이/두께/권장 PSU/전원 포트, 케이스 VGA 길이/CPU쿨러 높이/지원 보드 규격 등 호환성용 스펙 구조화
- `CompatibilityIssue`/`CompatibilityResult` 기반 호환성 엔진 도입
- 호환성 판정에 evidence/source/userAction/canRecommend/canPurchase/canExport 정책 추가
- 호환성 룰을 `lib/compatibility/rules/*` 파일별 rule engine 구조로 분리
- `checkCompatibility({ selected, candidate, mode })` 컨텍스트 도입
- blocked 후보가 추천 role에 들어가지 않는 단위 테스트 추가
- 정적 샘플 가격이 자동 추천·최종 합산에 섞이지 않도록 제외
- 상품명 매칭에서 `VENTUS`, `MORTAR`, `PULSE` 같은 라인업 구분 토큰을 반영
- 빌더/최종 견적 표시명을 가격 매칭 시 다나와 상품명 우선으로 변경
- 다나와 랭킹 30위 offer를 `Part`로 정규화하는 `normalizeDanawaProductToPart` 계층 구현
- 다나와 동적 후보를 정적 seed 후보와 같은 `checkCompatibility({ selected, candidate, mode })` 경로에 연결
- 다나와 스펙에서 확인되지 않은 필드는 임의 기본값으로 채우지 않고 `undefined`로 유지하도록 `PartSpecs` optional 필드 확장
- 선택된 다나와 동적 후보가 최종 견적에서 다시 해석되도록 summary 집계에 정규화 후보 병합
- 후보 카드에 정적 추천 후보/다나와 랭킹 후보 출처, 랭킹 번호, pcode, 스펙/가격 신뢰도, 호환성 상태, needs-check 근거 표시
- `specCompleteness`와 스펙/가격 confidence를 추천 점수에 반영
- GPU 두께/슬롯 필드를 호환성 스펙에 추가하고 두께 누락 needs-check 문구를 구체화
- needs-check 최종 견적에서 구매 CTA 미제공 정책 문구와 경고 포함 복사/이미지 저장 버튼 문구 표시
- 다나와 파서 PSU/메인보드/쿨러 엣지케이스 테스트 추가
- 메인보드 지원 CPU 세대, BIOS 확인 메모, 쿨러 쿨링 용량, 파워 ATX/커넥터/품질 정규화 보강
- CPU-보드 호환성을 소켓뿐 아니라 CPU series와 보드 supportedCpuSeries 기준으로 판정
- CPU 세대 지원 확정, BIOS 확인 필요, 세대 미지원 blocked 테스트 추가
- 다나와 소스 타입을 `danawa-ranking`과 `danawa-csv-price`로 분리
- CSV 기반 가격 스냅샷은 Part 후보로 정규화하지 않고 기존 Part 가격 보강에만 사용하도록 차단
- RAM/SSD/PSU/GPU 가격 이상치 필터 유틸 추가 및 추천/최종 견적 가격 선택에 적용
- 조합 단위 추천 assembly 순수 함수 추가
- RTX 5080급 고성능 GPU anchor rule과 360 수랭/케이스 라디에이터 조합 제외 테스트 추가
- Part-Offer strict matcher 추가 및 candidates/summary 가격 선택에 적용
- 후보 카드와 최종 견적 대표명을 항상 `Part.name`으로 고정
- `Offer.productName`은 가격 매칭 상품명 보조 정보로만 표시
- 후보 카드와 최종 견적에 카테고리별 핵심 스펙 배지 표시
- 빌더에 `자동 추천 견적 생성` 버튼을 추가해 assembly 경로를 실제 선택 플로우에 연결
- Part-Offer strict matcher에 다나와 한글/영문 브랜드·라인업 alias와 RAM/폼팩터/커넥터 표기 정규화 추가
- alias match는 카테고리별 핵심 스펙이 확인되고 충돌이 없을 때만 통과하도록 유지
- RAM/PSU/GPU 등 핵심 스펙 배지의 읽기 쉬운 표기 보강
- 빌더 최종 견적 CTA를 필수 부품 선택 완료와 최종 호환성 상태 기준으로 제어
- 빌더 전역 하단 `최종 견적 보기` 링크를 제거하고 내부 상태 기반 CTA로 대체
- 후보 로딩 중 이전 후보를 표시하지 않고 skeleton/loading/error/empty 상태를 분리
- 최종 견적 화면에서 필수 부품 누락 시 복사/이미지 저장을 막고 남은 부품 안내 표시
- 빌더 후보 카드와 최종 견적 화면에 재사용 가능한 행 단위 호환성 상세 패널 추가
- `CompatibilityIssue`의 severity/status/evidence/source/userAction과 `CompatibilityResult`의 canRecommend/canPurchase/canExport 정책 표시
- 후보 카드와 최종 견적 화면에서 일반가, 내 혜택가, 타 카드/조건부 혜택가, 배송비, 혜택 조건을 분리 표시
- `PriceOffer` 기반 가격 표시 helper를 추가해 보유 카드와 일치하는 혜택만 합계 반영가로 강조
- Design/UX QA must-fix 기준으로 빌더 후보 카드의 호환성 상세를 compact 기본 접힘 상태로 정리
- 최종 견적 화면에서 필수 부품 미선택 상태를 primary 상태로 표시하고 복사/이미지 저장 disabled 문구를 명확화
- 최종 견적 화면의 호환성 상세를 가격/선택 부품 아래의 접힌 패널로 이동
- 후보 카드와 가격 breakdown의 가격 라벨을 `이 후보 반영가`, `일반가(배송비 제외)`, `반영가` 중심으로 정리
- 추천 후보 role 배정이 절대 최저가/최고 티어를 섞던 문제를 category-aware 정책으로 보정
- CPU/GPU/SSD/PSU/RAM/쿨러 후보를 요구치 주변 band, 최소 용량/와트, 가격 존재 여부 기준으로 선별
- Ryzen 5600급+9850X3D급, RTX 5060급+5090급, 240GB SSD, 500W+1200W PSU 같은 비정상 조합 회귀 테스트 추가
- FHD/PUBG 비enthusiast 요구치에서 RTX 5090급 GPU와 9850X3D급 halo CPU가 기본 premium 후보로 나오지 않도록 추가 제한
- RAM/SSD 추천 후보에서는 안전한 정적 seed 가격을 다나와 매칭 부재 시 표시/정렬 fallback으로만 사용
- GPU 선택 전 케이스 추천에서 요구 GPU tier 기반 목표 GPU 길이를 적용하고, CPU core/thread 파서의 불가능한 thread count 보강
- 16GB VRAM만으로 RTX 5090급 halo GPU가 열리지 않도록 GPU premium cap 조건을 추가 보정
- Zustand/localStorage persist hydrate 완료 전에는 게임/작업/진단/빌더/요약 화면이 빈 기본값으로 계산하지 않도록 hydrate guard 추가
- Next.js dev server에서 `127.0.0.1:3022` 접속 시 HMR/dev resource가 cross-origin으로 막히지 않도록 `allowedDevOrigins` 설정 추가

진행 예정:
- 벤치마킹 보고서의 화면별 체크리스트를 이후 UI 구현 완료 기준에 반영
- 확정된 UI 방향을 이후 화면 설계와 구현 프롬프트에 반영
- 전문가 검수 잔여 항목 반영: 게임 프로필 세분화, 부품 데이터 확장, 예산 최적화, 업그레이드 입력 강화
- CPU-보드 BIOS/세대 지원 데이터를 제조사 support list 또는 별도 정규 DB로 고도화
- 메인보드/쿨러/파워 상세 페이지 기반 보강 여부 결정
- 실제 다나와 snapshot 로그를 수집해 strict matcher alias와 parser를 점진적으로 보강
- 카드형 설문 UX 전체 개편은 별도 작업으로 진행
- 후보 가로 스크롤/더 많은 후보 노출은 별도 작업으로 진행
- 모바일 sticky next-step CTA와 데스크톱 sticky summary/CTA rail은 별도 Design/UX follow-up으로 남겨둔다.

보류:
- 직접 다나와 페이지 크롤링은 MVP에 구현했지만, 공개/상업 배포 전 robots.txt, 이용약관, 요청 제한, 캐시 정책 검토가 필요
- 브랜드 네이밍, 로고, 실제 컬러 팔레트 확정

## 최근 작업 히스토리

최근 5개 항목만 유지한다.

### 2026-05-12 입력 상태 hydrate 및 dev origin 보정

문제:
- 게임이나 작업 조건을 선택한 뒤 다음 화면으로 이동해도 판독/빌더가 선택값을 반영하지 않는 증상이 있었다.
- 원인은 두 갈래였다. 첫째, persisted Zustand store가 hydrate되기 전 진단/추천 화면이 빈 기본값으로 먼저 계산할 수 있었다.
- 둘째, dev 서버를 `127.0.0.1:3022`로 열면 Next.js dev resource/HMR이 cross-origin으로 차단되어 React 이벤트가 붙지 않을 수 있었다. 이 경우 체크박스는 브라우저 기본 동작으로 체크된 것처럼 보여도 Zustand 업데이트가 실행되지 않는다.

작업:
- `stores/build-store.ts`에 `hasHydrated`, `setHasHydrated`, `useBuildStoreHasHydrated()`를 추가했다.
- persist 저장 대상에서 `hasHydrated`와 action을 제외하고, rehydrate 완료 후에만 저장값 기반 화면을 렌더하도록 했다.
- 게임/작업 입력, 사양 판독, 빌더, 최종 견적 화면에서 hydrate 전 기본값 계산과 가격 후보 조회를 막았다.
- `next.config.ts`에 `allowedDevOrigins: ["127.0.0.1"]`를 추가해 `localhost`와 `127.0.0.1` 양쪽 dev 접속을 허용했다.
- 3022 dev server를 Next 기본 dev server로 재시작했다. 현재 테스트용 URL은 `http://localhost:3022`이며, `http://127.0.0.1:3022`도 허용된다.

주요 파일:
- `stores/build-store.ts`
- `components/forms/games-form.tsx`
- `components/forms/usage-form.tsx`
- `components/diagnosis/diagnosis-summary.tsx`
- `components/builder/builder-flow.tsx`
- `components/summary/summary-view.tsx`
- `next.config.ts`
- `docs/work-trigger.md`

검증:
- `pnpm test` 성공
- `pnpm lint` 성공
- `pnpm build` 성공
- `http://localhost:3022/diagnosis` HTTP 200 확인
- `http://127.0.0.1:3022/diagnosis` HTTP 200 확인
- Chrome CDP로 `127.0.0.1:3022`에서 PUBG 선택 + Docker 작업 선택 후 `/diagnosis` 이동을 검증했다. localStorage에 `selectedGames: [{ gameId: "pubg", frequency: "normal", optionTarget: "high" }]`, `workApps: ["docker"]`가 남고, 판독 결과에 CPU 8/10, GPU 8/10, RAM 32GB, PSU 750W와 배틀그라운드/개발 작업 근거가 표시됐다.

남은 한계:
- dev server는 현재 로컬 테스트 편의를 위해 열어 둔 상태다. 서버 재시작이 필요하면 `pnpm exec next dev -p 3022`를 사용한다.
- 사용자가 기존에 `127.0.0.1`과 `localhost`를 번갈아 쓴 경우 localStorage origin이 다르므로, 같은 테스트 시나리오는 같은 host로 다시 입력해야 한다.

### 2026-05-12 Halo GPU VRAM signal 정책 보정

문제:
- premium cap live verification에서 FHD 144-180Hz PUBG medium 기본 시나리오는 정상화됐지만, Cyberpunk 2077 rare/medium을 추가해 `vramGb`가 16GB가 된 인접 시나리오에서 RTX 5090이 다시 premium 후보로 나타났다.
- 원인은 `requirement.vramGb >= 16`을 halo GPU 허용 신호로 직접 취급한 것이다. 16GB VRAM은 RTX 5080/RX 9070 XT급 후보를 정당화할 수 있지만, RTX 5090급을 단독으로 정당화하기에는 너무 넓다.

작업:
- `lib/recommendation/candidates.ts`의 `allowsHaloGpu`에서 `requirement.vramGb >= 16` 조건을 제거했다.
- tier-10 GPU는 `gpuTier >= 10`, 1000W급 요구, 4K/UWQHD/VR/local AI/extreme reason text, 또는 유연한 고예산 같은 더 강한 신호가 있을 때만 policy pool에 들어갈 수 있게 유지했다.
- GPU tier 9 + VRAM 16GB + 비enthusiast 조건에서는 RX 9070 XT/RTX 5080급은 유지하고 RTX 5090은 제외하는 회귀 테스트를 추가했다.
- 4K high refresh reason text가 있는 true enthusiast 조건에서는 RTX 5090이 여전히 후보가 될 수 있음을 테스트로 고정했다.

주요 파일:
- `lib/recommendation/candidates.ts`
- `lib/recommendation/candidates.test.ts`
- `docs/work-trigger.md`

검증:
- `pnpm test lib/recommendation/candidates.test.ts` 성공
- `pnpm test` 성공
- `pnpm lint` 성공
- `pnpm build` 성공
- `git diff --check` 성공

남은 한계:
- halo GPU 허용은 여전히 `RequirementProfile`의 tier/PSU/reason text/budget 기반 추정이다. monitor/VR/local AI 원본 입력을 candidate policy가 직접 받는 구조는 아니다.
- 실제 live snapshot에서 인접 VRAM 16GB 시나리오를 다시 확인하는 수동 QA가 남아 있다.

### 2026-05-12 추천 premium cap 및 fallback 가격 보강

문제:
- category-aware 보정 후에도 FHD 144-180Hz PUBG medium, VR/로컬 AI/캡처/특수 냉각/예산/브랜드 선호 없음 조건에서 RTX 5090과 Ryzen 7 9850X3D가 premium 후보로 남았다.
- RAM/SSD는 안전한 정적 seed 가격이 있어도 다나와 매칭이 없으면 후보 카드에서 `가격 확인 필요`로 보일 수 있었다.
- GPU 선택 전 케이스 후보에 270mm급 GPU 길이 제한 케이스가 고성능 GPU 요구치보다 먼저 보일 수 있었다.
- CPU 정규화에서 `5세대` 같은 텍스트를 thread count로 잘못 읽어 8C/5T 같은 불가능한 표시가 나올 수 있었다.

작업:
- `lib/recommendation/candidates.ts`에서 비enthusiast 요구치의 CPU/GPU premium 상한을 보강했다. GPU tier 10/halo급은 4K/UWQHD, VR, 로컬 AI, extreme 텍스트, 매우 높은 요구치, 유연한 고예산 같은 신호가 있을 때만 허용한다.
- CPU는 7800X3D급 게이밍 후보는 유지하되 7950X3D/7900X3D/9950X3D/9850X3D 같은 top X3D 후보를 비enthusiast 기본 후보에서 제외한다.
- role 후보를 고를 때 budget/recommended/premium이 같은 후보로 중복 선택된 뒤 dedupe되어 카드가 줄어드는 문제를 막기 위해 각 role 선택 직후 selected map에 반영한다.
- RAM/SSD에 한해 다나와 strict match가 없을 때 안전한 정적 seed offer를 추천 후보 가격 fallback으로 사용한다. 최종 견적 합계의 정적 가격 제외 정책은 변경하지 않았다.
- 케이스 후보는 GPU 미선택 상태에서도 `requirement.gpuTier`로 목표 GPU 길이를 추정해 고성능 GPU tier에서 270mm급 케이스를 제외한다.
- `lib/parts/danawa-normalizer.ts`에서 CPU core/thread는 명시적인 core/thread 단위 텍스트에서만 추출하고, thread가 core보다 작은 불가능한 값은 버린다.

주요 파일:
- `lib/recommendation/candidates.ts`
- `lib/recommendation/candidates.test.ts`
- `lib/parts/danawa-normalizer.ts`
- `lib/parts/danawa-normalizer.test.ts`
- `docs/work-trigger.md`

검증:
- `pnpm test lib/recommendation/candidates.test.ts lib/parts/danawa-normalizer.test.ts` 성공
- `pnpm test` 성공
- `pnpm lint` 성공
- `pnpm build` 성공
- `git diff --check` 성공

남은 한계:
- enthusiast 판정은 현재 `RequirementProfile`의 tier/VRAM/RAM/PSU, budget, reason/warning 텍스트에 의존한다. monitor/VR/local AI 원본 입력을 candidate policy가 직접 받지는 않는다.
- RAM/SSD 정적 seed 가격 fallback은 추천 후보 표시/정렬용이며, 최종 견적 합계 정책은 기존처럼 별도 요약 경로가 판단한다.
- 실제 다나와 metadata 누락이 많은 snapshot에서는 후보 수가 줄어들 수 있어 parser/matcher 보강이 계속 필요하다.

### 2026-05-12 카테고리별 추천 후보 품질 보정

문제:
- 빌더 후보 role 배정이 카테고리 맥락 없이 `budget=최저가`, `recommended=최고 점수`, `premium=최고 성능 티어`로 동작했다.
- 그 결과 CPU에서 Ryzen 5600급과 9850X3D급, GPU에서 RTX 5060급과 RTX 5090급, SSD에서 240GB, PSU에서 500W와 1200W가 같은 요구치 후보로 함께 보일 수 있었다.
- 가격 없는 RAM/쿨러 후보가 가격 있는 유사 후보보다 앞에 나올 수 있었다.

작업:
- `lib/recommendation/candidates.ts`에 category-aware 후보 정책을 추가해 role 선정을 요구치 주변 band 안에서 수행하도록 바꿨다.
- CPU는 정상 full-build mid/high 요구치에서 AM4/Ryzen 5000 mainstream급을 제외하고, premium도 요구치 +1 tier 중심으로 제한했다.
- GPU는 `requirement.gpuTier`와 `requirement.vramGb` 기준으로 인접 tier와 최소 VRAM을 만족하는 후보만 role 후보로 사용한다.
- SSD는 full-build MVP 기본 최소 추천 용량을 1TB로 두어 240GB/저용량 SSD가 일반 추천 role에 들어가지 않게 했다.
- PSU는 `requirement.psuWattage`와 선택 GPU 권장 PSU를 기준으로 wattage band를 만들고, 정상 mid/high 요구치에서 1200W급 과잉 후보를 제외했다.
- RAM은 요구 용량 미만을 제외하고, 가격 있는 후보가 있으면 가격 없는 동급 후보를 role 후보에서 밀어냈다.
- 쿨러는 CPU heat class와 선호도 기준으로 360mm AIO를 제한하고, 정상 CPU 요구치에서는 공랭/적정급 후보를 우선한다.
- 가격 없는 후보에는 점수 penalty를 추가하고, 가격 있는 후보가 있으면 role 선정 pool을 가격 있는 후보로 제한했다.

주요 파일:
- `lib/recommendation/candidates.ts`
- `lib/recommendation/candidates.test.ts`
- `docs/work-trigger.md`

검증:
- `pnpm test lib/recommendation/candidates.test.ts lib/recommendation/build-assembly.test.ts` 성공
- `pnpm test` 성공
- `pnpm lint` 성공
- `pnpm build` 성공

남은 한계:
- 카테고리 정책은 현재 정적/다나와 정규화 스펙의 `gamingTier`, 용량, 와트, VRAM 추정값에 의존한다.
- 실제 다나와 랭킹 데이터에서 상품명/스펙 누락이 많으면 후보가 줄어들 수 있어 snapshot 기반 보강이 계속 필요하다.
- 사용자에게 enthusiast/broad-budget 의도를 명시적으로 받는 UX는 아직 없다.

### 2026-05-12 Design/UX must-fix UI 밀도 정리

작업:
- `components/compatibility/compatibility-details.tsx`의 compact 모드에서 호환성 요약을 먼저 보여주고, 접힌 상세 안에서도 `pass` 행은 생략하도록 변경했다.
- 빌더 후보 카드의 `후보 호환성 상세`는 기본 접힘 상태로 두어 needs-check/blocked 후보가 카드 높이를 과도하게 늘리지 않게 했다.
- 최종 견적 화면에서 `필수 부품 미선택`을 primary 상태로 표시하고, 복사/이미지 저장 버튼 disabled 문구를 `부품 선택 후 복사 가능`, `부품 선택 후 이미지 저장 가능`으로 바꿨다.
- 최종 견적 화면의 상세 호환성 패널은 선택 부품과 가격 합계 아래로 이동하고 기본 접힘 상태로 유지했다.
- 후보 카드 가격 대표 라벨을 `이 후보 반영가`로 낮추고, 가격 breakdown 내부 라벨을 `일반가(배송비 제외)`, `반영가`로 정리했다.
- `pnpm test`가 untracked `qa-chrome-profile` 내부 브라우저 확장 테스트 파일까지 수집해 실패하던 문제를 막기 위해 `vitest.config.ts`에 `qa-chrome-profile/**`, `qa-screenshots/**` exclude를 추가했다.

주요 파일:
- `components/compatibility/compatibility-details.tsx`
- `components/builder/builder-flow.tsx`
- `components/summary/summary-view.tsx`
- `components/pricing/price-breakdown.tsx`
- `vitest.config.ts`
- `docs/work-trigger.md`

검증:
- `pnpm test` 첫 실행은 기존 untracked `qa-chrome-profile` 안의 Chrome extension test 파일 수집 때문에 실패했다.
- `vitest.config.ts` exclude 추가 후 `pnpm test` 성공
- `pnpm lint` 첫 실행은 124초 timeout, 300초 timeout으로 재실행 성공
- `pnpm build` 성공
- 기존 dev server `http://localhost:3022`에서 `/builder`, `/summary` HTTP 200 확인
- Chrome headless mobile width로 `/builder` 후보 카드 compact 상태와 `/summary` 필수 부품 미선택 상태 확인

남은 한계:
- complete-build summary 상태는 별도 브라우저 자동화 패키지 없이 localStorage 시드가 어려워 실제 선택 완료 상태까지는 수동 브라우저 QA가 필요하다.
- 모바일 sticky next-step CTA, 데스크톱 sticky summary/CTA rail, 광범위한 UI copy/token 정리는 이번 범위에서 제외했다.

## 보존 기록

### MVP 범위 확정

결론:
- MVP는 전체 축소 MVP로 진행한다.
- 견적까지 포함하되 고급 카드룰, 가격 히스토리, 로그인, DB 저장, 공유 링크, PDF, 커뮤니티, 결제 연동은 제외하거나 추후로 둔다.
- 상세 기준은 `docs/mvp-decisions.md`를 우선한다.

보존 이유:
- 이후 구현 범위가 흔들리지 않도록 하는 상위 결정이다.

### 크롤러 정책

결론:
- MVP에 실제 다나와 주요부품 카테고리 랭킹 30위 직접 크롤러 어댑터를 포함한다.
- `sammy310/Danawa-Crawler`는 카테고리 URL과 크롤링 대상 구조 참고용으로 남기고, 현재 `/api/prices/danawa`는 직접 다나와 리스트 HTML을 파싱한다.
- 서버 메모리 캐시와 Next.js `fetch` revalidate를 15분 기준으로 사용하며, 실패 시 수동 입력/붙여넣기 가격으로 fallback한다.
- 현재 메모리 캐시는 프로세스 단위라 배포 환경에서 인스턴스가 여러 개면 공유되지 않는다. 운영 안정성이 필요하면 Redis/KV 같은 외부 캐시가 필요하다.
- 공개/상업 배포 전 라이선스, 이용약관, robots.txt, 요청 제한 정책을 별도로 검토해야 한다.

보존 이유:
- 외부 사이트 정책, 배포 안정성, 법적/운영 리스크와 관련된 결정이다.

### UI/UX 기준 문서 반영

결론:
- `docs/07-ui-ux-guidelines.md`는 특정 레이아웃을 확정하지 않고, 상업용 MVP 화면 품질 기준을 제공한다.
- 기존 설계의 상담형 톤, 단계형 앱 UX, 가격/신뢰도/경고 표시, shadcn/ui/Tailwind/Zustand 전제와 충돌하지 않는다.
- 화면 구현 전 품질 검수 체크리스트를 완료 기준에 포함한다.

보존 이유:
- 이후 화면 구현의 품질 기준이 되며, 새 세션에서 반드시 참조해야 한다.

### 작업 트리거 운영 규칙

결론:
- 새 세션은 `docs/work-trigger.md`를 먼저 읽는다.
- 작업 종료 시 현재 상태, 최근 작업 히스토리, 보존 기록을 갱신한다.
- 최근 작업 히스토리는 최근 5개 항목만 유지한다.

보존 이유:
- 세션이 바뀌어도 작업 흐름과 결정사항을 이어가기 위한 운영 규칙이다.
