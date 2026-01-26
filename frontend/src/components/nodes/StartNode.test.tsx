import React from 'react'
import { render, screen } from '@testing-library/react'
import StartNode from './StartNode'
import { ReactFlowProvider } from '@xyflow/react'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ReactFlowProvider>
      {component}
    </ReactFlowProvider>
  )
}

describe('StartNode', () => {
  it('should render start node', () => {
    renderWithProvider(<StartNode selected={false} data={{}} id="start-1" />)

    expect(screen.getByText('Start')).toBeInTheDocument()
  })

  it('should show selected state', () => {
    const { container } = renderWithProvider(<StartNode selected={true} data={{}} id="start-1" />)

    const node = container.querySelector('.border-primary-700')
    expect(node).toBeInTheDocument()
  })

  it('should show unselected state', () => {
    const { container } = renderWithProvider(<StartNode selected={false} data={{}} id="start-1" />)

    const node = container.querySelector('.border-primary-700')
    expect(node).not.toBeInTheDocument()
  })
})
