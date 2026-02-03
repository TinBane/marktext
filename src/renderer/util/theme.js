import { THEME_STYLE_ID, COMMON_STYLE_ID, DEFAULT_CODE_FONT_FAMILY, oneDarkThemes, railscastsThemes } from '../config'
import { dark, graphite, materialDark, oneDark, ulysses } from './themeColor'
import { isLinux } from './index'

const patchTheme = css => {
  return `@media not print {\n${css}\n}`
}

const getEmojiPickerPatch = () => {
  return isLinux
    ? '.ag-emoji-picker section .emoji-wrapper .item span { font-family: sans-serif, "Noto Color Emoji"; }'
    : ''
}

export const addThemeStyle = theme => {
  const isCmRailscasts = railscastsThemes.includes(theme)
  const isCmOneDark = oneDarkThemes.includes(theme)
  const isDarkTheme = isCmOneDark || isCmRailscasts
  let themeStyleEle = document.querySelector(`#${THEME_STYLE_ID}`)
  if (!themeStyleEle) {
    themeStyleEle = document.createElement('style')
    themeStyleEle.id = THEME_STYLE_ID
    document.head.appendChild(themeStyleEle)
  }

  switch (theme) {
    case 'light':
      themeStyleEle.innerHTML = ''
      break
    case 'dark':
      themeStyleEle.innerHTML = patchTheme(dark())
      break
    case 'material-dark':
      themeStyleEle.innerHTML = patchTheme(materialDark())
      break
    case 'ulysses':
      themeStyleEle.innerHTML = patchTheme(ulysses())
      break
    case 'graphite':
      themeStyleEle.innerHTML = patchTheme(graphite())
      break
    case 'one-dark':
      themeStyleEle.innerHTML = patchTheme(oneDark())
      break
    default:
      console.log('unknown theme')
      break
  }

  // workaround: use dark icons
  document.body.classList.remove('dark')
  if (isDarkTheme) {
    document.body.classList.add('dark')
  }

  // Note: CodeMirror 6 theme switching is handled by the sourceCode.vue component
  // through the Vue reactivity system watching the theme preference
}

export const setEditorWidth = value => {
  const EDITOR_WIDTH_STYLE_ID = 'editor-width'
  let result = ''
  if (value && /^[0-9]+(?:ch|px|%)$/.test(value)) {
    // Overwrite the theme value and add 100px for padding.
    result = `:root { --editorAreaWidth: calc(100px + ${value}); }`
  }
  let styleEle = document.querySelector(`#${EDITOR_WIDTH_STYLE_ID}`)
  if (!styleEle) {
    styleEle = document.createElement('style')
    styleEle.setAttribute('id', EDITOR_WIDTH_STYLE_ID)
    document.head.appendChild(styleEle)
  }

  styleEle.innerHTML = result
}

export const addCommonStyle = options => {
  const { codeFontFamily, codeFontSize, hideScrollbar } = options
  let sheet = document.querySelector(`#${COMMON_STYLE_ID}`)
  if (!sheet) {
    sheet = document.createElement('style')
    sheet.id = COMMON_STYLE_ID
    document.head.appendChild(sheet)
  }

  let scrollbarStyle = ''
  if (hideScrollbar) {
    scrollbarStyle = '::-webkit-scrollbar {display: none;}'
  }

  sheet.innerHTML = `${scrollbarStyle}
span code,
td code,
th code,
code,
code[class*="language-"],
.cm-editor,
pre.ag-paragraph {
font-family: ${codeFontFamily}, ${DEFAULT_CODE_FONT_FAMILY};
font-size: ${codeFontSize}px;
}

${getEmojiPickerPatch()}
`
}

export const addElementStyle = () => {
  // Element Plus uses CSS variables natively for theming
  // We just need to set up our custom CSS variable mappings
  const ID = 'mt-el-style'
  let sheet = document.querySelector(`#${ID}`)
  if (sheet) {
    return
  }

  sheet = document.createElement('style')
  sheet.id = ID
  document.head.insertBefore(sheet, document.head.firstChild)

  // Map Element Plus CSS variables to MarkText theme variables
  let cssVars = ':root {\n'
  cssVars += '  --el-color-primary: var(--themeColor);\n'
  for (let i = 1; i <= 9; i++) {
    cssVars += `  --el-color-primary-light-${i}: var(--themeColor${i}0);\n`
  }
  cssVars += '}\n'

  sheet.innerHTML = cssVars
}

// Append common sheet and theme at the end of head - order is important.
export const addStyles = options => {
  const { theme } = options
  addThemeStyle(theme)
  addCommonStyle(options)
}
