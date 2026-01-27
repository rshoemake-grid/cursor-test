/**
 * Database Node Editor Component
 * Handles editing of database node properties
 * Follows Single Responsibility Principle
 */

import { NodeWithData } from '../../types/nodeData'

interface DatabaseNodeEditorProps {
  node: NodeWithData & { type: 'database' }
  onConfigUpdate: (configField: string, field: string, value: unknown) => void
}

export default function DatabaseNodeEditor({
  node,
  onConfigUpdate
}: DatabaseNodeEditorProps) {
  const inputConfig = node.data.input_config || {}

  return (
    <div className="border-t pt-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Database Configuration</h4>
      
      <div>
        <label htmlFor="database-type" className="block text-sm font-medium text-gray-700 mb-1">Database Type</label>
        <select
          id="database-type"
          value={inputConfig.database_type || 'postgresql'}
          onChange={(e) =>
            onConfigUpdate('input_config', 'database_type', e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="postgresql">PostgreSQL</option>
          <option value="mysql">MySQL</option>
          <option value="sqlite">SQLite</option>
          <option value="mongodb">MongoDB</option>
          <option value="mssql">Microsoft SQL Server</option>
          <option value="oracle">Oracle</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Type of database to connect to
        </p>
      </div>

      <div className="mt-3">
        <label htmlFor="database-mode" className="block text-sm font-medium text-gray-700 mb-1">Connection Mode</label>
        <select
          id="database-mode"
          value={inputConfig.mode || 'read'}
          onChange={(e) =>
            onConfigUpdate('input_config', 'mode', e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="read">Read</option>
          <option value="write">Write</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Whether to read from or write to the database
        </p>
      </div>

      <div className="mt-3">
        <label htmlFor="database-connection-string" className="block text-sm font-medium text-gray-700 mb-1">Connection String (optional)</label>
        <textarea
          id="database-connection-string"
          value={inputConfig.connection_string || ''}
          onChange={(e) =>
            onConfigUpdate('input_config', 'connection_string', e.target.value)
          }
          placeholder="postgresql://user:password@host:port/database"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Full connection string. If provided, individual connection fields are ignored.
        </p>
      </div>

      <div className="border-t border-gray-200 pt-3 mt-3">
        <p className="text-xs font-semibold text-gray-700 mb-2">Or specify individual fields:</p>
      </div>

      <div className="mt-3">
        <label htmlFor="database-host" className="block text-sm font-medium text-gray-700 mb-1">Host</label>
        <input
          id="database-host"
          type="text"
          value={inputConfig.host || ''}
          onChange={(e) =>
            onConfigUpdate('input_config', 'host', e.target.value)
          }
          placeholder="localhost"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="mt-3">
        <label htmlFor="database-port" className="block text-sm font-medium text-gray-700 mb-1">Port</label>
        <input
          id="database-port"
          type="number"
          value={inputConfig.port || ''}
          onChange={(e) =>
            onConfigUpdate('input_config', 'port', e.target.value ? parseInt(e.target.value) : undefined)
          }
          placeholder="5432"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="mt-3">
        <label htmlFor="database-name" className="block text-sm font-medium text-gray-700 mb-1">Database Name</label>
        <input
          id="database-name"
          type="text"
          value={inputConfig.database_name || ''}
          onChange={(e) =>
            onConfigUpdate('input_config', 'database_name', e.target.value)
          }
          placeholder="mydatabase"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="mt-3">
        <label htmlFor="database-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
        <input
          id="database-username"
          type="text"
          value={inputConfig.username || ''}
          onChange={(e) =>
            onConfigUpdate('input_config', 'username', e.target.value)
          }
          placeholder="dbuser"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="mt-3">
        <label htmlFor="database-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          id="database-password"
          type="password"
          value={inputConfig.password || ''}
          onChange={(e) =>
            onConfigUpdate('input_config', 'password', e.target.value)
          }
          placeholder="••••••••"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Password will be stored securely
        </p>
      </div>

      <div className="mt-3">
        <label htmlFor="database-query" className="block text-sm font-medium text-gray-700 mb-1">Query / SQL Statement</label>
        <textarea
          id="database-query"
          value={inputConfig.query || ''}
          onChange={(e) =>
            onConfigUpdate('input_config', 'query', e.target.value)
          }
          placeholder="SELECT * FROM users WHERE id = ?"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          SQL query to execute. Use ? for parameterized queries.
        </p>
      </div>

      <div className="mt-3">
        <label htmlFor="database-ssl-mode" className="block text-sm font-medium text-gray-700 mb-1">SSL Mode</label>
        <select
          id="database-ssl-mode"
          value={inputConfig.ssl_mode || 'prefer'}
          onChange={(e) =>
            onConfigUpdate('input_config', 'ssl_mode', e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="disable">Disable</option>
          <option value="allow">Allow</option>
          <option value="prefer">Prefer</option>
          <option value="require">Require</option>
          <option value="verify-ca">Verify CA</option>
          <option value="verify-full">Verify Full</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          SSL/TLS connection mode
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
        <p className="text-xs text-blue-900 font-medium mb-1">💾 Database Node</p>
        <p className="text-xs text-blue-700">
          This node connects to a database and executes SQL queries. Use parameterized queries (?) for security.
        </p>
      </div>
    </div>
  )
}
