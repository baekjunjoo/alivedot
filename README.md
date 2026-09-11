# DotPad Motion Test — 닷 동물놀이터

DotPad 320에서 **6프레임 촉각 애니메이션**을 자동 또는 수동으로 재생하기 위한 React 프로토타입입니다. 초등학생이 동물의 움직임을 손끝으로 탐색할 수 있도록 17종 동물 도감, 프레임별 음성 안내, 자동 재생, 느린 탐색, 움직임 퀴즈, 복습 퀴즈를 제공합니다.

공개 데모는 GitHub Pages에서 제공합니다: <https://baekjunjoo.github.io/alivedot/>

## 주요 기능

- **17종 동물 × 6개 프레임**의 60×40 촉각 그래픽 시퀀스
- DotPad Web SDK v3.0.2를 통한 Bluetooth LE 및 USB 연결
- 기본 2.5fps, 0.5–7.0fps 자동 재생
- 각 프레임을 직접 넘기는 **느린 탐색 모드**
- 동물·프레임별 한국어 음성 설명
- 동작 방식 퀴즈와 탐색 완료 후 동물 맞히기 복습 퀴즈
- 재생 중인 6프레임을 WebM으로 저장하는 미리보기 기능

## 실행

```bash
pnpm install
pnpm dev
```

브라우저에서 표시된 로컬 주소를 열어 사용합니다. 프로덕션 빌드는 다음과 같습니다.

```bash
pnpm check
pnpm build
pnpm start
```

## DotPad 연결 및 현장 테스트

1. **Chrome 또는 Edge**에서 HTTPS 또는 `localhost` 주소를 엽니다.
2. DotPad를 켜고 Bluetooth 또는 USB로 컴퓨터에 연결할 준비를 합니다.
3. 페이지의 **닷패드 연결** 또는 **블루투스 연결 / USB 케이블**을 누릅니다.
4. 브라우저 장치 선택창에서 DotPad를 선택합니다.
5. 동물을 선택한 뒤 **동작 재생** 또는 **느린 탐색 시작**을 누릅니다.

> 브라우저 보안 정책상 Bluetooth/USB 장치 선택은 반드시 사용자 클릭으로 시작해야 합니다. 현장에서는 2.5fps부터 시작해, 핀의 실제 갱신 시간과 아동의 촉각 인지 속도에 맞춰 동물별 속도를 조정하세요.

## 프로젝트 구조

```text
client/src/pages/Home.tsx             # 학습 UI, 재생, 음성, 퀴즈, DotPad 출력 제어
client/src/generatedMotionFrames.ts   # 17종 × 6프레임의 60×40 촉각 데이터
client/src/sdk/DotPadSDK-3.0.2.*      # DotPad Web SDK
client/src/index.css                  # 반응형 학습 UI 스타일
```

## 검증

`pnpm check` 및 `pnpm build`를 통과했습니다. 브라우저에서 17종 도감 선택, 6프레임 느린 탐색, 복습 퀴즈의 오답·정답 흐름을 확인했습니다. 실제 DotPad 핀 출력은 장비 연결 환경에서 최종 검증이 필요합니다.
