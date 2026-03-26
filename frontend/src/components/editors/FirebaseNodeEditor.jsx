/**
 * Firebase Node Editor Component
 * Handles editing of Firebase node properties
 * Follows Single Responsibility Principle
 */ import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
export default function FirebaseNodeEditor({ node, onConfigUpdate }) {
    const inputConfig = node.data.input_config || {};
    return /*#__PURE__*/ _jsxs("div", {
        className: "border-t pt-4",
        children: [
            /*#__PURE__*/ _jsx("h4", {
                className: "text-sm font-semibold text-gray-900 mb-3",
                children: "Firebase Configuration"
            }),
            /*#__PURE__*/ _jsxs("div", {
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "firebase-service",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Firebase Service"
                    }),
                    /*#__PURE__*/ _jsxs("select", {
                        id: "firebase-service",
                        value: inputConfig.firebase_service || 'firestore',
                        onChange: (e)=>onConfigUpdate('input_config', 'firebase_service', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                        children: [
                            /*#__PURE__*/ _jsx("option", {
                                value: "firestore",
                                children: "Firestore (NoSQL Database)"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: "realtime_db",
                                children: "Realtime Database"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: "storage",
                                children: "Firebase Storage"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: "auth",
                                children: "Firebase Authentication"
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("p", {
                        className: "text-xs text-gray-500 mt-1",
                        children: "Select which Firebase service to use"
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "mt-3",
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "firebase-project-id",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Project ID"
                    }),
                    /*#__PURE__*/ _jsx("input", {
                        id: "firebase-project-id",
                        type: "text",
                        value: inputConfig.project_id || '',
                        onChange: (e)=>onConfigUpdate('input_config', 'project_id', e.target.value),
                        placeholder: "my-firebase-project",
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    }),
                    /*#__PURE__*/ _jsx("p", {
                        className: "text-xs text-gray-500 mt-1",
                        children: "Your Firebase project ID"
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "mt-3",
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "firebase-mode",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Connection Mode"
                    }),
                    /*#__PURE__*/ _jsxs("select", {
                        id: "firebase-mode",
                        value: inputConfig.mode || 'read',
                        onChange: (e)=>onConfigUpdate('input_config', 'mode', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                        children: [
                            /*#__PURE__*/ _jsx("option", {
                                value: "read",
                                children: "Read"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: "write",
                                children: "Write"
                            })
                        ]
                    })
                ]
            }),
            (inputConfig.firebase_service === 'firestore' || inputConfig.firebase_service === 'realtime_db') && /*#__PURE__*/ _jsxs(_Fragment, {
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "mt-3",
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                htmlFor: "firebase-collection-path",
                                className: "block text-sm font-medium text-gray-700 mb-1",
                                children: "Collection / Path"
                            }),
                            /*#__PURE__*/ _jsx("input", {
                                id: "firebase-collection-path",
                                type: "text",
                                value: inputConfig.collection_path || '',
                                onChange: (e)=>onConfigUpdate('input_config', 'collection_path', e.target.value),
                                placeholder: "users or users/{userId}/posts",
                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            }),
                            /*#__PURE__*/ _jsx("p", {
                                className: "text-xs text-gray-500 mt-1",
                                children: "Firestore collection path or Realtime DB path"
                            })
                        ]
                    }),
                    inputConfig.mode === 'read' && /*#__PURE__*/ _jsxs("div", {
                        className: "mt-3",
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                htmlFor: "firebase-query-filter",
                                className: "block text-sm font-medium text-gray-700 mb-1",
                                children: "Query Filter (optional)"
                            }),
                            /*#__PURE__*/ _jsx("textarea", {
                                id: "firebase-query-filter",
                                value: inputConfig.query_filter || '',
                                onChange: (e)=>onConfigUpdate('input_config', 'query_filter', e.target.value),
                                placeholder: '{"field": "value"} or JSON query',
                                rows: 3,
                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                            }),
                            /*#__PURE__*/ _jsx("p", {
                                className: "text-xs text-gray-500 mt-1",
                                children: "JSON filter for querying documents"
                            })
                        ]
                    })
                ]
            }),
            inputConfig.firebase_service === 'storage' && /*#__PURE__*/ _jsxs(_Fragment, {
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "mt-3",
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                htmlFor: "firebase-bucket-name",
                                className: "block text-sm font-medium text-gray-700 mb-1",
                                children: "Bucket Name"
                            }),
                            /*#__PURE__*/ _jsx("input", {
                                id: "firebase-bucket-name",
                                type: "text",
                                value: inputConfig.bucket_name || '',
                                onChange: (e)=>onConfigUpdate('input_config', 'bucket_name', e.target.value),
                                placeholder: "my-firebase-storage.appspot.com",
                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "mt-3",
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                htmlFor: "firebase-file-path",
                                className: "block text-sm font-medium text-gray-700 mb-1",
                                children: "File Path"
                            }),
                            /*#__PURE__*/ _jsx("input", {
                                id: "firebase-file-path",
                                type: "text",
                                value: inputConfig.file_path || '',
                                onChange: (e)=>onConfigUpdate('input_config', 'file_path', e.target.value),
                                placeholder: "images/photo.jpg",
                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "mt-3",
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "firebase-credentials",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Service Account Credentials (JSON)"
                    }),
                    /*#__PURE__*/ _jsx("textarea", {
                        id: "firebase-credentials",
                        value: inputConfig.credentials || '',
                        onChange: (e)=>onConfigUpdate('input_config', 'credentials', e.target.value),
                        placeholder: '{"type": "service_account", ...}',
                        rows: 4,
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                    }),
                    /*#__PURE__*/ _jsx("p", {
                        className: "text-xs text-gray-500 mt-1",
                        children: "Firebase service account JSON credentials. Leave blank to use default credentials."
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3",
                children: [
                    /*#__PURE__*/ _jsx("p", {
                        className: "text-xs text-blue-900 font-medium mb-1",
                        children: "🔥 Firebase Node"
                    }),
                    /*#__PURE__*/ _jsx("p", {
                        className: "text-xs text-blue-700",
                        children: "Connect to Firebase services. Supports Firestore, Realtime Database, Storage, and Authentication."
                    })
                ]
            })
        ]
    });
}
