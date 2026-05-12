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

진행 예정:
- 벤치마킹 보고서의 화면별 체크리스트를 이후 UI 구현 완료 기준에 반영
- 확정된 UI 방향을 이후 화면 설계와 구현 프롬프트에 반영
- 전문가 검수 잔여 항목 반영: 게임 프로필 세분화, 부품 데이터 확장, 예산 최적화, 업그레이드 입력 강화
- CPU-보드 BIOS/세대 지원 데이터를 제조사 support list 또는 별도 정규 DB로 고도화
- 메인보드/쿨러/파워 상세 페이지 기반 보강 여부 결정
- 실제 다나와 snapshot 로그를 수집해 strict matcher alias와 parser를 점진적으로 보강
- 카드형 설문 UX 전체 개편은 별도 작업으로 진행
- 후보 가로 스크롤/더 많은 후보 노출은 별도 작업으로 진행

보류:
- 직접 다나와 페이지 크롤링은 MVP에 구현했지만, 공개/상업 배포 전 robots.txt, 이용약관, 요청 제한, 캐시 정책 검토가 필요
- 브랜드 네이밍, 로고, 실제 컬러 팔레트 확정

## 최근 작업 히스토리

최근 5개 항목만 유지한다.

### 2026-05-12 일반 최저가/혜택 최저가 분리 표시

작업:
- `lib/pricing/price-display.ts`를 추가해 `PriceOffer`의 일반가, 배송비, 혜택가, 보유 카드 매칭 여부, 조건 문구를 표시용 모델로 정리했다.
- 보유 카드와 `cardProviderId`가 일치하는 경우만 `내 혜택가`로 표시하고 합계 반영가에 사용한다.
- 카드가 일치하지 않는 혜택가는 `{카드명} 혜택가`로 보여주되 합계 반영가에서 제외한다.
- 카드/쿠폰 조건을 특정하지 못하는 혜택가는 `조건부 혜택가`로 보여주고 내 혜택가로 계산하지 않는다.
- `components/pricing/price-breakdown.tsx`를 추가해 후보 카드와 최종 견적에서 같은 의미 체계로 선택 가격 일반가, 혜택가, 배송비, 혜택 조건/주의사항을 표시한다.
- 빌더 후보 카드의 단일 가격 문구를 `합계 반영가`와 상세 가격 분리 표시로 바꿨다.
- 최종 견적 라인 아이템에서 단일 가격 숫자 대신 가격 breakdown을 표시하고, 합계 라벨을 `일반가+배송비 합계`, `내 혜택 반영 합계`로 명확히 바꿨다.
- 텍스트 복사 출력에서도 각 부품의 일반가, 내 혜택가, 배송비, 합계 반영가를 구분한다.
- `docs/feature-backlog.md`의 P1 일반 최저가/혜택 최저가 분리 표시 항목을 `done`으로 정리했다.

주요 파일:
- `components/pricing/price-breakdown.tsx`
- `components/builder/builder-flow.tsx`
- `components/summary/summary-view.tsx`
- `lib/pricing/price-display.ts`
- `lib/pricing/price-display.test.ts`
- `lib/summary/build-summary.ts`
- `docs/feature-backlog.md`
- `docs/work-trigger.md`

검증:
- `pnpm test lib/pricing/price-display.test.ts lib/summary/build-summary.test.ts` 성공
- `pnpm test` 성공
- `pnpm lint` 성공
- `pnpm build` 성공
- PM 리뷰 후 `일반 최저가` 오해 가능성을 줄이기 위해 `선택 가격 일반가`로 라벨을 낮췄고, 텍스트 복사 출력의 배송비 제외/포함 금액 구분 테스트를 보강했다.

남은 한계:
- 후보 카드 안에 가격 breakdown과 호환성 상세가 함께 있어 모바일 카드 밀도는 별도 Design/UX QA가 필요하다.
- 가격 선택/정렬 정책은 기존 로직을 유지했고, 이번 작업은 표시와 합계 라벨 명확화에 집중했다.

### 2026-05-12 호환성 결과 UX 고도화

작업:
- `lib/compatibility/display.ts`를 추가해 기존 `CompatibilityResult`와 `SelectedParts`를 CPU-보드, 보드-RAM, 보드-케이스, GPU-케이스, 쿨러-케이스, 쿨러-CPU, 파워-GPU/CPU, 보드-SSD 행 단위 표시 모델로 정렬했다.
- `components/compatibility/compatibility-details.tsx`를 추가해 pass / needs-check / blocked / 선택 후 확인 상태를 같은 UI로 표시한다.
- 각 issue의 code, severity, status, message, userAction, evidence source/field/value/confidence를 상세 패널에서 확인할 수 있게 했다.
- `canRecommend`, `canPurchase`, `canExport` 정책을 추천/구매/복사·저장 가능 여부 배지로 표시했다.
- 빌더 후보 카드에 compact 호환성 상세 패널을 연결했다. needs-check/blocked 후보는 기본으로 펼쳐 이유와 확인 항목을 바로 보여준다.
- 빌더 하단 최종 조합 영역과 최종 견적 화면에도 같은 호환성 상세 패널을 연결했다.
- 최종 견적 summary 모델에 원본 `compatibility` 결과를 포함해 warning 변환 전의 상세 데이터를 UI에서 사용할 수 있게 했다.
- `docs/feature-backlog.md`에서 이미 구현된 빌더 CTA 분리, 후보 로딩 상태 개선, 호환성 결과 UX 고도화 항목을 `done`으로 정리했다.

