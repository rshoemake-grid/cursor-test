import React, { createRef } from 'react'
import { render } from '@testing-library/react'
import { ReactFlowInstanceCapture } from './ReactFlowInstanceCapture'
import { useReactFlow } from '@xyflow/react'

jest.mock('@xyflow/react', () => ({
  useReactFlow: jest.fn(),
}))

const mockUseReactFlow = useReactFlow as jest.MockedFunction<typeof useReactFlow>

describe('ReactFlowInstanceCapture', () => {
  const mockReactFlowInstance = {
    screenToFlowCoordinate: jest.fn(),
    flowToScreenCoordinate: jest.fn(),
    getViewport: jest.fn(),
    setViewport: jest.fn(),
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
    zoomTo: jest.fn(),
    fitView: jest.fn(),
    getNodes: jest.fn(),
    getEdges: jest.fn(),
    setNodes: jest.fn(),
    setEdges: jest.fn(),
    addNodes: jest.fn(),
    addEdges: jest.fn(),
    updateNode: jest.fn(),
    updateEdge: jest.fn(),
    deleteElements: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseReactFlow.mockReturnValue(mockReactFlowInstance as any)
  })

  it('should render without crashing', () => {
    const instanceRef = createRef<any>()
    const { container } = render(<ReactFlowInstanceCapture instanceRef={instanceRef} />)

    expect(container.firstChild).toBeNull()
  })

  it('should capture ReactFlow instance in ref', () => {
    const instanceRef = createRef<any>()
    render(<ReactFlowInstanceCapture instanceRef={instanceRef} />)

    expect(instanceRef.current).toBe(mockReactFlowInstance)
  })

  it('should update ref when ReactFlow instance changes', () => {
    const instanceRef = createRef<any>()
    const { rerender } = render(<ReactFlowInstanceCapture instanceRef={instanceRef} />)

    expect(instanceRef.current).toBe(mockReactFlowInstance)

    const newInstance = { ...mockReactFlowInstance, zoomIn: jest.fn() }
    mockUseReactFlow.mockReturnValue(newInstance as any)

    rerender(<ReactFlowInstanceCapture instanceRef={instanceRef} />)

    expect(instanceRef.current).toBe(newInstance)
  })

  it('should call useReactFlow hook', () => {
    const instanceRef = createRef<any>()
    render(<ReactFlowInstanceCapture instanceRef={instanceRef} />)

    expect(mockUseReactFlow).toHaveBeenCalled()
  })

  it('should handle null instance gracefully', () => {
    mockUseReactFlow.mockReturnValue(null as any)
    const instanceRef = createRef<any>()

    render(<ReactFlowInstanceCapture instanceRef={instanceRef} />)

    expect(instanceRef.current).toBeNull()
  })
})
