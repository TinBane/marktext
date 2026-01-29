# Steps to release MarkText

## Prerequisites

- Ensure macOS code signing is configured (see [MACOS_CODE_SIGNING.md](./MACOS_CODE_SIGNING.md))
- Required GitHub secrets for macOS signing:
  - `MAC_CERTIFICATE_BASE64`
  - `MAC_CERTIFICATE_PASSWORD`
  - `APPLE_ID`
  - `APPLE_APP_SPECIFIC_PASSWORD`
  - `APPLE_TEAM_ID`

## Release Process

- Create a release candidate
  - Create branch `release-v%version%`
  - Set environment variable `MARKTEXT_IS_STABLE` to `1` (default on AppVeyor and Travis CI)
  - Ensure [changelog](https://github.com/marktext/marktext/blob/master/.github/CHANGELOG.md) is up-to-date
  - Bump version in `package.json` and changelog
  - Update all `README.md` files
  - Bump Flathub version ([marktext.appdata.xml](https://github.com/marktext/marktext/blob/master/resources/linux/marktext.appdata.xml))
  - Create commit `release version %version%`
  - Ensure all tests pass
  - A new draft release should be available or create one
- Publish GitHub release
  - Add git tag `v%version%`
  - Add changelog
  - Add SHA256 checksums
- Update website and documentation
- Publish [Flathub package](https://github.com/flathub/com.github.marktext.marktext)
  - Ensure native dependencies
  - Update `runtime` and `SDK` if needed
  - Bump version and update URLs
  - Test the package (`scripts/build-bundle.sh && scripts/test-marktext.sh`)
  - Create commit `Update to v%version%`

## Work after releasing

- Ensure all issues in the changelog are closed
- :relaxed: :tada:
