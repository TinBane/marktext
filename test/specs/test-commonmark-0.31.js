/**
 * Quick CommonMark 0.31.2 spec test
 * Tests MarkText's parser against the latest CommonMark spec
 */

const HtmlDiffer = require('@markedjs/html-differ').HtmlDiffer

// Transpile ES modules for the parser
require('@babel/register')({
  presets: ['@babel/preset-env'],
  only: [/src\/muya/],
  cache: false
})

// Import the MarkText parser
const marked = require('../../src/muya/lib/parser/marked/index.js').default

const MT_MARKED_OPTIONS = {
  headerIds: false,
  emoji: false,
  math: false,
  frontMatter: false
}

const htmlDiffer = new HtmlDiffer({
  ignoreSelfClosingSlash: true,
  ignoreAttributes: ['id', 'class']
})

// Remove MarkText-specific classes for comparison
function removeCustomClass (html) {
  return html
    .replace(/\sclass="[^"]*"/g, '')
    .replace(/\sid="[^"]*"/g, '')
}

async function runTests () {
  console.log('Fetching CommonMark 0.31.2 spec...')

  const specUrl = 'https://spec.commonmark.org/0.31.2/spec.json'
  const response = await fetch(specUrl)
  const specs = await response.json()

  console.log(`Testing ${specs.length} examples against MarkText parser...\n`)

  let passed = 0
  let failed = 0
  const failures = []
  const sectionStats = {}

  for (const spec of specs) {
    const { example, section, markdown, html: expectedHtml } = spec

    // Initialize section stats
    if (!sectionStats[section]) {
      sectionStats[section] = { total: 0, passed: 0, failed: 0 }
    }
    sectionStats[section].total++

    try {
      const actualHtml = removeCustomClass(marked(markdown, MT_MARKED_OPTIONS))
      const isEqual = htmlDiffer.isEqual(actualHtml, expectedHtml)

      if (isEqual) {
        passed++
        sectionStats[section].passed++
      } else {
        failed++
        sectionStats[section].failed++
        failures.push({
          example,
          section,
          markdown,
          expected: expectedHtml,
          actual: actualHtml
        })
      }
    } catch (err) {
      failed++
      sectionStats[section].failed++
      failures.push({
        example,
        section,
        markdown,
        error: err.message
      })
    }
  }

  // Print results
  console.log('='.repeat(70))
  console.log('CommonMark 0.31.2 Spec Test Results')
  console.log('='.repeat(70))
  console.log(`\nTotal: ${specs.length} | Passed: ${passed} | Failed: ${failed}`)
  console.log(`Pass rate: ${((passed / specs.length) * 100).toFixed(2)}%\n`)

  console.log('Results by section:')
  console.log('-'.repeat(70))

  const maxSectionLen = Math.max(...Object.keys(sectionStats).map(s => s.length))

  for (const [section, stats] of Object.entries(sectionStats)) {
    const pct = ((stats.passed / stats.total) * 100).toFixed(1)
    const status = stats.failed === 0 ? '✓' : '✗'
    console.log(
      `${status} ${section.padEnd(maxSectionLen)} | ${stats.passed}/${stats.total} (${pct}%)`
    )
  }

  if (failures.length > 0 && failures.length <= 20) {
    console.log('\n' + '='.repeat(70))
    console.log('Failed Examples:')
    console.log('='.repeat(70))

    for (const f of failures.slice(0, 10)) {
      console.log(`\nExample ${f.example} (${f.section}):`)
      console.log('Markdown:', JSON.stringify(f.markdown))
      if (f.error) {
        console.log('Error:', f.error)
      } else {
        console.log('Expected:', f.expected.trim())
        console.log('Actual:  ', f.actual.trim())
      }
    }

    if (failures.length > 10) {
      console.log(`\n... and ${failures.length - 10} more failures`)
    }
  }

  return { passed, failed, total: specs.length }
}

runTests()
  .then(({ passed, failed, total }) => {
    process.exit(failed > 0 ? 1 : 0)
  })
  .catch(err => {
    console.error('Test failed:', err)
    process.exit(1)
  })
