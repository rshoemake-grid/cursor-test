import { useState, useEffect } from "react";
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
function ExecutionInputDialog({
  isOpen,
  onClose,
  onSubmit,
  nodes,
  workflowName,
}) {
  const [inputs, setInputs] = useState({});
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
    } else {
      setInputs({});
    }
  }, [isOpen, nodes]);
  if (!isOpen) return null;
  const inputNodes = nodes.filter(
    (node) => node.type === "start" && node.input_config,
  );
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(inputs);
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
                This workflow does not require any inputs. Click Execute to run
                it.
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
export { ExecutionInputDialog as default };
