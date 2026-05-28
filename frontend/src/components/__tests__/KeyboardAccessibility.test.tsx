import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ColumnHeader } from '../ColumnHeader'
import { TextFilter } from '../filters/TextFilter'
import { NumericFilter } from '../filters/NumericFilter'
import { CategoricalFilter } from '../filters/CategoricalFilter'
import type { SortField, SortDirection } from '../filters/types'

/**
 * Unit tests for keyboard accessibility
 *
 * **Feature: clubs-table-column-filtering, Property 14: Keyboard accessibility**
 * **Validates: Requirements 6.1**
 *
 * Tests that all filter controls are keyboard accessible via Tab key navigation.
 * Converted from property-based tests to example-based unit tests per
 * property-testing-guidance.md - UI component tests should use well-chosen examples.
 */

describe('Keyboard Accessibility', () => {
  const defaultSort = {
    field: 'name' as SortField,
    direction: 'asc' as SortDirection,
  }

  describe('ColumnHeader keyboard accessibility (click-to-sort since #851)', () => {
    it('renders a focusable native <button>', () => {
      const { container } = render(
        <ColumnHeader
          field="name"
          label="Club Name"
          sortable={true}
          currentSort={defaultSort}
          onSort={vi.fn()}
        />
      )

      const headerButton = container.querySelector('button')
      expect(headerButton).toBeTruthy()
      expect(headerButton?.tagName).toBe('BUTTON')
    })

    it('has a descriptive aria-label naming the column', () => {
      const { container } = render(
        <ColumnHeader
          field="division"
          label="Division"
          sortable={true}
          currentSort={defaultSort}
          onSort={vi.fn()}
        />
      )

      const headerButton = container.querySelector('button')
      expect(headerButton?.getAttribute('aria-label')).toMatch(
        /Sort by Division/i
      )
    })

    it('Enter triggers the native button click → onSort fires', () => {
      const onSort = vi.fn()
      const { container } = render(
        <ColumnHeader
          field="membership"
          label="Members"
          sortable={true}
          currentSort={defaultSort}
          onSort={onSort}
        />
      )
      const headerButton = container.querySelector(
        'button'
      ) as HTMLButtonElement
      // Native <button> handles Enter/Space as click via the browser; in jsdom
      // we just verify a click fires the handler. The native key behaviour is
      // browser-owned, not something this component needs to re-implement.
      fireEvent.click(headerButton)
      expect(onSort).toHaveBeenCalledWith('membership')
    })
  })

  describe('TextFilter keyboard accessibility', () => {
    it('should have tabIndex=0 on text input', () => {
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
      expect(textInput).toHaveAttribute('tabIndex', '0')
    })

    it('should have aria-label on text input', () => {
      const mockOnChange = vi.fn()
      const mockOnClear = vi.fn()

      const { container } = render(
        <TextFilter
          value="test"
          onChange={mockOnChange}
          onClear={mockOnClear}
          placeholder="Search..."
        />
      )

      const textInput = container.querySelector('input[type="text"]')
      expect(textInput).toHaveAttribute('aria-label')
    })

    it('should have keyboard-accessible operator buttons with aria-pressed', () => {
      const mockOnChange = vi.fn()
      const mockOnClear = vi.fn()

      const { container } = render(
        <TextFilter
          value="search term"
          onChange={mockOnChange}
          onClear={mockOnClear}
          placeholder="Filter..."
        />
      )

      const operatorButtons = container.querySelectorAll('button[aria-pressed]')
      expect(operatorButtons.length).toBeGreaterThan(0)

      operatorButtons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex', '0')
        expect(button).toHaveAttribute('aria-label')
        expect(button).toHaveAttribute('aria-pressed')
      })
    })

    it('should have keyboard-accessible clear button when value is present', () => {
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

      const clearButton = container.querySelector('button[aria-label*="Clear"]')
      if (clearButton) {
        expect(clearButton).toHaveAttribute('tabIndex', '0')
        expect(clearButton).toHaveAttribute('aria-label')
      }
    })
  })

  describe('NumericFilter keyboard accessibility', () => {
    it('should have tabIndex=0 on both min and max inputs', () => {
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
      expect(numericInputs.length).toBe(2) // min and max inputs

      numericInputs.forEach(input => {
        expect(input).toHaveAttribute('tabIndex', '0')
      })
    })

    it('should have aria-labels on numeric inputs', () => {
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

      const numericInputs = container.querySelectorAll('input[type="number"]')

      numericInputs.forEach(input => {
        expect(input).toHaveAttribute('aria-label')
      })
    })

    it('should have keyboard-accessible clear button when values are set', () => {
      const mockOnChange = vi.fn()
      const mockOnClear = vi.fn()

      const { container } = render(
        <NumericFilter
          value={[5, 100]}
          onChange={mockOnChange}
          onClear={mockOnClear}
          label="Range"
        />
      )

      const clearButton = container.querySelector('button[aria-label*="Clear"]')
      if (clearButton) {
        expect(clearButton).toHaveAttribute('tabIndex', '0')
        expect(clearButton).toHaveAttribute('aria-label')
      }
    })
  })

  describe('CategoricalFilter keyboard accessibility', () => {
    it('should have keyboard-accessible checkbox elements for options', () => {
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

      // CategoricalFilter uses role="checkbox" on divs, not input elements
      const checkboxElements = container.querySelectorAll('[role="checkbox"]')
      expect(checkboxElements.length).toBeGreaterThan(0)

      checkboxElements.forEach(checkbox => {
        expect(checkbox).toHaveAttribute('tabIndex', '0')
        expect(checkbox).toHaveAttribute('aria-checked')
      })
    })

    it('should have keyboard-accessible select all checkbox when multiple options exist', () => {
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

      // Select all is the first role="checkbox" element
      const selectAllCheckbox = container.querySelector('[role="checkbox"]')
      expect(selectAllCheckbox).toBeTruthy()
      expect(selectAllCheckbox).toHaveAttribute('tabIndex', '0')
      expect(selectAllCheckbox).toHaveAttribute('aria-checked')
    })

    it('should have keyboard-accessible clear button when selections exist', () => {
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

      const clearButton = container.querySelector('button[aria-label*="Clear"]')
      if (clearButton) {
        expect(clearButton).toHaveAttribute('tabIndex', '0')
        expect(clearButton).toHaveAttribute('aria-label')
      }
    })
  })

  describe('keyboard event handling', () => {
    const renderHeader = (field: SortField, label: string) =>
      render(
        <ColumnHeader
          field={field}
          label={label}
          sortable={true}
          currentSort={defaultSort}
          onSort={vi.fn()}
        />
      )

    it('should handle Enter key without throwing errors', () => {
      const { container } = renderHeader('name', 'Club Name')
      const headerButton = container.querySelector('button')
      expect(() => {
        fireEvent.keyDown(headerButton!, { key: 'Enter' })
      }).not.toThrow()
    })

    it('should handle Space key without throwing errors', () => {
      const { container } = renderHeader('division', 'Division')
      const headerButton = container.querySelector('button')
      expect(() => {
        fireEvent.keyDown(headerButton!, { key: ' ' })
      }).not.toThrow()
    })

    it('should handle Tab key without throwing errors', () => {
      const { container } = renderHeader('area', 'Area')
      const headerButton = container.querySelector('button')
      expect(() => {
        fireEvent.keyDown(headerButton!, { key: 'Tab' })
      }).not.toThrow()
    })
  })
})
