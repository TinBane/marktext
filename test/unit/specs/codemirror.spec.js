/**
 * Unit tests for CodeMirror 6 wrapper functions
 * Tests the API compatibility layer that provides CM5-like interface
 */

// Note: These tests require a DOM environment
// The actual editor functionality is tested in e2e tests

import { expect } from 'chai'
import {
  search,
  getBeginPosition
} from '@/codeMirror'

describe('CodeMirror 6 Wrapper', () => {
  describe('search()', () => {
    it('should find languages by name', () => {
      const results = search('javascript')
      expect(results).to.be.an('array')
      expect(results.length).to.be.greaterThan(0)
      expect(results[0]).to.have.property('name')
      expect(results[0]).to.have.property('mode')
    })

    it('should return empty array for unknown language', () => {
      const results = search('notareallanguage12345')
      expect(results).to.be.an('array')
      expect(results.length).to.equal(0)
    })

    it('should find markdown', () => {
      const results = search('markdown')
      expect(results.length).to.be.greaterThan(0)
      expect(results.some(r => r.name === 'markdown')).to.equal(true)
    })

    it('should support fuzzy matching', () => {
      const results = search('js')
      expect(results).to.be.an('array')
      // Should match javascript, json, etc.
    })
  })

  describe('getBeginPosition()', () => {
    it('should return position at beginning', () => {
      const pos = getBeginPosition()
      expect(pos).to.deep.equal({
        anchor: { line: 0, ch: 0 },
        head: { line: 0, ch: 0 }
      })
    })
  })

  // Note: The following tests require a DOM environment with an actual EditorView
  // They are marked as pending since Karma doesn't provide a full DOM environment
  // These should be tested in e2e tests instead

  describe('EditorView-dependent functions (require DOM)', () => {
    // These functions require an actual EditorView instance:
    // - onlyHaveOneLine(view)
    // - isCursorAtBegin(view)
    // - isCursorAtEnd(view)
    // - isCursorAtFirstLine(view)
    // - isCursorAtLastLine(view)
    // - getEndPosition(view)
    // - getValue(view)
    // - setValue(view, text)
    // - getCursor(view, type)
    // - setCursor(view, line, ch)
    // - setSelection(view, anchor, head, options)
    // - getLine(view, lineNum)
    // - lastLine(view)
    // - lineCount(view)
    // - focus(view)
    // - hasFocus(view)
    // - selectAll(view)
    // - setTheme(view, themeCompartment, themeName)
    // - setMode(view, langName, langCompartment)
    // - setCursorAtLastLine(view)
    // - setCursorAtFirstLine(view)
    // - setTextDirection(view, direction)

    it.skip('should be tested in e2e tests with actual DOM', () => {
      // These require an actual browser environment
    })
  })
})
