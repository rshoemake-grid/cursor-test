/**
 * Firebase Node Editor Component
 * Handles editing of Firebase node properties
 * Follows Single Responsibility Principle
 */

import { NodeWithData } from '../../types/nodeData'

interface FirebaseNodeEditorProps {
  node: NodeWithData & { type: 'firebase' }
  onConfigUpdate: (configField: string, field: string, value: unknown) => void
}

export default function FirebaseNodeEditor({
  node,
  onConfigUpdate
}: FirebaseNodeEditorProps) {
  const inputConfig = node.data.input_config || {}

  return (
    <div className="border-t pt-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Firebase Configuration</h4>
      
      <div>
        <label htmlFor="firebase-service" className="block text-sm font-medium text-gray-700 mb-1">Firebase Service</label>
        <select
          id="firebase-service"
          value={inputConfig.firebase_service || 'firestore'}
          onChange={(e) =>
            onConfigUpdate('input_config', 'firebase_service', e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="firestore">Firestore (NoSQL Database)</option>
          <option value="realtime_db">Realtime Database</option>
          <option value="storage">Firebase Storage</option>
          <option value="auth">Firebase Authentication</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Select which Firebase service to use
        </p>
      </div>

      <div className="mt-3">
        <label htmlFor="firebase-project-id" className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
        <input
          id="firebase-project-id"
          type="text"
          value={inputConfig.project_id || ''}
          onChange={(e) =>
            onConfigUpdate('input_config', 'project_id', e.target.value)
          }
          placeholder="my-firebase-project"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Your Firebase project ID
        </p>
      </div>

      <div className="mt-3">
        <label htmlFor="firebase-mode" className="block text-sm font-medium text-gray-700 mb-1">Connection Mode</label>
        <select
          id="firebase-mode"
          value={inputConfig.mode || 'read'}
          onChange={(e) =>
            onConfigUpdate('input_config', 'mode', e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="read">Read</option>
          <option value="write">Write</option>
        </select>
      </div>

      {(inputConfig.firebase_service === 'firestore' || 
        inputConfig.firebase_service === 'realtime_db') && (
        <>
          <div className="mt-3">
            <label htmlFor="firebase-collection-path" className="block text-sm font-medium text-gray-700 mb-1">Collection / Path</label>
            <input
              id="firebase-collection-path"
              type="text"
              value={inputConfig.collection_path || ''}
              onChange={(e) =>
                onConfigUpdate('input_config', 'collection_path', e.target.value)
              }
              placeholder="users or users/{userId}/posts"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Firestore collection path or Realtime DB path
            </p>
          </div>

          {inputConfig.mode === 'read' && (
            <div className="mt-3">
              <label htmlFor="firebase-query-filter" className="block text-sm font-medium text-gray-700 mb-1">Query Filter (optional)</label>
              <textarea
                id="firebase-query-filter"
                value={inputConfig.query_filter || ''}
                onChange={(e) =>
                  onConfigUpdate('input_config', 'query_filter', e.target.value)
                }
                placeholder='{"field": "value"} or JSON query'
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                JSON filter for querying documents
              </p>
            </div>
          )}
        </>
      )}

      {inputConfig.firebase_service === 'storage' && (
        <>
          <div className="mt-3">
            <label htmlFor="firebase-bucket-name" className="block text-sm font-medium text-gray-700 mb-1">Bucket Name</label>
            <input
              id="firebase-bucket-name"
              type="text"
              value={inputConfig.bucket_name || ''}
              onChange={(e) =>
                onConfigUpdate('input_config', 'bucket_name', e.target.value)
              }
              placeholder="my-firebase-storage.appspot.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="mt-3">
            <label htmlFor="firebase-file-path" className="block text-sm font-medium text-gray-700 mb-1">File Path</label>
            <input
              id="firebase-file-path"
              type="text"
              value={inputConfig.file_path || ''}
              onChange={(e) =>
                onConfigUpdate('input_config', 'file_path', e.target.value)
              }
              placeholder="images/photo.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </>
      )}

      <div className="mt-3">
        <label htmlFor="firebase-credentials" className="block text-sm font-medium text-gray-700 mb-1">Service Account Credentials (JSON)</label>
        <textarea
          id="firebase-credentials"
          value={inputConfig.credentials || ''}
          onChange={(e) =>
            onConfigUpdate('input_config', 'credentials', e.target.value)
          }
          placeholder='{"type": "service_account", ...}'
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Firebase service account JSON credentials. Leave blank to use default credentials.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
        <p className="text-xs text-blue-900 font-medium mb-1">🔥 Firebase Node</p>
        <p className="text-xs text-blue-700">
          Connect to Firebase services. Supports Firestore, Realtime Database, Storage, and Authentication.
        </p>
      </div>
    </div>
  )
}
