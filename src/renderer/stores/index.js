import { createPinia } from 'pinia'

export const pinia = createPinia()

// Re-export all stores for convenient access
export { useRootStore } from './root'
export { useEditorStore } from './editor'
export { usePreferencesStore } from './preferences'
export { useProjectStore } from './project'
export { useLayoutStore } from './layout'
export { useCommandCenterStore } from './commandCenter'
export { useListenForMainStore } from './listenForMain'
export { useAutoUpdatesStore } from './autoUpdates'
export { useNotificationStore } from './notification'
export { useTweetStore } from './tweet'
