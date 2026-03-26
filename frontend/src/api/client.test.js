jest.mock('../types/adapters', ()=>({
        defaultAdapters: {
            createLocalStorageAdapter: jest.fn(()=>({
                    getItem: jest.fn(()=>null),
                    setItem: jest.fn(),
                    removeItem: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn()
                })),
            createSessionStorageAdapter: jest.fn(()=>({
                    getItem: jest.fn(()=>null),
                    setItem: jest.fn(),
                    removeItem: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn()
                }))
        }
    }));
jest.mock('../utils/logger', ()=>({
        logger: {
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            info: jest.fn()
        }
    }));
import { createApiClient } from './client';
import { logger } from '../utils/logger';
function jsonResponse(data, status = 200, headers) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    });
}
function lastFetch() {
    const mock = global.fetch;
    const call = mock.mock.calls[mock.mock.calls.length - 1];
    return [
        call[0],
        call[1]
    ];
}
function authHeader() {
    const [, init] = lastFetch();
    const h = init?.headers;
    if (h instanceof Headers) return h.get('Authorization');
    return null;
}
describe('createApiClient (fetch)', ()=>{
    let mockLocalStorage;
    let mockSessionStorage;
    beforeEach(()=>{
        jest.clearAllMocks();
        global.fetch = jest.fn();
        mockLocalStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };
        mockSessionStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };
    });
    describe('Workflows', ()=>{
        it('should get all workflows', async ()=>{
            const workflows = [
                {
                    id: '1',
                    name: 'Workflow 1'
                },
                {
                    id: '2',
                    name: 'Workflow 2'
                }
            ];
            global.fetch.mockResolvedValue(jsonResponse(workflows));
            const api = createApiClient();
            const result = await api.getWorkflows();
            expect(global.fetch).toHaveBeenCalled();
            const [url, init] = lastFetch();
            expect(url).toContain('/workflows');
            expect(init?.method === undefined || init?.method === 'GET').toBe(true);
            expect(result).toEqual(workflows);
        });
        it('should get workflow by id', async ()=>{
            const workflow = {
                id: '1',
                name: 'Workflow 1'
            };
            global.fetch.mockResolvedValue(jsonResponse(workflow));
            const api = createApiClient();
            const result = await api.getWorkflow('1');
            const [url] = lastFetch();
            expect(url).toContain('/workflows/1');
            expect(result).toEqual(workflow);
        });
        it('should create workflow', async ()=>{
            const newWorkflow = {
                name: 'New Workflow',
                description: 'Description'
            };
            const createdWorkflow = {
                id: '1',
                ...newWorkflow
            };
            global.fetch.mockResolvedValue(jsonResponse(createdWorkflow));
            const api = createApiClient();
            const result = await api.createWorkflow(newWorkflow);
            const [, init] = lastFetch();
            expect(init?.method).toBe('POST');
            expect(JSON.parse(init?.body || '{}')).toEqual(newWorkflow);
            expect(result).toEqual(createdWorkflow);
        });
        it('should update workflow', async ()=>{
            const updates = {
                name: 'Updated Workflow'
            };
            const updatedWorkflow = {
                id: '1',
                ...updates
            };
            global.fetch.mockResolvedValue(jsonResponse(updatedWorkflow));
            const api = createApiClient();
            const result = await api.updateWorkflow('1', updates);
            const [url, init] = lastFetch();
            void url;
            expect(init?.method).toBe('PUT');
            expect(result).toEqual(updatedWorkflow);
        });
        it('should delete workflow', async ()=>{
            ;
            global.fetch.mockResolvedValue(new Response(null, {
                status: 204
            }));
            const api = createApiClient();
            await api.deleteWorkflow('1');
            const [, init] = lastFetch();
            expect(init?.method).toBe('DELETE');
        });
        it('should bulk delete workflows', async ()=>{
            const response = {
                message: 'Deleted',
                deleted_count: 2
            };
            global.fetch.mockResolvedValue(jsonResponse(response));
            const api = createApiClient();
            const result = await api.bulkDeleteWorkflows([
                '1',
                '2'
            ]);
            const [, init] = lastFetch();
            expect(init?.method).toBe('POST');
            expect(JSON.parse(init?.body || '{}')).toEqual({
                workflow_ids: [
                    '1',
                    '2'
                ]
            });
            expect(result).toEqual(response);
        });
        it('should duplicate workflow', async ()=>{
            const originalWorkflow = {
                id: '1',
                name: 'Original'
            };
            const duplicatedWorkflow = {
                id: '2',
                name: 'Original-copy'
            };
            global.fetch.mockResolvedValueOnce(jsonResponse(originalWorkflow)).mockResolvedValueOnce(jsonResponse(duplicatedWorkflow));
            const api = createApiClient();
            const result = await api.duplicateWorkflow('1');
            expect(result).toEqual(duplicatedWorkflow);
            expect(global.fetch.mock.calls.length).toBeGreaterThanOrEqual(2);
        });
        it('should duplicate workflow without name on source', async ()=>{
            const originalWorkflow = {
                id: '1'
            };
            const duplicatedWorkflow = {
                id: '2',
                name: 'undefined-copy'
            };
            global.fetch.mockResolvedValueOnce(jsonResponse(originalWorkflow)).mockResolvedValueOnce(jsonResponse(duplicatedWorkflow));
            const api = createApiClient();
            const result = await api.duplicateWorkflow('1');
            expect(result).toEqual(duplicatedWorkflow);
            const postInit = global.fetch.mock.calls[1][1];
            expect(JSON.parse(postInit.body || '{}').name).toBe('undefined-copy');
        });
        it('should publish workflow', async ()=>{
            const publishData = {
                category: 'automation',
                tags: [
                    'tag1',
                    'tag2'
                ],
                difficulty: 'medium',
                estimated_time: '30min'
            };
            global.fetch.mockResolvedValue(jsonResponse({
                success: true
            }));
            const api = createApiClient();
            const result = await api.publishWorkflow('1', publishData);
            expect(result).toEqual({
                success: true
            });
            const [url] = lastFetch();
            expect(url).toContain('/publish');
        });
    });
    describe('Templates', ()=>{
        it('should delete template', async ()=>{
            ;
            global.fetch.mockResolvedValue(new Response(null, {
                status: 204
            }));
            const api = createApiClient();
            await api.deleteTemplate('template-1');
            const [url, init] = lastFetch();
            expect(url).toContain('/templates/template-1');
            expect(init?.method).toBe('DELETE');
        });
    });
    describe('Executions', ()=>{
        it('should execute workflow', async ()=>{
            const executionState = {
                id: 'exec-1',
                status: 'running'
            };
            global.fetch.mockResolvedValue(jsonResponse(executionState));
            const api = createApiClient();
            const result = await api.executeWorkflow('workflow-1', {
                input1: 'value1'
            });
            expect(result).toEqual(executionState);
            expect(logger.debug).toHaveBeenCalled();
            const [, init] = lastFetch();
            expect(init?.method).toBe('POST');
        });
        it('should execute workflow with empty inputs', async ()=>{
            const executionState = {
                id: 'exec-1',
                status: 'running'
            };
            global.fetch.mockResolvedValue(jsonResponse(executionState));
            const api = createApiClient();
            const result = await api.executeWorkflow('workflow-1');
            expect(result).toEqual(executionState);
        });
        it('should propagate executeWorkflow errors', async ()=>{
            ;
            global.fetch.mockRejectedValue(new Error('Execution failed'));
            const api = createApiClient();
            await expect(api.executeWorkflow('workflow-1')).rejects.toThrow('Execution failed');
            expect(logger.error).toHaveBeenCalled();
        });
        it('should get execution by id', async ()=>{
            const executionState = {
                id: 'exec-1',
                status: 'completed'
            };
            global.fetch.mockResolvedValue(jsonResponse(executionState));
            const api = createApiClient();
            const result = await api.getExecution('exec-1');
            expect(result).toEqual(executionState);
        });
        it('should list executions', async ()=>{
            const executions = [
                {
                    execution_id: 'exec-1',
                    status: 'completed'
                },
                {
                    execution_id: 'exec-2',
                    status: 'running'
                }
            ];
            global.fetch.mockResolvedValue(jsonResponse(executions));
            const api = createApiClient();
            const result = await api.listExecutions();
            expect(result).toEqual(executions);
        });
        it('should list executions with params', async ()=>{
            const executions = [
                {
                    execution_id: 'exec-1',
                    status: 'completed'
                }
            ];
            global.fetch.mockResolvedValue(jsonResponse(executions));
            const api = createApiClient();
            const result = await api.listExecutions({
                limit: 50,
                status: 'completed'
            });
            const [url] = lastFetch();
            expect(url).toContain('limit=50');
            expect(url).toContain('status=completed');
            expect(result).toEqual(executions);
        });
        it('should get execution logs', async ()=>{
            const logsResponse = {
                execution_id: 'exec-1',
                logs: [
                    {
                        timestamp: '2026-02-23T12:00:00Z',
                        level: 'INFO',
                        message: 'Test log'
                    }
                ],
                total: 1,
                limit: 1000,
                offset: 0
            };
            global.fetch.mockResolvedValue(jsonResponse(logsResponse));
            const api = createApiClient();
            const result = await api.getExecutionLogs('exec-1');
            expect(result).toEqual(logsResponse);
        });
        it('should get execution logs with filters', async ()=>{
            const logsResponse = {
                execution_id: 'exec-1',
                logs: [
                    {
                        timestamp: '2026-02-23T12:00:00Z',
                        level: 'ERROR',
                        node_id: 'node-1',
                        message: 'Error log'
                    }
                ],
                total: 1,
                limit: 1000,
                offset: 0
            };
            global.fetch.mockResolvedValue(jsonResponse(logsResponse));
            const api = createApiClient();
            const result = await api.getExecutionLogs('exec-1', {
                level: 'ERROR',
                node_id: 'node-1'
            });
            const [url] = lastFetch();
            expect(url).toContain('level=ERROR');
            expect(url).toContain('node_id=node-1');
            expect(result).toEqual(logsResponse);
        });
        it('should download execution logs', async ()=>{
            const blob = new Blob([
                'Log content'
            ], {
                type: 'text/plain'
            });
            global.fetch.mockResolvedValue(new Response(blob, {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain'
                }
            }));
            const api = createApiClient();
            const result = await api.downloadExecutionLogs('exec-1', 'text');
            expect(result).toBeInstanceOf(Blob);
        });
        it('should cancel execution', async ()=>{
            const executionState = {
                execution_id: 'exec-1',
                status: 'cancelled'
            };
            global.fetch.mockResolvedValue(jsonResponse(executionState));
            const api = createApiClient();
            const result = await api.cancelExecution('exec-1');
            expect(result).toEqual(executionState);
        });
    });
    describe('Settings', ()=>{
        it('should get LLM settings', async ()=>{
            const settings = {
                providers: [
                    {
                        name: 'OpenAI',
                        api_key: 'key'
                    }
                ]
            };
            global.fetch.mockResolvedValue(jsonResponse(settings));
            const api = createApiClient();
            const result = await api.getLLMSettings();
            const [url] = lastFetch();
            expect(url).toContain('/settings/llm');
            expect(result).toEqual(settings);
        });
        it('should return empty settings on 401 from API', async ()=>{
            ;
            global.fetch.mockResolvedValue(jsonResponse({
                detail: 'Unauthorized'
            }, 401));
            const api = createApiClient();
            const result = await api.getLLMSettings();
            expect(result).toEqual({
                providers: []
            });
        });
        it('should throw on non-401 LLM errors', async ()=>{
            ;
            global.fetch.mockResolvedValue(jsonResponse({
                detail: 'Server error'
            }, 500));
            const api = createApiClient();
            await expect(api.getLLMSettings()).rejects.toThrow();
        });
    });
    describe('Auth headers', ()=>{
        it('adds Bearer token from localStorage when remember_me is true', async ()=>{
            mockLocalStorage.getItem = jest.fn((key)=>{
                if (key === 'auth_remember_me') return 'true';
                if (key === 'auth_token') return 'tok-local';
                return null;
            });
            global.fetch.mockResolvedValue(jsonResponse([]));
            const api = createApiClient({
                localStorage: mockLocalStorage,
                sessionStorage: mockSessionStorage
            });
            await api.getWorkflows();
            expect(authHeader()).toBe('Bearer tok-local');
        });
        it('adds Bearer token from sessionStorage when remember_me is not true', async ()=>{
            mockLocalStorage.getItem = jest.fn((key)=>{
                if (key === 'auth_remember_me') return 'false';
                return null;
            });
            mockSessionStorage.getItem = jest.fn((key)=>{
                if (key === 'auth_token') return 'tok-session';
                return null;
            });
            global.fetch.mockResolvedValue(jsonResponse([]));
            const api = createApiClient({
                localStorage: mockLocalStorage,
                sessionStorage: mockSessionStorage
            });
            await api.getWorkflows();
            expect(authHeader()).toBe('Bearer tok-session');
        });
        it('omits Authorization when token missing', async ()=>{
            ;
            global.fetch.mockResolvedValue(jsonResponse([]));
            const api = createApiClient();
            await api.getWorkflows();
            expect(authHeader()).toBeNull();
        });
    });
    describe('Custom options', ()=>{
        it('should use custom baseURL for requests', async ()=>{
            ;
            global.fetch.mockResolvedValue(jsonResponse([]));
            const api = createApiClient({
                baseURL: 'https://custom.example/v1'
            });
            await api.getWorkflows();
            const [url] = lastFetch();
            expect(url.startsWith('https://custom.example/v1')).toBe(true);
        });
        it('should use custom logger for executeWorkflow', async ()=>{
            const customLogger = {
                debug: jest.fn(),
                error: jest.fn(),
                warn: jest.fn(),
                info: jest.fn()
            };
            global.fetch.mockResolvedValue(jsonResponse({}));
            const api = createApiClient({
                logger: customLogger
            });
            await api.executeWorkflow('workflow-1');
            expect(customLogger.debug).toHaveBeenCalled();
        });
    });
});
