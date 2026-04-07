import { Plus, Trash2 } from "lucide-react";
import { coalesceString } from "../../utils/nullCoalescing";
import { isNonEmptyArray, isNotEmpty } from "../../utils/nullChecks";
import {
  EditorSectionRoot,
  EditorLabel,
  EditorInputCompact,
  EditorHint,
} from "../../styles/editorForm.styled";
import {
  ModalBackdrop,
  ModalPanel,
  ModalBody,
  DialogCancelButtonSm,
  DialogPrimaryButtonSm,
} from "../../styles/modalDialog.styled";
import {
  InputConfigHeaderRow,
  InputConfigSectionLabel,
  InputConfigAddButton,
  InputConfigList,
  InputConfigCard,
  InputConfigCardHeader,
  InputConfigCardName,
  InputConfigRemoveButton,
  InputConfigFieldStack,
  InputConfigFieldLabel,
  InputConfigInlineInput,
  InputConfigModalTitle,
  InputConfigModalFormStack,
  InputConfigModalFooter,
  InputConfigTip,
} from "../../styles/inputConfiguration.styled";
function InputConfiguration({
  inputs,
  showAddInput,
  onAddInput,
  onRemoveInput,
  onUpdateInput,
  onShowAddInput,
}) {
  const safeInputs = isNonEmptyArray(inputs) ? inputs : [];
  return (
    <EditorSectionRoot>
      <InputConfigHeaderRow>
        <InputConfigSectionLabel>Inputs</InputConfigSectionLabel>
        <InputConfigAddButton
          type="button"
          onClick={() => onShowAddInput(true)}
          aria-label="Add input to node"
          data-testid="add-input-button"
        >
          <Plus size={12} aria-hidden />
          Add Input
        </InputConfigAddButton>
      </InputConfigHeaderRow>
      <InputConfigList>
        {safeInputs.map((input, index) => (
          <InputConfigCard key={index}>
            <InputConfigCardHeader>
              <InputConfigCardName>{input.name}</InputConfigCardName>
              <InputConfigRemoveButton
                type="button"
                onClick={() => onRemoveInput(index)}
                aria-label={`Remove input ${input.name}`}
              >
                <Trash2 size={12} aria-hidden />
              </InputConfigRemoveButton>
            </InputConfigCardHeader>
            <InputConfigFieldStack>
              <div>
                <InputConfigFieldLabel>Source Node:</InputConfigFieldLabel>
                <InputConfigInlineInput
                  type="text"
                  value={coalesceString(
                    input.source_node,
                    "(workflow variable)",
                  )}
                  onChange={(e) => {
                    const value = e.target.value;
                    onUpdateInput(
                      index,
                      "source_node",
                      isNotEmpty(value) ? value : void 0,
                    );
                  }}
                  placeholder="node_id or leave blank"
                />
              </div>
              <div>
                <InputConfigFieldLabel>Source Field:</InputConfigFieldLabel>
                <InputConfigInlineInput
                  type="text"
                  value={
                    isNotEmpty(input.source_field)
                      ? input.source_field
                      : "output"
                  }
                  onChange={(e) =>
                    onUpdateInput(index, "source_field", e.target.value)
                  }
                  placeholder="output"
                />
              </div>
            </InputConfigFieldStack>
          </InputConfigCard>
        ))}
      </InputConfigList>
      {showAddInput && (
        <ModalBackdrop
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-input-title"
        >
          <ModalPanel>
            <ModalBody $compact>
              <InputConfigModalTitle
                id="add-input-title"
                data-testid="add-input-modal-title"
              >
                Add Input
              </InputConfigModalTitle>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  onAddInput(
                    formData.get("inputName"),
                    formData.get("sourceNode"),
                    formData.get("sourceField"),
                  );
                }}
              >
                <InputConfigModalFormStack>
                  <div>
                    <EditorLabel htmlFor="add-input-name" $compact>
                      Input Name *
                    </EditorLabel>
                    <EditorInputCompact
                      id="add-input-name"
                      name="inputName"
                      type="text"
                      required={true}
                      placeholder="e.g., topic, text, data"
                    />
                    <EditorHint>
                      Name this agent will use to access the data
                    </EditorHint>
                  </div>
                  <div>
                    <EditorLabel htmlFor="add-input-source-node" $compact>
                      Source Node ID (optional)
                    </EditorLabel>
                    <EditorInputCompact
                      id="add-input-source-node"
                      name="sourceNode"
                      type="text"
                      placeholder="Leave blank for workflow input"
                    />
                    <EditorHint>
                      Get data from another node&apos;s output. Leave blank to
                      get from workflow input variables.
                    </EditorHint>
                  </div>
                  <div>
                    <EditorLabel htmlFor="add-input-source-field" $compact>
                      Source Field
                    </EditorLabel>
                    <EditorInputCompact
                      id="add-input-source-field"
                      name="sourceField"
                      type="text"
                      defaultValue="output"
                      placeholder="output"
                    />
                    <EditorHint>
                      Which field to get from the source (usually
                      &apos;output&apos;)
                    </EditorHint>
                  </div>
                </InputConfigModalFormStack>
                <InputConfigModalFooter>
                  <DialogCancelButtonSm
                    type="button"
                    onClick={() => onShowAddInput(false)}
                    aria-label="Cancel adding input"
                  >
                    Cancel
                  </DialogCancelButtonSm>
                  <DialogPrimaryButtonSm
                    type="submit"
                    aria-label="Add input to node"
                    data-testid="add-input-submit-button"
                  >
                    Add Input
                  </DialogPrimaryButtonSm>
                </InputConfigModalFooter>
              </form>
            </ModalBody>
          </ModalPanel>
        </ModalBackdrop>
      )}
      <InputConfigTip>
        💡 Inputs connect this node to data from previous nodes or workflow
        variables
      </InputConfigTip>
    </EditorSectionRoot>
  );
}
export { InputConfiguration };
