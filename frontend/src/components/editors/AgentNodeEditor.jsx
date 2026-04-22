import { useRef, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
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
import { normalizeAdkConfig, adkConfigTextField } from "../../utils/adkConfigUtils";

/** Avoid overwriting local ADK field state while typing (refs may be unset on some styled inputs). */
function isEditorControlFocused(active, refObj, htmlId) {
  if (active == null) {
    return false;
  }
  if (htmlId != null && active.id === htmlId) {
    return true;
  }
  return refObj?.current != null && active === refObj.current;
}

function AgentNodeEditor({ node, availableModels, onUpdate, onConfigUpdate }) {
  const systemPromptRef = useRef(null);
  const maxTokensRef = useRef(null);
  const temperatureRef = useRef(null);
  const modelRef = useRef(null);
  const agentTypeRef = useRef(null);
  const adkNameRef = useRef(null);
  const adkDescRef = useRef(null);
  const adkToolsRef = useRef(null);
  /** True while user is editing (survives re-renders that drop focus briefly). */
  const systemPromptDirtyRef = useRef(false);
  const maxTokensDirtyRef = useRef(false);
  const temperatureDirtyRef = useRef(false);
  const modelDirtyRef = useRef(false);
  const agentTypeDirtyRef = useRef(false);
  const adkNameDirtyRef = useRef(false);
  const adkDescDirtyRef = useRef(false);
  const adkToolsDirtyRef = useRef(false);
  const [systemPromptValue, setSystemPromptValue] = useState("");
  const [maxTokensValue, setMaxTokensValue] = useState("");
  const [temperatureValue, setTemperatureValue] = useState(0.7);
  const [modelValue, setModelValue] = useState("gpt-4o-mini");
  const [agentTypeValue, setAgentTypeValue] = useState("workflow");
  const [adkNameValue, setAdkNameValue] = useState("");
  const [adkDescValue, setAdkDescValue] = useState("");
  const [adkToolsDisplay, setAdkToolsDisplay] = useState("");

  const defaultModelValue =
    availableModels.length > 0 ? availableModels[0].value : "gpt-4o-mini";

  function hydrateLocalStateFromNode(agentNode) {
    const cfg = agentNode.data.agent_config || {};
    const ac = normalizeAdkConfig(cfg.adk_config);
    const isAdkNode = cfg.agent_type === "adk";
    setAgentTypeValue(cfg.agent_type || "workflow");
    setSystemPromptValue(
      isAdkNode
        ? (typeof ac.instruction === "string" ? ac.instruction : "") ||
            cfg.system_prompt ||
            ""
        : cfg.system_prompt || "",
    );
    setMaxTokensValue(cfg.max_tokens || "");
    setAdkNameValue(adkConfigTextField(ac, "name"));
    setAdkDescValue(adkConfigTextField(ac, "description"));
    setAdkToolsDisplay(
      Array.isArray(ac.adk_tools) ? ac.adk_tools.join(", ") : "",
    );
    setTemperatureValue(cfg.temperature ?? 0.7);
    setModelValue(cfg.model || defaultModelValue);
  }

  useEffect(() => {
    systemPromptDirtyRef.current = false;
    maxTokensDirtyRef.current = false;
    temperatureDirtyRef.current = false;
    modelDirtyRef.current = false;
    agentTypeDirtyRef.current = false;
    adkNameDirtyRef.current = false;
    adkDescDirtyRef.current = false;
    adkToolsDirtyRef.current = false;
    hydrateLocalStateFromNode(node);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-hydrate when switching nodes; availableModels captured for default model
  }, [node.id]);

  useEffect(() => {
    const active = document.activeElement;
    const agentConfig2 = node.data.agent_config || {};
    const ac2 = normalizeAdkConfig(agentConfig2.adk_config);
    const isAdk = agentConfig2.agent_type === "adk";
    const fromInstruction =
      typeof ac2.instruction === "string" ? ac2.instruction : "";
    const prompt = isAdk
      ? fromInstruction || agentConfig2.system_prompt || ""
      : agentConfig2.system_prompt || "";

    const systemGuard =
      !systemPromptDirtyRef.current &&
      !isEditorControlFocused(active, systemPromptRef, "agent-system-prompt");
    if (systemGuard) {
      setSystemPromptValue(prompt);
    }
    const maxGuard =
      !maxTokensDirtyRef.current &&
      !isEditorControlFocused(active, maxTokensRef, "agent-max-tokens");
    if (maxGuard) {
      setMaxTokensValue(agentConfig2.max_tokens || "");
    }
    const tempGuard =
      !temperatureDirtyRef.current &&
      !isEditorControlFocused(active, temperatureRef, "agent-temperature");
    if (tempGuard) {
      setTemperatureValue(agentConfig2.temperature ?? 0.7);
    }
    const modelGuard =
      !modelDirtyRef.current &&
      !isEditorControlFocused(active, modelRef, "agent-model");
    if (modelGuard) {
      setModelValue(agentConfig2.model || defaultModelValue);
    }
    const typeGuard =
      !agentTypeDirtyRef.current &&
      !isEditorControlFocused(active, agentTypeRef, "agent-type");
    if (typeGuard) {
      setAgentTypeValue(agentConfig2.agent_type || "workflow");
    }
    const nameGuard =
      !adkNameDirtyRef.current &&
      !isEditorControlFocused(active, adkNameRef, "adk-name");
    if (nameGuard) {
      setAdkNameValue(adkConfigTextField(ac2, "name"));
    }
    const descGuard =
      !adkDescDirtyRef.current &&
      !isEditorControlFocused(active, adkDescRef, "adk-description");
    if (descGuard) {
      setAdkDescValue(adkConfigTextField(ac2, "description"));
    }
    const toolsGuard =
      !adkToolsDirtyRef.current &&
      !isEditorControlFocused(active, adkToolsRef, "adk-tools");
    if (toolsGuard) {
      setAdkToolsDisplay(
        Array.isArray(ac2.adk_tools) ? ac2.adk_tools.join(", ") : "",
      );
    }
  }, [node.data.agent_config, defaultModelValue]);
  const agentConfig = node.data.agent_config || {};
  const agentType = agentTypeValue;
  const adkConfig = normalizeAdkConfig(agentConfig.adk_config);
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
          ref={agentTypeRef}
          value={agentTypeValue}
          onFocus={() => {
            agentTypeDirtyRef.current = true;
          }}
          onBlur={() => {
            agentTypeDirtyRef.current = false;
          }}
          onChange={(e) => {
            const nextType = e.target.value;
            setAgentTypeValue(nextType);
            const next = { ...agentConfig, agent_type: nextType };
            if (nextType === "adk") {
              const ac = normalizeAdkConfig(agentConfig.adk_config);
              const instruction =
                typeof ac.instruction === "string" && ac.instruction
                  ? ac.instruction
                  : agentConfig.system_prompt || "";
              next.adk_config = {
                ...ac,
                name: adkConfigTextField(ac, "name"),
                instruction,
              };
            }
            onUpdate("agent_config", next);
          }}
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
              ref={adkNameRef}
              type="text"
              value={adkNameValue}
              onFocus={() => {
                adkNameDirtyRef.current = true;
              }}
              onBlur={() => {
                adkNameDirtyRef.current = false;
              }}
              onChange={(e) => {
                const v = e.target.value;
                setAdkNameValue(v);
                onUpdate("agent_config", {
                  ...agentConfig,
                  adk_config: {
                    ...adkConfig,
                    name: v,
                  },
                });
              }}
              placeholder="e.g., assistant_agent"
              required={true}
              aria-label="ADK agent name"
            />
          </EditorFieldGroup>
          <EditorFieldGroup $mb="sm">
            <EditorLabel htmlFor="adk-description" $compact>
              Description
            </EditorLabel>
            <EditorInputCompact
              id="adk-description"
              ref={adkDescRef}
              type="text"
              value={adkDescValue}
              onFocus={() => {
                adkDescDirtyRef.current = true;
              }}
              onBlur={() => {
                adkDescDirtyRef.current = false;
              }}
              onChange={(e) => {
                const v = e.target.value;
                setAdkDescValue(v);
                onUpdate("agent_config", {
                  ...agentConfig,
                  adk_config: {
                    ...adkConfig,
                    description: v,
                  },
                });
              }}
              placeholder="Brief description of the agent"
              aria-label="ADK description"
            />
          </EditorFieldGroup>
          <EditorFieldGroup $mb="sm">
            <EditorLabel htmlFor="adk-tools" $compact>
              ADK Tools (comma-separated)
            </EditorLabel>
            <EditorInputCompact
              id="adk-tools"
              ref={adkToolsRef}
              type="text"
              value={adkToolsDisplay}
              onFocus={() => {
                adkToolsDirtyRef.current = true;
              }}
              onBlur={() => {
                adkToolsDirtyRef.current = false;
              }}
              onChange={(e) => {
                const raw = e.target.value;
                setAdkToolsDisplay(raw);
                onUpdate("agent_config", {
                  ...agentConfig,
                  adk_config: {
                    ...adkConfig,
                    adk_tools: raw
                      .split(",")
                      .map((t) => t.trim())
                      .filter((t) => t),
                  },
                });
              }}
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
          ref={modelRef}
          value={modelValue}
          onFocus={() => {
            modelDirtyRef.current = true;
          }}
          onBlur={() => {
            modelDirtyRef.current = false;
          }}
          onChange={(e) => {
            const v = e.target.value;
            setModelValue(v);
            onUpdate("agent_config", {
              ...agentConfig,
              model: v,
            });
          }}
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
          onFocus={() => {
            systemPromptDirtyRef.current = true;
          }}
          onBlur={() => {
            systemPromptDirtyRef.current = false;
          }}
          onChange={(e) => {
            const newValue = e.target.value;
            setSystemPromptValue(newValue);
            if (agentType === "adk") {
              onUpdate("agent_config", {
                ...agentConfig,
                system_prompt: newValue,
                adk_config: {
                  ...adkConfig,
                  instruction: newValue,
                },
              });
            } else {
              onConfigUpdate("agent_config", "system_prompt", newValue);
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
          Temperature:{" "}
          {typeof temperatureValue === "number"
            ? temperatureValue.toFixed(1)
            : "0.7"}
        </EditorLabel>
        <EditorRangeInput
          id="agent-temperature"
          ref={temperatureRef}
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={temperatureValue}
          onFocus={() => {
            temperatureDirtyRef.current = true;
          }}
          onBlur={() => {
            temperatureDirtyRef.current = false;
          }}
          onChange={(e) => {
            const t = parseFloat(e.target.value);
            setTemperatureValue(t);
            onUpdate("agent_config", {
              ...agentConfig,
              temperature: t,
            });
          }}
          aria-label="Temperature control for agent creativity"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={temperatureValue}
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
          onFocus={() => {
            maxTokensDirtyRef.current = true;
          }}
          onBlur={() => {
            maxTokensDirtyRef.current = false;
          }}
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
AgentNodeEditor.propTypes = {
  node: PropTypes.object.isRequired,
  availableModels: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string,
      provider: PropTypes.string,
    }),
  ).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onConfigUpdate: PropTypes.func.isRequired,
};

export { AgentNodeEditor as default };
