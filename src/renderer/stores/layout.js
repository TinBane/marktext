import { defineStore } from 'pinia'
import { ipcRenderer } from 'electron'
import bus from '../bus'

const width = localStorage.getItem('side-bar-width')
const sideBarWidth = typeof +width === 'number' ? Math.max(+width, 220) : 280

export const useLayoutStore = defineStore('layout', {
  state: () => ({
    rightColumn: 'files',
    showSideBar: false,
    showTabBar: false,
    sideBarWidth
  }),

  actions: {
    setLayout (layout) {
      if (layout.showSideBar !== undefined) {
        const { windowId } = global.marktext.env
        ipcRenderer.send('mt::update-sidebar-menu', windowId, !!layout.showSideBar)
      }
      Object.assign(this, layout)
    },

    toggleLayoutEntry (entryName) {
      this[entryName] = !this[entryName]
    },

    setSideBarWidth (width) {
      // TODO: Add side bar to session (GH#732).
      localStorage.setItem('side-bar-width', Math.max(+width, 220))
      this.sideBarWidth = width
    },

    listenForLayout () {
      ipcRenderer.on('mt::set-view-layout', (e, layout) => {
        if (layout.rightColumn) {
          this.setLayout({
            ...layout,
            rightColumn: layout.rightColumn === this.rightColumn ? '' : layout.rightColumn,
            showSideBar: true
          })
        } else {
          this.setLayout(layout)
        }
        this.dispatchLayoutMenuItems()
      })

      ipcRenderer.on('mt::toggle-view-layout-entry', (event, entryName) => {
        this.toggleLayoutEntry(entryName)
        this.dispatchLayoutMenuItems()
      })

      bus.$on('view:toggle-layout-entry', entryName => {
        this.toggleLayoutEntry(entryName)
        const { windowId } = global.marktext.env
        ipcRenderer.send('mt::view-layout-changed', windowId, { [entryName]: this[entryName] })
      })
    },

    dispatchLayoutMenuItems () {
      const { windowId } = global.marktext.env
      const { showTabBar, showSideBar } = this
      ipcRenderer.send('mt::view-layout-changed', windowId, { showTabBar, showSideBar })
    },

    changeSideBarWidth (width) {
      this.setSideBarWidth(width)
    }
  }
})
