# PC 견적 빌드업 웹앱 UI 벤치마킹 보고서

작성일: 2026-05-12

## 1. 목적

이 문서는 PC 견적 빌드업 웹앱의 UI 담당자가 실제 화면 설계 전에 참고할 벤치마킹 대상을 정리한 보고서다. 단순히 경쟁 서비스를 나열하는 것이 아니라, 각 서비스에서 가져올 수 있는 UI 패턴과 그대로 가져오면 안 되는 요소를 구분한다.

프로젝트 전제:

- 랜딩페이지가 아니라 단계형 웹앱이다.
- 판매 유도형이 아니라 보수적이고 신뢰성 있는 상담형 서비스다.
- MVP는 로그인, DB, 결제, 공유 링크, PDF 없이 localStorage 기반이다.
- 데스크톱 중심이지만 모바일에서도 주요 입력과 최종 견적 확인은 가능해야 한다.
- 가격, 카드 혜택, 크롤링 결과는 조건부 정보이므로 신뢰도와 주의사항을 숨기지 않는다.

## 2. 벤치마킹 결론

### 핵심 결론

| 결론 | 설명 |
| --- | --- |
| 기존 국내 서비스는 가격/구매 흐름이 강하다 | 다나와/샵다나와는 상품량, 견적, 역경매, 실시간 가격에 강하다. |
| 해외 PC builder는 호환성/저장/공유가 강하다 | Micro Center, Newegg, Pangoly, PlanMyPC류는 호환성 체크와 리스트 관리가 핵심이다. |
| 게임 기반 추천 흐름은 참고 가치가 높다 | XIDAX Easy Mode, MaxMyBuild처럼 게임/해상도/예산에서 견적을 시작하는 패턴은 우리 서비스와 맞다. |
| 우리 서비스는 “조건 기반 사양 판독”을 중심에 둬야 한다 | 부품 선택 전에 게임, 작업, 모니터, 카드 조건으로 적정 티어를 설명하는 것이 차별점이다. |
| 가격 UI는 공격적으로 보이면 안 된다 | 최저가, 혜택가, 카드 조건, 갱신 시각, 신뢰도를 한 세트로 보여줘야 한다. |

### 가장 우선 참고할 서비스

| 우선순위 | 서비스 | 참고할 이유 |
| --- | --- | --- |
| 1 | XIDAX Easy Mode | 게임 선택 → 해상도 → 예산 → 추천 빌드 흐름이 우리 앱의 첫 진입 구조와 가장 유사 |
| 2 | MaxMyBuild | 예산, 해상도, 선호 브랜드만으로 빠르게 build를 생성하는 간결한 입력 UX |
| 3 | 다나와/샵다나와 | 국내 사용자가 익숙한 부품 카테고리, 실시간 견적, 현금/카드 가격 맥락 |
| 4 | Pangoly | 호환성, 가격 비교, 가격 히스토리, ready-made build, manual part addition 참고 |
| 5 | Micro Center PC Builder | 저장, 공유, 출력, 매장 픽업까지 이어지는 builder UX의 표준 패턴 |
| 6 | Newegg PC Builder | 호환성 고지와 configurator 구조 참고 |
| 7 | System Requirements Lab | 게임명 기반 요구사양 탐색과 PC 사양 감지 흐름 참고 |
| 8 | BuildCores | 3D/시각화는 MVP 제외지만, 물리적 호환성 인식 방식은 장기 참고 |

## 3. 벤치마킹 대상별 분석

## 3.1 XIDAX Easy Mode

URL: https://www.xidax.com/easymode

### 관찰

XIDAX Easy Mode는 `Pick a Game`을 첫 단계로 두고, 사용자가 플레이하는 게임과 예산을 선택하면 추천 빌드를 보여주는 구조다. 화면은 크게 다음 흐름을 가진다.

1. 게임 선택
2. 해상도 선택
3. 예산 범위 설정
4. 추천 빌드 표시
5. 원하면 custom build로 이동

### 벤치마킹할 점

- 부품이 아니라 게임에서 시작하는 진입 방식
- `Easy Mode`와 `Hard Mode`처럼 초보자/고급 사용자를 나누는 개념
- 선택한 게임, 해상도, 예산을 요약해서 계속 보여주는 패턴
- 추천 빌드가 나오기 전 빈 상태 문구를 제공하는 방식

### 우리 서비스 적용

