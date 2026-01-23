import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import InputNodeEditor from './InputNodeEditor'
import type { NodeWithData } from '../../types/nodeData'

describe('InputNodeEditor', () => {
  const mockOnConfigUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GCP Bucket Configuration', () => {
    const gcpBucketNode: NodeWithData = {
      id: '1',
      type: 'gcp_bucket',
      position: { x: 0, y: 0 },
      data: {
        input_config: {
          bucket_name: 'test-bucket',
          object_path: 'path/to/file',
          credentials: '{"type":"service_account"}',
          mode: 'read'
        }
      }
    } as NodeWithData

    it('should render GCP bucket configuration fields', () => {
      render(<InputNodeEditor node={gcpBucketNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      expect(screen.getByLabelText(/GCP bucket name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Object path/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/GCP Credentials/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Mode/i)).toBeInTheDocument()
    })

    it('should display current bucket name value', () => {
      render(<InputNodeEditor node={gcpBucketNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      const bucketInput = screen.getByLabelText(/GCP bucket name/i) as HTMLInputElement
      expect(bucketInput.value).toBe('test-bucket')
    })

    it('should call onConfigUpdate when bucket name changes', () => {
      render(<InputNodeEditor node={gcpBucketNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      const bucketInput = screen.getByLabelText(/GCP bucket name/i)
      fireEvent.change(bucketInput, { target: { value: 'new-bucket' } })
      
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'bucket_name', 'new-bucket')
    })

    it('should call onConfigUpdate when object path changes', () => {
      render(<InputNodeEditor node={gcpBucketNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      const objectPathInput = screen.getByLabelText(/Object path/i)
      fireEvent.change(objectPathInput, { target: { value: 'new/path' } })
      
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'object_path', 'new/path')
    })

    it('should call onConfigUpdate when credentials change', () => {
      render(<InputNodeEditor node={gcpBucketNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      const credentialsInput = screen.getByLabelText(/GCP Credentials/i)
      fireEvent.change(credentialsInput, { target: { value: '{"new":"credentials"}' } })
      
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'credentials', '{"new":"credentials"}')
    })

    it('should call onConfigUpdate when mode changes', () => {
      render(<InputNodeEditor node={gcpBucketNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      const modeSelect = screen.getByLabelText(/Mode/i)
      fireEvent.change(modeSelect, { target: { value: 'write' } })
      
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'mode', 'write')
    })

    it('should display read mode option', () => {
      render(<InputNodeEditor node={gcpBucketNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      const modeSelect = screen.getByLabelText(/Mode/i) as HTMLSelectElement
      expect(modeSelect.value).toBe('read')
    })
  })

  describe('AWS S3 Configuration', () => {
    const awsS3Node: NodeWithData = {
      id: '2',
      type: 'aws_s3',
      position: { x: 0, y: 0 },
      data: {
        input_config: {
          bucket_name: 'aws-bucket',
          object_key: 'key/to/file',
          access_key_id: 'AKIAIOSFODNN7EXAMPLE',
          secret_access_key: 'secret',
          region: 'us-west-2',
          mode: 'read'
        }
      }
    } as NodeWithData

    it('should render AWS S3 configuration fields', () => {
      render(<InputNodeEditor node={awsS3Node} onConfigUpdate={mockOnConfigUpdate} />)
      
      expect(screen.getByLabelText(/AWS S3 bucket name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Object key/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/AWS Access Key ID/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/AWS Secret Access Key/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/AWS Region/i)).toBeInTheDocument()
    })

    it('should display current AWS S3 values', () => {
      render(<InputNodeEditor node={awsS3Node} onConfigUpdate={mockOnConfigUpdate} />)
      
      const bucketInput = screen.getByLabelText(/AWS S3 bucket name/i) as HTMLInputElement
      expect(bucketInput.value).toBe('aws-bucket')
      
      const regionInput = screen.getByLabelText(/AWS Region/i) as HTMLInputElement
      expect(regionInput.value).toBe('us-west-2')
    })

    it('should call onConfigUpdate when AWS fields change', () => {
      render(<InputNodeEditor node={awsS3Node} onConfigUpdate={mockOnConfigUpdate} />)
      
      const accessKeyInput = screen.getByLabelText(/AWS Access Key ID/i)
      fireEvent.change(accessKeyInput, { target: { value: 'NEWKEY' } })
      
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'access_key_id', 'NEWKEY')
    })

    it('should use default region when not provided', () => {
      const nodeWithoutRegion = {
        ...awsS3Node,
        data: {
          input_config: {
            bucket_name: 'test-bucket'
          }
        }
      }
      render(<InputNodeEditor node={nodeWithoutRegion} onConfigUpdate={mockOnConfigUpdate} />)
      
      const regionInput = screen.getByLabelText(/AWS Region/i) as HTMLInputElement
      expect(regionInput.value).toBe('us-east-1')
    })
  })

  describe('GCP Pub/Sub Configuration', () => {
    const pubsubNode: NodeWithData = {
      id: '3',
      type: 'gcp_pubsub',
      position: { x: 0, y: 0 },
      data: {
        input_config: {
          project_id: 'my-project',
          topic_name: 'my-topic',
          subscription_name: 'my-subscription',
          credentials: '{"type":"service_account"}',
          mode: 'read'
        }
      }
    } as NodeWithData

    it('should render Pub/Sub configuration fields', () => {
      render(<InputNodeEditor node={pubsubNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      expect(screen.getByLabelText(/Project ID/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Topic name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Subscription name/i)).toBeInTheDocument()
    })

    it('should call onConfigUpdate when Pub/Sub fields change', () => {
      render(<InputNodeEditor node={pubsubNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      const topicInput = screen.getByLabelText(/Topic name/i)
      fireEvent.change(topicInput, { target: { value: 'new-topic' } })
      
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'topic_name', 'new-topic')
    })

    it('should handle write mode for Pub/Sub', () => {
      render(<InputNodeEditor node={pubsubNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      const modeSelect = screen.getByLabelText(/Select Pub\/Sub operation mode/i)
      fireEvent.change(modeSelect, { target: { value: 'write' } })
      
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'mode', 'write')
    })
  })

  describe('Local FileSystem Configuration', () => {
    const filesystemNode: NodeWithData = {
      id: '4',
      type: 'local_filesystem',
      position: { x: 0, y: 0 },
      data: {
        input_config: {
          file_path: '/path/to/file.txt',
          file_pattern: '*.txt',
          mode: 'read',
          overwrite: false
        }
      }
    } as NodeWithData

    it('should render filesystem configuration fields', () => {
      render(<InputNodeEditor node={filesystemNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      expect(screen.getByLabelText(/File Path/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/File Pattern/i)).toBeInTheDocument()
    })

    it('should show file pattern when mode is read', () => {
      render(<InputNodeEditor node={filesystemNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      expect(screen.getByLabelText(/File Pattern/i)).toBeInTheDocument()
    })

    it('should show overwrite checkbox when mode is write', () => {
      const writeNode = {
        ...filesystemNode,
        data: {
          input_config: {
            ...filesystemNode.data.input_config,
            mode: 'write'
          }
        }
      }
      render(<InputNodeEditor node={writeNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      expect(screen.getByLabelText(/Overwrite existing file/i)).toBeInTheDocument()
    })

    it('should call onConfigUpdate when file path changes', () => {
      render(<InputNodeEditor node={filesystemNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      const filePathInput = screen.getByLabelText(/File Path/i)
      fireEvent.change(filePathInput, { target: { value: '/new/path' } })
      
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'file_path', '/new/path')
    })

    it('should call onConfigUpdate when overwrite changes', () => {
      const writeNode = {
        ...filesystemNode,
        data: {
          input_config: {
            ...filesystemNode.data.input_config,
            mode: 'write',
            overwrite: false
          }
        }
      }
      render(<InputNodeEditor node={writeNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i) as HTMLInputElement
      expect(overwriteCheckbox.checked).toBe(false)
      fireEvent.click(overwriteCheckbox)
      
      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'overwrite', true)
    })

    it('should use default overwrite value', () => {
      const nodeWithoutOverwrite = {
        ...filesystemNode,
        data: {
          input_config: {
            file_path: '/path/to/file.txt',
            mode: 'write'
          }
        }
      }
      render(<InputNodeEditor node={nodeWithoutOverwrite} onConfigUpdate={mockOnConfigUpdate} />)
      
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i) as HTMLInputElement
      expect(overwriteCheckbox.checked).toBe(true)
    })
  })

  describe('Other node types', () => {
    const databaseNode: NodeWithData = {
      id: '5',
      type: 'database',
      position: { x: 0, y: 0 },
      data: {}
    } as NodeWithData

    it('should render placeholder for database nodes', () => {
      render(<InputNodeEditor node={databaseNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      expect(screen.getByText(/Database Configuration/i)).toBeInTheDocument()
      expect(screen.getByText(/Configuration for database nodes is handled in PropertyPanel/i)).toBeInTheDocument()
    })

    const firebaseNode: NodeWithData = {
      id: '6',
      type: 'firebase',
      position: { x: 0, y: 0 },
      data: {}
    } as NodeWithData

    it('should render placeholder for firebase nodes', () => {
      render(<InputNodeEditor node={firebaseNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      expect(screen.getByText(/Firebase Configuration/i)).toBeInTheDocument()
    })

    const bigqueryNode: NodeWithData = {
      id: '7',
      type: 'bigquery',
      position: { x: 0, y: 0 },
      data: {}
    } as NodeWithData

    it('should render placeholder for bigquery nodes', () => {
      render(<InputNodeEditor node={bigqueryNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      expect(screen.getByText(/BigQuery Configuration/i)).toBeInTheDocument()
    })
  })

  describe('State synchronization', () => {
    it('should sync local state with node data on mount', () => {
      const node: NodeWithData = {
        id: '1',
        type: 'gcp_bucket',
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: 'initial-bucket'
          }
        }
      } as NodeWithData

      render(<InputNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)
      
      const bucketInput = screen.getByLabelText(/GCP bucket name/i) as HTMLInputElement
      expect(bucketInput.value).toBe('initial-bucket')
    })

    it('should update local state when node data changes', () => {
      const node: NodeWithData = {
        id: '1',
        type: 'gcp_bucket',
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: 'initial-bucket'
          }
        }
      } as NodeWithData

      const { rerender } = render(<InputNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)
      
      const updatedNode = {
        ...node,
        data: {
          input_config: {
            bucket_name: 'updated-bucket'
          }
        }
      }
      
      rerender(<InputNodeEditor node={updatedNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      const bucketInput = screen.getByLabelText(/GCP bucket name/i) as HTMLInputElement
      expect(bucketInput.value).toBe('updated-bucket')
    })

    it('should not update local state when input is focused', () => {
      const node: NodeWithData = {
        id: '1',
        type: 'gcp_bucket',
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: 'initial-bucket'
          }
        }
      } as NodeWithData

      const { rerender } = render(<InputNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)
      
      const bucketInput = screen.getByLabelText(/GCP bucket name/i) as HTMLInputElement
      bucketInput.focus()
      
      const updatedNode = {
        ...node,
        data: {
          input_config: {
            bucket_name: 'updated-bucket'
          }
        }
      }
      
      rerender(<InputNodeEditor node={updatedNode} onConfigUpdate={mockOnConfigUpdate} />)
      
      // Value should not change when input is focused
      expect(bucketInput.value).toBe('initial-bucket')
    })
  })
})

