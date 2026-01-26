import React from 'react'
import { render, screen } from '@testing-library/react'
import LoopNode from './LoopNode'
import { ReactFlowProvider } from '@xyflow/react'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ReactFlowProvider>
      {component}
    </ReactFlowProvider>
  )
}

describe('LoopNode', () => {
  it('should render loop node', () => {
    renderWithProvider(<LoopNode selected={false} data={{ label: 'Test Loop' }} id="loop-1" />)

    expect(screen.getByText('Test Loop')).toBeInTheDocument()
  })

  it('should show selected state', () => {
    const { container } = renderWithProvider(<LoopNode selected={true} data={{ label: 'Test' }} id="loop-1" />)

    const node = container.querySelector('.border-primary-500')
    expect(node).toBeInTheDocument()
  })

  it('should show error state when executionStatus is failed', () => {
    const { container } = renderWithProvider(
      <LoopNode 
        selected={false} 
        data={{ label: 'Test', executionStatus: 'failed' }} 
        id="loop-1" 
      />
    )

    const node = container.querySelector('.border-red-500')
    expect(node).toBeInTheDocument()
  })

  it('should display description when provided', () => {
    renderWithProvider(
      <LoopNode 
        selected={false} 
        data={{ label: 'Test', description: 'Test description' }} 
        id="loop-1" 
      />
    )

    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('should display loop config when provided', () => {
    renderWithProvider(
      <LoopNode 
        selected={false} 
        data={{ 
          label: 'Test', 
          loop_config: { loop_type: 'for_each', max_iterations: 10 }
        }} 
        id="loop-1" 
      />
    )

    expect(screen.getByText(/for_each/)).toBeInTheDocument()
    expect(screen.getByText(/max: 10/)).toBeInTheDocument()
  })

  it('should display loop config without max_iterations', () => {
    renderWithProvider(
      <LoopNode 
        selected={false} 
        data={{ 
          label: 'Test', 
          loop_config: { loop_type: 'while' }
        }} 
        id="loop-1" 
      />
    )

    expect(screen.getByText('while')).toBeInTheDocument()
  })
})
