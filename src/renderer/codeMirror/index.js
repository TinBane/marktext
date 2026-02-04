/**
 * CodeMirror 6 wrapper for MarkText
 * Provides a compatibility layer with the same API as the old CM5 wrapper
 */
import { filter } from 'fuzzaldrin'
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { history } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language'
import { closeBrackets } from '@codemirror/autocomplete'
import { markdown } from '@codemirror/lang-markdown'
import { languages as langData } from '@codemirror/language-data'

import { oneDark } from './themes/one-dark'
import { railscasts } from './themes/railscasts'
import languageMappings from './modes'

// Import base styles for CodeMirror 6
import './index.css'

// Re-export themes
export { oneDark } from './themes/one-dark'
export { railscasts } from './themes/railscasts'

/**
 * Search for languages by name using fuzzy matching
 * @param {string} text - Search text
 * @returns {Array} Array of matching language objects with name, mode, mime
 */
export const search = text => {
  const matchedLangs = filter(languageMappings, text, { key: 'name' })
  return matchedLangs.map(lang => ({
    name: lang.name,
    mode: { mode: lang.mode, mime: lang.mime }
  }))
}

/**
 * Convert {line, ch} position to absolute offset
 * @param {EditorView} view - Editor view instance
 * @param {Object} pos - Position with line (0-based) and ch properties
 * @returns {number} Absolute offset
 */
const posToOffset = (view, pos) => {
  const { line, ch } = pos
  const lineInfo = view.state.doc.line(line + 1) // CM6 uses 1-based line numbers
  return lineInfo.from + Math.min(ch, lineInfo.length)
}

/**
 * Convert absolute offset to {line, ch} position
 * @param {EditorView} view - Editor view instance
 * @param {number} offset - Absolute offset
 * @returns {Object} Position with line (0-based) and ch properties
 */
const offsetToPos = (view, offset) => {
  const lineInfo = view.state.doc.lineAt(offset)
  return {
    line: lineInfo.number - 1, // Convert to 0-based
    ch: offset - lineInfo.from
  }
}

/**
 * Set cursor at the end of the last line
 * @param {EditorView} view - Editor view instance
 */
export const setCursorAtLastLine = view => {
  const len = view.state.doc.length
  view.dispatch({
    selection: { anchor: len },
    scrollIntoView: true
  })
  view.focus()
}

/**
 * Check if cursor is at the first line
 * @param {EditorView} view - Editor view instance
 * @returns {boolean}
 */
export const isCursorAtFirstLine = view => {
  const pos = view.state.selection.main.head
  const lineInfo = view.state.doc.lineAt(pos)
  return lineInfo.number === 1 && pos === lineInfo.from
}

/**
 * Check if cursor is at the last line
 * @param {EditorView} view - Editor view instance
 * @returns {boolean}
 */
export const isCursorAtLastLine = view => {
  const pos = view.state.selection.main.head
  const lineInfo = view.state.doc.lineAt(pos)
  return lineInfo.number === view.state.doc.lines
}

/**
 * Check if cursor is at the beginning of the document
 * @param {EditorView} view - Editor view instance
 * @returns {boolean}
 */
export const isCursorAtBegin = view => {
  return view.state.selection.main.head === 0
}

/**
 * Check if cursor is at the end of the document
 * @param {EditorView} view - Editor view instance
 * @returns {boolean}
 */
export const isCursorAtEnd = view => {
  return view.state.selection.main.head === view.state.doc.length
}

/**
 * Check if document has only one line
 * @param {EditorView} view - Editor view instance
 * @returns {boolean}
 */
export const onlyHaveOneLine = view => {
  return view.state.doc.lines === 1
}

/**
 * Get position at the beginning of the document
 * @returns {Object} Cursor position with anchor and head
 */
export const getBeginPosition = () => {
  return {
    anchor: { line: 0, ch: 0 },
    head: { line: 0, ch: 0 }
  }
}

/**
 * Get position at the end of the document
 * @param {EditorView} view - Editor view instance
 * @returns {Object} Cursor position with anchor and head
 */
export const getEndPosition = view => {
  const lastLine = view.state.doc.lines - 1 // 0-based
  const lastLineInfo = view.state.doc.line(view.state.doc.lines)
  const ch = lastLineInfo.length
  return {
    anchor: { line: lastLine, ch },
    head: { line: lastLine, ch }
  }
}

