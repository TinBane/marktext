import { defineStore } from 'pinia'
import path from 'path'
import { ipcRenderer, shell } from 'electron'
import { addFile, unlinkFile, addDirectory, unlinkDirectory } from '../store/treeCtrl'
import bus from '../bus'
import { create, paste, rename } from '../util/fileSystem'
import { PATH_SEPARATOR } from '../config'
import notice from '../services/notification'
import { getFileStateFromData } from '../store/help'
import { hasMarkdownExtension } from 'common/filesystem/paths'
import { useEditorStore } from './editor'
import { useLayoutStore } from './layout'

export const useProjectStore = defineStore('project', {
  state: () => ({
    activeItem: {},
    createCache: {},
    // Use to cache newly created filename, for open immediately.
    newFileNameCache: '',
    renameCache: null,
    clipboard: null,
    projectTree: null
  }),

  actions: {
    setRootDirectory (pathname) {
      let name = path.basename(pathname)
      if (!name) {
        // Root directory such "/" or "C:\"
        name = pathname
      }

      this.projectTree = {
        // Root full path
        pathname: path.normalize(pathname),
        // Root directory name
        name,
        isDirectory: true,
        isFile: false,
        isMarkdown: false,
        folders: [],
        files: []
      }
    },

    setNewFilename (name) {
      this.newFileNameCache = name
    },

    addFile (change) {
      const { projectTree } = this
      addFile(projectTree, change)
    },

    unlinkFile (change) {
      const { projectTree } = this
      unlinkFile(projectTree, change)
    },

    addDirectory (change) {
      const { projectTree } = this
      addDirectory(projectTree, change)
    },

    unlinkDirectory (change) {
      const { projectTree } = this
      unlinkDirectory(projectTree, change)
    },

    setActiveItem (activeItem) {
      this.activeItem = activeItem
    },

    setClipboard (data) {
      this.clipboard = data
    },

    createPath (cache) {
      this.createCache = cache
    },

    setRenameCache (cache) {
      this.renameCache = cache
    },

    listenForLoadProject () {
      const layoutStore = useLayoutStore()

      ipcRenderer.on('mt::open-directory', (e, pathname) => {
        this.setRootDirectory(pathname)
        layoutStore.setLayout({
          rightColumn: 'files',
          showSideBar: true,
          showTabBar: true
        })
        layoutStore.dispatchLayoutMenuItems()
      })
    },

    listenForUpdateProject () {
      const editorStore = useEditorStore()

      ipcRenderer.on('mt::update-object-tree', (e, { type, change }) => {
        switch (type) {
          case 'add': {
            const { pathname, data, isMarkdown } = change
            this.addFile(change)
            if (isMarkdown && this.newFileNameCache && pathname === this.newFileNameCache) {
              const fileState = getFileStateFromData(data)
              editorStore.updateCurrentFile(fileState)
              this.setNewFilename('')
            }
            break
          }
          case 'unlink':
            this.unlinkFile(change)
            editorStore.setSaveStatusWhenRemove(change)
            break
          case 'addDir':
            this.addDirectory(change)
            break
          case 'unlinkDir':
            this.unlinkDirectory(change)
            break
          case 'change':
            break
          default:
            if (process.env.NODE_ENV === 'development') {
              console.log(`Unknown directory watch type: "${type}"`)
            }
            break
        }
      })
    },

    changeActiveItem (activeItem) {
      this.setActiveItem(activeItem)
    },

    changeClipboard (data) {
      this.setClipboard(data)
    },

    askForOpenProject () {
      ipcRenderer.send('mt::ask-for-open-project-in-sidebar')
    },

    listenForSidebarContextMenu () {
      bus.$on('SIDEBAR::show-in-folder', () => {
        const { pathname } = this.activeItem
        shell.showItemInFolder(pathname)
      })
      bus.$on('SIDEBAR::new', type => {
        const { pathname, isDirectory } = this.activeItem
        const dirname = isDirectory ? pathname : path.dirname(pathname)
        this.createPath({ dirname, type })
        bus.$emit('SIDEBAR::show-new-input')
      })
      bus.$on('SIDEBAR::remove', () => {
        const { pathname } = this.activeItem
        ipcRenderer.invoke('mt::fs-trash-item', pathname).catch(err => {
          notice.notify({
            title: 'Error while deleting',
            type: 'error',
            message: err.message
          })
        })
      })
      bus.$on('SIDEBAR::copy-cut', type => {
        const { pathname: src } = this.activeItem
        this.setClipboard({ type, src })
      })
      bus.$on('SIDEBAR::paste', () => {
        const { clipboard } = this
        const { pathname, isDirectory } = this.activeItem
        const dirname = isDirectory ? pathname : path.dirname(pathname)
        if (clipboard && clipboard.src) {
          clipboard.dest = dirname + PATH_SEPARATOR + path.basename(clipboard.src)

          if (path.normalize(clipboard.src) === path.normalize(clipboard.dest)) {
            notice.notify({
              title: 'Paste Forbidden',
              type: 'warning',
              message: 'Source and destination must not be the same.'
            })
            return
          }

          paste(clipboard)
            .then(() => {
              this.setClipboard(null)
            })
            .catch(err => {
              notice.notify({
                title: 'Error while pasting',
                type: 'error',
                message: err.message
              })
            })
        }
      })
      bus.$on('SIDEBAR::rename', () => {
        const { pathname } = this.activeItem
        this.setRenameCache(pathname)
        bus.$emit('SIDEBAR::show-rename-input')
      })
    },

    createFileDirectory (name) {
      const { dirname, type } = this.createCache

      if (type === 'file' && !hasMarkdownExtension(name)) {
        name += '.md'
      }

      const fullName = `${dirname}/${name}`

      create(fullName, type)
        .then(() => {
          this.createPath({})
          if (type === 'file') {
            this.setNewFilename(fullName)
          }
        })
        .catch(err => {
          notice.notify({
            title: 'Error in Side Bar',
            type: 'error',
            message: err.message
          })
        })
    },

    renameInSidebar (name) {
      const editorStore = useEditorStore()
      const src = this.renameCache
      const dirname = path.dirname(src)
      const dest = dirname + PATH_SEPARATOR + name
      rename(src, dest)
        .then(() => {
          editorStore.renameIfNeeded({ src, dest })
        })
    },

    openSettingWindow () {
      ipcRenderer.send('mt::open-setting-window')
    }
  }
})
