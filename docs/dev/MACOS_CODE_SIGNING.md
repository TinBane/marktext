# macOS Code Signing and Notarization

How macOS builds of this fork are signed and notarized. Upstream MarkText ships unsigned Mac builds; this fork signs and notarizes them whenever the credentials below are available, and falls back to an unsigned build when they are not.

## How it works

electron-builder does both steps itself, configured in `packages/desktop/electron-builder.yml` under `mac:`:

- **Signing** uses a Developer ID Application identity, either found in the build machine's keychain or supplied as `CSC_LINK` (path to, or base64 of, a `.p12`) plus `CSC_KEY_PASSWORD`. The app is signed with the hardened runtime and the entitlements in `packages/desktop/build/mac/entitlements.mac.plist` (used for the app and its helper processes).
- **Notarization** runs after signing, through electron-builder's built-in `@electron/notarize` integration, when Apple credentials are present in the environment. It submits to `notarytool` and staples the ticket.

With no identity, signing is skipped. With no Apple credentials, notarization is skipped. Either way the build still completes.

## Requirements

- An [Apple Developer Program](https://developer.apple.com/programs/) membership
- A **Developer ID Application** certificate
- An Apple ID with an app-specific password, or an App Store Connect API key, for notarization

## One-time setup

### Developer ID certificate

1. Go to [Apple Developer Certificates](https://developer.apple.com/account/resources/certificates/list), click "+" and choose **Developer ID Application**.
2. Create a Certificate Signing Request in Keychain Access, upload it, then download and install the certificate.
3. To use it on CI, export it from Keychain Access as a `.p12` with a strong password, then base64 it: `base64 -i certificate.p12 | pbcopy`.

Your Team ID is on the [membership page](https://developer.apple.com/account/#/membership), or in the certificate's "Organizational Unit" field.

### Notarization credentials

Pick one:

- **Apple ID:** create an app-specific password at [appleid.apple.com](https://appleid.apple.com/account/manage) → Sign-In and Security → App-Specific Passwords.
- **Keychain profile (recommended for local builds):** `xcrun notarytool store-credentials "notarytool-profile" --apple-id <email> --team-id <TEAMID>` stores the credentials in the keychain so nothing goes in environment files.

## Environment variables

| Variable | Used for |
|---|---|
| `CSC_LINK` | `.p12` path or base64 (optional if the identity is already in the keychain) |
| `CSC_KEY_PASSWORD` | Password for the `.p12` |
| `APPLE_ID` | Apple ID email (notarization) |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password (notarization) |
| `APPLE_TEAM_ID` | 10-character Team ID (notarization) |
| `APPLE_KEYCHAIN_PROFILE` | Alternative to the three `APPLE_*` values above: a `notarytool` keychain profile name |

## GitHub Actions

`.github/workflows/release.yml` passes these repository secrets to the macOS build step:

| Secret | Maps to |
|---|---|
| `MAC_CERTIFICATE_BASE64` | `CSC_LINK` |
| `MAC_CERTIFICATE_PASSWORD` | `CSC_KEY_PASSWORD` |
| `APPLE_ID` | `APPLE_ID` |
| `APPLE_APP_SPECIFIC_PASSWORD` | `APPLE_APP_SPECIFIC_PASSWORD` |
| `APPLE_TEAM_ID` | `APPLE_TEAM_ID` |

Add them under the repository's Settings → Secrets and variables → Actions. electron-builder imports `CSC_LINK` into a temporary keychain on the runner itself, so no separate keychain step is needed. When the certificate and Apple ID secrets are set, the release notes drop upstream's "builds are unsigned" warning.

## Local builds

```bash
# Signed + notarized (identity already in your keychain, notarytool profile stored)
export APPLE_KEYCHAIN_PROFILE=notarytool-profile
pnpm run build:mac:arm64

# Signed + notarized from a .p12 and Apple ID
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD='…'
export APPLE_ID='you@example.com'
export APPLE_APP_SPECIFIC_PASSWORD='xxxx-xxxx-xxxx-xxxx'
export APPLE_TEAM_ID='XXXXXXXXXX'
pnpm run build:mac:arm64

# Unsigned test build: stop electron-builder picking up a keychain identity,
# and leave the APPLE_* variables unset
CSC_IDENTITY_AUTO_DISCOVERY=false pnpm run build:mac:arm64
```

Installers land in `dist/` at the repository root.

## Checking a build

```bash
codesign --verify --deep --strict --verbose=2 dist/mac-arm64/MarkText.app
spctl --assess --type execute --verbose dist/mac-arm64/MarkText.app   # "source=Notarized Developer ID" when notarized
xcrun stapler validate dist/mac-arm64/MarkText.app
```

## Troubleshooting

- **"The signature of the binary is invalid":** check that `packages/desktop/build/mac/entitlements.mac.plist` is valid XML and that `hardenedRuntime: true` is still set.
- **Notarization fails:** verify the Apple ID, app-specific password and Team ID. Unlike the old fork's hook, a notarization failure now fails the build instead of producing an un-notarized app. Fetch Apple's log with `xcrun notarytool log <submission-id> --keychain-profile notarytool-profile`.
- **Certificate not found:** make sure the certificate is in an unlocked keychain and has not expired.

## Security notes

- Never commit certificates, passwords or `.env` files containing them.
- Keep CI credentials in GitHub Secrets; prefer a keychain profile locally.
- Rotate app-specific passwords periodically.
