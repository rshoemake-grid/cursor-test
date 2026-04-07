import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Bot,
  GitBranch,
  RotateCw,
  Play,
  Flag,
  Database,
  Radio,
  Folder,
  ChevronDown,
  ChevronRight,
  Upload,
  Wrench,
} from "lucide-react";
import { logger } from "../utils/logger";
import { STORAGE_KEYS } from "../config/constants";
import { defaultAdapters } from "../types/adapters";
import { showSuccess, showError } from "../utils/notifications";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
import {
  NodePanelRoot,
  NodePanelTitle,
  NodePanelSubtitle,
  NodePanelSection,
  NodePanelSectionSpaced,
  NodePanelCategoryBtn,
  NodePaletteIconWrap,
  NodePanelPaletteCard,
  NodePanelCardHeader,
  NodePanelCardTitle,
  NodePanelCardDesc,
  NodePanelHiddenInput,
  NodePanelImportBtn,
  NodePanelTipBox,
  NodePanelTipTitle,
  NodePanelTipText,
} from "../styles/nodePanel.styled";

const workflowNodeTemplates = [
  {
    type: "start",
    label: "Start",
    icon: Play,
    iconTone: "primary",
    description: "Workflow entry point",
  },
  {
    type: "condition",
    label: "Condition",
    icon: GitBranch,
    iconTone: "purple",
    description: "If/else branching",
  },
  {
    type: "loop",
    label: "Loop",
    icon: RotateCw,
    iconTone: "green",
    description: "Iterate over items",
  },
  {
    type: "end",
    label: "End",
    icon: Flag,
    iconTone: "gray",
    description: "Workflow completion",
  },
];
const defaultAgentNodeTemplates = [
  {
    type: "agent",
    label: "Agent",
    icon: Bot,
    iconTone: "blue",
    description: "LLM-powered agent (Workflow or ADK)",
  },
  {
    type: "agent",
    label: "ADK Agent",
    icon: Bot,
    iconTone: "indigo",
    description: "Google ADK agent (Gemini, tools)",
    agentType: "adk",
  },
];
const defaultToolNodeTemplates = [
  {
    type: "tool",
    label: "Calculator",
    icon: Wrench,
    iconTone: "amber",
    description: "Mathematical calculations",
    toolName: "calculator",
  },
  {
    type: "tool",
    label: "Web Search",
    icon: Wrench,
    iconTone: "amber",
    description: "Search the web",
    toolName: "web_search",
  },
  {
    type: "tool",
    label: "Python Executor",
    icon: Wrench,
    iconTone: "amber",
    description: "Execute Python code",
    toolName: "python_executor",
  },
  {
    type: "tool",
    label: "File Reader",
    icon: Wrench,
    iconTone: "amber",
    description: "Read file contents",
    toolName: "file_reader",
  },
];
const dataNodeTemplates = [
  {
    type: "gcp_bucket",
    label: "GCP Bucket",
    icon: Database,
    iconTone: "orange",
    description: "Read from Google Cloud Storage bucket",
  },
  {
    type: "aws_s3",
    label: "AWS S3",
    icon: Database,
    iconTone: "yellow",
    description: "Read from AWS S3 bucket",
  },
  {
    type: "gcp_pubsub",
    label: "GCP Pub/Sub",
    icon: Radio,
    iconTone: "purple",
    description: "Subscribe to GCP Pub/Sub topic",
  },
  {
    type: "local_filesystem",
    label: "Local File",
    icon: Folder,
    iconTone: "green",
    description: "Read from local file system",
  },
  {
    type: "database",
    label: "Database",
    icon: Database,
    iconTone: "indigo",
    description: "Connect to database and query data",
  },
  {
    type: "firebase",
    label: "Firebase",
    icon: Database,
    iconTone: "orange",
    description:
      "Connect to Firebase services (Firestore, Realtime DB, Storage)",
  },
  {
    type: "bigquery",
    label: "BigQuery",
    icon: Database,
    iconTone: "blue",
    description: "Query Google BigQuery data warehouse",
  },
];

