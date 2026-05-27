/**
 * Lighthouse CI Configuration (#222)
 *
 * Performance budgets enforced on every PR:
 * - LCP < 2.5s, FID < 100ms, CLS < 0.1
 * - Bundle size budget: < 500KB gzipped (main bundle)
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview --prefix frontend',
      startServerReadyPattern: 'ready',
      startServerReadyTimeout: 30000,
      url: ['http://localhost:4173/'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
      },
    },
    assert: {
      assertions: {
        // Core Web Vitals
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'max-potential-fid': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // Performance score
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],

        // Share/SEO metadata (#778). These audits run against the served page,
        // so they prove the head defaults actually render (Lesson 82 — assert
        // behaviour, not config). Verified locally that all three pass on the
        // preview host even though the canonical points at the prod host
        // (Lighthouse v12 does not fail a cross-domain canonical). The seo
        // category sits at ~0.92 here: robots.txt is the only sub-1 audit and
        // is intentionally deferred to Sprint 3 (#782), so the category gate is
        // a warn at 0.9, not an error.
        'document-title': ['error', { minScore: 1 }],
        'meta-description': ['error', { minScore: 1 }],
        canonical: ['error', { minScore: 1 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 512000 }], // 500KB gzipped
        'resource-summary:total:size': ['warn', { maxNumericValue: 2048000 }], // 2MB total
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
