# 프로젝트명
PC 견적 빌드업 웹앱

# 문서 기준

MVP 범위와 주요 제품/기술 의사결정은 `docs/mvp-decisions.md`를 우선 기준으로 한다.

새 작업 세션에서는 `docs/work-trigger.md`를 먼저 읽고 현재 상태와 작업 히스토리를 확인한다.

상세설계 문서 목록은 `docs/00-index.md`에서 확인한다.

이 README는 초기 제품 설계안과 상세설계서 작성 요구사항을 담고 있으며, 구현 단계에서는 확정된 MVP 의사결정 문서와 상세설계 문서를 함께 참조한다.

# 서비스 한 줄 정의
사용자의 현재 PC 사양, 사용 목적, 게임, 작업/멀티태스킹, 모니터 환경, 보유 카드 정보를 바탕으로 적정 PC 견적을 단계별로 빌드업하고, 보유 카드 기준 혜택 최저가까지 반영해 최종 결제 예상 금액을 계산해주는 웹앱.

# 핵심 컨셉
일반 견적 사이트처럼 부품을 한 번에 나열하는 방식이 아니라, 사용자가 실제로 PC 견적을 고민하는 흐름에 맞춰 다음 순서로 진행한다.

1. 보유 카드 선택
2. 현재 PC 사양 입력 또는 가져오기
3. 게임 리스트 체크
4. 비주류 게임 권장사양 붙여넣기 분석
5. 최대 멀티태스킹 환경 체크
6. 모니터/VR/해상도/주사율 체크
7. 색상/쿨링/케이스 크기/RGB 등 물리적·감성적 선호도 체크
8. 다나와 가격 수집 또는 붙여넣기 파싱
9. 사양 요구치 산출
10. 카테고리별 후보군 생성
11. 내 카드 혜택가 기준으로 후보 정렬
12. CPU → 쿨러 → 메인보드 → RAM → VGA → SSD → 파워 → 케이스 순서로 단계별 픽스
13. 최종 견적표 출력
14. 일반 최저가 합계, 보유 카드 기준 혜택가 합계, 총 절감액, 카드별 결제 요약 출력

# 중요한 방향성
“바꿔/말어”처럼 단정하는 기능은 넣지 않는다.

대신 다음처럼 보여준다.
- 현재 사양 판독
- 업그레이드 우선순위
- 적정 사양 티어
- 병목 가능성
- 과투자 가능성
- 부품별 가격/혜택가/추천 이유
- 가격 데이터 신뢰도

서비스의 톤은 판매 유도형이 아니라, 보수적이고 신뢰성 있는 상담형이어야 한다.

예:
좋은 표현:
- 현재 용도 기준으로는 RTX 5070급이 적정선입니다.
- RTX 5070 Ti 이상은 장기성은 좋지만 현재 모니터 환경에서는 과투자 가능성이 있습니다.
- 이 가격은 카드 조건이 맞을 때만 유효합니다.
- 가격 데이터가 부족해 판단 신뢰도는 낮음입니다.

피해야 할 표현:
- 무조건 사세요
- 역대급
- 안 사면 손해
- 최강 가성비
- 무조건 정답

# 작업 환경
- GitHub Codespace
- Codex CLI
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- localStorage 우선
- MVP에서는 로그인/DB 없이 시작
- 향후 Supabase 확장 고려
- 다나와 크롤링은 GitHub 오픈소스 크롤러/CLI 참고를 전제로 구조 설계

# MVP 기술 스택
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand 또는 React Context
- localStorage
- 초기 부품 데이터는 /data/parts.ts 하드코딩
- 가격 데이터는 /data/offers.ts 또는 Part.offers에 하드코딩
- 다나와 텍스트 붙여넣기 파싱 기능 포함
- 다나와 pcode 기반 크롤러 인터페이스는 설계에 포함
- 실제 자동 크롤링은 MVP에서 mock 또는 interface 수준으로 시작 가능

# 주요 사용자
1. 컴퓨터를 바꾸고 싶은데 어느 정도 사양이 맞는지 모르는 사람
2. 기존 PC에서 일부만 업그레이드할지 전체 교체할지 고민하는 사람
3. 게임/작업/VR/코딩 등 사용 목적별 적정 견적을 알고 싶은 사람
4. 다나와, 퀘사이존, 핫딜을 보지만 실제 체감가 계산이 어려운 사람
5. 카드 할인, 쿠폰, 즉시할인까지 반영한 최종 결제금액을 알고 싶은 사람

