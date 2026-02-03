// IMPORTANT: Import compat config FIRST before any Vue imports
import './vue-compat-config'

import { createApp } from 'vue'
import sourceMapSupport from 'source-map-support'
import bootstrapRenderer from './bootstrap'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import axios from './axios'
import { pinia } from './stores'
import store from './store' // Vuex store for backward compatibility
import './assets/symbolIcon'
import services from './services'
import { createAppRouter } from './router'
import App from './App.vue'
import { addElementStyle } from '@/util/theme'

import './assets/styles/index.css'
import './assets/styles/printService.css'

// -----------------------------------------------
// Debug: Capture console output to help debug
;(function setupDebugLogging () {
  if (process.env.MARKTEXT_DEBUG !== 'true') return
  try {
    // eslint-disable-next-line
    const fs = require('fs')
    // eslint-disable-next-line
    const path = require('path')
    // eslint-disable-next-line
    const remote = require('@electron/remote')
    const logPath = path.join(remote.app.getPath('userData'), 'renderer-debug.log')
    const logStream = fs.createWriteStream(logPath, { flags: 'w' })

    const originalConsole = { log: console.log, error: console.error, warn: console.warn }

    const writeLog = (type, args) => {
      const timestamp = new Date().toISOString()
      const message = args.map(a => {
        if (a instanceof Error) return `${a.message}\n${a.stack}`
        if (typeof a === 'object') {
          try { return JSON.stringify(a, null, 2) } catch { return String(a) }
        }
        return String(a)
      }).join(' ')
      logStream.write(`[${timestamp}] [${type}] ${message}\n`)
    }

    console.log = (...args) => { writeLog('LOG', args); originalConsole.log(...args) }
    console.error = (...args) => { writeLog('ERROR', args); originalConsole.error(...args) }
    console.warn = (...args) => { writeLog('WARN', args); originalConsole.warn(...args) }

    console.log('[DEBUG] Console output being captured to:', logPath)
  } catch (e) {
    console.error('[DEBUG] Failed to setup debug logging:', e)
  }
})()

console.log('[DEBUG] main.js imports completed')

// Decode source map in production - must be registered first
sourceMapSupport.install({
  environment: 'node',
  handleUncaughtExceptions: false,
  hookRequire: false
})

global.marktext = {}
console.log('[DEBUG] bootstrapRenderer starting...')
bootstrapRenderer()
console.log('[DEBUG] bootstrapRenderer completed')

addElementStyle()

// -----------------------------------------------
// Be careful when changing code before this line!
console.log('[DEBUG] Creating Vue app...')

// Create Vue 3 app
const app = createApp(App)
console.log('[DEBUG] Vue app created')

// Use plugins
app.use(pinia)
app.use(store) // Vuex store for backward compatibility during migration

// Debug: Log Element Plus components before registering
console.log('[DEBUG] ElementPlus object:', ElementPlus)
console.log('[DEBUG] ElementPlus.ElTabs:', ElementPlus.ElTabs)
console.log('[DEBUG] ElementPlus.ElTabPane:', ElementPlus.ElTabPane)

app.use(ElementPlus)
console.log('[DEBUG] ElementPlus registered with Vue app')

// Debug: Check if tabs components are registered
console.log('[DEBUG] Registered components:', Object.keys(app._context.components))
console.log('[DEBUG] ElTabs component:', app._context.components.ElTabs)
console.log('[DEBUG] ElTabPane component:', app._context.components.ElTabPane)

// Create and use router
const router = createAppRouter(global.marktext.env.type)
app.use(router)

// Set up global properties (replaces Vue.prototype)
app.config.globalProperties.$http = axios

// Register services as global properties
services.forEach(s => {
  app.config.globalProperties['$' + s.name] = s[s.name]
})

// Provide electron access via globalProperties
app.config.globalProperties.$electron = {
  ipcRenderer: require('electron').ipcRenderer,
  shell: require('electron').shell,
  clipboard: require('electron').clipboard,
  remote: require('@electron/remote')
}

// Mount the app after router is ready
console.log('[DEBUG] Waiting for router to be ready...')
router.isReady().then(() => {
  console.log('[DEBUG] Router ready, mounting Vue app...')
  console.log('[DEBUG] Current route:', router.currentRoute.value.path)
  try {
    app.mount('#app')
    console.log('[DEBUG] Vue app mounted successfully')
  } catch (err) {
    console.error('[DEBUG] Vue mount error:', err)
  }
}).catch(err => {
  console.error('[DEBUG] Router error:', err)
})

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('[DEBUG] Vue error:', err)
  console.error('[DEBUG] Error info:', info)
  console.error('[DEBUG] Error stack:', err.stack)
  if (instance) {
    console.error('[DEBUG] Component:', instance.$options?.name || instance.$options?.__name || 'unknown')
    console.error('[DEBUG] Component tag:', instance.$el?.tagName)
  }
}

// Warn handler for Vue 3 compat warnings
app.config.warnHandler = (msg, instance, trace) => {
  console.warn('[DEBUG] Vue warning:', msg)
  if (trace) console.warn('[DEBUG] Trace:', trace)
}
