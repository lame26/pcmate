# 추천, 가격, 호환성 로직 설계

## 요구 사양 산출

입력:
- 선택 게임
- 커스텀 권장사양
- 작업/멀티태스킹
- 모니터/VR
- 예산
- 선호도

출력:
- `RequirementProfile`

원칙:
- 평균값이 아니라 주력 게임과 최고 요구치를 우선한다.
- 미출시/estimated 데이터는 점수에 반영하되 warning을 남긴다.
- 예산이 있으면 가격 점수에 반영하고, 요구 사양 자체를 낮추지는 않는다.

## 추천 점수

총점:

```ts
totalScore =
  performanceFitScore * 0.35 +
  priceScore * 0.25 +
  compatibilityScore * 0.20 +
  preferenceScore * 0.10 +
  classificationScore * 0.10
```

모든 점수는 0~100으로 정규화한다.

### performanceFitScore

기준:
- 요구 티어보다 낮으면 큰 감점
- 요구 티어와 같으면 85점
- 한 단계 여유면 95점
- 두 단계 이상 높고 예산 초과면 과투자 감점

예:
- 요구 GPU tier 7, 후보 tier 7: 85
- 후보 tier 8: 95
- 후보 tier 10, FHD 60Hz, 예산 초과: 70

### priceScore

기준 가격은 내 카드 기준 effectivePrice다.

계산 순서:
1. 후보의 bestOffer 산출
2. 같은 카테고리/동일 성능 티어 후보와 비교
3. 예산이 있으면 총 예산 대비 예상 비중 비교

점수:
- 동일 티어 하위 25% 가격: 95
- 동일 티어 중앙값 근처: 80
- 동일 티어 상위 25% 가격: 60
- 가격 없음: 40

### compatibilityScore

기본 100점에서 감점한다.

- 확정 호환 불가: 0
- 중요 경고: -30
- 확인 필요: -10
- 정보 부족: -5

critical warning이 있으면 후보 선택 버튼을 비활성화할 수 있다.

### preferenceScore

선호 조건과 맞으면 가점, 어긋나면 감점한다.

- 색상 일치: +10
- RGB 비선호인데 RGB 중심 제품: -10
- 공랭/수랭 선호 일치: +10
- NVIDIA 선호인데 Radeon 후보: -15
- 소음 선호인데 저소음 근거 없음: -5

기본점은 70이다.

### classificationScore

부품 등급과 유통사 정보를 반영한다.

- 브랜드 라인 등급이 요구 빌드 수준에 적절: 80
- 전원부/쿨링 등급 우수: +10
- 유통사 정보 있음: +5
- 정보 부족: -10
- 라인 등급은 높지만 가격이 과도함: -10

## 후보 역할 결정

카테고리별 후보를 점수순으로 정렬한 뒤 역할을 부여한다.

- `budget`: 요구 조건을 만족하는 후보 중 effectivePrice가 낮은 후보
- `recommended`: totalScore가 가장 안정적인 후보
- `premium`: 성능 또는 라인 등급이 한 단계 높은 후보

같은 부품이 여러 역할에 중복되면 다음 순위 후보를 사용한다.

## 카드 혜택가 계산

MVP 계산:

```ts
effectivePrice =
  selectedCardProviderIds.includes(offer.cardProviderId)
    ? offer.benefitPrice ?? offer.basePrice
    : offer.basePrice
```

배송비:

```ts
finalOfferPrice = effectivePrice + (offer.shippingFee ?? 0)
```

카드가 없는 사용자:
- basePrice 기준으로 계산
- cardProviderId가 필요한 혜택가는 적용하지 않음

주의:
- 청구할인, 쿠폰, 멤버십 적립, 할인 한도는 MVP에서 실제 계산하지 않는다.
- 단, `BenefitRule` 타입과 warning으로 향후 확장을 열어둔다.

## bestOffer 선택

우선순위:
1. 사용자가 보유한 카드로 적용 가능한 benefitPrice
2. 일반 basePrice 최저가
3. confidence가 높은 offer
4. 배송비 포함 총액이 낮은 offer

동점 처리:
- confidence가 높은 offer 우선
- updatedAt이 최신인 offer 우선
- 품절/중고/해외구매 warning이 적은 offer 우선

## 가격 신뢰도

입력 요소:
- offer 수
- 마지막 갱신 시각
- 카드 정보 존재 여부
- 배송비 파싱 여부
- 동일 제품 후보 수
- 동일 칩셋 후보 수
- warning 수

점수:

```ts
confidenceScore =
  offerCountScore +
  freshnessScore +
  cardInfoScore +
  shippingScore +
  sameChipsetScore -
  warningPenalty
```

등급:
- 80 이상: high
- 50 이상: medium
- 그 외: low

문구:
- high: 최근 수집 데이터가 충분합니다.
- medium: 일부 조건은 확인이 필요합니다.
- low: 가격 데이터가 부족해 판단 신뢰도가 낮습니다.

## 다나와 크롤러 어댑터

인터페이스:

```ts
export type PriceCrawler = {
  searchProducts(query: string, category?: PartCategory): Promise<PriceSnapshot>;
  getProductOffers(pcode: string): Promise<PriceSnapshot>;
};
```

어댑터 책임:
- 오픈소스 크롤러 호출
- 응답을 `PriceSnapshot`으로 정규화
- warning 부여
- 실패 시 예외 대신 실패 snapshot 반환

캐시 책임:
- pcode별 마지막 요청 시각 저장
- 6시간 이내 재요청 차단
- 캐시가 있으면 반환

실패 처리:
- 네트워크 실패: warning
- HTML 구조 변경: warning
- 차단 의심: warning
- 결과 없음: low confidence snapshot

## 호환성 체크

### CPU, 메인보드, RAM

체크:
- CPU socket == motherboard socket
- motherboard ramType == ram type
- 칩셋이 CPU 세대와 호환 가능한지

MVP에서는 BIOS 세부 버전은 warning만 표시한다.

### 케이스, GPU, 쿨러

체크:
- case.maxGpuLengthMm >= gpu.lengthMm
- air cooler height <= case.maxCoolerHeightMm
- liquid radiator size <= case top/front radiator support
- motherboard formFactor가 case supportedFormFactors에 포함

### 파워

체크:
- psu.wattage >= estimatedSystemWattage * 1.25
- GPU 보조전원 커넥터 충족
- 고성능 GPU는 ATX 3.0/3.1 여부 warning

예상 소비전력:

```ts
estimatedSystemWattage =
  cpu.tdpW * 1.5 +
  gpuBoardPower +
  100
```

권장 파워:
- estimatedSystemWattage에 25~35% 여유
- 최소 650W, 중상급 GPU 이상은 750W 이상 후보

## warning 코드 예시

- `PRICE_LOW_CONFIDENCE`
- `PRICE_CARD_CONDITION_UNKNOWN`
- `GAME_REQUIREMENT_ESTIMATED`
- `CPU_BOARD_SOCKET_MISMATCH`
- `RAM_TYPE_MISMATCH`
- `GPU_CASE_LENGTH_RISK`
- `COOLER_CASE_HEIGHT_RISK`
- `PSU_WATTAGE_LOW`
- `PSU_CONNECTOR_MISSING`
- `CRAWLER_CACHE_USED`
- `CRAWLER_FAILED_FALLBACK_USED`