# 핵심 차별점
1. 체크박스 기반 사양 판독
2. 게임별 요구 사양 기반 추천
3. 최대 멀티태스킹 기준 RAM/CPU/GPU 필요도 산출
4. 단계별 부품 픽스형 견적 빌드업
5. 보유 카드 기준 혜택 최저가 계산
6. 다나와 가격 텍스트 붙여넣기 파싱
7. 향후 다나와 pcode 기반 크롤링 확장
8. 단순 상/중/하가 아니라 칩셋 성능, 브랜드 라인, 유통사, 가격 위치를 분리한 부품 등급 분류

# 현재 PC 사양 입력 기능

## 입력 방식 1: 수동 입력
필드:
- CPU
- GPU
- RAM 용량
- RAM 타입
- 메인보드
- 저장장치
- 파워
- 모니터 해상도
- 모니터 주사율
- 모니터 수
- VR 기기 여부
- 기존 부품 재사용 여부

## 입력 방식 2: PowerShell 결과 붙여넣기
웹에서 “내 PC 사양 가져오기” 버튼을 제공한다.

사용 흐름:
1. 버튼 클릭
2. PowerShell 명령어 복사
3. 사용자가 터미널에서 실행
4. 결과 복사
5. 웹에 붙여넣기
6. CPU/GPU/RAM/보드/디스크 정보 자동 파싱

PowerShell 예시:
Get-CimInstance Win32_Processor | Select-Object Name
Get-CimInstance Win32_VideoController | Select-Object Name
Get-CimInstance Win32_PhysicalMemory | Select-Object Capacity, Speed, Manufacturer
Get-CimInstance Win32_BaseBoard | Select-Object Manufacturer, Product
Get-PhysicalDisk | Select-Object FriendlyName, Size, MediaType

MVP에서는 수동 입력 + PowerShell 붙여넣기 파싱까지만 구현한다.

# 게임 용도 체크 설계

장르 체크가 아니라 게임명을 개별 체크하는 방식으로 만든다.

초기 기본 게임 리스트는 최소 30개 이상 제공한다.

예시 게임 리스트:
- 리그 오브 레전드
- 발로란트
- 오버워치 2
- 배틀그라운드
- 에이펙스 레전드
- 포트나이트
- 로스트아크
- 검은사막
- 메이플스토리
- 던전앤파이터
- FC 온라인
- 스타크래프트 리마스터
- 디아블로 4
- 팰월드
- 몬스터헌터 와일즈
- 엘든 링
- 사이버펑크 2077
- 스타필드
- 발더스 게이트 3
- 호그와트 레거시
- 레드 데드 리뎀션 2
- GTA V
- GTA VI 대비
- 마인크래프트 쉐이더
- 시티즈 스카이라인 2
- MS 플라이트 시뮬레이터
- 헬다이버즈 2
- 퍼스트 디센던트
- 바자르
- 붉은사막
- VRChat
- 비트세이버
- 하프라이프 Alyx
- 메타퀘스트 PCVR 일반

각 게임은 다음 정보를 가져야 한다.
- id
- name
- aliases
- genre
- demandTier: veryLow | low | medium | high | veryHigh | extreme
- cpuSensitivity: 1~5
- gpuSensitivity: 1~5
- ramRecommendedGb: 16 | 32 | 64
- vramRecommendedGb: 6 | 8 | 12 | 16 | 24
- supportsRayTracing 여부
- vrGame 여부
- onlineCompetitive 여부
- notes

사용자는 각 게임에 대해 플레이 빈도를 선택할 수 있어야 한다.
- 가끔
- 보통
- 자주
- 주력

또한 목표 옵션을 선택할 수 있어야 한다.
- 낮음
- 중간
- 높음
- 울트라

여러 게임을 선택하면 평균이 아니라 가장 고사양 게임과 주력 게임을 기준으로 권장 사양을 산출한다.

예:
- 롤 + 배그 + 검은사막 + 붉은사막 선택
→ 롤 기준이 아니라 검은사막/붉은사막 기준으로 GPU/CPU/RAM 티어를 산출

# 비주류 게임 권장사양 붙여넣기 기능

