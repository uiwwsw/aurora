# Desktop releases

## Downloads

GitHub Releases에 macOS Apple Silicon·Intel용 DMG/ZIP과 Windows x64용 NSIS EXE를 배포합니다.
README의 운영체제별 버튼은 설치 파일로 직접 연결합니다.
현재 배포는 개발 프리뷰이며 macOS Developer ID 서명·공증, Windows 인증서 서명은 없습니다.
macOS ad-hoc 서명은 개발자 신원 인증이 아닙니다.

## Workflow

1. package.json과 잠금 파일의 버전을 올리고 변경 기록을 작성합니다.
2. 빌드·테스트 후 main에 커밋·푸시합니다.
3. 같은 버전의 태그를 만듭니다. 예: `git tag -a v0.1.1 -m "Aurora 0.1.1"`.
4. 태그를 푸시하면 `Desktop release` 워크플로가 시작됩니다.
5. macOS arm64·Intel와 Windows x64 네이티브 러너에서 테스트와 설치 파일 생성을 수행합니다.
6. macOS는 DMG를 마운트해 앱을 복사하고 실행합니다. Windows는 EXE를 임시 경로에 설치하고 실행합니다.
7. 모든 검증이 성공하면 다섯 설치 파일과 체크섬·manifest를 draft에 첨부한 뒤 프리릴리스로 공개합니다.

수동 `workflow_dispatch`는 설치 파일을 Actions artifacts로만 만들며 공개하지 않습니다.
이미 공개한 태그의 설치 파일은 덮어쓰지 않습니다. 수정은 새 버전으로 배포합니다.
다운로드 버튼의 태그·파일명도 새 버전으로 갱신합니다.

## Signing and updates

현재는 배포 인증서가 없으므로 개발 프리뷰 상태를 다운로드 안내에 명시합니다.
보안 경고를 우회하는 스크립트는 제공하지 않습니다.
공식 배포 서명·공증과 앱 내부 자동 업데이트는 후속 작업입니다. CI/CD 배포와 앱 자동 업데이트는 별개입니다.

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
