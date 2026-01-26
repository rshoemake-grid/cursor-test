import React from 'react'
import { render, screen } from '@testing-library/react'
import GCPPubSubNode from './GCPPubSubNode'
import { ReactFlowProvider } from '@xyflow/react'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ReactFlowProvider>
      {component}
    </ReactFlowProvider>
  )
}

describe('GCPPubSubNode', () => {
  it('should render GCP Pub/Sub node', () => {
    const nodeData = {
      label: 'My Topic',
    }

    renderWithProvider(
      <GCPPubSubNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText('My Topic')).toBeInTheDocument()
  })

  it('should render with default label', () => {
    const nodeData = {
      label: '',
    }

    renderWithProvider(
      <GCPPubSubNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText('GCP Pub/Sub')).toBeInTheDocument()
  })

  it('should render topic name', () => {
    const nodeData = {
      label: 'My Topic',
      input_config: {
        topic_name: 'my-topic',
      },
    }

    renderWithProvider(
      <GCPPubSubNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/Topic: my-topic/)).toBeInTheDocument()
  })

  it('should render subscription name', () => {
    const nodeData = {
      label: 'My Topic',
      input_config: {
        subscription_name: 'my-subscription',
      },
    }

    renderWithProvider(
      <GCPPubSubNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/Subscription: my-subscription/)).toBeInTheDocument()
  })

  it('should render publish mode', () => {
    const nodeData = {
      label: 'My Topic',
      input_config: {
        mode: 'write',
      },
    }

    renderWithProvider(
      <GCPPubSubNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/Mode: Publish/)).toBeInTheDocument()
  })

  it('should render subscribe mode', () => {
    const nodeData = {
      label: 'My Topic',
      input_config: {
        mode: 'read',
      },
    }

    renderWithProvider(
      <GCPPubSubNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/Mode: Subscribe/)).toBeInTheDocument()
  })

  it('should show selected state', () => {
    const nodeData = {
      label: 'My Topic',
    }

    const { container } = renderWithProvider(
      <GCPPubSubNode data={nodeData} selected={true} id="node-1" />
    )

    const nodeElement = container.querySelector('.border-purple-500')
    expect(nodeElement).toBeInTheDocument()
  })

  it('should show error state', () => {
    const nodeData = {
      label: 'My Topic',
      executionStatus: 'failed',
    }

    const { container } = renderWithProvider(
      <GCPPubSubNode data={nodeData} selected={false} id="node-1" />
    )

    const nodeElement = container.querySelector('.border-red-500')
    expect(nodeElement).toBeInTheDocument()
  })
})
