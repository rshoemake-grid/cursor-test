import {
  API_CONFIG,
  STORAGE_KEYS,
  DEFAULT_VALUES,
  UI_CONSTANTS,
  NODE_TYPES,
  buildStorageKey,
  getChatHistoryKey,
} from './constants'

describe('constants', () => {
  describe('API_CONFIG', () => {
    it('should have BASE_URL', () => {
      expect(API_CONFIG.BASE_URL).toBeDefined()
      expect(typeof API_CONFIG.BASE_URL).toBe('string')
    })

    it('should have ENDPOINTS object', () => {
      expect(API_CONFIG.ENDPOINTS).toBeDefined()
      expect(API_CONFIG.ENDPOINTS.WORKFLOWS).toBe('/workflows')
      expect(API_CONFIG.ENDPOINTS.EXECUTIONS).toBe('/executions')
      expect(API_CONFIG.ENDPOINTS.CHAT).toBe('/workflow-chat/chat')
    })

    it('should have AUTH endpoints', () => {
      expect(API_CONFIG.ENDPOINTS.AUTH).toBeDefined()
      expect(API_CONFIG.ENDPOINTS.AUTH.LOGIN).toBe('/auth/login')
      expect(API_CONFIG.ENDPOINTS.AUTH.REGISTER).toBe('/auth/register')
      expect(API_CONFIG.ENDPOINTS.AUTH.LOGOUT).toBe('/auth/logout')
      expect(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD).toBe('/auth/forgot-password')
      expect(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD).toBe('/auth/reset-password')
    })

    it('should have LLM endpoints', () => {
      expect(API_CONFIG.ENDPOINTS.LLM).toBeDefined()
      expect(API_CONFIG.ENDPOINTS.LLM.TEST).toBe('/settings/llm/test')
    })
  })

  describe('STORAGE_KEYS', () => {
    it('should have all storage keys defined', () => {
      expect(STORAGE_KEYS.WORKFLOW_TABS).toBe('workflowTabs')
      expect(STORAGE_KEYS.ACTIVE_TAB).toBe('activeWorkflowTabId')
      expect(STORAGE_KEYS.CHAT_HISTORY_PREFIX).toBe('chat_history_')
      expect(STORAGE_KEYS.OFFICIAL_AGENTS_SEEDED).toBe('officialAgentsSeeded')
      expect(STORAGE_KEYS.LLM_SETTINGS).toBe('llm_settings')
      expect(STORAGE_KEYS.WORKFLOW_DRAFTS).toBe('workflowDrafts')
      expect(STORAGE_KEYS.AUTH_TOKEN).toBe('auth_token')
      expect(STORAGE_KEYS.SESSION_TOKEN).toBe('session_token')
    })
  })

  describe('DEFAULT_VALUES', () => {
    it('should have all default values defined', () => {
      expect(DEFAULT_VALUES.AWS_REGION).toBe('us-east-1')
      expect(DEFAULT_VALUES.DEFAULT_MODEL).toBe('gpt-4o-mini')
      expect(DEFAULT_VALUES.NOTIFICATION_DURATION).toBe(5000)
      expect(DEFAULT_VALUES.WORKFLOW_NAME).toBe('Untitled Workflow')
      expect(DEFAULT_VALUES.MAX_TOKENS).toBe(2000)
      expect(DEFAULT_VALUES.TEMPERATURE).toBe(0.7)
    })
  })

  describe('UI_CONSTANTS', () => {
    it('should have notification position constants', () => {
      expect(UI_CONSTANTS.NOTIFICATION_POSITION.TOP).toBe(20)
      expect(UI_CONSTANTS.NOTIFICATION_POSITION.RIGHT).toBe(20)
    })

    it('should have animation duration constants', () => {
      expect(UI_CONSTANTS.ANIMATION_DURATION.SLIDE_IN).toBe(300)
      expect(UI_CONSTANTS.ANIMATION_DURATION.FADE_OUT).toBe(300)
    })

    it('should have console height constants', () => {
      expect(UI_CONSTANTS.CONSOLE_HEIGHT.MIN).toBe(200)
      expect(UI_CONSTANTS.CONSOLE_HEIGHT.MAX).toBe(600)
      expect(UI_CONSTANTS.CONSOLE_HEIGHT.DEFAULT).toBe(300)
    })
  })

  describe('NODE_TYPES', () => {
    it('should have basic node types', () => {
      expect(NODE_TYPES.START).toBe('start')
      expect(NODE_TYPES.END).toBe('end')
      expect(NODE_TYPES.AGENT).toBe('agent')
      expect(NODE_TYPES.CONDITION).toBe('condition')
      expect(NODE_TYPES.LOOP).toBe('loop')
    })

    it('should have input node types', () => {
      expect(NODE_TYPES.INPUT.GCP_BUCKET).toBe('gcp_bucket')
      expect(NODE_TYPES.INPUT.AWS_S3).toBe('aws_s3')
      expect(NODE_TYPES.INPUT.GCP_PUBSUB).toBe('gcp_pubsub')
      expect(NODE_TYPES.INPUT.LOCAL_FILESYSTEM).toBe('local_filesystem')
      expect(NODE_TYPES.INPUT.DATABASE).toBe('database')
      expect(NODE_TYPES.INPUT.FIREBASE).toBe('firebase')
      expect(NODE_TYPES.INPUT.BIGQUERY).toBe('bigquery')
    })
  })

  describe('buildStorageKey', () => {
    it('should build storage key with prefix and suffix', () => {
      expect(buildStorageKey('prefix_', 'suffix')).toBe('prefix_suffix')
    })

    it('should return prefix only when suffix is not provided', () => {
      expect(buildStorageKey('prefix')).toBe('prefix')
    })

    it('should handle empty suffix', () => {
      expect(buildStorageKey('prefix_', '')).toBe('prefix_')
    })
  })

  describe('getChatHistoryKey', () => {
    it('should return key with workflow ID when workflowId is provided', () => {
      expect(getChatHistoryKey('workflow-123')).toBe('chat_history_workflow-123')
    })

    it('should return key for new workflow when workflowId is null', () => {
      expect(getChatHistoryKey(null)).toBe('chat_history_new_workflow')
    })
  })
})