/**
 * Set cursor at the first line
 * @param {EditorView} view - Editor view instance
 */
export const setCursorAtFirstLine = view => {
  view.dispatch({
    selection: { anchor: 0 },
    scrollIntoView: true
  })
  view.focus()
}

/**
 * Set text direction (LTR/RTL)
 * @param {EditorView} view - Editor view instance
 * @param {string} direction - 'ltr' or 'rtl'
 */
export const setTextDirection = (view, direction) => {
  view.contentDOM.style.direction = direction
}

/**
 * Set the language mode
 * @param {EditorView} view - Editor view instance
 * @param {string} langName - Language name
 * @param {Compartment} langCompartment - Language compartment for reconfiguration
 * @returns {Promise} Resolves when mode is set
 */
export const setMode = async (view, langName, langCompartment) => {
  // Find the language mapping
  const langMapping = languageMappings.find(l => l.name === langName)
  if (!langMapping) {
    console.warn(`Language "${langName}" not found, using markdown`)
  }

  // Find the CM6 language from the language-data package
  let langSupport = null

  if (langName === 'markdown') {
    langSupport = markdown()
  } else {
    // Try to find a matching language in the language-data
    const langDesc = langData.find(l => {
      if (l.name.toLowerCase() === langName.toLowerCase()) return true
      if (l.alias && l.alias.some(a => a.toLowerCase() === langName.toLowerCase())) return true
      return false
    })

    if (langDesc) {
      try {
        langSupport = await langDesc.load()
      } catch (e) {
        console.warn(`Failed to load language "${langName}":`, e)
        langSupport = markdown()
      }
    } else {
      // Fallback to markdown
      langSupport = markdown()
    }
  }

  // Reconfigure the editor with the new language
  view.dispatch({
    effects: langCompartment.reconfigure(langSupport)
  })

  return { name: langName, mode: langMapping?.mode || 'markdown' }
}

/**
 * Create a CodeMirror 6 editor instance
 * @param {HTMLElement} parent - Parent element
 * @param {Object} config - Configuration options
 * @returns {Object} Object with view, and compartments for reconfiguration
 */
export const createEditor = (parent, config = {}) => {
  const {
    value = '',
    lineNumbers: showLineNumbers = true,
    // lineWrapping is always enabled via EditorView.lineWrapping
    autofocus = false,
    theme = null, // 'railscasts', 'one-dark', or null for light
    direction = 'ltr',
    lineNumberFormatter = null
  } = config

  // Create compartments for dynamic reconfiguration
  const languageCompartment = new Compartment()
  const themeCompartment = new Compartment()
  const readOnlyCompartment = new Compartment()

  // Build extensions array
  const extensions = [
    history(),
    bracketMatching(),
    closeBrackets(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    EditorView.lineWrapping,
    EditorState.allowMultipleSelections.of(true),
    languageCompartment.of(markdown()),
    readOnlyCompartment.of([])
  ]

  // Add line numbers with optional formatter
  if (showLineNumbers) {
    if (lineNumberFormatter) {
      extensions.push(lineNumbers({
        formatNumber: lineNumberFormatter
      }))
    } else {
      extensions.push(lineNumbers())
    }
  }

  // Add theme
  if (theme === 'railscasts') {
    extensions.push(themeCompartment.of(railscasts))
  } else if (theme === 'one-dark') {
    extensions.push(themeCompartment.of(oneDark))
  } else {
    extensions.push(themeCompartment.of([syntaxHighlighting(defaultHighlightStyle)]))
  }

  // Add keymaps
  extensions.push(EditorView.domEventHandlers({
    contextmenu: (event) => {
      // Prevent browser context menu (handled by Electron)
      event.preventDefault()
      return true
    }
  }))

  // Create the editor state
  const state = EditorState.create({
    doc: value,
    extensions
  })

  // Create the editor view
  const view = new EditorView({
    state,
    parent
  })

  // Set text direction
  if (direction === 'rtl') {
    view.contentDOM.style.direction = 'rtl'
  }

  // Focus if requested
  if (autofocus) {
    view.focus()
  }

  return {
    view,
    languageCompartment,
    themeCompartment,
    readOnlyCompartment
  }
}

// Compatibility helpers for sourceCode.vue

/**
 * Get document content
 * @param {EditorView} view - Editor view instance
 * @returns {string} Document content
 */
export const getValue = view => {
  return view.state.doc.toString()
}

/**
 * Set document content
 * @param {EditorView} view - Editor view instance
 * @param {string} text - New content
 */
export const setValue = (view, text) => {
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: text }
  })
}

