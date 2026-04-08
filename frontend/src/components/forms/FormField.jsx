import { useRef } from "react";
import PropTypes from "prop-types";
import { useFormField } from "../../hooks/forms";
import { useInputTypeHandler } from "../../hooks/forms/useInputTypeHandler";
import {
  FormFieldRoot,
  FormFieldLabel,
  FormFieldRequired,
  FormFieldDescription,
  FormFieldTextInput,
  FormFieldTextarea,
  FormFieldSelect,
  FormFieldCheckboxRow,
  FormFieldCheckbox,
  FormFieldCheckboxHint,
} from "../../styles/formField.styled";

function FormField({
  label,
  id,
  value: controlledValue,
  onChange,
  type = "text",
  placeholder,
  description,
  options,
  required = false,
  disabled = false,
  className = "",
  nodeData,
  dataPath,
  syncWithNodeData = false,
  min,
  max,
  rows = 4,
  "aria-label": ariaLabel,
}) {
  const useHook = syncWithNodeData && nodeData && dataPath;
  const fieldHook = useFormField({
    initialValue: controlledValue,
    onUpdate: onChange,
    nodeData: useHook ? nodeData : void 0,
    dataPath: useHook ? dataPath : void 0,
    syncWithNodeData: useHook ? true : false,
  });
  const fallbackRef = useRef(null);
  const value = useHook ? fieldHook.value : controlledValue;
  const inputRef = useHook ? fieldHook.inputRef : fallbackRef;
  const handleInputChange = useInputTypeHandler(type, onChange);
  const renderInput = () => {
    const aria = ariaLabel || label;
    switch (type) {
      case "textarea":
        return (
          <FormFieldTextarea
            id={id}
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            disabled={disabled}
            required={required}
            aria-label={aria}
            className={className}
            placeholder={placeholder}
            rows={rows}
          />
        );
      case "select":
        return (
          <FormFieldSelect
            id={id}
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            disabled={disabled}
            required={required}
            aria-label={aria}
            className={className}
          >
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormFieldSelect>
        );
      case "checkbox":
        return (
          <FormFieldCheckboxRow>
            <FormFieldCheckbox
              id={id}
              ref={inputRef}
              type="checkbox"
              checked={value}
              onChange={handleInputChange}
              disabled={disabled}
              required={required}
              aria-label={aria}
            />
            {description && (
              <FormFieldCheckboxHint>{description}</FormFieldCheckboxHint>
            )}
          </FormFieldCheckboxRow>
        );
      default:
        return (
          <FormFieldTextInput
            id={id}
            ref={inputRef}
            type={type}
            value={value}
            onChange={handleInputChange}
            disabled={disabled}
            required={required}
            aria-label={aria}
            className={className}
            placeholder={placeholder}
            min={min}
            max={max}
          />
        );
    }
  };
  return (
    <FormFieldRoot>
      {type !== "checkbox" && (
        <FormFieldLabel htmlFor={id}>
          {label}
          {required && <FormFieldRequired>*</FormFieldRequired>}
        </FormFieldLabel>
      )}
      {renderInput()}
      {description && type !== "checkbox" && (
        <FormFieldDescription>{description}</FormFieldDescription>
      )}
    </FormFieldRoot>
  );
}

FormField.propTypes = {
  label: PropTypes.node,
  id: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  description: PropTypes.node,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.node.isRequired,
    }),
  ),
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  nodeData: PropTypes.object,
  dataPath: PropTypes.string,
  syncWithNodeData: PropTypes.bool,
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  rows: PropTypes.number,
  "aria-label": PropTypes.string,
};

export { FormField };
