# Desktop provider configuration · 제공자 구성

[English README](../README.en.md) · [한국어 README](../README.md)

The web demo is local-only. Use the installed desktop application for provider-backed text responses. The following inputs are contributor and user configuration contracts; never commit real values.

## Configuration inputs

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Credential for the OpenAI adapter |
| `ANTHROPIC_API_KEY` | Credential for the Anthropic adapter |

For source execution, copy `.env.example` to a Git-ignored `.env`. For an installed app, place `.env` in its standard application-data directory: `~/Library/Application Support/Aurora` on macOS or `%APPDATA%/Aurora` on Windows. Environment variables are also accepted. Restart the app after changing configuration.

Use only your own credentials, keep them out of screenshots and issues, and apply the provider's access and spending controls. A detected input does not prove connectivity, model access or available quota. Credentials are handled in Electron's main process rather than conversation storage or renderer state.

## Request flow in 0.1.2

1. Open settings and configure the internal analysis and default execution roles.
2. Enable **실제 API 사용** (real API use). This switch alone does not send a request.
3. Review a draft. **내부 모델로 분석** sends the request and selected context to the analyzer, with separate usage.
4. Select an execution model and use **선택한 모델로 API 실행** to request a text response. Analysis can be skipped in this release.

The public preview does not automatically apply the analyzer's recommendation. A failed request is not automatically retried or switched to another model. Usage may still have occurred before a timeout or malformed response.

The analyzer generation cap is 2,048 tokens and the executor cap is 4,096. Input usage is separate; these limits do not enforce a whole-task cost budget. Provider-reported usage and incomplete responses are shown separately from planning estimates.

## 한국어 요약

웹 데모에서는 외부 AI 호출을 하지 않습니다. 설치 앱에서 사용할 제공자의 구성 값을 환경변수 또는 기기 내 `.env`로 전달하고 앱을 재시작합니다. 실제 값을 Git·이슈·스크린샷에 포함하지 마세요.

0.1.2에서는 내부 분석과 실행을 별도로 요청하고 실행 모델을 직접 선택합니다. 분석도 사용량이 발생하며, 오류 시 자동 재시도·모델 변경은 하지 않습니다. 입력 값 감지는 연결 성공이나 계정 잔여량의 확인이 아닙니다.
