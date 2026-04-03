import { useRef } from "react";
import { useFormField } from "../../hooks/forms";
import { useInputTypeHandler } from "../../hooks/forms/useInputTypeHandler";
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
  const baseInputClasses =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent";
  const disabledClasses = disabled ? "bg-gray-100 cursor-not-allowed" : "";
  const renderInput = () => {
    const commonProps = {
      id,
      ref: inputRef,
      value,
      onChange: handleInputChange,
      disabled,
      required,
      "aria-label": ariaLabel || label,
      className: `${baseInputClasses} ${disabledClasses} ${className}`,
    };
    switch (type) {
      case "textarea":
        return (
          <textarea {...commonProps} placeholder={placeholder} rows={rows} />
        );
      case "select":
        return (
          <select {...commonProps}>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <input
              {...commonProps}
              type="checkbox"
              checked={value}
              className="w-4 h-4"
            />
            {description && (
              <span className="text-sm text-gray-600">{description}</span>
            )}
          </div>
        );
      default:
        return (
          <input
            {...commonProps}
            type={type}
            placeholder={placeholder}
            min={min}
            max={max}
          />
        );
    }
  };
  return (
    <div className="mb-4">
      {type !== "checkbox" && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {description && type !== "checkbox" && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );
}
export { FormField };
