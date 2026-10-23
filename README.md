# Aurora · 오로라

**하나의 대화에서 AI 모델과 예상 토큰을 실행 전에 검토하는 데스크톱 작업 공간.**

[한국어](README.md) · [English](README.en.md) · [웹 데모](https://aurora-two-virid.vercel.app/) · [English overview](https://aurora-two-virid.vercel.app/en/) · [문서](docs/README.md)

개발 프리뷰 · [MIT](LICENSE) · macOS / Windows

![Aurora 작업 공간](docs/images/aurora-v0.1.png)

## 바로 체험하기

[브라우저 데모 열기](https://aurora-two-virid.vercel.app/) — 설치 없이 작업 정리, 모델 비교와 토큰 범위 미리보기를 체험합니다. 웹 데모는 외부 AI를 호출하지 않으며, 대화형 화면은 현재 한국어입니다.

실제 제공자 연결과 텍스트 답변 실행은 설치 앱에서 사용합니다. 공개 0.1.2 프리뷰는 내부 분석을 명시적으로 요청하고 실행 모델을 직접 선택하는 흐름입니다. 이름의 *Auto Router · Low AI*는 제품 방향이며, 완성된 자동 라우팅을 뜻하지 않습니다.

## 다운로드 · 0.1.2

| 운영체제 | 설치 파일 |
| --- | --- |
| macOS · Apple Silicon | [DMG](https://github.com/uiwwsw/aurora/releases/download/v0.1.2/Aurora-0.1.2-mac-arm64.dmg) |
| macOS · Intel | [DMG](https://github.com/uiwwsw/aurora/releases/download/v0.1.2/Aurora-0.1.2-mac-x64.dmg) |
| Windows · x64 | [EXE](https://github.com/uiwwsw/aurora/releases/download/v0.1.2/Aurora-0.1.2-windows-x64.exe) |

[ZIP · 변경 기록 · 체크섬과 서명 정보](https://github.com/uiwwsw/aurora/releases/tag/v0.1.2)

macOS는 DMG의 Aurora를 Applications 폴더로 옮기고, Windows는 설치 프로그램을 실행합니다. 일반 사용자는 Node.js를 설치할 필요가 없습니다. 현재 macOS는 ad-hoc 서명이며 Developer ID 서명·공증이 없습니다. Windows도 개발자 인증서 미서명으로 운영체제의 보안 확인이나 실행 제한이 나타날 수 있습니다.

## 주요 기능

- **하나의 대화와 작업 정리:** 관련 대화를 묶고, 보관·휴지통으로 이동하거나 복원합니다. 직접 세션을 관리하는 레거시 모드도 제공합니다.
- **분리된 모델 역할:** 내부 분석 모델과 기본 실행 모델을 따로 설정하고 요청마다 실행 모델을 선택합니다.
- **실행 전 사용량 검토:** 현재 문맥을 포함한 예상 입력·출력 토큰 범위를 비교하고 직접 정한 계획 예산과 대조합니다.
- **실측 사용량 표시:** 제공자가 반환하는 실제 입력·출력 토큰을 예상치와 구분합니다.
- **기기 내 작업 관리:** 검색, 선택적 대화 저장, 라이트·다크 테마를 지원합니다.
- **업데이트:** Windows는 시작할 때와 6시간마다 새 버전을 확인하고 백그라운드로 다운로드합니다.

자동 정리 제안은 로컬 규칙 기반입니다. 모델 추천과 실행은 별개의 동작이며, 현재 텍스트 답변만 지원합니다. 파일 수정·셸 실행은 제공하지 않습니다.

## 토큰 추정과 데이터

토큰 범위는 **문자 수와 모델 등급별 출력 가정**입니다. 모델별 실제 사용 이력에 기반한 정량 예측이나 확정 비용이 아니며, 같은 등급에는 같은 범위를 표시합니다. 예산 비율은 직접 입력한 계획 예산 대비 값으로 계정 잔여 한도를 뜻하지 않습니다.

호출별 생성 상한은 내부 분석 2,048토큰, 본 작업 4,096토큰입니다. 입력과 분석 비용은 별도이며 전체 작업의 강제 예산 제한은 아닙니다. 출력 상한에 도달하면 응답이 미완성일 수 있습니다. 정해진 토큰으로 기능 완성을 보장하지 않습니다.

웹 미리보기는 대화를 AI 제공자에게 전송하지 않습니다. 설치 앱에서 제공자 호출을 실행하면 요청과 선택한 문맥을 해당 제공자에게 전송합니다. 대화 저장은 기본 꺼짐이며, 켜면 현재 기기에 기록합니다. 암호화 보관함은 아닙니다. 저장을 끄면 저장 사본을 제거하고 현재 창의 대화는 유지합니다.

제공자 연결의 일반적인 설정 방법은 [구성 가이드](docs/configuration.md)를 참고하세요.

## 앱 업데이트

0.1.2부터 Windows는 새 버전을 다운로드한 뒤 재시작을 안내합니다. 지금 재시작하거나 정상 종료 시 설치할 수 있고, 도움말의 **업데이트 확인…**에서도 확인할 수 있습니다. 재시작 전에 저장하지 않은 대화·초안을 확인하세요.

macOS 자동 업데이트에는 Developer ID 서명이 필요합니다. 현재 ad-hoc 개발 프리뷰에서는 비활성화되어 새 설치 파일로 교체해야 합니다. 0.1.1 이하 버전에는 업데이터가 없으므로 새 버전으로 수동 교체해야 합니다. 실제 버전 간 자동 업데이트는 별도 검증이 필요합니다.

## 소스에서 실행

Node.js 24 이상이 필요합니다.

```bash
git clone https://github.com/uiwwsw/aurora.git
cd aurora
npm ci
npm start
```

| 명령 | 용도 |
| --- | --- |
| `npm run build` | 데스크톱 프런트엔드 타입 검사·빌드 |
| `npm run build:web` | 한국어 데모·영어 소개와 검색 메타데이터 생성 |
| `npm test` | 도메인·제공자 어댑터·업데이트·웹 생성 검증 |
| `npm run test:desktop` | 독립 QA 프로필로 Electron UI 검증 |
| `npm run package:mac` | macOS DMG·ZIP 생성 |
| `npm run package:win` | Windows에서 x64 EXE 생성 |

모델 API 테스트는 모의 응답을 사용합니다. 라이브 제공자 응답, 전체 작업 비용 제어, 추천 품질은 별도 평가가 필요합니다. 로컬 개발은 저장소의 `AGENTS.md`와 실행 래퍼를 따릅니다.

## 배포와 문서

버전을 올려 main에 반영하면 GitHub Actions가 검증·태그 생성·플랫폼별 패키징·설치 후 실행 확인을 거쳐 릴리스를 게시합니다. 같은 버전의 일반 변경은 설치 파일을 다시 게시하지 않습니다. 웹은 Vercel의 main 자동 배포를 사용하며, 테스트 배포는 검색 색인에서 제외합니다.

- [문서 목차](docs/README.md)
- [릴리스와 서명·자동 업데이트](docs/releases.md)
- [구성 가이드](docs/configuration.md)
- [제품 비전과 실행 예산 설계](docs/product-vision.md)
- [웹 검색 구조](docs/seo.md)
- [기여 방법](CONTRIBUTING.md) · [Issues](https://github.com/uiwwsw/aurora/issues)

[MIT 라이선스](LICENSE). SUITE 글꼴은 [별도 라이선스](public/fonts/LICENSE)를 따릅니다.

<!-- ai-training-notice -->
## AI 학습·수집 반대 / AI training notice

사전 서면 동의 없는 AI 학습·미세조정 및 학습용 데이터 수집에 반대합니다. No AI training, fine-tuning or training-data collection without prior written consent.

[전문 / Full notice](AI-TRAINING-NOTICE.md). 기존 라이선스와 제삼자·사용자 콘텐츠의 권리는 유지됩니다. Existing licenses and third-party/user rights remain unchanged.
