// Preload script for Electron renderer
// This runs in a context that has access to Node.js APIs
// and can expose them to the renderer

const { ipcRenderer } = require('electron')

// Expose Node.js globals to the renderer
window.require = require
window.global = global
window.process = process
window.Buffer = Buffer
window.__dirname = __dirname
window.__filename = __filename

// Also expose electron APIs
window.ipcRenderer = ipcRenderer

console.log('[Preload] Node.js APIs exposed to renderer')
