import { jsx, jsxs } from "react/jsx-runtime";
import { Handle, Position } from "@xyflow/react";
import { Folder } from "lucide-react";
const getFilename = (path) => {
  if (!path) return "";
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/").filter((p) => p);
  return parts[parts.length - 1] || path;
};
function LocalFileSystemNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[200px] max-w-[200px] ${hasError ? "border-red-500 border-4 shadow-xl ring-2 ring-red-200" : selected ? "border-green-500 border-4 shadow-xl ring-2 ring-green-200" : "border-green-300"}`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-green-100 rounded flex-shrink-0", children: /* @__PURE__ */ jsx(Folder, { className: "w-4 h-4 text-green-600" }) }),
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm text-gray-900 truncate flex-1 min-w-0", children: String(data.label || "Local File System") })
        ] }),
        data.description && /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500 mb-2 line-clamp-2 overflow-hidden", children: String(data.description) }),
        data.input_config?.file_path && /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1 truncate", children: [
          "File: ",
          getFilename(data.input_config.file_path)
        ] }),
        data.input_config?.file_pattern && /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1 truncate", children: [
          "Pattern: ",
          data.input_config.file_pattern
        ] }),
        data.input_config?.mode && /* @__PURE__ */ jsxs("div", { className: "text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded truncate", children: [
          "Mode: ",
          data.input_config.mode === "write" ? "Write" : "Read",
          data.input_config.mode === "write" && data.input_config.overwrite === false && /* @__PURE__ */ jsx("span", { className: "ml-1", children: "(Auto-increment)" })
        ] }),
        /* @__PURE__ */ jsx(Handle, { type: "target", position: Position.Top, className: "w-3 h-3" }),
        /* @__PURE__ */ jsx(Handle, { type: "source", position: Position.Bottom, className: "w-3 h-3" })
      ]
    }
  );
}
export {
  LocalFileSystemNode as default
};
