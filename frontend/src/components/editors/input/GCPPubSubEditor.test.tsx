/**
 * GCP Pub/Sub Editor Component Tests
 * Tests for GCP Pub/Sub input editor component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import GCPPubSubEditor from './GCPPubSubEditor'
import type { NodeWithData } from '../../../types/nodeData'
import { INPUT_MODE, EMPTY_STRING } from '../../../hooks/utils/inputDefaults'

describe('GCPPubSubEditor', () => {
  const mockOnConfigUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createPubSubNode = (overrides?: Partial<NodeWithData['data']['input_config']>): NodeWithData => ({
    id: '1',
    type: 'gcp_pubsub',
    position: { x: 0, y: 0 },
    data: {
      input_config: {
        project_id: 'my-project',
        topic_name: 'my-topic',
        subscription_name: 'my-subscription',
        credentials: '{"type":"service_account"}',
        mode: INPUT_MODE.READ,
        ...overrides,
      },
    },
  } as NodeWithData)

  describe('Component Rendering', () => {
    it('should render GCP Pub/Sub configuration section', () => {
      const node = createPubSubNode()
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByText('GCP Pub/Sub Configuration')).toBeInTheDocument()
    })

    it('should render all input fields', () => {
      const node = createPubSubNode()
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('GCP project ID')).toBeInTheDocument()
      expect(screen.getByLabelText('Pub/Sub topic name')).toBeInTheDocument()
      expect(screen.getByLabelText('Pub/Sub subscription name')).toBeInTheDocument()
      expect(screen.getByLabelText('GCP service account credentials')).toBeInTheDocument()
      expect(screen.getByLabelText('Select Pub/Sub operation mode')).toBeInTheDocument()
    })

    it('should render mode select with options', () => {
      const node = createPubSubNode()
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select Pub/Sub operation mode') as HTMLSelectElement
      expect(modeSelect.options).toHaveLength(2)
      expect(modeSelect.options[0].text).toBe('Subscribe (read messages)')
      expect(modeSelect.options[1].text).toBe('Publish (write messages)')
    })

    it('should render credentials as textarea', () => {
      const node = createPubSubNode()
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const credentialsTextarea = screen.getByLabelText('GCP service account credentials') as HTMLTextAreaElement
      expect(credentialsTextarea.tagName).toBe('TEXTAREA')
      expect(credentialsTextarea.rows).toBe(3)
    })
  })

  describe('Field Values', () => {
    it('should display current project ID value', () => {
      const node = createPubSubNode({ project_id: 'my-gcp-project' })
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const projectIdInput = screen.getByLabelText('GCP project ID') as HTMLInputElement
      expect(projectIdInput.value).toBe('my-gcp-project')
    })

    it('should display current topic name value', () => {
      const node = createPubSubNode({ topic_name: 'my-topic-name' })
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const topicInput = screen.getByLabelText('Pub/Sub topic name') as HTMLInputElement
      expect(topicInput.value).toBe('my-topic-name')
    })

    it('should display current subscription name value', () => {
      const node = createPubSubNode({ subscription_name: 'my-subscription-name' })
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const subscriptionInput = screen.getByLabelText('Pub/Sub subscription name') as HTMLInputElement
      expect(subscriptionInput.value).toBe('my-subscription-name')
    })

    it('should display current credentials value', () => {
      const credentials = '{"type":"service_account","project_id":"test"}'
      const node = createPubSubNode({ credentials })
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const credentialsTextarea = screen.getByLabelText('GCP service account credentials') as HTMLTextAreaElement
      expect(credentialsTextarea.value).toBe(credentials)
    })

    it('should display current mode value', () => {
      const node = createPubSubNode({ mode: INPUT_MODE.WRITE })
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select Pub/Sub operation mode') as HTMLSelectElement
      expect(modeSelect.value).toBe(INPUT_MODE.WRITE)
    })
  })

  describe('Default Values', () => {
    it('should use empty string default for project ID when not provided', () => {
      const node = createPubSubNode({ project_id: undefined })
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const projectIdInput = screen.getByLabelText('GCP project ID') as HTMLInputElement
      expect(projectIdInput.value).toBe(EMPTY_STRING)
    })

    it('should use empty string default for topic name when not provided', () => {
      const node = createPubSubNode({ topic_name: undefined })
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const topicInput = screen.getByLabelText('Pub/Sub topic name') as HTMLInputElement
      expect(topicInput.value).toBe(EMPTY_STRING)
    })

    it('should use empty string default for subscription name when not provided', () => {
      const node = createPubSubNode({ subscription_name: undefined })
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const subscriptionInput = screen.getByLabelText('Pub/Sub subscription name') as HTMLInputElement
      expect(subscriptionInput.value).toBe(EMPTY_STRING)
    })

    it('should use empty string default for credentials when not provided', () => {
      const node = createPubSubNode({ credentials: undefined })
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const credentialsTextarea = screen.getByLabelText('GCP service account credentials') as HTMLTextAreaElement
      expect(credentialsTextarea.value).toBe(EMPTY_STRING)
    })

    it('should use read mode default when not provided', () => {
      const node = createPubSubNode({ mode: undefined })
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select Pub/Sub operation mode') as HTMLSelectElement
      expect(modeSelect.value).toBe(INPUT_MODE.READ)
    })
  })

  describe('Field Updates', () => {
    it('should call onConfigUpdate when project ID changes', () => {
      const node = createPubSubNode()
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const projectIdInput = screen.getByLabelText('GCP project ID')
      fireEvent.change(projectIdInput, { target: { value: 'new-project' } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'project_id', 'new-project')
    })

    it('should call onConfigUpdate when topic name changes', () => {
      const node = createPubSubNode()
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const topicInput = screen.getByLabelText('Pub/Sub topic name')
      fireEvent.change(topicInput, { target: { value: 'new-topic' } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'topic_name', 'new-topic')
    })

    it('should call onConfigUpdate when subscription name changes', () => {
      const node = createPubSubNode()
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const subscriptionInput = screen.getByLabelText('Pub/Sub subscription name')
      fireEvent.change(subscriptionInput, { target: { value: 'new-subscription' } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'subscription_name', 'new-subscription')
    })

    it('should call onConfigUpdate when credentials change', () => {
      const node = createPubSubNode()
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const credentialsTextarea = screen.getByLabelText('GCP service account credentials')
      fireEvent.change(credentialsTextarea, { target: { value: '{"new":"credentials"}' } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'credentials', '{"new":"credentials"}')
    })

    it('should call onConfigUpdate when mode changes', () => {
      const node = createPubSubNode()
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText('Select Pub/Sub operation mode')
      fireEvent.change(modeSelect, { target: { value: INPUT_MODE.WRITE } })

      expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'mode', INPUT_MODE.WRITE)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty input_config', () => {
      const node: NodeWithData = {
        id: '1',
        type: 'gcp_pubsub',
        position: { x: 0, y: 0 },
        data: {
          input_config: {},
        },
      } as NodeWithData

      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('GCP project ID')).toBeInTheDocument()
      const projectIdInput = screen.getByLabelText('GCP project ID') as HTMLInputElement
      expect(projectIdInput.value).toBe(EMPTY_STRING)
    })

    it('should handle null input_config', () => {
      const node: NodeWithData = {
        id: '1',
        type: 'gcp_pubsub',
        position: { x: 0, y: 0 },
        data: {
          input_config: null as any,
        },
      } as NodeWithData

      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('GCP project ID')).toBeInTheDocument()
    })

    it('should handle undefined input_config', () => {
      const node: NodeWithData = {
        id: '1',
        type: 'gcp_pubsub',
        position: { x: 0, y: 0 },
        data: {},
      } as NodeWithData

      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByLabelText('GCP project ID')).toBeInTheDocument()
    })

    it('should handle empty string values', () => {
      const node = createPubSubNode({
        project_id: '',
        topic_name: '',
        subscription_name: '',
        credentials: '',
      })
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const projectIdInput = screen.getByLabelText('GCP project ID') as HTMLInputElement
      expect(projectIdInput.value).toBe('')
    })
  })

  describe('Placeholders', () => {
    it('should display correct placeholder for project ID', () => {
      const node = createPubSubNode({ project_id: '' })
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const projectIdInput = screen.getByLabelText('GCP project ID')
      expect(projectIdInput).toHaveAttribute('placeholder', 'my-gcp-project')
    })

    it('should display correct placeholder for topic name', () => {
      const node = createPubSubNode({ topic_name: '' })
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const topicInput = screen.getByLabelText('Pub/Sub topic name')
      expect(topicInput).toHaveAttribute('placeholder', 'my-topic')
    })

    it('should display correct placeholder for subscription name', () => {
      const node = createPubSubNode({ subscription_name: '' })
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const subscriptionInput = screen.getByLabelText('Pub/Sub subscription name')
      expect(subscriptionInput).toHaveAttribute('placeholder', 'my-subscription')
    })

    it('should display correct placeholder for credentials', () => {
      const node = createPubSubNode({ credentials: '' })
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const credentialsTextarea = screen.getByLabelText('GCP service account credentials')
      expect(credentialsTextarea).toHaveAttribute('placeholder', 'Paste GCP service account JSON credentials')
    })
  })

  describe('Helper Text', () => {
    it('should display mode description', () => {
      const node = createPubSubNode()
      render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      expect(screen.getByText('Subscribe: Receive messages from topic. Publish: Send messages to topic.')).toBeInTheDocument()
    })
  })
})
