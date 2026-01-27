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
})
