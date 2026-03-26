import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * GCP Pub/Sub Editor Component
 * Single Responsibility: Only handles GCP Pub/Sub node configuration
 * Extracted from InputNodeEditor for better SOLID compliance
 */ import { useRef } from 'react';
import { useInputFieldSync, useInputFieldSyncSimple } from '../../../hooks/utils/useInputFieldSync';
import { INPUT_MODE, EMPTY_STRING } from '../../../hooks/utils/inputDefaults';
import { createTextInputHandler, createSelectHandler } from '../../../hooks/utils/inputEditorHelpers';
import { CONFIG_FIELD } from './inputEditorConstants';
export default function GCPPubSubEditor({ node, onConfigUpdate }) {
    const inputConfig = node.data.input_config || {};
    const projectIdRef = useRef(null);
    const topicNameRef = useRef(null);
    const subscriptionNameRef = useRef(null);
    const gcpCredentialsRef = useRef(null);
    const [projectIdValue, setProjectIdValue] = useInputFieldSync(projectIdRef, inputConfig.project_id, EMPTY_STRING);
    const [topicNameValue, setTopicNameValue] = useInputFieldSync(topicNameRef, inputConfig.topic_name, EMPTY_STRING);
    const [subscriptionNameValue, setSubscriptionNameValue] = useInputFieldSync(subscriptionNameRef, inputConfig.subscription_name, EMPTY_STRING);
    const [gcpCredentialsValue, setGcpCredentialsValue] = useInputFieldSync(gcpCredentialsRef, inputConfig.credentials, EMPTY_STRING);
    const [modeValue, setModeValue] = useInputFieldSyncSimple(inputConfig.mode, INPUT_MODE.READ);
    return /*#__PURE__*/ _jsxs("div", {
        className: "border-t pt-4",
        children: [
            /*#__PURE__*/ _jsx("h4", {
                className: "text-sm font-semibold text-gray-900 mb-3",
                children: "GCP Pub/Sub Configuration"
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "mb-3",
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "pubsub-mode",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Mode"
                    }),
                    /*#__PURE__*/ _jsxs("select", {
                        id: "pubsub-mode",
                        value: modeValue,
                        onChange: createSelectHandler(setModeValue, onConfigUpdate, CONFIG_FIELD, 'mode'),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                        "aria-label": "Select Pub/Sub operation mode",
                        children: [
                            /*#__PURE__*/ _jsx("option", {
                                value: INPUT_MODE.READ,
                                children: "Subscribe (read messages)"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: INPUT_MODE.WRITE,
                                children: "Publish (write messages)"
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("p", {
                        className: "text-xs text-gray-500 mt-1",
                        children: "Subscribe: Receive messages from topic. Publish: Send messages to topic."
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "pubsub-project-id",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Project ID"
                    }),
                    /*#__PURE__*/ _jsx("input", {
                        id: "pubsub-project-id",
                        ref: projectIdRef,
                        type: "text",
                        value: projectIdValue,
                        onChange: createTextInputHandler(setProjectIdValue, onConfigUpdate, CONFIG_FIELD, 'project_id'),
                        placeholder: "my-gcp-project",
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                        "aria-label": "GCP project ID"
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "mt-3",
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "pubsub-topic-name",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Topic Name"
                    }),
                    /*#__PURE__*/ _jsx("input", {
                        id: "pubsub-topic-name",
                        ref: topicNameRef,
                        type: "text",
                        value: topicNameValue,
                        onChange: createTextInputHandler(setTopicNameValue, onConfigUpdate, CONFIG_FIELD, 'topic_name'),
                        placeholder: "my-topic",
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                        "aria-label": "Pub/Sub topic name"
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "mt-3",
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "pubsub-subscription-name",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Subscription Name"
                    }),
                    /*#__PURE__*/ _jsx("input", {
                        id: "pubsub-subscription-name",
                        ref: subscriptionNameRef,
                        type: "text",
                        value: subscriptionNameValue,
                        onChange: createTextInputHandler(setSubscriptionNameValue, onConfigUpdate, CONFIG_FIELD, 'subscription_name'),
                        placeholder: "my-subscription",
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                        "aria-label": "Pub/Sub subscription name"
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "mt-3",
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "pubsub-credentials",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "GCP Credentials (JSON)"
                    }),
                    /*#__PURE__*/ _jsx("textarea", {
                        id: "pubsub-credentials",
                        ref: gcpCredentialsRef,
                        value: gcpCredentialsValue,
                        onChange: createTextInputHandler(setGcpCredentialsValue, onConfigUpdate, CONFIG_FIELD, 'credentials'),
                        rows: 3,
                        placeholder: "Paste GCP service account JSON credentials",
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary-500",
                        "aria-label": "GCP service account credentials"
                    })
                ]
            })
        ]
    });
}
