/**
 * Railscasts theme for CodeMirror 6
 * Based on the classic Railscasts theme by Ryan Bates
 */
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

// Color palette
const colors = {
  background: '#2b2b2b',
  foreground: '#e6e1dc',
  selection: '#5a647e',
  cursor: '#d4cfc9',
  activeLine: 'rgba(255, 255, 255, 0.04)',
  gutter: '#777',
  // Syntax colors
  red: '#da4939',
  orange: '#cc7833',
  yellow: '#ffc66d',
  green: '#a5c261',
  cyan: '#519f50',
  blue: '#6d9cbe',
  purple: '#b6b3eb',
  gray: '#bc9458'
}

// Editor theme (UI elements)
const railscastsEditorTheme = EditorView.theme({
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
    borderBottom: `2px solid ${colors.yellow}`,
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
const railscastsHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: colors.orange },
  { tag: [t.name, t.deleted, t.character, t.macroName], color: colors.foreground },
  { tag: [t.propertyName], color: colors.yellow },
  { tag: [t.function(t.variableName), t.labelName], color: colors.yellow },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: colors.blue },
  { tag: [t.definition(t.name), t.separator], color: colors.foreground },
  { tag: [t.typeName, t.className, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: colors.foreground },
  { tag: [t.number], color: colors.blue },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: colors.foreground },
  { tag: [t.meta, t.comment], color: colors.gray, fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: colors.blue, textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: colors.yellow },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: colors.blue },
  { tag: [t.processingInstruction, t.string, t.inserted], color: colors.green },
  { tag: t.invalid, color: colors.red },
  { tag: t.variableName, color: colors.blue }
])

/**
 * Combined Railscasts theme extension for CodeMirror 6
 * Includes both editor theme (UI) and syntax highlighting
 * @type {Array} Array of CodeMirror extensions
 */
export const railscasts = [
  railscastsEditorTheme,
  syntaxHighlighting(railscastsHighlightStyle)
]

/**
 * @exports railscastsEditorTheme - Editor UI theme (background, gutters, cursor, etc.)
 * @exports railscastsHighlightStyle - Syntax highlighting styles
 * @exports railscastsColors - Color palette object
 */
export { railscastsEditorTheme, railscastsHighlightStyle, colors as railscastsColors }
