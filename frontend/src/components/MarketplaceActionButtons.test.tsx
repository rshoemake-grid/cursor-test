import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarketplaceActionButtons } from './MarketplaceActionButtons'

describe('MarketplaceActionButtons', () => {
  it('should return null when selectedCount is 0', () => {
    const { container } = render(
      <MarketplaceActionButtons
        selectedCount={0}
        hasOfficial={false}
        type="workflow"
      />
    )

    expect(container.firstChild).toBeNull()
  })

  describe('workflow type', () => {
    it('should render load button when onLoad is provided', () => {
      const onLoad = jest.fn()
      render(
        <MarketplaceActionButtons
          selectedCount={2}
          hasOfficial={false}
          onLoad={onLoad}
          type="workflow"
        />
      )

      const button = screen.getByText(/Load 2 Workflows/)
      expect(button).toBeInTheDocument()
    })

    it('should render singular label for single selection', () => {
      const onLoad = jest.fn()
      render(
        <MarketplaceActionButtons
          selectedCount={1}
          hasOfficial={false}
          onLoad={onLoad}
          type="workflow"
        />
      )

      expect(screen.getByText(/Load 1 Workflow/)).toBeInTheDocument()
    })

    it('should call onLoad when load button is clicked', async () => {
      const user = userEvent.setup()
      const onLoad = jest.fn()
      render(
        <MarketplaceActionButtons
          selectedCount={1}
          hasOfficial={false}
          onLoad={onLoad}
          type="workflow"
        />
      )

      const button = screen.getByText(/Load 1 Workflow/)
      await user.click(button)

      expect(onLoad).toHaveBeenCalledTimes(1)
    })

    it('should render delete button when onDelete is provided and no official items', () => {
      const onDelete = jest.fn()
      render(
        <MarketplaceActionButtons
          selectedCount={2}
          hasOfficial={false}
          onDelete={onDelete}
          type="workflow"
        />
      )

      const button = screen.getByText(/Delete 2 Workflows/)
      expect(button).toBeInTheDocument()
    })

    it('should not render delete button when hasOfficial is true', () => {
      const onDelete = jest.fn()
      render(
        <MarketplaceActionButtons
          selectedCount={2}
          hasOfficial={true}
          onDelete={onDelete}
          type="workflow"
        />
      )

      expect(screen.queryByText(/Delete/)).not.toBeInTheDocument()
    })

    it('should not render delete button when showDelete is false', () => {
      const onDelete = jest.fn()
      render(
        <MarketplaceActionButtons
          selectedCount={2}
          hasOfficial={false}
          onDelete={onDelete}
          type="workflow"
          showDelete={false}
        />
      )

      expect(screen.queryByText(/Delete/)).not.toBeInTheDocument()
    })

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      const onDelete = jest.fn()
      render(
        <MarketplaceActionButtons
          selectedCount={1}
          hasOfficial={false}
          onDelete={onDelete}
          type="workflow"
        />
      )

      const button = screen.getByText(/Delete 1 Workflow/)
      await user.click(button)

      expect(onDelete).toHaveBeenCalledTimes(1)
    })
  })

  describe('agent type', () => {
    it('should render use button when onUse is provided', () => {
      const onUse = jest.fn()
      render(
        <MarketplaceActionButtons
          selectedCount={3}
          hasOfficial={false}
          onUse={onUse}
          type="agent"
        />
      )

      const button = screen.getByText(/Use 3 Agents/)
      expect(button).toBeInTheDocument()
    })

    it('should render singular label for single selection', () => {
      const onUse = jest.fn()
      render(
        <MarketplaceActionButtons
          selectedCount={1}
          hasOfficial={false}
          onUse={onUse}
          type="agent"
        />
      )

      expect(screen.getByText(/Use 1 Agent/)).toBeInTheDocument()
    })

    it('should call onUse when use button is clicked', async () => {
      const user = userEvent.setup()
      const onUse = jest.fn()
      render(
        <MarketplaceActionButtons
          selectedCount={1}
          hasOfficial={false}
          onUse={onUse}
          type="agent"
        />
      )

      const button = screen.getByText(/Use 1 Agent/)
      await user.click(button)

      expect(onUse).toHaveBeenCalledTimes(1)
    })

    it('should render delete button for agents when onDelete is provided', () => {
      const onDelete = jest.fn()
      render(
        <MarketplaceActionButtons
          selectedCount={2}
          hasOfficial={false}
          onDelete={onDelete}
          type="agent"
        />
      )

      const button = screen.getByText(/Delete 2 Agents/)
      expect(button).toBeInTheDocument()
    })
  })

  it('should render multiple buttons when multiple actions are provided', () => {
    const onLoad = jest.fn()
    const onDelete = jest.fn()
    render(
      <MarketplaceActionButtons
        selectedCount={2}
        hasOfficial={false}
        onLoad={onLoad}
        onDelete={onDelete}
        type="workflow"
      />
    )

    expect(screen.getByText(/Load 2 Workflows/)).toBeInTheDocument()
    expect(screen.getByText(/Delete 2 Workflows/)).toBeInTheDocument()
  })
})
