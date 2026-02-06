/**
 * GCP Pub/Sub Editor Component
 * Single Responsibility: Only handles GCP Pub/Sub node configuration
 * Extracted from InputNodeEditor for better SOLID compliance
 */

import { useRef } from 'react'
import { NodeWithData } from '../../../types/nodeData'
import { useInputFieldSync, useInputFieldSyncSimple } from '../../../hooks/utils/useInputFieldSync'
import { INPUT_MODE, EMPTY_STRING } from '../../../hooks/utils/inputDefaults'
import { createTextInputHandler, createSelectHandler } from '../../../hooks/utils/inputEditorHelpers'
import { CONFIG_FIELD } from './inputEditorConstants'

interface GCPPubSubEditorProps {
  node: NodeWithData & { type: 'gcp_pubsub' }
  onConfigUpdate: (configField: string, field: string, value: unknown) => void
}

export default function GCPPubSubEditor({
  node,
  onConfigUpdate
}: GCPPubSubEditorProps) {
  const inputConfig = node.data.input_config || {}
  
  const projectIdRef = useRef<HTMLInputElement>(null)
  const topicNameRef = useRef<HTMLInputElement>(null)
  const subscriptionNameRef = useRef<HTMLInputElement>(null)
  const gcpCredentialsRef = useRef<HTMLTextAreaElement>(null)
  
  const [projectIdValue, setProjectIdValue] = useInputFieldSync(
    projectIdRef,
    inputConfig.project_id,
    EMPTY_STRING
  )
  const [topicNameValue, setTopicNameValue] = useInputFieldSync(
    topicNameRef,
    inputConfig.topic_name,
    EMPTY_STRING
  )
  const [subscriptionNameValue, setSubscriptionNameValue] = useInputFieldSync(
    subscriptionNameRef,
    inputConfig.subscription_name,
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
      <h4 className="text-sm font-semibold text-gray-900 mb-3">GCP Pub/Sub Configuration</h4>
      <div className="mb-3">
        <label htmlFor="pubsub-mode" className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
        <select
          id="pubsub-mode"
          value={modeValue}
          onChange={createSelectHandler(setModeValue, onConfigUpdate, CONFIG_FIELD, 'mode')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="Select Pub/Sub operation mode"
        >
          <option value={INPUT_MODE.READ}>Subscribe (read messages)</option>
          <option value={INPUT_MODE.WRITE}>Publish (write messages)</option>
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
          onChange={createTextInputHandler(setProjectIdValue, onConfigUpdate, CONFIG_FIELD, 'project_id')}
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
          onChange={createTextInputHandler(setTopicNameValue, onConfigUpdate, CONFIG_FIELD, 'topic_name')}
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
          onChange={createTextInputHandler(setSubscriptionNameValue, onConfigUpdate, CONFIG_FIELD, 'subscription_name')}
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
          onChange={createTextInputHandler(setGcpCredentialsValue, onConfigUpdate, CONFIG_FIELD, 'credentials')}
          rows={3}
          placeholder="Paste GCP service account JSON credentials"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary-500"
          aria-label="GCP service account credentials"
        />
      </div>
    </div>
  )
}
