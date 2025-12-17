import { Bot, GitBranch, RotateCw, Play, Flag, Database, Radio, Folder } from 'lucide-react'

const nodeTemplates = [
  { type: 'start', label: 'Start', icon: Play, color: 'text-primary-600', description: 'Workflow entry point' },
  { type: 'agent', label: 'Agent', icon: Bot, color: 'text-blue-600', description: 'LLM-powered agent' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: 'text-purple-600', description: 'If/else branching' },
  { type: 'loop', label: 'Loop', icon: RotateCw, color: 'text-green-600', description: 'Iterate over items' },
  { type: 'end', label: 'End', icon: Flag, color: 'text-gray-600', description: 'Workflow completion' },
]

const inputSourceTemplates = [
  { type: 'gcp_bucket', label: 'GCP Bucket', icon: Database, color: 'text-orange-600', description: 'Read from Google Cloud Storage bucket' },
  { type: 'aws_s3', label: 'AWS S3', icon: Database, color: 'text-yellow-600', description: 'Read from AWS S3 bucket' },
  { type: 'gcp_pubsub', label: 'GCP Pub/Sub', icon: Radio, color: 'text-purple-600', description: 'Subscribe to GCP Pub/Sub topic' },
  { type: 'local_filesystem', label: 'Local File', icon: Folder, color: 'text-green-600', description: 'Read from local file system' },
]

export default function NodePanel() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Node Palette</h3>
      <p className="text-sm text-gray-600 mb-4">Drag nodes onto the canvas</p>
      
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Workflow Nodes</div>
        {nodeTemplates.map((template) => {
          const Icon = template.icon
          return (
            <div
              key={template.type}
              draggable
              onDragStart={(e) => onDragStart(e, template.type)}
              className="p-3 border-2 border-gray-200 rounded-lg cursor-move hover:border-primary-400 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${template.color}`} />
                <span className="font-medium text-sm text-gray-900">{template.label}</span>
              </div>
              <p className="text-xs text-gray-500">{template.description}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Input Sources</div>
        {inputSourceTemplates.map((template) => {
          const Icon = template.icon
          return (
            <div
              key={template.type}
              draggable
              onDragStart={(e) => onDragStart(e, template.type)}
              className="p-3 border-2 border-gray-200 rounded-lg cursor-move hover:border-primary-400 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${template.color}`} />
                <span className="font-medium text-sm text-gray-900">{template.label}</span>
              </div>
              <p className="text-xs text-gray-500">{template.description}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-xs font-semibold text-blue-900 mb-1">💡 Tip</h4>
        <p className="text-xs text-blue-700">
          Connect nodes by dragging from the circles (handles) on each node.
        </p>
      </div>
    </div>
  )
}

