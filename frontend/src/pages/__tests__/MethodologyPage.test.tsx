/* /methodology page — content correctness against authoritative sources
   (#439 DCP tier definitions, #440 Club health classifications). */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MethodologyPage from '../MethodologyPage'

const renderPage = () =>
  render(
    <MemoryRouter>
      <MethodologyPage />
    </MemoryRouter>
  )

describe('MethodologyPage — DCP tier definitions (#439)', () => {
  it('Distinguished tier alt is net growth ≥ 3 (NOT 75% retention)', () => {
    renderPage()
    const txt = document.body.textContent || ''
    expect(txt).toMatch(/distinguished.*net growth ≥ 3/i)
    // The fictional '75% retention' / 'net +5 / 75% retention' wording is gone
    expect(txt).not.toMatch(/75% retention/i)
  })

  it("Select Distinguished alt is net growth ≥ 5 (NOT 'same membership floor')", () => {
    renderPage()
    const txt = document.body.textContent || ''
    expect(txt).toMatch(/select distinguished.*net growth ≥ 5/i)
  })

  it("President's Distinguished explicitly notes no growth alternative", () => {
    renderPage()
    const txt = document.body.textContent || ''
    expect(txt).toMatch(
      /president's distinguished[\s\S]{0,80}no growth alternative/i
    )
  })

  it('Smedley is named "Smedley Distinguished" with 10 goals + 25 members (not "Award" + chartered new club)', () => {
    renderPage()
    const txt = document.body.textContent || ''
    expect(txt).toMatch(/smedley distinguished[\s\S]{0,80}10[\s\S]{0,40}25/i)
    expect(txt).not.toMatch(/chartered new club/i)
  })
})

describe('MethodologyPage — Club health classifications (#440)', () => {
  it('lists exactly three statuses (no invented "Healthy" or "Watch" or "At-risk")', () => {
    renderPage()
    const txt = document.body.textContent || ''
    expect(txt).toMatch(/thriving/i)
    expect(txt).toMatch(/vulnerable/i)
    expect(txt).toMatch(/intervention required/i)
    // Invented tiers must not appear in the section copy
    expect(txt).not.toMatch(/\bhealthy\b/i)
    expect(txt).not.toMatch(/\bwatch\b.*missed renewal/i)
    expect(txt).not.toMatch(/under 8 paid members/i)
  })

  it('Thriving criteria mention all three actual gates: membership, DCP checkpoint, CSP', () => {
    renderPage()
    const txt = document.body.textContent || ''
    // Thriving text mentions all 3 requirements
    expect(txt).toMatch(/CSP|Club Success Plan/i)
    expect(txt).toMatch(/DCP checkpoint/i)
    expect(txt).toMatch(/20\+ paid members.*net growth ≥ 3/i)
  })

  it('Intervention Required uses < 12 (not under 8) AND net growth < 3', () => {
    renderPage()
    const txt = document.body.textContent || ''
    expect(txt).toMatch(/paid members\s*&?lt;?\s*12|paid members\s*<\s*12/i)
    expect(txt).toMatch(/net growth\s*&?lt;?\s*3|net growth\s*<\s*3/i)
  })
})