- 첫 진입 후 게임 선택 화면에서 “게임명 → 목표 옵션 → 빈도”를 간단히 시작하게 한다.
- 고급 부품 선택은 처음부터 노출하지 않고 단계별 빌더 후반에 둔다.
- 사용자가 선택한 조건 요약을 사양 판독 화면 상단에 계속 보여준다.

### 그대로 따라 하면 안 되는 점

- XIDAX는 구매 전환 서비스라 `Quick Add`, financing, cart 흐름이 강하다. 우리 MVP에는 결제/구매가 없으므로 이 패턴은 제외한다.
- “추천 빌드 구매”처럼 보이는 문구를 쓰지 않는다.

## 3.2 MaxMyBuild

URL: https://www.maxmybuild.com/

### 관찰

MaxMyBuild는 예산, 목표 해상도, CPU/GPU 브랜드 선호, Wi-Fi 필요 여부처럼 적은 입력으로 build를 생성한다. no signup, automatic compatibility, budget-first 흐름을 강조한다.

### 벤치마킹할 점

- 필수 입력을 예산 하나로 줄이고 나머지는 선택으로 둔 간결함
- target resolution을 빠르게 고르게 하는 방식
- “compatibility report”를 결과의 신뢰 장치로 사용하는 패턴
- 초보자가 모르는 값은 건너뛸 수 있게 하는 입력 구조

### 우리 서비스 적용

- 입력 화면마다 필수값을 최소화한다.
- 예산은 선택 입력이지만, 입력했을 경우 결과 요약에서 적극 반영한다.
- 사양 판독 결과에 `호환성 확인 범위`, `확인 필요 항목`을 별도 섹션으로 둔다.

### 그대로 따라 하면 안 되는 점

- “fully compatible”처럼 보장형 표현은 피한다.
- 우리 서비스는 가격 데이터와 호환성 데이터가 불완전할 수 있으므로 “확인된 범위 내에서”라는 톤을 유지한다.

## 3.3 다나와/샵다나와

URLs:

- https://www.danawa.com/pc/
- https://shop.danawa.com/pc/
- https://help.danawa.com/bizCenter/index.php?depth1=6

### 관찰

다나와는 국내 사용자가 PC 부품 가격을 비교할 때 가장 익숙한 생태계다. 샵다나와는 PC견적, 역경매, 조립PC, 무이자PC, 중고PC, 구매상담 등을 제공한다. 역경매 화면에는 실시간 견적, 평균가, 입찰수, 진행상태가 노출된다.

### 벤치마킹할 점

- 국내 사용자가 익숙한 부품 카테고리 순서
- 실시간 견적/평균가/진행상태처럼 신뢰감을 주는 메타 정보
- 현금/카드 가격 구분
- 견적 결과를 표 형태로 확인하는 구조
- “PC견적내기”라는 명확한 행동 진입점

### 우리 서비스 적용

- 단계별 빌더 순서는 CPU → 쿨러 → 메인보드 → RAM → GPU → SSD → 파워 → 케이스를 유지한다.
- 가격 화면에는 `일반가`, `내 카드 혜택가`, `배송비`, `갱신 시각`, `신뢰도`를 같이 표시한다.
- 최종 견적은 국내 견적서 문법에 맞게 부품별 행 구조를 유지한다.

### 그대로 따라 하면 안 되는 점

- 첫 화면을 부품 카테고리 목록으로 시작하지 않는다.
- 실시간 견적 목록을 홈의 중심으로 두면 사용자가 가격 게시판으로 오해할 수 있다.
- 역경매, 입찰, 구매완료 같은 구매 전환 UI는 MVP에서 제외한다.

## 3.4 컴퓨존/판매 상담형 서비스

대표 참고:

- https://www.compuzone.kr/exc_event/discount_PC.htm

### 관찰

컴퓨존의 가격 제안형 서비스는 사용자가 타 사이트 견적 캡처를 첨부하고, 업체가 가격을 제안하는 구매 상담 흐름을 제공한다. 안내 문구에는 견적 첨부 조건, 결제 가능 기간, 조립비, 증빙자료 등 구매 전 조건이 구체적으로 정리된다.

### 벤치마킹할 점

- 사용자가 실수하기 쉬운 조건을 사전에 알려주는 안내 구조
- 가격 제안의 유효 기간, 조건, 제외 대상을 명확히 쓰는 방식
- 단계별 신청 흐름을 짧게 정리하는 패턴

