/**
 * Settings Tab Button Component Tests
 * Tests for settings tab button component rendering and interactions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsTabButton } from './SettingsTabButton'

describe('SettingsTabButton', () => {
  const mockOnClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render with label', () => {
    render(
      <SettingsTabButton
        label="LLM Providers"
        isActive={false}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText('LLM Providers')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    render(
      <SettingsTabButton
        label="Test Tab"
        isActive={false}
        onClick={mockOnClick}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should apply active styles when isActive is true', () => {
    render(
      <SettingsTabButton
        label="Active Tab"
        isActive={true}
        onClick={mockOnClick}
      />
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary-600', 'text-white', 'border-primary-600')
  })

  it('should apply inactive styles when isActive is false', () => {
    render(
      <SettingsTabButton
        label="Inactive Tab"
        isActive={false}
        onClick={mockOnClick}
      />
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass(
      'bg-white',
      'text-gray-600',
      'border-gray-200',
      'hover:border-primary-400',
      'hover:text-primary-700'
    )
    expect(button).not.toHaveClass('bg-primary-600', 'text-white')
  })

  it('should have correct button structure', () => {
    render(
      <SettingsTabButton
        label="Test Tab"
        isActive={false}
        onClick={mockOnClick}
      />
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass(
      'text-left',
      'px-4',
      'py-3',
      'rounded-lg',
      'border',
      'transition'
    )
  })

  it('should handle multiple clicks', () => {
    render(
      <SettingsTabButton
        label="Test Tab"
        isActive={false}
        onClick={mockOnClick}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(3)
  })

  it('should transition between active and inactive states', () => {
    const { rerender } = render(
      <SettingsTabButton
        label="Test Tab"
        isActive={false}
        onClick={mockOnClick}
      />
    )

    let button = screen.getByRole('button')
    expect(button).toHaveClass('bg-white', 'text-gray-600')
    expect(button).not.toHaveClass('bg-primary-600', 'text-white')

    rerender(
      <SettingsTabButton
        label="Test Tab"
        isActive={true}
        onClick={mockOnClick}
      />
    )

    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary-600', 'text-white', 'border-primary-600')
    expect(button).not.toHaveClass('bg-white', 'text-gray-600')
  })

  it('should render different labels correctly', () => {
    const { rerender } = render(
      <SettingsTabButton
        label="LLM Providers"
        isActive={false}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText('LLM Providers')).toBeInTheDocument()

    rerender(
      <SettingsTabButton
        label="Workflow Settings"
        isActive={false}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText('Workflow Settings')).toBeInTheDocument()
    expect(screen.queryByText('LLM Providers')).not.toBeInTheDocument()
  })

  it('should be keyboard accessible', () => {
    render(
      <SettingsTabButton
        label="Test Tab"
        isActive={false}
        onClick={mockOnClick}
      />
    )

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    
    // Button should be focusable
    button.focus()
    expect(document.activeElement).toBe(button)
  })
})