사용자가 Steam/공식 홈페이지의 최소/권장사양을 복붙하면 분석한다.

예:
Minimum:
CPU: Intel i5-8400
RAM: 16GB
GPU: GTX 1060

Recommended:
CPU: Ryzen 5 5600X
RAM: 16GB
GPU: RTX 3060 Ti

분석 결과 예:
- 권장 GPU 기준: RTX 3060 Ti급
- 현재 추천 GPU 티어: RTX 4060 Ti~RTX 5070
- FHD 144Hz 이상 목표 시 RTX 5070급 권장

MVP에서는 AI 분석이 아니라 정규식/키워드 매칭으로 시작해도 된다.

# 작업/멀티태스킹 입력 설계

작업 용도를 단순 카테고리로 묶지 말고, 실제 동시에 켜는 프로그램을 체크박스로 잘게 쪼갠다.

기본 항목:
- 크롬/엣지 탭 10개 이하
- 크롬/엣지 탭 20개 이상
- 크롬/엣지 탭 50개 이상
- 유튜브/넷플릭스
- 카카오톡
- 디스코드
- 음악 스트리밍

게임 중 동시 실행:
- 게임 + 유튜브
- 게임 + 디스코드
- 게임 + 브라우저 다수
- 게임 + VS Code
- 게임 + OBS 녹화
- 게임 + OBS 방송
- 게임 + 메타퀘스트 링크

개발/작업:
- VS Code
- Codex/Cursor/Claude Code
- WSL
- Docker
- 로컬 서버
- DB 서버
- Figma
- Photoshop
- Premiere/DaVinci
- Blender/CAD
- Stable Diffusion/ComfyUI
- 로컬 LLM

판정 예:
- 게임 + 유튜브 + 카톡 + VS Code → RAM 32GB 권장
- 게임 + OBS 방송 → CPU/GPU 인코딩 고려, NVIDIA 가중
- Docker/WSL/로컬서버 + 브라우저 50개 → RAM 64GB 후보
- Stable Diffusion/로컬 LLM → NVIDIA 우선, VRAM 16GB 이상 후보

# 모니터/주변기기 체크

해상도:
- FHD
- QHD
- UWQHD 3440x1440
- 4K

주사율:
- 60~75Hz
- 100~120Hz
- 144~180Hz
- 240Hz 이상

모니터 수:
- 1대
- 2대
- 3대 이상

기타:
- 메타퀘스트 / VR 사용
- 태블릿 보조모니터
- 캡처보드 사용

# 선호도 입력 수정

초기 입력에서 다음은 제외한다.
- 가성비 우선
- 중급기 이상
- 오래 쓰기
- 중고 가능
- 신품만

이유:
사용자는 처음부터 가성비/상급기 판단을 하기 어렵고, 이 선택은 부품 추천 단계에서 가격과 후보를 보고 선택하는 것이 자연스럽다.

초기 선호도에는 물리적/감성적 제약만 받는다.

입력 항목:
- 색상: 블랙 / 화이트 / 상관없음
- 쿨링: 공랭 선호 / 수랭 선호 / 상관없음
- RGB: RGB 선호 / RGB 싫음 / 상관없음
- 케이스 크기: 미니타워 / 미들타워 / 빅타워 제외 / 상관없음
- 소음: 조용한 편이 좋음 / 상관없음
- GPU 브랜드: NVIDIA 선호 / Radeon 가능 / 상관없음
- 기존 부품 재사용: 기존 SSD 재사용 / 기존 케이스 재사용 / 기존 파워 재사용

# 보유 카드 선택 기능

사용자는 본인이 가진 카드를 체크한다.

카드/혜택 항목:
- 삼성카드
- 현대카드
- 신한카드
- 하나카드
- KB국민카드
- 롯데카드
- 우리카드
- 농협카드
- 스마일카드
- 쿠팡와우
- 네이버페이 멤버십
- 페이북

중요:
부품 추천 전에 보유 카드와 가격 데이터를 먼저 확보한다.
보유 카드 기준 혜택가를 계산한 뒤, 그 가격을 포함해서 부품 후보를 추천한다.

즉 추천 순서는 다음과 같다.
1. 보유 카드 선택
2. 가격 수집/크롤링 데이터 확보
3. 각 부품 카테고리에서 후보군 생성
4. 보유 카드 기준 혜택가 계산
5. 성능/호환/가격 기준으로 후보 정렬
6. 절약형/추천형/상급형 후보 제시
7. 사용자가 픽스

