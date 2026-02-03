import mitt from 'mitt'

const emitter = mitt()

// Provide Vue 2 compatible API ($on, $off, $emit)
export default {
  $on: emitter.on,
  $off: emitter.off,
  $emit: emitter.emit,
  // Also expose the mitt methods directly for Vue 3 style usage
  on: emitter.on,
  off: emitter.off,
  emit: emitter.emit
}
