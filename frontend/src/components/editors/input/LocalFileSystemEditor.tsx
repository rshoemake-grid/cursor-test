/**
 * Local FileSystem Editor Component
 * Single Responsibility: Only handles Local FileSystem node configuration
 * Extracted from InputNodeEditor for better SOLID compliance
 */

import { useRef } from 'react'
import { NodeWithData } from '../../../types/nodeData'
import { useInputFieldSync, useInputFieldSyncSimple } from '../../../hooks/utils/useInputFieldSync'
import { INPUT_MODE, EMPTY_STRING, DEFAULT_OVERWRITE } from '../../../hooks/utils/inputDefaults'
import { createTextInputHandler, createSelectHandler, createCheckboxHandler } from '../../../hooks/utils/inputEditorHelpers'
import { CONFIG_FIELD } from './inputEditorConstants'

interface LocalFileSystemEditorProps {
  node: NodeWithData & { type: 'local_filesystem' }
  onConfigUpdate: (configField: string, field: string, value: unknown) => void
}

export default function LocalFileSystemEditor({
  node,
  onConfigUpdate
}: LocalFileSystemEditorProps) {
  const inputConfig = node.data.input_config || {}
  
  const filePathRef = useRef<HTMLInputElement>(null)
  const filePatternRef = useRef<HTMLInputElement>(null)
  
  const [filePathValue, setFilePathValue] = useInputFieldSync(
    filePathRef,
    inputConfig.file_path,
    EMPTY_STRING
  )
  const [filePatternValue, setFilePatternValue] = useInputFieldSync(
    filePatternRef,
    inputConfig.file_pattern,
    EMPTY_STRING
  )
  const [modeValue, setModeValue] = useInputFieldSyncSimple(
    inputConfig.mode,
    INPUT_MODE.READ
  )
  const [overwriteValue, setOverwriteValue] = useInputFieldSyncSimple(
    inputConfig.overwrite,
    DEFAULT_OVERWRITE
  )

  return (
    <div className="border-t pt-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Local File System Configuration</h4>
      <div className="mb-3">
        <label htmlFor="filesystem-mode" className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
        <select
          id="filesystem-mode"
          value={modeValue}
          onChange={createSelectHandler(setModeValue, onConfigUpdate, CONFIG_FIELD, 'mode')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="Select file system operation mode"
        >
          <option value={INPUT_MODE.READ}>Read from file</option>
          <option value={INPUT_MODE.WRITE}>Write to file</option>
        </select>
      </div>
      <div>
        <label htmlFor="filesystem-path" className="block text-sm font-medium text-gray-700 mb-1">File Path</label>
        <input
          id="filesystem-path"
          ref={filePathRef}
          type="text"
          value={filePathValue}
          onChange={createTextInputHandler(setFilePathValue, onConfigUpdate, CONFIG_FIELD, 'file_path')}
          placeholder="/path/to/file.txt"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="File system path"
        />
      </div>
      {modeValue === INPUT_MODE.READ && (
        <div className="mt-3">
          <label htmlFor="filesystem-pattern" className="block text-sm font-medium text-gray-700 mb-1">File Pattern (optional)</label>
          <input
            id="filesystem-pattern"
            ref={filePatternRef}
            type="text"
            value={filePatternValue}
            onChange={createTextInputHandler(setFilePatternValue, onConfigUpdate, CONFIG_FIELD, 'file_pattern')}
            placeholder="*.txt or leave blank for exact match"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            aria-label="File pattern for matching"
          />
        </div>
      )}
      {modeValue === INPUT_MODE.WRITE && (
        <div className="mt-3">
          <label htmlFor="filesystem-overwrite" className="flex items-center gap-2">
            <input
              id="filesystem-overwrite"
              type="checkbox"
              checked={overwriteValue}
              onChange={createCheckboxHandler(setOverwriteValue, onConfigUpdate, CONFIG_FIELD, 'overwrite')}
              className="w-4 h-4"
              aria-label="Overwrite existing file"
            />
            <span className="text-sm font-medium text-gray-700">Overwrite existing file</span>
          </label>
        </div>
      )}
    </div>
  )
}