/**
 * Get cursor position in {line, ch} format (0-based line)
 * @param {EditorView} view - Editor view instance
 * @param {string} type - 'head', 'anchor', or 'focus'
 * @returns {Object} Position with line and ch
 */
export const getCursor = (view, type = 'head') => {
  const sel = view.state.selection.main
  let offset
  if (type === 'anchor') {
    offset = sel.anchor
  } else {
    offset = sel.head
  }
  return offsetToPos(view, offset)
}

/**
 * Set cursor position
 * @param {EditorView} view - Editor view instance
 * @param {number} line - Line number (0-based)
 * @param {number} ch - Character offset
 */
export const setCursor = (view, line, ch) => {
  const offset = posToOffset(view, { line, ch })
  view.dispatch({
    selection: { anchor: offset },
    scrollIntoView: true
  })
}

/**
 * Set selection
 * @param {EditorView} view - Editor view instance
 * @param {Object} anchor - Anchor position {line, ch}
 * @param {Object} head - Head position {line, ch}
 * @param {Object} options - Options (scroll: boolean)
 */
export const setSelection = (view, anchor, head, options = {}) => {
  const anchorOffset = posToOffset(view, anchor)
  const headOffset = posToOffset(view, head)
  view.dispatch({
    selection: { anchor: anchorOffset, head: headOffset },
    scrollIntoView: options.scroll !== false
  })
}

/**
 * Get line content
 * @param {EditorView} view - Editor view instance
 * @param {number} lineNum - Line number (0-based)
 * @returns {string} Line content
 */
export const getLine = (view, lineNum) => {
  const lineInfo = view.state.doc.line(lineNum + 1) // CM6 uses 1-based
  return lineInfo.text
}

/**
 * Get last line number (0-based)
 * @param {EditorView} view - Editor view instance
 * @returns {number} Last line number
 */
export const lastLine = view => {
  return view.state.doc.lines - 1
}

/**
 * Get total line count
 * @param {EditorView} view - Editor view instance
 * @returns {number} Number of lines
 */
export const lineCount = view => {
  return view.state.doc.lines
}

/**
 * Focus the editor
 * @param {EditorView} view - Editor view instance
 */
export const focus = view => {
  view.focus()
}

/**
 * Check if editor has focus
 * @param {EditorView} view - Editor view instance
 * @returns {boolean}
 */
export const hasFocus = view => {
  return view.hasFocus
}

/**
 * Select all content
 * @param {EditorView} view - Editor view instance
 */
export const selectAll = view => {
  view.dispatch({
    selection: { anchor: 0, head: view.state.doc.length }
  })
}

/**
 * Set editor theme dynamically
 * @param {EditorView} view - Editor view instance
 * @param {Compartment} themeCompartment - Theme compartment for reconfiguration
 * @param {string} themeName - Theme name: 'railscasts', 'one-dark', or null/'' for light
 */
export const setTheme = (view, themeCompartment, themeName) => {
  let themeExtension
  if (themeName === 'railscasts') {
    themeExtension = railscasts
  } else if (themeName === 'one-dark') {
    themeExtension = oneDark
  } else {
    themeExtension = [syntaxHighlighting(defaultHighlightStyle)]
  }

  view.dispatch({
    effects: themeCompartment.reconfigure(themeExtension)
  })
}

// Export default for compatibility
export default {
  createEditor,
  getValue,
  setValue,
  getCursor,
  setCursor,
  setSelection,
  getLine,
  lastLine,
  lineCount,
  focus,
  hasFocus,
  selectAll,
  search,
  setMode,
  setCursorAtLastLine,
  isCursorAtFirstLine,
  isCursorAtLastLine,
  isCursorAtBegin,
  isCursorAtEnd,
  onlyHaveOneLine,
  getBeginPosition,
  getEndPosition,
  setCursorAtFirstLine,
  setTextDirection
}
