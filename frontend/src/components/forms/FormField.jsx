import { jsx, jsxs } from "react/jsx-runtime";
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
  "aria-label": ariaLabel
}) {
  const useHook = syncWithNodeData && nodeData && dataPath;
  const fieldHook = useFormField({
    initialValue: controlledValue,
    onUpdate: onChange,
    nodeData: useHook ? nodeData : void 0,
    dataPath: useHook ? dataPath : void 0,
    syncWithNodeData: useHook ? true : false
  });
  const fallbackRef = useRef(null);
  const value = useHook ? fieldHook.value : controlledValue;
  const inputRef = useHook ? fieldHook.inputRef : fallbackRef;
  const handleInputChange = useInputTypeHandler(type, onChange);
  const baseInputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent";
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
      className: `${baseInputClasses} ${disabledClasses} ${className}`
    };
    switch (type) {
      case "textarea":
        return /* @__PURE__ */ jsx(
          "textarea",
          {
            ...commonProps,
            placeholder,
            rows
          }
        );
      case "select":
        return /* @__PURE__ */ jsx("select", { ...commonProps, children: options?.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value)) });
      case "checkbox":
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              ...commonProps,
              type: "checkbox",
              checked: value,
              className: "w-4 h-4"
            }
          ),
          description && /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: description })
        ] });
      default:
        return /* @__PURE__ */ jsx(
          "input",
          {
            ...commonProps,
            type,
            placeholder,
            min,
            max
          }
        );
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
    type !== "checkbox" && /* @__PURE__ */ jsxs(
      "label",
      {
        htmlFor: id,
        className: "block text-sm font-medium text-gray-700 mb-1",
        children: [
          label,
          required && /* @__PURE__ */ jsx("span", { className: "text-red-500 ml-1", children: "*" })
        ]
      }
    ),
    renderInput(),
    description && type !== "checkbox" && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: description })
  ] });
}
export {
  FormField
};
