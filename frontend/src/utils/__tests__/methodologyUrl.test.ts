/* methodologyUrl codec — the URL contract for /methodology open-section state
   (#981, epic #969 Sprint 5). The parse is the chokepoint every entry path
   (typed URL, shared link, back button) flows through, so the whitelist /
   dedup invariants are asserted here, not only at the handler (Lesson 144). */

import { describe, it, expect } from 'vitest'
import {
  OPEN_SECTIONS_PARAM,
  parseOpenSections,
  serializeOpenSections,
  sectionFromHash,
} from '../methodologyUrl'

const VALID = new Set(['borda-count', 'glossary', 'caveats'])
const parse = parseOpenSections(VALID)

describe('methodologyUrl — parseOpenSections', () => {
  it('keeps only whitelisted section ids', () => {
    expect(parse('borda-count,bogus,glossary')).toEqual([
      'borda-count',
      'glossary',
    ])
  })

  it('drops an entirely unknown value to an empty list (no phantom seed)', () => {
    expect(parse('not-a-section')).toEqual([])
  })

  it('de-dups repeated ids, preserving first-seen order', () => {
    expect(parse('glossary,borda-count,glossary')).toEqual([
      'glossary',
      'borda-count',
    ])
  })

  it('trims whitespace and ignores empty segments', () => {
    expect(parse(' borda-count , , glossary ')).toEqual([
      'borda-count',
      'glossary',
    ])
  })

  it('returns an empty list for an empty string', () => {
    expect(parse('')).toEqual([])
  })
})

describe('methodologyUrl — serializeOpenSections', () => {
  it('joins ids with commas', () => {
    expect(serializeOpenSections(['borda-count', 'glossary'])).toBe(
      'borda-count,glossary'
    )
  })

  it('serializes an empty list to the empty string (the clean-URL default)', () => {
    expect(serializeOpenSections([])).toBe('')
  })

  it('round-trips through parse', () => {
    const ids = ['glossary', 'caveats']
    expect(parse(serializeOpenSections(ids))).toEqual(ids)
  })
})

describe('methodologyUrl — sectionFromHash', () => {
  it('resolves a leading-# fragment to a known id', () => {
    expect(sectionFromHash('#borda-count', VALID)).toBe('borda-count')
  })

  it('resolves a bare id too', () => {
    expect(sectionFromHash('glossary', VALID)).toBe('glossary')
  })

  it('returns null for an unknown fragment', () => {
    expect(sectionFromHash('#bogus', VALID)).toBeNull()
  })

  it('returns null for an empty hash', () => {
    expect(sectionFromHash('', VALID)).toBeNull()
  })
})

describe('methodologyUrl — constants', () => {
  it('uses a stable search-param key', () => {
    expect(OPEN_SECTIONS_PARAM).toBe('openSections')
  })
})
