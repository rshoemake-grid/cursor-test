/**
 * BigQuery Node Editor Component
 * Handles editing of BigQuery node properties
 * Follows Single Responsibility Principle
 */

import { NodeWithData } from '../../types/nodeData'

interface BigQueryNodeEditorProps {
  node: NodeWithData & { type: 'bigquery' }
  onConfigUpdate: (configField: string, field: string, value: unknown) => void
}

export default function BigQueryNodeEditor({
  node,
  onConfigUpdate
}: BigQueryNodeEditorProps) {
  const inputConfig = node.data.input_config || {}

  return (
    <div className="border-t pt-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">BigQuery Configuration</h4>
      
      <div>
        <label htmlFor="bigquery-project-id" className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
        <input
          id="bigquery-project-id"
          type="text"
          value={inputConfig.project_id || ''}
          onChange={(e) =>
            onConfigUpdate('input_config', 'project_id', e.target.value)
          }
          placeholder="my-gcp-project"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Your Google Cloud project ID
        </p>
      </div>

      <div className="mt-3">
        <label htmlFor="bigquery-mode" className="block text-sm font-medium text-gray-700 mb-1">Connection Mode</label>
        <select
          id="bigquery-mode"
          value={inputConfig.mode || 'read'}
          onChange={(e) =>
            onConfigUpdate('input_config', 'mode', e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="read">Read (Query)</option>
          <option value="write">Write (Insert/Update)</option>
        </select>
      </div>

      <div className="mt-3">
        <label htmlFor="bigquery-dataset" className="block text-sm font-medium text-gray-700 mb-1">Dataset</label>
        <input
          id="bigquery-dataset"
          type="text"
          value={inputConfig.dataset || ''}
          onChange={(e) =>
            onConfigUpdate('input_config', 'dataset', e.target.value)
          }
          placeholder="my_dataset"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          BigQuery dataset name
        </p>
      </div>

      {inputConfig.mode === 'read' && (
        <div className="mt-3">
          <label htmlFor="bigquery-query" className="block text-sm font-medium text-gray-700 mb-1">SQL Query</label>
          <textarea
            id="bigquery-query"
            value={inputConfig.query || ''}
            onChange={(e) =>
              onConfigUpdate('input_config', 'query', e.target.value)
            }
            placeholder="SELECT * FROM `project.dataset.table` LIMIT 100"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Standard SQL query to execute
          </p>
        </div>
      )}

      {inputConfig.mode === 'write' && (
        <>
          <div className="mt-3">
            <label htmlFor="bigquery-table" className="block text-sm font-medium text-gray-700 mb-1">Table</label>
            <input
              id="bigquery-table"
              type="text"
              value={inputConfig.table || ''}
              onChange={(e) =>
                onConfigUpdate('input_config', 'table', e.target.value)
              }
              placeholder="my_table"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Target table for insert/update operations
            </p>
          </div>

          <div className="mt-3">
            <label htmlFor="bigquery-write-disposition" className="block text-sm font-medium text-gray-700 mb-1">Write Disposition</label>
            <select
              id="bigquery-write-disposition"
              value={inputConfig.write_disposition || 'append'}
              onChange={(e) =>
                onConfigUpdate('input_config', 'write_disposition', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="append">Append</option>
              <option value="truncate">Truncate and Write</option>
              <option value="merge">Merge (Upsert)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              How to handle existing data in the table
            </p>
          </div>
        </>
      )}

      <div className="mt-3">
        <label htmlFor="bigquery-location" className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
        <input
          id="bigquery-location"
          type="text"
          value={inputConfig.location || ''}
          onChange={(e) =>
            onConfigUpdate('input_config', 'location', e.target.value)
          }
          placeholder="US or EU"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          BigQuery dataset location (US, EU, etc.). Leave blank for default.
        </p>
      </div>

      <div className="mt-3">
        <label htmlFor="bigquery-credentials" className="block text-sm font-medium text-gray-700 mb-1">Service Account Credentials (JSON)</label>
        <textarea
          id="bigquery-credentials"
          value={inputConfig.credentials || ''}
          onChange={(e) =>
            onConfigUpdate('input_config', 'credentials', e.target.value)
          }
          placeholder='{"type": "service_account", ...}'
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Google Cloud service account JSON credentials. Leave blank to use default credentials.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
        <p className="text-xs text-blue-900 font-medium mb-1">📊 BigQuery Node</p>
        <p className="text-xs text-blue-700">
          Query and write data to Google BigQuery data warehouse. Supports standard SQL queries and data loading.
        </p>
      </div>
    </div>
  )
}