### 우리 서비스 적용

- 다나와 붙여넣기 파싱 화면에서 “붙여넣으면 좋은 데이터”와 “해석이 어려운 데이터”를 미리 알려준다.
- 카드 혜택가에는 계산 제외 조건을 기본 노출한다.
- 최종 견적에 “MVP 계산 한계”를 반드시 포함한다.

### 그대로 따라 하면 안 되는 점

- 판매처 상담 신청처럼 보이게 하지 않는다.
- 결제 유도, 주문서, 신청서, 구매 확정 같은 단어를 피한다.

## 3.5 Pangoly

URL: https://pangoly.com/en/about

### 관찰

Pangoly는 compatibility check, ready-made build, detailed product information, manual part addition, price comparison, price history, price alert를 제공한다. 초보자용 build와 고급 사용자용 선택을 같이 지원하는 구조다.

### 벤치마킹할 점

- ready-made build를 예산/용도별 참고점으로 제공하는 방식
- 수동 부품 추가 기능
- 가격 히스토리와 가격 알림의 정보 구조
- region 기반 가격 비교 구조

### 우리 서비스 적용

- MVP 정적 데이터에는 샘플 build를 두고, 추천 결과 검증용 기준으로 활용한다.
- 가격 데이터가 없으면 수동 가격 입력을 자연스러운 대체 경로로 둔다.
- 향후 가격 히스토리를 추가할 때는 Pangoly처럼 추세 중심으로 보여준다.

### 그대로 따라 하면 안 되는 점

- 가격 히스토리와 알림은 MVP 범위를 넘는다.
- 계정 기반 저장과 email alert는 MVP에서 제외한다.

## 3.6 Micro Center PC Builder

URL: https://www.microcenter.com/site/content/custom-pc-builder.aspx

### 관찰

Micro Center는 PC Builder에서 부품 선택, 저장, 공유, 출력, 장바구니/매장 픽업까지 연결한다. 설명 문구에서는 초보자가 부품을 선택하고 호환성을 확인하며, 완성된 리스트를 커뮤니티나 Reddit에 공유할 수 있다고 안내한다.

### 벤치마킹할 점

- build dashboard 개념
- 저장, 출력, 공유 형식 제공
- 커뮤니티 피드백으로 이어지는 흐름
- 주요 부품 호환성을 자동 확인한다는 안내

### 우리 서비스 적용

- MVP에서는 계정 dashboard 대신 localStorage 기반 `이전 견적 이어가기`를 제공한다.
- 공유 링크 대신 텍스트 복사와 이미지 저장을 확실히 만든다.
- 최종 견적 텍스트는 커뮤니티에 붙여넣기 쉬운 형태로 만든다.

### 그대로 따라 하면 안 되는 점

- add to cart, reserve, pickup, store map 같은 구매/매장 기능은 제외한다.
- 공유 링크는 MVP 제외 범위이므로 UI에 넣지 않는다.

## 3.7 Newegg PC Builder

URLs:

- https://www.newegg.com/tools/custom-pc-builder
- https://kb.newegg.com/knowledge-base/testing-or-assembling-an-order/

### 관찰

Newegg는 PC Builder를 compatible parts를 보여주는 configurator로 소개한다. 동시에 실제 호환성은 제조사 정보와 다를 수 있으며 보증하지 않는다는 고지를 둔다.

### 벤치마킹할 점

- 호환성 도구의 책임 범위 고지
- CPU부터 시작하는 부품 선택 흐름
- builder가 구매몰 상품 데이터와 연결되는 구조

### 우리 서비스 적용

- 호환성 경고에는 `확정 불가`, `확인 필요`, `정보 부족`을 구분한다.
- “호환 가능”을 절대적 보장처럼 표현하지 않는다.
- 제조사 세부 스펙 확인이 필요한 항목은 warning으로 표시한다.

### 그대로 따라 하면 안 되는 점

- 몰 종속형 상품 추천처럼 보이면 안 된다.
- 호환성 필터 때문에 선택지가 사라지는 경우, 이유를 설명하지 않으면 사용자 신뢰가 떨어진다.

## 3.8 PlanMyPC

URL: https://planmypc.com/

### 관찰

PlanMyPC는 system builder, completed builds, compare, benchmarks, guides, forums, price trends를 한 서비스 안에 둔다. 제품 수, 카테고리 수, live prices, popular builds, price trends를 홈에서 신뢰 지표로 보여준다.

