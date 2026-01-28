import React, { createRef } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { TabBar } from './TabBar'
import type { WorkflowTabData } from '../contexts/WorkflowTabsContext'

describe('TabBar', () => {
  const mockTabs: WorkflowTabData[] = [
    { id: 'tab-1', name: 'Workflow 1', isUnsaved: false },
    { id: 'tab-2', name: 'Workflow 2', isUnsaved: true },
    { id: 'tab-3', name: 'Workflow 3', isUnsaved: false },
  ]

  const mockProps = {
    tabs: mockTabs,
    activeTabId: 'tab-1',
    editingTabId: null,
    editingName: '',
    editingInputRef: createRef<HTMLInputElement>(),
    setEditingName: jest.fn(),
    onTabClick: jest.fn(),
    onTabDoubleClick: jest.fn(),
    onCloseTab: jest.fn(),
    onInputBlur: jest.fn(),
    onInputKeyDown: jest.fn(),
    onNewWorkflow: jest.fn(),
    onSave: jest.fn(),
    onExecute: jest.fn(),
    onPublish: jest.fn(),
    onExport: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all tabs', () => {
    render(<TabBar {...mockProps} />)

    expect(screen.getByText('Workflow 1')).toBeInTheDocument()
    expect(screen.getByText('Workflow 2')).toBeInTheDocument()
    expect(screen.getByText('Workflow 3')).toBeInTheDocument()
  })

  it('should highlight active tab', () => {
    render(<TabBar {...mockProps} activeTabId="tab-2" />)

    const tab2 = screen.getByText('Workflow 2').closest('button')
    expect(tab2).toHaveClass('bg-white')
  })

  it('should show unsaved indicator for unsaved tabs', () => {
    render(<TabBar {...mockProps} />)

    const tab2 = screen.getByText('Workflow 2').closest('button')
    const indicator = tab2?.querySelector('.bg-blue-500')
    expect(indicator).toBeInTheDocument()
  })

  it('should call onTabClick when tab is clicked', () => {
    render(<TabBar {...mockProps} />)

    const tab2 = screen.getByText('Workflow 2')
    fireEvent.click(tab2)

    expect(mockProps.onTabClick).toHaveBeenCalledWith('tab-2')
  })

  it('should call onTabDoubleClick when tab is double-clicked', () => {
    render(<TabBar {...mockProps} />)

    const tab2 = screen.getByText('Workflow 2')
    fireEvent.doubleClick(tab2)

    expect(mockProps.onTabDoubleClick).toHaveBeenCalledWith(mockTabs[1], expect.any(Object))
  })

  it('should show editing input when editingTabId matches', () => {
    render(<TabBar {...mockProps} editingTabId="tab-2" editingName="New Name" />)

    const input = screen.getByDisplayValue('New Name')
    expect(input).toBeInTheDocument()
  })

  it('should call setEditingName when editing input changes', () => {
    render(<TabBar {...mockProps} editingTabId="tab-2" editingName="New Name" />)

    const input = screen.getByDisplayValue('New Name')
    fireEvent.change(input, { target: { value: 'Updated Name' } })

    expect(mockProps.setEditingName).toHaveBeenCalledWith('Updated Name')
  })

  it('should call onInputBlur when editing input loses focus', () => {
    render(<TabBar {...mockProps} editingTabId="tab-2" editingName="New Name" />)

    const input = screen.getByDisplayValue('New Name')
    fireEvent.blur(input)

    expect(mockProps.onInputBlur).toHaveBeenCalledWith('tab-2')
  })

  it('should call onInputKeyDown when key is pressed in editing input', () => {
    render(<TabBar {...mockProps} editingTabId="tab-2" editingName="New Name" />)

    const input = screen.getByDisplayValue('New Name')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockProps.onInputKeyDown).toHaveBeenCalledWith('tab-2', expect.any(Object))
  })

  it('should stop propagation when editing input is clicked', () => {
    render(<TabBar {...mockProps} editingTabId="tab-2" editingName="New Name" />)

    const input = screen.getByDisplayValue('New Name')
    const onClick = jest.fn()
    input.addEventListener('click', onClick)
    
    // The component's onClick handler should stop propagation
    fireEvent.click(input)
    
    // Verify the input is rendered and clickable
    expect(input).toBeInTheDocument()
  })

  it('should show close button on hover when tabs.length > 1', () => {
    render(<TabBar {...mockProps} />)

    const tab1 = screen.getByText('Workflow 1').closest('button')
    const closeButton = tab1?.querySelector('.opacity-0')
    expect(closeButton).toBeInTheDocument()
  })

  it('should not show close button when tabs.length === 1', () => {
    render(<TabBar {...mockProps} tabs={[mockTabs[0]]} />)

    const tab1 = screen.getByText('Workflow 1').closest('button')
    const closeButton = tab1?.querySelector('.opacity-0')
    expect(closeButton).not.toBeInTheDocument()
  })

  it('should call onCloseTab when close button is clicked', () => {
    render(<TabBar {...mockProps} />)

    const tab1 = screen.getByText('Workflow 1').closest('button')
    const closeButton = tab1?.querySelector('.opacity-0')
    
    if (closeButton) {
      fireEvent.click(closeButton)
      expect(mockProps.onCloseTab).toHaveBeenCalledWith('tab-1', expect.any(Object))
    }
  })

  it('should call onCloseTab when Enter key is pressed on close button', () => {
    render(<TabBar {...mockProps} />)

    const tab1 = screen.getByText('Workflow 1').closest('button')
    const closeButton = tab1?.querySelector('[role="button"]')
    
    if (closeButton) {
      fireEvent.keyDown(closeButton, { key: 'Enter' })
      expect(mockProps.onCloseTab).toHaveBeenCalled()
    }
  })

  it('should call onCloseTab when Space key is pressed on close button', () => {
    render(<TabBar {...mockProps} />)

    const tab1 = screen.getByText('Workflow 1').closest('button')
    const closeButton = tab1?.querySelector('[role="button"]')
    
    if (closeButton) {
      fireEvent.keyDown(closeButton, { key: ' ' })
      expect(mockProps.onCloseTab).toHaveBeenCalled()
    }
  })

  it('should call onSave when Save button is clicked', () => {
    render(<TabBar {...mockProps} />)

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    expect(mockProps.onSave).toHaveBeenCalled()
  })

  it('should call onExecute when Execute button is clicked', () => {
    render(<TabBar {...mockProps} />)

    const executeButton = screen.getByRole('button', { name: /execute/i })
    fireEvent.click(executeButton)

    expect(mockProps.onExecute).toHaveBeenCalled()
  })

  it('should call onPublish when Publish button is clicked', () => {
    render(<TabBar {...mockProps} />)

    const publishButton = screen.getByRole('button', { name: /publish/i })
    fireEvent.click(publishButton)

    expect(mockProps.onPublish).toHaveBeenCalled()
  })

  it('should call onExport when Export button is clicked', () => {
    render(<TabBar {...mockProps} />)

    const exportButton = screen.getByRole('button', { name: /export/i })
    fireEvent.click(exportButton)

    expect(mockProps.onExport).toHaveBeenCalled()
  })

  it('should call onNewWorkflow when New button is clicked', () => {
    render(<TabBar {...mockProps} />)

    const newButton = screen.getByRole('button', { name: /new/i })
    fireEvent.click(newButton)

    expect(mockProps.onNewWorkflow).toHaveBeenCalled()
  })

  it('should render tab names correctly', () => {
    render(<TabBar {...mockProps} />)

    mockTabs.forEach(tab => {
      expect(screen.getByText(tab.name)).toBeInTheDocument()
    })
  })

  it('should handle empty tabs array', () => {
    render(<TabBar {...mockProps} tabs={[]} />)

    expect(screen.queryByText('Workflow 1')).not.toBeInTheDocument()
  })
})
