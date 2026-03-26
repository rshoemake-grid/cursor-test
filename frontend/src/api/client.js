/**
 * API client using fetch (no axios).
 */ import { defaultAdapters } from '../types/adapters';
import { logger } from '../utils/logger';
import { API_CONFIG, STORAGE_KEYS } from '../config/constants';
import { extractData } from './responseHandlers';
import { workflowEndpoints, templateEndpoints, executionEndpoints, marketplaceEndpoints, settingsEndpoints, chatEndpoints } from './endpoints';
function mergeAuthHeaders(headers, local, session) {
    if (!local || !session) return;
    const rememberMe = local.getItem(STORAGE_KEYS.AUTH_REMEMBER_ME) === 'true';
    const storage = rememberMe ? local : session;
    const token = storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) headers.set('Authorization', `Bearer ${token}`);
}
function clearAuth(local, session) {
    if (!local || !session) return;
    local.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    local.removeItem(STORAGE_KEYS.AUTH_USER);
    local.removeItem(STORAGE_KEYS.AUTH_REMEMBER_ME);
    session.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    session.removeItem(STORAGE_KEYS.AUTH_USER);
}
function createTransport(baseURL, opts) {
    const local = opts?.localStorage ?? defaultAdapters.createLocalStorageAdapter();
    const session = opts?.sessionStorage ?? defaultAdapters.createSessionStorageAdapter();
    async function request(path, init = {}) {
        let url = `${baseURL.replace(/\/$/, '')}${path}`;
        if (init.params) {
            const q = new URLSearchParams();
            for (const [k, v] of Object.entries(init.params)){
                if (v !== undefined && v !== null) q.set(k, String(v));
            }
            const qs = q.toString();
            if (qs) url += `?${qs}`;
        }
        const { params, ...fetchInit } = init;
        void params;
        const headers = new Headers(fetchInit.headers);
        mergeAuthHeaders(headers, local, session);
        const res = await fetch(url, {
            ...fetchInit,
            headers
        });
        if (res.status === 401) {
            clearAuth(local, session);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
        }
        return res;
    }
    return {
        async get (path, options) {
            return request(path, {
                method: 'GET',
                params: options?.params
            });
        },
        async post (path, body) {
            const headers = new Headers({
                'Content-Type': 'application/json'
            });
            mergeAuthHeaders(headers, local, session);
            const url = `${baseURL.replace(/\/$/, '')}${path}`;
            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body ?? {})
            });
            if (res.status === 401) {
                clearAuth(local, session);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
                }
            }
            return res;
        },
        async put (path, body) {
            const headers = new Headers({
                'Content-Type': 'application/json'
            });
            mergeAuthHeaders(headers, local, session);
            const url = `${baseURL.replace(/\/$/, '')}${path}`;
            const res = await fetch(url, {
                method: 'PUT',
                headers,
                body: JSON.stringify(body ?? {})
            });
            if (res.status === 401) {
                clearAuth(local, session);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
                }
            }
            return res;
        },
        async delete (path) {
            const headers = new Headers();
            mergeAuthHeaders(headers, local, session);
            const url = `${baseURL.replace(/\/$/, '')}${path}`;
            const res = await fetch(url, {
                method: 'DELETE',
                headers
            });
            if (res.status === 401) {
                clearAuth(local, session);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
                }
            }
            return res;
        },
        async getBlob (path, options) {
            return request(path, {
                method: 'GET',
                params: options?.params
            });
        }
    };
}
export function createApiClient(options) {
    const baseURL = options?.baseURL ?? API_CONFIG.BASE_URL;
    const injectedLogger = options?.logger ?? logger;
    const http = createTransport(baseURL, {
        localStorage: options?.localStorage,
        sessionStorage: options?.sessionStorage
    });
    return {
        async getWorkflows () {
            return extractData(await http.get(workflowEndpoints.list()));
        },
        async getWorkflow (id) {
            return extractData(await http.get(workflowEndpoints.detail(id)));
        },
        async createWorkflow (workflow) {
            return extractData(await http.post(workflowEndpoints.list(), workflow));
        },
        async updateWorkflow (id, workflow) {
            return extractData(await http.put(workflowEndpoints.detail(id), workflow));
        },
        async deleteWorkflow (id) {
            const res = await http.delete(workflowEndpoints.detail(id));
            if (!res.ok) await extractData(res);
        },
        async bulkDeleteWorkflows (ids) {
            return extractData(await http.post(workflowEndpoints.bulkDelete(), {
                workflow_ids: ids
            }));
        },
        async duplicateWorkflow (id) {
            const workflow = await extractData(await http.get(workflowEndpoints.detail(id)));
            const duplicated = {
                ...workflow,
                id: undefined,
                name: `${workflow.name}-copy`
            };
            return extractData(await http.post(workflowEndpoints.list(), duplicated));
        },
        async publishWorkflow (workflowId, publishData) {
            return extractData(await http.post(workflowEndpoints.publish(workflowId), publishData));
        },
        async getAgents (params) {
            return extractData(await http.get(marketplaceEndpoints.agents(), {
                params: params
            }));
        },
        async publishAgent (agentData) {
            return extractData(await http.post(marketplaceEndpoints.agents(), agentData));
        },
        async deleteTemplate (templateId) {
            const res = await http.delete(templateEndpoints.delete(templateId));
            if (!res.ok) await extractData(res);
        },
        async executeWorkflow (workflowId, inputs = {}) {
            injectedLogger.debug('[API Client] executeWorkflow called with:', {
                workflowId,
                inputs
            });
            try {
                const url = workflowEndpoints.execute(workflowId);
                const payload = {
                    workflow_id: workflowId,
                    inputs
                };
                injectedLogger.debug('[API Client] POST request to:', url);
                const response = await http.post(url, payload);
                injectedLogger.debug('[API Client] Response received:', {
                    status: response.status
                });
                return extractData(response);
            } catch (error) {
                injectedLogger.error('[API Client] executeWorkflow error:', error);
                throw error;
            }
        },
        async getExecution (executionId) {
            return extractData(await http.get(executionEndpoints.detail(executionId)));
        },
        async listExecutions (params) {
            return extractData(await http.get(executionEndpoints.list(), {
                params: params
            }));
        },
        async getExecutionLogs (executionId, params) {
            return extractData(await http.get(executionEndpoints.logs(executionId), {
                params: params
            }));
        },
        async downloadExecutionLogs (executionId, format = 'text', params) {
            const response = await http.getBlob(executionEndpoints.downloadLogs(executionId), {
                params: {
                    format,
                    ...params
                }
            });
            if (!response.ok) await extractData(response);
            return response.blob();
        },
        async cancelExecution (executionId) {
            return extractData(await http.post(executionEndpoints.cancel(executionId)));
        },
        async chat (params) {
            return extractData(await http.post(chatEndpoints.chat(), params));
        },
        async getLLMSettings () {
            try {
                return await extractData(await http.get(settingsEndpoints.llm()));
            } catch (error) {
                if (error.response?.status === 401) {
                    return {
                        providers: []
                    };
                }
                throw error;
            }
        }
    };
}
export const api = createApiClient();
