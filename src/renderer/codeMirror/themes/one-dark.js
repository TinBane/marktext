/**
 * One Dark theme for CodeMirror 6
 * Based on Atom One Dark by Török Ádám (Aerobird98)
 * MIT License
 */
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

// Color palette
const colors = {
  background: '#282c34',
  foreground: '#abb2bf',
  selection: '#3e4451',
  cursor: '#56b6c2',
  activeLine: 'rgba(153, 187, 255, 0.04)',
  gutter: '#5c6370',
  // Syntax colors
  red: '#e06c75',
  orange: '#d19a66',
  yellow: '#e5c07b',
  green: '#98c379',
  cyan: '#56b6c2',
  blue: '#61afef',
  purple: '#c678dd',
  gray: '#5c6370'
}

// Editor theme (UI elements)
const oneDarkEditorTheme = EditorView.theme({
  '&': {
    color: colors.foreground,
    backgroundColor: colors.background
  },
  '.cm-content': {
    caretColor: colors.cursor
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: colors.cursor,
    borderLeftWidth: '2px'
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: colors.selection
  },
  '.cm-panels': {
    backgroundColor: colors.background,
    color: colors.foreground
  },
  '.cm-panels.cm-panels-top': {
    borderBottom: `1px solid ${colors.gutter}`
  },
  '.cm-panels.cm-panels-bottom': {
    borderTop: `1px solid ${colors.gutter}`
  },
  '.cm-searchMatch': {
    backgroundColor: '#72a1ff59',
    outline: '1px solid #457dff'
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#6199ff2f'
  },
  '.cm-activeLine': {
    backgroundColor: colors.activeLine
  },
  '.cm-selectionMatch': {
    backgroundColor: '#aafe661a'
  },
  '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
    borderBottom: `2px solid ${colors.cyan}`,
    color: colors.foreground
  },
  '.cm-gutters': {
    backgroundColor: colors.background,
    color: colors.gutter,
    border: 'none'
  },
  '.cm-activeLineGutter': {
    backgroundColor: colors.activeLine
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'transparent',
    border: 'none',
    color: colors.gutter
  },
  '.cm-tooltip': {
    border: 'none',
    backgroundColor: colors.background
  },
  '.cm-tooltip .cm-tooltip-arrow:before': {
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent'
  },
  '.cm-tooltip .cm-tooltip-arrow:after': {
    borderTopColor: colors.background,
    borderBottomColor: colors.background
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: colors.selection,
      color: colors.foreground
    }
  }
}, { dark: true })

// Syntax highlighting styles
const oneDarkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: colors.purple },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: colors.red },
  { tag: [t.function(t.variableName), t.labelName], color: colors.blue },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: colors.orange },
  { tag: [t.definition(t.name), t.separator], color: colors.yellow },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: colors.orange },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: colors.cyan },
  { tag: [t.meta, t.comment], color: colors.gray, fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold', color: colors.orange },
  { tag: t.emphasis, fontStyle: 'italic', color: colors.purple },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: colors.green, textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: colors.red },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: colors.orange },
  { tag: [t.processingInstruction, t.string, t.inserted], color: colors.green },
  { tag: t.invalid, color: colors.red }
])

/**
 * Combined One Dark theme extension for CodeMirror 6
 * Includes both editor theme (UI) and syntax highlighting
 * @type {Array} Array of CodeMirror extensions
 */
export const oneDark = [
  oneDarkEditorTheme,
  syntaxHighlighting(oneDarkHighlightStyle)
]

/**
 * @exports oneDarkEditorTheme - Editor UI theme (background, gutters, cursor, etc.)
 * @exports oneDarkHighlightStyle - Syntax highlighting styles
 * @exports oneDarkColors - Color palette object
 */
export { oneDarkEditorTheme, oneDarkHighlightStyle, colors as oneDarkColors }
