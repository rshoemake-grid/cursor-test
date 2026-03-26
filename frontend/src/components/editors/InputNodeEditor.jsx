/**
 * Input Node Editor Component (Router)
 * Routes to type-specific editors for better SOLID compliance
 * Single Responsibility: Only routes to appropriate editor
 * Refactored to use extracted type-specific editors
 */ import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import GCPBucketEditor from './input/GCPBucketEditor';
import AWSS3Editor from './input/AWSS3Editor';
import GCPPubSubEditor from './input/GCPPubSubEditor';
import LocalFileSystemEditor from './input/LocalFileSystemEditor';
import { NODE_TYPE_DISPLAY_NAMES } from './input/inputEditorConstants';
export default function InputNodeEditor({ node, onConfigUpdate }) {
    // Route to type-specific editor
    // Single Responsibility: Only routes to appropriate editor
    switch(node.type){
        case 'gcp_bucket':
            {
                const typedNode = node;
                return /*#__PURE__*/ _jsx(GCPBucketEditor, {
                    node: typedNode,
                    onConfigUpdate: onConfigUpdate
                });
            }
        case 'aws_s3':
            {
                const typedNode = node;
                return /*#__PURE__*/ _jsx(AWSS3Editor, {
                    node: typedNode,
                    onConfigUpdate: onConfigUpdate
                });
            }
        case 'gcp_pubsub':
            {
                const typedNode = node;
                return /*#__PURE__*/ _jsx(GCPPubSubEditor, {
                    node: typedNode,
                    onConfigUpdate: onConfigUpdate
                });
            }
        case 'local_filesystem':
            {
                const typedNode = node;
                return /*#__PURE__*/ _jsx(LocalFileSystemEditor, {
                    node: typedNode,
                    onConfigUpdate: onConfigUpdate
                });
            }
        case 'database':
        case 'firebase':
        case 'bigquery':
            {
                // These are handled by separate editors in PropertyPanel
                // Use constants to prevent string literal mutations
                const displayName = node.type === 'database' ? NODE_TYPE_DISPLAY_NAMES.DATABASE : node.type === 'firebase' ? NODE_TYPE_DISPLAY_NAMES.FIREBASE : NODE_TYPE_DISPLAY_NAMES.BIGQUERY;
                return /*#__PURE__*/ _jsxs("div", {
                    className: "border-t pt-4",
                    children: [
                        /*#__PURE__*/ _jsx("h4", {
                            className: "text-sm font-semibold text-gray-900 mb-3",
                            children: displayName
                        }),
                        /*#__PURE__*/ _jsxs("p", {
                            className: "text-xs text-gray-500",
                            children: [
                                "Configuration for ",
                                node.type,
                                " nodes is handled in PropertyPanel."
                            ]
                        })
                    ]
                });
            }
        default:
            return null;
    }
}
