import { defineStore } from 'pinia'
import { ipcRenderer } from 'electron'

export const useRootStore = defineStore('root', {
  state: () => ({
    platform: process.platform, // platform of system `darwin` | `win32` | `linux`
    appVersion: process.versions.MARKTEXT_VERSION_STRING, // MarkText version string
    windowActive: true, // whether current window is active or focused
    init: false // whether MarkText is initialized
  }),

  actions: {
    setWinStatus (status) {
      this.windowActive = status
    },

    setInitialized () {
      this.init = true
    },

    listenWinStatus () {
      ipcRenderer.on('mt::window-active-status', (e, { status }) => {
        this.setWinStatus(status)
      })
    },

    sendInitialized () {
      this.setInitialized()
    }
  }
})
