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

  it('should display default firebase_service of firestore when missing', () => {
    const node = createMockNode({ firebase_service: undefined })
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const serviceSelect = screen.getByLabelText(/Firebase Service/i) as HTMLSelectElement
    expect(serviceSelect.value).toBe('firestore')
  })

  it('should display empty string when project_id is missing', () => {
    const node = createMockNode({ project_id: undefined })
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const projectIdInput = screen.getByLabelText(/Project ID/i) as HTMLInputElement
    expect(projectIdInput.value).toBe('')
  })

  it('should display default mode of read when missing', () => {
    const node = createMockNode({ mode: undefined })
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
    expect(modeSelect.value).toBe('read')
  })

  it('should display empty string when collection_path is missing', () => {
    const node = createMockNode({ 
      firebase_service: 'firestore', 
      mode: 'read', 
      collection_path: undefined,
    })
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const collectionPathInput = screen.getByLabelText(/Collection \/ Path/i) as HTMLInputElement
    expect(collectionPathInput.value).toBe('')
  })

  it('should display empty string when credentials is missing', () => {
    const node = createMockNode({ credentials: undefined })
    render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

    const credentialsInput = screen.getByLabelText(/Service Account Credentials/i) as HTMLTextAreaElement
    expect(credentialsInput.value).toBe('')
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

  describe('mutation killers - conditional branches', () => {
    it('should verify logical OR firebase_service === firestore || firebase_service === realtime_db - first true', () => {
      const node = createMockNode({ firebase_service: 'firestore' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      // When firebase_service === 'firestore', first part of || is true
      // Should show collection path field
      expect(screen.getByLabelText(/Collection \/ Path/i)).toBeInTheDocument()
    })

    it('should verify logical OR firebase_service === firestore || firebase_service === realtime_db - second true', () => {
      const node = createMockNode({ firebase_service: 'realtime_db' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      // When firebase_service === 'realtime_db', first part is false, second is true
      // Should show collection path field
      expect(screen.getByLabelText(/Collection \/ Path/i)).toBeInTheDocument()
    })

    it('should verify logical OR firebase_service === firestore || firebase_service === realtime_db - both false (storage)', () => {
      const node = createMockNode({ firebase_service: 'storage' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      // When firebase_service === 'storage', both parts of || are false
      // Should NOT show collection path field
      expect(screen.queryByLabelText(/Collection \/ Path/i)).not.toBeInTheDocument()
      // Should show storage-specific fields instead
      expect(screen.getByLabelText(/Bucket Name/i)).toBeInTheDocument()
    })

    it('should verify logical OR firebase_service === firestore || firebase_service === realtime_db - both false (auth)', () => {
      const node = createMockNode({ firebase_service: 'auth' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      // When firebase_service === 'auth', both parts of || are false
      // Should NOT show collection path field
      expect(screen.queryByLabelText(/Collection \/ Path/i)).not.toBeInTheDocument()
      // Should NOT show storage fields either
      expect(screen.queryByLabelText(/Bucket Name/i)).not.toBeInTheDocument()
    })

    it('should verify conditional mode === read - mode is read', () => {
      const node = createMockNode({ firebase_service: 'firestore', mode: 'read' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      // When mode === 'read', should show query filter
      expect(screen.getByLabelText(/Query Filter/i)).toBeInTheDocument()
    })

    it('should verify conditional mode === read - mode is write', () => {
      const node = createMockNode({ firebase_service: 'firestore', mode: 'write' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      // When mode === 'write', should NOT show query filter
      expect(screen.queryByLabelText(/Query Filter/i)).not.toBeInTheDocument()
    })

    it('should verify conditional mode === read - mode is undefined', () => {
      const node = createMockNode({ firebase_service: 'firestore', mode: undefined })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      // When mode is undefined, the check is inputConfig.mode === 'read'
      // undefined === 'read' is false, so query filter should NOT show
      // However, the select value defaults to 'read' via inputConfig.mode || 'read'
      const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
      expect(modeSelect.value).toBe('read')
      
      // But the conditional check uses inputConfig.mode === 'read' (not the defaulted value)
      // So query filter should NOT show when mode is undefined
      expect(screen.queryByLabelText(/Query Filter/i)).not.toBeInTheDocument()
    })

    it('should verify conditional firebase_service === storage - service is storage', () => {
      const node = createMockNode({ firebase_service: 'storage' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      // When firebase_service === 'storage', should show storage fields
      expect(screen.getByLabelText(/Bucket Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/File Path/i)).toBeInTheDocument()
    })

    it('should verify conditional firebase_service === storage - service is not storage', () => {
      const node = createMockNode({ firebase_service: 'firestore' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      // When firebase_service !== 'storage', should NOT show storage fields
      expect(screen.queryByLabelText(/Bucket Name/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/File Path/i)).not.toBeInTheDocument()
    })

    it('should verify exact comparison firebase_service === firestore', () => {
      const node = createMockNode({ firebase_service: 'firestore' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const serviceSelect = screen.getByLabelText(/Firebase Service/i) as HTMLSelectElement
      // Verify exact comparison (not ==, not !==)
      expect(serviceSelect.value).toBe('firestore')
      expect(serviceSelect.value).not.toBe('realtime_db')
    })

    it('should verify exact comparison firebase_service === realtime_db', () => {
      const node = createMockNode({ firebase_service: 'realtime_db' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const serviceSelect = screen.getByLabelText(/Firebase Service/i) as HTMLSelectElement
      // Verify exact comparison
      expect(serviceSelect.value).toBe('realtime_db')
      expect(serviceSelect.value).not.toBe('firestore')
    })

    it('should verify exact comparison mode === read', () => {
      const node = createMockNode({ firebase_service: 'firestore', mode: 'read' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
      // Verify exact comparison
      expect(modeSelect.value).toBe('read')
      expect(modeSelect.value).not.toBe('write')
      
      // Should show query filter when mode === 'read'
      expect(screen.getByLabelText(/Query Filter/i)).toBeInTheDocument()
    })

    it('should verify exact comparison mode === write', () => {
      const node = createMockNode({ firebase_service: 'firestore', mode: 'write' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
      // Verify exact comparison
      expect(modeSelect.value).toBe('write')
      expect(modeSelect.value).not.toBe('read')
      
      // Should NOT show query filter when mode === 'write'
      expect(screen.queryByLabelText(/Query Filter/i)).not.toBeInTheDocument()
    })

    it('should verify exact comparison firebase_service === storage', () => {
      const node = createMockNode({ firebase_service: 'storage' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const serviceSelect = screen.getByLabelText(/Firebase Service/i) as HTMLSelectElement
      // Verify exact comparison
      expect(serviceSelect.value).toBe('storage')
      expect(serviceSelect.value).not.toBe('firestore')
      
      // Should show storage fields when firebase_service === 'storage'
      expect(screen.getByLabelText(/Bucket Name/i)).toBeInTheDocument()
    })

    it('should verify logical OR inputConfig.firebase_service || firestore - firebase_service is undefined', () => {
      const node = createMockNode({ firebase_service: undefined })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const serviceSelect = screen.getByLabelText(/Firebase Service/i) as HTMLSelectElement
      // When firebase_service is undefined, || operator should use 'firestore'
      expect(serviceSelect.value).toBe('firestore')
    })

    it('should verify logical OR inputConfig.firebase_service || firestore - firebase_service is null', () => {
      const node = createMockNode({ firebase_service: null as any })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const serviceSelect = screen.getByLabelText(/Firebase Service/i) as HTMLSelectElement
      // When firebase_service is null, || operator should use 'firestore'
      expect(serviceSelect.value).toBe('firestore')
    })

    it('should verify logical OR inputConfig.firebase_service || firestore - firebase_service has value', () => {
      const node = createMockNode({ firebase_service: 'storage' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const serviceSelect = screen.getByLabelText(/Firebase Service/i) as HTMLSelectElement
      // When firebase_service has value, || operator should use that value
      expect(serviceSelect.value).toBe('storage')
    })

    it('should verify logical OR inputConfig.mode || read - mode is undefined', () => {
      const node = createMockNode({ firebase_service: 'firestore', mode: undefined })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
      // When mode is undefined, || operator should use 'read'
      expect(modeSelect.value).toBe('read')
    })

    it('should verify logical OR inputConfig.mode || read - mode has value', () => {
      const node = createMockNode({ firebase_service: 'firestore', mode: 'write' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const modeSelect = screen.getByLabelText(/Connection Mode/i) as HTMLSelectElement
      // When mode has value, || operator should use that value
      expect(modeSelect.value).toBe('write')
    })

    it('should verify logical OR inputConfig.project_id || "" - project_id is undefined', () => {
      const node = createMockNode({ project_id: undefined })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const projectIdInput = screen.getByLabelText(/Project ID/i) as HTMLInputElement
      // When project_id is undefined, || operator should use ''
      expect(projectIdInput.value).toBe('')
    })

    it('should verify logical OR inputConfig.project_id || "" - project_id has value', () => {
      const node = createMockNode({ project_id: 'my-project' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const projectIdInput = screen.getByLabelText(/Project ID/i) as HTMLInputElement
      // When project_id has value, || operator should use that value
      expect(projectIdInput.value).toBe('my-project')
    })

    it('should verify logical OR inputConfig.collection_path || "" - collection_path is undefined', () => {
      const node = createMockNode({ firebase_service: 'firestore', collection_path: undefined })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const collectionInput = screen.getByLabelText(/Collection \/ Path/i) as HTMLInputElement
      // When collection_path is undefined, || operator should use ''
      expect(collectionInput.value).toBe('')
    })

    it('should verify logical OR inputConfig.collection_path || "" - collection_path has value', () => {
      const node = createMockNode({ firebase_service: 'firestore', collection_path: 'users' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      const collectionInput = screen.getByLabelText(/Collection \/ Path/i) as HTMLInputElement
      // When collection_path has value, || operator should use that value
      expect(collectionInput.value).toBe('users')
    })

    it('should verify query filter shown for realtime_db with read mode', () => {
      const node = createMockNode({ firebase_service: 'realtime_db', mode: 'read' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      // Should show query filter when service is realtime_db and mode is read
      expect(screen.getByLabelText(/Query Filter/i)).toBeInTheDocument()
    })

    it('should verify query filter NOT shown for realtime_db with write mode', () => {
      const node = createMockNode({ firebase_service: 'realtime_db', mode: 'write' })
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      // Should NOT show query filter when mode is write
      expect(screen.queryByLabelText(/Query Filter/i)).not.toBeInTheDocument()
    })

    it('should verify input_config fallback when input_config is undefined', () => {
      const node = createMockNode({})
      node.data.input_config = undefined as any
      render(<FirebaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />)

      // Should use {} fallback when input_config is undefined
      const serviceSelect = screen.getByLabelText(/Firebase Service/i) as HTMLSelectElement
      expect(serviceSelect.value).toBe('firestore')
    })
  })
})
