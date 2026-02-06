/**
 * GCP Bucket Editor Component
 * Single Responsibility: Only handles GCP Bucket node configuration
 * Extracted from InputNodeEditor for better SOLID compliance
 */

import { useRef } from 'react'
import { NodeWithData } from '../../../types/nodeData'
import { useInputFieldSync, useInputFieldSyncSimple } from '../../../hooks/utils/useInputFieldSync'
import { INPUT_MODE, EMPTY_STRING } from '../../../hooks/utils/inputDefaults'
import { createTextInputHandler, createSelectHandler } from '../../../hooks/utils/inputEditorHelpers'
import { CONFIG_FIELD } from './inputEditorConstants'

interface GCPBucketEditorProps {
  node: NodeWithData & { type: 'gcp_bucket' }
  onConfigUpdate: (configField: string, field: string, value: unknown) => void
}

export default function GCPBucketEditor({
  node,
  onConfigUpdate
}: GCPBucketEditorProps) {
  const inputConfig = node.data.input_config || {}
  
  const bucketNameRef = useRef<HTMLInputElement>(null)
  const objectPathRef = useRef<HTMLInputElement>(null)
  const gcpCredentialsRef = useRef<HTMLTextAreaElement>(null)
  
  const [bucketNameValue, setBucketNameValue] = useInputFieldSync(
    bucketNameRef,
    inputConfig.bucket_name,
    EMPTY_STRING
  )
  const [objectPathValue, setObjectPathValue] = useInputFieldSync(
    objectPathRef,
    inputConfig.object_path,
    EMPTY_STRING
  )
  const [gcpCredentialsValue, setGcpCredentialsValue] = useInputFieldSync(
    gcpCredentialsRef,
    inputConfig.credentials,
    EMPTY_STRING
  )
  const [modeValue, setModeValue] = useInputFieldSyncSimple(
    inputConfig.mode,
    INPUT_MODE.READ
  )

  return (
    <div className="border-t pt-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">GCP Bucket Configuration</h4>
      <div className="mb-3">
        <label htmlFor="gcp-bucket-mode" className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
        <select
          id="gcp-bucket-mode"
          value={modeValue}
          onChange={createSelectHandler(setModeValue, onConfigUpdate, CONFIG_FIELD, 'mode')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="Select bucket operation mode"
        >
          <option value={INPUT_MODE.READ}>Read from bucket</option>
          <option value={INPUT_MODE.WRITE}>Write to bucket</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Read: Fetch data from bucket. Write: Save data to bucket.
        </p>
      </div>
      <div>
        <label htmlFor="gcp-bucket-name" className="block text-sm font-medium text-gray-700 mb-1">Bucket Name</label>
        <input
          id="gcp-bucket-name"
          ref={bucketNameRef}
          type="text"
          value={bucketNameValue}
          onChange={createTextInputHandler(setBucketNameValue, onConfigUpdate, CONFIG_FIELD, 'bucket_name')}
          placeholder="my-bucket-name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="GCP bucket name"
        />
      </div>
      <div className="mt-3">
        <label htmlFor="gcp-object-path" className="block text-sm font-medium text-gray-700 mb-1">Object Path</label>
        <input
          id="gcp-object-path"
          ref={objectPathRef}
          type="text"
          value={objectPathValue}
          onChange={createTextInputHandler(setObjectPathValue, onConfigUpdate, CONFIG_FIELD, 'object_path')}
          placeholder="path/to/file.txt or leave blank for all objects"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="Object path in bucket"
        />
      </div>
      <div className="mt-3">
        <label htmlFor="gcp-credentials" className="block text-sm font-medium text-gray-700 mb-1">GCP Credentials (JSON)</label>
        <textarea
          id="gcp-credentials"
          ref={gcpCredentialsRef}
          value={gcpCredentialsValue}
          onChange={createTextInputHandler(setGcpCredentialsValue, onConfigUpdate, CONFIG_FIELD, 'credentials')}
          rows={3}
          placeholder="Paste GCP service account JSON credentials"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary-500"
          aria-label="GCP service account credentials"
        />
        <p className="text-xs text-gray-500 mt-1">
          Service account JSON credentials for GCP access
        </p>
      </div>
    </div>
  )
}