function NodePanel({
  storage = defaultAdapters.createLocalStorageAdapter(),
  logger: injectedLogger = logger,
} = {}) {
  const [expandedCategories, setExpandedCategories] = useState({
    workflowNodes: false,
    agentNodes: true,
    toolNodes: false,
    dataNodes: false,
  });
  const [customAgentNodes, setCustomAgentNodes] = useState([]);
  const [customToolNodes, setCustomToolNodes] = useState([]);
  const storageRef = useRef(storage);
  const loggerRef = useRef(injectedLogger);
  useEffect(() => {
    storageRef.current = storage;
    loggerRef.current = injectedLogger;
  }, [storage, injectedLogger]);
  const loadNodesFromStorage = useCallback((key, setter, logLabel) => {
    const currentStorage = storageRef.current;
    if (!currentStorage) return;
    try {
      const saved = currentStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setter(parsed);
        }
      }
    } catch (error) {
      loggerRef.current.error(`Failed to load ${logLabel}:`, error);
    }
  }, []);
  useEffect(() => {
    loadNodesFromStorage(
      STORAGE_KEYS.CUSTOM_AGENT_NODES,
      setCustomAgentNodes,
      "custom agent nodes",
    );
    loadNodesFromStorage(
      STORAGE_KEYS.CUSTOM_TOOL_NODES,
      setCustomToolNodes,
      "custom tool nodes",
    );
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.CUSTOM_AGENT_NODES) {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          if (Array.isArray(parsed)) {
            setCustomAgentNodes(parsed);
          }
        } catch (error) {
          loggerRef.current.error("Failed to parse custom agent nodes:", error);
        }
      }
      if (e.key === STORAGE_KEYS.CUSTOM_TOOL_NODES) {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          if (Array.isArray(parsed)) {
            setCustomToolNodes(parsed);
          }
        } catch (error) {
          loggerRef.current.error("Failed to parse custom tool nodes:", error);
        }
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
    }
    const handleCustomStorageChange = () => {
      loadNodesFromStorage(
        STORAGE_KEYS.CUSTOM_AGENT_NODES,
        setCustomAgentNodes,
        "custom agent nodes",
      );
      loadNodesFromStorage(
        STORAGE_KEYS.CUSTOM_TOOL_NODES,
        setCustomToolNodes,
        "custom tool nodes",
      );
    };
    if (typeof window !== "undefined") {
      window.addEventListener(
        "customAgentNodesUpdated",
        handleCustomStorageChange,
      );
      window.addEventListener(
        "customToolNodesUpdated",
        handleCustomStorageChange,
      );
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener(
          "customAgentNodesUpdated",
          handleCustomStorageChange,
        );
        window.removeEventListener(
          "customToolNodesUpdated",
          handleCustomStorageChange,
        );
      }
    };
  }, [loadNodesFromStorage]);
  const agentNodeTemplates = useMemo(() => {
    return [
      ...defaultAgentNodeTemplates,
      ...customAgentNodes.map((node) => ({
        type: "agent",
        label: node.label || "Custom Agent",
        icon: Bot,
        iconTone: "blue",
        description: node.description || "Custom LLM-powered agent",
        customData: node,
      })),
    ];
  }, [customAgentNodes]);
  const toolNodeTemplates = useMemo(() => {
    const builtin = defaultToolNodeTemplates.map((t) => ({
      type: "tool",
      label: t.label,
      icon: Wrench,
      iconTone: "amber",
      description: t.description,
      customData: {
        label: t.label,
        tool_config: {
          tool_name: t.toolName,
        },
      },
    }));
    const custom = customToolNodes.map((node) => ({
      type: "tool",
      label: node.label || "Custom Tool",
      icon: Wrench,
      iconTone: "amber",
      description: node.description || "Custom tool",
      customData: node,
    }));
    return [...builtin, ...custom];
  }, [customToolNodes]);
  const toggleCategory = useCallback((category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);
  const fileInputRef = useRef(null);
  const toolFileInputRef = useRef(null);
  const handleImportTool = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    const currentStorage = storageRef.current;
    if (!currentStorage) {
      showError("Storage not available");
      return;
    }
    try {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });
      const parsed = JSON.parse(text);
      const toolConfig = parsed.tool_config ?? parsed.data?.tool_config;
      let label =
        parsed.label ?? parsed.name ?? parsed.data?.label ?? parsed.data?.name;
      let description = parsed.description ?? parsed.data?.description ?? "";
      if (!toolConfig?.tool_name) {
        showError("Invalid tool config: missing tool_config.tool_name");
        return;
      }
      const toolTemplate = {
        id: `tool_${Date.now()}`,
        label: label || parsed.tool_config?.tool_name || "Imported Tool",
        description: description || "",
        tool_config: toolConfig,
        type: "tool",
      };
      const saved = currentStorage.getItem(STORAGE_KEYS.CUSTOM_TOOL_NODES);
      const tools = saved ? JSON.parse(saved) : [];
      tools.push(toolTemplate);
      currentStorage.setItem(
        STORAGE_KEYS.CUSTOM_TOOL_NODES,
        JSON.stringify(tools),
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("customToolNodesUpdated"));
      }
      setCustomToolNodes(tools);
      showSuccess(
        `Tool "${toolTemplate.label}" imported. Drag from palette to add to canvas.`,
      );
    } catch (err) {
      loggerRef.current.error("Failed to import tool config:", err);
      showError(extractApiErrorMessage(err, "Failed to import tool config"));
    }
  }, []);
  const handleImportAgent = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    const currentStorage = storageRef.current;
    if (!currentStorage) {
      showError("Storage not available");
      return;
    }
    try {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });
      const parsed = JSON.parse(text);
      let agentConfig = parsed.agent_config ?? parsed.data?.agent_config;
      let label =
        parsed.label ?? parsed.name ?? parsed.data?.label ?? parsed.data?.name;
      let description = parsed.description ?? parsed.data?.description ?? "";
      if (!agentConfig || typeof agentConfig !== "object") {
        showError("Invalid agent config: missing agent_config");
        return;
      }
      const agentTemplate = {
        id: `agent_${Date.now()}`,
        label: label || "Imported Agent",
        description: description || "",
        agent_config: agentConfig,
        type: "agent",
      };
      const savedAgentNodes = currentStorage.getItem(
        STORAGE_KEYS.CUSTOM_AGENT_NODES,
      );
      const agentNodes = savedAgentNodes ? JSON.parse(savedAgentNodes) : [];
      agentNodes.push(agentTemplate);
      currentStorage.setItem(
        STORAGE_KEYS.CUSTOM_AGENT_NODES,
        JSON.stringify(agentNodes),
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("customAgentNodesUpdated"));
      }
      setCustomAgentNodes(agentNodes);
      showSuccess(
        `Agent "${agentTemplate.label}" imported. Drag from palette to add to canvas.`,
      );
    } catch (err) {
      loggerRef.current.error("Failed to import agent config:", err);
      showError(extractApiErrorMessage(err, "Failed to import agent config"));
    }
  }, []);
  const onDragStart = useCallback(
    (event, nodeType, customData, templateData) => {
      event.dataTransfer.setData("application/reactflow", nodeType);
      if (nodeType === "tool" && customData) {
        event.dataTransfer.setData(
          "application/custom-tool",
          JSON.stringify(customData),
        );
      } else if (customData) {
        event.dataTransfer.setData(
          "application/custom-agent",
          JSON.stringify(customData),
        );
      } else if (templateData?.agentType) {
        event.dataTransfer.setData(
          "application/custom-agent",
          JSON.stringify({
            label: templateData.label,
            agent_config: {
              agent_type: templateData.agentType,
              adk_config: {
                name: "adk_agent",
              },
            },
          }),
        );
      }
      event.dataTransfer.effectAllowed = "move";
    },
    [],
  );
  return (
    <NodePanelRoot>
      <NodePanelTitle>Node Palette</NodePanelTitle>
      <NodePanelSubtitle>Drag nodes onto the canvas</NodePanelSubtitle>
      <NodePanelSection>
        <NodePanelCategoryBtn
          $muted
          onClick={() => toggleCategory("workflowNodes")}
        >
          <span>Workflow Nodes</span>
          {expandedCategories.workflowNodes ? (
            <ChevronDown aria-hidden />
          ) : (
            <ChevronRight aria-hidden />
          )}
        </NodePanelCategoryBtn>
        {expandedCategories.workflowNodes && (
          <NodePanelSection>
            {workflowNodeTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <NodePanelPaletteCard
                  key={template.type}
                  draggable={true}
                  onDragStart={(e) => onDragStart(e, template.type)}
                >
                  <NodePanelCardHeader>
                    <NodePaletteIconWrap $tone={template.iconTone}>
                      <Icon aria-hidden />
                    </NodePaletteIconWrap>
                    <NodePanelCardTitle>{template.label}</NodePanelCardTitle>
                  </NodePanelCardHeader>
                  <NodePanelCardDesc $muted>
                    {template.description}
                  </NodePanelCardDesc>
                </NodePanelPaletteCard>
              );
            })}
          </NodePanelSection>
        )}
      </NodePanelSection>
      <NodePanelSectionSpaced>
        <NodePanelCategoryBtn onClick={() => toggleCategory("agentNodes")}>
          <span>Agent Nodes</span>
          {expandedCategories.agentNodes ? (
            <ChevronDown aria-hidden />
          ) : (
            <ChevronRight aria-hidden />
          )}
        </NodePanelCategoryBtn>
        {expandedCategories.agentNodes && (
          <NodePanelSection>
            <NodePanelHiddenInput
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportAgent}
              aria-hidden="true"
              data-testid="import-agent-file-input"
            />
            <NodePanelImportBtn
              onClick={() => fileInputRef.current?.click()}
              title="Import agent config from JSON file"
            >
              <Upload aria-hidden />
              Import Agent
            </NodePanelImportBtn>
            {agentNodeTemplates.map((template, index) => {
              const Icon = template.icon;
              const key = template.customData
                ? `custom-${template.customData.id}`
                : `${template.type}-${index}`;
              const templateData = template.agentType
                ? {
                    agentType: template.agentType,
                    label: template.label,
                  }
                : void 0;
              return (
                <NodePanelPaletteCard
                  key={key}
                  draggable={true}
                  onDragStart={(e) =>
                    onDragStart(
                      e,
                      template.type,
                      template.customData,
                      templateData,
                    )
                  }
                >
                  <NodePanelCardHeader>
                    <NodePaletteIconWrap $tone={template.iconTone}>
                      <Icon aria-hidden />
                    </NodePaletteIconWrap>
                    <NodePanelCardTitle>{template.label}</NodePanelCardTitle>
                  </NodePanelCardHeader>
                  <NodePanelCardDesc>{template.description}</NodePanelCardDesc>
                </NodePanelPaletteCard>
              );
            })}
          </NodePanelSection>
        )}
      </NodePanelSectionSpaced>
      <NodePanelSectionSpaced>
        <NodePanelCategoryBtn onClick={() => toggleCategory("toolNodes")}>
          <span>Tool Nodes</span>
          {expandedCategories.toolNodes ? (
            <ChevronDown aria-hidden />
          ) : (
            <ChevronRight aria-hidden />
          )}
        </NodePanelCategoryBtn>
        {expandedCategories.toolNodes && (
          <NodePanelSection>
            <NodePanelHiddenInput
              ref={toolFileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportTool}
              aria-hidden="true"
              data-testid="import-tool-file-input"
            />
            <NodePanelImportBtn
              $variant="tool"
              onClick={() => toolFileInputRef.current?.click()}
              title="Import tool config from JSON file"
            >
              <Upload aria-hidden />
              Import Tool
            </NodePanelImportBtn>
            {toolNodeTemplates.map((template, index) => {
              const Icon = template.icon;
              const key = template.customData?.id
                ? `custom-${template.customData.id}`
                : `tool-${index}`;
              return (
                <NodePanelPaletteCard
                  key={key}
                  $variant="tool"
                  draggable={true}
                  onDragStart={(e) =>
                    onDragStart(e, "tool", template.customData)
                  }
                >
                  <NodePanelCardHeader>
                    <NodePaletteIconWrap $tone={template.iconTone}>
                      <Icon aria-hidden />
                    </NodePaletteIconWrap>
                    <NodePanelCardTitle>{template.label}</NodePanelCardTitle>
                  </NodePanelCardHeader>
                  <NodePanelCardDesc>{template.description}</NodePanelCardDesc>
                </NodePanelPaletteCard>
              );
            })}
          </NodePanelSection>
        )}
      </NodePanelSectionSpaced>
      <NodePanelSectionSpaced>
        <NodePanelCategoryBtn onClick={() => toggleCategory("dataNodes")}>
          <span>Data Nodes</span>
          {expandedCategories.dataNodes ? (
            <ChevronDown aria-hidden />
          ) : (
            <ChevronRight aria-hidden />
          )}
        </NodePanelCategoryBtn>
        {expandedCategories.dataNodes && (
          <NodePanelSection>
            {dataNodeTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <NodePanelPaletteCard
                  key={template.type}
                  draggable={true}
                  onDragStart={(e) => onDragStart(e, template.type)}
                >
                  <NodePanelCardHeader>
                    <NodePaletteIconWrap $tone={template.iconTone}>
                      <Icon aria-hidden />
                    </NodePaletteIconWrap>
                    <NodePanelCardTitle>{template.label}</NodePanelCardTitle>
                  </NodePanelCardHeader>
                  <NodePanelCardDesc>{template.description}</NodePanelCardDesc>
                </NodePanelPaletteCard>
              );
            })}
          </NodePanelSection>
        )}
      </NodePanelSectionSpaced>
      <NodePanelTipBox>
        <NodePanelTipTitle>💡 Tip</NodePanelTipTitle>
        <NodePanelTipText>
          Connect nodes by dragging from the circles (handles) on each node.
        </NodePanelTipText>
      </NodePanelTipBox>
    </NodePanelRoot>
  );
}
export { NodePanel as default };
