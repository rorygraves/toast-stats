// RED stub — replaced by the GREEN implementation in the next commit (#883).
import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  message: string
  actionLabel: string
  actionHref: string
  icon?: ReactNode
}

export function EmptyState(_props: EmptyStateProps) {
  return null
}
