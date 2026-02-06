/**
 * AWS S3 Editor Component
 * Single Responsibility: Only handles AWS S3 node configuration
 * Extracted from InputNodeEditor for better SOLID compliance
 */

import { useRef } from 'react'
import { NodeWithData } from '../../../types/nodeData'
import { useInputFieldSync, useInputFieldSyncSimple } from '../../../hooks/utils/useInputFieldSync'
import { INPUT_MODE, INPUT_REGION, EMPTY_STRING } from '../../../hooks/utils/inputDefaults'
import { createTextInputHandler, createSelectHandler } from '../../../hooks/utils/inputEditorHelpers'
import { CONFIG_FIELD } from './inputEditorConstants'

interface AWSS3EditorProps {
  node: NodeWithData & { type: 'aws_s3' }
  onConfigUpdate: (configField: string, field: string, value: unknown) => void
}

export default function AWSS3Editor({
  node,
  onConfigUpdate
}: AWSS3EditorProps) {
  const inputConfig = node.data.input_config || {}
  
  const bucketNameRef = useRef<HTMLInputElement>(null)
  const objectKeyRef = useRef<HTMLInputElement>(null)
  const accessKeyIdRef = useRef<HTMLInputElement>(null)
  const secretKeyRef = useRef<HTMLInputElement>(null)
  const regionRef = useRef<HTMLInputElement>(null)
  
  const [bucketNameValue, setBucketNameValue] = useInputFieldSync(
    bucketNameRef,
    inputConfig.bucket_name,
    EMPTY_STRING
  )
  const [objectKeyValue, setObjectKeyValue] = useInputFieldSync(
    objectKeyRef,
    inputConfig.object_key,
    EMPTY_STRING
  )
  const [accessKeyIdValue, setAccessKeyIdValue] = useInputFieldSync(
    accessKeyIdRef,
    inputConfig.access_key_id,
    EMPTY_STRING
  )
  const [secretKeyValue, setSecretKeyValue] = useInputFieldSync(
    secretKeyRef,
    inputConfig.secret_access_key,
    EMPTY_STRING
  )
  const [regionValue, setRegionValue] = useInputFieldSync(
    regionRef,
    inputConfig.region,
    INPUT_REGION.DEFAULT
  )
  const [modeValue, setModeValue] = useInputFieldSyncSimple(
    inputConfig.mode,
    INPUT_MODE.READ
  )

  return (
    <div className="border-t pt-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">AWS S3 Configuration</h4>
      <div className="mb-3">
        <label htmlFor="aws-s3-mode" className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
        <select
          id="aws-s3-mode"
          value={modeValue}
          onChange={createSelectHandler(setModeValue, onConfigUpdate, CONFIG_FIELD, 'mode')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="Select S3 operation mode"
        >
          <option value={INPUT_MODE.READ}>Read from bucket</option>
          <option value={INPUT_MODE.WRITE}>Write to bucket</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Read: Fetch data from bucket. Write: Save data to bucket.
        </p>
      </div>
      <div>
        <label htmlFor="aws-bucket-name" className="block text-sm font-medium text-gray-700 mb-1">Bucket Name</label>
        <input
          id="aws-bucket-name"
          ref={bucketNameRef}
          type="text"
          value={bucketNameValue}
          onChange={createTextInputHandler(setBucketNameValue, onConfigUpdate, CONFIG_FIELD, 'bucket_name')}
          placeholder="my-bucket-name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="AWS S3 bucket name"
        />
      </div>
      <div className="mt-3">
        <label htmlFor="aws-object-key" className="block text-sm font-medium text-gray-700 mb-1">Object Key</label>
        <input
          id="aws-object-key"
          ref={objectKeyRef}
          type="text"
          value={objectKeyValue}
          onChange={createTextInputHandler(setObjectKeyValue, onConfigUpdate, CONFIG_FIELD, 'object_key')}
          placeholder="path/to/file.txt or leave blank for all objects"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="S3 object key"
        />
      </div>
      <div className="mt-3">
        <label htmlFor="aws-access-key-id" className="block text-sm font-medium text-gray-700 mb-1">AWS Access Key ID</label>
        <input
          id="aws-access-key-id"
          ref={accessKeyIdRef}
          type="text"
          value={accessKeyIdValue}
          onChange={createTextInputHandler(setAccessKeyIdValue, onConfigUpdate, CONFIG_FIELD, 'access_key_id')}
          placeholder="AKIAIOSFODNN7EXAMPLE"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="AWS access key ID"
        />
      </div>
      <div className="mt-3">
        <label htmlFor="aws-secret-key" className="block text-sm font-medium text-gray-700 mb-1">AWS Secret Access Key</label>
        <input
          id="aws-secret-key"
          ref={secretKeyRef}
          type="password"
          value={secretKeyValue}
          onChange={createTextInputHandler(setSecretKeyValue, onConfigUpdate, CONFIG_FIELD, 'secret_access_key')}
          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="AWS secret access key"
        />
      </div>
      <div className="mt-3">
        <label htmlFor="aws-region" className="block text-sm font-medium text-gray-700 mb-1">AWS Region</label>
        <input
          id="aws-region"
          ref={regionRef}
          type="text"
          value={regionValue}
          onChange={createTextInputHandler(setRegionValue, onConfigUpdate, CONFIG_FIELD, 'region')}
          placeholder={INPUT_REGION.DEFAULT}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="AWS region"
        />
      </div>
    </div>
  )
}