# 부품 후보 카드 설계

각 단계 후보 카드에는 가격이 반드시 포함되어야 한다.

표시 정보:
- 모델명
- 추천 유형: 절약형 / 추천형 / 상급형
- 성능 티어
- 제품 라인 등급
- 일반 최저가
- 내 카드 혜택가
- 적용 카드
- 쇼핑몰
- 배송비
- 가격 판정
- 가격 신뢰도
- 장점
- 단점
- 호환성 경고
- 선택 버튼

예시:
MSI RTX 5070 VENTUS 3X OC

추천 유형: 추천형
성능 티어: RTX 5070
제품 라인 등급: 중급
일반 최저가: 975,000원
내 카드 혜택가: 909,000원
적용 카드: 삼성카드
쇼핑몰: 롯데하이마트
배송비: 무료
가격 판정: 현재 후보 중 저렴한 편
가격 신뢰도: 중간

장점:
- 3팬
- MSI 브랜드
- RTX 5070 중 가격 우수

단점:
- 12GB VRAM
- 5070 Ti와 가격 차이 확인 필요

[이걸로 픽스]

# 추천 점수 계산

추천 점수는 성능만이 아니라 가격을 포함해야 한다.

예시 가중치:
recommendationScore =
  performanceFitScore * 0.35 +
  priceScore * 0.30 +
  compatibilityScore * 0.15 +
  preferenceScore * 0.10 +
  brandWarrantyScore * 0.10

priceScore는 반드시 내 카드 혜택가 기준으로 계산한다.

# 다나와 가격 수집 기능

GitHub 오픈소스 다나와 크롤러/CLI 참고를 전제로 설계한다.

단, MVP에서 실시간 자동 크롤링이 완성되지 않아도 앱은 작동해야 한다.

구조:
1. 다나와 텍스트 붙여넣기 파싱
2. 다나와 상품 URL / pcode 등록
3. GitHub 오픈소스 크롤러 참고
4. 서버 크롤러 + 캐시 DB
5. 카드별 혜택가 자동 계산

## 1단계: 붙여넣기 파싱
사용자가 다나와 검색 결과 텍스트를 붙여넣으면 자동 파싱한다.

입력 예:
MSI 지포스 RTX 5070 벤투스 3X OC D7 12GB
혜택 최저가
909,000원 [롯데하이마트] 삼성카드

파싱 결과:
{
  "name": "MSI 지포스 RTX 5070 벤투스 3X OC D7 12GB",
  "benefitPrice": 909000,
  "mall": "롯데하이마트",
  "card": "삼성카드"
}

## 2단계: URL/pcode 등록
사용자가 다나와 상품 URL을 입력하면 pcode를 추출한다.

예:
https://prod.danawa.com/info/?pcode=77961944

결과:
{
  "pcode": "77961944",
  "category": "gpu",
  "name": "MSI RTX 5070 벤투스 3X OC"
}

## 3단계: 서버 크롤러 구조
Next.js Route Handler:
/app/api/prices/danawa/route.ts

입력:
- pcode
- searchQuery
- category

출력:
- productName
- baseLowestPrice
- benefitLowestPrice
- mall
- card
- shippingFee
- updatedAt
- confidence
- offers

크롤링 정책:
- 같은 pcode는 6시간 이내 재크롤링 금지
- DB 또는 local cache 우선
- 실패 시 기존 캐시 반환
- 실패해도 견적 앱 전체는 동작
- 가격 변동 가능 안내 표시
- robots.txt 및 사이트 정책 준수 안내 표시
- 과도한 요청 방지

MVP에서는 실제 크롤링 함수는 mock 또는 placeholder로 시작해도 되지만, 인터페이스와 API 구조는 반드시 만들어야 한다.

PriceCrawler 인터페이스 예:
interface PriceCrawler {
  searchProducts(query: string): Promise<CrawledProduct[]>;
  getProductOffers(pcode: string): Promise<PriceOffer[]>;
}

# 가격 판정 설계

실시간 시세 판정은 불확실하므로 가격 판정에는 신뢰도 표시를 둔다.

절대 사용하지 말아야 할 표현:
- 역대가
- 무조건 구매
- 안 사면 손해

