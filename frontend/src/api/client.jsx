import { defaultAdapters } from "../types/adapters";
import { logger } from "../utils/logger";
import { API_CONFIG, STORAGE_KEYS } from "../config/constants";
import { extractData } from "./responseHandlers";
import {
  workflowEndpoints,
  templateEndpoints,
  executionEndpoints,
  marketplaceEndpoints,
  settingsEndpoints,
  chatEndpoints,
  storageEndpoints,
} from "./endpoints";

function joinUrl(baseURL, path) {
  let base = (baseURL || "").trim().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) {
    base = "/api";
  }
  return `${base}${p}`;
}

function appendQuery(url, params) {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      usp.append(k, String(v));
    }
  });
  const q = usp.toString();
  if (!q) {
    return url;
  }
  return `${url}${url.includes("?") ? "&" : "?"}${q}`;
}

function clearAuthStorage(local, session) {
  if (!local || !session) {
    return;
  }
  local.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  local.removeItem(STORAGE_KEYS.AUTH_USER);
  local.removeItem(STORAGE_KEYS.AUTH_REMEMBER_ME);
  session.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  session.removeItem(STORAGE_KEYS.AUTH_USER);
}

function dispatchUnauthorized() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
  }
}

function buildAuthHeaders(local, session) {
  const headers = { Accept: "application/json" };
  if (!local || !session) {
    return headers;
  }
  const rememberMe = local.getItem(STORAGE_KEYS.AUTH_REMEMBER_ME) === "true";
  const storage = rememberMe ? local : session;
  const token = storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function hasStoredAuthToken(local, session) {
  if (!local || !session) {
    return false;
  }
  const rememberMe = local.getItem(STORAGE_KEYS.AUTH_REMEMBER_ME) === "true";
  const storage = rememberMe ? local : session;
  return Boolean(storage.getItem(STORAGE_KEYS.AUTH_TOKEN));
}

async function parseJsonOrText(response) {
  const ct = response.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

function createHttpError(response, body) {
  let message = response.statusText || "Request failed";
  if (body && typeof body === "object") {
    if (body.detail != null) {
      message =
        typeof body.detail === "string"
          ? body.detail
          : JSON.stringify(body.detail);
    } else if (body.message != null) {
      message = String(body.message);
    }
  } else if (typeof body === "string" && body) {
    message = body;
  }
  const err = new Error(message);
  err.response = {
    status: response.status,
    statusText: response.statusText,
    data: body,
  };
  return err;
}

function createFetchClient({
  baseURL = API_CONFIG.BASE_URL,
  localStorage: local = defaultAdapters.createLocalStorageAdapter(),
  sessionStorage: session = defaultAdapters.createSessionStorageAdapter(),
  fetchImpl = typeof globalThis !== "undefined" &&
  typeof globalThis.fetch === "function"
    ? globalThis.fetch.bind(globalThis)
    : () => Promise.reject(new Error("fetch is not available")),
}) {
  async function request(method, path, { params, body, responseType } = {}) {
    const url = appendQuery(joinUrl(baseURL, path), params);
    const headers = { ...buildAuthHeaders(local, session) };
    const init = { method, headers };
    if (body !== undefined && method !== "GET" && method !== "HEAD") {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    const response = await fetchImpl(url, init);
    if (response.status === 401) {
      clearAuthStorage(local, session);
      dispatchUnauthorized();
    }
    if (!response.ok) {
      const bodyRaw = await parseJsonOrText(response);
      throw createHttpError(response, bodyRaw);
    }
    if (responseType === "blob") {
      return response.blob();
    }
    if (response.status === 204) {
      return undefined;
    }
    return parseJsonOrText(response);
  }

  return {
    get: (path, options = {}) => request("GET", path, options),
    post: (path, body, options = {}) =>
      request("POST", path, { ...options, body }),
    put: (path, body, options = {}) =>
      request("PUT", path, { ...options, body }),
    delete: (path, options = {}) => request("DELETE", path, options),
  };
}

function createApiClient(options) {
  const {
    baseURL = API_CONFIG.BASE_URL,
    logger: injectedLogger = logger,
    localStorage: local = defaultAdapters.createLocalStorageAdapter(),
    sessionStorage: session = defaultAdapters.createSessionStorageAdapter(),
    fetchImpl,
  } = options ?? {};

  const http = createFetchClient({
    baseURL,
    localStorage: options?.localStorage ?? local,
    sessionStorage: options?.sessionStorage ?? session,
    fetchImpl,
  });

  return {
    async getWorkflows() {
      return extractData(await http.get(workflowEndpoints.list()));
    },
    async getWorkflow(id) {
      return extractData(await http.get(workflowEndpoints.detail(id)));
    },
    async createWorkflow(workflow) {
      return extractData(await http.post(workflowEndpoints.list(), workflow));
    },
    async updateWorkflow(id, workflow) {
      return extractData(
        await http.put(workflowEndpoints.detail(id), workflow),
      );
    },
    async deleteWorkflow(id) {
      await http.delete(workflowEndpoints.detail(id));
    },
    async bulkDeleteWorkflows(ids) {
      return extractData(
        await http.post(workflowEndpoints.bulkDelete(), { workflow_ids: ids }),
      );
    },
    async duplicateWorkflow(id) {
      const workflow = extractData(
        await http.get(workflowEndpoints.detail(id)),
      );
      const duplicated = {
        ...workflow,
        id: void 0,
        name: `${workflow.name}-copy`,
      };
      return extractData(await http.post(workflowEndpoints.list(), duplicated));
    },
    async publishWorkflow(workflowId, publishData) {
      return extractData(
        await http.post(workflowEndpoints.publish(workflowId), publishData),
      );
    },
    async getAgents(params) {
      return extractData(
        await http.get(marketplaceEndpoints.agents(), { params }),
      );
    },
    async publishAgent(agentData) {
      return extractData(
        await http.post(marketplaceEndpoints.agents(), agentData),
      );
    },
    async deleteTemplate(templateId) {
      await http.delete(templateEndpoints.delete(templateId));
    },
    async executeWorkflow(workflowId, inputs = {}) {
      injectedLogger.debug("[API Client] executeWorkflow called with:", {
        workflowId,
        inputs,
      });
      try {
        const url = workflowEndpoints.execute(workflowId);
        const payload = { workflow_id: workflowId, inputs };
        injectedLogger.debug("[API Client] POST request to:", url);
        injectedLogger.debug("[API Client] Request payload:", payload);
        const raw = await http.post(url, payload);
        injectedLogger.debug("[API Client] Response received");
        return extractData(raw);
      } catch (error) {
        injectedLogger.error("[API Client] executeWorkflow error:", error);
        injectedLogger.error("[API Client] Error details:", {
          message: error.message,
          response: error.response,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
        throw error;
      }
    },
    async getExecution(executionId) {
      return extractData(
        await http.get(executionEndpoints.detail(executionId)),
      );
    },
    async listExecutions(params) {
      return extractData(await http.get(executionEndpoints.list(), { params }));
    },
    async getExecutionLogs(executionId, params) {
      return extractData(
        await http.get(executionEndpoints.logs(executionId), { params }),
      );
    },
    async downloadExecutionLogs(executionId, format = "text", params) {
      return http.get(executionEndpoints.downloadLogs(executionId), {
        params: { format, ...params },
        responseType: "blob",
      });
    },
    async cancelExecution(executionId) {
      return extractData(
        await http.post(executionEndpoints.cancel(executionId)),
      );
    },
    async chat(params) {
      return extractData(await http.post(chatEndpoints.chat(), params));
    },
    async getLLMSettings() {
      if (!hasStoredAuthToken(local, session)) {
        return { providers: [] };
      }
      try {
        return extractData(await http.get(settingsEndpoints.llm()));
      } catch (error) {
        if (error.response?.status === 401) {
          return { providers: [] };
        }
        throw error;
      }
    },
    async listGcpBucketObjects(body) {
      return extractData(
        await http.post(storageEndpoints.gcpListObjects(), body),
      );
    },
    async listGcpBuckets(body) {
      return extractData(
        await http.post(storageEndpoints.gcpListBuckets(), body),
      );
    },
    async listGcpProjects(body) {
      return extractData(
        await http.post(storageEndpoints.gcpListProjects(), body),
      );
    },
    async getGcpDefaultProject(body = {}) {
      return extractData(
        await http.post(storageEndpoints.gcpDefaultProject(), body),
      );
    },
    async listGcpPubsubTopics(body) {
      return extractData(
        await http.post(storageEndpoints.gcpPubsubListTopics(), body),
      );
    },
    async listGcpPubsubSubscriptions(body) {
      return extractData(
        await http.post(storageEndpoints.gcpPubsubListSubscriptions(), body),
      );
    },
    async listS3BucketObjects(body) {
      return extractData(
        await http.post(storageEndpoints.awsListObjects(), body),
      );
    },
    async listS3Buckets(body) {
      return extractData(
        await http.post(storageEndpoints.awsListBuckets(), body),
      );
    },
    async listAwsRegions(body) {
      return extractData(
        await http.post(storageEndpoints.awsListRegions(), body),
      );
    },
    async listLocalDirectory(body) {
      return extractData(
        await http.post(storageEndpoints.localListDirectory(), body),
      );
    },
  };
}

const api = createApiClient();

export { api, createApiClient, createFetchClient };
