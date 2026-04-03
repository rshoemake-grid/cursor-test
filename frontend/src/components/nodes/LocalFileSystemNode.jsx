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
  return (
    <div
      className={`relative px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[200px] max-w-[200px] ${hasError ? "border-red-500 border-4 shadow-xl ring-2 ring-red-200" : selected ? "border-green-500 border-4 shadow-xl ring-2 ring-green-200" : "border-green-300"}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-green-100 rounded flex-shrink-0">
          <Folder className="w-4 h-4 text-green-600" />
        </div>
        <div className="font-semibold text-sm text-gray-900 truncate flex-1 min-w-0">
          {String(data.label || "Local File System")}
        </div>
      </div>
      {data.description && (
        <div className="text-xs text-gray-500 mb-2 line-clamp-2 overflow-hidden">
          {String(data.description)}
        </div>
      )}
      {data.input_config?.file_path && (
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1 truncate">
          File: {getFilename(data.input_config.file_path)}
        </div>
      )}
      {data.input_config?.file_pattern && (
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1 truncate">
          Pattern: {data.input_config.file_pattern}
        </div>
      )}
      {data.input_config?.mode && (
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded truncate">
          Mode: {data.input_config.mode === "write" ? "Write" : "Read"}
          {data.input_config.mode === "write" &&
            data.input_config.overwrite === false && (
              <span className="ml-1">(Auto-increment)</span>
            )}
        </div>
      )}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="w-3 h-3"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="w-3 h-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="w-3 h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="w-3 h-3"
      />
    </div>
  );
}
export { LocalFileSystemNode as default };
