/**
 * AWS S3 Editor Component Tests
 * Tests for AWS S3 input editor component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import AWSS3Editor from './AWSS3Editor'
import type { NodeWithData } from '../../../types/nodeData'
import { INPUT_MODE, INPUT_REGION, EMPTY_STRING } from '../../../hooks/utils/inputDefaults'

describe('AWSS3Editor', () => {
  const mockOnConfigUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createAWSS3Node = (overrides?: Partial<NodeWithData['data']['input_config']>): NodeWithData => ({
    id: '1',
    type: 'aws_s3',
    position: { x: 0, y: 0 },
    data: {
      input_config: {
        bucket_name: 'test-bucket',
        object_key: 'path/to/file.txt',
        access_key_id: 'AKIAIOSFODNN7EXAMPLE',
        secret_access_key: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-west-2',
        mode: INPUT_MODE.READ,
        ...overrides,
      },
    },
  } as NodeWithData)

  describe('Component Rendering', () => {
    it('should render AWS S3 configuration section', () => {
      const node = createAWSS3Node()
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByText('AWS S3 Configuration')).toBeInTheDocument()
    })

    it('should render all input fields', () => {
      const node = createAWSS3Node()
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('AWS S3 bucket name')).toBeInTheDocument()
      expect(screen.getByLabelText('S3 object key')).toBeInTheDocument()
      expect(screen.getByLabelText('AWS Access Key ID')).toBeInTheDocument()
      expect(screen.getByLabelText('AWS Secret Access Key')).toBeInTheDocument()
      expect(screen.getByLabelText('AWS Region')).toBeInTheDocument()
      expect(screen.getByLabelText('Select S3 operation mode')).toBeInTheDocument()
    })

    it('should render mode select with options', () => {
      const node = createAWSS3Node()
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select S3 operation mode') as HTMLSelectElement
      expect(modeSelect.options).toHaveLength(2)
      expect(modeSelect.options[0].text).toBe('Read from bucket')
      expect(modeSelect.options[1].text).toBe('Write to bucket')
    })
  })

  describe('Field Values', () => {
    it('should display current bucket name value', () => {
      const node = createAWSS3Node({ bucket_name: 'my-bucket' })
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const bucketInput = screen.getByLabelText('AWS S3 bucket name') as HTMLInputElement
      expect(bucketInput.value).toBe('my-bucket')
    })

    it('should display current object key value', () => {
      const node = createAWSS3Node({ object_key: 'path/to/object' })
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const objectKeyInput = screen.getByLabelText('S3 object key') as HTMLInputElement
      expect(objectKeyInput.value).toBe('path/to/object')
    })

    it('should display current access key ID value', () => {
      const node = createAWSS3Node({ access_key_id: 'AKIA123456789' })
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const accessKeyInput = screen.getByLabelText('AWS Access Key ID') as HTMLInputElement
      expect(accessKeyInput.value).toBe('AKIA123456789')
    })

    it('should display current secret key value', () => {
      const node = createAWSS3Node({ secret_access_key: 'secret123' })
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const secretKeyInput = screen.getByLabelText('AWS Secret Access Key') as HTMLInputElement
      expect(secretKeyInput.type).toBe('password')
      expect(secretKeyInput.value).toBe('secret123')
    })

    it('should display current region value', () => {
      const node = createAWSS3Node({ region: 'eu-west-1' })
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const regionInput = screen.getByLabelText('AWS Region') as HTMLInputElement
      expect(regionInput.value).toBe('eu-west-1')
    })

    it('should display current mode value', () => {
      const node = createAWSS3Node({ mode: INPUT_MODE.WRITE })
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select S3 operation mode') as HTMLSelectElement
      expect(modeSelect.value).toBe(INPUT_MODE.WRITE)
    })
  })

  describe('Default Values', () => {
    it('should use empty string default for bucket name when not provided', () => {
      const node = createAWSS3Node({ bucket_name: undefined })
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const bucketInput = screen.getByLabelText('AWS S3 bucket name') as HTMLInputElement
      expect(bucketInput.value).toBe(EMPTY_STRING)
    })

    it('should use empty string default for object key when not provided', () => {
      const node = createAWSS3Node({ object_key: undefined })
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const objectKeyInput = screen.getByLabelText('S3 object key') as HTMLInputElement
      expect(objectKeyInput.value).toBe(EMPTY_STRING)
    })

    it('should use default region when not provided', () => {
      const node = createAWSS3Node({ region: undefined })
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const regionInput = screen.getByLabelText('AWS Region') as HTMLInputElement
      expect(regionInput.value).toBe(INPUT_REGION.DEFAULT)
    })

    it('should use read mode default when not provided', () => {
      const node = createAWSS3Node({ mode: undefined })
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select S3 operation mode') as HTMLSelectElement
      expect(modeSelect.value).toBe(INPUT_MODE.READ)
    })
  })

  describe('Field Updates', () => {
    it('should call onConfigUpdate when bucket name changes', () => {
      const node = createAWSS3Node()
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const bucketInput = screen.getByLabelText('AWS S3 bucket name')
      fireEvent.change(bucketInput, { target: { value: 'new-bucket' } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'bucket_name', 'new-bucket')
    })

    it('should call onConfigUpdate when object key changes', () => {
      const node = createAWSS3Node()
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const objectKeyInput = screen.getByLabelText('S3 object key')
      fireEvent.change(objectKeyInput, { target: { value: 'new/key' } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'object_key', 'new/key')
    })

    it('should call onConfigUpdate when access key ID changes', () => {
      const node = createAWSS3Node()
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const accessKeyInput = screen.getByLabelText('AWS Access Key ID')
      fireEvent.change(accessKeyInput, { target: { value: 'NEWKEY123' } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'access_key_id', 'NEWKEY123')
    })

    it('should call onConfigUpdate when secret key changes', () => {
      const node = createAWSS3Node()
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const secretKeyInput = screen.getByLabelText('AWS Secret Access Key')
      fireEvent.change(secretKeyInput, { target: { value: 'new-secret' } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'secret_access_key', 'new-secret')
    })

    it('should call onConfigUpdate when region changes', () => {
      const node = createAWSS3Node()
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const regionInput = screen.getByLabelText('AWS Region')
      fireEvent.change(regionInput, { target: { value: 'ap-southeast-1' } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'region', 'ap-southeast-1')
    })

    it('should call onConfigUpdate when mode changes', () => {
      const node = createAWSS3Node()
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select S3 operation mode')
      fireEvent.change(modeSelect, { target: { value: INPUT_MODE.WRITE } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'mode', INPUT_MODE.WRITE)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty input_config', () => {
      const node: NodeWithData = {
        id: '1',
        type: 'aws_s3',
        position: { x: 0, y: 0 },
        data: {
          input_config: {},
        },
      } as NodeWithData

      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('AWS S3 bucket name')).toBeInTheDocument()
      const bucketInput = screen.getByLabelText('AWS S3 bucket name') as HTMLInputElement
      expect(bucketInput.value).toBe(EMPTY_STRING)
    })

    it('should handle null input_config', () => {
      const node: NodeWithData = {
        id: '1',
        type: 'aws_s3',
        position: { x: 0, y: 0 },
        data: {
          input_config: null as any,
        },
      } as NodeWithData

      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('AWS S3 bucket name')).toBeInTheDocument()
    })

    it('should handle undefined input_config', () => {
      const node: NodeWithData = {
        id: '1',
        type: 'aws_s3',
        position: { x: 0, y: 0 },
        data: {},
      } as NodeWithData

      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('AWS S3 bucket name')).toBeInTheDocument()
    })

    it('should handle empty string values', () => {
      const node = createAWSS3Node({
        bucket_name: '',
        object_key: '',
        access_key_id: '',
        secret_access_key: '',
        region: '',
      })
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const bucketInput = screen.getByLabelText('AWS S3 bucket name') as HTMLInputElement
      expect(bucketInput.value).toBe('')
    })
  })

  describe('Placeholders', () => {
    it('should display correct placeholder for bucket name', () => {
      const node = createAWSS3Node({ bucket_name: '' })
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const bucketInput = screen.getByLabelText('AWS S3 bucket name')
      expect(bucketInput).toHaveAttribute('placeholder', 'my-bucket-name')
    })

    it('should display correct placeholder for object key', () => {
      const node = createAWSS3Node({ object_key: '' })
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const objectKeyInput = screen.getByLabelText('S3 object key')
      expect(objectKeyInput).toHaveAttribute('placeholder', 'path/to/file.txt or leave blank for all objects')
    })

    it('should display correct placeholder for access key ID', () => {
      const node = createAWSS3Node({ access_key_id: '' })
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const accessKeyInput = screen.getByLabelText('AWS Access Key ID')
      expect(accessKeyInput).toHaveAttribute('placeholder', 'AKIAIOSFODNN7EXAMPLE')
    })

    it('should display correct placeholder for region', () => {
      const node = createAWSS3Node({ region: '' })
      render(<AWSS3Editor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const regionInput = screen.getByLabelText('AWS Region')
      expect(regionInput).toHaveAttribute('placeholder', INPUT_REGION.DEFAULT)
    })
  })
})