### 벤치마킹할 점

- 도구, 빌드, 비교, 벤치마크, 가이드, 커뮤니티를 분리한 정보 구조
- popular builds를 용도/예산별 참고점으로 보여주는 방식
- 가격 추세와 deal alert를 보조 기능으로 배치하는 방식

### 우리 서비스 적용

- MVP 이후 기능 확장 시 메뉴는 `견적 만들기`, `가격 분석`, `저장된 견적`, `가이드`처럼 과업 기준으로 나눈다.
- 샘플 빌드는 홈 중심이 아니라 참고/검증용으로 둔다.

### 그대로 따라 하면 안 되는 점

- 초기 MVP에서 포럼, price trends, deal alert를 모두 열면 범위가 무너진다.
- 홈에 너무 많은 지표를 두면 단계형 앱 정체성이 약해진다.

## 3.9 System Requirements Lab / Can You RUN It

URL: https://www.systemrequirementslab.com/all-games-list/

### 관찰

System Requirements Lab은 수많은 게임 요구사양 DB와 PC 사양 감지 흐름을 제공한다. 사용자는 “내 PC가 이 게임을 돌릴 수 있는가”라는 단일 질문으로 진입한다.

### 벤치마킹할 점

- 게임명 중심 탐색
- 최소/권장 사양 구분
- 사용자 PC 사양 감지 또는 입력 후 결과 제공
- Top Games, 알파벳 검색 등 많은 게임을 탐색하는 구조

### 우리 서비스 적용

- 게임 선택은 장르보다 게임명 중심으로 구성한다.
- “최소/권장”보다 우리 서비스는 “목표 옵션/해상도/주사율 기준 적정 티어”를 보여준다.
- PowerShell 붙여넣기 결과를 사용자가 수정할 수 있게 한다.

### 그대로 따라 하면 안 되는 점

- 단순 가능/불가능 판정으로 끝내지 않는다.
- 자동 감지 프로그램 설치를 MVP에 포함하지 않는다.

## 3.10 BuildCores

대표 참고:

- https://apps.apple.com/us/app/buildcores-part-picker-for-pc/id1441971434
- https://buildcores.com/

### 관찰

BuildCores는 3D PC builder, 부품 시각화, compatibility, price comparison, sales feed를 강조한다. 특히 물리적 호환성과 조립 결과의 시각적 이해를 돕는 방향이 강하다.

### 벤치마킹할 점

- 케이스, GPU 길이, 쿨러 높이, 라디에이터 등 물리적 호환성을 사용자가 이해하게 만드는 방식
- 시각화가 신뢰감을 주는 구조
- 가격 피드와 compatibility를 함께 묶는 방향

### 우리 서비스 적용

- MVP에서는 3D를 도입하지 않는다.
- 대신 물리적 호환성 경고를 텍스트와 간단한 스펙 비교로 명확히 보여준다.
- 장기적으로 케이스/GPU/쿨러 호환성 시각화를 검토할 수 있다.

### 그대로 따라 하면 안 되는 점

- 3D 시각화는 MVP 범위를 크게 늘린다.
- 시각적 재미가 추천 신뢰도보다 앞서면 안 된다.

## 4. 바로 참고할 UI 패턴

### 4.1 첫 화면

벤치마킹 대상:

- XIDAX Easy Mode
- MaxMyBuild
- 다나와 PC견적 진입점

적용 방향:

- 첫 CTA는 `내 조건으로 견적 만들기`
- 보조 행동은 `이전 견적 이어가기`, `현재 PC 사양 가져오기`, `다나와 가격 붙여넣기 분석`
- 홈은 설명 섹션보다 행동 진입을 우선한다.

피해야 할 것:

- 쇼핑몰식 상품 배너
- 실시간 견적 게시판을 첫 화면 중심에 배치
- 과장된 “최저가 보장” 문구

### 4.2 단계 진행

벤치마킹 대상:

- XIDAX Easy Mode의 Step 구조
- MaxMyBuild의 짧은 입력 구조
- Micro Center의 builder 단계

적용 방향:

- 단계명은 사용자가 하는 행동 기준으로 쓴다.
- 현재 단계, 완료 단계, 남은 단계를 분명히 한다.
- 입력이 길어지면 저장 상태를 표시한다.

피해야 할 것:

