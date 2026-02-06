/**
 * AWS S3 Editor Component Tests
 * Tests for AWS S3 editor component rendering and interactions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import AWSS3Editor from './AWSS3Editor'
import type { NodeWithData } from '../../../types/nodeData'
import { INPUT_MODE, INPUT_REGION } from '../../../hooks/utils/inputDefaults'

describe('AWSS3Editor', () => {
  const mockOnConfigUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createNode = (inputConfig: Record<string, any> = {}): NodeWithData & { type: 'aws_s3' } => ({
    id: '1',
    type: 'aws_s3',
    position: { x: 0, y: 0 },
    data: {
      input_config: inputConfig,
    },
  } as NodeWithData & { type: 'aws_s3' })

  it('should render all AWS S3 configuration fields', () => {
    const node = createNode()
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByText('AWS S3 Configuration')).toBeInTheDocument()
    expect(screen.getByLabelText('Select S3 operation mode')).toBeInTheDocument()
    expect(screen.getByLabelText('AWS S3 bucket name')).toBeInTheDocument()
    expect(screen.getByLabelText('S3 object key')).toBeInTheDocument()
    expect(screen.getByLabelText('AWS access key ID')).toBeInTheDocument()
    expect(screen.getByLabelText('AWS secret access key')).toBeInTheDocument()
    expect(screen.getByLabelText('AWS region')).toBeInTheDocument()
  })

  it('should display current bucket name value', () => {
    const node = createNode({ bucket_name: 'my-bucket' })
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const bucketInput = screen.getByLabelText('AWS S3 bucket name') as HTMLInputElement
    expect(bucketInput.value).toBe('my-bucket')
  })

  it('should display current object key value', () => {
    const node = createNode({ object_key: 'path/to/file.txt' })
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const objectKeyInput = screen.getByLabelText('S3 object key') as HTMLInputElement
    expect(objectKeyInput.value).toBe('path/to/file.txt')
  })

  it('should display current access key ID value', () => {
    const node = createNode({ access_key_id: 'AKIAIOSFODNN7EXAMPLE' })
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const accessKeyInput = screen.getByLabelText('AWS access key ID') as HTMLInputElement
    expect(accessKeyInput.value).toBe('AKIAIOSFODNN7EXAMPLE')
  })

  it('should display current secret key value', () => {
    const node = createNode({ secret_access_key: 'secret-key-123' })
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const secretKeyInput = screen.getByLabelText('AWS secret access key') as HTMLInputElement
    expect(secretKeyInput.value).toBe('secret-key-123')
    expect(secretKeyInput.type).toBe('password')
  })

  it('should display current region value', () => {
    const node = createNode({ region: 'us-east-1' })
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const regionInput = screen.getByLabelText('AWS region') as HTMLInputElement
    expect(regionInput.value).toBe('us-east-1')
  })

  it('should display read mode by default', () => {
    const node = createNode()
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText('Select S3 operation mode') as HTMLSelectElement
    expect(modeSelect.value).toBe(INPUT_MODE.READ)
  })

  it('should display write mode when configured', () => {
    const node = createNode({ mode: INPUT_MODE.WRITE })
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText('Select S3 operation mode') as HTMLSelectElement
    expect(modeSelect.value).toBe(INPUT_MODE.WRITE)
  })

  it('should call onConfigUpdate when bucket name changes', () => {
    const node = createNode()
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const bucketInput = screen.getByLabelText('AWS S3 bucket name')
    fireEvent.change(bucketInput, { target: { value: 'new-bucket' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'bucket_name', 'new-bucket')
  })

  it('should call onConfigUpdate when object key changes', () => {
    const node = createNode()
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const objectKeyInput = screen.getByLabelText('S3 object key')
    fireEvent.change(objectKeyInput, { target: { value: 'new/path.txt' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'object_key', 'new/path.txt')
  })

  it('should call onConfigUpdate when access key ID changes', () => {
    const node = createNode()
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const accessKeyInput = screen.getByLabelText('AWS access key ID')
    fireEvent.change(accessKeyInput, { target: { value: 'NEWKEY' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'access_key_id', 'NEWKEY')
  })

  it('should call onConfigUpdate when secret key changes', () => {
    const node = createNode()
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const secretKeyInput = screen.getByLabelText('AWS secret access key')
    fireEvent.change(secretKeyInput, { target: { value: 'new-secret' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'secret_access_key', 'new-secret')
  })

  it('should call onConfigUpdate when region changes', () => {
    const node = createNode()
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const regionInput = screen.getByLabelText('AWS region')
    fireEvent.change(regionInput, { target: { value: 'us-west-2' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'region', 'us-west-2')
  })

  it('should call onConfigUpdate when mode changes', () => {
    const node = createNode()
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText('Select S3 operation mode')
    fireEvent.change(modeSelect, { target: { value: INPUT_MODE.WRITE } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'mode', INPUT_MODE.WRITE)
  })

  it('should use default region when region is not provided', () => {
    const node = createNode()
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const regionInput = screen.getByLabelText('AWS region') as HTMLInputElement
    expect(regionInput.placeholder).toBe(INPUT_REGION.DEFAULT)
  })

  it('should handle empty input_config', () => {
    const node = createNode({})
    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText('AWS S3 bucket name')).toBeInTheDocument()
    const bucketInput = screen.getByLabelText('AWS S3 bucket name') as HTMLInputElement
    expect(bucketInput.value).toBe('')
  })

  it('should handle missing input_config', () => {
    const node = {
      id: '1',
      type: 'aws_s3' as const,
      position: { x: 0, y: 0 },
      data: {},
    } as NodeWithData & { type: 'aws_s3' }

    render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText('AWS S3 bucket name')).toBeInTheDocument()
  })
})
