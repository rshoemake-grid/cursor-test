import { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  CONDITION_TYPES,
  isValidConditionType,
} from "../../constants/stringLiterals";
import { getDefaultConditionConfig } from "./condition/conditionValidation";
import {
  EditorFieldGroup,
  EditorLabel,
  EditorSelect,
  EditorInput,
} from "../../styles/editorForm.styled";
function ConditionNodeEditor({ node, onConfigUpdate }) {
  const conditionFieldRef = useRef(null);
  const conditionValueRef = useRef(null);
  const [conditionFieldValue, setConditionFieldValue] = useState("");
  const [conditionValueValue, setConditionValueValue] = useState("");
  useEffect(() => {
    const hasConfig2 =
      node.data.condition_config !== null &&
      node.data.condition_config !== void 0;
    const conditionConfig2 =
      hasConfig2 === true
        ? node.data.condition_config
        : getDefaultConditionConfig();
    const isFieldActive = document.activeElement === conditionFieldRef.current;
    if (isFieldActive === false) {
      const hasField =
        conditionConfig2.field !== null &&
        conditionConfig2.field !== void 0 &&
        conditionConfig2.field !== "";
      const fieldValue = hasField === true ? conditionConfig2.field : "";
      setConditionFieldValue(fieldValue);
    }
    const isValueActive = document.activeElement === conditionValueRef.current;
    if (isValueActive === false) {
      const hasValue =
        conditionConfig2.value !== null &&
        conditionConfig2.value !== void 0 &&
        conditionConfig2.value !== "";
      const valueValue = hasValue === true ? conditionConfig2.value : "";
      setConditionValueValue(valueValue);
    }
  }, [node.data.condition_config]);
  const hasConfig =
    node.data.condition_config !== null &&
    node.data.condition_config !== void 0;
  const conditionConfig =
    hasConfig === true
      ? node.data.condition_config
      : getDefaultConditionConfig();
  const hasConditionType =
    conditionConfig.condition_type !== null &&
    conditionConfig.condition_type !== void 0;
  const conditionTypeValue =
    hasConditionType === true ? conditionConfig.condition_type : "";
  const isValidType =
    hasConditionType === true &&
    isValidConditionType(conditionTypeValue) === true;
  const conditionType =
    isValidType === true ? conditionTypeValue : CONDITION_TYPES.EQUALS;
  const isNotEmpty = conditionType !== CONDITION_TYPES.EMPTY;
  const isNotNotEmpty = conditionType !== CONDITION_TYPES.NOT_EMPTY;
  const showValueField = isNotEmpty === true && isNotNotEmpty === true;
  return (
    <>
      <EditorFieldGroup>
        <EditorLabel htmlFor="condition-type">Condition Type</EditorLabel>
        <EditorSelect
          id="condition-type"
          value={conditionType}
          onChange={(e) =>
            onConfigUpdate("condition_config", "condition_type", e.target.value)
          }
          aria-label="Select condition type"
        >
          <option value={CONDITION_TYPES.EQUALS}>Equals</option>
          <option value={CONDITION_TYPES.NOT_EQUALS}>Not Equals</option>
          <option value={CONDITION_TYPES.CONTAINS}>Contains</option>
          <option value={CONDITION_TYPES.NOT_CONTAINS}>Not Contains</option>
          <option value={CONDITION_TYPES.GREATER_THAN}>Greater Than</option>
          <option value={CONDITION_TYPES.NOT_GREATER_THAN}>
            Not Greater Than
          </option>
          <option value={CONDITION_TYPES.LESS_THAN}>Less Than</option>
          <option value={CONDITION_TYPES.NOT_LESS_THAN}>Not Less Than</option>
          <option value={CONDITION_TYPES.EMPTY}>Empty</option>
          <option value={CONDITION_TYPES.NOT_EMPTY}>Not Empty</option>
          <option value={CONDITION_TYPES.CUSTOM}>Custom</option>
        </EditorSelect>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="md">
        <EditorLabel htmlFor="condition-field">Field</EditorLabel>
        <EditorInput
          id="condition-field"
          ref={conditionFieldRef}
          type="text"
          value={conditionFieldValue}
          onChange={(e) => {
            const newValue = e.target.value;
            setConditionFieldValue(newValue);
            onConfigUpdate("condition_config", "field", newValue);
          }}
          placeholder="Field to check"
          aria-label="Field name to check in condition"
        />
      </EditorFieldGroup>
      {showValueField === true && (
        <EditorFieldGroup $mt="md">
          <EditorLabel htmlFor="condition-value">Value</EditorLabel>
          <EditorInput
            id="condition-value"
            ref={conditionValueRef}
            type="text"
            value={conditionValueValue}
            onChange={(e) => {
              const newValue = e.target.value;
              setConditionValueValue(newValue);
              onConfigUpdate("condition_config", "value", newValue);
            }}
            placeholder="Value to compare"
            aria-label="Value to compare against field"
          />
        </EditorFieldGroup>
      )}
    </>
  );
}
ConditionNodeEditor.propTypes = {
  node: PropTypes.object.isRequired,
  onConfigUpdate: PropTypes.func.isRequired,
};

export { ConditionNodeEditor as default };
