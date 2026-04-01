import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { X, Upload, Bot, Workflow, Wrench } from "lucide-react";
import { showSuccess, showError } from "../utils/notifications";
import { api } from "../api/client";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
import { useAuth } from "../contexts/AuthContext";
import { STORAGE_KEYS } from "../config/constants";
import { logger } from "../utils/logger";
import { defaultAdapters } from "../types/adapters";
import { TEMPLATE_CATEGORIES, TEMPLATE_DIFFICULTIES, formatCategory, formatDifficulty } from "../config/templateConstants";
import { getDefaultPublishForm, parseTags } from "../utils/publishFormUtils";
import { usePublishForm } from "../hooks/forms";
function MarketplaceDialog({
  isOpen,
  onClose,
  node,
  workflowId,
  workflowName,
  storage = defaultAdapters.createLocalStorageAdapter(),
  // httpClient is currently unused but kept for future API integration
   
  httpClient: _httpClient = defaultAdapters.createHttpClient()
}) {
  const [activeTab, setActiveTab] = useState(
    () => node?.type === "tool" ? "tools" : "agents"
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const publishFormHook = usePublishForm();
  const { isAuthenticated, user } = useAuth();
  useEffect(() => {
    if (isOpen && node) {
      const defaultName = node.type === "tool" ? node.data?.label || node.data?.name || "Untitled Tool" : node.data?.label || node.data?.name || "Untitled Agent";
      publishFormHook.updateForm({
        ...getDefaultPublishForm(),
        name: defaultName,
        description: node.data?.description || ""
      });
    }
  }, [isOpen, node]);
  useEffect(() => {
    if (isOpen && node?.type === "tool") {
      setActiveTab("tools");
    } else if (isOpen && activeTab === "tools" && node?.type !== "tool") {
      setActiveTab("agents");
    }
  }, [isOpen, node?.type, activeTab]);
  if (!isOpen) return null;
  const handlePublishAgent = async () => {
    if (!node || node.type !== "agent") {
      showError("Invalid agent node");
      return;
    }
    if (!isAuthenticated) {
      showError("Please sign in to publish to the marketplace");
      return;
    }
    setIsPublishing(true);
    try {
      const tagsArray = parseTags(publishFormHook.form.tags);
      const publishedAgent = await api.publishAgent({
        name: publishFormHook.form.name,
        description: publishFormHook.form.description,
        category: publishFormHook.form.category,
        tags: tagsArray,
        difficulty: publishFormHook.form.difficulty,
        estimated_time: publishFormHook.form.estimated_time || void 0,
        agent_config: node.data.agent_config || {}
      });
      if (storage) {
        try {
          const agentTemplate = {
            id: publishedAgent.id || `agent_${Date.now()}`,
            name: publishedAgent.name || publishFormHook.form.name,
            label: publishedAgent.name || publishFormHook.form.name,
            description: publishedAgent.description || publishFormHook.form.description,
            category: publishedAgent.category || publishFormHook.form.category,
            tags: publishedAgent.tags || tagsArray,
            difficulty: publishedAgent.difficulty || publishFormHook.form.difficulty,
            estimated_time: publishedAgent.estimated_time || publishFormHook.form.estimated_time || "5 min",
            agent_config: publishedAgent.agent_config || node.data.agent_config || {},
            type: "agent",
            published_at: publishedAgent.published_at || (/* @__PURE__ */ new Date()).toISOString(),
            author_id: publishedAgent.author_id || user?.id || null,
            author_name: publishedAgent.author_name || user?.username || user?.email || null,
            is_official: publishedAgent.is_official || false
          };
          const publishedAgents = storage.getItem(STORAGE_KEYS.PUBLISHED_AGENTS);
          const agents = publishedAgents ? JSON.parse(publishedAgents) : [];
          const existingIndex = agents.findIndex(
            (a) => a.id === agentTemplate.id || a.name === agentTemplate.name && a.author_id === agentTemplate.author_id
          );
          if (existingIndex >= 0) {
            agents[existingIndex] = agentTemplate;
          } else {
            agents.push(agentTemplate);
          }
          storage.setItem(STORAGE_KEYS.PUBLISHED_AGENTS, JSON.stringify(agents));
        } catch (storageError) {
          logger.error("Failed to save agent to localStorage:", storageError);
        }
      }
      showSuccess("Agent published to marketplace successfully!");
      onClose();
    } catch (error) {
      const errorMessage = extractApiErrorMessage(error, "Unknown error");
      showError("Failed to publish agent: " + errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };
  const handlePublishWorkflow = async () => {
    if (!workflowId) {
      showError("No workflow selected");
      return;
    }
    if (!isAuthenticated) {
      showError("Please sign in to publish to the marketplace");
      return;
    }
    setIsPublishing(true);
    try {
      await api.publishWorkflow(workflowId, {
        category: publishFormHook.form.category,
        tags: parseTags(publishFormHook.form.tags),
        difficulty: publishFormHook.form.difficulty,
        estimated_time: publishFormHook.form.estimated_time || void 0
      });
      showSuccess("Workflow published to marketplace successfully!");
      onClose();
    } catch (error) {
      showError("Failed to publish workflow: " + extractApiErrorMessage(error, "Unknown error"));
    } finally {
      setIsPublishing(false);
    }
  };
  const handlePublishTool = async () => {
    if (!node || node.type !== "tool") {
      showError("Invalid tool node");
      return;
    }
    if (!isAuthenticated) {
      showError("Please sign in to publish to the marketplace");
      return;
    }
    setIsPublishing(true);
    try {
      const tagsArray = parseTags(publishFormHook.form.tags);
      if (storage) {
        const toolTemplate = {
          id: `tool_${Date.now()}`,
          name: publishFormHook.form.name,
          label: publishFormHook.form.name,
          description: publishFormHook.form.description,
          category: publishFormHook.form.category,
          tags: tagsArray,
          difficulty: publishFormHook.form.difficulty,
          estimated_time: publishFormHook.form.estimated_time || "5 min",
          tool_config: node.data.tool_config || { tool_name: "calculator" },
          type: "tool",
          published_at: (/* @__PURE__ */ new Date()).toISOString(),
          author_id: user?.id || null,
          author_name: user?.username || user?.email || null,
          is_official: false
        };
        const publishedTools = storage.getItem(STORAGE_KEYS.PUBLISHED_TOOLS);
        const tools = publishedTools ? JSON.parse(publishedTools) : [];
        tools.push(toolTemplate);
        storage.setItem(STORAGE_KEYS.PUBLISHED_TOOLS, JSON.stringify(tools));
      }
      showSuccess("Tool published to marketplace successfully!");
      onClose();
    } catch (error) {
      showError("Failed to publish tool: " + extractApiErrorMessage(error, "Unknown error"));
    } finally {
      setIsPublishing(false);
    }
  };
  const handlePublish = () => {
    if (activeTab === "agents") {
      handlePublishAgent();
    } else if (activeTab === "tools") {
      handlePublishTool();
    } else {
      handlePublishWorkflow();
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-0 bg-black bg-opacity-50",
        onClick: onClose
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Send to Marketplace" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onClose,
            className: "text-gray-400 hover:text-gray-600 transition-colors",
            children: /* @__PURE__ */ jsx(X, { className: "w-6 h-6" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex border-b border-gray-200", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("agents"),
            className: `flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === "agents" ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`,
            children: [
              /* @__PURE__ */ jsx(Bot, { className: "w-5 h-5" }),
              "Agents"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("workflows"),
            className: `flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === "workflows" ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`,
            children: [
              /* @__PURE__ */ jsx(Workflow, { className: "w-5 h-5" }),
              "Workflows"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("tools"),
            className: `flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === "tools" ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`,
            children: [
              /* @__PURE__ */ jsx(Wrench, { className: "w-5 h-5" }),
              "Tools"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto p-6", children: activeTab === "tools" ? /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Tool Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: publishFormHook.form.name,
              onChange: (e) => publishFormHook.updateField("name", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
              placeholder: "Enter tool name"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Description" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: publishFormHook.form.description,
              onChange: (e) => publishFormHook.updateField("description", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
              rows: 3,
              placeholder: "Describe what this tool does..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Category" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: publishFormHook.form.category,
              onChange: (e) => publishFormHook.updateField("category", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
              children: TEMPLATE_CATEGORIES.map((cat) => /* @__PURE__ */ jsx("option", { value: cat, children: formatCategory(cat).split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") }, cat))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Tags (comma-separated)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: publishFormHook.form.tags,
              onChange: (e) => publishFormHook.updateField("tags", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
              placeholder: "e.g., calculator, search, automation"
            }
          )
        ] })
      ] }) : activeTab === "agents" ? /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Agent Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: publishFormHook.form.name,
              onChange: (e) => publishFormHook.updateField("name", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
              placeholder: "Enter agent name"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Description" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: publishFormHook.form.description,
              onChange: (e) => publishFormHook.updateField("description", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
              rows: 3,
              placeholder: "Describe what this agent does..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Category" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: publishFormHook.form.category,
              onChange: (e) => publishFormHook.updateField("category", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
              children: TEMPLATE_CATEGORIES.map((cat) => /* @__PURE__ */ jsx("option", { value: cat, children: formatCategory(cat).split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") }, cat))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Tags (comma-separated)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: publishFormHook.form.tags,
              onChange: (e) => publishFormHook.updateField("tags", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
              placeholder: "e.g., llm, automation, ai"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Difficulty" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                value: publishFormHook.form.difficulty,
                onChange: (e) => publishFormHook.updateField("difficulty", e.target.value),
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                children: TEMPLATE_DIFFICULTIES.map((diff) => /* @__PURE__ */ jsx("option", { value: diff, children: formatDifficulty(diff) }, diff))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Estimated Time" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: publishFormHook.form.estimated_time,
                onChange: (e) => publishFormHook.updateField("estimated_time", e.target.value),
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                placeholder: "e.g., 5 min"
              }
            )
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Workflow Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: workflowName || "",
              disabled: true,
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-gray-500", children: "Workflow name cannot be changed when publishing" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Category" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: publishFormHook.form.category,
              onChange: (e) => publishFormHook.updateField("category", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
              children: TEMPLATE_CATEGORIES.map((cat) => /* @__PURE__ */ jsx("option", { value: cat, children: formatCategory(cat).split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") }, cat))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Tags (comma-separated)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: publishFormHook.form.tags,
              onChange: (e) => publishFormHook.updateField("tags", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
              placeholder: "e.g., automation, workflow, template"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Difficulty" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                value: publishFormHook.form.difficulty,
                onChange: (e) => publishFormHook.updateField("difficulty", e.target.value),
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                children: TEMPLATE_DIFFICULTIES.map((diff) => /* @__PURE__ */ jsx("option", { value: diff, children: formatDifficulty(diff) }, diff))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Estimated Time" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: publishFormHook.form.estimated_time,
                onChange: (e) => publishFormHook.updateField("estimated_time", e.target.value),
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                placeholder: "e.g., 10 min"
              }
            )
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onClose,
            className: "px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handlePublish,
            disabled: isPublishing || (activeTab === "agents" || activeTab === "tools") && !publishFormHook.form.name,
            className: "px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors",
            children: isPublishing ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }),
              "Publishing..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
              "Publish to Marketplace"
            ] })
          }
        )
      ] })
    ] })
  ] });
}
export {
  MarketplaceDialog as default
};
