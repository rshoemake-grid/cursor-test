import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";
function ConditionNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  return (
    <div
      className={`relative px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[180px] max-w-[180px] ${hasError ? "border-red-500 border-4 shadow-xl ring-2 ring-red-200" : selected ? "border-primary-500 border-4 shadow-xl ring-2 ring-primary-200" : "border-gray-300"}`}
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
        <div className="p-1.5 bg-purple-100 rounded flex-shrink-0">
          <GitBranch className="w-4 h-4 text-purple-600" />
        </div>
        <div className="font-semibold text-sm text-gray-900 truncate flex-1 min-w-0">
          {String(data.label || "")}
        </div>
      </div>
      {data.description && (
        <div className="text-xs text-gray-500 mb-2 line-clamp-2 overflow-hidden">
          {String(data.description)}
        </div>
      )}
      {data.condition_config?.condition_type && (
        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded truncate mb-2">
          {data.condition_config.condition_type}: {data.condition_config.field}
        </div>
      )}
      <div className="relative mt-2 pt-2 border-t border-gray-200 min-h-[52px]">
        <div className="flex flex-col justify-center gap-3 py-1 pr-1">
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{
              top: "32%",
            }}
            className="w-3 h-3 !bg-green-500 !border-green-600"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{
              top: "68%",
            }}
            className="w-3 h-3 !bg-red-500 !border-red-600"
          />
          <div className="flex justify-end">
            <span className="text-xs font-medium text-green-600">True</span>
          </div>
          <div className="flex justify-end">
            <span className="text-xs font-medium text-red-600">False</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export { ConditionNode as default };
