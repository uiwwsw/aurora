// Build credentials stay in the process environment or macOS Keychain.
export function macSigning(env) {
  const identity = env.CSC_NAME;
  if (identity && !identity.startsWith("Developer ID Application:"))
    throw new Error("CSC_NAME must name a Developer ID Application identity.");
  const signed = Boolean(env.CSC_LINK || identity);
  if (!signed) return { signed, overrides: ["-c.mac.identity=-"] };
  const hasPassword =
    env.APPLE_ID && env.APPLE_APP_SPECIFIC_PASSWORD && env.APPLE_TEAM_ID;
  const hasApiKey =
    env.APPLE_API_KEY && env.APPLE_API_KEY_ID && env.APPLE_API_ISSUER;
  if (!env.APPLE_KEYCHAIN_PROFILE && !hasPassword && !hasApiKey)
    throw new Error(
      "Signed macOS releases require Apple notarization credentials or APPLE_KEYCHAIN_PROFILE.",
    );
  if (env.APPLE_KEYCHAIN_PROFILE) {
    // The builder prefers environment credentials to Keychain; avoid a partial
    // environment accidentally overriding the explicitly selected profile.
    for (const name of [
      "APPLE_ID",
      "APPLE_APP_SPECIFIC_PASSWORD",
      "APPLE_API_KEY",
      "APPLE_API_KEY_ID",
      "APPLE_API_ISSUER",
    ])
      delete env[name];
  }
  return {
    signed,
    overrides: [
      "-c.forceCodeSigning=true",
      "-c.mac.notarize=true",
      ...(identity
        ? [
            `-c.mac.identity=${identity.replace(/^Developer ID Application:\s*/, "")}`,
          ]
        : []),
    ],
  };
}
