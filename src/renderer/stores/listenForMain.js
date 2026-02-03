import { defineStore } from 'pinia'
import { ipcRenderer } from 'electron'
import bus from '../bus'
import { useLayoutStore } from './layout'

export const useListenForMainStore = defineStore('listenForMain', {
  state: () => ({}),

  actions: {
    listenForEdit () {
      const layoutStore = useLayoutStore()

      ipcRenderer.on('mt::editor-edit-action', (e, type) => {
        if (type === 'findInFolder') {
          layoutStore.setLayout({
            rightColumn: 'search',
            showSideBar: true
          })
        }
        bus.$emit(type, type)
      })
    },

    listenForShowDialog () {
      ipcRenderer.on('mt::about-dialog', e => {
        bus.$emit('aboutDialog')
      })
      ipcRenderer.on('mt::show-export-dialog', (e, type) => {
        bus.$emit('showExportDialog', type)
      })
    },

    listenForParagraphInlineStyle () {
      ipcRenderer.on('mt::editor-paragraph-action', (e, { type }) => {
        bus.$emit('paragraph', type)
      })
      ipcRenderer.on('mt::editor-format-action', (e, { type }) => {
        bus.$emit('format', type)
      })
    }
  }
})
