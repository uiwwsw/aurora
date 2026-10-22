# Desktop releases

## Downloads

GitHub Releases에 macOS Apple Silicon·Intel용 DMG/ZIP과 Windows x64용 NSIS EXE를 배포합니다.
README의 운영체제별 버튼은 설치 파일로 직접 연결합니다.
현재 배포는 개발 프리뷰이며 macOS Developer ID 서명·공증, Windows 인증서 서명은 없습니다.
macOS ad-hoc 서명은 개발자 신원 인증이 아닙니다.

## Workflow

1. package.json과 잠금 파일의 버전을 올리고 변경 기록을 작성합니다.
2. 빌드·테스트 후 main에 커밋·푸시합니다.
3. `Desktop release`가 테스트·빌드 후 같은 버전의 태그를 자동 생성합니다. 이미 태그가 있는 버전은 다시 게시하지 않습니다.
4. 직접 만든 버전 태그를 푸시해도 동일한 워크플로를 실행할 수 있습니다.
5. macOS arm64·Intel와 Windows x64 네이티브 러너에서 테스트와 설치 파일 생성을 수행합니다.
6. macOS는 DMG를 마운트해 앱을 복사하고 실행합니다. Windows는 EXE를 임시 경로에 설치하고 실행합니다.
7. 모든 검증이 성공하면 다섯 설치 파일과 체크섬·manifest, blockmap, 업데이트 피드를 draft에 첨부한 뒤 프리릴리스로 공개합니다. macOS의 두 아키텍처 피드는 병합하며 파일별 SHA-512와 크기를 확인합니다.

수동 `workflow_dispatch`는 설치 파일을 Actions artifacts로만 만들며 공개하지 않습니다.
이미 공개한 태그의 설치 파일은 덮어쓰지 않습니다. 수정은 새 버전으로 배포합니다.
다운로드 버튼의 태그·파일명도 새 버전으로 갱신합니다.

## Signing and updates

현재는 배포 인증서가 없으므로 개발 프리뷰 상태를 다운로드 안내에 명시합니다.
보안 경고를 우회하는 스크립트는 제공하지 않습니다.
앱은 시작 시와 6시간마다 GitHub Releases에서 새 개발 프리뷰를 확인합니다. 자동 다운로드 후 재시작을 안내하고 정상 종료 시 설치합니다. 도움말에서 직접 확인할 수 있으며 다운그레이드는 허용하지 않습니다. 0.1.1 이하 버전은 새 설치 파일로 한 번 교체해야 합니다.

macOS 자동 업데이트는 Developer ID 서명이 필요하므로 현재 ad-hoc 배포에서는 비활성화됩니다. macOS CI에는 `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`를 등록합니다. 인증서가 등록되면 정식 서명을 강제하고 공증까지 성공해야 패키징이 통과합니다. Windows 서명은 `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD`를 사용합니다. 비밀값은 GitHub Actions secrets에만 저장하며 앱과 웹에 포함하지 않습니다.

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
