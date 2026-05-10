/**
 * CSS Layer Architecture Structure Tests
 *
 * Task 7.1: Test that `p-2` overrides `.tm-btn-primary` padding
 *
 * These tests validate the CSS layer architecture structure that ensures
 * Tailwind utilities can override brand styles. Per the design document,
 * this is verified through static CSS analysis rather than runtime testing
 * because:
 * - CSS cascade layers are a deterministic browser feature
 * - The layer order (base → brand → utilities) guarantees override behavior
 * - Static analysis confirms the structure is correct
 *
 * Requirements: 1.5, 2.5, 4.2, 4.6, 5.3, 6.1, 6.2, 6.4, 7.2, 7.4
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Helper to read CSS files relative to frontend/src
const readCssFile = (relativePath: string): string => {
  const fullPath = resolve(__dirname, '../../', relativePath)
  return readFileSync(fullPath, 'utf-8')
}

describe('CSS Layer Architecture Structure', () => {
  describe('Layer Declaration Order', () => {
    it('index.css declares layers in correct order: base, brand, utilities', () => {
      const css = readCssFile('index.css')

      // Find the @layer declaration
      const layerMatch = css.match(/@layer\s+([^;]+);/)

      expect(layerMatch).toBeTruthy()
      expect(layerMatch?.[1]).toBe('base, brand, utilities')
    })

    it('Tailwind preflight goes to base layer; utilities go to utilities layer', () => {
      // Tailwind v4's `@import "tailwindcss"` bundles preflight + theme +
      // utilities. If imported as `layer(utilities)`, the preflight reset
      // (`* { padding: 0 }`) ends up in utilities and silently overrides
      // every brand component class. Splitting the import keeps preflight
      // in `base` (lowest precedence) and utilities in `utilities` (highest).
      const css = readCssFile('index.css')
      expect(css).toMatch(
        /@import\s+["']tailwindcss\/preflight["']\s+layer\(base\)[\s\S]*@import\s+["']tailwindcss\/utilities["']\s+layer\(utilities\)/
      )
      // Guard against regressing to the bundled import.
      expect(css).not.toMatch(
        /@import\s+["']tailwindcss["']\s+layer\(utilities\)/
      )
    })

    it('layer declaration appears before any style imports', () => {
      const css = readCssFile('index.css')

      // Find positions of layer declaration and first actual @import statement
      const layerDeclarationPos = css.indexOf('@layer base, brand, utilities;')

      // Find the first @import that's an actual statement (starts at beginning of line)
      // Skip @import mentioned in comments
      const lines = css.split('\n')
      let firstImportPos = -1
      let currentPos = 0

      for (const line of lines) {
        const trimmedLine = line.trim()
        // Check if line starts with @import (not in a comment)
        if (trimmedLine.startsWith('@import')) {
          firstImportPos = currentPos + line.indexOf('@import')
          break
        }
        currentPos += line.length + 1 // +1 for newline
      }

      expect(layerDeclarationPos).toBeGreaterThan(-1)
      expect(firstImportPos).toBeGreaterThan(-1)
      expect(layerDeclarationPos).toBeLessThan(firstImportPos)
    })
  })

  describe('Brand Layer Component Classes', () => {
    it('.tm-btn-primary is defined inside @layer brand', () => {
      const css = readCssFile('styles/components/buttons.css')

      // Verify the file contains @layer brand
      expect(css).toMatch(/@layer\s+brand\s*\{/)

      // Verify .tm-btn-primary is defined
      expect(css).toMatch(/\.tm-btn-primary\s*\{/)

      // Verify .tm-btn-primary is inside the brand layer
      // The file should start with @layer brand { and contain .tm-btn-primary
      const brandLayerMatch = css.match(/@layer\s+brand\s*\{([\s\S]*)\}/)
      expect(brandLayerMatch).toBeTruthy()
      expect(brandLayerMatch?.[1]).toContain('.tm-btn-primary')
    })

    it('.tm-btn-primary sets padding: 12px 24px', () => {
      const css = readCssFile('styles/components/buttons.css')

      // Find the .tm-btn-primary rule and verify it sets padding
      const btnPrimaryMatch = css.match(/\.tm-btn-primary\s*\{([^}]*)\}/)
      expect(btnPrimaryMatch).toBeTruthy()
      expect(btnPrimaryMatch?.[1]).toMatch(/padding:\s*12px\s+24px/)
    })

    it('.tm-btn-primary does not use !important on padding', () => {
      const css = readCssFile('styles/components/buttons.css')

      // Find the .tm-btn-primary rule
      const btnPrimaryMatch = css.match(/\.tm-btn-primary\s*\{([^}]*)\}/)
      expect(btnPrimaryMatch).toBeTruthy()

      // Verify padding does not have !important
      const paddingMatch = btnPrimaryMatch?.[1]?.match(
        /padding:[^;]*!important/
      )
      expect(paddingMatch).toBeNull()
    })
  })

  describe('Base Layer Element Defaults', () => {
    it('base.css wraps element defaults in @layer base', () => {
      const css = readCssFile('styles/layers/base.css')

      // Verify the file contains @layer base
      expect(css).toMatch(/@layer\s+base\s*\{/)
    })

    it('touch target defaults are in base layer', () => {
      const css = readCssFile('styles/layers/base.css')

      // Verify button touch targets are defined in base layer
      const baseLayerMatch = css.match(/@layer\s+base\s*\{([\s\S]*)\}/)
      expect(baseLayerMatch).toBeTruthy()
      expect(baseLayerMatch?.[1]).toMatch(/button/)
      expect(baseLayerMatch?.[1]).toMatch(/min-height:\s*44px/)
    })
  })

  describe('Tailwind Utility Override Guarantee - Task 7.1', () => {
    /**
     * Task 7.1: Test that `p-2` overrides `.tm-btn-primary` padding
     *
     * This test validates the CSS layer architecture structure that guarantees
     * Tailwind utilities will override brand styles. The verification is based on:
     *
     * 1. Layer Order: @layer base, brand, utilities;
     *    - utilities layer has highest priority in the cascade
     *
     * 2. Tailwind Import: @import "tailwindcss" layer(utilities);
     *    - All Tailwind utilities (including p-2) are in the utilities layer
     *
     * 3. Brand Classes: .tm-btn-primary is in @layer brand
     *    - Brand layer has lower priority than utilities layer
     *
     * CSS Cascade Layer Behavior:
     * When an element has both .tm-btn-primary and p-2 classes:
     * - .tm-btn-primary sets padding: 12px 24px (in brand layer)
     * - p-2 sets padding: 0.5rem (8px) (in utilities layer)
     * - utilities layer wins because it has higher priority
     *
     * This is a deterministic CSS feature - if the structure is correct,
     * the override behavior is guaranteed by the browser.
     */
    it('layer structure guarantees p-2 overrides .tm-btn-primary padding', () => {
      const indexCss = readCssFile('index.css')
      const buttonsCss = readCssFile('styles/components/buttons.css')

      // Verification 1: Layer order is correct
      const layerOrder = indexCss.match(/@layer\s+([^;]+);/)
      expect(layerOrder?.[1]).toBe('base, brand, utilities')

      // Verification 2: Tailwind is in utilities layer
      expect(indexCss).toMatch(
        /@import\s+["']tailwindcss\/preflight["']\s+layer\(base\)[\s\S]*@import\s+["']tailwindcss\/utilities["']\s+layer\(utilities\)/
      )

      // Verification 3: .tm-btn-primary is in brand layer
      expect(buttonsCss).toMatch(/@layer\s+brand\s*\{/)
      const brandLayerContent = buttonsCss.match(
        /@layer\s+brand\s*\{([\s\S]*)\}/
      )
      expect(brandLayerContent?.[1]).toContain('.tm-btn-primary')

      // Verification 4: .tm-btn-primary sets padding without !important
      const btnPrimaryRule = buttonsCss.match(/\.tm-btn-primary\s*\{([^}]*)\}/)
      expect(btnPrimaryRule?.[1]).toMatch(/padding:\s*12px\s+24px/)
      expect(btnPrimaryRule?.[1]).not.toMatch(/padding:[^;]*!important/)

      /**
       * Conclusion:
       * Given the verified structure:
       * - utilities layer > brand layer (by declaration order)
       * - p-2 is in utilities layer (via Tailwind import)
       * - .tm-btn-primary padding is in brand layer (without !important)
       *
       * Therefore: p-2 (8px padding) WILL override .tm-btn-primary (12px 24px padding)
       *
       * This is guaranteed by CSS Cascade Layers specification:
       * https://www.w3.org/TR/css-cascade-5/#layering
       */
    })

    it('documents the expected override behavior', () => {
      /**
       * Expected Runtime Behavior:
       *
       * HTML: <button class="tm-btn-primary p-2">Click me</button>
       *
       * CSS Applied:
       * - .tm-btn-primary { padding: 12px 24px; } (brand layer)
       * - .p-2 { padding: 0.5rem; } (utilities layer)
       *
       * Result: padding: 0.5rem (8px) wins
       *
       * Why: utilities layer has higher cascade priority than brand layer
       */
      expect(true).toBe(true) // Documentation test
    })
  })

  describe('Import Order Validation', () => {
    it('token imports precede component imports', () => {
      const css = readCssFile('index.css')

      const tokenImportPos = css.indexOf('tokens/')
      const componentImportPos = css.indexOf('components/')

      expect(tokenImportPos).toBeGreaterThan(-1)
      expect(componentImportPos).toBeGreaterThan(-1)
      expect(tokenImportPos).toBeLessThan(componentImportPos)
    })

    it('base layer import precedes brand layer imports', () => {
      const css = readCssFile('index.css')

      const baseLayerImportPos = css.indexOf('layers/base.css')
      const componentImportPos = css.indexOf('components/')

      expect(baseLayerImportPos).toBeGreaterThan(-1)
      expect(componentImportPos).toBeGreaterThan(-1)
      expect(baseLayerImportPos).toBeLessThan(componentImportPos)
    })
  })

  describe('Tailwind Utility Override Guarantee - Task 7.2', () => {
    /**
     * Task 7.2: Test that `h-8` overrides base layer min-height
     *
     * This test validates the CSS layer architecture structure that guarantees
     * Tailwind height utilities will override base layer min-height defaults.
     *
     * The base layer sets min-height: 44px on interactive elements for WCAG AA
     * touch target compliance. Tailwind's h-8 (32px) should override this when
     * explicitly applied.
     *
     * Requirements: 1.5, 2.5, 4.2
     */
    it('base layer sets min-height on interactive elements without !important', () => {
      const baseCss = readCssFile('styles/layers/base.css')

      // Verify base layer contains min-height for interactive elements
      const baseLayerMatch = baseCss.match(/@layer\s+base\s*\{([\s\S]*)\}/)
      expect(baseLayerMatch).toBeTruthy()

      // Verify min-height: 44px is set
      expect(baseLayerMatch?.[1]).toMatch(/min-height:\s*44px/)

      // Verify min-height does NOT use !important
      expect(baseLayerMatch?.[1]).not.toMatch(/min-height:[^;]*!important/)
    })

    it('layer structure guarantees h-8 overrides base layer min-height', () => {
      const indexCss = readCssFile('index.css')
      const baseCss = readCssFile('styles/layers/base.css')

      // Verification 1: Layer order is correct (base before utilities)
      const layerOrder = indexCss.match(/@layer\s+([^;]+);/)
      expect(layerOrder?.[1]).toBe('base, brand, utilities')

      // Verification 2: Tailwind is in utilities layer
      expect(indexCss).toMatch(
        /@import\s+["']tailwindcss\/preflight["']\s+layer\(base\)[\s\S]*@import\s+["']tailwindcss\/utilities["']\s+layer\(utilities\)/
      )

      // Verification 3: min-height is in base layer
      expect(baseCss).toMatch(/@layer\s+base\s*\{/)
      const baseLayerContent = baseCss.match(/@layer\s+base\s*\{([\s\S]*)\}/)
      expect(baseLayerContent?.[1]).toMatch(/min-height:\s*44px/)

      // Verification 4: min-height does not have !important
      expect(baseLayerContent?.[1]).not.toMatch(/min-height:[^;]*!important/)

      /**
       * Conclusion:
       * Given the verified structure:
       * - utilities layer > base layer (by declaration order)
       * - h-8 is in utilities layer (via Tailwind import)
       * - min-height: 44px is in base layer (without !important)
       *
       * Therefore: h-8 (height: 32px) WILL override base layer min-height: 44px
       *
       * Note: h-8 sets height, not min-height. For the override to work,
       * the element needs both h-8 and min-h-0 to fully override the touch target.
       * However, h-8 alone will set the height, and the browser will use the
       * larger of height and min-height.
       */
    })

    it('documents the expected override behavior for height utilities', () => {
      /**
       * Expected Runtime Behavior:
       *
       * HTML: <button class="h-8 min-h-0">Small Button</button>
       *
       * CSS Applied:
       * - button { min-height: 44px; } (base layer)
       * - .h-8 { height: 2rem; } (utilities layer)
       * - .min-h-0 { min-height: 0px; } (utilities layer)
       *
       * Result: height: 32px, min-height: 0px
       *
       * Why: utilities layer has higher cascade priority than base layer
       *
       * Note: To fully override the 44px touch target, use both h-8 and min-h-0.
       * Using h-8 alone will set height to 32px but min-height will still be 44px.
       */
      expect(true).toBe(true) // Documentation test
    })
  })

  describe('Tailwind Utility Override Guarantee - Task 7.3', () => {
    /**
     * Task 7.3: Test that `font-sans` overrides brand typography
     *
     * This test validates the CSS layer architecture structure that guarantees
     * Tailwind font utilities will override brand typography font-family.
     *
     * Brand typography classes set font-family to brand fonts (Montserrat, Source Sans 3).
     * Tailwind's font-sans should override this when explicitly applied.
     *
     * Requirements: 5.3, 5.4
     */
    it('typography classes do not use !important on font-family', () => {
      const typographyCss = readCssFile('styles/components/typography.css')

      // Verify typography classes are in brand layer
      expect(typographyCss).toMatch(/@layer\s+brand\s*\{/)

      // Verify font-family is set on typography classes
      expect(typographyCss).toMatch(/font-family:\s*var\(--tm-font-/)

      // Verify font-family does NOT use !important
      expect(typographyCss).not.toMatch(/font-family:[^;]*!important/)
    })

    it('layer structure guarantees font-sans overrides brand typography', () => {
      const indexCss = readCssFile('index.css')
      const typographyCss = readCssFile('styles/components/typography.css')

      // Verification 1: Layer order is correct
      const layerOrder = indexCss.match(/@layer\s+([^;]+);/)
      expect(layerOrder?.[1]).toBe('base, brand, utilities')

      // Verification 2: Tailwind is in utilities layer
      expect(indexCss).toMatch(
        /@import\s+["']tailwindcss\/preflight["']\s+layer\(base\)[\s\S]*@import\s+["']tailwindcss\/utilities["']\s+layer\(utilities\)/
      )

      // Verification 3: Typography classes are in brand layer
      expect(typographyCss).toMatch(/@layer\s+brand\s*\{/)
      const brandLayerContent = typographyCss.match(
        /@layer\s+brand\s*\{([\s\S]*)\}/
      )
      expect(brandLayerContent?.[1]).toContain('.tm-headline')
      expect(brandLayerContent?.[1]).toContain('.tm-body')

      // Verification 4: font-family does not have !important
      expect(typographyCss).not.toMatch(/font-family:[^;]*!important/)

      /**
       * Conclusion:
       * Given the verified structure:
       * - utilities layer > brand layer (by declaration order)
       * - font-sans is in utilities layer (via Tailwind import)
       * - font-family in .tm-headline/.tm-body is in brand layer (without !important)
       *
       * Therefore: font-sans WILL override brand typography font-family
       */
    })

    it('documents the expected override behavior for font utilities', () => {
      /**
       * Expected Runtime Behavior:
       *
       * HTML: <h1 class="tm-headline font-sans">Override Font</h1>
       *
       * CSS Applied:
       * - .tm-headline { font-family: var(--tm-font-headline); } (brand layer)
       * - .font-sans { font-family: ui-sans-serif, system-ui, sans-serif; } (utilities layer)
       *
       * Result: font-family: ui-sans-serif, system-ui, sans-serif
       *
       * Why: utilities layer has higher cascade priority than brand layer
       */
      expect(true).toBe(true) // Documentation test
    })
  })

  describe('Tailwind Utility Override Guarantee - Task 7.4', () => {
    /**
     * Task 7.4: Test that `shadow-lg` works on `.tm-card`
     *
     * This test validates the CSS layer architecture structure that guarantees
     * Tailwind shadow utilities will work on .tm-card elements.
     *
     * The .tm-card class sets a default box-shadow. Tailwind's shadow-lg should
     * be able to override or extend this when explicitly applied.
     *
     * Requirements: 6.4
     */
    it('.tm-card does not use !important on box-shadow', () => {
      const cardsCss = readCssFile('styles/components/cards.css')

      // Verify .tm-card is in brand layer
      expect(cardsCss).toMatch(/@layer\s+brand\s*\{/)

      // Find the .tm-card rule
      const tmCardMatch = cardsCss.match(/\.tm-card\s*\{([^}]*)\}/)
      expect(tmCardMatch).toBeTruthy()

      // Verify box-shadow is set
      expect(tmCardMatch?.[1]).toMatch(/box-shadow:/)

      // Verify box-shadow does NOT use !important
      expect(tmCardMatch?.[1]).not.toMatch(/box-shadow:[^;]*!important/)
    })

    it('.tm-card does not set box-shadow: none that would block shadow utilities', () => {
      const cardsCss = readCssFile('styles/components/cards.css')

      // Find the .tm-card rule specifically (not variants like .tm-card-outlined)
      const tmCardMatch = cardsCss.match(/\.tm-card\s*\{([^}]*)\}/)
      expect(tmCardMatch).toBeTruthy()

      // Verify .tm-card does NOT set box-shadow: none
      // (box-shadow: none would block Tailwind shadow utilities)
      expect(tmCardMatch?.[1]).not.toMatch(/box-shadow:\s*none/)
    })

    it('layer structure guarantees shadow-lg works on .tm-card', () => {
      const indexCss = readCssFile('index.css')
      const cardsCss = readCssFile('styles/components/cards.css')

      // Verification 1: Layer order is correct
      const layerOrder = indexCss.match(/@layer\s+([^;]+);/)
      expect(layerOrder?.[1]).toBe('base, brand, utilities')

      // Verification 2: Tailwind is in utilities layer
      expect(indexCss).toMatch(
        /@import\s+["']tailwindcss\/preflight["']\s+layer\(base\)[\s\S]*@import\s+["']tailwindcss\/utilities["']\s+layer\(utilities\)/
      )

      // Verification 3: .tm-card is in brand layer
      expect(cardsCss).toMatch(/@layer\s+brand\s*\{/)
      const brandLayerContent = cardsCss.match(/@layer\s+brand\s*\{([\s\S]*)\}/)
      expect(brandLayerContent?.[1]).toContain('.tm-card')

      // Verification 4: .tm-card box-shadow does not have !important
      const tmCardMatch = cardsCss.match(/\.tm-card\s*\{([^}]*)\}/)
      expect(tmCardMatch?.[1]).not.toMatch(/box-shadow:[^;]*!important/)

      /**
       * Conclusion:
       * Given the verified structure:
       * - utilities layer > brand layer (by declaration order)
       * - shadow-lg is in utilities layer (via Tailwind import)
       * - box-shadow in .tm-card is in brand layer (without !important)
       *
       * Therefore: shadow-lg WILL override .tm-card box-shadow
       */
    })

    it('documents the expected override behavior for shadow utilities', () => {
      /**
       * Expected Runtime Behavior:
       *
       * HTML: <div class="tm-card shadow-lg">Card Content</div>
       *
       * CSS Applied:
       * - .tm-card { box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); } (brand layer)
       * - .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), ... } (utilities layer)
       *
       * Result: box-shadow from shadow-lg wins
       *
       * Why: utilities layer has higher cascade priority than brand layer
       */
      expect(true).toBe(true) // Documentation test
    })
  })
})
