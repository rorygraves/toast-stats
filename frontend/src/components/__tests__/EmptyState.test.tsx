import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EmptyState } from '../EmptyState'

function renderEmptyState(props: Parameters<typeof EmptyState>[0]) {
  return render(
    <MemoryRouter>
      <EmptyState {...props} />
    </MemoryRouter>,
  )
}

describe('EmptyState', () => {
  it('renders the title and message', () => {
    renderEmptyState({
      title: 'Nothing here yet',
      message: 'There is no data to show.',
      actionLabel: 'Go home',
      actionHref: '/',
    })
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    expect(screen.getByText('There is no data to show.')).toBeInTheDocument()
  })

  it('renders the action as a router link to the given href', () => {
    renderEmptyState({
      title: 'Nothing here yet',
      message: 'There is no data to show.',
      actionLabel: 'View all regions',
      actionHref: '/regions',
    })
    const action = screen.getByRole('link', { name: 'View all regions' })
    expect(action).toHaveAttribute('href', '/regions')
  })

  it('styles the action as a button affordance (not a bare text link)', () => {
    renderEmptyState({
      title: 'Nothing here yet',
      message: 'There is no data to show.',
      actionLabel: 'View all regions',
      actionHref: '/regions',
    })
    const action = screen.getByRole('link', { name: 'View all regions' })
    expect(action).toHaveClass('empty-state__action')
  })

  it('renders a decorative icon hidden from assistive tech', () => {
    const { container } = renderEmptyState({
      title: 'Nothing here yet',
      message: 'There is no data to show.',
      actionLabel: 'Go home',
      actionHref: '/',
    })
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('wraps content in a card container', () => {
    const { container } = renderEmptyState({
      title: 'Nothing here yet',
      message: 'There is no data to show.',
      actionLabel: 'Go home',
      actionHref: '/',
    })
    expect(container.querySelector('.empty-state')).not.toBeNull()
  })
})
