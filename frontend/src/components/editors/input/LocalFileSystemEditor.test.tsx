/**
 * Local FileSystem Editor Component Tests
 * Tests for Local FileSystem editor component rendering and interactions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import LocalFileSystemEditor from './LocalFileSystemEditor'
import type { NodeWithData } from '../../../types/nodeData'
import { INPUT_MODE, DEFAULT_OVERWRITE } from '../../../hooks/utils/inputDefaults'

describe('LocalFileSystemEditor', () => {
  const mockOnConfigUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createNode = (inputConfig: Record<string, any> = {}): NodeWithData & { type: 'local_filesystem' } => ({
    id: '1',
    type: 'local_filesystem',
    position: { x: 0, y: 0 },
    data: {
      input_config: inputConfig,
    },
  } as NodeWithData & { type: 'local_filesystem' })

  it('should render all Local FileSystem configuration fields', () => {
    const node = createNode()
    render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByText('Local File System Configuration')).toBeInTheDocument()
    expect(screen.getByLabelText('Select file system operation mode')).toBeInTheDocument()
    expect(screen.getByLabelText('File system path')).toBeInTheDocument()
  })

  it('should display current file path value', () => {
    const node = createNode({ file_path: '/path/to/file.txt' })
    render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const filePathInput = screen.getByLabelText('File system path') as HTMLInputElement
    expect(filePathInput.value).toBe('/path/to/file.txt')
  })

  it('should display current file pattern value when mode is read', () => {
    const node = createNode({ mode: INPUT_MODE.READ, file_pattern: '*.txt' })
    render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const filePatternInput = screen.getByLabelText('File pattern for matching') as HTMLInputElement
    expect(filePatternInput.value).toBe('*.txt')
  })

  it('should display overwrite checkbox when mode is write', () => {
    const node = createNode({ mode: INPUT_MODE.WRITE, overwrite: true })
    render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const overwriteCheckbox = screen.getByLabelText('Overwrite existing file') as HTMLInputElement
    expect(overwriteCheckbox.checked).toBe(true)
  })

  it('should not display file pattern when mode is write', () => {
    const node = createNode({ mode: INPUT_MODE.WRITE })
    render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.queryByLabelText('File pattern for matching')).not.toBeInTheDocument()
  })

  it('should not display overwrite checkbox when mode is read', () => {
    const node = createNode({ mode: INPUT_MODE.READ })
    render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.queryByLabelText('Overwrite existing file')).not.toBeInTheDocument()
  })

  it('should display read mode by default', () => {
    const node = createNode()
    render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText('Select file system operation mode') as HTMLSelectElement
    expect(modeSelect.value).toBe(INPUT_MODE.READ)
  })

  it('should display write mode when configured', () => {
    const node = createNode({ mode: INPUT_MODE.WRITE })
    render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText('Select file system operation mode') as HTMLSelectElement
    expect(modeSelect.value).toBe(INPUT_MODE.WRITE)
  })

  it('should call onConfigUpdate when file path changes', () => {
    const node = createNode()
    render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const filePathInput = screen.getByLabelText('File system path')
    fireEvent.change(filePathInput, { target: { value: '/new/path.txt' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'file_path', '/new/path.txt')
  })

  it('should call onConfigUpdate when file pattern changes', () => {
    const node = createNode({ mode: INPUT_MODE.READ })
    render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const filePatternInput = screen.getByLabelText('File pattern for matching')
    fireEvent.change(filePatternInput, { target: { value: '*.json' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'file_pattern', '*.json')
  })

  it('should call onConfigUpdate when overwrite checkbox changes', () => {
    const node = createNode({ mode: INPUT_MODE.WRITE, overwrite: false })
    render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const overwriteCheckbox = screen.getByLabelText('Overwrite existing file')
    fireEvent.click(overwriteCheckbox)

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'overwrite', true)
  })

  it('should call onConfigUpdate when mode changes', () => {
    const node = createNode({ mode: INPUT_MODE.READ })
    render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText('Select file system operation mode')
    fireEvent.change(modeSelect, { target: { value: INPUT_MODE.WRITE } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'mode', INPUT_MODE.WRITE)
  })

  it('should use default overwrite value when not provided', () => {
    const node = createNode({ mode: INPUT_MODE.WRITE })
    render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const overwriteCheckbox = screen.getByLabelText('Overwrite existing file') as HTMLInputElement
    expect(overwriteCheckbox.checked).toBe(DEFAULT_OVERWRITE)
  })

  it('should handle empty input_config', () => {
    const node = createNode({})
    render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const filePathInput = screen.getByLabelText('File system path') as HTMLInputElement
    expect(filePathInput.value).toBe('')
  })

  it('should handle missing input_config', () => {
    const node = {
      id: '1',
      type: 'local_filesystem' as const,
      position: { x: 0, y: 0 },
      data: {},
    } as NodeWithData & { type: 'local_filesystem' }

    render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText('File system path')).toBeInTheDocument()
  })

  it('should show file pattern field when switching to read mode', () => {
    const node = createNode({ mode: INPUT_MODE.WRITE })
    const { rerender } = render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.queryByLabelText('File pattern for matching')).not.toBeInTheDocument()

    const updatedNode = createNode({ mode: INPUT_MODE.READ })
    rerender(<LocalFileSystemEditor node={updatedNode} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText('File pattern for matching')).toBeInTheDocument()
  })

  it('should show overwrite checkbox when switching to write mode', () => {
    const node = createNode({ mode: INPUT_MODE.READ })
    const { rerender } = render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.queryByLabelText('Overwrite existing file')).not.toBeInTheDocument()

    const updatedNode = createNode({ mode: INPUT_MODE.WRITE })
    rerender(<LocalFileSystemEditor node={updatedNode} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText('Overwrite existing file')).toBeInTheDocument()
  })
})
