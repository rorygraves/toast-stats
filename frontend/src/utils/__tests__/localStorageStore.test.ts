import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  STORAGE_VERSION,
  storageKey,
  readJson,
  writeJson,
  removeKey,
} from '../localStorageStore'

describe('localStorageStore — versioned localStorage primitive (#420)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('storageKey', () => {
    it('namespaces keys with toast-stats prefix and a version', () => {
      expect(storageKey('foo')).toBe(`toast-stats:v${STORAGE_VERSION}:foo`)
    })
  })

  describe('readJson', () => {
    it('returns the fallback when no value is stored', () => {
      expect(readJson('missing', { x: 1 })).toEqual({ x: 1 })
    })

    it('returns the parsed value when present', () => {
      writeJson('greeting', { hello: 'world' })
      expect(readJson('greeting', null)).toEqual({ hello: 'world' })
    })

    it('returns the fallback when the stored value is not valid JSON', () => {
      localStorage.setItem(storageKey('broken'), '{not json')
      expect(readJson('broken', 'fallback')).toBe('fallback')
    })

    it('returns the fallback if localStorage throws (e.g. private mode)', () => {
      const spy = vi
        .spyOn(window.localStorage, 'getItem')
        .mockImplementation(() => {
          throw new Error('quota exceeded')
        })
      try {
        expect(readJson('foo', 'safe')).toBe('safe')
      } finally {
        spy.mockRestore()
      }
    })
  })

  describe('writeJson', () => {
    it('writes a JSON-serialised value', () => {
      writeJson('coords', { lat: 1, lng: 2 })
      const raw = localStorage.getItem(storageKey('coords'))
      expect(raw).toBe(JSON.stringify({ lat: 1, lng: 2 }))
    })

    it('swallows storage errors and returns false', () => {
      const spy = vi
        .spyOn(window.localStorage, 'setItem')
        .mockImplementation(() => {
          throw new Error('quota')
        })
      try {
        expect(writeJson('foo', 1)).toBe(false)
      } finally {
        spy.mockRestore()
      }
    })
  })

  describe('removeKey', () => {
    it('removes a stored value', () => {
      writeJson('temp', 1)
      removeKey('temp')
      expect(readJson('temp', null)).toBe(null)
    })
  })
})
