import React from 'react'
import { render, screen } from '@testing-library/react'
import EndNode from './EndNode'
import { ReactFlowProvider } from '@xyflow/react'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ReactFlowProvider>
      {component}
    </ReactFlowProvider>
  )
}

describe('EndNode', () => {
  it('should render end node', () => {
    renderWithProvider(<EndNode selected={false} data={{}} id="end-1" />)

    expect(screen.getByText('End')).toBeInTheDocument()
  })

  it('should show selected state', () => {
    const { container } = renderWithProvider(<EndNode selected={true} data={{}} id="end-1" />)

    const node = container.querySelector('.border-gray-800')
    expect(node).toBeInTheDocument()
  })

  it('should show unselected state', () => {
    const { container } = renderWithProvider(<EndNode selected={false} data={{}} id="end-1" />)

    const node = container.querySelector('.border-gray-800')
    expect(node).not.toBeInTheDocument()
  })
})
