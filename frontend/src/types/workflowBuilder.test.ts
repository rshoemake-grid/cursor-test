import type {
  WorkflowBuilderCoreProps,
  WorkflowBuilderExecutionProps,
  WorkflowBuilderPersistenceProps,
  WorkflowBuilderSelectionProps,
  WorkflowBuilderProps,
} from './workflowBuilder'

describe('WorkflowBuilder Types', () => {
  describe('WorkflowBuilderCoreProps', () => {
    it('should create valid WorkflowBuilderCoreProps', () => {
      const props: WorkflowBuilderCoreProps = {
        tabId: 'tab-1',
        workflowId: 'workflow-1',
        tabName: 'Workflow Tab',
        tabIsUnsaved: false,
      }

      expect(props.tabId).toBe('tab-1')
      expect(props.workflowId).toBe('workflow-1')
      expect(props.tabName).toBe('Workflow Tab')
      expect(props.tabIsUnsaved).toBe(false)
    })

    it('should support null workflowId', () => {
      const props: WorkflowBuilderCoreProps = {
        tabId: 'tab-1',
        workflowId: null,
        tabName: 'New Workflow',
      }

      expect(props.workflowId).toBeNull()
    })

    it('should have optional tabIsUnsaved', () => {
      const props: WorkflowBuilderCoreProps = {
        tabId: 'tab-1',
        workflowId: 'workflow-1',
        tabName: 'Workflow Tab',
      }

      expect(props.tabIsUnsaved).toBeUndefined()
    })
  })

  describe('WorkflowBuilderExecutionProps', () => {
    it('should create valid WorkflowBuilderExecutionProps', () => {
      const onExecutionStart = jest.fn()
      const onExecutionLogUpdate = jest.fn()
      const onExecutionStatusUpdate = jest.fn()
      const onExecutionNodeUpdate = jest.fn()

      const props: WorkflowBuilderExecutionProps = {
        onExecutionStart,
        onExecutionLogUpdate,
        onExecutionStatusUpdate,
        onExecutionNodeUpdate,
      }

      expect(props.onExecutionStart).toBe(onExecutionStart)
      expect(props.onExecutionLogUpdate).toBe(onExecutionLogUpdate)
      expect(props.onExecutionStatusUpdate).toBe(onExecutionStatusUpdate)
      expect(props.onExecutionNodeUpdate).toBe(onExecutionNodeUpdate)
    })

    it('should call onExecutionStart with execution id', () => {
      const onExecutionStart = jest.fn()
      const props: WorkflowBuilderExecutionProps = {
        onExecutionStart,
      }

      props.onExecutionStart?.('exec-1')

      expect(onExecutionStart).toHaveBeenCalledWith('exec-1')
    })

    it('should call onExecutionLogUpdate with correct parameters', () => {
      const onExecutionLogUpdate = jest.fn()
      const props: WorkflowBuilderExecutionProps = {
        onExecutionLogUpdate,
      }
      const log = { timestamp: '2024-01-01', level: 'INFO', message: 'Test' }

      props.onExecutionLogUpdate?.('workflow-1', 'exec-1', log)

      expect(onExecutionLogUpdate).toHaveBeenCalledWith('workflow-1', 'exec-1', log)
    })

    it('should call onExecutionStatusUpdate with correct parameters', () => {
      const onExecutionStatusUpdate = jest.fn()
      const props: WorkflowBuilderExecutionProps = {
        onExecutionStatusUpdate,
      }

      props.onExecutionStatusUpdate?.('workflow-1', 'exec-1', 'completed')

      expect(onExecutionStatusUpdate).toHaveBeenCalledWith('workflow-1', 'exec-1', 'completed')
    })

    it('should call onExecutionNodeUpdate with correct parameters', () => {
      const onExecutionNodeUpdate = jest.fn()
      const props: WorkflowBuilderExecutionProps = {
        onExecutionNodeUpdate,
      }
      const nodeState = { node_id: 'node-1', status: 'running' }

      props.onExecutionNodeUpdate?.('workflow-1', 'exec-1', 'node-1', nodeState)

      expect(onExecutionNodeUpdate).toHaveBeenCalledWith('workflow-1', 'exec-1', 'node-1', nodeState)
    })
  })

  describe('WorkflowBuilderPersistenceProps', () => {
    it('should create valid WorkflowBuilderPersistenceProps', () => {
      const onWorkflowSaved = jest.fn()
      const onWorkflowModified = jest.fn()

      const props: WorkflowBuilderPersistenceProps = {
        onWorkflowSaved,
        onWorkflowModified,
      }

      expect(props.onWorkflowSaved).toBe(onWorkflowSaved)
      expect(props.onWorkflowModified).toBe(onWorkflowModified)
    })

    it('should call onWorkflowSaved with id and name', () => {
      const onWorkflowSaved = jest.fn()
      const props: WorkflowBuilderPersistenceProps = {
        onWorkflowSaved,
      }

      props.onWorkflowSaved?.('workflow-1', 'Workflow Name')

      expect(onWorkflowSaved).toHaveBeenCalledWith('workflow-1', 'Workflow Name')
    })

    it('should call onWorkflowModified', () => {
      const onWorkflowModified = jest.fn()
      const props: WorkflowBuilderPersistenceProps = {
        onWorkflowModified,
      }

      props.onWorkflowModified?.()

      expect(onWorkflowModified).toHaveBeenCalled()
    })
  })

  describe('WorkflowBuilderSelectionProps', () => {
    it('should create valid WorkflowBuilderSelectionProps', () => {
      const onNodeSelected = jest.fn()

      const props: WorkflowBuilderSelectionProps = {
        onNodeSelected,
      }

      expect(props.onNodeSelected).toBe(onNodeSelected)
    })

    it('should call onNodeSelected with node id', () => {
      const onNodeSelected = jest.fn()
      const props: WorkflowBuilderSelectionProps = {
        onNodeSelected,
      }

      props.onNodeSelected?.('node-1')

      expect(onNodeSelected).toHaveBeenCalledWith('node-1')
    })

    it('should call onNodeSelected with null', () => {
      const onNodeSelected = jest.fn()
      const props: WorkflowBuilderSelectionProps = {
        onNodeSelected,
      }

      props.onNodeSelected?.(null)

      expect(onNodeSelected).toHaveBeenCalledWith(null)
    })
  })

  describe('WorkflowBuilderProps', () => {
    it('should combine all prop types', () => {
      const props: WorkflowBuilderProps = {
        tabId: 'tab-1',
        workflowId: 'workflow-1',
        tabName: 'Workflow Tab',
        onExecutionStart: jest.fn(),
        onWorkflowSaved: jest.fn(),
        onNodeSelected: jest.fn(),
      }

      expect(props.tabId).toBe('tab-1')
      expect(props.workflowId).toBe('workflow-1')
      expect(props.tabName).toBe('Workflow Tab')
      expect(props.onExecutionStart).toBeDefined()
      expect(props.onWorkflowSaved).toBeDefined()
      expect(props.onNodeSelected).toBeDefined()
    })

    it('should allow partial execution props', () => {
      const props: WorkflowBuilderProps = {
        tabId: 'tab-1',
        workflowId: 'workflow-1',
        tabName: 'Workflow Tab',
        onExecutionStart: jest.fn(),
        // Other execution props are optional
      }

      expect(props.onExecutionStart).toBeDefined()
      expect(props.onExecutionLogUpdate).toBeUndefined()
    })

    it('should allow partial persistence props', () => {
      const props: WorkflowBuilderProps = {
        tabId: 'tab-1',
        workflowId: 'workflow-1',
        tabName: 'Workflow Tab',
        onWorkflowSaved: jest.fn(),
        // onWorkflowModified is optional
      }

      expect(props.onWorkflowSaved).toBeDefined()
      expect(props.onWorkflowModified).toBeUndefined()
    })

    it('should allow partial selection props', () => {
      const props: WorkflowBuilderProps = {
        tabId: 'tab-1',
        workflowId: 'workflow-1',
        tabName: 'Workflow Tab',
        // onNodeSelected is optional
      }

      expect(props.onNodeSelected).toBeUndefined()
    })
  })
})
