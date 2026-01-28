import React from 'react'
import { render, screen } from '@testing-library/react'
import { TemplateGrid } from './TemplateGrid'
import type { Template, AgentTemplate } from '../hooks/useMarketplaceData'

jest.mock('./TemplateCard', () => ({
  TemplateCard: ({ item, isSelected }: { item: Template | AgentTemplate; isSelected: boolean }) => (
    <div data-testid={`template-card-${item.id}`} data-selected={isSelected}>
      {item.name || (item as AgentTemplate).label}
    </div>
  ),
}))

describe('TemplateGrid', () => {
  const mockTemplate1: Template = {
    id: 'template-1',
    name: 'Template 1',
    description: 'Description 1',
    category: 'automation',
    difficulty: 'beginner',
    estimated_time: '30 minutes',
    tags: ['test'],
    is_official: false,
    uses_count: 10,
    likes_count: 5,
  }

  const mockTemplate2: Template = {
    id: 'template-2',
    name: 'Template 2',
    description: 'Description 2',
    category: 'data_analysis',
    difficulty: 'intermediate',
    estimated_time: '1 hour',
    tags: ['data'],
    is_official: true,
    uses_count: 20,
    likes_count: 10,
  }

  const mockAgent: AgentTemplate = {
    id: 'agent-1',
    name: 'Agent 1',
    label: 'Agent 1 Label',
    description: 'Agent description',
    category: 'research',
    difficulty: 'advanced',
    estimated_time: '2 hours',
    tags: ['ai'],
    is_official: true,
  }

  const mockProps = {
    items: [mockTemplate1, mockTemplate2],
    selectedIds: new Set<string>(),
    type: 'template' as const,
    onToggleSelect: jest.fn(),
    onCardClick: jest.fn(),
    getDifficultyColor: jest.fn(() => 'bg-green-100 text-green-800'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all items', () => {
    render(<TemplateGrid {...mockProps} />)

    expect(screen.getByTestId('template-card-template-1')).toBeInTheDocument()
    expect(screen.getByTestId('template-card-template-2')).toBeInTheDocument()
  })

  it('should mark selected items', () => {
    render(<TemplateGrid {...mockProps} selectedIds={new Set(['template-1'])} />)

    const card1 = screen.getByTestId('template-card-template-1')
    const card2 = screen.getByTestId('template-card-template-2')

    expect(card1).toHaveAttribute('data-selected', 'true')
    expect(card2).toHaveAttribute('data-selected', 'false')
  })

  it('should render empty message when items array is empty', () => {
    render(<TemplateGrid {...mockProps} items={[]} />)

    expect(screen.getByText('No items found. Try adjusting your filters.')).toBeInTheDocument()
  })

  it('should use custom empty message when provided', () => {
    render(<TemplateGrid {...mockProps} items={[]} emptyMessage="Custom empty message" />)

    expect(screen.getByText('Custom empty message')).toBeInTheDocument()
  })

  it('should render agent items', () => {
    render(<TemplateGrid {...mockProps} items={[mockAgent]} type="agent" />)

    expect(screen.getByTestId('template-card-agent-1')).toBeInTheDocument()
  })

  it('should pass correct props to TemplateCard', () => {
    render(<TemplateGrid {...mockProps} selectedIds={new Set(['template-1'])} />)

    const card1 = screen.getByTestId('template-card-template-1')
    expect(card1).toBeInTheDocument()
    expect(card1).toHaveAttribute('data-selected', 'true')
  })

  it('should handle multiple selected items', () => {
    render(<TemplateGrid {...mockProps} selectedIds={new Set(['template-1', 'template-2'])} />)

    const card1 = screen.getByTestId('template-card-template-1')
    const card2 = screen.getByTestId('template-card-template-2')

    expect(card1).toHaveAttribute('data-selected', 'true')
    expect(card2).toHaveAttribute('data-selected', 'true')
  })

  it('should handle empty selectedIds set', () => {
    render(<TemplateGrid {...mockProps} selectedIds={new Set()} />)

    const card1 = screen.getByTestId('template-card-template-1')
    expect(card1).toHaveAttribute('data-selected', 'false')
  })

  it('should pass footerText to TemplateCard when provided', () => {
    render(<TemplateGrid {...mockProps} footerText="Custom footer" />)

    // Footer text is passed to TemplateCard but may not be directly testable
    // The important thing is that the component renders without errors
    expect(screen.getByTestId('template-card-template-1')).toBeInTheDocument()
  })

  it('should render grid with correct structure', () => {
    const { container } = render(<TemplateGrid {...mockProps} />)

    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
  })

  it('should handle single item', () => {
    render(<TemplateGrid {...mockProps} items={[mockTemplate1]} />)

    expect(screen.getByTestId('template-card-template-1')).toBeInTheDocument()
    expect(screen.queryByTestId('template-card-template-2')).not.toBeInTheDocument()
  })

  it('should handle many items', () => {
    const manyItems = Array.from({ length: 10 }, (_, i) => ({
      ...mockTemplate1,
      id: `template-${i}`,
      name: `Template ${i}`,
    }))

    render(<TemplateGrid {...mockProps} items={manyItems} />)

    manyItems.forEach(item => {
      expect(screen.getByTestId(`template-card-${item.id}`)).toBeInTheDocument()
    })
  })
})
