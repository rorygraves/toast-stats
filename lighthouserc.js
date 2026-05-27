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
        // Best-practices gate (#783). Enforcing (error), not just reported —
        // a public marketing surface advertises Red Taverns' quality, so a
        // regression below the floor should block the merge. Current build
        // measures a stable 0.96 (3/3 local runs); 0.9 leaves headroom for
        // run variance while still catching a real drop (console errors,
        // deprecated APIs, insecure subresources). Note: the CSP/headers from
        // firebase.json are NOT present in this localhost preview run, so this
        // gate is independent of them — header verification is on the preview
        // channel (see scripts/lib/__tests__/firebaseHeaders.test.ts).
        'categories:best-practices': ['error', { minScore: 0.9 }],

        // Share/SEO metadata (#778) + robots.txt (#782). These audits run
        // against the served page, so they prove the artifacts actually ship
        // (Lesson 82 — assert behaviour, not config). Verified locally that
        // all pass on the preview host even though the canonical points at the
        // prod host (Lighthouse v12 does not fail a cross-domain canonical).
        // `robots-txt` was deferred by #778's comment and is now landed here:
        // the committed robots.txt is byte-checked by the scripts drift guard,
        // and this audit confirms it parses with zero errors when served.
        'document-title': ['error', { minScore: 1 }],
        'meta-description': ['error', { minScore: 1 }],
        canonical: ['error', { minScore: 1 }],
        'robots-txt': ['error', { minScore: 1 }],
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
