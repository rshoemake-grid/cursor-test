// Jest globals - no import needed
import { render, screen, fireEvent } from '@testing-library/react'
import FirebaseNodeEditor from './FirebaseNodeEditor'
import type { NodeWithData } from '../../types/nodeData'

describe('FirebaseNodeEditor', () => {
  const mockOnConfigUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockNode = (overrides: Partial<NodeWithData['data']> = {}): NodeWithData & { type: 'firebase' } => ({
    id: 'test-firebase',
    type: 'firebase',
    position: { x: 0, y: 0 },
    data: {
      name: 'Test Firebase',
      input_config: {
        firebase_service: 'firestore',
        project_id: 'test-project',
        mode: 'read',
        collection_path: 'users',
        query_filter: '',
        bucket_name: '',
        file_path: '',
        credentials: '',
        ...overrides,
      },
    },
  } as NodeWithData & { type: 'firebase' })

  it('should render Firebase configuration fields', () => {
    const node = createMockNode()
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText(/Firebase Service/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Project ID/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Connection Mode/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Service Account Credentials/i)).toBeInTheDocument()
  })

  it('should display current Firebase service value', () => {
    const node = createMockNode({ firebase_service: 'storage' })
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const serviceSelect = screen.getByLabelText(/Firebase Service/i) as HTMLSelectElement
    expect(serviceSelect.value).toBe('storage')
  })

  it('should call onConfigUpdate when Firebase service changes', () => {
    const node = createMockNode()
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const serviceSelect = screen.getByLabelText(/Firebase Service/i)
    fireEvent.change(serviceSelect, { target: { value: 'storage' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'firebase_service', 'storage')
  })

  it('should call onConfigUpdate when project ID changes', () => {
    const node = createMockNode()
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const projectIdInput = screen.getByLabelText(/Project ID/i)
    fireEvent.change(projectIdInput, { target: { value: 'new-project' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'project_id', 'new-project')
  })

  it('should call onConfigUpdate when mode changes', () => {
    const node = createMockNode()
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText(/Connection Mode/i)
    fireEvent.change(modeSelect, { target: { value: 'write' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'mode', 'write')
  })

  it('should display collection path field for Firestore service', () => {
    const node = createMockNode({ firebase_service: 'firestore' })
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText(/Collection \/ Path/i)).toBeInTheDocument()
  })

  it('should display collection path field for Realtime Database service', () => {
    const node = createMockNode({ firebase_service: 'realtime_db' })
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText(/Collection \/ Path/i)).toBeInTheDocument()
  })

  it('should call onConfigUpdate when collection path changes', () => {
    const node = createMockNode({ firebase_service: 'firestore' })
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const collectionInput = screen.getByLabelText(/Collection \/ Path/i)
    fireEvent.change(collectionInput, { target: { value: 'posts' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'collection_path', 'posts')
  })

  it('should display query filter field when mode is read and service is Firestore', () => {
    const node = createMockNode({ firebase_service: 'firestore', mode: 'read' })
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText(/Query Filter/i)).toBeInTheDocument()
  })

  it('should not display query filter field when mode is write', () => {
    const node = createMockNode({ firebase_service: 'firestore', mode: 'write' })
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.queryByLabelText(/Query Filter/i)).not.toBeInTheDocument()
  })

  it('should call onConfigUpdate when query filter changes', () => {
    const node = createMockNode({ firebase_service: 'firestore', mode: 'read' })
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const queryFilterInput = screen.getByLabelText(/Query Filter/i)
    fireEvent.change(queryFilterInput, { target: { value: '{"field": "value"}' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'query_filter', '{"field": "value"}')
  })

  it('should display bucket name and file path fields for Storage service', () => {
    const node = createMockNode({ firebase_service: 'storage' })
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    expect(screen.getByLabelText(/Bucket Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/File Path/i)).toBeInTheDocument()
  })

  it('should call onConfigUpdate when bucket name changes', () => {
    const node = createMockNode({ firebase_service: 'storage' })
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const bucketInput = screen.getByLabelText(/Bucket Name/i)
    fireEvent.change(bucketInput, { target: { value: 'my-bucket.appspot.com' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'bucket_name', 'my-bucket.appspot.com')
  })

  it('should call onConfigUpdate when file path changes', () => {
    const node = createMockNode({ firebase_service: 'storage' })
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const filePathInput = screen.getByLabelText(/File Path/i)
    fireEvent.change(filePathInput, { target: { value: 'images/photo.jpg' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'file_path', 'images/photo.jpg')
  })

  it('should call onConfigUpdate when credentials change', () => {
    const node = createMockNode()
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const credentialsInput = screen.getByLabelText(/Service Account Credentials/i)
    fireEvent.change(credentialsInput, { target: { value: '{"type": "service_account"}' } })

    expect(mockOnConfigUpdate).toHaveBeenCalledWith('input_config', 'credentials', '{"type": "service_account"}')
  })

  it('should display default values when input_config is empty', () => {
    const node = createMockNode({})
    node.data.input_config = {}
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const serviceSelect = screen.getByLabelText(/Firebase Service/i) as HTMLSelectElement
    expect(serviceSelect.value).toBe('firestore')

    const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
    expect(modeSelect.value).toBe('read')
  })

  it('should display all Firebase service options', () => {
    const node = createMockNode()
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const serviceSelect = screen.getByLabelText(/Firebase Service/i)
    const options = Array.from(serviceSelect.querySelectorAll('option')).map(opt => opt.value)
    
    expect(options).toContain('firestore')
    expect(options).toContain('realtime_db')
    expect(options).toContain('storage')
    expect(options).toContain('auth')
  })
})
