/**
 * Input Node Editor Component
 * Handles editing of all input node types (GCP Bucket, AWS S3, Pub/Sub, Local FileSystem, Database, Firebase, BigQuery)
 * Follows Single Responsibility Principle - handles input node configuration only
 */

import { useRef, useState, useEffect } from 'react'
import { NodeWithData } from '../../types/nodeData'

interface InputNodeEditorProps {
  node: NodeWithData & { type: 'gcp_bucket' | 'aws_s3' | 'gcp_pubsub' | 'local_filesystem' | 'database' | 'firebase' | 'bigquery' }
  onConfigUpdate: (configField: string, field: string, value: unknown) => void
}

export default function InputNodeEditor({
  node,
  onConfigUpdate
}: InputNodeEditorProps) {
  const inputConfig = node.data.input_config || {}
  
  // GCP Bucket & AWS S3 shared refs
  const bucketNameRef = useRef<HTMLInputElement>(null)
  const objectPathRef = useRef<HTMLInputElement>(null)
  const objectKeyRef = useRef<HTMLInputElement>(null)
  const gcpCredentialsRef = useRef<HTMLTextAreaElement>(null)
  const accessKeyIdRef = useRef<HTMLInputElement>(null)
  const secretKeyRef = useRef<HTMLInputElement>(null)
  const regionRef = useRef<HTMLInputElement>(null)
  
  // GCP Pub/Sub refs
  const projectIdRef = useRef<HTMLInputElement>(null)
  const topicNameRef = useRef<HTMLInputElement>(null)
  const subscriptionNameRef = useRef<HTMLInputElement>(null)
  
  // Local FileSystem refs
  const filePathRef = useRef<HTMLInputElement>(null)
  const filePatternRef = useRef<HTMLInputElement>(null)

  // Local state for all input fields
  const [bucketNameValue, setBucketNameValue] = useState('')
  const [objectPathValue, setObjectPathValue] = useState('')
  const [gcpCredentialsValue, setGcpCredentialsValue] = useState('')
  const [objectKeyValue, setObjectKeyValue] = useState('')
  const [accessKeyIdValue, setAccessKeyIdValue] = useState('')
  const [secretKeyValue, setSecretKeyValue] = useState('')
  const [regionValue, setRegionValue] = useState('us-east-1')
  const [projectIdValue, setProjectIdValue] = useState('')
  const [topicNameValue, setTopicNameValue] = useState('')
  const [subscriptionNameValue, setSubscriptionNameValue] = useState('')
  const [filePathValue, setFilePathValue] = useState('')
  const [filePatternValue, setFilePatternValue] = useState('')
  const [modeValue, setModeValue] = useState('read')
  const [overwriteValue, setOverwriteValue] = useState(true)

  // Sync local state with node data
  useEffect(() => {
    if (document.activeElement !== bucketNameRef.current) {
      setBucketNameValue(inputConfig.bucket_name || '')
    }
    if (document.activeElement !== objectPathRef.current) {
      setObjectPathValue(inputConfig.object_path || '')
    }
    if (document.activeElement !== gcpCredentialsRef.current) {
      setGcpCredentialsValue(inputConfig.credentials || '')
    }
    if (document.activeElement !== objectKeyRef.current) {
      setObjectKeyValue(inputConfig.object_key || '')
    }
    if (document.activeElement !== accessKeyIdRef.current) {
      setAccessKeyIdValue(inputConfig.access_key_id || '')
    }
    if (document.activeElement !== secretKeyRef.current) {
      setSecretKeyValue(inputConfig.secret_access_key || '')
    }
    if (document.activeElement !== regionRef.current) {
      setRegionValue(inputConfig.region || 'us-east-1')
    }
    if (document.activeElement !== projectIdRef.current) {
      setProjectIdValue(inputConfig.project_id || '')
    }
    if (document.activeElement !== topicNameRef.current) {
      setTopicNameValue(inputConfig.topic_name || '')
    }
    if (document.activeElement !== subscriptionNameRef.current) {
      setSubscriptionNameValue(inputConfig.subscription_name || '')
    }
    if (document.activeElement !== filePathRef.current) {
      setFilePathValue(inputConfig.file_path || '')
    }
    if (document.activeElement !== filePatternRef.current) {
      setFilePatternValue(inputConfig.file_pattern || '')
    }
    setModeValue(inputConfig.mode || 'read')
    setOverwriteValue(inputConfig.overwrite ?? true)
  }, [inputConfig])

  // GCP Bucket Configuration
  if (node.type === 'gcp_bucket') {
    return (
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">GCP Bucket Configuration</h4>
        <div className="mb-3">
          <label htmlFor="gcp-bucket-mode" className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
          <select
            id="gcp-bucket-mode"
            value={modeValue}
            onChange={(e) => {
              const newValue = e.target.value
              setModeValue(newValue)
              onConfigUpdate('input_config', 'mode', newValue)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            aria-label="Select bucket operation mode"
          >
            <option value="read">Read from bucket</option>
            <option value="write">Write to bucket</option>
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
            onChange={(e) => {
              const newValue = e.target.value
              setBucketNameValue(newValue)
              onConfigUpdate('input_config', 'bucket_name', newValue)
            }}
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
            onChange={(e) => {
              const newValue = e.target.value
              setObjectPathValue(newValue)
              onConfigUpdate('input_config', 'object_path', newValue)
            }}
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
            onChange={(e) => {
              const newValue = e.target.value
              setGcpCredentialsValue(newValue)
              onConfigUpdate('input_config', 'credentials', newValue)
            }}
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

  // AWS S3 Configuration
  if (node.type === 'aws_s3') {
    return (
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">AWS S3 Configuration</h4>
        <div className="mb-3">
          <label htmlFor="aws-s3-mode" className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
          <select
            id="aws-s3-mode"
            value={modeValue}
            onChange={(e) => {
              const newValue = e.target.value
              setModeValue(newValue)
              onConfigUpdate('input_config', 'mode', newValue)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            aria-label="Select S3 operation mode"
          >
            <option value="read">Read from bucket</option>
            <option value="write">Write to bucket</option>
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
            onChange={(e) => {
              const newValue = e.target.value
              setBucketNameValue(newValue)
              onConfigUpdate('input_config', 'bucket_name', newValue)
            }}
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
            onChange={(e) => {
              const newValue = e.target.value
              setObjectKeyValue(newValue)
              onConfigUpdate('input_config', 'object_key', newValue)
            }}
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
            onChange={(e) => {
              const newValue = e.target.value
              setAccessKeyIdValue(newValue)
              onConfigUpdate('input_config', 'access_key_id', newValue)
            }}
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
            onChange={(e) => {
              const newValue = e.target.value
              setSecretKeyValue(newValue)
              onConfigUpdate('input_config', 'secret_access_key', newValue)
            }}
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
            onChange={(e) => {
              const newValue = e.target.value
              setRegionValue(newValue)
              onConfigUpdate('input_config', 'region', newValue)
            }}
            placeholder="us-east-1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            aria-label="AWS region"
          />
        </div>
      </div>
    )
  }

  // GCP Pub/Sub Configuration
  if (node.type === 'gcp_pubsub') {
    return (
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">GCP Pub/Sub Configuration</h4>
        <div className="mb-3">
          <label htmlFor="pubsub-mode" className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
          <select
            id="pubsub-mode"
            value={modeValue}
            onChange={(e) => {
              const newValue = e.target.value
              setModeValue(newValue)
              onConfigUpdate('input_config', 'mode', newValue)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            aria-label="Select Pub/Sub operation mode"
          >
            <option value="read">Subscribe (read messages)</option>
            <option value="write">Publish (write messages)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Subscribe: Receive messages from topic. Publish: Send messages to topic.
          </p>
        </div>
        <div>
          <label htmlFor="pubsub-project-id" className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
          <input
            id="pubsub-project-id"
            ref={projectIdRef}
            type="text"
            value={projectIdValue}
            onChange={(e) => {
              const newValue = e.target.value
              setProjectIdValue(newValue)
              onConfigUpdate('input_config', 'project_id', newValue)
            }}
            placeholder="my-gcp-project"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            aria-label="GCP project ID"
          />
        </div>
        <div className="mt-3">
          <label htmlFor="pubsub-topic-name" className="block text-sm font-medium text-gray-700 mb-1">Topic Name</label>
          <input
            id="pubsub-topic-name"
            ref={topicNameRef}
            type="text"
            value={topicNameValue}
            onChange={(e) => {
              const newValue = e.target.value
              setTopicNameValue(newValue)
              onConfigUpdate('input_config', 'topic_name', newValue)
            }}
            placeholder="my-topic"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            aria-label="Pub/Sub topic name"
          />
        </div>
        <div className="mt-3">
          <label htmlFor="pubsub-subscription-name" className="block text-sm font-medium text-gray-700 mb-1">Subscription Name</label>
          <input
            id="pubsub-subscription-name"
            ref={subscriptionNameRef}
            type="text"
            value={subscriptionNameValue}
            onChange={(e) => {
              const newValue = e.target.value
              setSubscriptionNameValue(newValue)
              onConfigUpdate('input_config', 'subscription_name', newValue)
            }}
            placeholder="my-subscription"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            aria-label="Pub/Sub subscription name"
          />
        </div>
        <div className="mt-3">
          <label htmlFor="pubsub-credentials" className="block text-sm font-medium text-gray-700 mb-1">GCP Credentials (JSON)</label>
          <textarea
            id="pubsub-credentials"
            ref={gcpCredentialsRef}
            value={gcpCredentialsValue}
            onChange={(e) => {
              const newValue = e.target.value
              setGcpCredentialsValue(newValue)
              onConfigUpdate('input_config', 'credentials', newValue)
            }}
            rows={3}
            placeholder="Paste GCP service account JSON credentials"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary-500"
            aria-label="GCP service account credentials"
          />
        </div>
      </div>
    )
  }

  // Local FileSystem Configuration
  if (node.type === 'local_filesystem') {
    return (
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Local File System Configuration</h4>
        <div className="mb-3">
          <label htmlFor="filesystem-mode" className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
          <select
            id="filesystem-mode"
            value={modeValue}
            onChange={(e) => {
              const newValue = e.target.value
              setModeValue(newValue)
              onConfigUpdate('input_config', 'mode', newValue)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            aria-label="Select file system operation mode"
          >
            <option value="read">Read from file</option>
            <option value="write">Write to file</option>
          </select>
        </div>
        <div>
          <label htmlFor="filesystem-path" className="block text-sm font-medium text-gray-700 mb-1">File Path</label>
          <input
            id="filesystem-path"
            ref={filePathRef}
            type="text"
            value={filePathValue}
            onChange={(e) => {
              const newValue = e.target.value
              setFilePathValue(newValue)
              onConfigUpdate('input_config', 'file_path', newValue)
            }}
            placeholder="/path/to/file.txt"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            aria-label="File system path"
          />
        </div>
        {modeValue === 'read' && (
          <div className="mt-3">
            <label htmlFor="filesystem-pattern" className="block text-sm font-medium text-gray-700 mb-1">File Pattern (optional)</label>
            <input
              id="filesystem-pattern"
              ref={filePatternRef}
              type="text"
              value={filePatternValue}
              onChange={(e) => {
                const newValue = e.target.value
                setFilePatternValue(newValue)
                onConfigUpdate('input_config', 'file_pattern', newValue)
              }}
              placeholder="*.txt or leave blank for exact match"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              aria-label="File pattern for matching"
            />
          </div>
        )}
        {modeValue === 'write' && (
          <div className="mt-3">
            <label htmlFor="filesystem-overwrite" className="flex items-center gap-2">
              <input
                id="filesystem-overwrite"
                type="checkbox"
                checked={overwriteValue}
                onChange={(e) => {
                  const newValue = e.target.checked
                  setOverwriteValue(newValue)
                  onConfigUpdate('input_config', 'overwrite', newValue)
                }}
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

  // Database, Firebase, and BigQuery are more complex - return simplified version for now
  // These can be extracted into separate components later if needed
  return (
    <div className="border-t pt-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">
        {node.type === 'database' && 'Database Configuration'}
        {node.type === 'firebase' && 'Firebase Configuration'}
        {node.type === 'bigquery' && 'BigQuery Configuration'}
      </h4>
      <p className="text-xs text-gray-500">
        Configuration for {node.type} nodes is handled in PropertyPanel. 
        Consider extracting to a separate component for better organization.
      </p>
    </div>
  )
}