- 모든 입력을 한 화면에 몰아넣기
- 부품 지식이 있어야만 진행 가능한 구조

### 4.3 추천 후보 카드

벤치마킹 대상:

- Pangoly의 detailed product information
- PC builder류의 호환성 표시
- 커뮤니티형 견적 서비스의 추천 이유 문장

적용 방향:

후보 카드는 다음 순서로 읽히게 한다.

1. 후보 역할: 절약형, 추천형, 상급형
2. 상품명
3. 내 카드 기준 예상가
4. 추천 적합도
5. 추천 이유
6. warning
7. 상세 스펙/출처 펼침

피해야 할 것:

- 점수만 크게 보여주기
- warning을 상세 영역 안에 숨기기
- 가격과 카드 조건을 분리해서 오해 만들기

### 4.4 가격 데이터

벤치마킹 대상:

- 다나와의 가격/카드/현금 맥락
- Pangoly/PlanMyPC의 price trend, live price, deal alert 구조
- Newegg의 책임 범위 고지

적용 방향:

가격은 항상 다음 묶음으로 보여준다.

- 일반가
- 내 카드 혜택가
- 배송비 포함 여부
- 적용 카드
- 쇼핑몰
- 갱신 시각
- confidence
- warnings

피해야 할 것:

- 혜택가만 강조
- 갱신 시각 누락
- 카드 조건을 하단 주석에만 숨김

### 4.5 호환성 경고

벤치마킹 대상:

- PCPartPicker류 compatibility notes
- Micro Center/Newegg PC Builder
- BuildCores의 물리적 호환성 방향

적용 방향:

호환성 상태는 세 단계 이상으로 구분한다.

| 상태 | 의미 | UI |
| --- | --- | --- |
| 통과 | 현재 데이터 기준 문제 없음 | 작은 긍정 배지 |
| 확인 필요 | 정보 부족 또는 제조사 확인 필요 | warning 배지와 이유 |
| 선택 불가 | 확정 호환 불가 | critical 경고와 선택 제한 |

피해야 할 것:

- “호환 가능”을 보증처럼 표현
- 선택지가 사라졌는데 이유를 말하지 않음

### 4.6 최종 견적

벤치마킹 대상:

- Micro Center의 print/share build
- 다나와 견적서 문법
- 커뮤니티 견적 공유 형식

적용 방향:

- 화면 표시용과 이미지 저장용 레이아웃을 분리한다.
- 텍스트 복사는 커뮤니티/메신저에 바로 붙여넣을 수 있게 만든다.
- 가격 조건과 주의사항은 이미지에도 포함한다.

피해야 할 것:

- 진행 UI까지 그대로 캡처
- 이미지에서 가격 신뢰도와 주의사항 제거

## 5. 벤치마킹 우선순위 로드맵

### MVP 구현 전

1. XIDAX Easy Mode의 게임→예산→추천 흐름을 참고해 입력 시작 구조를 점검한다.
2. MaxMyBuild의 짧은 입력 구조를 참고해 필수 입력을 줄인다.
3. 다나와/샵다나와를 참고해 최종 견적의 부품 순서와 가격 표현을 맞춘다.
4. Newegg의 고지 방식을 참고해 호환성/가격 데이터의 책임 범위를 명확히 한다.

### MVP 화면 구현 중

1. 후보 카드에 점수, 이유, warning, 가격 신뢰도를 같이 배치한다.
2. 가격 수집 화면은 다나와 붙여넣기, pcode, 수동 입력을 같은 보강 흐름으로 묶는다.
3. 모바일에서는 후보 카드를 단일 컬럼으로 전환하고, 상세 정보는 펼침으로 둔다.
4. 최종 견적 이미지 레이아웃은 화면 UI와 별도로 설계한다.

### MVP 이후

1. Pangoly/PlanMyPC를 참고해 가격 히스토리와 가격 알림을 검토한다.
2. BuildCores를 참고해 케이스/GPU/쿨러 물리적 호환성 시각화를 검토한다.
3. Micro Center처럼 커뮤니티 공유/피드백 흐름을 검토하되, 먼저 텍스트 복사 품질을 검증한다.

## 6. 우리 서비스에 맞게 가져올 것과 버릴 것

### 가져올 것

- 게임/해상도/예산에서 시작하는 쉬운 진입
- 단계형 입력
- 조건 요약
- 호환성 warning
- 가격 신뢰도와 갱신 시각
- 최종 견적 복사/저장
- 수동 보정 경로

