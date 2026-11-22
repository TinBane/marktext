# Fork notes

This branch is upstream MarkText (`marktext/marktext`, `develop`) plus a small set of fork-only changes. Everything else, including all library versions, comes from upstream; to update, merge or rebase onto `upstream/develop` again.

The previous fork (`update_components`, webpack + Vue compat + CodeMirror 6) is kept on its own branch for reference. Its library upgrades were all superseded by upstream's own rebuild (pnpm monorepo, TypeScript, electron-vite, Electron 45).

## Changes applied on this branch

| Change | Where |
|---|---|
| **Lato Print** export theme for PDF and printing | `packages/desktop/src/renderer/src/assets/themes/export/lato-print.theme.css`, registered in `exportSettings/exportOptions.ts` and `util/pdf.ts`; label `exportSettings.options.themes.latoPrint` in every locale |
| **macOS signing and notarization** (upstream ships unsigned) | `packages/desktop/electron-builder.yml` (`mac:`), `.github/workflows/release.yml` (secrets on the mac build step); setup in [docs/dev/MACOS_CODE_SIGNING.md](docs/dev/MACOS_CODE_SIGNING.md) |
| **Payload remote-build configs** | `build.sh`, `build.bat`, `build_mac.yaml`, `build_win.yaml` (pnpm / electron-vite commands) |

## Parked patches (not applied)

Two fixes from the old fork are kept as patch files in [`fork-patches/`](fork-patches/), because upstream rewrote the editor engine (`packages/muya`, `@muyajs/core`) and they may no longer be needed. They are diffs against the **old** tree (`src/muya/lib/...`, Vuex prefs), so they will not `git apply` here; they record what the fix did. Test the scenario first, and port a patch only if the problem still reproduces.

### `delete-key-code-block-guard.patch`

- **Bug it fixed:** pressing Delete at the end of a line could merge a protected block (code block content, table cell, code-language input, footnote input) with its neighbour, pulling text into a code block and throwing errors.
- **How to test:** put the cursor at the end of a paragraph directly above a fenced code block, a table, and a footnote, and press Delete; also at the end of the last line inside a code block (including after a trailing `>`), and at the end of the code-language input. Nothing should merge and the console should stay clean.
- **Likely status:** probably not needed. In the new engine the paragraph Delete handler only merges into a following *paragraph* and does nothing for code content or table cells (`packages/muya/src/block/base/format.ts`, `deleteHandler`), and code/language content swallows Delete at the end (`packages/muya/src/block/base/content.ts`).
- **If it still reproduces:** add the guard to the relevant `deleteHandler` in `packages/muya/src/block/...`, with a spec next to the existing ones in `packages/muya/src/block/base/__tests__/`.

### `table-spacing-autofix.patch`

- **Bug it fixed:** a table written directly under a line of text (no blank line between them) didn't render as a table. The patch added an editor setting, "Automatically fix missing blank lines before tables" (on by default), that inserts the blank line when a file is opened. Because it rewrites the markdown on load, saving the file afterwards keeps the inserted blank line.
- **How to test:** open a file containing

  ```markdown
  Some intro text
  | a | b |
  |---|---|
  | 1 | 2 |
  ```

  and check whether the table renders as a table, in both WYSIWYG and source mode, and in HTML/PDF export.

- **Likely status:** unknown. Upstream moved to `marked` 18 and has done a lot of CommonMark/GFM alignment work, and GFM itself allows a table to start straight after a paragraph line, so it may now work without the fix.
- **If it still reproduces:** port it as a Muya option (`packages/muya/src/config/index.ts`, `packages/muya/src/types.ts`, the `markdownToState` pre-lex step in `packages/muya/src/state/markdownToState.ts`), plus the desktop preference (`packages/desktop/src/shared/preferences/schema.json`, `static/preference.json`, `src/shared/types/preferences.ts`, the editor preference page and `editor.vue` option wiring, and a label in every locale). Follow how `trimUnnecessaryCodeBlockEmptyLines` is wired end to end.

The old fork's third fix in the same commit (whitelisting `@codemirror/*` in webpack so source mode wasn't blank in the packaged Mac app) is obsolete: upstream uses electron-vite and CodeMirror 5.