대신 다음처럼 표현한다.
- 현재 수집된 후보 중 저렴한 편
- 보유 카드 기준 현재 최저 후보
- 최근 입력 데이터 기준 구매 가능 가격
- 상위 모델과 가격 차이 확인 필요
- 가격 데이터 부족으로 판단 보류

가격 신뢰도 기준:
- offer 수
- 마지막 갱신 시각
- 카드 정보 존재 여부
- 배송비 파싱 여부
- 동일 제품 후보 수
- 동일 칩셋 후보 수

예:
가격 판정: 좋음
신뢰도: 중간
근거: 최근 수집 데이터 8개, 최저가 갱신 3시간 전

또는:
가격 판정: 판단 보류
신뢰도: 낮음
근거: 가격 데이터 1개뿐이며 카드 조건 불명확

# 부품 등급 분류 설계

중요:
부품 등급은 단순히 브랜드만 보고 상/중/하로 나누면 안 된다.

예:
MSI Gaming Trio는 MSI 라인 안에서 최상급이 아니라 중상급~상급 초입에 가깝다.
SUPRIM / Vanguard / Lightning 등이 더 상위 라인일 수 있다.

따라서 부품 등급은 다음을 분리해서 계산해야 한다.

1. 칩셋/기본 성능 등급
2. 브랜드 내 제품 라인 등급
3. 실제 쿨링/전원부/구성 등 하드웨어 품질
4. 유통사/AS/보증기간
5. 보유 카드 기준 실구매가
6. 동일 칩셋 후보군 내 상대가격
7. 가격 데이터 신뢰도

후보 추천 화면에서는 “상/중/하”를 단독으로 쓰지 말고 다음 배지를 함께 표시한다.
- 성능 등급
- 제품 라인 등급
- 가격 등급
- 추천 유형

예:
[성능] RTX 5070
[라인] 중급
[가격] 좋음
[추천] 가성비형

또는:
[성능] RTX 5070
[라인] 중상급
[가격] 비싼 편
[추천] 감성형

# VGA 라인업 예시

MSI:
- VENTUS: 보급~중급
- SHADOW: 보급~중급
- GAMING: 중급
- GAMING TRIO: 중상급
- VANGUARD: 상급
- SUPRIM: 최상급
- LIGHTNING: 플래그십/특수 라인

ASUS:
- DUAL: 보급
- PRIME: 보급~중급
- TUF: 중상급~상급
- ROG STRIX: 상급~최상급
- ROG ASTRAL: 최상급/플래그십

GIGABYTE:
- WINDFORCE: 보급~중급
- EAGLE: 보급~중급
- GAMING OC: 중급~중상급
- AERO: 중상급/화이트 감성
- AORUS ELITE: 상급
- AORUS MASTER: 최상급
- AORUS XTREME: 플래그십

ZOTAC:
- Twin Edge: 보급
- SOLID: 중급
- SOLID OC: 중급
- AMP: 중상급
- AMP Extreme: 상급~최상급

PALIT/GAINWARD:
- DUAL: 보급
- INFINITY 3: 보급~중급 3팬
- GamingPro: 중급~중상급
- GameRock: 상급
- HOF 계열: 최상급/특수 라인

COLORFUL:
- Battle-AX: 보급
- Ultra: 중급
- iGame Advanced: 중상급
- iGame Vulcan: 상급
- Kudan: 플래그십

PNY:
- VERTO: 보급~중급
- XLR8: 중급~중상급
- XLR8 EPIC-X: 중상급~상급

# 메인보드 라인업 예시

ASUS:
PRIME < TUF < ROG STRIX < ROG CROSSHAIR

MSI:
PRO < BAZOOKA/일반 < MORTAR < TOMAHAWK < CARBON < ACE/GODLIKE

GIGABYTE:
UD/K < GAMING < AORUS ELITE < AORUS PRO < AORUS MASTER < AORUS XTREME

ASRock:
PRO RS < Steel Legend < PG Riptide < Taichi

메인보드 판정 요소:
- 전원부
- 칩셋
- M.2 개수
- PCIe 5.0 여부
- Wi-Fi/BT
- LAN 속도
- 오디오 칩셋
- BIOS Flashback
- 디버그 LED
- USB 구성
- 가격

# RAM 등급 기준

