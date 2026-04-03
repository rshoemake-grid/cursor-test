import { Handle, Position } from "@xyflow/react";
import { Wrench } from "lucide-react";
function ToolNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  const toolName = data.tool_config?.tool_name || data.tool_name || "Tool";
  return (
    <div
      className={`relative px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[200px] max-w-[200px] ${hasError ? "border-red-500 border-4 shadow-xl ring-2 ring-red-200" : selected ? "border-primary-500 border-4 shadow-xl ring-2 ring-primary-200" : "border-gray-300"}`}
    >
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
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-amber-100 rounded flex-shrink-0">
          <Wrench className="w-4 h-4 text-amber-600" />
        </div>
        <div className="font-semibold text-sm text-gray-900 truncate flex-1 min-w-0">
          {String(data.label || toolName)}
        </div>
      </div>
      {data.description != null && (
        <div className="text-xs text-gray-500 mb-2 line-clamp-2 overflow-hidden">
          {String(data.description)}
        </div>
      )}
      <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded truncate">
        {toolName}
      </div>
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
export { ToolNode as default };
