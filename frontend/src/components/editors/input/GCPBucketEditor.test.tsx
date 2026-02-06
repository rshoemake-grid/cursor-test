/**
 * GCP Bucket Editor Component Tests
 * Tests for GCP Bucket editor component rendering and interactions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import GCPBucketEditor from './GCPBucketEditor'
import type { NodeWithData } from '../../../types/nodeData'
import { INPUT_MODE } from '../../../hooks/utils/inputDefaults'

describe('GCPBucketEditor', () => {
  const mockOnConfigUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createNode = (inputConfig: Record<string, any> = {}): NodeWithData & { type: 'gcp_bucket' } => ({
    id: '1',
    type: 'gcp_bucket',
    position: { x: 0, y: 0 },
    data: {
      input_config: inputConfig,
    },
  } as NodeWithData & { type: 'gcp_bucket' })

  it('should render all GCP Bucket configuration fields', () => {
    const node = createNode()
    render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByText('GCP Bucket Configuration')).toBeInTheDocument()
    expect(screen.getByLabelText('Select bucket operation mode')).toBeInTheDocument()
    expect(screen.getByLabelText('GCP bucket name')).toBeInTheDocument()
    expect(screen.getByLabelText('Object path in bucket')).toBeInTheDocument()
    expect(screen.getByLabelText('GCP service account credentials')).toBeInTheDocument()
  })

  it('should display current bucket name value', () => {
    const node = createNode({ bucket_name: 'my-gcp-bucket' })
    render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const bucketInput = screen.getByLabelText('GCP bucket name') as HTMLInputElement
    expect(bucketInput.value).toBe('my-gcp-bucket')
  })

  it('should display current object path value', () => {
    const node = createNode({ object_path: 'path/to/file.txt' })
    render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const objectPathInput = screen.getByLabelText('Object path in bucket') as HTMLInputElement
    expect(objectPathInput.value).toBe('path/to/file.txt')
  })

  it('should display current credentials value', () => {
    const credentials = '{"type":"service_account","project_id":"test"}'
    const node = createNode({ credentials })
    render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const credentialsInput = screen.getByLabelText('GCP service account credentials') as HTMLTextAreaElement
    expect(credentialsInput.value).toBe(credentials)
  })

  it('should display read mode by default', () => {
    const node = createNode()
    render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText('Select bucket operation mode') as HTMLSelectElement
    expect(modeSelect.value).toBe(INPUT_MODE.READ)
  })

  it('should display write mode when configured', () => {
    const node = createNode({ mode: INPUT_MODE.WRITE })
    render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText('Select bucket operation mode') as HTMLSelectElement
    expect(modeSelect.value).toBe(INPUT_MODE.WRITE)
  })

  it('should call onConfigUpdate when bucket name changes', () => {
    const node = createNode()
    render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const bucketInput = screen.getByLabelText('GCP bucket name')
    fireEvent.change(bucketInput, { target: { value: 'new-bucket' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'bucket_name', 'new-bucket')
  })

  it('should call onConfigUpdate when object path changes', () => {
    const node = createNode()
    render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const objectPathInput = screen.getByLabelText('Object path in bucket')
    fireEvent.change(objectPathInput, { target: { value: 'new/path.txt' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'object_path', 'new/path.txt')
  })

  it('should call onConfigUpdate when credentials change', () => {
    const node = createNode()
    render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const credentialsInput = screen.getByLabelText('GCP service account credentials')
    fireEvent.change(credentialsInput, { target: { value: '{"new":"credentials"}' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'credentials', '{"new":"credentials"}')
  })

  it('should call onConfigUpdate when mode changes', () => {
    const node = createNode()
    render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText('Select bucket operation mode')
    fireEvent.change(modeSelect, { target: { value: INPUT_MODE.WRITE } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'mode', INPUT_MODE.WRITE)
  })

  it('should render credentials as textarea', () => {
    const node = createNode()
    render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const credentialsInput = screen.getByLabelText('GCP service account credentials')
    expect(credentialsInput.tagName).toBe('TEXTAREA')
  })

  it('should handle empty input_config', () => {
    const node = createNode({})
    render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const bucketInput = screen.getByLabelText('GCP bucket name') as HTMLInputElement
    expect(bucketInput.value).toBe('')
  })

  it('should handle missing input_config', () => {
    const node = {
      id: '1',
      type: 'gcp_bucket' as const,
      position: { x: 0, y: 0 },
      data: {},
    } as NodeWithData & { type: 'gcp_bucket' }

    render(<GCPBucketEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText('GCP bucket name')).toBeInTheDocument()
  })
})
