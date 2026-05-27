import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ColumnHeader } from '../ColumnHeader'
import { TextFilter } from '../filters/TextFilter'
import { NumericFilter } from '../filters/NumericFilter'
import { CategoricalFilter } from '../filters/CategoricalFilter'
import type { SortField, SortDirection } from '../filters/types'

/**
 * Unit tests for focus indicators on column headers and filter components
 *
 * **Feature: clubs-table-column-filtering, Property 15: Focus indicators on column headers**
 * **Validates: Requirements 6.4**
 *
 * Tests that column headers and filter components show clear visual focus indicators
 * when they receive keyboard focus, ensuring accessibility compliance.
 */

describe('Focus Indicators', () => {
  describe('ColumnHeader focus indicators (sort-only since #816)', () => {
    const defaultSort = {
      field: 'name' as SortField,
      direction: 'asc' as SortDirection,
    }

    it('should have focus ring classes on the header button', () => {
      const { container } = render(
        <ColumnHeader
          field="name"
          label="Club Name"
          sortable={true}
          currentSort={defaultSort}
          onSort={vi.fn()}
        />
      )

      const headerButton = container.querySelector('button[aria-expanded]')
      expect(headerButton).toBeTruthy()

      const buttonClasses = headerButton?.className || ''
      expect(buttonClasses).toContain('focus:outline-hidden')
      expect(buttonClasses).toContain('focus:ring-2')
      expect(buttonClasses).toMatch(/focus:ring-(blue-500|tm-loyal-blue)/)
    })

    it('should have tabIndex=0 for keyboard accessibility', () => {
      const { container } = render(
        <ColumnHeader
          field="division"
          label="Division"
          sortable={true}
          currentSort={defaultSort}
          onSort={vi.fn()}
        />
      )

      const headerButton = container.querySelector('button[aria-expanded]')
      expect(headerButton).toHaveAttribute('tabIndex', '0')
    })

    it('should have focus indicators on sort buttons when the popover is open', () => {
      const { container } = render(
        <ColumnHeader
          field="membership"
          label="Members"
          sortable={true}
          currentSort={defaultSort}
          onSort={vi.fn()}
        />
      )

      const headerButton = container.querySelector('button[aria-expanded]')
      fireEvent.click(headerButton!)

      // Sort A-Z / Sort Z-A buttons
      const sortButtons = container.querySelectorAll(
        'button:not([aria-expanded])'
      )
      expect(sortButtons.length).toBeGreaterThan(0)

      sortButtons.forEach(button => {
        const buttonClasses = button.className
        expect(buttonClasses).toContain('focus:outline-hidden')
        expect(buttonClasses).toMatch(/focus:ring-\d+/)
      })
    })

    it('should have consistent focus indicators across all focusable elements', () => {
      const { container } = render(
        <ColumnHeader
          field="status"
          label="Status"
          sortable={true}
          currentSort={defaultSort}
          onSort={vi.fn()}
        />
      )

      const headerButton = container.querySelector('button[aria-expanded]')
      fireEvent.click(headerButton!)

      const focusableElements = container.querySelectorAll(
        'button, input, [tabindex="0"]'
      )

      focusableElements.forEach(element => {
        const elementClasses = element.className
        expect(elementClasses).toContain('focus:outline-hidden')
        const hasFocusRing =
          elementClasses.includes('focus:ring-') ||
          elementClasses.includes('focus:bg-')
        expect(hasFocusRing).toBe(true)
      })
    })
  })

  describe('TextFilter focus indicators', () => {
    it('should have focus ring classes on text input', () => {
      const mockOnChange = vi.fn()
      const mockOnClear = vi.fn()

      const { container } = render(
        <TextFilter
          value=""
          onChange={mockOnChange}
          onClear={mockOnClear}
          placeholder="Filter clubs..."
        />
      )

      const textInput = container.querySelector('input[type="text"]')
      expect(textInput).toBeTruthy()

      const inputClasses = textInput?.className || ''
      expect(inputClasses).toContain('focus:outline-hidden')
      expect(inputClasses).toContain('focus:ring-2')
      // #670: themed ring token (has a dark-mode override, unlike blue-500).
      expect(inputClasses).toContain('focus:ring-tm-loyal-blue')
    })

    it('should have focus indicators on operator buttons', () => {
      const mockOnChange = vi.fn()
      const mockOnClear = vi.fn()

      const { container } = render(
        <TextFilter
          value="test"
          onChange={mockOnChange}
          onClear={mockOnClear}
          placeholder="Filter..."
        />
      )

      const operatorButtons = container.querySelectorAll('button[aria-pressed]')
      expect(operatorButtons.length).toBe(2) // Contains and Starts with

      operatorButtons.forEach(button => {
        const buttonClasses = button.className
        expect(buttonClasses).toContain('focus:outline-hidden')
        expect(buttonClasses).toContain('focus:ring-2')
        // #670: themed ring token (has a dark-mode override, unlike blue-500).
        expect(buttonClasses).toContain('focus:ring-tm-loyal-blue')
      })
    })

    it('should have focus indicators on clear button when value is present', () => {
      const mockOnChange = vi.fn()
      const mockOnClear = vi.fn()

      const { container } = render(
        <TextFilter
          value="some text"
          onChange={mockOnChange}
          onClear={mockOnClear}
          placeholder="Filter..."
        />
      )

      const clearButton = container.querySelector(
        'button[aria-label="Clear filter"]'
      )
      expect(clearButton).toBeTruthy()

      const buttonClasses = clearButton?.className || ''
      expect(buttonClasses).toContain('focus:outline-hidden')
      expect(buttonClasses).toMatch(/focus:ring-\d+/)
    })
  })

  describe('NumericFilter focus indicators', () => {
    it('should have focus ring classes on numeric inputs', () => {
      const mockOnChange = vi.fn()
      const mockOnClear = vi.fn()

      const { container } = render(
        <NumericFilter
          value={[null, null]}
          onChange={mockOnChange}
          onClear={mockOnClear}
          label="Members"
        />
      )

      const numericInputs = container.querySelectorAll('input[type="number"]')
      expect(numericInputs.length).toBe(2) // Min and Max inputs

      numericInputs.forEach(input => {
        const inputClasses = input.className
        expect(inputClasses).toContain('focus:outline-hidden')
        expect(inputClasses).toContain('focus:ring-2')
        // #670: themed ring token (has a dark-mode override, unlike blue-500).
        expect(inputClasses).toContain('focus:ring-tm-loyal-blue')
      })
    })

    it('should have focus indicators on clear button when values are set', () => {
      const mockOnChange = vi.fn()
      const mockOnClear = vi.fn()

      const { container } = render(
        <NumericFilter
          value={[10, 50]}
          onChange={mockOnChange}
          onClear={mockOnClear}
          label="DCP Goals"
        />
      )

      const clearButton = container.querySelector(
        'button[aria-label="Clear numeric filter"]'
      )
      expect(clearButton).toBeTruthy()

      const buttonClasses = clearButton?.className || ''
      expect(buttonClasses).toContain('focus:outline-hidden')
      expect(buttonClasses).toMatch(/focus:ring-\d+/)
    })
  })

  describe('CategoricalFilter focus indicators', () => {
    it('should have focus indicators on option checkboxes', () => {
      const mockOnChange = vi.fn()
      const mockOnClear = vi.fn()

      const { container } = render(
        <CategoricalFilter
          options={['Active', 'Inactive', 'Suspended']}
          selectedValues={[]}
          onChange={mockOnChange}
          onClear={mockOnClear}
          label="Status"
          multiple={true}
        />
      )

      // Check option checkboxes have focus indicators
      const checkboxes = container.querySelectorAll('[role="checkbox"]')
      expect(checkboxes.length).toBeGreaterThan(0)

      checkboxes.forEach(checkbox => {
        const checkboxClasses = checkbox.className
        expect(checkboxClasses).toContain('focus:outline-hidden')
        expect(checkboxClasses).toMatch(/focus:ring-\d+/)
      })
    })

    it('should have focus indicators on select all checkbox', () => {
      const mockOnChange = vi.fn()
      const mockOnClear = vi.fn()

      const { container } = render(
        <CategoricalFilter
          options={['Option1', 'Option2', 'Option3']}
          selectedValues={[]}
          onChange={mockOnChange}
          onClear={mockOnClear}
          label="Category"
          multiple={true}
        />
      )

      // Find the select all checkbox (first checkbox in multiple mode with >1 options)
      const selectAllCheckbox = container.querySelector(
        '[role="checkbox"][aria-checked]'
      )
      expect(selectAllCheckbox).toBeTruthy()

      const checkboxClasses = selectAllCheckbox?.className || ''
      expect(checkboxClasses).toContain('focus:outline-hidden')
      expect(checkboxClasses).toMatch(/focus:ring-\d+/)
    })

    it('should have focus indicators on clear button when selections exist', () => {
      const mockOnChange = vi.fn()
      const mockOnClear = vi.fn()

      const { container } = render(
        <CategoricalFilter
          options={['Active', 'Inactive']}
          selectedValues={['Active']}
          onChange={mockOnChange}
          onClear={mockOnClear}
          label="Status"
          multiple={true}
        />
      )

      const clearButton = container.querySelector(
        'button[aria-label="Clear categorical filter"]'
      )
      expect(clearButton).toBeTruthy()

      const buttonClasses = clearButton?.className || ''
      expect(buttonClasses).toContain('focus:outline-hidden')
      expect(buttonClasses).toMatch(/focus:ring-\d+/)
    })
  })
})
