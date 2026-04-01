import axios from "axios";
import { defaultAdapters } from "../types/adapters";
import { logger } from "../utils/logger";
import { API_CONFIG, STORAGE_KEYS } from "../config/constants";
import { extractData } from "./responseHandlers";
import { workflowEndpoints, templateEndpoints, executionEndpoints, marketplaceEndpoints, settingsEndpoints, chatEndpoints } from "./endpoints";
function createAxiosInstance(baseURL = API_CONFIG.BASE_URL, options) {
  const {
    localStorage: local = defaultAdapters.createLocalStorageAdapter(),
    sessionStorage: session = defaultAdapters.createSessionStorageAdapter(),
    axiosInstance: providedInstance
  } = options ?? {};
  const instance = providedInstance ?? axios.create({ baseURL });
  instance.interceptors.request.use(
    (config) => {
      if (local && session) {
        const rememberMe = local.getItem(STORAGE_KEYS.AUTH_REMEMBER_ME) === "true";
        const storage = rememberMe ? local : session;
        const token = storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        if (local && session) {
          local.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          local.removeItem(STORAGE_KEYS.AUTH_USER);
          local.removeItem(STORAGE_KEYS.AUTH_REMEMBER_ME);
          session.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          session.removeItem(STORAGE_KEYS.AUTH_USER);
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        }
      }
      return Promise.reject(error);
    }
  );
  return instance;
}
function createApiClient(options) {
  const {
    baseURL = API_CONFIG.BASE_URL,
    logger: injectedLogger = logger
  } = options ?? {};
  const instance = createAxiosInstance(baseURL, {
    localStorage: options?.localStorage,
    sessionStorage: options?.sessionStorage,
    axiosInstance: options?.axiosInstance
  });
  return {
    // Workflows
    async getWorkflows() {
      return extractData(await instance.get(workflowEndpoints.list()));
    },
    async getWorkflow(id) {
      return extractData(await instance.get(workflowEndpoints.detail(id)));
    },
    async createWorkflow(workflow) {
      return extractData(await instance.post(workflowEndpoints.list(), workflow));
    },
    async updateWorkflow(id, workflow) {
      return extractData(await instance.put(workflowEndpoints.detail(id), workflow));
    },
    async deleteWorkflow(id) {
      await instance.delete(workflowEndpoints.detail(id));
    },
    async bulkDeleteWorkflows(ids) {
      return extractData(await instance.post(workflowEndpoints.bulkDelete(), {
        workflow_ids: ids
      }));
    },
    async duplicateWorkflow(id) {
      const getResponse = await instance.get(workflowEndpoints.detail(id));
      const workflow = extractData(getResponse);
      const duplicated = {
        ...workflow,
        id: void 0,
        // Remove ID so it creates a new one
        name: `${workflow.name}-copy`
      };
      const postResponse = await instance.post(workflowEndpoints.list(), duplicated);
      return extractData(postResponse);
    },
    async publishWorkflow(workflowId, publishData) {
      return extractData(await instance.post(workflowEndpoints.publish(workflowId), publishData));
    },
    async getAgents(params) {
      return extractData(await instance.get(marketplaceEndpoints.agents(), { params }));
    },
    async publishAgent(agentData) {
      return extractData(await instance.post(marketplaceEndpoints.agents(), agentData));
    },
    // Templates
    async deleteTemplate(templateId) {
      await instance.delete(templateEndpoints.delete(templateId));
    },
    // Executions
    async executeWorkflow(workflowId, inputs = {}) {
      injectedLogger.debug("[API Client] executeWorkflow called with:", { workflowId, inputs });
      try {
        const url = workflowEndpoints.execute(workflowId);
        const payload = {
          workflow_id: workflowId,
          inputs
        };
        injectedLogger.debug("[API Client] POST request to:", url);
        injectedLogger.debug("[API Client] Request payload:", payload);
        const response = await instance.post(url, payload);
        injectedLogger.debug("[API Client] Response received:", {
          status: response.status,
          data: response.data
        });
        return extractData(response);
      } catch (error) {
        injectedLogger.error("[API Client] executeWorkflow error:", error);
        injectedLogger.error("[API Client] Error details:", {
          message: error.message,
          response: error.response,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        throw error;
      }
    },
    async getExecution(executionId) {
      return extractData(await instance.get(executionEndpoints.detail(executionId)));
    },
    async listExecutions(params) {
      return extractData(await instance.get(executionEndpoints.list(), { params }));
    },
    async getExecutionLogs(executionId, params) {
      return extractData(await instance.get(executionEndpoints.logs(executionId), { params }));
    },
    async downloadExecutionLogs(executionId, format = "text", params) {
      const response = await instance.get(executionEndpoints.downloadLogs(executionId), {
        params: { format, ...params },
        responseType: "blob"
      });
      return response.data;
    },
    async cancelExecution(executionId) {
      return extractData(await instance.post(executionEndpoints.cancel(executionId)));
    },
    // Chat
    async chat(params) {
      return extractData(await instance.post(chatEndpoints.chat(), params));
    },
    // Settings
    async getLLMSettings() {
      try {
        return extractData(await instance.get(settingsEndpoints.llm()));
      } catch (error) {
        if (error.response?.status === 401) {
          return { providers: [] };
        }
        throw error;
      }
    }
  };
}
const api = createApiClient();
export {
  api,
  createApiClient
};
