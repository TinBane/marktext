<template>
  <div
    class="source-code"
    ref="sourceCode"
  >
  </div>
</template>

<script>
import {
  createEditor,
  setMode,
  setCursorAtLastLine,
  setTextDirection,
  setTheme,
  getValue,
  setValue,
  getCursor,
  setSelection,
  getLine,
  hasFocus,
  selectAll
} from '../../codeMirror'
import { wordCount as getWordCount } from 'muya/lib/utils'
import { mapState } from 'vuex'
import { adjustCursor } from '../../util'
import bus from '../../bus'
import { oneDarkThemes, railscastsThemes } from '@/config'

export default {
  props: {
    markdown: String,
    cursor: Object,
    textDirection: {
      type: String,
      required: true
    }
  },

  computed: {
    ...mapState({
      theme: state => state.preferences.theme,
      sourceCode: state => state.preferences.sourceCode,
      currentTab: state => state.editor.currentFile
    })
  },

  data () {
    return {
      contentState: null,
      editor: null, // EditorView instance
      languageCompartment: null, // For language reconfiguration
      themeCompartment: null, // For theme reconfiguration
      commitTimer: null,
      viewDestroyed: false,
      tabId: null
    }
  },

  watch: {
    textDirection: function (value, oldValue) {
      const { editor } = this
      if (value !== oldValue && editor) {
        setTextDirection(editor, value)
      }
    },
    theme: function (value, oldValue) {
      const { editor, themeCompartment } = this
      if (value !== oldValue && editor && themeCompartment) {
        let editorTheme = null
        if (railscastsThemes.includes(value)) {
          editorTheme = 'railscasts'
        } else if (oneDarkThemes.includes(value)) {
          editorTheme = 'one-dark'
        }
        setTheme(editor, themeCompartment, editorTheme)
      }
    }
  },

  created () {
    this.$nextTick(() => {
      // TODO: Should we load markdown from the tab or mapped vue property?
      const { id } = this.currentTab
      const { markdown = '', theme, cursor, textDirection } = this
      const container = this.$refs.sourceCode

      // Determine theme
      let editorTheme = null
      if (railscastsThemes.includes(theme)) {
        editorTheme = 'railscasts'
      } else if (oneDarkThemes.includes(theme)) {
        editorTheme = 'one-dark'
      }

      // Create CM6 editor with configuration
      const { view, languageCompartment, themeCompartment } = createEditor(container, {
        value: markdown,
        lineNumbers: true,
        autofocus: true,
        theme: editorTheme,
        direction: textDirection,
        lineNumberFormatter: (line) => {
          if (line % 10 === 0 || line === 1) {
            return String(line)
          } else {
            return ''
          }
        }
      })

      this.editor = view
      this.languageCompartment = languageCompartment
      this.themeCompartment = themeCompartment

      bus.$on('file-loaded', this.handleFileChange)
      bus.$on('invalidate-image-cache', this.handleInvalidateImageCache)
      bus.$on('file-changed', this.handleFileChange)
      bus.$on('selectAll', this.handleSelectAll)
      bus.$on('image-action', this.handleImageAction)

      setMode(view, 'markdown', languageCompartment)
      this.listenChange()

      // NOTE: Cursor may be not null but the inner values are.
      if (cursor && cursor.anchor && cursor.focus) {
        const { anchor, focus } = cursor
        setSelection(view, anchor, focus, { scroll: true })
      } else {
        setCursorAtLastLine(view)
      }
      this.tabId = id
    })
  },
  beforeUnmount () {
    // NOTE: Clear timer and manually commit changes. After mode switching and cleanup may follow
    // further key inputs, so ignore all inputs.
    this.viewDestroyed = true
    if (this.commitTimer) clearTimeout(this.commitTimer)

    bus.$off('file-loaded', this.handleFileChange)
    bus.$off('invalidate-image-cache', this.handleInvalidateImageCache)
    bus.$off('file-changed', this.handleFileChange)
    bus.$off('selectAll', this.handleSelectAll)
    bus.$off('image-action', this.handleImageAction)

    const { editor } = this
    const { cursor, markdown } = this.getMarkdownAndCursor(editor)
    bus.$emit('file-changed', { id: this.tabId, markdown, cursor, renderCursor: true })

    // Destroy the editor
    if (editor) {
      editor.destroy()
    }
  },
  methods: {
    handleImageAction ({ id, result, alt }) {
      const { editor } = this
      const value = getValue(editor)
      const focus = getCursor(editor, 'head')
      const anchor = getCursor(editor, 'anchor')
      const lines = value.split('\n')
      const index = lines.findIndex(line => line.indexOf(id) > 0)

      if (index > -1) {
        const oldLine = lines[index]
        lines[index] = oldLine.replace(new RegExp(`!\\[${id}\\]\\(.*\\)`), `![${alt}](${result})`)
        const newValue = lines.join('\n')
        setValue(editor, newValue)
        const match = /(!\[.*\]\(.*\))/.exec(oldLine)
        if (!match) {
          // User maybe delete `![]()` structure, and the match is null.
          return
        }
        const range = {
          start: match.index,
          end: match.index + match[1].length
        }
        const delta = alt.length + result.length + 5 - match[1].length

        const adjust = pointer => {
          if (!pointer) {
            return
          }
          if (pointer.line !== index) {
            return
          }
          if (pointer.ch <= range.start) {
            // do nothing.
          } else if (pointer.ch > range.start && pointer.ch < range.end) {
            pointer.ch = range.start + alt.length + result.length + 5
          } else {
            pointer.ch += delta
          }
        }

        adjust(focus)
        adjust(anchor)
        if (focus && anchor) {
          setSelection(editor, anchor, focus, { scroll: true })
        } else {
          setCursorAtLastLine(editor)
        }
      }
    },
    listenChange () {
      const { editor } = this
      // CM6 uses updateListener extension for change events
      editor.contentDOM.addEventListener('input', () => {
        this.scheduleCommit()
      })
      // Also listen for selection changes
      editor.contentDOM.addEventListener('mouseup', () => {
        this.scheduleCommit()
      })
      editor.contentDOM.addEventListener('keyup', () => {
        this.scheduleCommit()
      })
    },
    scheduleCommit () {
      const { editor } = this
      const { cursor, markdown } = this.getMarkdownAndCursor(editor)
      // Attention: the cursor may be `{focus: null, anchor: null}` when press `backspace`
      const wordCount = getWordCount(markdown)
      if (this.commitTimer) clearTimeout(this.commitTimer)
      this.commitTimer = setTimeout(() => {
        // See "beforeDestroy" note
        if (!this.viewDestroyed) {
          if (this.tabId) {
            this.$store.dispatch('LISTEN_FOR_CONTENT_CHANGE', { id: this.tabId, markdown, wordCount, cursor })
          } else {
            // This may occur during tab switching but should not occur otherwise.
            console.warn('LISTEN_FOR_CONTENT_CHANGE: Cannot commit changes because not tab id was set!')
          }
        }
      }, 1000)
    },
    // Another tab was selected - only listen to get changes but don't set history or other things.
    handleFileChange ({ id, markdown, cursor }) {
      this.prepareTabSwitch()

      const { editor } = this
      if (typeof markdown === 'string') {
        setValue(editor, markdown)
      }
      // Cursor is null when loading a file or creating a new tab in source code mode.
      if (cursor) {
        const { anchor, focus } = cursor
        setSelection(editor, anchor, focus, { scroll: true })
      } else {
        setCursorAtLastLine(editor)
      }
      this.tabId = id
    },
    // Get markdown and cursor from CodeMirror.
    getMarkdownAndCursor (view) {
      let focus = getCursor(view, 'head')
      let anchor = getCursor(view, 'anchor')
      const markdown = getValue(view)
      const convertToMuyaCursor = cursor => {
        const line = getLine(view, cursor.line)
        const preLine = cursor.line > 0 ? getLine(view, cursor.line - 1) : null
        const nextLine = cursor.line < view.state.doc.lines - 1 ? getLine(view, cursor.line + 1) : null
        return adjustCursor(cursor, preLine, line, nextLine)
      }

      anchor = convertToMuyaCursor(anchor) // Selection start as Muya cursor
      focus = convertToMuyaCursor(focus) // Selection end as Muya cursor

      // Normalize cursor that `anchor` is always before `focus` because
      // this is the expected behavior in Muya.
      if (anchor && focus && anchor.line > focus.line) {
        const tmpCursor = focus
        focus = anchor
        anchor = tmpCursor
      }
      return { cursor: { focus, anchor }, markdown }
    },
    // Commit changes from old tab. Problem: tab was already switched, so commit changes with old tab id.
    prepareTabSwitch () {
      if (this.commitTimer) clearTimeout(this.commitTimer)
      if (this.tabId) {
        const { editor } = this
        const { cursor, markdown } = this.getMarkdownAndCursor(editor)
        this.$store.dispatch('LISTEN_FOR_CONTENT_CHANGE', { id: this.tabId, markdown, cursor })
        this.tabId = null // invalidate tab id
      }
    },

    handleSelectAll () {
      if (!this.sourceCode) {
        return
      }

      const { editor } = this
      if (editor && hasFocus(editor)) {
        selectAll(editor)
      } else {
        const activeElement = document.activeElement
        const nodeName = activeElement.nodeName
        if (nodeName === 'INPUT' || nodeName === 'TEXTAREA') {
          activeElement.select()
        }
      }
    },

    handleInvalidateImageCache () {
      // Note: CM6 doesn't have invalidateImageCache, this is a no-op
      // Images in markdown are handled by the markdown language support
    }
  }
}
</script>

<style>
  .source-code {
    height: calc(100vh - var(--titleBarHeight));
    box-sizing: border-box;
    overflow: auto;
  }
  .source-code .cm-editor {
    height: auto;
    margin: 50px auto;
    max-width: var(--editorAreaWidth);
    background: transparent;
  }
  .source-code .cm-gutters {
    border-right: none;
    background-color: transparent;
  }
  .source-code .cm-activeLine,
  .source-code .cm-activeLineGutter {
    background: var(--floatHoverColor);
  }
  /* CM6 line numbers styling */
  .source-code .cm-lineNumbers .cm-gutterElement {
    padding: 0 3px 0 5px;
    min-width: 20px;
    text-align: right;
  }
  /* Selection styling */
  .source-code .cm-selectionBackground {
    background: var(--selectionColor, rgba(178, 215, 254, 0.5)) !important;
  }
</style>
