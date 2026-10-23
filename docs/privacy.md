# Aurora desktop privacy information

Aurora is a desktop AI workspace maintained by uiwwsw. This document describes the desktop application's data handling; the browser preview and external AI providers have separate hosting and service policies.

## Local data

Conversation history is stored on the device when local saving is enabled. Model preferences are also stored locally. Removing the desktop application's local data removes those local copies. Uninstalling the Windows application does not automatically remove its existing application data.

Provider credentials are loaded from the process environment or the application's local configuration. They are not included in distributed installers. Keep credentials private and revoke them through the issuing provider when necessary.

## External services

When a provider request is explicitly executed, the selected provider receives the request and relevant conversation context, model settings and its authentication credential. Aurora uses the OpenAI Responses API and Anthropic Messages API. Their service policies govern data processed by them; clearing local history does not remove provider-held records.

Direct-download builds contact GitHub Releases to check for and download updates. Store builds delegate updates to Microsoft Store. Network services can receive connection metadata such as the device's IP address. Aurora does not configure a separate analytics or crash-reporting service in this release.

## Support and rights

Use [GitHub Issues](https://github.com/uiwwsw/aurora/issues) for product support. Do not post private conversations, credentials or personal records in a public issue.

The [AI training and data collection notice](../AI-TRAINING-NOTICE.md) covers the project's own maintained content. It does not change third-party service policies or claim ownership of user content.
