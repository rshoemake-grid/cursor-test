import React from 'react'
import { render } from '@testing-library/react'
import { KeyboardHandler } from './KeyboardHandler'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

jest.mock('../hooks/useKeyboardShortcuts')

const mockUseKeyboardShortcuts = useKeyboardShortcuts as jest.MockedFunction<typeof useKeyboardShortcuts>

describe('KeyboardHandler', () => {
  const mockProps = {
    selectedNodeId: 'node-1',
    setSelectedNodeId: jest.fn(),
    notifyModified: jest.fn(),
    clipboardNode: null,
    onCopy: jest.fn(),
    onCut: jest.fn(),
    onPaste: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseKeyboardShortcuts.mockReturnValue(undefined)
  })

  it('should render without crashing', () => {
    const { container } = render(<KeyboardHandler {...mockProps} />)
    expect(container.firstChild).toBeNull()
  })

  it('should call useKeyboardShortcuts with correct props', () => {
    render(<KeyboardHandler {...mockProps} />)

    expect(mockUseKeyboardShortcuts).toHaveBeenCalledWith({
      selectedNodeId: mockProps.selectedNodeId,
      setSelectedNodeId: mockProps.setSelectedNodeId,
      notifyModified: mockProps.notifyModified,
      clipboardNode: mockProps.clipboardNode,
      onCopy: mockProps.onCopy,
      onCut: mockProps.onCut,
      onPaste: mockProps.onPaste,
    })
  })

  it('should pass clipboardNode to hook', () => {
    const clipboardNode = { id: 'clipboard-1', type: 'agent', data: {}, position: { x: 0, y: 0 } }
    render(<KeyboardHandler {...mockProps} clipboardNode={clipboardNode} />)

    expect(mockUseKeyboardShortcuts).toHaveBeenCalledWith(
      expect.objectContaining({
        clipboardNode,
      })
    )
  })

  it('should handle null selectedNodeId', () => {
    render(<KeyboardHandler {...mockProps} selectedNodeId={null} />)

    expect(mockUseKeyboardShortcuts).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedNodeId: null,
      })
    )
  })
})
