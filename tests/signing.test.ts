import test from "node:test";
import assert from "node:assert/strict";
import { macSigning } from "../scripts/mac-signing.mjs";

test("local Developer ID and Keychain profile require signing and notarization without exporting a private key", () => {
  const env = {
    CSC_NAME: "Developer ID Application: Example (TEAM)",
    APPLE_KEYCHAIN_PROFILE: "test-profile",
    APPLE_ID: "partial",
  };
  const result = macSigning(env);
  assert.equal(result.signed, true);
  assert.ok(result.overrides.includes("-c.forceCodeSigning=true"));
  assert.ok(result.overrides.includes("-c.mac.notarize=true"));
  assert.ok(result.overrides.includes("-c.mac.identity=Example (TEAM)"));
  assert.equal(env.APPLE_ID, undefined);
});
test("signing fails closed on missing notarization credentials and development identities", () => {
  assert.throws(
    () => macSigning({ CSC_NAME: "Developer ID Application: Example (TEAM)" }),
    /notarization/,
  );
  assert.throws(
    () => macSigning({ CSC_NAME: "Apple Development: Example (TEAM)" }),
    /Developer ID Application/,
  );
  assert.deepEqual(macSigning({}), {
    signed: false,
    overrides: ["-c.mac.identity=-"],
  });
  assert.equal(
    macSigning({
      CSC_LINK: "test-certificate",
      APPLE_ID: "example",
      APPLE_APP_SPECIFIC_PASSWORD: "test",
      APPLE_TEAM_ID: "TEAM",
    }).signed,
    true,
  );
});
