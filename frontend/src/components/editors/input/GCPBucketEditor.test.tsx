/**
 * GCP Bucket Editor Component Tests
 * Tests for GCP Bucket input editor component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import GCPBucketEditor from './GCPBucketEditor'
import type { NodeWithData } from '../../../types/nodeData'
import { INPUT_MODE, EMPTY_STRING } from '../../../hooks/utils/inputDefaults'

describe('GCPBucketEditor', () => {
  const mockOnConfigUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createGCPBucketNode = (overrides?: Partial<NodeWithData['data']['input_config']>): NodeWithData => ({
    id: '1',
    type: 'gcp_bucket',
    position: { x: 0, y: 0 },
    data: {
      input_config: {
        bucket_name: 'test-bucket',
        object_path: 'path/to/file.txt',
        credentials: '{"type":"service_account"}',
        mode: INPUT_MODE.READ,
        ...overrides,
      },
    },
  } as NodeWithData)

  describe('Component Rendering', () => {
    it('should render GCP Bucket configuration section', () => {
      const node = createGCPBucketNode()
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByText('GCP Bucket Configuration')).toBeInTheDocument()
    })

    it('should render all input fields', () => {
      const node = createGCPBucketNode()
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('GCP bucket name')).toBeInTheDocument()
      expect(screen.getByLabelText('Object path in bucket')).toBeInTheDocument()
      expect(screen.getByLabelText('GCP service account credentials')).toBeInTheDocument()
      expect(screen.getByLabelText('Select bucket operation mode')).toBeInTheDocument()
    })

    it('should render mode select with options', () => {
      const node = createGCPBucketNode()
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select bucket operation mode') as HTMLSelectElement
      expect(modeSelect.options).toHaveLength(2)
      expect(modeSelect.options[0].text).toBe('Read from bucket')
      expect(modeSelect.options[1].text).toBe('Write to bucket')
    })

    it('should render credentials as textarea', () => {
      const node = createGCPBucketNode()
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const credentialsTextarea = screen.getByLabelText('GCP service account credentials') as HTMLTextAreaElement
      expect(credentialsTextarea.tagName).toBe('TEXTAREA')
      expect(credentialsTextarea.rows).toBe(3)
    })
  })

  describe('Field Values', () => {
    it('should display current bucket name value', () => {
      const node = createGCPBucketNode({ bucket_name: 'my-gcp-bucket' })
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const bucketInput = screen.getByLabelText('GCP bucket name') as HTMLInputElement
      expect(bucketInput.value).toBe('my-gcp-bucket')
    })

    it('should display current object path value', () => {
      const node = createGCPBucketNode({ object_path: 'path/to/object' })
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const objectPathInput = screen.getByLabelText('Object path in bucket') as HTMLInputElement
      expect(objectPathInput.value).toBe('path/to/object')
    })

    it('should display current credentials value', () => {
      const credentials = '{"type":"service_account","project_id":"test"}'
      const node = createGCPBucketNode({ credentials })
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const credentialsTextarea = screen.getByLabelText('GCP service account credentials') as HTMLTextAreaElement
      expect(credentialsTextarea.value).toBe(credentials)
    })

    it('should display current mode value', () => {
      const node = createGCPBucketNode({ mode: INPUT_MODE.WRITE })
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select bucket operation mode') as HTMLSelectElement
      expect(modeSelect.value).toBe(INPUT_MODE.WRITE)
    })
  })

  describe('Default Values', () => {
    it('should use empty string default for bucket name when not provided', () => {
      const node = createGCPBucketNode({ bucket_name: undefined })
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const bucketInput = screen.getByLabelText('GCP bucket name') as HTMLInputElement
      expect(bucketInput.value).toBe(EMPTY_STRING)
    })

    it('should use empty string default for object path when not provided', () => {
      const node = createGCPBucketNode({ object_path: undefined })
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const objectPathInput = screen.getByLabelText('Object path in bucket') as HTMLInputElement
      expect(objectPathInput.value).toBe(EMPTY_STRING)
    })

    it('should use empty string default for credentials when not provided', () => {
      const node = createGCPBucketNode({ credentials: undefined })
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const credentialsTextarea = screen.getByLabelText('GCP service account credentials') as HTMLTextAreaElement
      expect(credentialsTextarea.value).toBe(EMPTY_STRING)
    })

    it('should use read mode default when not provided', () => {
      const node = createGCPBucketNode({ mode: undefined })
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select bucket operation mode') as HTMLSelectElement
      expect(modeSelect.value).toBe(INPUT_MODE.READ)
    })
  })

  describe('Field Updates', () => {
    it('should call onConfigUpdate when bucket name changes', () => {
      const node = createGCPBucketNode()
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const bucketInput = screen.getByLabelText('GCP bucket name')
      fireEvent.change(bucketInput, { target: { value: 'new-bucket' } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'bucket_name', 'new-bucket')
    })

    it('should call onConfigUpdate when object path changes', () => {
      const node = createGCPBucketNode()
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const objectPathInput = screen.getByLabelText('Object path in bucket')
      fireEvent.change(objectPathInput, { target: { value: 'new/path' } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'object_path', 'new/path')
    })

    it('should call onConfigUpdate when credentials change', () => {
      const node = createGCPBucketNode()
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const credentialsTextarea = screen.getByLabelText('GCP service account credentials')
      fireEvent.change(credentialsTextarea, { target: { value: '{"new":"credentials"}' } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'credentials', '{"new":"credentials"}')
    })

    it('should call onConfigUpdate when mode changes', () => {
      const node = createGCPBucketNode()
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select bucket operation mode')
      fireEvent.change(modeSelect, { target: { value: INPUT_MODE.WRITE } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'mode', INPUT_MODE.WRITE)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty input_config', () => {
      const node: NodeWithData = {
        id: '1',
        type: 'gcp_bucket',
        position: { x: 0, y: 0 },
        data: {
          input_config: {},
        },
      } as NodeWithData

      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('GCP bucket name')).toBeInTheDocument()
      const bucketInput = screen.getByLabelText('GCP bucket name') as HTMLInputElement
      expect(bucketInput.value).toBe(EMPTY_STRING)
    })

    it('should handle null input_config', () => {
      const node: NodeWithData = {
        id: '1',
        type: 'gcp_bucket',
        position: { x: 0, y: 0 },
        data: {
          input_config: null as any,
        },
      } as NodeWithData

      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('GCP bucket name')).toBeInTheDocument()
    })

    it('should handle undefined input_config', () => {
      const node: NodeWithData = {
        id: '1',
        type: 'gcp_bucket',
        position: { x: 0, y: 0 },
        data: {},
      } as NodeWithData

      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('GCP bucket name')).toBeInTheDocument()
    })

    it('should handle empty string values', () => {
      const node = createGCPBucketNode({
        bucket_name: '',
        object_path: '',
        credentials: '',
      })
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const bucketInput = screen.getByLabelText('GCP bucket name') as HTMLInputElement
      expect(bucketInput.value).toBe('')
    })
  })

  describe('Placeholders', () => {
    it('should display correct placeholder for bucket name', () => {
      const node = createGCPBucketNode({ bucket_name: '' })
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const bucketInput = screen.getByLabelText('GCP bucket name')
      expect(bucketInput).toHaveAttribute('placeholder', 'my-bucket-name')
    })

    it('should display correct placeholder for object path', () => {
      const node = createGCPBucketNode({ object_path: '' })
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const objectPathInput = screen.getByLabelText('Object path in bucket')
      expect(objectPathInput).toHaveAttribute('placeholder', 'path/to/file.txt or leave blank for all objects')
    })

    it('should display correct placeholder for credentials', () => {
      const node = createGCPBucketNode({ credentials: '' })
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const credentialsTextarea = screen.getByLabelText('GCP service account credentials')
      expect(credentialsTextarea).toHaveAttribute('placeholder', 'Paste GCP service account JSON credentials')
    })
  })

  describe('Helper Text', () => {
    it('should display mode description', () => {
      const node = createGCPBucketNode()
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByText('Read: Fetch data from bucket. Write: Save data to bucket.')).toBeInTheDocument()
    })

    it('should display credentials description', () => {
      const node = createGCPBucketNode()
      render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByText('Service account JSON credentials for GCP access')).toBeInTheDocument()
    })
  })
})
