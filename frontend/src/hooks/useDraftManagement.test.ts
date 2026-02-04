import { renderHook, act } from '@testing-library/react'
import { useDraftManagement, loadDraftsFromStorage, saveDraftsToStorage } from './useDraftManagement'
import type { Node, Edge } from '@xyflow/react'
import { getLocalStorageItem, setLocalStorageItem } from './useLocalStorage'

jest.mock('./useLocalStorage', () => ({
  getLocalStorageItem: jest.fn(),
  setLocalStorageItem: jest.fn(),
}))

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>
const mockSetLocalStorageItem = setLocalStorageItem as jest.MockedFunction<typeof setLocalStorageItem>

describe('useDraftManagement', () => {
  const mockNodes: Node[] = [
    { id: 'node-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
  ]
  const mockEdges: Edge[] = [
    { id: 'edge-1', source: 'node-1', target: 'node-2' },
  ]
  const mockSetNodes = jest.fn()
  const mockSetEdges = jest.fn()
  const mockSetLocalWorkflowId = jest.fn()
  const mockSetLocalWorkflowName = jest.fn()
  const mockSetLocalWorkflowDescription = jest.fn()
  const mockNormalizeNodeForStorage = jest.fn((node: Node) => node)
  const mockIsAddingAgentsRef = { current: false }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetLocalStorageItem.mockReturnValue({})
    mockNormalizeNodeForStorage.mockImplementation((node: Node) => node)
  })

  it('should load draft when tabId matches', () => {
    const draft = {
      nodes: mockNodes,
      edges: mockEdges,
      workflowId: 'workflow-1',
      workflowName: 'Test Workflow',
      workflowDescription: 'Test Description',
      isUnsaved: false,
    }
    mockGetLocalStorageItem.mockReturnValue({
      'tab-1': draft,
    })

    renderHook(() =>
      useDraftManagement({
        tabId: 'tab-1',
        workflowId: 'workflow-1',
        nodes: [],
        edges: [],
        localWorkflowId: null,
        localWorkflowName: 'Untitled Workflow',
        localWorkflowDescription: '',
        tabIsUnsaved: false,
        setNodes: mockSetNodes,
        setEdges: mockSetEdges,
        setLocalWorkflowId: mockSetLocalWorkflowId,
        setLocalWorkflowName: mockSetLocalWorkflowName,
        setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
        normalizeNodeForStorage: mockNormalizeNodeForStorage,
      })
    )

    expect(mockSetNodes).toHaveBeenCalledWith(mockNodes)
    expect(mockSetEdges).toHaveBeenCalledWith(mockEdges)
    expect(mockSetLocalWorkflowId).toHaveBeenCalledWith('workflow-1')
    expect(mockSetLocalWorkflowName).toHaveBeenCalledWith('Test Workflow')
    expect(mockSetLocalWorkflowDescription).toHaveBeenCalledWith('Test Description')
  })

  it('should not load draft when workflowId does not match', () => {
    const draft = {
      nodes: mockNodes,
      edges: mockEdges,
      workflowId: 'workflow-1',
      workflowName: 'Test Workflow',
      workflowDescription: 'Test Description',
      isUnsaved: false,
    }
    mockGetLocalStorageItem.mockReturnValue({
      'tab-1': draft,
    })

    renderHook(() =>
      useDraftManagement({
        tabId: 'tab-1',
        workflowId: 'workflow-2',
        nodes: [],
        edges: [],
        localWorkflowId: null,
        localWorkflowName: 'Untitled Workflow',
        localWorkflowDescription: '',
        tabIsUnsaved: false,
        setNodes: mockSetNodes,
        setEdges: mockSetEdges,
        setLocalWorkflowId: mockSetLocalWorkflowId,
        setLocalWorkflowName: mockSetLocalWorkflowName,
        setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
        normalizeNodeForStorage: mockNormalizeNodeForStorage,
      })
    )

    expect(mockSetNodes).not.toHaveBeenCalled()
  })

  it('should clear workflow when no workflowId and no draft', () => {
    mockGetLocalStorageItem.mockReturnValue({})

    renderHook(() =>
      useDraftManagement({
        tabId: 'tab-1',
        workflowId: null,
        nodes: [],
        edges: [],
        localWorkflowId: null,
        localWorkflowName: 'Untitled Workflow',
        localWorkflowDescription: '',
        tabIsUnsaved: false,
        setNodes: mockSetNodes,
        setEdges: mockSetEdges,
        setLocalWorkflowId: mockSetLocalWorkflowId,
        setLocalWorkflowName: mockSetLocalWorkflowName,
        setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
        normalizeNodeForStorage: mockNormalizeNodeForStorage,
      })
    )

    expect(mockSetNodes).toHaveBeenCalledWith([])
    expect(mockSetEdges).toHaveBeenCalledWith([])
    expect(mockSetLocalWorkflowId).toHaveBeenCalledWith(null)
    expect(mockSetLocalWorkflowName).toHaveBeenCalledWith('Untitled Workflow')
    expect(mockSetLocalWorkflowDescription).toHaveBeenCalledWith('')
  })

  it('should save draft when workflow state changes', () => {
    const { rerender } = renderHook(
      (props) => useDraftManagement(props),
      {
        initialProps: {
          tabId: 'tab-1',
          workflowId: null,
          nodes: mockNodes,
          edges: mockEdges,
          localWorkflowId: null,
          localWorkflowName: 'Test Workflow',
          localWorkflowDescription: 'Test Description',
          tabIsUnsaved: true,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          setLocalWorkflowId: mockSetLocalWorkflowId,
          setLocalWorkflowName: mockSetLocalWorkflowName,
          setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
          normalizeNodeForStorage: mockNormalizeNodeForStorage,
        },
      }
    )

    expect(mockSetLocalStorageItem).toHaveBeenCalledWith(
      'workflowBuilderDrafts',
      expect.objectContaining({
        'tab-1': expect.objectContaining({
          nodes: mockNodes,
          edges: mockEdges,
          workflowName: 'Test Workflow',
          workflowDescription: 'Test Description',
          isUnsaved: true,
        }),
      }),
      expect.objectContaining({
        storage: undefined,
        logger: expect.any(Object),
      })
    )

    // Update nodes
    rerender({
      tabId: 'tab-1',
      workflowId: null,
      nodes: [...mockNodes, { id: 'node-2', type: 'condition', position: { x: 0, y: 0 }, data: {} }],
      edges: mockEdges,
      localWorkflowId: null,
      localWorkflowName: 'Test Workflow',
      localWorkflowDescription: 'Test Description',
      tabIsUnsaved: true,
      setNodes: mockSetNodes,
      setEdges: mockSetEdges,
      setLocalWorkflowId: mockSetLocalWorkflowId,
      setLocalWorkflowName: mockSetLocalWorkflowName,
      setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
      normalizeNodeForStorage: mockNormalizeNodeForStorage,
    })

    expect(mockSetLocalStorageItem).toHaveBeenCalledTimes(2)
  })

  it('should skip loading draft when adding agents', () => {
    const draft = {
      nodes: mockNodes,
      edges: mockEdges,
      workflowId: 'workflow-1',
      workflowName: 'Test Workflow',
      workflowDescription: 'Test Description',
      isUnsaved: false,
    }
    mockGetLocalStorageItem.mockReturnValue({
      'tab-1': draft,
    })
    mockIsAddingAgentsRef.current = true

    renderHook(() =>
      useDraftManagement({
        tabId: 'tab-1',
        workflowId: 'workflow-1',
        nodes: [],
        edges: [],
        localWorkflowId: null,
        localWorkflowName: 'Untitled Workflow',
        localWorkflowDescription: '',
        tabIsUnsaved: false,
        setNodes: mockSetNodes,
        setEdges: mockSetEdges,
        setLocalWorkflowId: mockSetLocalWorkflowId,
        setLocalWorkflowName: mockSetLocalWorkflowName,
        setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
        normalizeNodeForStorage: mockNormalizeNodeForStorage,
        isAddingAgentsRef: mockIsAddingAgentsRef,
      })
    )

    expect(mockSetNodes).not.toHaveBeenCalled()
  })

  it('should normalize nodes before saving', () => {
    const normalizedNode = { ...mockNodes[0], data: { normalized: true } }
    mockNormalizeNodeForStorage.mockReturnValue(normalizedNode as Node)

    renderHook(() =>
      useDraftManagement({
        tabId: 'tab-1',
        workflowId: null,
        nodes: mockNodes,
        edges: mockEdges,
        localWorkflowId: null,
        localWorkflowName: 'Test Workflow',
        localWorkflowDescription: 'Test Description',
        tabIsUnsaved: false,
        setNodes: mockSetNodes,
        setEdges: mockSetEdges,
        setLocalWorkflowId: mockSetLocalWorkflowId,
        setLocalWorkflowName: mockSetLocalWorkflowName,
        setLocalWorkflowDescription: mockSetLocalWorkflowDescription,
        normalizeNodeForStorage: mockNormalizeNodeForStorage,
      })
    )

    expect(mockNormalizeNodeForStorage).toHaveBeenCalledWith(mockNodes[0], 0, mockNodes)
    expect(mockSetLocalStorageItem).toHaveBeenCalledWith(
      'workflowBuilderDrafts',
      expect.objectContaining({
        'tab-1': expect.objectContaining({
          nodes: [normalizedNode],
        }),
      }),
      expect.objectContaining({
        storage: undefined,
        logger: expect.any(Object),
      })
    )
  })
})