주요 파일:
- `components/compatibility/compatibility-details.tsx`
- `components/builder/builder-flow.tsx`
- `components/summary/summary-view.tsx`
- `lib/compatibility/display.ts`
- `lib/compatibility/display.test.ts`
- `lib/summary/build-summary.ts`
- `docs/feature-backlog.md`
- `docs/work-trigger.md`

검증:
- `pnpm test` 성공
- `pnpm lint` 성공
- `pnpm build` 첫 실행은 sandbox 네트워크 제한으로 Google Fonts fetch 실패, 승인 후 재실행 성공
- `pnpm exec next start -p 3001`로 빌드 결과 서버 기동 성공
- `curl -I http://localhost:3001/builder` 성공, HTTP 200
- `curl -I http://localhost:3001/summary` 성공, HTTP 200

남은 한계:
- `agent-browser` CLI가 설치되어 있지 않아 실제 브라우저 viewport/interaction QA는 수행하지 못했다.
- 이번 작업은 판정 로직을 크게 바꾸지 않고 기존 issue를 표시하는 UI/데이터 정렬 작업이다.
- 후보 가로 스크롤/더 많은 후보 노출은 별도 작업이다.

### 2026-05-12 빌더 CTA와 최종 견적 진입 UX 정리

작업:
- `lib/recommendation/build-progress.ts`를 추가해 필수 부품 누락 계산, 최종 견적 진입 가능 여부, 다음/이전 카테고리 계산을 분리했다.
- 필수 부품 기준은 현재 빌더 카테고리와 동일하게 CPU, 쿨러, 메인보드, RAM, GPU, SSD, 파워, 케이스로 둔다.
- 빌더 상단에 현재 단계, 전체 진행률, 선택 완료 부품, 남은 부품을 표시했다.
- 기본 CTA를 `다음: {부품} 선택`으로 두고, 현재 카테고리 후보를 선택하기 전에는 다음 이동을 비활성화했다.
- `최종 견적 보기`는 빌더 내부의 별도 CTA로 분리하고, 필수 부품이 모두 선택되지 않으면 비활성화한다.
- 필수 부품 완료 후 최종 호환성이 `compatible`이면 `최종 견적 보기`, `needs-check`이면 `확인 필요 항목 포함 견적 보기`, `blocked`이면 `호환성 문제 해결 필요`로 표시한다.
- 후보 로딩 중에는 이전 후보 카드를 노출하지 않고 skeleton 상태와 `조건에 맞는 후보를 계산하고 있습니다` 문구를 표시한다.
- 후보 조회 실패 상태와 안전 후보 없음 상태를 분리했다.
- 자동 추천 버튼 문구를 `안전한 추천 견적 자동 구성`으로 바꾸고, 실패 시 기존 선택을 유지하면서 blocker 또는 남은 부품 이유를 표시한다.
- summary 화면에서 필수 부품 누락 시 남은 부품을 표시하고 복사/이미지 저장을 비활성화했다.

주요 파일:
- `components/builder/builder-flow.tsx`
- `components/summary/summary-view.tsx`
- `app/builder/page.tsx`
- `lib/recommendation/build-progress.ts`
- `lib/recommendation/build-progress.test.ts`
- `docs/work-trigger.md`

검증:
- `pnpm test` 성공
- `pnpm lint` 성공
- `pnpm build` 성공

남은 한계:
- 카드형 설문 UX 전체 개편은 별도 작업이다.
- 후보 가로 스크롤/더 많은 후보 노출은 별도 작업이다.
- 호환성 결과 팝업/다나와식 부품별 시각화는 별도 작업이다.

### 2026-05-12 Part-Offer alias normalization 보강

작업:
- `lib/pricing/offer-match.ts`의 strict matcher에 다나와 상품명 한글/영문 alias 정규화를 추가했다.
- MSI/엠에스아이, ASUS/에이수스, SK hynix/SK하이닉스, Micronics/마이크로닉스 등 브랜드 alias를 보강했다.
- MORTAR/박격포, TUF/터프, VENTUS/벤투스, PULSE/펄스, Platinum P41/P41, 990 EVO/990에보 등 라인업 alias를 보강했다.
- 12V-2x6/16핀/12VHPWR, PCIe 8핀/6+2핀, DDR5-6000/PC5-48000/2x16GB, M-ATX/mATX/Micro-ATX 표기를 정규화했다.
- alias는 동일 상품 판단의 보조 신호로만 쓰고, 칩셋·소켓·RAM 타입·용량·속도·GPU 칩셋·VRAM·PSU 용량·ATX 버전 등 핵심 스펙 충돌이 있으면 계속 mismatch 처리한다.
- seed Part 가격 보강은 핵심 offer 스펙이 확인될 때만 alias match를 허용해, 불확실한 가격은 붙이지 않는 정책을 유지했다.
- `lib/parts/spec-display.ts`에서 CPU 소켓 누락 문구, RAM 키트 표기, GPU 길이/두께, PSU 커넥터 배지 표기를 보강했다.

