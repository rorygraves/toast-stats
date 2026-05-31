import { describe, it, expect } from 'vitest'
import {
  DiffEventCategorySchema,
  DiffEventSchema,
} from '../schemas/snapshot-diff.schema.js'

/* Schema contract for the area/division status-transition events (#1014,
   epic #1007 Sprint 2). The diff event vocabulary gains two entity-scoped
   categories and optional area/division refs so a single DiffEvent can carry
   a club, an area, OR a division — the existing club-scoped events keep their
   exact shape (clubId/clubName required-but-emptyable, no new fields needed). */

describe('DiffEventCategorySchema (#1014)', () => {
  it.each([
    'membership',
    'dcp-goals',
    'distinguished',
    'club-added',
    'club-removed',
    'area-status',
    'division-status',
  ])('accepts the %s category', category => {
    expect(DiffEventCategorySchema.parse(category)).toBe(category)
  })

  it('rejects an unknown category', () => {
    expect(() => DiffEventCategorySchema.parse('region-status')).toThrow()
  })
})

describe('DiffEventSchema entity refs (#1014)', () => {
  it('parses a division-status event with a divisionId + entityName', () => {
    const event = {
      category: 'division-status',
      clubId: '',
      clubName: '',
      divisionId: 'G',
      entityName: 'Division G',
      label: 'Division G moved to Select Distinguished',
      magnitude: 1,
    }
    expect(DiffEventSchema.parse(event)).toMatchObject({
      category: 'division-status',
      divisionId: 'G',
      entityName: 'Division G',
    })
  })

  it('parses an area-status event carrying both areaId and divisionId', () => {
    const event = {
      category: 'area-status',
      clubId: '',
      clubName: '',
      divisionId: 'B',
      areaId: 'B2',
      entityName: 'Area B2',
      label: 'Area B2 moved to Confirmed Distinguished',
      magnitude: 1,
    }
    expect(DiffEventSchema.parse(event)).toMatchObject({
      areaId: 'B2',
      divisionId: 'B',
    })
  })

  it('still parses a club-scoped event with no entity refs (back-compat)', () => {
    const event = {
      category: 'membership',
      clubId: '123',
      clubName: 'Acme Club',
      label: 'Acme Club gained 5 members',
      magnitude: 5,
    }
    const parsed = DiffEventSchema.parse(event)
    expect(parsed.areaId).toBeUndefined()
    expect(parsed.divisionId).toBeUndefined()
  })
})