describe('loadDraftsFromStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should load drafts from storage', () => {
    const drafts = {
      'tab-1': {
        nodes: [],
        edges: [],
        workflowId: 'workflow-1',
        workflowName: 'Test',
        workflowDescription: '',
        isUnsaved: false,
      },
    }
    mockGetLocalStorageItem.mockReturnValue(drafts)

    const result = loadDraftsFromStorage()

    expect(result).toEqual(drafts)
    expect(mockGetLocalStorageItem).toHaveBeenCalledWith('workflowBuilderDrafts', {}, undefined)
  })

  it('should return empty object when storage returns null', () => {
    mockGetLocalStorageItem.mockReturnValue(null)

    const result = loadDraftsFromStorage()

    expect(result).toEqual({})
  })

  it('should return empty object when storage returns non-object', () => {
    mockGetLocalStorageItem.mockReturnValue('invalid' as any)

    const result = loadDraftsFromStorage()

    expect(result).toEqual({})
  })
})

describe('saveDraftsToStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should save drafts to storage', () => {
    const drafts = {
      'tab-1': {
        nodes: [],
        edges: [],
        workflowId: 'workflow-1',
        workflowName: 'Test',
        workflowDescription: '',
        isUnsaved: false,
      },
    }

    saveDraftsToStorage(drafts)

    expect(mockSetLocalStorageItem).toHaveBeenCalledWith('workflowBuilderDrafts', drafts, undefined)
  })
})
