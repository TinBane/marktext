import { configureCompat, compatUtils } from 'vue'

// Debug mode: log all compat warnings
const isDebug = typeof process !== 'undefined' && process.env && process.env.MARKTEXT_DEBUG === 'true'

if (isDebug) {
  console.log('[VUE-COMPAT] Debug mode enabled - will show all compat warnings')
}

// Configure Vue 3 compatibility mode
// MODE: 2 means Vue 2 behavior is default
// Setting specific features to false means we've migrated them to Vue 3 behavior
configureCompat({
  MODE: 2,
  // Features we've already migrated to Vue 3:
  GLOBAL_MOUNT: false,
  INSTANCE_EVENT_EMITTER: false,
  OPTIONS_BEFORE_DESTROY: false,
  OPTIONS_DESTROYED: false,
  RENDER_FUNCTION: false,
  COMPONENT_V_MODEL: false,
  INSTANCE_ATTRS_CLASS_STYLE: false,
  OPTIONS_DATA_FN: false,
  GLOBAL_PROTOTYPE: false,
  GLOBAL_EXTEND: false,
  GLOBAL_SET: false,
  GLOBAL_DELETE: false,
  GLOBAL_OBSERVABLE: false,
  WATCH_ARRAY: false,
  // Element Plus compatibility - ensure provide/inject works correctly
  INSTANCE_SCOPED_SLOTS: false,
  CUSTOM_DIR: false,
  ATTR_FALSE_VALUE: false,
  // CRITICAL: Disable legacy async component conversion - fixes Element Plus tabs
  // Without this, Vue compat tries to convert Element Plus's internal h() calls
  // as legacy async components, breaking the tabs header rendering
  COMPONENT_ASYNC: false,
  COMPONENT_FUNCTIONAL: false
})

// Export compatUtils for runtime checking
export { compatUtils }
