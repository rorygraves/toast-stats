import { screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

/* Click a /districts search-suggestion by accessible name. Filters
   getAllByRole('option') to the inner <a> because both the <li> and
   the inner <Link> currently carry role=option (pre-existing dual-role
   nit in DistrictsPage.tsx — when fixed, the filter is a no-op). */
export async function clickSearchSuggestion(
  user: UserEvent,
  name: RegExp
): Promise<void> {
  const suggestions = await screen.findAllByRole('option', { name })
  const link = suggestions.find(el => el.tagName === 'A')
  if (!link) throw new Error(`search suggestion link not found for ${name}`)
  await user.click(link)
}
