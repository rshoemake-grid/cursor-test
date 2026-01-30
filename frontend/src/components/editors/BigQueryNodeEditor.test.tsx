// Jest globals - no import needed
import { render, screen, fireEvent } from '@testing-library/react'
import BigQueryNodeEditor from './BigQueryNodeEditor'
import type { NodeWithData } from '../../types/nodeData'

describe('BigQueryNodeEditor', () => {
  const mockOnConfigUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockNode = (overrides: Partial<NodeWithData['data']> = {}): NodeWithData & { type: 'bigquery' } => ({
    id: 'test-bigquery',
    type: 'bigquery',
    position: { x: 0, y: 0 },
    data: {
      name: 'Test BigQuery',
      input_config: {
        project_id: 'test-project',
        mode: 'read',
        dataset: 'test_dataset',
        query: 'SELECT * FROM table',
        table: '',
        write_disposition: 'append',
        location: '',
        credentials: '',
        ...overrides,
      },
    },
  } as NodeWithData & { type: 'bigquery' })

  it('should render BigQuery configuration fields', () => {
    const node = createMockNode()
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText(/Project ID/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Connection Mode/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Dataset/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Service Account Credentials/i)).toBeInTheDocument()
  })

  it('should display current project ID value', () => {
    const node = createMockNode({ project_id: 'my-project' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const projectIdInput = screen.getByLabelText(/Project ID/i) as HTMLInputElement
    expect(projectIdInput.value).toBe('my-project')
  })

  it('should call onConfigUpdate when project ID changes', () => {
    const node = createMockNode()
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const projectIdInput = screen.getByLabelText(/Project ID/i)
    fireEvent.change(projectIdInput, { target: { value: 'new-project' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'project_id', 'new-project')
  })

  it('should call onConfigUpdate when mode changes', () => {
    const node = createMockNode()
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText(/Connection Mode/i)
    fireEvent.change(modeSelect, { target: { value: 'write' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'mode', 'write')
  })

  it('should call onConfigUpdate when dataset changes', () => {
    const node = createMockNode()
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const datasetInput = screen.getByLabelText(/Dataset/i)
    fireEvent.change(datasetInput, { target: { value: 'new_dataset' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'dataset', 'new_dataset')
  })

  it('should display SQL query field when mode is read', () => {
    const node = createMockNode({ mode: 'read' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText(/SQL Query/i)).toBeInTheDocument()
  })

  it('should not display SQL query field when mode is write', () => {
    const node = createMockNode({ mode: 'write' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.queryByLabelText(/SQL Query/i)).not.toBeInTheDocument()
  })

  it('should display empty string when project_id is missing', () => {
    const node = createMockNode({ project_id: undefined })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const projectIdInput = screen.getByLabelText(/Project ID/i) as HTMLInputElement
    expect(projectIdInput.value).toBe('')
  })

  it('should display default mode value of read when mode is missing', () => {
    const node = createMockNode({ mode: undefined })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
    expect(modeSelect.value).toBe('read')
  })

  it('should call onConfigUpdate when query changes', () => {
    const node = createMockNode({ mode: 'read' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const queryInput = screen.getByLabelText(/SQL Query/i)
    fireEvent.change(queryInput, { target: { value: 'SELECT * FROM new_table' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'query', 'SELECT * FROM new_table')
  })

  it('should display table and write disposition fields when mode is write', () => {
    const node = createMockNode({ mode: 'write' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText(/Table/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Write Disposition/i)).toBeInTheDocument()
  })

  it('should not display table and write disposition fields when mode is read', () => {
    const node = createMockNode({ mode: 'read' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.queryByLabelText(/Table/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Write Disposition/i)).not.toBeInTheDocument()
  })

  it('should call onConfigUpdate when table changes', () => {
    const node = createMockNode({ mode: 'write' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const tableInput = screen.getByLabelText(/Table/i)
    fireEvent.change(tableInput, { target: { value: 'my_table' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'table', 'my_table')
  })

  it('should call onConfigUpdate when write disposition changes', () => {
    const node = createMockNode({ mode: 'write' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const writeDispositionSelect = screen.getByLabelText(/Write Disposition/i)
    fireEvent.change(writeDispositionSelect, { target: { value: 'truncate' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'write_disposition', 'truncate')
  })

  it('should call onConfigUpdate when location changes', () => {
    const node = createMockNode()
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const locationInput = screen.getByLabelText(/Location/i)
    fireEvent.change(locationInput, { target: { value: 'EU' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'location', 'EU')
  })

  it('should call onConfigUpdate when credentials change', () => {
    const node = createMockNode()
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const credentialsInput = screen.getByLabelText(/Service Account Credentials/i)
    fireEvent.change(credentialsInput, { target: { value: '{"type": "service_account"}' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'credentials', '{"type": "service_account"}')
  })

  it('should display default values when input_config is empty', () => {
    const node = createMockNode({})
    node.data.input_config = {}
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
    expect(modeSelect.value).toBe('read')

    // Write disposition is only shown when mode is 'write'
    expect(screen.queryByLabelText(/Write Disposition/i)).not.toBeInTheDocument()
  })

  it('should display all write disposition options', () => {
    const node = createMockNode({ mode: 'write' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const writeDispositionSelect = screen.getByLabelText(/Write Disposition/i)
    const options = Array.from(writeDispositionSelect.querySelectorAll('option')).map(opt => opt.value)
    
    expect(options).toContain('append')
    expect(options).toContain('truncate')
    expect(options).toContain('merge')
  })

  it('should handle null input_config', () => {
    const node = createMockNode({})
    node.data.input_config = null as any
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
    expect(modeSelect.value).toBe('read')
  })

  it('should handle undefined input_config', () => {
    const node = createMockNode({})
    node.data.input_config = undefined as any
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
    expect(modeSelect.value).toBe('read')
  })

  it('should handle empty string project_id', () => {
    const node = createMockNode({ project_id: '' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const projectIdInput = screen.getByLabelText(/Project ID/i) as HTMLInputElement
    expect(projectIdInput.value).toBe('')
  })

  it('should handle zero project_id', () => {
    const node = createMockNode({ project_id: 0 as any })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const projectIdInput = screen.getByLabelText(/Project ID/i) as HTMLInputElement
    expect(projectIdInput.value).toBe('')
  })

  it('should handle false mode value', () => {
    const node = createMockNode({ mode: false as any })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
    expect(modeSelect.value).toBe('read')
  })

  it('should handle empty string mode', () => {
    const node = createMockNode({ mode: '' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
    expect(modeSelect.value).toBe('read')
  })

  it('should handle empty string dataset', () => {
    const node = createMockNode({ dataset: '' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const datasetInput = screen.getByLabelText(/Dataset/i) as HTMLInputElement
    expect(datasetInput.value).toBe('')
  })

  it('should handle null dataset', () => {
    const node = createMockNode({ dataset: null as any })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const datasetInput = screen.getByLabelText(/Dataset/i) as HTMLInputElement
    expect(datasetInput.value).toBe('')
  })

  it('should handle empty string query in read mode', () => {
    const node = createMockNode({ mode: 'read', query: '' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const queryInput = screen.getByLabelText(/SQL Query/i) as HTMLTextAreaElement
    expect(queryInput.value).toBe('')
  })

  it('should handle null query in read mode', () => {
    const node = createMockNode({ mode: 'read', query: null as any })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const queryInput = screen.getByLabelText(/SQL Query/i) as HTMLTextAreaElement
    expect(queryInput.value).toBe('')
  })

  it('should handle empty string table in write mode', () => {
    const node = createMockNode({ mode: 'write', table: '' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const tableInput = screen.getByLabelText(/Table/i) as HTMLInputElement
    expect(tableInput.value).toBe('')
  })

  it('should handle null table in write mode', () => {
    const node = createMockNode({ mode: 'write', table: null as any })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const tableInput = screen.getByLabelText(/Table/i) as HTMLInputElement
    expect(tableInput.value).toBe('')
  })

  it('should handle empty string write_disposition', () => {
    const node = createMockNode({ mode: 'write', write_disposition: '' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const writeDispositionSelect = screen.getByLabelText(/Write Disposition/i) as HTMLSelectElement
    expect(writeDispositionSelect.value).toBe('append')
  })

  it('should handle null write_disposition', () => {
    const node = createMockNode({ mode: 'write', write_disposition: null as any })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const writeDispositionSelect = screen.getByLabelText(/Write Disposition/i) as HTMLSelectElement
    expect(writeDispositionSelect.value).toBe('append')
  })

  it('should handle empty string location', () => {
    const node = createMockNode({ location: '' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const locationInput = screen.getByLabelText(/Location/i) as HTMLInputElement
    expect(locationInput.value).toBe('')
  })

  it('should handle null location', () => {
    const node = createMockNode({ location: null as any })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const locationInput = screen.getByLabelText(/Location/i) as HTMLInputElement
    expect(locationInput.value).toBe('')
  })

  it('should handle empty string credentials', () => {
    const node = createMockNode({ credentials: '' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const credentialsInput = screen.getByLabelText(/Service Account Credentials/i) as HTMLTextAreaElement
    expect(credentialsInput.value).toBe('')
  })

  it('should handle null credentials', () => {
    const node = createMockNode({ credentials: null as any })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const credentialsInput = screen.getByLabelText(/Service Account Credentials/i) as HTMLTextAreaElement
    expect(credentialsInput.value).toBe('')
  })

  it('should verify read mode condition is checked correctly', () => {
    const node = createMockNode({ mode: 'read' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText(/SQL Query/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Table/i)).not.toBeInTheDocument()
  })

  it('should verify write mode condition is checked correctly', () => {
    const node = createMockNode({ mode: 'write' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.queryByLabelText(/SQL Query/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Table/i)).toBeInTheDocument()
  })

  it('should handle mode that is neither read nor write', () => {
    const node = createMockNode({ mode: 'other' as any })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.queryByLabelText(/SQL Query/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Table/i)).not.toBeInTheDocument()
  })

  it('should verify query fallback to empty string when query is falsy', () => {
    const node = createMockNode({ mode: 'read', query: null as any })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const queryInput = screen.getByLabelText(/SQL Query/i) as HTMLTextAreaElement
    // Verify exact fallback value is empty string (not mutated string)
    expect(queryInput.value).toBe('')
    expect(queryInput.value).not.toBe('Stryker was here!')
  })

  it('should verify write_disposition fallback to append when write_disposition is falsy', () => {
    const node = createMockNode({ mode: 'write', write_disposition: null as any })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const writeDispositionSelect = screen.getByLabelText(/Write Disposition/i) as HTMLSelectElement
    // Verify exact fallback value is 'append' (not empty string)
    expect(writeDispositionSelect.value).toBe('append')
    expect(writeDispositionSelect.value).not.toBe('')
  })

  it('should verify write_disposition fallback to append when write_disposition is undefined', () => {
    const node = createMockNode({ mode: 'write', write_disposition: undefined })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const writeDispositionSelect = screen.getByLabelText(/Write Disposition/i) as HTMLSelectElement
    expect(writeDispositionSelect.value).toBe('append')
  })

  it('should verify write_disposition fallback to append when write_disposition is empty string', () => {
    const node = createMockNode({ mode: 'write', write_disposition: '' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const writeDispositionSelect = screen.getByLabelText(/Write Disposition/i) as HTMLSelectElement
    expect(writeDispositionSelect.value).toBe('append')
  })

  it('should verify query fallback to empty string when query is undefined', () => {
    const node = createMockNode({ mode: 'read', query: undefined })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const queryInput = screen.getByLabelText(/SQL Query/i) as HTMLTextAreaElement
    expect(queryInput.value).toBe('')
  })

  it('should verify query fallback to empty string when query is empty string', () => {
    const node = createMockNode({ mode: 'read', query: '' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const queryInput = screen.getByLabelText(/SQL Query/i) as HTMLTextAreaElement
    expect(queryInput.value).toBe('')
  })

  it('should verify input_config fallback to empty object when input_config is falsy', () => {
    const node = createMockNode({})
    node.data.input_config = null as any
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    // Should not crash and should use empty object fallback
    expect(screen.getByLabelText(/Project ID/i)).toBeInTheDocument()
  })

  it('should verify all logical OR operators use correct fallback values', () => {
    const node = createMockNode({
      project_id: undefined,
      mode: undefined,
      dataset: undefined,
      query: undefined,
      table: undefined,
      write_disposition: undefined,
      location: undefined,
      credentials: undefined,
    })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    // Verify all fallbacks
    expect((screen.getByLabelText(/Project ID/i) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement).value).toBe('read')
    expect((screen.getByLabelText(/Dataset/i) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/Location/i) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/Service Account Credentials/i) as HTMLTextAreaElement).value).toBe('')
  })

  it('should verify input_config fallback to empty object uses correct fallback', () => {
    const node = createMockNode({})
    node.data.input_config = null as any
    const { container } = render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    // Verify component renders (inputConfig || {} ensures empty object)
    expect(container.querySelector('h4')).toHaveTextContent('BigQuery Configuration')
  })

  it('should verify mode fallback to read uses exact string', () => {
    const node = createMockNode({ mode: undefined })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
    // Verify exact fallback value is 'read' (not mutated)
    expect(modeSelect.value).toBe('read')
    expect(modeSelect.value).not.toBe('write')
    expect(modeSelect.value).not.toBe('')
  })

  it('should verify write_disposition fallback uses exact append string', () => {
    const node = createMockNode({ mode: 'write', write_disposition: undefined })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const writeDispositionSelect = screen.getByLabelText(/Write Disposition/i) as HTMLSelectElement
    // Verify exact fallback value is 'append' (not empty string or other value)
    expect(writeDispositionSelect.value).toBe('append')
    expect(writeDispositionSelect.value).not.toBe('')
    expect(writeDispositionSelect.value).not.toBe('truncate')
  })

  it('should verify query fallback uses exact empty string', () => {
    const node = createMockNode({ mode: 'read', query: undefined })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const queryInput = screen.getByLabelText(/SQL Query/i) as HTMLTextAreaElement
    // Verify exact fallback value is empty string (not mutated string)
    expect(queryInput.value).toBe('')
    expect(queryInput.value.length).toBe(0)
  })

  it('should verify project_id fallback uses exact empty string', () => {
    const node = createMockNode({ project_id: undefined })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const projectIdInput = screen.getByLabelText(/Project ID/i) as HTMLInputElement
    expect(projectIdInput.value).toBe('')
    expect(projectIdInput.value.length).toBe(0)
  })

  it('should verify dataset fallback uses exact empty string', () => {
    const node = createMockNode({ dataset: undefined })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const datasetInput = screen.getByLabelText(/Dataset/i) as HTMLInputElement
    expect(datasetInput.value).toBe('')
    expect(datasetInput.value.length).toBe(0)
  })

  it('should verify table fallback uses exact empty string', () => {
    const node = createMockNode({ mode: 'write', table: undefined })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const tableInput = screen.getByLabelText(/Table/i) as HTMLInputElement
    expect(tableInput.value).toBe('')
    expect(tableInput.value.length).toBe(0)
  })

  it('should verify location fallback uses exact empty string', () => {
    const node = createMockNode({ location: undefined })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const locationInput = screen.getByLabelText(/Location/i) as HTMLInputElement
    expect(locationInput.value).toBe('')
    expect(locationInput.value.length).toBe(0)
  })

  it('should verify credentials fallback uses exact empty string', () => {
    const node = createMockNode({ credentials: undefined })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const credentialsInput = screen.getByLabelText(/Service Account Credentials/i) as HTMLTextAreaElement
    expect(credentialsInput.value).toBe('')
    expect(credentialsInput.value.length).toBe(0)
  })

  it('should verify mode === read condition is checked correctly', () => {
    const node = createMockNode({ mode: 'read' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    // Verify read mode shows query field
    expect(screen.getByLabelText(/SQL Query/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Table/i)).not.toBeInTheDocument()
  })

  it('should verify mode === write condition is checked correctly', () => {
    const node = createMockNode({ mode: 'write' })
    render(<BigQueryNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    // Verify write mode shows table and write_disposition fields
    expect(screen.getByLabelText(/Table/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Write Disposition/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/SQL Query/i)).not.toBeInTheDocument()
  })
})