주요 파일:
- `lib/pricing/offer-match.ts`
- `lib/pricing/offer-match.test.ts`
- `lib/parts/spec-display.ts`
- `docs/work-trigger.md`

테스트:
- B650M MORTAR/박격포, ASUS TUF/터프, ESSENCORE KLEVV/에센코어 클레브, SK hynix P41/SK하이닉스 P41, Samsung 990 EVO/삼성 990에보, Micronics/마이크로닉스, MSI VENTUS/벤투스, Sapphire PULSE/펄스, ARCTIC/아틱, 3RSYS L600 블랙 alias match 테스트를 추가했다.
- B650↔B760/B850, DDR5↔DDR4, 32GB↔64GB, DDR5-6000↔DDR5-5600, P41↔P310, 1TB↔500GB, 850W↔750W, ATX3.1↔ATX2.x, RTX5070↔RTX5080/5070Ti, 360mm↔240mm, L600↔L330 mismatch 회귀 테스트를 추가했다.

검증:
- `pnpm test` 성공
- `pnpm lint` 성공
- `pnpm build` 성공

남은 한계:
- alias가 늘어도 live 다나와 상품명 변형을 100% 커버할 수 없다.
- 안전 우선 정책상 일부 정상 가격 매칭이 누락될 수 있다.
- 실제 snapshot 로그를 수집해 alias와 parser를 점진적으로 보강해야 한다.

### 2026-05-12 Part-Offer strict matching과 표시명 고정

작업:
- `lib/pricing/offer-match.ts`를 추가해 `isStrictSameProductOffer()`와 `getOfferMatchDiagnostics()`를 도입했다.
- `offer.partId === part.id`만으로 가격을 붙이지 않고 카테고리별 핵심 스펙 충돌을 먼저 검사한다.
- B650 seed 보드에 B760 offer, DDR5 seed RAM에 DDR4 offer, SK hynix P41 seed SSD에 Crucial P310 offer, RTX 5070 seed GPU에 RTX 5080 offer가 붙지 않도록 막았다.
- `candidates.ts`와 `build-summary.ts`의 중복 fuzzy matcher를 제거하고 strict matcher를 공통 사용하도록 바꿨다.
- 후보 카드 제목은 항상 `candidate.part.name`으로 표시하고, `bestOffer.productName`은 `가격 매칭 상품` 보조 정보로만 표시한다.
- 최종 견적 item 이름은 항상 `item.part.name`을 사용하고, offer 상품명은 가격 매칭 상품명으로만 표시한다.
- `RecommendationCandidate`에 `offerMatch`와 `display` 필드를 추가했다.
- `lib/parts/spec-display.ts`를 추가해 CPU/보드/RAM/GPU/케이스/PSU/쿨러/SSD 핵심 스펙 배지를 생성한다.
- 후보 카드와 최종 견적에 핵심 스펙 배지를 표시했다.
- 빌더에 `자동 추천 견적 생성` 버튼을 추가해 `createRecommendedBuildAssembly()` 결과를 실제 `selectedPartIds`에 반영하도록 연결했다.
- 선택된 anchor에 따른 hard block 후보는 기존 compatibility context를 통해 role에서 제외되며, AM5 CPU 선택 시 LGA 보드, DDR5 보드 선택 시 DDR4 RAM이 role에 들어가지 않는 회귀 테스트를 추가했다.

주요 파일:
- `lib/pricing/offer-match.ts`
- `lib/pricing/offer-match.test.ts`
- `lib/parts/spec-display.ts`
- `lib/recommendation/candidates.ts`
- `lib/recommendation/candidates.test.ts`
- `lib/summary/build-summary.ts`
- `lib/summary/build-summary.test.ts`
- `components/builder/builder-flow.tsx`
- `components/summary/summary-view.tsx`
- `types/diagnosis.ts`
- `docs/work-trigger.md`

검증:
- `pnpm test` 성공
- `pnpm lint` 성공
- `pnpm build` 성공

다음 작업:
- strict matcher를 실제 다나와 live snapshot으로 검증하고 브랜드/라인업 예외 토큰을 보강한다.
- assembly 실패 사유를 UI에 더 구체적으로 표시한다.
- 제조사 support list 기반 BIOS 최소 버전 데이터로 CPU-보드 룰을 고도화한다.

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