### 버릴 것

- 구매 버튼
- 장바구니
- 결제/할부/픽업 UI
- 공유 링크
- PDF 출력
- 계정 저장
- 가격 알림
- 3D builder
- 커뮤니티 피드
- 과장된 AI 추천 챗봇

### 주의해서 가져올 것

- 자동 추천: 이유와 한계를 함께 보여줄 때만 사용한다.
- 호환성 필터: 필터 결과의 이유를 설명할 수 있을 때만 강하게 적용한다.
- 게임 FPS 예측: 데이터 신뢰도가 충분하지 않으면 MVP에서는 직접 수치 예측보다 적정 티어로 표현한다.
- 가격 비교: 카드 혜택과 배송비 조건을 함께 보여줄 수 있을 때만 강조한다.

## 7. 화면별 벤치마킹 체크리스트

### 홈

- [ ] XIDAX/MaxMyBuild처럼 사용자가 바로 입력을 시작할 수 있는가?
- [ ] 다나와처럼 구매/가격 게시판처럼 보이지 않는가?
- [ ] `이전 견적 이어가기`는 저장 데이터가 있을 때만 강하게 보이는가?

### 입력 플로우

- [ ] 모르는 값을 허용하는가?
- [ ] 각 입력이 추천 결과에 어떻게 쓰이는지 짧게 설명하는가?
- [ ] 게임, 작업, 모니터, 예산 입력이 서로 섞이지 않는가?

### 사양 판독

- [ ] 단순 가능/불가능이 아니라 적정 티어, 병목, 과투자, 정보 부족을 보여주는가?
- [ ] 추천 이유가 초보자도 이해할 문장인가?
- [ ] 데이터 출처와 confidence를 확인할 수 있는가?

### 가격 수집

- [ ] 다나와 붙여넣기 실패가 앱 실패처럼 보이지 않는가?
- [ ] 수동 입력이 자연스러운 fallback인가?
- [ ] 가격에는 갱신 시각과 confidence가 붙는가?

### 빌더

- [ ] 후보 역할이 명확한가?
- [ ] 가격과 추천 이유가 같은 카드 안에서 읽히는가?
- [ ] critical 호환성 오류는 선택 제한으로 이어지는가?

### 최종 견적

- [ ] 텍스트 복사와 이미지 저장이 모두 제공되는가?
- [ ] 이미지에 가격 조건과 warning이 포함되는가?
- [ ] 주문서나 구매 확정처럼 보이지 않는가?

## 8. 참고 자료

국내:

- 다나와 PC 카테고리: https://www.danawa.com/pc/
- 샵다나와 역경매: https://shop.danawa.com/pc/
- 샵다나와 PC견적/역경매 안내: https://help.danawa.com/bizCenter/index.php?depth1=6
- 컴퓨존 깎아줘 PC: https://www.compuzone.kr/exc_event/discount_PC.htm
- 견적왕: https://kjwwang.com/

해외 builder/추천:

- XIDAX Easy Mode: https://www.xidax.com/easymode
- MaxMyBuild: https://www.maxmybuild.com/
- Pangoly: https://pangoly.com/en/about
- Micro Center PC Builder: https://www.microcenter.com/site/content/custom-pc-builder.aspx
- Newegg PC Builder: https://www.newegg.com/tools/custom-pc-builder
- Newegg 안내/고지: https://kb.newegg.com/knowledge-base/testing-or-assembling-an-order/
- PlanMyPC: https://planmypc.com/
- ResolveBit Auto Build: https://resolvebit.com/autobuild
- System Requirements Lab: https://www.systemrequirementslab.com/all-games-list/
- BuildCores App Store: https://apps.apple.com/us/app/buildcores-part-picker-for-pc/id1441971434

시장/리스크:

- IDC 국내 PC 시장 보도: https://www.fnnews.com/news/202502280911299221
- IDC Asia/Pacific PC 시장 전망: https://iconnect007.com/article/149318/asiapacific-pc-market-up-116-in-2025-supply-and-pricing-challenges-loom-for-2026/149315/aep
- MSI AI PC Builder 관련 보도: https://www.tomshardware.com/desktops/pc-building/msis-new-ai-powered-pc-building-assistant-recommends-the-9800x3d-as-a-budget-cpu-ez-pc-builder-specd-out-over-usd1-700-of-parts-for-a-usd1-000-build
