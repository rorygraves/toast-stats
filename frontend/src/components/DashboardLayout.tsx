import React, { ReactNode } from 'react'

export interface DashboardLayoutProps {
  children: ReactNode
  header?: ReactNode
  className?: string
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  header,
  className = '',
}) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-[2560px]">
        {header && (
          <header className="mb-6 sm:mb-8" role="banner">
            {header}
          </header>
        )}

        {/* AppShell owns the <main id="main-content"> landmark. */}
        <section
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 ${className}`}
          aria-label="District statistics dashboard"
        >
          {children}
        </section>
      </div>
    </div>
  )
}

export default DashboardLayout
