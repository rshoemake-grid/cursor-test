import { useState, useEffect } from "react";
import { X, Upload, Bot, Workflow, Wrench } from "lucide-react";
import { showSuccess, showError } from "../utils/notifications";
import { api } from "../api/client";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
import { useAuth } from "../contexts/AuthContext";
import { STORAGE_KEYS } from "../config/constants";
import { logger } from "../utils/logger";
import { defaultAdapters } from "../types/adapters";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_DIFFICULTIES,
  formatCategory,
  formatDifficulty,
} from "../config/templateConstants";
import { getDefaultPublishForm, parseTags } from "../utils/publishFormUtils";
import { usePublishForm } from "../hooks/forms";
import {
  MPDOverlay,
  MPDBackdrop,
  MPDDialog,
  MPDHeader,
  MPDTitle,
  MPDCloseBtn,
  MPDTabsRow,
  MPDTabBtn,
  MPDBody,
  MPDStack,
  MPDField,
  MPDLabel,
  MPDInput,
  MPDInputReadonly,
  MPDTextarea,
  MPDSelect,
  MPDHint,
  MPDGrid2,
  MPDFooter,
  MPDCancelBtn,
  MPDPublishBtn,
  MPDSpinner,
} from "../styles/marketplaceDialog.styled";

function formatCategoryLabel(cat) {
  return formatCategory(cat)
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function MarketplaceDialog({
  isOpen,
  onClose,
  node,
  workflowId,
  workflowName,
  storage = defaultAdapters.createLocalStorageAdapter(),
  httpClient: _httpClient = defaultAdapters.createHttpClient(),
}) {
  const [activeTab, setActiveTab] = useState(() =>
    node?.type === "tool" ? "tools" : "agents",
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const publishFormHook = usePublishForm();
  const { isAuthenticated, user } = useAuth();
  useEffect(() => {
    if (isOpen && node) {
      const defaultName =
        node.type === "tool"
          ? node.data?.label || node.data?.name || "Untitled Tool"
          : node.data?.label || node.data?.name || "Untitled Agent";
      publishFormHook.updateForm({
        ...getDefaultPublishForm(),
        name: defaultName,
        description: node.data?.description || "",
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
        agent_config: node.data.agent_config || {},
      });
      if (storage) {
        try {
          const agentTemplate = {
            id: publishedAgent.id || `agent_${Date.now()}`,
            name: publishedAgent.name || publishFormHook.form.name,
            label: publishedAgent.name || publishFormHook.form.name,
            description:
              publishedAgent.description || publishFormHook.form.description,
            category: publishedAgent.category || publishFormHook.form.category,
            tags: publishedAgent.tags || tagsArray,
            difficulty:
              publishedAgent.difficulty || publishFormHook.form.difficulty,
            estimated_time:
              publishedAgent.estimated_time ||
              publishFormHook.form.estimated_time ||
              "5 min",
            agent_config:
              publishedAgent.agent_config || node.data.agent_config || {},
            type: "agent",
            published_at:
              publishedAgent.published_at || new Date().toISOString(),
            author_id: publishedAgent.author_id || user?.id || null,
            author_name:
              publishedAgent.author_name ||
              user?.username ||
              user?.email ||
              null,
            is_official: publishedAgent.is_official || false,
          };
          const publishedAgents = storage.getItem(
            STORAGE_KEYS.PUBLISHED_AGENTS,
          );
          const agents = publishedAgents ? JSON.parse(publishedAgents) : [];
          const existingIndex = agents.findIndex(
            (a) =>
              a.id === agentTemplate.id ||
              (a.name === agentTemplate.name &&
                a.author_id === agentTemplate.author_id),
          );
          if (existingIndex >= 0) {
            agents[existingIndex] = agentTemplate;
          } else {
            agents.push(agentTemplate);
          }
          storage.setItem(
            STORAGE_KEYS.PUBLISHED_AGENTS,
            JSON.stringify(agents),
          );
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
        estimated_time: publishFormHook.form.estimated_time || void 0,
      });
      showSuccess("Workflow published to marketplace successfully!");
      onClose();
    } catch (error) {
      showError(
        "Failed to publish workflow: " +
          extractApiErrorMessage(error, "Unknown error"),
      );
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
          tool_config: node.data.tool_config || {
            tool_name: "calculator",
          },
          type: "tool",
          published_at: new Date().toISOString(),
          author_id: user?.id || null,
          author_name: user?.username || user?.email || null,
          is_official: false,
        };
        const publishedTools = storage.getItem(STORAGE_KEYS.PUBLISHED_TOOLS);
        const tools = publishedTools ? JSON.parse(publishedTools) : [];
        tools.push(toolTemplate);
        storage.setItem(STORAGE_KEYS.PUBLISHED_TOOLS, JSON.stringify(tools));
      }
      showSuccess("Tool published to marketplace successfully!");
      onClose();
    } catch (error) {
      showError(
        "Failed to publish tool: " +
          extractApiErrorMessage(error, "Unknown error"),
      );
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
  const publishDisabled =
    isPublishing ||
    ((activeTab === "agents" || activeTab === "tools") &&
      !publishFormHook.form.name);
  return (
    <MPDOverlay>
      <MPDBackdrop onClick={onClose} />
      <MPDDialog>
        <MPDHeader>
          <MPDTitle>Send to Marketplace</MPDTitle>
          <MPDCloseBtn onClick={onClose} aria-label="Close dialog">
            <X aria-hidden />
          </MPDCloseBtn>
        </MPDHeader>
        <MPDTabsRow>
          <MPDTabBtn
            $active={activeTab === "agents"}
            onClick={() => setActiveTab("agents")}
          >
            <Bot aria-hidden />
            Agents
          </MPDTabBtn>
          <MPDTabBtn
            $active={activeTab === "workflows"}
            onClick={() => setActiveTab("workflows")}
          >
            <Workflow aria-hidden />
            Workflows
          </MPDTabBtn>
          <MPDTabBtn
            $active={activeTab === "tools"}
            onClick={() => setActiveTab("tools")}
          >
            <Wrench aria-hidden />
            Tools
          </MPDTabBtn>
        </MPDTabsRow>
        <MPDBody>
          {activeTab === "tools" ? (
            <MPDStack>
              <MPDField>
                <MPDLabel>Tool Name</MPDLabel>
                <MPDInput
                  type="text"
                  value={publishFormHook.form.name}
                  onChange={(e) =>
                    publishFormHook.updateField("name", e.target.value)
                  }
                  placeholder="Enter tool name"
                />
              </MPDField>
              <MPDField>
                <MPDLabel>Description</MPDLabel>
                <MPDTextarea
                  value={publishFormHook.form.description}
                  onChange={(e) =>
                    publishFormHook.updateField("description", e.target.value)
                  }
                  rows={3}
                  placeholder="Describe what this tool does..."
                />
              </MPDField>
              <MPDField>
                <MPDLabel>Category</MPDLabel>
                <MPDSelect
                  value={publishFormHook.form.category}
                  onChange={(e) =>
                    publishFormHook.updateField("category", e.target.value)
                  }
                >
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {formatCategoryLabel(cat)}
                    </option>
                  ))}
                </MPDSelect>
              </MPDField>
              <MPDField>
                <MPDLabel>Tags (comma-separated)</MPDLabel>
                <MPDInput
                  type="text"
                  value={publishFormHook.form.tags}
                  onChange={(e) =>
                    publishFormHook.updateField("tags", e.target.value)
                  }
                  placeholder="e.g., calculator, search, automation"
                />
              </MPDField>
            </MPDStack>
          ) : activeTab === "agents" ? (
            <MPDStack>
              <MPDField>
                <MPDLabel>Agent Name</MPDLabel>
                <MPDInput
                  type="text"
                  value={publishFormHook.form.name}
                  onChange={(e) =>
                    publishFormHook.updateField("name", e.target.value)
                  }
                  placeholder="Enter agent name"
                />
              </MPDField>
              <MPDField>
                <MPDLabel>Description</MPDLabel>
                <MPDTextarea
                  value={publishFormHook.form.description}
                  onChange={(e) =>
                    publishFormHook.updateField("description", e.target.value)
                  }
                  rows={3}
                  placeholder="Describe what this agent does..."
                />
              </MPDField>
              <MPDField>
                <MPDLabel>Category</MPDLabel>
                <MPDSelect
                  value={publishFormHook.form.category}
                  onChange={(e) =>
                    publishFormHook.updateField("category", e.target.value)
                  }
                >
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {formatCategoryLabel(cat)}
                    </option>
                  ))}
                </MPDSelect>
              </MPDField>
              <MPDField>
                <MPDLabel>Tags (comma-separated)</MPDLabel>
                <MPDInput
                  type="text"
                  value={publishFormHook.form.tags}
                  onChange={(e) =>
                    publishFormHook.updateField("tags", e.target.value)
                  }
                  placeholder="e.g., llm, automation, ai"
                />
              </MPDField>
              <MPDGrid2>
                <MPDField>
                  <MPDLabel>Difficulty</MPDLabel>
                  <MPDSelect
                    value={publishFormHook.form.difficulty}
                    onChange={(e) =>
                      publishFormHook.updateField("difficulty", e.target.value)
                    }
                  >
                    {TEMPLATE_DIFFICULTIES.map((diff) => (
                      <option key={diff} value={diff}>
                        {formatDifficulty(diff)}
                      </option>
                    ))}
                  </MPDSelect>
                </MPDField>
                <MPDField>
                  <MPDLabel>Estimated Time</MPDLabel>
                  <MPDInput
                    type="text"
                    value={publishFormHook.form.estimated_time}
                    onChange={(e) =>
                      publishFormHook.updateField(
                        "estimated_time",
                        e.target.value,
                      )
                    }
                    placeholder="e.g., 5 min"
                  />
                </MPDField>
              </MPDGrid2>
            </MPDStack>
          ) : (
            <MPDStack>
              <MPDField>
                <MPDLabel>Workflow Name</MPDLabel>
                <MPDInputReadonly
                  type="text"
                  value={workflowName || ""}
                  disabled={true}
                  readOnly
                />
                <MPDHint>Workflow name cannot be changed when publishing</MPDHint>
              </MPDField>
              <MPDField>
                <MPDLabel>Category</MPDLabel>
                <MPDSelect
                  value={publishFormHook.form.category}
                  onChange={(e) =>
                    publishFormHook.updateField("category", e.target.value)
                  }
                >
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {formatCategoryLabel(cat)}
                    </option>
                  ))}
                </MPDSelect>
              </MPDField>
              <MPDField>
                <MPDLabel>Tags (comma-separated)</MPDLabel>
                <MPDInput
                  type="text"
                  value={publishFormHook.form.tags}
                  onChange={(e) =>
                    publishFormHook.updateField("tags", e.target.value)
                  }
                  placeholder="e.g., automation, workflow, template"
                />
              </MPDField>
              <MPDGrid2>
                <MPDField>
                  <MPDLabel>Difficulty</MPDLabel>
                  <MPDSelect
                    value={publishFormHook.form.difficulty}
                    onChange={(e) =>
                      publishFormHook.updateField("difficulty", e.target.value)
                    }
                  >
                    {TEMPLATE_DIFFICULTIES.map((diff) => (
                      <option key={diff} value={diff}>
                        {formatDifficulty(diff)}
                      </option>
                    ))}
                  </MPDSelect>
                </MPDField>
                <MPDField>
                  <MPDLabel>Estimated Time</MPDLabel>
                  <MPDInput
                    type="text"
                    value={publishFormHook.form.estimated_time}
                    onChange={(e) =>
                      publishFormHook.updateField(
                        "estimated_time",
                        e.target.value,
                      )
                    }
                    placeholder="e.g., 10 min"
                  />
                </MPDField>
              </MPDGrid2>
            </MPDStack>
          )}
        </MPDBody>
        <MPDFooter>
          <MPDCancelBtn onClick={onClose}>Cancel</MPDCancelBtn>
          <MPDPublishBtn onClick={handlePublish} disabled={publishDisabled}>
            {isPublishing ? (
              <>
                <MPDSpinner aria-hidden />
                Publishing...
              </>
            ) : (
              <>
                <Upload aria-hidden />
                Publish to Marketplace
              </>
            )}
          </MPDPublishBtn>
        </MPDFooter>
      </MPDDialog>
    </MPDOverlay>
  );
}
export { MarketplaceDialog as default };
