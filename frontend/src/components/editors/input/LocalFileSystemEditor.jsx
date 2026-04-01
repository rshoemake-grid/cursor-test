import { jsx, jsxs } from "react/jsx-runtime";
import { useRef } from "react";
import { useInputFieldSync, useInputFieldSyncSimple } from "../../../hooks/utils/useInputFieldSync";
import { INPUT_MODE, EMPTY_STRING, DEFAULT_OVERWRITE } from "../../../hooks/utils/inputDefaults";
import { createTextInputHandler, createSelectHandler, createCheckboxHandler } from "../../../hooks/utils/inputEditorHelpers";
import { CONFIG_FIELD } from "./inputEditorConstants";
function LocalFileSystemEditor({
  node,
  onConfigUpdate
}) {
  const inputConfig = node.data.input_config || {};
  const filePathRef = useRef(null);
  const filePatternRef = useRef(null);
  const [filePathValue, setFilePathValue] = useInputFieldSync(
    filePathRef,
    inputConfig.file_path,
    EMPTY_STRING
  );
  const [filePatternValue, setFilePatternValue] = useInputFieldSync(
    filePatternRef,
    inputConfig.file_pattern,
    EMPTY_STRING
  );
  const [modeValue, setModeValue] = useInputFieldSyncSimple(
    inputConfig.mode,
    INPUT_MODE.READ
  );
  const [overwriteValue, setOverwriteValue] = useInputFieldSyncSimple(
    inputConfig.overwrite,
    DEFAULT_OVERWRITE
  );
  return /* @__PURE__ */ jsxs("div", { className: "border-t pt-4", children: [
    /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-gray-900 mb-3", children: "Local File System Configuration" }),
    /* @__PURE__ */ jsxs("div", { className: "mb-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "filesystem-mode", className: "block text-sm font-medium text-gray-700 mb-1", children: "Mode" }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          id: "filesystem-mode",
          value: modeValue,
          onChange: createSelectHandler(setModeValue, onConfigUpdate, CONFIG_FIELD, "mode"),
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          "aria-label": "Select file system operation mode",
          children: [
            /* @__PURE__ */ jsx("option", { value: INPUT_MODE.READ, children: "Read from file" }),
            /* @__PURE__ */ jsx("option", { value: INPUT_MODE.WRITE, children: "Write to file" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "filesystem-path", className: "block text-sm font-medium text-gray-700 mb-1", children: "File Path" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "filesystem-path",
          ref: filePathRef,
          type: "text",
          value: filePathValue,
          onChange: createTextInputHandler(setFilePathValue, onConfigUpdate, CONFIG_FIELD, "file_path"),
          placeholder: "/path/to/file.txt",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          "aria-label": "File system path"
        }
      )
    ] }),
    modeValue === INPUT_MODE.READ && /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "filesystem-pattern", className: "block text-sm font-medium text-gray-700 mb-1", children: "File Pattern (optional)" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "filesystem-pattern",
          ref: filePatternRef,
          type: "text",
          value: filePatternValue,
          onChange: createTextInputHandler(setFilePatternValue, onConfigUpdate, CONFIG_FIELD, "file_pattern"),
          placeholder: "*.txt or leave blank for exact match",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          "aria-label": "File pattern for matching"
        }
      )
    ] }),
    modeValue === INPUT_MODE.WRITE && /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsxs("label", { htmlFor: "filesystem-overwrite", className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "filesystem-overwrite",
          type: "checkbox",
          checked: overwriteValue,
          onChange: createCheckboxHandler(setOverwriteValue, onConfigUpdate, CONFIG_FIELD, "overwrite"),
          className: "w-4 h-4",
          "aria-label": "Overwrite existing file"
        }
      ),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-700", children: "Overwrite existing file" })
    ] }) })
  ] });
}
export {
  LocalFileSystemEditor as default
};
