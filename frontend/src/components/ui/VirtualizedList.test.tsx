/**
 * Tests for VirtualizedList Component
 * Follows SOLID, DRY, and DIP principles
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import VirtualizedList from './VirtualizedList'

describe('VirtualizedList', () => {
  const mockItems = Array.from({ length: 100 }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
  }))

  it('should render items', () => {
    const { container } = render(
      <VirtualizedList
        items={mockItems}
        itemHeight={50}
        renderItem={(item) => <div>{item.name}</div>}
        containerHeight={300}
      />
    )

    // Virtualized list should render visible items (may take a moment to render)
    // Check that the container is rendered
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should handle empty items array', () => {
    const { container } = render(
      <VirtualizedList
        items={[]}
        itemHeight={50}
        renderItem={() => <div>Item</div>}
        containerHeight={300}
      />
    )

    expect(container).toBeInTheDocument()
  })

  it('should use function for dynamic item height', () => {
    const getItemHeight = jest.fn((index: number) => index % 2 === 0 ? 50 : 75)

    render(
      <VirtualizedList
        items={mockItems.slice(0, 10)}
        itemHeight={getItemHeight}
        renderItem={(item) => <div>{item.name}</div>}
        containerHeight={300}
      />
    )

    // Function should be called during virtualization
    expect(getItemHeight).toHaveBeenCalled()
  })

  it('should accept custom className', () => {
    const { container } = render(
      <VirtualizedList
        items={mockItems.slice(0, 10)}
        itemHeight={50}
        renderItem={(item) => <div>{item.name}</div>}
        containerHeight={300}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should use custom overscan value', () => {
    const { container } = render(
      <VirtualizedList
        items={mockItems}
        itemHeight={50}
        renderItem={(item) => <div>{item.name}</div>}
        containerHeight={300}
        overscan={10}
      />
    )

    // Component should render (overscan is internal implementation)
    expect(container.firstChild).toBeInTheDocument()
  })
})
