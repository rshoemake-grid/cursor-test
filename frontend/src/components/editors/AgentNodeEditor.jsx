import { useRef, useState, useEffect, useCallback } from "react";
import { Download } from "lucide-react";
import { showSuccess } from "../../utils/notifications";
import {
  EditorSectionRoot,
  EditorSectionTitle,
  EditorFieldGroup,
  EditorLabel,
  EditorSelect,
  EditorInput,
  EditorInputCompact,
  EditorTextarea,
  EditorHint,
  EditorInsetPanel,
  EditorCalloutBlue,
  EditorCalloutBlueHeading,
  EditorCalloutBlueTitle,
  EditorCalloutBlueBody,
  EditorRangeInput,
  EditorRangeScaleRow,
  EditorSecondaryFullButton,
} from "../../styles/editorForm.styled";
function AgentNodeEditor({ node, availableModels, onUpdate, onConfigUpdate }) {
  const systemPromptRef = useRef(null);
  const maxTokensRef = useRef(null);
  const [systemPromptValue, setSystemPromptValue] = useState("");
  const [maxTokensValue, setMaxTokensValue] = useState("");
  useEffect(() => {
    const agentConfig2 = node.data.agent_config || {};
    if (document.activeElement !== systemPromptRef.current) {
      setSystemPromptValue(agentConfig2.system_prompt || "");
    }
    if (document.activeElement !== maxTokensRef.current) {
      setMaxTokensValue(agentConfig2.max_tokens || "");
    }
  }, [node.data.agent_config]);
  const agentConfig = node.data.agent_config || {};
  const agentType = agentConfig.agent_type || "workflow";
  const currentModel =
    agentConfig.model ||
    (availableModels.length > 0 ? availableModels[0].value : "gpt-4o-mini");
  const adkConfig = agentConfig.adk_config || {};
  const handleExportConfig = useCallback(() => {
    const exportData = {
      label: node.data.label || node.data.name || "Agent",
      description: node.data.description || "",
      agent_config: agentConfig,
      type: "agent",
    };
    const filename = `${(exportData.label || "agent").replace(/\s+/g, "-")}-config.json`;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("Agent config exported");
  }, [node.data.label, node.data.name, node.data.description, agentConfig]);
  return (
    <EditorSectionRoot>
      <EditorSectionTitle>LLM Agent Configuration</EditorSectionTitle>
      <EditorInsetPanel>
        <EditorLabel htmlFor="agent-type">Agent Type</EditorLabel>
        <EditorSelect
          id="agent-type"
          value={agentType}
          onChange={(e) =>
            onUpdate("agent_config", {
              ...agentConfig,
              agent_type: e.target.value,
            })
          }
          aria-label="Select agent type"
        >
          <option value="workflow">Workflow Agent (Default)</option>
          <option value="adk">ADK Agent (Google ADK)</option>
        </EditorSelect>
        <EditorHint>
          {agentType === "adk"
            ? "Uses Google ADK for agent execution. Requires Gemini models."
            : "Uses direct LLM API calls with workflow orchestration."}
        </EditorHint>
      </EditorInsetPanel>
      {agentType === "adk" && (
        <EditorCalloutBlue $mb="md">
          <EditorCalloutBlueHeading>ADK Configuration</EditorCalloutBlueHeading>
          <EditorFieldGroup $mb="sm">
            <EditorLabel htmlFor="adk-name" $compact>
              Agent Name *
            </EditorLabel>
            <EditorInputCompact
              id="adk-name"
              type="text"
              value={typeof adkConfig.name === "string" ? adkConfig.name : ""}
              onChange={(e) =>
                onUpdate("agent_config", {
                  ...agentConfig,
                  adk_config: {
                    ...adkConfig,
                    name: e.target.value,
                  },
                })
              }
              placeholder="e.g., assistant_agent"
              required={true}
            />
          </EditorFieldGroup>
          <EditorFieldGroup $mb="sm">
            <EditorLabel htmlFor="adk-description" $compact>
              Description
            </EditorLabel>
            <EditorInputCompact
              id="adk-description"
              type="text"
              value={
                typeof adkConfig.description === "string"
                  ? adkConfig.description
                  : ""
              }
              onChange={(e) =>
                onUpdate("agent_config", {
                  ...agentConfig,
                  adk_config: {
                    ...adkConfig,
                    description: e.target.value,
                  },
                })
              }
              placeholder="Brief description of the agent"
            />
          </EditorFieldGroup>
          <EditorFieldGroup $mb="sm">
            <EditorLabel htmlFor="adk-tools" $compact>
              ADK Tools (comma-separated)
            </EditorLabel>
            <EditorInputCompact
              id="adk-tools"
              type="text"
              value={
                Array.isArray(adkConfig.adk_tools)
                  ? adkConfig.adk_tools.join(", ")
                  : ""
              }
              onChange={(e) =>
                onUpdate("agent_config", {
                  ...agentConfig,
                  adk_config: {
                    ...adkConfig,
                    adk_tools: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter((t) => t),
                  },
                })
              }
              placeholder="google_search, load_web_page"
            />
            <EditorHint>
              Available: google_search, load_web_page, enterprise_web_search
            </EditorHint>
          </EditorFieldGroup>
        </EditorCalloutBlue>
      )}
      <EditorFieldGroup>
        <EditorLabel htmlFor="agent-model">Model</EditorLabel>
        <EditorSelect
          id="agent-model"
          value={currentModel}
          onChange={(e) =>
            onUpdate("agent_config", {
              ...agentConfig,
              model: e.target.value,
            })
          }
          aria-label="Select LLM model for agent"
        >
          {availableModels.length > 0 ? (
            availableModels.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))
          ) : (
            <>
              <option value="gpt-4o-mini">GPT-4o Mini (OpenAI)</option>
              <option value="gpt-4o">GPT-4o (OpenAI)</option>
              <option value="gpt-4">GPT-4 (OpenAI)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</option>
            </>
          )}
        </EditorSelect>
        <EditorHint>
          {availableModels.length > 0
            ? `This agent will use the configured LLM provider with the selected model`
            : "This agent will call the OpenAI API with this model. Configure providers in Settings."}
        </EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="md">
        <EditorLabel htmlFor="agent-system-prompt">
          {agentType === "adk" ? "Instruction" : "System Prompt"}
        </EditorLabel>
        <EditorTextarea
          id="agent-system-prompt"
          ref={systemPromptRef}
          value={systemPromptValue}
          onChange={(e) => {
            const newValue = e.target.value;
            setSystemPromptValue(newValue);
            const updatedConfig = {
              ...agentConfig,
              system_prompt: newValue,
            };
            if (agentType === "adk" && adkConfig) {
              updatedConfig.adk_config = {
                ...adkConfig,
                instruction: newValue,
              };
            }
            onConfigUpdate("agent_config", "system_prompt", newValue);
            if (agentType === "adk") {
              onUpdate("agent_config", updatedConfig);
            }
          }}
          rows={4}
          placeholder="You are a helpful assistant that..."
          aria-label="System prompt for agent behavior"
          aria-describedby="system-prompt-help"
        />
        <EditorHint id="system-prompt-help">
          Instructions that define the agent&apos;s role and behavior
        </EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="md">
        <EditorLabel htmlFor="agent-temperature">
          Temperature: {agentConfig.temperature?.toFixed(1) || "0.7"}
        </EditorLabel>
        <EditorRangeInput
          id="agent-temperature"
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={agentConfig.temperature || 0.7}
          onChange={(e) =>
            onUpdate("agent_config", {
              ...agentConfig,
              temperature: parseFloat(e.target.value),
            })
          }
          aria-label="Temperature control for agent creativity"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={agentConfig.temperature || 0.7}
        />
        <EditorRangeScaleRow>
          <span>Focused (0.0)</span>
          <span>Creative (1.0)</span>
        </EditorRangeScaleRow>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="md">
        <EditorLabel htmlFor="agent-max-tokens">Max Tokens (optional)</EditorLabel>
        <EditorInput
          id="agent-max-tokens"
          ref={maxTokensRef}
          type="number"
          value={maxTokensValue}
          onChange={(e) => {
            const newValue = e.target.value ? parseInt(e.target.value) : void 0;
            setMaxTokensValue(e.target.value);
            onConfigUpdate("agent_config", "max_tokens", newValue);
          }}
          placeholder="Leave blank for default"
          aria-label="Maximum tokens for agent response"
          aria-describedby="max-tokens-help"
        />
        <EditorHint id="max-tokens-help">
          Maximum length of the agent&apos;s response
        </EditorHint>
      </EditorFieldGroup>
      <EditorCalloutBlue $mt="md" role="status">
        <EditorCalloutBlueTitle>🤖 This is a Real LLM Agent</EditorCalloutBlueTitle>
        <EditorCalloutBlueBody>
          When executed, this agent will call OpenAI&apos;s API with your
          configured model and prompt. The agent receives data from its inputs
          and produces output for the next nodes.
        </EditorCalloutBlueBody>
      </EditorCalloutBlue>
      <EditorFieldGroup $mt="md">
        <EditorSecondaryFullButton
          type="button"
          onClick={handleExportConfig}
          aria-label="Export agent config to JSON file"
        >
          <Download size={16} aria-hidden />
          Export Agent Config
        </EditorSecondaryFullButton>
      </EditorFieldGroup>
    </EditorSectionRoot>
  );
}
export { AgentNodeEditor as default };
