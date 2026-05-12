# 기능별 상세 설계

## 현재 PC 사양 입력

### 수동 입력

필드:
- CPU
- GPU
- RAM 용량
- RAM 타입
- 메인보드
- 저장장치
- 파워
- 모니터
- VR 기기
- 재사용 부품

검증:
- RAM 용량은 숫자
- 파워 용량은 숫자
- 모니터 수는 1 이상
- 알 수 없는 값은 빈 값 대신 `unknown`으로 정규화

### PowerShell JSON 파싱

권장 명령어는 구현 시 한 번에 JSON 객체를 출력하도록 제공한다.

파싱 전략:
- JSON parse 성공 시 필드 매핑
- 용량 단위는 GB로 변환
- GPU가 여러 개면 내장 그래픽보다 외장 그래픽 우선
- 디스크는 배열로 저장

### PowerShell 텍스트 파싱

보조 경로다.

전략:
- CPU, GPU, RAM, BaseBoard, Disk 키워드 기반 분리
- `Capacity`, `Size`는 byte 또는 문자열 단위 모두 처리
- confidence는 JSON보다 낮게 부여
- 누락 필드는 수동 보정 요구

## 게임 선택

### 기본 목록

`/data/games.ts`에 최소 30개 이상 제공한다.

각 게임은 다음 성격을 가진다.
- 공식 요구사양 기반 게임
- 추정치 기반 미출시/예상 게임
- VR 게임
- 경쟁 FPS/고주사율 게임

### 선택 값

게임별로 저장:
- 플레이 빈도
- 목표 옵션

가중치:
- `main`: 1.4
- `often`: 1.2
- `normal`: 1.0
- `rare`: 0.8

옵션 가중치:
- `low`: -1 tier
- `medium`: 0
- `high`: +0.5 tier
- `ultra`: +1 tier

## 비주류 게임 권장사양 붙여넣기

입력:
- Steam 또는 공식 홈페이지의 최소/권장사양 텍스트

MVP 파싱:
- CPU 키워드
- GPU 키워드
- RAM 숫자
- Minimum/Recommended 섹션 구분

출력:
- 권장 GPU 문자열
- 권장 CPU 문자열
- RAM GB
- 추정 demandTier
- confidence
- warnings

실패 처리:
- 파싱 실패해도 원문 저장
- 사용자가 수동으로 demandTier를 선택할 수 있게 한다.

## 작업/멀티태스킹

항목은 체크박스 기반으로 구성한다.

RAM 가중:
- 브라우저 20개 이상: +8GB 후보
- 브라우저 50개 이상: +16GB 후보
- Docker/WSL/로컬 서버: +16GB 후보
- Premiere/DaVinci/Blender: +16GB 후보
- 로컬 AI: 최소 64GB 후보

GPU/VRAM 가중:
- Stable Diffusion/ComfyUI: NVIDIA 가중, VRAM 16GB 이상 후보
- 로컬 LLM: VRAM 16GB 이상 후보
- OBS 방송: NVIDIA 가중

## 모니터/VR

해상도 가중:
- FHD: 기준
- QHD: GPU +1 tier
- UWQHD: GPU +1.5 tier
- 4K: GPU +2 tier

주사율 가중:
- 60~75Hz: 기준
- 100~120Hz: +0.5 tier
- 144~180Hz: +1 tier
- 240Hz 이상: CPU와 GPU 모두 가중

VR:
- GPU +1 tier
- 안정성 warning 추가
- VRAM 권장치 상향

## 가격 수집

### 다나와 텍스트 붙여넣기

파싱 대상:
- 상품명
- 일반 가격
- 혜택 최저가
- 쇼핑몰
- 카드사
- 배송비
- pcode 또는 URL

파싱 결과는 `PriceOffer`로 저장한다.

경고:
- 중고/리퍼 추정
- 해외구매 추정
- 품절 추정
- 배송비 불명
- 카드 조건 불명

### URL/pcode 입력

입력:
- 다나와 상품 URL
- pcode 숫자

처리:
- URL에서 pcode 추출
- API Route 호출
- 캐시 확인
- 크롤러 어댑터 호출
- `PriceSnapshot` 반환

### 수동 가격 입력

필드:
- 상품명
- 가격
- 쇼핑몰
- 카드사
- 배송비
- URL

수동 입력은 confidence를 기본 `medium`으로 둔다.
필드가 부족하면 `low`로 낮춘다.

## 단계별 빌더

각 카테고리에서 후보를 만든다.

후보 역할:
- `budget`: 요구 조건을 만족하는 낮은 가격 후보
- `recommended`: 점수와 안정성 균형 후보
- `premium`: 더 높은 등급 또는 여유 후보

선택 후 영향:
- CPU 선택은 메인보드와 쿨러 후보를 제한한다.
- 케이스 선택 전까지는 GPU/쿨러 길이 호환을 임시 경고로 표시한다.
- 파워는 선택된 CPU/GPU 기준으로 재계산한다.

## 최종 견적

### 텍스트 복사

형식:

```text
[PC 견적]
CPU: ...
쿨러: ...
메인보드: ...
RAM: ...
VGA: ...
SSD: ...
파워: ...
케이스: ...

일반가 합계: ...
혜택가 합계: ...
예상 절감액: ...

주의사항:
- ...
```

### 이미지 저장

구현:
- 최종 견적 영역에 `ref` 지정
- `html-to-image` 또는 동등 패키지로 PNG 저장
- 이미지용 견적 영역은 고정 너비와 명확한 배경색을 가진다.

## 접근성과 UI 기준

- 버튼은 명령형 텍스트와 아이콘을 함께 사용한다.
- 체크박스/라디오/세그먼트 컨트롤을 용도에 맞게 사용한다.
- 가격, 경고, 신뢰도는 색상만으로 구분하지 않고 텍스트 배지를 함께 표시한다.
- 모바일에서 입력 컨트롤이 44px 미만으로 작아지지 않게 한다.
