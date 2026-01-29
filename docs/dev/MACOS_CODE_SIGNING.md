# macOS Code Signing and Notarization

This document explains how to set up code signing and notarization for macOS builds of MarkText.

## Overview

Starting with macOS 10.15 (Catalina), Apple requires applications to be:
1. **Code signed** with a valid Developer ID certificate
2. **Notarized** by Apple's notarization service

Without these, users will see security warnings or be unable to open the app.

## Requirements

- An [Apple Developer Program](https://developer.apple.com/programs/) membership ($99/year)
- A **Developer ID Application** certificate
- An Apple ID with app-specific password for notarization

## Setting Up Code Signing

### 1. Create a Developer ID Certificate

1. Go to [Apple Developer Certificates](https://developer.apple.com/account/resources/certificates/list)
2. Click the "+" button to create a new certificate
3. Select **Developer ID Application**
4. Follow the instructions to create a Certificate Signing Request (CSR) using Keychain Access
5. Download and install the certificate

### 2. Export the Certificate

1. Open **Keychain Access** on your Mac
2. Find your "Developer ID Application" certificate
3. Right-click and select **Export**
4. Save as a `.p12` file with a strong password
5. Convert to base64: `base64 -i certificate.p12 | pbcopy`

### 3. Find Your Team ID

Your Team ID can be found at:
- [Apple Developer Membership](https://developer.apple.com/account/#/membership) - look for "Team ID"
- Or in Keychain Access: double-click your certificate and look at "Organizational Unit"

## Setting Up Notarization

### 1. Create an App-Specific Password

1. Go to [Apple ID Account](https://appleid.apple.com/account/manage)
2. Sign in with your Apple ID
3. In the **Sign-In and Security** section, select **App-Specific Passwords**
4. Click "Generate an app-specific password"
5. Name it something like "MarkText Notarization"
6. Save the generated password securely

## GitHub Actions Configuration

Add the following secrets to your GitHub repository:

| Secret Name | Description |
|------------|-------------|
| `MAC_CERTIFICATE_BASE64` | Base64-encoded `.p12` certificate |
| `MAC_CERTIFICATE_PASSWORD` | Password for the `.p12` file |
| `APPLE_ID` | Your Apple ID email address |
| `APPLE_APP_SPECIFIC_PASSWORD` | The app-specific password created above |
| `APPLE_TEAM_ID` | Your 10-character Team ID |

### Adding Secrets to GitHub

1. Go to your repository on GitHub
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add each secret listed above

## Local Development

For local builds, you can either:

### Option 1: Use environment variables

```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD="your-certificate-password"
export APPLE_ID="your@apple.id"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"

yarn run release:mac
```

### Option 2: Skip code signing (for testing)

```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
export SKIP_NOTARIZATION=true

yarn run release:mac
```

## Troubleshooting

### "The signature of the binary is invalid"

This usually means the entitlements file has issues. Check that:
- `resources/mac/entitlements.mac.plist` exists and is valid XML
- The app is being signed with `hardenedRuntime: true`

### "Unable to notarize the app"

Common causes:
1. **Invalid credentials**: Verify your Apple ID and app-specific password
2. **Wrong Team ID**: Double-check your Team ID
3. **Network issues**: Notarization requires internet access to Apple's servers

### "The notarization service reported issues"

Check the notarization log for specific issues:
```bash
xcrun notarytool log <submission-id> --apple-id <email> --password <password> --team-id <team-id>
```

### Certificate not found

Ensure:
1. The certificate is properly imported into the keychain
2. The keychain is unlocked
3. The certificate hasn't expired

## Files Reference

| File | Purpose |
|------|---------|
| `resources/mac/entitlements.mac.plist` | Main app entitlements for hardened runtime |
| `resources/mac/entitlements.mac.inherit.plist` | Entitlements for helper processes |
| `resources/mac/notarize.js` | Notarization script called after signing |
| `electron-builder.yml` | Build configuration with signing settings |

## Security Notes

- Never commit certificates or passwords to the repository
- Use GitHub Secrets for all sensitive values
- Rotate app-specific passwords periodically
- Keep your Developer ID certificate secure
