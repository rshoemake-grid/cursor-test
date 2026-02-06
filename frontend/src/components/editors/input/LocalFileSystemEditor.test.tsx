/**
 * Local FileSystem Editor Component Tests
 * Tests for Local FileSystem input editor component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import LocalFileSystemEditor from './LocalFileSystemEditor'
import type { NodeWithData } from '../../../types/nodeData'
import { INPUT_MODE, EMPTY_STRING, DEFAULT_OVERWRITE } from '../../../hooks/utils/inputDefaults'

describe('LocalFileSystemEditor', () => {
  const mockOnConfigUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createFileSystemNode = (overrides?: Partial<NodeWithData['data']['input_config']>): NodeWithData => ({
    id: '1',
    type: 'local_filesystem',
    position: { x: 0, y: 0 },
    data: {
      input_config: {
        file_path: '/path/to/file.txt',
        file_pattern: '*.txt',
        mode: INPUT_MODE.READ,
        overwrite: false,
        ...overrides,
      },
    },
  } as NodeWithData)

  describe('Component Rendering', () => {
    it('should render Local File System configuration section', () => {
      const node = createFileSystemNode()
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByText('Local File System Configuration')).toBeInTheDocument()
    })

    it('should render all input fields', () => {
      const node = createFileSystemNode()
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('File system path')).toBeInTheDocument()
      expect(screen.getByLabelText('Select file system operation mode')).toBeInTheDocument()
    })

    it('should render mode select with options', () => {
      const node = createFileSystemNode()
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select file system operation mode') as HTMLSelectElement
      expect(modeSelect.options).toHaveLength(2)
      expect(modeSelect.options[0].text).toBe('Read from file')
      expect(modeSelect.options[1].text).toBe('Write to file')
    })
  })

  describe('Read Mode Fields', () => {
    it('should show file pattern field when mode is read', () => {
      const node = createFileSystemNode({ mode: INPUT_MODE.READ })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('File pattern for matching')).toBeInTheDocument()
    })

    it('should display current file pattern value in read mode', () => {
      const node = createFileSystemNode({ mode: INPUT_MODE.READ, file_pattern: '*.json' })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const patternInput = screen.getByLabelText('File pattern for matching') as HTMLInputElement
      expect(patternInput.value).toBe('*.json')
    })

    it('should call onConfigUpdate when file pattern changes in read mode', () => {
      const node = createFileSystemNode({ mode: INPUT_MODE.READ })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const patternInput = screen.getByLabelText('File pattern for matching')
      fireEvent.change(patternInput, { target: { value: '*.csv' } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'file_pattern', '*.csv')
    })

    it('should not show overwrite checkbox when mode is read', () => {
      const node = createFileSystemNode({ mode: INPUT_MODE.READ })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.queryByLabelText('Overwrite existing file')).not.toBeInTheDocument()
    })
  })

  describe('Write Mode Fields', () => {
    it('should show overwrite checkbox when mode is write', () => {
      const node = createFileSystemNode({ mode: INPUT_MODE.WRITE })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('Overwrite existing file')).toBeInTheDocument()
    })

    it('should display current overwrite value in write mode', () => {
      const node = createFileSystemNode({ mode: INPUT_MODE.WRITE, overwrite: true })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const overwriteCheckbox = screen.getByLabelText('Overwrite existing file') as HTMLInputElement
      expect(overwriteCheckbox.checked).toBe(true)
    })

    it('should call onConfigUpdate when overwrite changes in write mode', () => {
      const node = createFileSystemNode({ mode: INPUT_MODE.WRITE, overwrite: false })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const overwriteCheckbox = screen.getByLabelText('Overwrite existing file')
      fireEvent.click(overwriteCheckbox)

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'overwrite', true)
    })

    it('should not show file pattern field when mode is write', () => {
      const node = createFileSystemNode({ mode: INPUT_MODE.WRITE })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.queryByLabelText('File pattern for matching')).not.toBeInTheDocument()
    })
  })

  describe('Field Values', () => {
    it('should display current file path value', () => {
      const node = createFileSystemNode({ file_path: '/custom/path/file.txt' })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const filePathInput = screen.getByLabelText('File system path') as HTMLInputElement
      expect(filePathInput.value).toBe('/custom/path/file.txt')
    })

    it('should display current mode value', () => {
      const node = createFileSystemNode({ mode: INPUT_MODE.WRITE })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select file system operation mode') as HTMLSelectElement
      expect(modeSelect.value).toBe(INPUT_MODE.WRITE)
    })
  })

  describe('Default Values', () => {
    it('should use empty string default for file path when not provided', () => {
      const node = createFileSystemNode({ file_path: undefined })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const filePathInput = screen.getByLabelText('File system path') as HTMLInputElement
      expect(filePathInput.value).toBe(EMPTY_STRING)
    })

    it('should use empty string default for file pattern when not provided', () => {
      const node = createFileSystemNode({ mode: INPUT_MODE.READ, file_pattern: undefined })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const patternInput = screen.getByLabelText('File pattern for matching') as HTMLInputElement
      expect(patternInput.value).toBe(EMPTY_STRING)
    })

    it('should use default overwrite value when not provided', () => {
      const node = createFileSystemNode({ mode: INPUT_MODE.WRITE, overwrite: undefined })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const overwriteCheckbox = screen.getByLabelText('Overwrite existing file') as HTMLInputElement
      expect(overwriteCheckbox.checked).toBe(DEFAULT_OVERWRITE)
    })

    it('should use read mode default when not provided', () => {
      const node = createFileSystemNode({ mode: undefined })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select file system operation mode') as HTMLSelectElement
      expect(modeSelect.value).toBe(INPUT_MODE.READ)
    })
  })

  describe('Field Updates', () => {
    it('should call onConfigUpdate when file path changes', () => {
      const node = createFileSystemNode()
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const filePathInput = screen.getByLabelText('File system path')
      fireEvent.change(filePathInput, { target: { value: '/new/path/file.txt' } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'file_path', '/new/path/file.txt')
    })

    it('should call onConfigUpdate when mode changes', () => {
      const node = createFileSystemNode()
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select file system operation mode')
      fireEvent.change(modeSelect, { target: { value: INPUT_MODE.WRITE } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'mode', INPUT_MODE.WRITE)
    })

    it('should toggle between read and write mode fields when mode changes', () => {
      const node = createFileSystemNode({ mode: INPUT_MODE.READ })
      const { rerender } = render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      // Initially in read mode - should show pattern field
      expect(screen.getByLabelText('File pattern for matching')).toBeInTheDocument()
      expect(screen.queryByLabelText('Overwrite existing file')).not.toBeInTheDocument()

      // Change to write mode
      const updatedNode = createFileSystemNode({ mode: INPUT_MODE.WRITE })
      rerender(<LocalFileSystemEditor node={updatedNode} onConfigUpdate={mockOnConfigUpdate} />)

      // Should show overwrite checkbox, hide pattern field
      expect(screen.getByLabelText('Overwrite existing file')).toBeInTheDocument()
      expect(screen.queryByLabelText('File pattern for matching')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty input_config', () => {
      const node: NodeWithData = {
        id: '1',
        type: 'local_filesystem',
        position: { x: 0, y: 0 },
        data: {
          input_config: {},
        },
      } as NodeWithData

      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('File system path')).toBeInTheDocument()
      const filePathInput = screen.getByLabelText('File system path') as HTMLInputElement
      expect(filePathInput.value).toBe(EMPTY_STRING)
    })

    it('should handle null input_config', () => {
      const node: NodeWithData = {
        id: '1',
        type: 'local_filesystem',
        position: { x: 0, y: 0 },
        data: {
          input_config: null as any,
        },
      } as NodeWithData

      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('File system path')).toBeInTheDocument()
    })

    it('should handle undefined input_config', () => {
      const node: NodeWithData = {
        id: '1',
        type: 'local_filesystem',
        position: { x: 0, y: 0 },
        data: {},
      } as NodeWithData

      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('File system path')).toBeInTheDocument()
    })

    it('should handle empty string values', () => {
      const node = createFileSystemNode({
        file_path: '',
        file_pattern: '',
      })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const filePathInput = screen.getByLabelText('File system path') as HTMLInputElement
      expect(filePathInput.value).toBe('')
    })

    it('should handle overwrite false value', () => {
      const node = createFileSystemNode({ mode: INPUT_MODE.WRITE, overwrite: false })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const overwriteCheckbox = screen.getByLabelText('Overwrite existing file') as HTMLInputElement
      expect(overwriteCheckbox.checked).toBe(false)
    })
  })

  describe('Placeholders', () => {
    it('should display correct placeholder for file path', () => {
      const node = createFileSystemNode({ file_path: '' })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const filePathInput = screen.getByLabelText('File system path')
      expect(filePathInput).toHaveAttribute('placeholder', '/path/to/file.txt')
    })

    it('should display correct placeholder for file pattern', () => {
      const node = createFileSystemNode({ mode: INPUT_MODE.READ, file_pattern: '' })
      render(<LocalFileSystemEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const patternInput = screen.getByLabelText('File pattern for matching')
      expect(patternInput).toHaveAttribute('placeholder', '*.txt or leave blank for exact match')
    })
  })
})
