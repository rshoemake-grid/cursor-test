import GCPBucketEditor from "./input/GCPBucketEditor";
import AWSS3Editor from "./input/AWSS3Editor";
import GCPPubSubEditor from "./input/GCPPubSubEditor";
import LocalFileSystemEditor from "./input/LocalFileSystemEditor";
import { NODE_TYPE_DISPLAY_NAMES } from "./input/inputEditorConstants";
import {
  EditorSectionRoot,
  EditorSectionTitle,
  EditorMutedParagraph,
} from "../../styles/editorForm.styled";
function InputNodeEditor({ node, onConfigUpdate }) {
  switch (node.type) {
    case "gcp_bucket": {
      const typedNode = node;
      return (
        <GCPBucketEditor node={typedNode} onConfigUpdate={onConfigUpdate} />
      );
    }
    case "aws_s3": {
      const typedNode = node;
      return <AWSS3Editor node={typedNode} onConfigUpdate={onConfigUpdate} />;
    }
    case "gcp_pubsub": {
      const typedNode = node;
      return (
        <GCPPubSubEditor node={typedNode} onConfigUpdate={onConfigUpdate} />
      );
    }
    case "local_filesystem": {
      const typedNode = node;
      return (
        <LocalFileSystemEditor
          node={typedNode}
          onConfigUpdate={onConfigUpdate}
        />
      );
    }
    case "database":
    case "firebase":
    case "bigquery": {
      const displayName =
        node.type === "database"
          ? NODE_TYPE_DISPLAY_NAMES.DATABASE
          : node.type === "firebase"
            ? NODE_TYPE_DISPLAY_NAMES.FIREBASE
            : NODE_TYPE_DISPLAY_NAMES.BIGQUERY;
      return (
        <EditorSectionRoot>
          <EditorSectionTitle>{displayName}</EditorSectionTitle>
          <EditorMutedParagraph>
            Configuration for {node.type} nodes is handled in PropertyPanel.
          </EditorMutedParagraph>
        </EditorSectionRoot>
      );
    }
    default:
      return null;
  }
}
export { InputNodeEditor as default };
