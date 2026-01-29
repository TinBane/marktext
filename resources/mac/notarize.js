/**
 * macOS Notarization Script
 *
 * This script is called by electron-builder after signing the app.
 * It submits the signed app to Apple's notarization service.
 *
 * Required environment variables:
 * - APPLE_ID: Your Apple ID email
 * - APPLE_APP_SPECIFIC_PASSWORD: App-specific password (or @keychain:name)
 * - APPLE_TEAM_ID: Your Apple Developer Team ID
 *
 * Optional:
 * - SKIP_NOTARIZATION: Set to 'true' to skip notarization (for local builds)
 */

const { notarize } = require('@electron/notarize')
const path = require('path')

module.exports = async function notarizing (context) {
  const { electronPlatformName, appOutDir } = context

  // Only notarize macOS builds
  if (electronPlatformName !== 'darwin') {
    console.log('Skipping notarization: not a macOS build')
    return
  }

  // Skip if environment variable is set (useful for local development)
  if (process.env.SKIP_NOTARIZATION === 'true') {
    console.log('Skipping notarization: SKIP_NOTARIZATION is set')
    return
  }

  // Check for required environment variables
  const appleId = process.env.APPLE_ID
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD
  const teamId = process.env.APPLE_TEAM_ID

  if (!appleId || !appleIdPassword || !teamId) {
    console.log('Skipping notarization: Apple credentials not configured')
    console.log('Required environment variables:')
    console.log('  - APPLE_ID')
    console.log('  - APPLE_APP_SPECIFIC_PASSWORD')
    console.log('  - APPLE_TEAM_ID')
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = path.join(appOutDir, `${appName}.app`)

  console.log(`Notarizing ${appPath}...`)
  console.log('This may take several minutes...')

  try {
    await notarize({
      tool: 'notarytool',
      appPath,
      appleId,
      appleIdPassword,
      teamId
    })
    console.log('Notarization complete!')
  } catch (error) {
    console.error('Notarization failed:', error.message)
    // Re-throw to fail the build if notarization was expected
    if (process.env.CI) {
      throw error
    }
  }
}