RAM은 브랜드 라인보다 다음이 중요하다.
- 클럭
- 타이밍
- EXPO/XMP 지원
- 모듈 제조사
- 방열판 품질
- 높이
- RGB 여부
- 유통사/AS

예:
AM5 추천 기준:
- DDR5-6000
- CL30
- EXPO 지원
- 32GB 16x2
- 가능하면 SK하이닉스 모듈

# 파워 등급 기준

파워는 브랜드 라인보다 다음을 중요하게 본다.
- 정격 출력
- 80PLUS / Cybenetics
- ATX 3.1
- 12V2x6 네이티브
- 보증기간
- 풀모듈러 여부
- 제조 플랫폼
- 브랜드/유통사
- 실측 리뷰 가능 여부

라인 예:
마이크로닉스:
Classic II Bronze < Classic II Gold < WIZMAX 상위

Seasonic:
A12 < CORE < FOCUS < PRIME

SuperFlower:
Combat < Leadex III < Leadex VII < Leadex Platinum/Titanium

Corsair:
CX < RM/RMe < RMx < HX/AX

# 케이스 등급 기준

케이스는 상중하보다 용도 적합성이 중요하다.
판정 요소:
- 상단 360 수랭 호환
- VGA 길이
- 전면 메쉬
- 팬 기본 구성
- 팬허브
- 선정리 공간
- 소음
- 크기
- 감성
- 가격

# 데이터 구조 요구

다음 타입들을 상세설계에 포함해라.

- UserProfile
- CurrentPcSpec
- UsageProfile
- SelectedGame
- GameProfile
- MultitaskingProfile
- UserPreferences
- CardProvider
- Part
- PartClassification
- PartLineTier
- MarketPosition
- PriceOffer
- PriceSnapshot
- PriceConfidence
- RecommendationCandidate
- Build
- PricingSummary
- BuildWarning

PartClassification 예:
type PartClassification = {
  chipTier?: string;
  brandLineTier: PartLineTier;
  marketPosition: MarketPosition;
  distributorScore?: number;
  warrantyYears?: number;
  confidence: "low" | "medium" | "high";
  reasons: string[];
};

# 화면 구성 요구

상세설계에 다음 화면을 포함해라.

1. 홈
- 새 견적 만들기
- 기존 견적 불러오기
- 다나와 텍스트 붙여넣기 분석
- 현재 PC 사양 가져오기

2. 현재 사양 입력 화면
- 수동 입력
- PowerShell 명령어 복사
- 결과 붙여넣기
- 자동 파싱

3. 보유 카드 선택 화면
- 카드 체크박스
- 멤버십 체크박스

4. 게임 선택 화면
- 30개 이상 게임 리스트
- 검색
- 플레이 빈도
- 목표 옵션
- 비주류 게임 권장사양 붙여넣기

5. 멀티태스킹 선택 화면
- 동시에 켜는 프로그램 체크박스
- 개발/작업/OBS/VR/로컬AI 항목

6. 모니터/주변기기 화면
- 해상도
- 주사율
- 모니터 수
- VR 여부

7. 선호도 화면
- 색상
- 수랭/공랭
- RGB
- 케이스 크기
- NVIDIA/Radeon 선호
- 기존 부품 재사용

8. 사양 판독 결과 화면
- 현재 사양 요약
- 용도 요약
- CPU/GPU/RAM/PSU 필요도
- 병목 가능성
- 과투자 가능성
- 추천 빌드 타입
- 업그레이드 우선순위

9. 가격 수집 화면
- 다나와 텍스트 붙여넣기
- 다나와 URL/pcode 등록
- 수동 가격 입력
- 가격 스냅샷 목록
- 가격 신뢰도

10. 단계별 빌드업 화면
- 좌측 단계 진행바
- 중앙 후보 카드 3개
- 우측 현재 선택 견적 요약
- 각 후보에 가격/혜택가/카드/라인등급/추천유형 표시

11. 최종 견적 화면
- 부품별 최종 선택
- 일반 최저가
- 내 카드 혜택가
- 적용 카드
- 쇼핑몰
- 배송비
- 할인액
- 전체 일반가 합계
- 전체 혜택가 합계
- 총 절감액
- 카드별 결제 요약
- 주의사항
- 복사/저장/공유 버튼

# 프로젝트 폴더 구조 초안

/app
  /page.tsx
  /spec
    /page.tsx
  /cards
    /page.tsx
  /games
    /page.tsx
  /usage
    /page.tsx
  /diagnosis
    /page.tsx
  /pricing
    /page.tsx
  /builder
    /page.tsx
  /summary
    /page.tsx
  /api
    /prices
      /danawa
        /route.ts
    /spec
      /parse
        /route.ts

/components
  /layout
  /spec
  /cards
  /games
  /usage
  /diagnosis
  /builder
  /pricing
  /summary
  /ui

/data
  parts.ts
  games.ts
  rules.ts
  cards.ts
  brandLines.ts
  priceGuides.ts
  sampleBuilds.ts

/lib
  /diagnosis
    score.ts
    rules.ts
  /pricing
    parser.ts
    offers.ts
    calculator.ts
    danawa.ts
    confidence.ts
  /classification
    brandLines.ts
    classifyPart.ts
  /compatibility
    check.ts
  /spec
    powershellParser.ts
    requirementParser.ts
  /storage
    localBuild.ts

/types
  pc.ts
  parts.ts
  pricing.ts
  build.ts
  games.ts
  diagnosis.ts

# MVP 범위

MVP 필수:
1. 보유 카드 선택
2. 현재 PC 사양 수동 입력
3. PowerShell 결과 붙여넣기 파싱
4. 게임 30개 이상 체크 리스트
5. 비주류 게임 권장사양 붙여넣기 분석
6. 멀티태스킹 세부 체크박스
7. 모니터/VR 체크
8. 색상/쿨링/크기/RGB 선호도
9. 가격 수집 모듈 인터페이스
10. 다나와 텍스트 붙여넣기 파싱
11. 부품 후보 카드에 가격 표시
12. 내 카드 기준 혜택가 계산
13. 단계별 절약형/추천형/상급형 후보 추천
14. 부품 라인 등급 분류
15. 최종 견적표
16. 가격 신뢰도 표시
17. localStorage 저장

MVP 제외:
1. 로그인
2. 완전 자동 실시간 크롤링 완성
3. 가격 히스토리 그래프
4. 가격 알림
5. 커뮤니티
6. 결제 연동
7. 모바일 완성도 최적화

단, 자동 크롤링은 제외하더라도 구조와 인터페이스는 처음부터 포함한다.

# 예시 샘플 빌드 데이터

테스트용으로 다음 샘플을 포함해라.

현재 PC:
- CPU: Intel i7-8700K
- GPU: GTX 1080
- RAM: DDR4 16GB
- Monitor: FHD 160Hz 듀얼
- VR: Meta Quest 3 주 2회
- Usage: VS Code + Codex, 유튜브, 카카오톡
- Games: 롤, 배그, 검은사막, 바자르, 붉은사막 관심

추천 예시 빌드:
- CPU: Ryzen 7 7800X3D
- 쿨러: ARCTIC Liquid Freezer III PRO 360
- 보드: MSI MAG B850M 박격포 WIFI
- RAM: ESSENCORE KLEVV DDR5-6000 CL30 FIT V 32GB 블랙
- VGA: MSI RTX 5070 벤투스 3X OC D7 12GB
- SSD: 기존 SSD 재사용
- PSU: 마이크로닉스 Classic II 850W Gold 풀모듈러 ATX3.1
- CASE: 3RSYS L600 Quiet 블랙

# 상세설계서 출력 요구

너는 지금 코드를 작성하지 말고, 먼저 상세설계서를 작성해야 한다.

상세설계서에는 반드시 다음을 포함해라.

1. 서비스 개요
2. 사용자 플로우
3. 화면별 상세 기능
4. 컴포넌트 구조
5. 데이터 타입 설계
6. 데이터 파일 설계
7. 추천 로직 설계
8. 가격 수집/파싱 설계
9. 카드 혜택가 계산 로직
10. 부품 등급/라인 분류 로직
11. 가격 신뢰도 산출 로직
12. 호환성 체크 로직
13. localStorage 저장 구조
14. API Route 설계
15. MVP 개발 순서
16. 향후 확장 계획
17. Codex CLI로 개발할 때의 작업 단위별 프롬프트 초안

코드는 아직 작성하지 말고, 개발자가 그대로 구현에 들어갈 수 있을 정도로 상세하고 체계적인 설계서를 작성해라.
