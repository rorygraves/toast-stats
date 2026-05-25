/**
 * Unit tests for filter component consistency
 *
 * These tests verify that filter components provide consistent UI and behavior
 * for columns of the same data type, ensuring a predictable user experience.
 *
 * Converted from property-based tests to example-based unit tests per
 * property-testing-guidance.md - UI component tests are better served by
 * well-chosen examples than random generation.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TextFilter, NumericFilter, CategoricalFilter } from '../index'
import { COLUMN_CONFIGS } from '../types'

describe('Filter Component Consistency', () => {
  describe('TextFilter consistency', () => {
    it('renders text input with operator selection buttons', () => {
      render(
        <TextFilter
          value=""
          onChange={() => {}}
          onClear={() => {}}
          placeholder="Filter Club Name..."
        />
      )

      // Should render text input
      expect(screen.getByRole('textbox')).toBeInTheDocument()

      // Should have operator selection buttons
      expect(screen.getByText('Contains')).toBeInTheDocument()
      expect(screen.getByText('Starts with')).toBeInTheDocument()
    })

    it('shows current operator and clear functionality when value is set', () => {
      const mockOnChange = vi.fn()
      const mockOnClear = vi.fn()

      render(
        <TextFilter
          value="test"
          onChange={mockOnChange}
          onClear={mockOnClear}
        />
      )

      // Should have clear functionality
      expect(screen.getByText('Clear Filter')).toBeInTheDocument()

      // Should show current operator
      expect(screen.getByText('Contains text')).toBeInTheDocument()
    })

    it('applies consistently to all text-type columns', () => {
      // Verify text columns in COLUMN_CONFIGS
      const textColumns = COLUMN_CONFIGS.filter(
        col => col.filterType === 'text'
      )

      // Should have expected text columns
      expect(textColumns.map(c => c.field)).toEqual([
        'name',
        'division',
        'area',
      ])

      // Each text column should be filterable
      textColumns.forEach(column => {
        expect(column.filterable).toBe(true)
      })
    })
  })

  describe('NumericFilter consistency', () => {
    it('renders min/max range inputs with label', () => {
      render(
        <NumericFilter
          value={[null, null]}
          onChange={() => {}}
          onClear={() => {}}
          label="Members"
        />
      )

      // Should render min/max inputs
      const numberInputs = screen.getAllByRole('spinbutton')
      expect(numberInputs).toHaveLength(2)

      // Should have range label
      expect(screen.getByText('Members Range')).toBeInTheDocument()
    })

    it('shows range display and clear button when values are set', () => {
      const mockOnChange = vi.fn()
      const mockOnClear = vi.fn()

      render(
        <NumericFilter
          value={[1, 10]}
          onChange={mockOnChange}
          onClear={mockOnClear}
          label="DCP Goals"
        />
      )

      // Should show range display
      expect(screen.getByText('1 - 10')).toBeInTheDocument()

      // Should have clear functionality
      expect(screen.getByText('Clear')).toBeInTheDocument()
    })

    it('applies consistently to all numeric-type columns', () => {
      // Verify numeric columns in COLUMN_CONFIGS
      const numericColumns = COLUMN_CONFIGS.filter(
        col => col.filterType === 'numeric'
      )

      // Should have expected numeric columns. yearsChartered (#448) is
      // numeric but display-only — it carries filterable: false because
      // a years-since-charter range filter wasn't part of the epic.
      // Order follows the #669 column reconcile (COLUMN_CONFIGS order).
      expect(numericColumns.map(c => c.field)).toEqual([
        'membership',
        'membersNeeded',
        'newMembers',
        'octoberRenewals',
        'aprilRenewals',
        'dcpGoals',
        'yearsChartered',
      ])

      // Each numeric column should be filterable, except the display-only
      // yearsChartered column (#448).
      numericColumns.forEach(column => {
        if (column.field === 'yearsChartered') {
          expect(column.filterable).toBe(false)
        } else {
          expect(column.filterable).toBe(true)
        }
      })
    })
  })

  describe('CategoricalFilter consistency', () => {
    it('renders checkboxes for each option with select all functionality', () => {
      const options = ['Option A', 'Option B', 'Option C']

      render(
        <CategoricalFilter
          options={options}
          selectedValues={[]}
          onChange={() => {}}
          onClear={() => {}}
          label="Test Category"
        />
      )

      // Should render checkboxes for each option
      options.forEach(option => {
        expect(screen.getByText(option)).toBeInTheDocument()
      })

      // Should have select all functionality for multiple options
      expect(screen.getByText('Select All')).toBeInTheDocument()
    })

    it('applies consistently to all categorical-type columns', () => {
      // Verify categorical columns in COLUMN_CONFIGS
      const categoricalColumns = COLUMN_CONFIGS.filter(
        col => col.filterType === 'categorical'
      )

      // Should have expected categorical columns (order follows the #669
      // column reconcile: Status precedes Tier/Distinguished).
      expect(categoricalColumns.map(c => c.field)).toEqual([
        'status',
        'distinguished',
        'clubStatus',
      ])

      // Each categorical column should be filterable and have options
      categoricalColumns.forEach(column => {
        expect(column.filterable).toBe(true)
        expect(column.filterOptions).toBeDefined()
        expect(column.filterOptions!.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Categorical column filter options', () => {
    it('Distinguished column has correct options in correct order', () => {
      const distinguishedConfig = COLUMN_CONFIGS.find(
        col => col.field === 'distinguished'
      )

      expect(distinguishedConfig?.filterOptions).toEqual([
        'Distinguished',
        'Select',
        'President',
        'Smedley',
        'NotDistinguished',
      ])
    })

    it('Status column has correct options', () => {
      const statusConfig = COLUMN_CONFIGS.find(col => col.field === 'status')

      expect(statusConfig?.filterOptions).toEqual([
        'thriving',
        'vulnerable',
        'intervention-required',
      ])
    })

    it('renders Distinguished options correctly in CategoricalFilter', () => {
      const distinguishedConfig = COLUMN_CONFIGS.find(
        col => col.field === 'distinguished'
      )

      render(
        <CategoricalFilter
          options={distinguishedConfig!.filterOptions!}
          selectedValues={[]}
          onChange={() => {}}
          onClear={() => {}}
          label="Distinguished"
        />
      )

      // Each option should be rendered (use getAllByText since "Distinguished"
      // appears both as label and as an option)
      distinguishedConfig!.filterOptions!.forEach(option => {
        const elements = screen.getAllByText(option)
        expect(elements.length).toBeGreaterThan(0)
      })
    })
  })
})
