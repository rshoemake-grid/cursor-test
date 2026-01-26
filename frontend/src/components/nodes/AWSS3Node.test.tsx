import React from 'react'
import { render, screen } from '@testing-library/react'
import AWSS3Node from './AWSS3Node'
import { ReactFlowProvider } from '@xyflow/react'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ReactFlowProvider>
      {component}
    </ReactFlowProvider>
  )
}

describe('AWSS3Node', () => {
  it('should render AWS S3 node', () => {
    const nodeData = {
      label: 'My S3 Bucket',
    }

    renderWithProvider(
      <AWSS3Node data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText('My S3 Bucket')).toBeInTheDocument()
  })

  it('should render with default label', () => {
    const nodeData = {
      label: '',
    }

    renderWithProvider(
      <AWSS3Node data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText('AWS S3')).toBeInTheDocument()
  })

  it('should render bucket name', () => {
    const nodeData = {
      label: 'My S3',
      input_config: {
        bucket_name: 'my-s3-bucket',
      },
    }

    renderWithProvider(
      <AWSS3Node data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/Bucket: my-s3-bucket/)).toBeInTheDocument()
  })

  it('should render object key', () => {
    const nodeData = {
      label: 'My S3',
      input_config: {
        object_key: 'path/to/file.txt',
      },
    }

    renderWithProvider(
      <AWSS3Node data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/File: file.txt/)).toBeInTheDocument()
  })

  it('should render mode', () => {
    const nodeData = {
      label: 'My S3',
      input_config: {
        mode: 'read',
      },
    }

    renderWithProvider(
      <AWSS3Node data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/Mode: Read/)).toBeInTheDocument()
  })

  it('should show selected state', () => {
    const nodeData = {
      label: 'My S3',
    }

    const { container } = renderWithProvider(
      <AWSS3Node data={nodeData} selected={true} id="node-1" />
    )

    const nodeElement = container.querySelector('.border-yellow-500')
    expect(nodeElement).toBeInTheDocument()
  })

  it('should show error state', () => {
    const nodeData = {
      label: 'My S3',
      executionStatus: 'failed',
    }

    const { container } = renderWithProvider(
      <AWSS3Node data={nodeData} selected={false} id="node-1" />
    )

    const nodeElement = container.querySelector('.border-red-500')
    expect(nodeElement).toBeInTheDocument()
  })
})
