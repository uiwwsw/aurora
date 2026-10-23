# Microsoft Store distribution

Store distribution uses a separately built APPX package in the MSIX package family. Microsoft certifies and signs the package before Store distribution. The unsigned submission package is not a public installer and must not be advertised as removing Windows warnings.

1. Complete Windows developer registration in Microsoft Partner Center.
2. Reserve the app and copy its package identity name, publisher (`CN=…`) and publisher display name from Product identity.
3. Run the `Windows release packages` workflow with those exact identity inputs. Empty inputs build only the direct-download EXE.
4. Download the `microsoft-store-submission` artifact and submit it in Partner Center with the required listing, privacy information and age rating.
5. Publish only after Microsoft certification succeeds; verify the public Store URL before adding a Store download button.

The desktop [privacy information](privacy.md) documents local storage, provider requests and update services. Use a verified public URL for that document in the Store listing. Product identity, display-name availability, age rating and certification answers must match the actual Partner Center product and current app behavior.

The workflow does not read signing secrets or publish a Store submission automatically. Store builds disable the GitHub updater: Microsoft Store manages their updates. Direct-download NSIS installers retain the GitHub update channel and may show SmartScreen warnings when unsigned or without sufficient reputation.

For a local Windows build, set `STORE_IDENTITY_NAME`, `STORE_PUBLISHER` and `STORE_PUBLISHER_DISPLAY_NAME` to the assigned public identity metadata, run `npm run build`, and then `node scripts/package-store.mjs`. Generated configuration and artifacts remain under ignored `distribution/`.
