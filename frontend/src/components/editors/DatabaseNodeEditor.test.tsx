// Jest globals - no import needed
import { render, screen, fireEvent } from '@testing-library/react'
import DatabaseNodeEditor from './DatabaseNodeEditor'
import type { NodeWithData } from '../../types/nodeData'

describe('DatabaseNodeEditor', () => {
  const mockOnConfigUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockNode = (overrides: Partial<NodeWithData['data']> = {}): NodeWithData & { type: 'database' } => ({
    id: 'test-db',
    type: 'database',
    position: { x: 0, y: 0 },
    data: {
      name: 'Test Database',
      input_config: {
        database_type: 'postgresql',
        mode: 'read',
        connection_string: '',
        host: 'localhost',
        port: 5432,
        database_name: 'testdb',
        username: 'user',
        password: '',
        query: 'SELECT * FROM users',
        ssl_mode: 'prefer',
        ...overrides,
      },
    },
  } as NodeWithData & { type: 'database' })

  it('should render database configuration fields', () => {
    const node = createMockNode()
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText(/Database Type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Connection Mode/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Connection String/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Host/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Port/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Database Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Query/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/SSL Mode/i)).toBeInTheDocument()
  })

  it('should display default database type of postgresql when missing', () => {
    const node = createMockNode({ database_type: undefined })
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const typeSelect = screen.getByLabelText(/Database Type/i) as HTMLSelectElement
    expect(typeSelect.value).toBe('postgresql')
  })

  it('should display default mode of read when missing', () => {
    const node = createMockNode({ mode: undefined })
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
    expect(modeSelect.value).toBe('read')
  })

  it('should display empty string when connection_string is missing', () => {
    const node = createMockNode({ connection_string: undefined })
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const connectionStringInput = screen.getByLabelText(/Connection String/i) as HTMLInputElement
    expect(connectionStringInput.value).toBe('')
  })

  it('should display empty string when host is missing', () => {
    const node = createMockNode({ host: undefined })
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const hostInput = screen.getByLabelText(/Host/i) as HTMLInputElement
    expect(hostInput.value).toBe('')
  })

  it('should display current database type value', () => {
    const node = createMockNode({ database_type: 'mysql' })
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const typeSelect = screen.getByLabelText(/Database Type/i) as HTMLSelectElement
    expect(typeSelect.value).toBe('mysql')
  })

  it('should call onConfigUpdate when database type changes', () => {
    const node = createMockNode()
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const typeSelect = screen.getByLabelText(/Database Type/i)
    fireEvent.change(typeSelect, { target: { value: 'mysql' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'database_type', 'mysql')
  })

  it('should call onConfigUpdate when mode changes', () => {
    const node = createMockNode()
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText(/Connection Mode/i)
    fireEvent.change(modeSelect, { target: { value: 'write' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'mode', 'write')
  })

  it('should call onConfigUpdate when connection string changes', () => {
    const node = createMockNode()
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const connectionStringInput = screen.getByLabelText(/Connection String/i)
    fireEvent.change(connectionStringInput, { target: { value: 'postgresql://user:pass@host:5432/db' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'connection_string', 'postgresql://user:pass@host:5432/db')
  })

  it('should call onConfigUpdate when host changes', () => {
    const node = createMockNode()
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const hostInput = screen.getByLabelText(/Host/i)
    fireEvent.change(hostInput, { target: { value: 'example.com' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'host', 'example.com')
  })

  it('should call onConfigUpdate when port changes', () => {
    const node = createMockNode()
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const portInput = screen.getByLabelText(/Port/i)
    fireEvent.change(portInput, { target: { value: '3306' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'port', 3306)
  })

  it('should call onConfigUpdate with undefined when port is cleared', () => {
    const node = createMockNode()
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const portInput = screen.getByLabelText(/Port/i)
    fireEvent.change(portInput, { target: { value: '' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'port', undefined)
  })

  it('should call onConfigUpdate when database name changes', () => {
    const node = createMockNode()
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const dbNameInput = screen.getByLabelText(/Database Name/i)
    fireEvent.change(dbNameInput, { target: { value: 'newdb' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'database_name', 'newdb')
  })

  it('should call onConfigUpdate when username changes', () => {
    const node = createMockNode()
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const usernameInput = screen.getByLabelText(/Username/i)
    fireEvent.change(usernameInput, { target: { value: 'newuser' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'username', 'newuser')
  })

  it('should call onConfigUpdate when password changes', () => {
    const node = createMockNode()
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const passwordInput = screen.getByLabelText(/Password/i)
    fireEvent.change(passwordInput, { target: { value: 'secret123' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'password', 'secret123')
  })

  it('should call onConfigUpdate when query changes', () => {
    const node = createMockNode()
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const queryInput = screen.getByLabelText(/Query/i)
    fireEvent.change(queryInput, { target: { value: 'SELECT * FROM products' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'query', 'SELECT * FROM products')
  })

  it('should call onConfigUpdate when SSL mode changes', () => {
    const node = createMockNode()
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const sslModeSelect = screen.getByLabelText(/SSL Mode/i)
    fireEvent.change(sslModeSelect, { target: { value: 'require' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'ssl_mode', 'require')
  })

  it('should display default values when input_config is empty', () => {
    const node = createMockNode({})
    node.data.input_config = {}
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const typeSelect = screen.getByLabelText(/Database Type/i) as HTMLSelectElement
    expect(typeSelect.value).toBe('postgresql')

    const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
    expect(modeSelect.value).toBe('read')

    const sslModeSelect = screen.getByLabelText(/SSL Mode/i) as HTMLSelectElement
    expect(sslModeSelect.value).toBe('prefer')
  })

  it('should display all database type options', () => {
    const node = createMockNode()
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const typeSelect = screen.getByLabelText(/Database Type/i)
    const options = Array.from(typeSelect.querySelectorAll('option')).map(opt => opt.value)
    
    expect(options).toContain('postgresql')
    expect(options).toContain('mysql')
    expect(options).toContain('sqlite')
    expect(options).toContain('mongodb')
    expect(options).toContain('mssql')
    expect(options).toContain('oracle')
  })

  it('should display all SSL mode options', () => {
    const node = createMockNode()
    render(<DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const sslModeSelect = screen.getByLabelText(/SSL Mode/i)
    const options = Array.from(sslModeSelect.querySelectorAll('option')).map(opt => opt.value)
    
    expect(options).toContain('disable')
    expect(options).toContain('allow')
    expect(options).toContain('prefer')
    expect(options).toContain('require')
    expect(options).toContain('verify-ca')
    expect(options).toContain('verify-full')
  })
})
