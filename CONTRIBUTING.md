# Contributing to Aurora

Aurora에 관심을 가져주셔서 감사합니다. **코드·디자인·문서·테스트 기여 모두 환영합니다.**
We welcome code, design, documentation, accessibility, and platform testing contributions.

## 먼저 알아둘 점

Aurora는 **실행 전에 할 일과 예상 토큰을 설명하고, 사용자가 진행 여부를 선택하는 AI 작업 공간**을 목표로 합니다. 의도가 맞는지 확인하고 토큰 소모를 선택할 수 있는 경험이 중심이며, 모델 추천과 대화 정리는 이를 돕는 기능입니다.
v0.1.0은 로컬 프로토타입이며, 실제 AI 실행과 계정 연동은 아직 없습니다.
자동 정리와 레거시 모드를 모두 유지합니다. 추정치·샘플·실제 측정값을 UI와 문서에서 명확히 구분해 주세요.

## 어떤 기여가 필요한가요?

- 작업 의도·범위와 예상 토큰을 먼저 이해하고 진행을 선택하는 UX
- 예상 토큰과 실제 사용량을 비교하는 평가 사례·추정 개선
- macOS·Windows 실행 검증과 재현 가능한 버그 리포트
- 하나의 대화에서 작업을 묶고 보관하는 UX·접근성 개선
- 모델·사용량 어댑터 설계와 제공자가 지원하는 인증 방식 조사
- 토큰 추정 개선, 추천 품질 평가용 공개·비식별 예제
- 테스트, 문서, 한국어·영어 표현 개선

[Issues](https://github.com/uiwwsw/aurora/issues)에서 버그나 제안을 남겨 주세요.
큰 기능이나 의존성 추가는 구현 전에 이슈로 방향을 맞추는 것을 권장합니다.
실제 계정의 토큰·쿠키·API 키나 개인 대화 기록은 이슈·PR·테스트 픽스처에 올리지 마세요.

## 로컬 개발

Node.js 24 이상에서 저장소를 fork하고 자신의 fork를 clone합니다.

```bash
npm ci
npm start
npm run build
npm test
npm run test:desktop
```

macOS에서 UI 검증을 완료했습니다. Windows 결과를 보고할 때는 OS, Node 버전, 실행 명령과 재현 단계를 함께 적어 주세요.
데스크톱 테스트의 QA 프로필은 OS 임시 폴더에 생성하며, 실패 진단을 위해 남겨 둡니다. 관리자 SSD 환경에서는 `./dev npm …`을 사용합니다.

## Pull request

1. fork에서 작업 브랜치를 만듭니다.
2. 변경을 한 가지 문제에 집중하고, 동작 변화가 있으면 의미 있는 테스트를 추가합니다.
3. `npm run build`와 `npm test`를 실행합니다. UI를 바꿨다면 가능한 환경에서 데스크톱 테스트와 스크린샷을 첨부합니다.
4. 무엇을 해결했는지, 어떻게 검증했는지, 아직 검증하지 못한 플랫폼이 있는지 설명합니다.
5. [PR](https://github.com/uiwwsw/aurora/pulls)을 보내 주세요. 설치 산출물·개인 프로필·비밀값은 포함하지 않습니다.

현재 실제 제공자 연결이 없으므로 추천과 정리를 AI가 수행한다고 표현하지 마세요.
계정 한도와 계획용 토큰 예산을 섞거나 근거 없이 퍼센트를 계산하지 마세요.
다른 사람의 작업·개인정보를 존중하고, 재현 가능한 근거를 중심으로 토론해 주세요.

## License

기여한 코드는 프로젝트의 MIT 라이선스로 제공됩니다. 추가 기여 계약은 요구하지 않습니다.
Contributions are licensed under MIT, the same license as this project. No separate CLA is required.
