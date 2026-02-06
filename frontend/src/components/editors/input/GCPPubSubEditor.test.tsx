/**
 * GCP Pub/Sub Editor Component Tests
 * Tests for GCP Pub/Sub editor component rendering and interactions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import GCPPubSubEditor from './GCPPubSubEditor'
import type { NodeWithData } from '../../../types/nodeData'
import { INPUT_MODE } from '../../../hooks/utils/inputDefaults'

describe('GCPPubSubEditor', () => {
  const mockOnConfigUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createNode = (inputConfig: Record<string, any> = {}): NodeWithData & { type: 'gcp_pubsub' } => ({
    id: '1',
    type: 'gcp_pubsub',
    position: { x: 0, y: 0 },
    data: {
      input_config: inputConfig,
    },
  } as NodeWithData & { type: 'gcp_pubsub' })

  it('should render all GCP Pub/Sub configuration fields', () => {
    const node = createNode()
    render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByText('GCP Pub/Sub Configuration')).toBeInTheDocument()
    expect(screen.getByLabelText('Select Pub/Sub operation mode')).toBeInTheDocument()
    expect(screen.getByLabelText('GCP project ID')).toBeInTheDocument()
    expect(screen.getByLabelText('Pub/Sub topic name')).toBeInTheDocument()
    expect(screen.getByLabelText('Pub/Sub subscription name')).toBeInTheDocument()
    expect(screen.getByLabelText('GCP service account credentials')).toBeInTheDocument()
  })

  it('should display current project ID value', () => {
    const node = createNode({ project_id: 'my-gcp-project' })
    render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const projectIdInput = screen.getByLabelText('GCP project ID') as HTMLInputElement
    expect(projectIdInput.value).toBe('my-gcp-project')
  })

  it('should display current topic name value', () => {
    const node = createNode({ topic_name: 'my-topic' })
    render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const topicInput = screen.getByLabelText('Pub/Sub topic name') as HTMLInputElement
    expect(topicInput.value).toBe('my-topic')
  })

  it('should display current subscription name value', () => {
    const node = createNode({ subscription_name: 'my-subscription' })
    render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const subscriptionInput = screen.getByLabelText('Pub/Sub subscription name') as HTMLInputElement
    expect(subscriptionInput.value).toBe('my-subscription')
  })

  it('should display current credentials value', () => {
    const credentials = '{"type":"service_account","project_id":"test"}'
    const node = createNode({ credentials })
    render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const credentialsInput = screen.getByLabelText('GCP service account credentials') as HTMLTextAreaElement
    expect(credentialsInput.value).toBe(credentials)
  })

  it('should display read mode by default', () => {
    const node = createNode()
    render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText('Select Pub/Sub operation mode') as HTMLSelectElement
    expect(modeSelect.value).toBe(INPUT_MODE.READ)
  })

  it('should display write mode when configured', () => {
    const node = createNode({ mode: INPUT_MODE.WRITE })
    render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText('Select Pub/Sub operation mode') as HTMLSelectElement
    expect(modeSelect.value).toBe(INPUT_MODE.WRITE)
  })

  it('should call onConfigUpdate when project ID changes', () => {
    const node = createNode()
    render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const projectIdInput = screen.getByLabelText('GCP project ID')
    fireEvent.change(projectIdInput, { target: { value: 'new-project' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'project_id', 'new-project')
  })

  it('should call onConfigUpdate when topic name changes', () => {
    const node = createNode()
    render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const topicInput = screen.getByLabelText('Pub/Sub topic name')
    fireEvent.change(topicInput, { target: { value: 'new-topic' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'topic_name', 'new-topic')
  })

  it('should call onConfigUpdate when subscription name changes', () => {
    const node = createNode()
    render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const subscriptionInput = screen.getByLabelText('Pub/Sub subscription name')
    fireEvent.change(subscriptionInput, { target: { value: 'new-subscription' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'subscription_name', 'new-subscription')
  })

  it('should call onConfigUpdate when credentials change', () => {
    const node = createNode()
    render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const credentialsInput = screen.getByLabelText('GCP service account credentials')
    fireEvent.change(credentialsInput, { target: { value: '{"new":"credentials"}' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'credentials', '{"new":"credentials"}')
  })

  it('should call onConfigUpdate when mode changes', () => {
    const node = createNode()
    render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText('Select Pub/Sub operation mode')
    fireEvent.change(modeSelect, { target: { value: INPUT_MODE.WRITE } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'mode', INPUT_MODE.WRITE)
  })

  it('should render credentials as textarea', () => {
    const node = createNode()
    render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const credentialsInput = screen.getByLabelText('GCP service account credentials')
    expect(credentialsInput.tagName).toBe('TEXTAREA')
  })

  it('should handle empty input_config', () => {
    const node = createNode({})
    render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const projectIdInput = screen.getByLabelText('GCP project ID') as HTMLInputElement
    expect(projectIdInput.value).toBe('')
  })

  it('should handle missing input_config', () => {
    const node = {
      id: '1',
      type: 'gcp_pubsub' as const,
      position: { x: 0, y: 0 },
      data: {},
    } as NodeWithData & { type: 'gcp_pubsub' }

    render(<GCPPubSubEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText('GCP project ID')).toBeInTheDocument()
  })
})
