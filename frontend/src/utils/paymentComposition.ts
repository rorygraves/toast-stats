/* Payment-composition segment builder (#868).

   Single source of truth for breaking the district's payment events into
   New / April / October / Late / Charter buckets, shared by the desktop
   PaymentCompositionDonut and the mobile PaymentCompositionSparkbar. Both
   surfaces must agree on what counts as a payment and how shares round, so
   the math lives here once rather than in each renderer (Lesson 117 / R7). */

export interface PaymentCompositionInputs {
  newPayments: number
  aprilPayments: number
  octoberPayments: number
  latePayments: number
  charterPayments: number
}

export interface PaymentSegment {
  key: 'new' | 'april' | 'october' | 'late' | 'charter'
  label: string
  count: number
  /** SVG/CSS colour (CSS var with hex fallback). Shared by both renderers. */
  color: string
  /** Rounded integer percent share of totalPayments. */
  percent: number
}

interface SegmentDef {
  key: PaymentSegment['key']
  label: string
  color: string
}

// Canonical order + presentation for every bucket. Colours match the
// original donut so the two surfaces are visually identical.
const SEGMENT_DEFS: SegmentDef[] = [
  {
    key: 'new',
    label: 'New member payments',
    color: 'var(--tm-loyal-blue, #004165)',
  },
  {
    key: 'april',
    label: 'April renewals',
    color: 'var(--tm-loyal-blue-80, #3D7AA0)',
  },
  { key: 'october', label: 'October renewals', color: 'rgb(22 163 74)' },
  {
    key: 'late',
    label: 'Late payments',
    color: 'var(--tm-true-maroon, #772432)',
  },
  {
    key: 'charter',
    label: 'Charter payments',
    color: 'var(--yellow-500, #f59e0b)',
  },
]

export interface PaymentComposition {
  totalPayments: number
  segments: PaymentSegment[]
}

/**
 * Build the payment-composition breakdown. A single member can appear in
 * multiple buckets, so totalPayments is the sum of payment events (not the
 * membership count). Zero-count buckets are dropped; when there are no
 * payments at all, returns an empty segment list so callers can render null.
 */
export function buildPaymentSegments(
  inputs: PaymentCompositionInputs
): PaymentComposition {
  const counts: Record<PaymentSegment['key'], number> = {
    new: inputs.newPayments,
    april: inputs.aprilPayments,
    october: inputs.octoberPayments,
    late: inputs.latePayments,
    charter: inputs.charterPayments,
  }

  const totalPayments =
    counts.new + counts.april + counts.october + counts.late + counts.charter

  if (totalPayments <= 0) return { totalPayments: 0, segments: [] }

  const segments: PaymentSegment[] = SEGMENT_DEFS.map(def => ({
    ...def,
    count: counts[def.key],
    percent: Math.round((counts[def.key] / totalPayments) * 100),
  })).filter(seg => seg.count > 0)

  return { totalPayments, segments }
}
