import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import {
  ModalBackdrop,
  ModalPanel,
  ModalHeader,
  ModalTitle,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  ModalStack,
  ModalFieldStack,
  ModalSectionTitle,
  ModalLead,
  ModalRequiredMark,
  DialogCancelButton,
  DialogPrimaryButton,
} from "../styles/modalDialog.styled";
import {
  EditorLabel,
  EditorInput,
  EditorTextarea,
  EditorHint,
} from "../styles/editorForm.styled";
const DEFAULT_EXTRA_ARGS_JSON = "{}";

function parseAdditionalExecutionArgs(raw) {
  const trimmed = (raw ?? "").trim();
  if (trimmed === "") {
    return {};
  }
  const parsed = JSON.parse(trimmed);
  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    throw new Error("Additional arguments must be a JSON object.");
  }
  return parsed;
}

function ExecutionInputDialog({ dialog, graph, handlers }) {
  const { isOpen, workflowName } = dialog;
  const { nodes } = graph;
  const { onClose, onSubmit } = handlers;
  const [inputs, setInputs] = useState({});
  const [extraArgsJson, setExtraArgsJson] = useState(DEFAULT_EXTRA_ARGS_JSON);
  const [argsJsonError, setArgsJsonError] = useState("");
  useEffect(() => {
    if (isOpen) {
      const initialInputs = {};
      nodes.forEach((node) => {
        if (node.type === "start" && node.input_config) {
          const inputConfig = node.input_config;
          if (inputConfig.inputs) {
            inputConfig.inputs.forEach((input) => {
              initialInputs[input.name] = input.default_value || "";
            });
          }
        }
      });
      setInputs(initialInputs);
      setExtraArgsJson(DEFAULT_EXTRA_ARGS_JSON);
      setArgsJsonError("");
    } else {
      setInputs({});
      setExtraArgsJson(DEFAULT_EXTRA_ARGS_JSON);
      setArgsJsonError("");
    }
  }, [isOpen, nodes]);
  if (!isOpen) return null;
  const inputNodes = nodes.filter(
    (node) => node.type === "start" && node.input_config,
  );
  const handleSubmit = (e) => {
    e.preventDefault();
    let extra;
    try {
      extra = parseAdditionalExecutionArgs(extraArgsJson);
    } catch (err) {
      setArgsJsonError(
        err instanceof SyntaxError
          ? "Invalid JSON. Use an object, e.g. {\"topic\": \"hello\"}."
          : err.message || "Invalid additional arguments.",
      );
      return;
    }
    setArgsJsonError("");
    const merged = { ...inputs, ...extra };
    onSubmit(merged);
    onClose();
  };
  const handleInputChange = (name, value) => {
    setInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  return (
    <ModalBackdrop>
      <ModalPanel $wide $tall>
        <ModalHeader>
          <ModalTitle>
            {workflowName ? `Execute: ${workflowName}` : "Execute Workflow"}
          </ModalTitle>
          <ModalCloseButton
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={24} aria-hidden />
          </ModalCloseButton>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            {inputNodes.length === 0 ? (
              <ModalLead>
                This workflow does not define start-node fields. You can still
                pass execution variables as JSON below (merged into workflow
                variables), or leave {"{}"} to run with saved defaults only.
              </ModalLead>
            ) : (
              <ModalStack>
                {inputNodes.map((node) => {
                  const inputConfig = node.input_config;
                  if (!inputConfig.inputs || inputConfig.inputs.length === 0) {
                    return null;
                  }
                  return (
                    <div key={node.id}>
                      <ModalSectionTitle>
                        {node.name || "Inputs"}
                      </ModalSectionTitle>
                      <ModalFieldStack>
                        {inputConfig.inputs.map((input) => (
                          <div key={input.name}>
                            <EditorLabel htmlFor={`exec-in-${input.name}`}>
                              {input.label || input.name}
                              {input.required && (
                                <ModalRequiredMark aria-hidden>*</ModalRequiredMark>
                              )}
                            </EditorLabel>
                            {input.type === "textarea" ? (
                              <EditorTextarea
                                id={`exec-in-${input.name}`}
                                value={inputs[input.name] || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    input.name,
                                    e.target.value,
                                  )
                                }
                                required={input.required}
                                rows={4}
                                placeholder={input.placeholder || ""}
                              />
                            ) : (
                              <EditorInput
                                id={`exec-in-${input.name}`}
                                type={input.type || "text"}
                                value={
                                  input.type === "number"
                                    ? inputs[input.name] === void 0 ||
                                      inputs[input.name] === ""
                                      ? ""
                                      : String(inputs[input.name])
                                    : inputs[input.name] || ""
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    input.name,
                                    input.type === "number"
                                      ? e.target.value === ""
                                        ? ""
                                        : Number(e.target.value)
                                      : e.target.value,
                                  )
                                }
                                required={input.required}
                                placeholder={input.placeholder || ""}
                              />
                            )}
                            {input.description && (
                              <EditorHint>{input.description}</EditorHint>
                            )}
                          </div>
                        ))}
                      </ModalFieldStack>
                    </div>
                  );
                })}
              </ModalStack>
            )}
            <ModalStack style={{ marginTop: inputNodes.length === 0 ? 0 : 16 }}>
              <ModalSectionTitle>Additional arguments (JSON)</ModalSectionTitle>
              <ModalLead style={{ marginTop: 0, marginBottom: 8 }}>
                Optional. Merged with the fields above; keys here override
                same-named start inputs. Use strings, numbers, booleans, or
                nested objects.
              </ModalLead>
              <EditorLabel htmlFor="exec-additional-args-json">
                Variables JSON
              </EditorLabel>
              <EditorTextarea
                id="exec-additional-args-json"
                value={extraArgsJson}
                onChange={(e) => {
                  setExtraArgsJson(e.target.value);
                  if (argsJsonError) {
                    setArgsJsonError("");
                  }
                }}
                rows={6}
                placeholder='{"key": "value"}'
                aria-invalid={argsJsonError ? "true" : "false"}
                aria-describedby={
                  argsJsonError ? "exec-additional-args-json-error" : undefined
                }
                spellCheck={false}
              />
              {argsJsonError ? (
                <EditorHint
                  id="exec-additional-args-json-error"
                  role="alert"
                  style={{ color: "#c62828" }}
                >
                  {argsJsonError}
                </EditorHint>
              ) : (
                <EditorHint>
                  Must be a single JSON object. Empty or {"{}"} is fine.
                </EditorHint>
              )}
            </ModalStack>
          </ModalBody>
          <ModalFooter>
            <DialogCancelButton type="button" onClick={onClose}>
              Cancel
            </DialogCancelButton>
            <DialogPrimaryButton type="submit">Execute</DialogPrimaryButton>
          </ModalFooter>
        </form>
      </ModalPanel>
    </ModalBackdrop>
  );
}

ExecutionInputDialog.propTypes = {
  dialog: PropTypes.shape({
    isOpen: PropTypes.bool.isRequired,
    workflowName: PropTypes.string,
  }).isRequired,
  graph: PropTypes.shape({
    nodes: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  handlers: PropTypes.shape({
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
  }).isRequired,
};

export { ExecutionInputDialog as default };
