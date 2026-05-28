import { describe, it, expect } from 'vitest'
import { buildPaymentSegments } from '../paymentComposition'

/* #868 — single source of truth for the payment-composition breakdown,
   shared by the desktop donut and the mobile sparkbar so the two surfaces
   can never drift on what counts as a payment or how shares are rounded
   (Lesson 117 / R7). */

const baseInputs = {
  newPayments: 580,
  aprilPayments: 720,
  octoberPayments: 1110,
  latePayments: 18,
  charterPayments: 380,
}

describe('buildPaymentSegments', () => {
  it('sums all five buckets into totalPayments', () => {
    const { totalPayments } = buildPaymentSegments(baseInputs)
    expect(totalPayments).toBe(580 + 720 + 1110 + 18 + 380) // 2808
  })

  it('emits one segment per non-zero bucket, in canonical order', () => {
    const { segments } = buildPaymentSegments(baseInputs)
    expect(segments.map(s => s.key)).toEqual([
      'new',
      'april',
      'october',
      'late',
      'charter',
    ])
  })

  it('drops zero-count buckets', () => {
    const { segments } = buildPaymentSegments({
      ...baseInputs,
      latePayments: 0,
    })
    expect(segments.map(s => s.key)).not.toContain('late')
    expect(segments).toHaveLength(4)
  })

  it('computes rounded integer percent shares of the total', () => {
    const { segments } = buildPaymentSegments(baseInputs)
    const october = segments.find(s => s.key === 'october')!
    // 1110 / 2808 = 39.5% → rounds to 40
    expect(october.percent).toBe(40)
    const late = segments.find(s => s.key === 'late')!
    // 18 / 2808 = 0.64% → rounds to 1
    expect(late.percent).toBe(1)
  })

  it('gives each segment a human label and a colour', () => {
    const { segments } = buildPaymentSegments(baseInputs)
    const newSeg = segments.find(s => s.key === 'new')!
    expect(newSeg.label).toBe('New member payments')
    expect(newSeg.color).toMatch(/var\(|rgb|#/)
  })

  it('returns zero total and no segments when there are no payments', () => {
    const { totalPayments, segments } = buildPaymentSegments({
      newPayments: 0,
      aprilPayments: 0,
      octoberPayments: 0,
      latePayments: 0,
      charterPayments: 0,
    })
    expect(totalPayments).toBe(0)
    expect(segments).toEqual([])
  })
})
