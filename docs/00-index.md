# 상세설계 문서 인덱스

PC 견적 빌드업 웹앱의 MVP 상세설계 문서 모음이다.
구현 기준은 `docs/mvp-decisions.md`를 우선한다.

## 문서 목록

- `docs/mvp-decisions.md`: 확정된 MVP 범위와 제품/기술 의사결정
- `docs/work-trigger.md`: 새 세션 시작 기준, 현재 상태, 작업 히스토리
- `docs/01-product-flow.md`: 사용자 플로우, 화면 구성, MVP UX 범위
- `docs/02-tech-architecture.md`: 기술 스택, 폴더 구조, 상태 관리, API 구조
- `docs/03-data-model.md`: TypeScript 타입, 정적 데이터 파일, localStorage 구조
- `docs/04-feature-design.md`: 입력, 게임/작업, 가격 수집, 빌더, 최종 출력 기능 설계
- `docs/05-recommendation-pricing.md`: 추천 점수, 카드 혜택가, 가격 신뢰도, 호환성 로직
- `docs/06-implementation-plan.md`: MVP 개발 순서, 작업 단위, Codex CLI 프롬프트 초안
- `docs/07-ui-ux-guidelines.md`: 상업용 MVP UI/UX 기준, 상태/접근성/반응형/품질 체크리스트
- `docs/08-market-research-ui.md`: PC 견적 서비스 시장조사와 UI 차별화 시사점
- `docs/09-ui-benchmark-report.md`: 벤치마킹 대상 서비스와 화면별 적용/제외 기준

## 구현 우선순위

1. 프로젝트 스캐폴딩과 공통 타입
2. 정적 데이터와 localStorage 저장소
3. 입력 플로우
4. 진단/추천 엔진
5. 가격 파싱과 크롤러 어댑터
6. 단계별 빌더
7. 최종 견적 출력
8. 반응형 UI와 검증

## 새 세션 시작

새 세션에서는 `docs/work-trigger.md`를 먼저 읽고 현재 상태와 최근 히스토리를 확인한다.
작업이 끝나면 같은 문서의 현재 상태와 작업 히스토리를 갱신한다.

## 설계 원칙

- 사용자를 구매로 몰아가지 않고 판단 근거를 보여준다.
- 가격과 성능 판단에는 항상 신뢰도와 주의사항을 붙인다.
- 크롤링 실패가 앱 전체 실패로 이어지지 않게 한다.
- MVP는 localStorage 기반이지만, 데이터 구조는 Supabase 이전을 고려한다.
- 추천은 점수만으로 끝내지 않고 reason 목록을 함께 제공한다.
