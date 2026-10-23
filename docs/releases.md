# Desktop releases

## Downloads

GitHub Releases에 macOS Apple Silicon·Intel용 DMG/ZIP과 Windows x64용 NSIS EXE를 배포합니다.
README의 운영체제별 버튼은 설치 파일로 직접 연결합니다.
배포는 개발 프리뷰입니다. 새 공개 릴리스는 macOS 두 아키텍처의 Developer ID 서명·공증을 요구합니다. Windows 서명 상태는 각 릴리스 manifest에서 확인합니다.
macOS ad-hoc 서명은 개발자 신원 인증이 아닙니다.

## Workflow

1. package.json과 잠금 파일의 버전을 올리고 변경 기록을 작성합니다.
2. 검증한 소스 커밋을 보존하고, 해당 커밋에서 플랫폼별 설치 파일을 만듭니다.
3. macOS는 승인된 키체인으로 두 아키텍처를 순차 서명·공증하고 설치 후 실행을 확인합니다.
4. `Windows release packages`는 Windows 네이티브 러너에서 EXE를 빌드·설치·실행하며, Store ID를 제공하면 Store 제출 패키지도 만듭니다.
5. 서명·공증과 설치 검증이 끝난 파일을 `scripts/publish-release.mjs`로 검사한 뒤 draft에 첨부하고 프리릴리스로 공개합니다. macOS 피드를 병합하고 파일별 SHA-512·크기를 확인합니다.

태그 생성이나 main 푸시만으로 보관소 인증정보를 자동 사용하지 않습니다. `Desktop release`는 명시적으로 실행하는 원격 QA 경로이며, 등록된 CI 서명 자격 증명을 사용할 때 별도 운영 승인이 필요합니다.

수동 `workflow_dispatch`는 설치 파일을 Actions artifacts로만 만들며 공개하지 않습니다.
이미 공개한 태그의 설치 파일은 덮어쓰지 않습니다. 수정은 새 버전으로 배포합니다.
다운로드 버튼의 태그·파일명도 새 버전으로 갱신합니다.

## Signing and updates

개발 프리뷰 상태와 플랫폼별 실제 서명 상태를 다운로드 안내에 명시합니다.
보안 경고를 우회하는 스크립트는 제공하지 않습니다.
앱은 시작 시와 6시간마다 GitHub Releases에서 새 개발 프리뷰를 확인합니다. 자동 다운로드 후 재시작을 안내하고 정상 종료 시 설치합니다. 도움말에서 직접 확인할 수 있으며 다운그레이드는 허용하지 않습니다. 0.1.1 이하 버전은 새 설치 파일로 한 번 교체해야 합니다.

macOS 자동 업데이트는 Developer ID 서명이 필요하므로 현재 ad-hoc 배포에서는 비활성화됩니다. macOS CI에는 `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`를 등록합니다. 인증서가 등록되면 정식 서명을 강제하고 공증까지 성공해야 패키징이 통과합니다. Windows 서명은 `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD`를 사용합니다. 로컬 서명은 잠금 해제된 암호화 보관소의 키체인과 `APPLE_KEYCHAIN_PROFILE`·`APPLE_KEYCHAIN` 참조를 사용할 수 있습니다. 비밀값은 앱과 웹에 포함하지 않습니다.

서명 정보는 플랫폼별 build-info에서 release-manifest.json에 기록합니다. 인증서가 없으면 개발 프리뷰임을 유지하며, 서명을 적용해도 Windows SmartScreen의 평판 경고가 즉시 사라지는 것은 보장되지 않습니다.

실제 버전 간 다운로드·설치와 서명된 macOS 업데이트는 별도 배포 환경에서 검증해야 합니다. CI 설치 테스트는 패키지 실행 검증이며 버전 간 업데이트의 실증이 아닙니다.

## Local build

```bash
npm ci
npm run package:mac
# Windows에서:
npm run package:win
```

관리자 SSD 환경에서는 위 명령을 `./dev npm ...`으로 실행합니다.
패키징 래퍼는 `DEV_BUILD_ROOT`가 있으면 Electron과 빌더 캐시도 SSD로 지정합니다.
생성물은 `distribution/<version>/`에 저장하고 자동 정리 대상으로 취급하지 않습니다.

패키지에는 dist, Electron 런타임 코드, 모델 catalog와 필요한 의존성만 포함합니다.
.env, 테스트, QA 프로필, 개발 문서와 도구는 포함하지 않습니다.
설치 앱의 키 설정은 앱 데이터 폴더의 .env 또는 환경변수로 전달합니다.

## Microsoft Store

[Store 제출 패키지 준비](microsoft-store.md)를 참고합니다. Store 심사·서명 전에는 경고 없는 Windows 배포로 표시하지 않습니다.
