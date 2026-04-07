import {
  EditorSectionRoot,
  EditorSectionTitle,
  EditorFieldGroup,
  EditorLabel,
  EditorSelect,
  EditorHint,
  EditorCalloutAmber,
  EditorCalloutAmberTitle,
  EditorCalloutAmberBody,
} from "../../styles/editorForm.styled";
const BUILTIN_TOOLS = [
  {
    value: "calculator",
    label: "Calculator",
    description: "Mathematical calculations",
  },
  {
    value: "web_search",
    label: "Web Search",
    description: "Search the web",
  },
  {
    value: "python_executor",
    label: "Python Executor",
    description: "Execute Python code",
  },
  {
    value: "file_reader",
    label: "File Reader",
    description: "Read file contents",
  },
  {
    value: "google_search",
    label: "Google Search (ADK)",
    description: "Google ADK search",
  },
  {
    value: "load_web_page",
    label: "Load Web Page (ADK)",
    description: "Load and parse web pages",
  },
  {
    value: "enterprise_web_search",
    label: "Enterprise Web Search (ADK)",
    description: "Enterprise search",
  },
];
function ToolNodeEditor({ node, onUpdate, onConfigUpdate: _onConfigUpdate }) {
  const toolConfig = node.data.tool_config || node.data.tool_config || {};
  const toolName = toolConfig.tool_name || "calculator";
  return (
    <EditorSectionRoot>
      <EditorSectionTitle>Tool Configuration</EditorSectionTitle>
      <EditorFieldGroup>
        <EditorLabel htmlFor="tool-type">Tool Type</EditorLabel>
        <EditorSelect
          id="tool-type"
          value={toolName}
          onChange={(e) =>
            onUpdate("tool_config", {
              ...toolConfig,
              tool_name: e.target.value,
            })
          }
          aria-label="Select tool type"
        >
          {BUILTIN_TOOLS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </EditorSelect>
        <EditorHint>
          {BUILTIN_TOOLS.find((t) => t.value === toolName)?.description ||
            "Callable tool for agents"}
        </EditorHint>
      </EditorFieldGroup>
      <EditorCalloutAmber role="status">
        <EditorCalloutAmberTitle>🔧 Tool Node</EditorCalloutAmberTitle>
        <EditorCalloutAmberBody>
          This node represents a callable tool. Connect it to agents or use it
          in workflows. Tools can be shared via the marketplace.
        </EditorCalloutAmberBody>
      </EditorCalloutAmber>
    </EditorSectionRoot>
  );
}
export { BUILTIN_TOOLS, ToolNodeEditor as default };
