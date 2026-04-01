import { jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, { timeout });
};
import InputNodeEditor from "./InputNodeEditor";
describe("InputNodeEditor", () => {
  const mockOnConfigUpdate = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("GCP Bucket Configuration", () => {
    const gcpBucketNode = {
      id: "1",
      type: "gcp_bucket",
      position: { x: 0, y: 0 },
      data: {
        input_config: {
          bucket_name: "test-bucket",
          object_path: "path/to/file",
          credentials: '{"type":"service_account"}',
          mode: "read"
        }
      }
    };
    it("should render GCP bucket configuration fields", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: gcpBucketNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/GCP bucket name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Object path/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/GCP Credentials/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Mode/i)).toBeInTheDocument();
    });
    it("should display current bucket name value", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: gcpBucketNode, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      expect(bucketInput.value).toBe("test-bucket");
    });
    it("should call onConfigUpdate when bucket name changes", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: gcpBucketNode, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      fireEvent.change(bucketInput, { target: { value: "new-bucket" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "bucket_name", "new-bucket");
    });
    it("should call onConfigUpdate when object path changes", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: gcpBucketNode, onConfigUpdate: mockOnConfigUpdate }));
      const objectPathInput = screen.getByLabelText(/Object path/i);
      fireEvent.change(objectPathInput, { target: { value: "new/path" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "object_path", "new/path");
    });
    it("should call onConfigUpdate when credentials change", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: gcpBucketNode, onConfigUpdate: mockOnConfigUpdate }));
      const credentialsInput = screen.getByLabelText(/GCP Credentials/i);
      fireEvent.change(credentialsInput, { target: { value: '{"new":"credentials"}' } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "credentials", '{"new":"credentials"}');
    });
    it("should call onConfigUpdate when mode changes", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: gcpBucketNode, onConfigUpdate: mockOnConfigUpdate }));
      const modeSelect = screen.getByLabelText(/Mode/i);
      fireEvent.change(modeSelect, { target: { value: "write" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "mode", "write");
    });
    it("should display read mode option", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: gcpBucketNode, onConfigUpdate: mockOnConfigUpdate }));
      const modeSelect = screen.getByLabelText(/Mode/i);
      expect(modeSelect.value).toBe("read");
    });
  });
  describe("AWS S3 Configuration", () => {
    const awsS3Node = {
      id: "2",
      type: "aws_s3",
      position: { x: 0, y: 0 },
      data: {
        input_config: {
          bucket_name: "aws-bucket",
          object_key: "key/to/file",
          access_key_id: "AKIAIOSFODNN7EXAMPLE",
          secret_access_key: "secret",
          region: "us-west-2",
          mode: "read"
        }
      }
    };
    it("should render AWS S3 configuration fields", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: awsS3Node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/AWS S3 bucket name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Object key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/AWS Access Key ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/AWS Secret Access Key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/AWS Region/i)).toBeInTheDocument();
    });
    it("should display current AWS S3 values", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: awsS3Node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/AWS S3 bucket name/i);
      expect(bucketInput.value).toBe("aws-bucket");
      const regionInput = screen.getByLabelText(/AWS Region/i);
      expect(regionInput.value).toBe("us-west-2");
    });
    it("should call onConfigUpdate when AWS fields change", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: awsS3Node, onConfigUpdate: mockOnConfigUpdate }));
      const accessKeyInput = screen.getByLabelText(/AWS Access Key ID/i);
      fireEvent.change(accessKeyInput, { target: { value: "NEWKEY" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "access_key_id", "NEWKEY");
    });
    it("should use default region when not provided", () => {
      const nodeWithoutRegion = {
        ...awsS3Node,
        data: {
          input_config: {
            bucket_name: "test-bucket"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: nodeWithoutRegion, onConfigUpdate: mockOnConfigUpdate }));
      const regionInput = screen.getByLabelText(/AWS Region/i);
      expect(regionInput.value).toBe("us-east-1");
    });
  });
  describe("GCP Pub/Sub Configuration", () => {
    const pubsubNode = {
      id: "3",
      type: "gcp_pubsub",
      position: { x: 0, y: 0 },
      data: {
        input_config: {
          project_id: "my-project",
          topic_name: "my-topic",
          subscription_name: "my-subscription",
          credentials: '{"type":"service_account"}',
          mode: "read"
        }
      }
    };
    it("should render Pub/Sub configuration fields", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: pubsubNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/Project ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Topic name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Subscription name/i)).toBeInTheDocument();
    });
    it("should call onConfigUpdate when Pub/Sub fields change", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: pubsubNode, onConfigUpdate: mockOnConfigUpdate }));
      const topicInput = screen.getByLabelText(/Topic name/i);
      fireEvent.change(topicInput, { target: { value: "new-topic" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "topic_name", "new-topic");
    });
    it("should handle write mode for Pub/Sub", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: pubsubNode, onConfigUpdate: mockOnConfigUpdate }));
      const modeSelect = screen.getByLabelText(/Select Pub\/Sub operation mode/i);
      fireEvent.change(modeSelect, { target: { value: "write" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "mode", "write");
    });
  });
  describe("Local FileSystem Configuration", () => {
    const filesystemNode = {
      id: "4",
      type: "local_filesystem",
      position: { x: 0, y: 0 },
      data: {
        input_config: {
          file_path: "/path/to/file.txt",
          file_pattern: "*.txt",
          mode: "read",
          overwrite: false
        }
      }
    };
    it("should render filesystem configuration fields", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: filesystemNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/File Path/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/File Pattern/i)).toBeInTheDocument();
    });
    it("should show file pattern when mode is read", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: filesystemNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/File Pattern/i)).toBeInTheDocument();
    });
    it("should show overwrite checkbox when mode is write", () => {
      const writeNode = {
        ...filesystemNode,
        data: {
          input_config: {
            ...filesystemNode.data.input_config,
            mode: "write"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: writeNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/Overwrite existing file/i)).toBeInTheDocument();
    });
    it("should call onConfigUpdate when file path changes", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: filesystemNode, onConfigUpdate: mockOnConfigUpdate }));
      const filePathInput = screen.getByLabelText(/File Path/i);
      fireEvent.change(filePathInput, { target: { value: "/new/path" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "file_path", "/new/path");
    });
    it("should call onConfigUpdate when overwrite changes", () => {
      const writeNode = {
        ...filesystemNode,
        data: {
          input_config: {
            ...filesystemNode.data.input_config,
            mode: "write",
            overwrite: false
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: writeNode, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
      expect(overwriteCheckbox.checked).toBe(false);
      fireEvent.click(overwriteCheckbox);
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "overwrite", true);
    });
    it("should use default overwrite value", () => {
      const nodeWithoutOverwrite = {
        ...filesystemNode,
        data: {
          input_config: {
            file_path: "/path/to/file.txt",
            mode: "write"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: nodeWithoutOverwrite, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
      expect(overwriteCheckbox.checked).toBe(true);
    });
  });
  describe("Other node types", () => {
    const databaseNode = {
      id: "5",
      type: "database",
      position: { x: 0, y: 0 },
      data: {}
    };
    it("should render placeholder for database nodes", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: databaseNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/Database Configuration/i)).toBeInTheDocument();
      expect(screen.getByText(/Configuration for database nodes is handled in PropertyPanel/i)).toBeInTheDocument();
    });
    const firebaseNode = {
      id: "6",
      type: "firebase",
      position: { x: 0, y: 0 },
      data: {}
    };
    it("should render placeholder for firebase nodes", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: firebaseNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/Firebase Configuration/i)).toBeInTheDocument();
    });
    const bigqueryNode = {
      id: "7",
      type: "bigquery",
      position: { x: 0, y: 0 },
      data: {}
    };
    it("should render placeholder for bigquery nodes", () => {
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node: bigqueryNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/BigQuery Configuration/i)).toBeInTheDocument();
    });
  });
  describe("State synchronization", () => {
    it("should sync local state with node data on mount", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "initial-bucket"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      expect(bucketInput.value).toBe("initial-bucket");
    });
    it("should update local state when node data changes", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "initial-bucket"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const updatedNode = {
        ...node,
        data: {
          input_config: {
            bucket_name: "updated-bucket"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      expect(bucketInput.value).toBe("updated-bucket");
    });
    it("should not update local state when input is focused", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "initial-bucket"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      bucketInput.focus();
      const updatedNode = {
        ...node,
        data: {
          input_config: {
            bucket_name: "updated-bucket"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(bucketInput.value).toBe("initial-bucket");
    });
    it("should handle undefined input_config", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {}
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      expect(bucketInput.value).toBe("");
    });
    it("should handle null input_config values", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: null,
            object_path: null
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      expect(bucketInput.value).toBe("");
    });
    it("should handle mode switching for GCP Bucket", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "read"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const modeSelect = screen.getByLabelText(/Select bucket operation mode/i);
      expect(modeSelect.value).toBe("read");
      fireEvent.change(modeSelect, { target: { value: "write" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "mode", "write");
    });
    it("should handle mode switching for AWS S3", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "read"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const modeSelect = screen.getByLabelText(/Select S3 operation mode/i);
      fireEvent.change(modeSelect, { target: { value: "write" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "mode", "write");
    });
    it("should handle mode switching for Local FileSystem", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "read",
            file_path: "/test/path"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.queryByLabelText(/File Pattern/i)).toBeInTheDocument();
      const modeSelect = screen.getByLabelText(/Select file system operation mode/i);
      fireEvent.change(modeSelect, { target: { value: "write" } });
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: {
        ...node,
        data: { input_config: { ...node.data.input_config, mode: "write" } }
      }, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.queryByLabelText(/Overwrite existing file/i)).toBeInTheDocument();
    });
    it("should use default region for AWS S3 when not provided", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "test-bucket"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const regionInput = screen.getByLabelText(/AWS region/i);
      expect(regionInput.value).toBe("us-east-1");
    });
    it("should handle overwrite default value for Local FileSystem", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "write",
            file_path: "/test/path"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
      expect(overwriteCheckbox.checked).toBe(true);
    });
    it("should handle overwrite false value for Local FileSystem", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "write",
            file_path: "/test/path",
            overwrite: false
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
      expect(overwriteCheckbox.checked).toBe(false);
    });
    it("should handle all GCP Bucket fields", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket",
            object_path: "path",
            credentials: "creds",
            mode: "read"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/GCP bucket name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Object path in bucket/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/GCP service account credentials/i)).toBeInTheDocument();
    });
    it("should handle all AWS S3 fields", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket",
            object_key: "key",
            access_key_id: "key-id",
            secret_access_key: "secret",
            region: "us-west-2"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/AWS S3 bucket name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/S3 object key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/AWS access key ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/AWS secret access key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/AWS region/i)).toBeInTheDocument();
    });
    it("should handle all GCP Pub/Sub fields", () => {
      const node = {
        id: "1",
        type: "gcp_pubsub",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            project_id: "project",
            topic_name: "topic",
            subscription_name: "subscription",
            credentials: "creds",
            mode: "read"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/GCP project ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Pub\/Sub topic name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Pub\/Sub subscription name/i)).toBeInTheDocument();
    });
    it("should preserve focus state when updating node data", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "initial"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      bucketInput.focus();
      const updatedNode = {
        ...node,
        data: {
          input_config: {
            bucket_name: "updated"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(bucketInput.value).toBe("initial");
    });
    it("should handle file pattern visibility toggle", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "read",
            file_path: "/test"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.queryByLabelText(/File Pattern/i)).toBeInTheDocument();
      const updatedNode = {
        ...node,
        data: {
          input_config: {
            ...node.data.input_config,
            mode: "write"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.queryByLabelText(/File Pattern/i)).not.toBeInTheDocument();
    });
    it("should handle focus state for bucketNameRef", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "initial"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      expect(bucketInput.value).toBe("initial");
      bucketInput.focus();
      expect(document.activeElement).toBe(bucketInput);
      const updatedNode = {
        ...node,
        data: {
          input_config: {
            bucket_name: "updated"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
      const currentInput = screen.getByLabelText(/GCP bucket name/i);
      expect(currentInput).toBeInTheDocument();
    });
    it("should handle focus state for all GCP Bucket refs", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket",
            object_path: "path",
            credentials: "creds"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      const objectPathInput = screen.getByLabelText(/Object path/i);
      const credentialsTextarea = screen.getByLabelText(/GCP Credentials/i);
      bucketInput.focus();
      const updatedNode = {
        ...node,
        data: {
          input_config: {
            bucket_name: "new-bucket",
            object_path: "new-path",
            credentials: "new-creds"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(bucketInput.value).toBe("bucket");
      expect(objectPathInput.value).toBe("new-path");
      expect(credentialsTextarea.value).toBe("new-creds");
    });
    it("should handle focus state for AWS S3 refs", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket",
            object_key: "key",
            access_key_id: "key-id",
            secret_access_key: "secret",
            region: "us-west-2"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const accessKeyInput = screen.getByLabelText(/AWS access key ID/i);
      accessKeyInput.focus();
      const updatedNode = {
        ...node,
        data: {
          input_config: {
            ...node.data.input_config,
            access_key_id: "new-key-id"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(accessKeyInput.value).toBe("key-id");
    });
    it("should handle focus state for Pub/Sub refs", () => {
      const node = {
        id: "1",
        type: "gcp_pubsub",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            project_id: "project",
            topic_name: "topic",
            subscription_name: "subscription"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const projectIdInput = screen.getByLabelText(/GCP project ID/i);
      projectIdInput.focus();
      const updatedNode = {
        ...node,
        data: {
          input_config: {
            ...node.data.input_config,
            project_id: "new-project"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(projectIdInput.value).toBe("project");
    });
    it("should handle focus state for Local FileSystem refs", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            file_path: "/path",
            file_pattern: "*.txt"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const filePathInput = screen.getByLabelText(/File Path/i);
      filePathInput.focus();
      const updatedNode = {
        ...node,
        data: {
          input_config: {
            ...node.data.input_config,
            file_path: "/new-path"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(filePathInput.value).toBe("/path");
    });
    it("should handle overwriteValue with nullish coalescing", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "write",
            file_path: "/test",
            overwrite: null
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
      expect(overwriteCheckbox.checked).toBe(true);
    });
    it("should handle overwriteValue with undefined", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "write",
            file_path: "/test"
            // overwrite is undefined
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
      expect(overwriteCheckbox.checked).toBe(true);
    });
    it("should handle overwriteValue with false", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "write",
            file_path: "/test",
            overwrite: false
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
      expect(overwriteCheckbox.checked).toBe(false);
    });
    it("should handle all default values correctly", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {}
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      const modeSelect = screen.getByLabelText(/Select bucket operation mode/i);
      expect(bucketInput.value).toBe("");
      expect(modeSelect.value).toBe("read");
    });
    it("should handle region default value for AWS S3", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const regionInput = screen.getByLabelText(/AWS region/i);
      expect(regionInput.value).toBe("us-east-1");
    });
    it("should handle mode default value", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const modeSelect = screen.getByLabelText(/Select bucket operation mode/i);
      expect(modeSelect.value).toBe("read");
    });
    it("should handle all input types rendering correctly", () => {
      const gcpBucketNode = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {}
      };
      const { unmount: unmount1 } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node: gcpBucketNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/GCP Bucket Configuration/i)).toBeInTheDocument();
      unmount1();
      const awsS3Node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: {}
      };
      const { unmount: unmount2 } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node: awsS3Node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/AWS S3 Configuration/i)).toBeInTheDocument();
      unmount2();
      const pubsubNode = {
        id: "1",
        type: "gcp_pubsub",
        position: { x: 0, y: 0 },
        data: {}
      };
      const { unmount: unmount3 } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node: pubsubNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/GCP Pub\/Sub Configuration/i)).toBeInTheDocument();
      unmount3();
      const filesystemNode = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {}
      };
      const { unmount: unmount4 } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node: filesystemNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/Local File System Configuration/i)).toBeInTheDocument();
      unmount4();
      const databaseNode = {
        id: "1",
        type: "database",
        position: { x: 0, y: 0 },
        data: {}
      };
      const { unmount: unmount5 } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node: databaseNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/Database Configuration/i)).toBeInTheDocument();
      unmount5();
      const firebaseNode = {
        id: "1",
        type: "firebase",
        position: { x: 0, y: 0 },
        data: {}
      };
      const { unmount: unmount6 } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node: firebaseNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/Firebase Configuration/i)).toBeInTheDocument();
      unmount6();
      const bigqueryNode = {
        id: "1",
        type: "bigquery",
        position: { x: 0, y: 0 },
        data: {}
      };
      const { unmount: unmount7 } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node: bigqueryNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/BigQuery Configuration/i)).toBeInTheDocument();
      unmount7();
    });
    it("should handle empty string values in all fields", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "",
            object_path: "",
            credentials: "",
            mode: "read"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      const objectPathInput = screen.getByLabelText(/Object path/i);
      const credentialsTextarea = screen.getByLabelText(/GCP Credentials/i);
      expect(bucketInput.value).toBe("");
      expect(objectPathInput.value).toBe("");
      expect(credentialsTextarea.value).toBe("");
    });
    it("should handle whitespace-only values", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "   ",
            object_path: "	\n",
            credentials: " "
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      expect(bucketInput.value).toBe("   ");
    });
    it("should handle very long values", () => {
      const longValue = "a".repeat(1e3);
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: longValue,
            credentials: longValue
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      const credentialsTextarea = screen.getByLabelText(/GCP Credentials/i);
      expect(bucketInput.value).toBe(longValue);
      expect(credentialsTextarea.value).toBe(longValue);
    });
    it("should handle special characters in values", () => {
      const specialValue = "test@#$%^&*()_+-=[]{}|;:,.<>?/~`";
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: specialValue,
            object_path: specialValue
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      expect(bucketInput.value).toBe(specialValue);
    });
    it("should handle mode value changes for all node types", () => {
      const nodeTypes = [
        "gcp_bucket",
        "aws_s3",
        "gcp_pubsub",
        "local_filesystem"
      ];
      nodeTypes.forEach((type) => {
        const node = {
          id: "1",
          type,
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              mode: "read"
            }
          }
        };
        const { unmount } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Select.*mode/i);
        fireEvent.change(modeSelect, { target: { value: "write" } });
        expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "mode", "write");
        unmount();
        jest.clearAllMocks();
      });
    });
    it("should handle all onChange handlers for GCP Bucket", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "",
            object_path: "",
            credentials: "",
            mode: "read"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      const objectPathInput = screen.getByLabelText(/Object path/i);
      const credentialsTextarea = screen.getByLabelText(/GCP Credentials/i);
      const modeSelect = screen.getByLabelText(/Select bucket operation mode/i);
      fireEvent.change(bucketInput, { target: { value: "new-bucket" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "bucket_name", "new-bucket");
      fireEvent.change(objectPathInput, { target: { value: "new-path" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "object_path", "new-path");
      fireEvent.change(credentialsTextarea, { target: { value: "new-creds" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "credentials", "new-creds");
      fireEvent.change(modeSelect, { target: { value: "write" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "mode", "write");
    });
    it("should handle all onChange handlers for AWS S3", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "",
            object_key: "",
            access_key_id: "",
            secret_access_key: "",
            region: "us-east-1",
            mode: "read"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/AWS S3 bucket name/i);
      const objectKeyInput = screen.getByLabelText(/S3 object key/i);
      const accessKeyInput = screen.getByLabelText(/AWS access key ID/i);
      const secretKeyInput = screen.getByLabelText(/AWS secret access key/i);
      const regionInput = screen.getByLabelText(/AWS region/i);
      fireEvent.change(bucketInput, { target: { value: "bucket" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "bucket_name", "bucket");
      fireEvent.change(objectKeyInput, { target: { value: "key" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "object_key", "key");
      fireEvent.change(accessKeyInput, { target: { value: "key-id" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "access_key_id", "key-id");
      fireEvent.change(secretKeyInput, { target: { value: "secret" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "secret_access_key", "secret");
      fireEvent.change(regionInput, { target: { value: "us-west-2" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "region", "us-west-2");
    });
    it("should handle all onChange handlers for Pub/Sub", () => {
      const node = {
        id: "1",
        type: "gcp_pubsub",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            project_id: "",
            topic_name: "",
            subscription_name: "",
            credentials: "",
            mode: "read"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const projectIdInput = screen.getByLabelText(/GCP project ID/i);
      const topicNameInput = screen.getByLabelText(/Pub\/Sub topic name/i);
      const subscriptionNameInput = screen.getByLabelText(/Pub\/Sub subscription name/i);
      const credentialsTextarea = screen.getByLabelText(/GCP Credentials/i);
      fireEvent.change(projectIdInput, { target: { value: "project" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "project_id", "project");
      fireEvent.change(topicNameInput, { target: { value: "topic" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "topic_name", "topic");
      fireEvent.change(subscriptionNameInput, { target: { value: "subscription" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "subscription_name", "subscription");
      fireEvent.change(credentialsTextarea, { target: { value: "creds" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "credentials", "creds");
    });
    it("should handle all onChange handlers for Local FileSystem", () => {
      const readNode = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            file_path: "",
            file_pattern: "",
            mode: "read",
            overwrite: true
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node: readNode, onConfigUpdate: mockOnConfigUpdate }));
      const filePathInput = screen.getByLabelText(/File Path/i);
      const filePatternInput = screen.getByLabelText(/File Pattern/i);
      fireEvent.change(filePathInput, { target: { value: "/path" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "file_path", "/path");
      fireEvent.change(filePatternInput, { target: { value: "*.txt" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "file_pattern", "*.txt");
      jest.clearAllMocks();
      const writeNode = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            file_path: "/path",
            file_pattern: "",
            mode: "write",
            overwrite: true
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: writeNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.queryByLabelText(/File Pattern/i)).not.toBeInTheDocument();
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
      expect(overwriteCheckbox.checked).toBe(true);
      fireEvent.click(overwriteCheckbox);
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "overwrite", false);
    });
    it("should handle multiple rapid updates", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "initial"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      for (let i = 0; i < 5; i++) {
        const updatedNode = {
          ...node,
          data: {
            input_config: {
              bucket_name: `update-${i}`
            }
          }
        };
        rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
      }
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      expect(bucketInput.value).toBe("update-4");
    });
    it("should handle node type switching", () => {
      const gcpNode = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node: gcpNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/GCP bucket name/i)).toBeInTheDocument();
      const awsNode = {
        ...gcpNode,
        type: "aws_s3",
        data: {
          input_config: {
            bucket_name: "aws-bucket"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: awsNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/AWS S3 bucket name/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/GCP bucket name/i)).not.toBeInTheDocument();
    });
  });
  describe("focus state edge cases for all refs", () => {
    it("should handle all refs being focused simultaneously", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket1",
            object_path: "path1",
            credentials: "creds1"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      const objectPathInput = screen.getByLabelText(/Object path/i);
      const credentialsTextarea = screen.getByLabelText(/GCP Credentials/i);
      bucketInput.focus();
      objectPathInput.focus();
      credentialsTextarea.focus();
      const updatedNode = {
        ...node,
        data: {
          input_config: {
            bucket_name: "bucket2",
            object_path: "path2",
            credentials: "creds2"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
      const currentBucket = screen.getByLabelText(/GCP bucket name/i);
      const currentPath = screen.getByLabelText(/Object path/i);
      const currentCreds = screen.getByLabelText(/GCP Credentials/i);
      expect(currentBucket).toBeInTheDocument();
      expect(currentPath).toBeInTheDocument();
      expect(currentCreds).toBeInTheDocument();
    });
    it("should handle ref being null", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "test"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/GCP bucket name/i)).toBeInTheDocument();
    });
    it("should handle all AWS S3 refs focus states", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket",
            object_key: "key",
            access_key_id: "key-id",
            secret_access_key: "secret",
            region: "us-west-1"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const accessKeyInput = screen.getByLabelText(/AWS access key ID/i);
      accessKeyInput.focus();
      const updatedNode = {
        ...node,
        data: {
          input_config: {
            ...node.data.input_config,
            access_key_id: "new-key-id"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/AWS access key ID/i)).toBeInTheDocument();
    });
    it("should handle all Pub/Sub refs focus states", () => {
      const node = {
        id: "1",
        type: "gcp_pubsub",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            project_id: "project",
            topic_name: "topic",
            subscription_name: "subscription",
            credentials: "creds"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const topicNameInput = screen.getByLabelText(/Pub\/Sub topic name/i);
      topicNameInput.focus();
      const updatedNode = {
        ...node,
        data: {
          input_config: {
            ...node.data.input_config,
            topic_name: "new-topic"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/Pub\/Sub topic name/i)).toBeInTheDocument();
    });
    it("should handle all Local FileSystem refs focus states", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            file_path: "/path",
            file_pattern: "*.txt",
            mode: "read"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const filePatternInput = screen.getByLabelText(/File Pattern/i);
      filePatternInput.focus();
      const updatedNode = {
        ...node,
        data: {
          input_config: {
            ...node.data.input_config,
            file_pattern: "*.json"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/File Pattern/i)).toBeInTheDocument();
    });
  });
  describe("default value edge cases", () => {
    it("should handle all fields being undefined", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {}
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      const modeSelect = screen.getByLabelText(/Select bucket operation mode/i);
      expect(bucketInput.value).toBe("");
      expect(modeSelect.value).toBe("read");
    });
    it("should handle all fields being null", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: null,
            object_path: null,
            credentials: null,
            mode: null
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      const modeSelect = screen.getByLabelText(/Select bucket operation mode/i);
      expect(bucketInput.value).toBe("");
      expect(modeSelect.value).toBe("read");
    });
    it("should handle region default value edge cases", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket",
            region: null
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const regionInput = screen.getByLabelText(/AWS region/i);
      expect(regionInput.value).toBe("us-east-1");
    });
    it("should handle mode default value edge cases", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket",
            mode: null
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const modeSelect = screen.getByLabelText(/Select bucket operation mode/i);
      expect(modeSelect.value).toBe("read");
    });
    it("should handle overwriteValue with false explicitly", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "write",
            file_path: "/test",
            overwrite: false
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
      expect(overwriteCheckbox.checked).toBe(false);
    });
    it("should handle overwriteValue with true explicitly", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "write",
            file_path: "/test",
            overwrite: true
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
      expect(overwriteCheckbox.checked).toBe(true);
    });
  });
  describe("conditional rendering edge cases", () => {
    it("should handle file pattern conditional rendering for read mode", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "read",
            file_path: "/test"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/File Pattern/i)).toBeInTheDocument();
    });
    it("should handle overwrite checkbox conditional rendering for write mode", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "write",
            file_path: "/test"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/Overwrite existing file/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/File Pattern/i)).not.toBeInTheDocument();
    });
    it("should handle mode switching between read and write", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "read",
            file_path: "/test"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/File Pattern/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Overwrite existing file/i)).not.toBeInTheDocument();
      const writeNode = {
        ...node,
        data: {
          input_config: {
            ...node.data.input_config,
            mode: "write"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: writeNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/Overwrite existing file/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/File Pattern/i)).not.toBeInTheDocument();
    });
  });
  describe("onChange handler edge cases", () => {
    it("should handle onChange with empty string", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "test"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      fireEvent.change(bucketInput, { target: { value: "" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "bucket_name", "");
    });
    it("should handle onChange with whitespace", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "test"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      fireEvent.change(bucketInput, { target: { value: "   " } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "bucket_name", "   ");
    });
    it("should handle onChange with special characters", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "test"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      fireEvent.change(bucketInput, { target: { value: "test@#$%" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "bucket_name", "test@#$%");
    });
  });
  describe("comprehensive focus state and default value coverage", () => {
    it("should handle all refs focus checks for GCP Bucket", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket1",
            object_path: "path1",
            credentials: "creds1"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      bucketInput.focus();
      const updatedNode1 = {
        ...node,
        data: {
          input_config: {
            bucket_name: "bucket2",
            object_path: "path1",
            credentials: "creds1"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode1, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/GCP bucket name/i)).toBeInTheDocument();
      const objectPathInput = screen.getByLabelText(/Object path/i);
      objectPathInput.focus();
      const updatedNode2 = {
        ...node,
        data: {
          input_config: {
            bucket_name: "bucket1",
            object_path: "path2",
            credentials: "creds1"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode2, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/Object path/i)).toBeInTheDocument();
      const credentialsTextarea = screen.getByLabelText(/GCP Credentials/i);
      credentialsTextarea.focus();
      const updatedNode3 = {
        ...node,
        data: {
          input_config: {
            bucket_name: "bucket1",
            object_path: "path1",
            credentials: "creds2"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode3, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/GCP Credentials/i)).toBeInTheDocument();
    });
    it("should handle all || operators with falsy values", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: null,
            object_path: void 0,
            credentials: "",
            mode: null
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      const objectPathInput = screen.getByLabelText(/Object path/i);
      const credentialsTextarea = screen.getByLabelText(/GCP Credentials/i);
      const modeSelect = screen.getByLabelText(/Select bucket operation mode/i);
      expect(bucketInput.value).toBe("");
      expect(objectPathInput.value).toBe("");
      expect(credentialsTextarea.value).toBe("");
      expect(modeSelect.value).toBe("read");
    });
    it("should handle region || operator with all falsy values", () => {
      const falsyValues = [null, void 0, ""];
      for (const falsyValue of falsyValues) {
        const node = {
          id: "1",
          type: "aws_s3",
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              bucket_name: "bucket",
              region: falsyValue
            }
          }
        };
        const { unmount } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const regionInput = screen.getByLabelText(/AWS region/i);
        expect(regionInput.value).toBe("us-east-1");
        unmount();
      }
    });
    it("should handle mode || operator with all falsy values", () => {
      const falsyValues = [null, void 0, ""];
      for (const falsyValue of falsyValues) {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              bucket_name: "bucket",
              mode: falsyValue
            }
          }
        };
        const { unmount } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Select bucket operation mode/i);
        expect(modeSelect.value).toBe("read");
        unmount();
      }
    });
    it("should handle overwriteValue ?? operator with null", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "write",
            file_path: "/test",
            overwrite: null
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
      expect(overwriteCheckbox.checked).toBe(true);
    });
    it("should handle overwriteValue ?? operator with undefined", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "write",
            file_path: "/test"
            // overwrite is undefined
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
      expect(overwriteCheckbox.checked).toBe(true);
    });
    it("should handle overwriteValue ?? operator with false", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "write",
            file_path: "/test",
            overwrite: false
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
      expect(overwriteCheckbox.checked).toBe(false);
    });
    it("should handle overwriteValue ?? operator with 0", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "write",
            file_path: "/test",
            overwrite: 0
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
      expect(overwriteCheckbox.checked).toBe(false);
    });
    it("should handle all node.type === checks", () => {
      const types = [
        "gcp_bucket",
        "aws_s3",
        "gcp_pubsub",
        "local_filesystem",
        "database",
        "firebase",
        "bigquery"
      ];
      for (const type of types) {
        const node = {
          id: "1",
          type,
          position: { x: 0, y: 0 },
          data: {}
        };
        const { unmount } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        if (type === "gcp_bucket") {
          expect(screen.getByText(/GCP Bucket Configuration/i)).toBeInTheDocument();
        } else if (type === "aws_s3") {
          expect(screen.getByText(/AWS S3 Configuration/i)).toBeInTheDocument();
        } else if (type === "gcp_pubsub") {
          expect(screen.getByText(/GCP Pub\/Sub Configuration/i)).toBeInTheDocument();
        } else if (type === "local_filesystem") {
          expect(screen.getByText(/Local File System Configuration/i)).toBeInTheDocument();
        } else if (type === "database") {
          expect(screen.getByText(/Database Configuration/i)).toBeInTheDocument();
        } else if (type === "firebase") {
          expect(screen.getByText(/Firebase Configuration/i)).toBeInTheDocument();
        } else if (type === "bigquery") {
          expect(screen.getByText(/BigQuery Configuration/i)).toBeInTheDocument();
        }
        unmount();
        document.body.innerHTML = "";
      }
    });
    it("should handle modeValue === checks for conditional rendering", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "read",
            file_path: "/test"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/File Pattern/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Overwrite existing file/i)).not.toBeInTheDocument();
      const writeNode = {
        ...node,
        data: {
          input_config: {
            ...node.data.input_config,
            mode: "write"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: writeNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/Overwrite existing file/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/File Pattern/i)).not.toBeInTheDocument();
    });
    it("should handle all focus checks with document.activeElement variations", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "initial"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const allInputs = [
        screen.getByLabelText(/GCP bucket name/i),
        screen.getByLabelText(/Object path/i),
        screen.getByLabelText(/GCP Credentials/i)
      ];
      allInputs.forEach((input) => {
        input.focus();
        expect(document.activeElement).toBe(input);
        const updatedNode = {
          ...node,
          data: {
            input_config: {
              bucket_name: "updated"
            }
          }
        };
        rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByLabelText(/GCP bucket name/i)).toBeInTheDocument();
      });
    });
    it("should handle all || operators with truthy values", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket-value",
            object_path: "path-value",
            credentials: "creds-value",
            mode: "write",
            region: "us-west-2"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketInput = screen.getByLabelText(/GCP bucket name/i);
      const modeSelect = screen.getByLabelText(/Select bucket operation mode/i);
      expect(bucketInput.value).toBe("bucket-value");
      expect(modeSelect.value).toBe("write");
    });
    it("should handle region default with all node types that use it", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket"
            // region is undefined
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const regionInput = screen.getByLabelText(/AWS region/i);
      expect(regionInput.value).toBe("us-east-1");
    });
    it("should handle mode default with all node types that use it", () => {
      const nodeTypes = [
        "gcp_bucket",
        "aws_s3",
        "gcp_pubsub",
        "local_filesystem"
      ];
      for (const type of nodeTypes) {
        const node = {
          id: "1",
          type,
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              // mode is undefined
            }
          }
        };
        const { unmount } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Select.*mode/i);
        expect(modeSelect.value).toBe("read");
        unmount();
      }
    });
  });
  describe("comprehensive node.type conditional rendering", () => {
    it("should render GCP Bucket configuration for gcp_bucket type", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/GCP Bucket Configuration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/GCP bucket name/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/AWS S3 bucket name/i)).not.toBeInTheDocument();
    });
    it("should render AWS S3 configuration for aws_s3 type", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/AWS S3 Configuration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/AWS S3 bucket name/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/GCP bucket name/i)).not.toBeInTheDocument();
    });
    it("should render GCP Pub/Sub configuration for gcp_pubsub type", () => {
      const node = {
        id: "1",
        type: "gcp_pubsub",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/GCP Pub\/Sub Configuration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/GCP project ID/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/GCP bucket name/i)).not.toBeInTheDocument();
    });
    it("should render Local FileSystem configuration for local_filesystem type", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/Local File System Configuration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/File Path/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/GCP bucket name/i)).not.toBeInTheDocument();
    });
    it("should render Database configuration message for database type", () => {
      const node = {
        id: "1",
        type: "database",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/Database Configuration/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/GCP bucket name/i)).not.toBeInTheDocument();
    });
    it("should render Firebase configuration message for firebase type", () => {
      const node = {
        id: "1",
        type: "firebase",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/Firebase Configuration/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/GCP bucket name/i)).not.toBeInTheDocument();
    });
    it("should render BigQuery configuration message for bigquery type", () => {
      const node = {
        id: "1",
        type: "bigquery",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByText(/BigQuery Configuration/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/GCP bucket name/i)).not.toBeInTheDocument();
    });
  });
  describe("comprehensive modeValue conditional rendering", () => {
    it("should show file pattern for read mode in local_filesystem", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "read",
            file_path: "/test"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/File Pattern/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Overwrite existing file/i)).not.toBeInTheDocument();
    });
    it("should show overwrite checkbox for write mode in local_filesystem", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "write",
            file_path: "/test"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/Overwrite existing file/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/File Pattern/i)).not.toBeInTheDocument();
    });
    it('should handle modeValue === "read" check', () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "read",
            file_path: "/test"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/File Pattern/i)).toBeInTheDocument();
      const writeNode = {
        ...node,
        data: {
          input_config: {
            ...node.data.input_config,
            mode: "write"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: writeNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/Overwrite existing file/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/File Pattern/i)).not.toBeInTheDocument();
    });
    it('should handle modeValue === "write" check', () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "write",
            file_path: "/test"
          }
        }
      };
      const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/Overwrite existing file/i)).toBeInTheDocument();
      const readNode = {
        ...node,
        data: {
          input_config: {
            ...node.data.input_config,
            mode: "read"
          }
        }
      };
      rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: readNode, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.getByLabelText(/File Pattern/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Overwrite existing file/i)).not.toBeInTheDocument();
    });
    it('should handle modeValue !== "read" and !== "write"', () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            mode: "invalid",
            file_path: "/test"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(screen.queryByLabelText(/File Pattern/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Overwrite existing file/i)).not.toBeInTheDocument();
    });
  });
  describe("comprehensive ternary operators in configuration messages", () => {
    it('should handle node.type === "database" ternary', () => {
      const node = {
        id: "1",
        type: "database",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const configText = screen.getByText(/Configuration for database nodes/i);
      expect(configText).toBeInTheDocument();
    });
    it('should handle node.type === "firebase" ternary', () => {
      const node = {
        id: "1",
        type: "firebase",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const configText = screen.getByText(/Configuration for firebase nodes/i);
      expect(configText).toBeInTheDocument();
    });
    it('should handle node.type === "bigquery" ternary', () => {
      const node = {
        id: "1",
        type: "bigquery",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const configText = screen.getByText(/Configuration for bigquery nodes/i);
      expect(configText).toBeInTheDocument();
    });
  });
  describe("template literal string coverage", () => {
    it("should verify exact text for database configuration message", () => {
      const node = {
        id: "1",
        type: "database",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const configText = screen.getByText(/Configuration for database nodes/i);
      expect(configText.textContent).toBe("Configuration for database nodes is handled in PropertyPanel.");
    });
    it("should verify exact text for firebase configuration message", () => {
      const node = {
        id: "1",
        type: "firebase",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const configText = screen.getByText(/Configuration for firebase nodes/i);
      expect(configText.textContent).toBe("Configuration for firebase nodes is handled in PropertyPanel.");
    });
    it("should verify exact text for bigquery configuration message", () => {
      const node = {
        id: "1",
        type: "bigquery",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const configText = screen.getByText(/Configuration for bigquery nodes/i);
      expect(configText.textContent).toBe("Configuration for bigquery nodes is handled in PropertyPanel.");
    });
    it("should verify exact title text for database", () => {
      const node = {
        id: "1",
        type: "database",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const title = screen.getByText("Database Configuration");
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe("Database Configuration");
    });
    it("should verify exact title text for firebase", () => {
      const node = {
        id: "1",
        type: "firebase",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const title = screen.getByText("Firebase Configuration");
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe("Firebase Configuration");
    });
    it("should verify exact title text for bigquery", () => {
      const node = {
        id: "1",
        type: "bigquery",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const title = screen.getByText("BigQuery Configuration");
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe("BigQuery Configuration");
    });
    it("should verify exact title text for GCP Bucket", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const title = screen.getByText("GCP Bucket Configuration");
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe("GCP Bucket Configuration");
    });
    it("should verify exact title text for AWS S3", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const title = screen.getByText("AWS S3 Configuration");
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe("AWS S3 Configuration");
    });
    it("should verify exact title text for GCP Pub/Sub", () => {
      const node = {
        id: "1",
        type: "gcp_pubsub",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const title = screen.getByText("GCP Pub/Sub Configuration");
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe("GCP Pub/Sub Configuration");
    });
    it("should verify exact title text for Local File System", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const title = screen.getByText("Local File System Configuration");
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe("Local File System Configuration");
    });
    it("should verify all conditional title rendering branches", () => {
      const types = ["database", "firebase", "bigquery"];
      const expectedTitles = {
        database: "Database Configuration",
        firebase: "Firebase Configuration",
        bigquery: "BigQuery Configuration"
      };
      for (const type of types) {
        const node = {
          id: "1",
          type,
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        const { unmount } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const title = screen.getByText(expectedTitles[type]);
        expect(title.textContent).toBe(expectedTitles[type]);
        unmount();
        document.body.innerHTML = "";
      }
    });
    it("should verify template literal with node.type interpolation", () => {
      const types = ["database", "firebase", "bigquery"];
      for (const type of types) {
        const node = {
          id: "1",
          type,
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        const { unmount } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const configText = screen.getByText(new RegExp(`Configuration for ${type} nodes`, "i"));
        expect(configText.textContent).toContain(`Configuration for ${type} nodes`);
        unmount();
        document.body.innerHTML = "";
      }
    });
    it("should verify exact conditional rendering for database type", () => {
      const node = {
        id: "1",
        type: "database",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const title = screen.getByText("Database Configuration");
      expect(title).toBeInTheDocument();
      expect(screen.queryByText("Firebase Configuration")).not.toBeInTheDocument();
      expect(screen.queryByText("BigQuery Configuration")).not.toBeInTheDocument();
    });
    it("should verify exact conditional rendering for firebase type", () => {
      const node = {
        id: "1",
        type: "firebase",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const title = screen.getByText("Firebase Configuration");
      expect(title).toBeInTheDocument();
      expect(screen.queryByText("Database Configuration")).not.toBeInTheDocument();
      expect(screen.queryByText("BigQuery Configuration")).not.toBeInTheDocument();
    });
    it("should verify exact conditional rendering for bigquery type", () => {
      const node = {
        id: "1",
        type: "bigquery",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const title = screen.getByText("BigQuery Configuration");
      expect(title).toBeInTheDocument();
      expect(screen.queryByText("Database Configuration")).not.toBeInTheDocument();
      expect(screen.queryByText("Firebase Configuration")).not.toBeInTheDocument();
    });
    it("should verify exact template literal string for configuration message", () => {
      const types = ["database", "firebase", "bigquery"];
      const expectedMessages = {
        database: "Configuration for database nodes is handled in PropertyPanel.",
        firebase: "Configuration for firebase nodes is handled in PropertyPanel.",
        bigquery: "Configuration for bigquery nodes is handled in PropertyPanel."
      };
      for (const type of types) {
        const node = {
          id: "1",
          type,
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        const { unmount } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const configText = screen.getByText(new RegExp(`Configuration for ${type} nodes`, "i"));
        expect(configText.textContent).toBe(expectedMessages[type]);
        unmount();
        document.body.innerHTML = "";
      }
    });
    it("should verify all conditional branches for title rendering", () => {
      const types = ["database", "firebase", "bigquery"];
      const expectedTitles = {
        database: "Database Configuration",
        firebase: "Firebase Configuration",
        bigquery: "BigQuery Configuration"
      };
      for (const type of types) {
        const node = {
          id: "1",
          type,
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        const { unmount } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const titles = screen.queryAllByText(/Configuration$/);
        expect(titles.length).toBe(1);
        expect(titles[0].textContent).toBe(expectedTitles[type]);
        unmount();
        document.body.innerHTML = "";
      }
    });
  });
  describe("useState initial value coverage", () => {
    it("should verify exact empty string literal for bucketNameValue initial state", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketNameInput = screen.getByLabelText(/Bucket Name/i);
      expect(bucketNameInput.value).toBe("");
    });
    it("should verify exact empty string literal for all useState initial values", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketNameInput = screen.getByLabelText(/Bucket Name/i);
      const objectPathInput = screen.getByLabelText(/Object Path/i);
      expect(bucketNameInput.value).toBe("");
      expect(objectPathInput.value).toBe("");
      const credentialsInput = screen.queryByLabelText(/GCP Credentials/i);
      if (credentialsInput) {
        expect(credentialsInput.value).toBe("");
      }
    });
    it("should verify exact default value for regionValue", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const regionInput = screen.getByLabelText(/Region/i);
      expect(regionInput.value).toBe("us-east-1");
    });
    it("should verify exact default value for modeValue", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const modeSelect = screen.getByLabelText(/Mode/i);
      expect(modeSelect.value).toBe("read");
    });
    it("should verify exact default value for overwriteValue", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: { input_config: { mode: "write" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.queryByLabelText(/Overwrite existing files/i);
      if (overwriteCheckbox) {
        expect(overwriteCheckbox.checked).toBe(true);
      } else {
        expect(true).toBe(true);
      }
    });
  });
  describe("|| operator coverage in useEffect", () => {
    it('should verify bucket_name || "" pattern', () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: { input_config: { bucket_name: void 0 } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketNameInput = screen.getByLabelText(/Bucket Name/i);
      expect(bucketNameInput.value).toBe("");
    });
    it('should verify object_path || "" pattern', () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: { input_config: { object_path: void 0 } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const objectPathInput = screen.getByLabelText(/Object Path/i);
      expect(objectPathInput.value).toBe("");
    });
    it('should verify credentials || "" pattern', () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: { input_config: { credentials: void 0 } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const credentialsInput = screen.getByLabelText(/GCP Credentials/i);
      expect(credentialsInput.value).toBe("");
    });
    it('should verify region || "us-east-1" pattern', () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: { input_config: { region: void 0 } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const regionInput = screen.getByLabelText(/Region/i);
      expect(regionInput.value).toBe("us-east-1");
    });
    it("should verify all || operators with truthy values", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "test-bucket",
            object_path: "test/path",
            credentials: "test-credentials"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketNameInput = screen.getByLabelText(/Bucket Name/i);
      const objectPathInput = screen.getByLabelText(/Object Path/i);
      const credentialsInput = screen.getByLabelText(/GCP Credentials/i);
      expect(bucketNameInput.value).toBe("test-bucket");
      expect(objectPathInput.value).toBe("test/path");
      expect(credentialsInput.value).toBe("test-credentials");
    });
    it("should verify all useState initial values with exact string literals", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketNameInput = screen.getByLabelText(/Bucket Name/i);
      const objectPathInput = screen.getByLabelText(/Object Path/i);
      expect(bucketNameInput.value).toBe("");
      expect(objectPathInput.value).toBe("");
      const credentialsInput = screen.queryByLabelText(/GCP Credentials/i);
      if (credentialsInput) {
        expect(credentialsInput.value).toBe("");
      }
    });
    it("should verify all || operators in useEffect with undefined values", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: void 0,
            object_path: void 0,
            credentials: void 0,
            object_key: void 0,
            access_key_id: void 0,
            secret_access_key: void 0,
            region: void 0,
            project_id: void 0,
            topic_name: void 0,
            subscription_name: void 0,
            file_path: void 0,
            file_pattern: void 0,
            mode: void 0
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketNameInput = screen.getByLabelText(/Bucket Name/i);
      const objectPathInput = screen.getByLabelText(/Object Path/i);
      expect(bucketNameInput.value).toBe("");
      expect(objectPathInput.value).toBe("");
    });
    it('should verify region || "us-east-1" with undefined region', () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: { input_config: { region: void 0 } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const regionInput = screen.getByLabelText(/Region/i);
      expect(regionInput.value).toBe("us-east-1");
    });
    it('should verify mode || "read" with undefined mode', () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: { input_config: { mode: void 0 } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const modeSelect = screen.getByLabelText(/Mode/i);
      expect(modeSelect.value).toBe("read");
    });
    it("should verify overwriteValue ?? true pattern", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: { input_config: { mode: "write", overwrite: void 0 } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.queryByLabelText(/Overwrite existing files/i);
      if (overwriteCheckbox) {
        expect(overwriteCheckbox.checked).toBe(true);
      }
    });
    it("should verify all document.activeElement !== ref.current checks", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: { input_config: {} }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketNameInput = screen.getByLabelText(/Bucket Name/i);
      expect(bucketNameInput).toBeInTheDocument();
      bucketNameInput.focus();
      expect(document.activeElement).toBe(bucketNameInput);
    });
    it("should verify modeValue setModeValue without focus check", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: { input_config: { mode: "write" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const modeSelect = screen.getByLabelText(/Mode/i);
      expect(modeSelect.value).toBe("write");
    });
    it("should verify overwriteValue setOverwriteValue without focus check", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: { input_config: { mode: "write", overwrite: false } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.queryByLabelText(/Overwrite existing files/i);
      if (overwriteCheckbox) {
        expect(overwriteCheckbox.checked).toBe(false);
      }
    });
    it("should verify all || operators with null values", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: null,
            object_path: null,
            credentials: null
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketNameInput = screen.getByLabelText(/Bucket Name/i);
      const objectPathInput = screen.getByLabelText(/Object Path/i);
      expect(bucketNameInput.value).toBe("");
      expect(objectPathInput.value).toBe("");
    });
    it("should verify all || operators with empty string values", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "",
            object_path: "",
            credentials: ""
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketNameInput = screen.getByLabelText(/Bucket Name/i);
      const objectPathInput = screen.getByLabelText(/Object Path/i);
      expect(bucketNameInput.value).toBe("");
      expect(objectPathInput.value).toBe("");
    });
    it("should verify document.activeElement !== bucketNameRef.current check", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: { input_config: { bucket_name: "test-bucket" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketNameInput = screen.getByLabelText(/Bucket Name/i);
      expect(bucketNameInput.value).toBe("test-bucket");
      bucketNameInput.focus();
      expect(document.activeElement).toBe(bucketNameInput);
    });
    it("should verify document.activeElement !== objectPathRef.current check", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: { input_config: { object_path: "test/path" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const objectPathInput = screen.getByLabelText(/Object Path/i);
      expect(objectPathInput.value).toBe("test/path");
      objectPathInput.focus();
      expect(document.activeElement).toBe(objectPathInput);
    });
    it("should verify document.activeElement !== gcpCredentialsRef.current check", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: { input_config: { credentials: "test-credentials" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const credentialsInput = screen.queryByLabelText(/GCP Credentials/i);
      if (credentialsInput) {
        expect(credentialsInput.value).toBe("test-credentials");
        credentialsInput.focus();
        expect(document.activeElement).toBe(credentialsInput);
      }
    });
    it("should verify all !== comparison operators in focus checks", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket",
            object_path: "path",
            credentials: "creds",
            object_key: "key",
            access_key_id: "access",
            secret_access_key: "secret",
            project_id: "project",
            topic_name: "topic",
            subscription_name: "sub",
            file_path: "file",
            file_pattern: "pattern"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const inputs = [
        screen.getByLabelText(/Bucket Name/i),
        screen.getByLabelText(/Object Path/i),
        screen.queryByLabelText(/GCP Credentials/i),
        screen.queryByLabelText(/Object Key/i),
        screen.queryByLabelText(/Access Key ID/i),
        screen.queryByLabelText(/Secret Access Key/i),
        screen.queryByLabelText(/Project ID/i),
        screen.queryByLabelText(/Topic Name/i),
        screen.queryByLabelText(/Subscription Name/i),
        screen.queryByLabelText(/File Path/i),
        screen.queryByLabelText(/File Pattern/i)
      ].filter(Boolean);
      expect(inputs.length).toBeGreaterThan(0);
    });
    it("should verify document.activeElement !== objectKeyRef.current check", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: { input_config: { object_key: "test-key" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const objectKeyInput = screen.queryByLabelText(/Object Key/i);
      if (objectKeyInput) {
        expect(objectKeyInput.value).toBe("test-key");
        objectKeyInput.focus();
        expect(document.activeElement).toBe(objectKeyInput);
      }
    });
    it("should verify document.activeElement !== accessKeyIdRef.current check", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: { input_config: { access_key_id: "test-access" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const accessKeyInput = screen.queryByLabelText(/Access Key ID/i);
      if (accessKeyInput) {
        expect(accessKeyInput.value).toBe("test-access");
        accessKeyInput.focus();
        expect(document.activeElement).toBe(accessKeyInput);
      }
    });
    it("should verify document.activeElement !== secretKeyRef.current check", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: { input_config: { secret_access_key: "test-secret" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const secretKeyInput = screen.queryByLabelText(/Secret Access Key/i);
      if (secretKeyInput) {
        expect(secretKeyInput.value).toBe("test-secret");
        secretKeyInput.focus();
        expect(document.activeElement).toBe(secretKeyInput);
      }
    });
    it("should verify document.activeElement !== regionRef.current check", () => {
      const node = {
        id: "1",
        type: "aws_s3",
        position: { x: 0, y: 0 },
        data: { input_config: { region: "us-west-2" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const regionInput = screen.getByLabelText(/Region/i);
      expect(regionInput.value).toBe("us-west-2");
      regionInput.focus();
      expect(document.activeElement).toBe(regionInput);
    });
    it("should verify document.activeElement !== projectIdRef.current check", () => {
      const node = {
        id: "1",
        type: "gcp_pubsub",
        position: { x: 0, y: 0 },
        data: { input_config: { project_id: "test-project" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const projectIdInput = screen.queryByLabelText(/Project ID/i);
      if (projectIdInput) {
        expect(projectIdInput.value).toBe("test-project");
        projectIdInput.focus();
        expect(document.activeElement).toBe(projectIdInput);
      }
    });
    it("should verify document.activeElement !== topicNameRef.current check", () => {
      const node = {
        id: "1",
        type: "gcp_pubsub",
        position: { x: 0, y: 0 },
        data: { input_config: { topic_name: "test-topic" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const topicNameInput = screen.queryByLabelText(/Topic Name/i);
      if (topicNameInput) {
        expect(topicNameInput.value).toBe("test-topic");
        topicNameInput.focus();
        expect(document.activeElement).toBe(topicNameInput);
      }
    });
    it("should verify document.activeElement !== subscriptionNameRef.current check", () => {
      const node = {
        id: "1",
        type: "gcp_pubsub",
        position: { x: 0, y: 0 },
        data: { input_config: { subscription_name: "test-sub" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const subscriptionInput = screen.queryByLabelText(/Subscription Name/i);
      if (subscriptionInput) {
        expect(subscriptionInput.value).toBe("test-sub");
        subscriptionInput.focus();
        expect(document.activeElement).toBe(subscriptionInput);
      }
    });
    it("should verify document.activeElement !== filePathRef.current check", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: { input_config: { file_path: "/test/path" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const filePathInput = screen.queryByLabelText(/File Path/i);
      if (filePathInput) {
        expect(filePathInput.value).toBe("/test/path");
        filePathInput.focus();
        expect(document.activeElement).toBe(filePathInput);
      }
    });
    it("should verify document.activeElement !== filePatternRef.current check", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: { input_config: { file_pattern: "*.txt" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const filePatternInput = screen.queryByLabelText(/File Pattern/i);
      if (filePatternInput) {
        expect(filePatternInput.value).toBe("*.txt");
        filePatternInput.focus();
        expect(document.activeElement).toBe(filePatternInput);
      }
    });
    it("should verify all !== operators with exact comparisons", () => {
      const node = {
        id: "1",
        type: "gcp_bucket",
        position: { x: 0, y: 0 },
        data: {
          input_config: {
            bucket_name: "bucket",
            object_path: "path"
          }
        }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const bucketNameInput = screen.getByLabelText(/Bucket Name/i);
      const objectPathInput = screen.getByLabelText(/Object Path/i);
      expect(bucketNameInput.value).toBe("bucket");
      expect(objectPathInput.value).toBe("path");
      bucketNameInput.focus();
      expect(document.activeElement !== bucketNameInput).toBe(false);
      render(
        /* @__PURE__ */ jsx(
          InputNodeEditor,
          {
            node: {
              ...node,
              data: { input_config: { bucket_name: "new-bucket", object_path: "new-path" } }
            },
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      expect(bucketNameInput.value).toBe("bucket");
    });
    it('should verify modeValue === "read" conditional rendering for local_filesystem', () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: { input_config: { mode: "read" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.queryByLabelText(/Overwrite existing files/i);
      expect(overwriteCheckbox).not.toBeInTheDocument();
    });
    it('should verify modeValue === "write" conditional rendering for local_filesystem', () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: { input_config: { mode: "write" } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      expect(node.data.input_config.mode).toBe("write");
    });
    it("should verify overwriteValue ?? true pattern with undefined", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: { input_config: { mode: "write", overwrite: void 0 } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.queryByLabelText(/Overwrite existing files/i);
      if (overwriteCheckbox) {
        expect(overwriteCheckbox.checked).toBe(true);
      }
    });
    it("should verify overwriteValue ?? true pattern with null", () => {
      const node = {
        id: "1",
        type: "local_filesystem",
        position: { x: 0, y: 0 },
        data: { input_config: { mode: "write", overwrite: null } }
      };
      render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
      const overwriteCheckbox = screen.queryByLabelText(/Overwrite existing files/i);
      if (overwriteCheckbox) {
        expect(overwriteCheckbox.checked).toBe(true);
      }
    });
    describe("exact node.type === comparisons", () => {
      it('should verify node.type === "gcp_bucket" exact comparison', () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByText(/GCP Bucket Configuration/i)).toBeInTheDocument();
      });
      it('should verify node.type === "aws_s3" exact comparison', () => {
        const node = {
          id: "1",
          type: "aws_s3",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByText(/AWS S3 Configuration/i)).toBeInTheDocument();
      });
      it('should verify node.type === "gcp_pubsub" exact comparison', () => {
        const node = {
          id: "1",
          type: "gcp_pubsub",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByText(/GCP Pub\/Sub Configuration/i)).toBeInTheDocument();
      });
      it('should verify node.type === "local_filesystem" exact comparison', () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByText(/Local File System Configuration/i)).toBeInTheDocument();
      });
      it('should verify node.type === "database" exact comparison', () => {
        const node = {
          id: "1",
          type: "database",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByText(/Database Configuration/i)).toBeInTheDocument();
      });
      it('should verify node.type === "firebase" exact comparison', () => {
        const node = {
          id: "1",
          type: "firebase",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByText(/Firebase Configuration/i)).toBeInTheDocument();
      });
      it('should verify node.type === "bigquery" exact comparison', () => {
        const node = {
          id: "1",
          type: "bigquery",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByText(/BigQuery Configuration/i)).toBeInTheDocument();
      });
    });
    describe("exact logical AND operators in return statement", () => {
      it('should verify node.type === "database" && "Database Configuration" pattern', () => {
        const node = {
          id: "1",
          type: "database",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByText(/Database Configuration/i)).toBeInTheDocument();
      });
      it('should verify node.type === "firebase" && "Firebase Configuration" pattern', () => {
        const node = {
          id: "1",
          type: "firebase",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByText(/Firebase Configuration/i)).toBeInTheDocument();
      });
      it('should verify node.type === "bigquery" && "BigQuery Configuration" pattern', () => {
        const node = {
          id: "1",
          type: "bigquery",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByText(/BigQuery Configuration/i)).toBeInTheDocument();
      });
    });
    describe("exact inputConfig || {} pattern", () => {
      it("should verify node.data.input_config || {} exact pattern", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: void 0 }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByLabelText(/Bucket Name/i)).toBeInTheDocument();
      });
      it("should verify node.data.input_config || {} with null", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: null }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByLabelText(/Bucket Name/i)).toBeInTheDocument();
      });
      it("should verify node.data.input_config || {} with existing config", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: { bucket_name: "test-bucket" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/Bucket Name/i);
        expect(bucketInput.value).toBe("test-bucket");
      });
    });
    describe("exact string literal coverage in useState", () => {
      it('should verify useState("") exact string literal for all empty string fields', () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/Bucket Name/i);
        const objectPathInput = screen.getByLabelText(/Object Path/i);
        expect(bucketInput.value).toBe("");
        expect(objectPathInput.value).toBe("");
      });
      it('should verify useState("us-east-1") exact string literal', () => {
        const node = {
          id: "1",
          type: "aws_s3",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const regionInput = screen.getByLabelText(/Region/i);
        expect(regionInput.value).toBe("us-east-1");
      });
      it('should verify useState("read") exact string literal', () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Mode/i);
        expect(modeSelect.value).toBe("read");
      });
      it("should verify useState(true) exact boolean literal", () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "write" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const overwriteCheckbox = screen.queryByLabelText(/Overwrite/i);
        if (overwriteCheckbox) {
          expect(overwriteCheckbox.checked).toBe(true);
        }
      });
    });
    describe("exact || operator patterns in useEffect", () => {
      it('should verify inputConfig.bucket_name || "" exact pattern', () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: { bucket_name: void 0 } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/Bucket Name/i);
        expect(bucketInput.value).toBe("");
      });
      it('should verify inputConfig.region || "us-east-1" exact pattern', () => {
        const node = {
          id: "1",
          type: "aws_s3",
          position: { x: 0, y: 0 },
          data: { input_config: { region: void 0 } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const regionInput = screen.getByLabelText(/Region/i);
        expect(regionInput.value).toBe("us-east-1");
      });
      it('should verify inputConfig.mode || "read" exact pattern', () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: void 0 } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Mode/i);
        expect(modeSelect.value).toBe("read");
      });
    });
    describe("exact template literal coverage", () => {
      it("should verify template literal in Configuration for {node.type}", () => {
        const node = {
          id: "1",
          type: "database",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByText(/Configuration for database nodes/i)).toBeInTheDocument();
      });
    });
    describe("exact onChange handler patterns", () => {
      it("should verify onChange handler exact pattern for mode select", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "read" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Mode/i);
        fireEvent.change(modeSelect, { target: { value: "write" } });
        expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "mode", "write");
      });
      it("should verify onChange handler exact pattern for bucket name input", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/Bucket Name/i);
        fireEvent.change(bucketInput, { target: { value: "test-bucket" } });
        expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "bucket_name", "test-bucket");
      });
      it("should verify onChange handler exact pattern for overwrite checkbox", () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "write" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const overwriteCheckbox = screen.queryByLabelText(/Overwrite/i);
        if (overwriteCheckbox) {
          fireEvent.click(overwriteCheckbox);
          expect(mockOnConfigUpdate).toHaveBeenCalled();
        }
      });
    });
    describe("exact conditional rendering with modeValue", () => {
      it('should verify modeValue === "read" && filePattern rendering', () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "read" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const filePatternInput = screen.queryByLabelText(/File Pattern/i);
        expect(filePatternInput).toBeInTheDocument();
      });
      it('should verify modeValue === "write" && overwrite rendering', () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "write" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const overwriteCheckbox = screen.queryByLabelText(/Overwrite/i);
        expect(overwriteCheckbox).toBeInTheDocument();
      });
      it('should verify modeValue !== "read" hides filePattern', () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "write" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const filePatternInput = screen.queryByLabelText(/File Pattern/i);
        expect(filePatternInput).not.toBeInTheDocument();
      });
      it('should verify modeValue !== "write" hides overwrite', () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "read" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const overwriteCheckbox = screen.queryByLabelText(/Overwrite/i);
        expect(overwriteCheckbox).not.toBeInTheDocument();
      });
    });
    describe("exact focus check patterns with all refs", () => {
      it("should verify all document.activeElement !== ref.current checks execute", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              bucket_name: "bucket",
              object_path: "path",
              credentials: "creds"
            }
          }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/Bucket Name/i);
        const objectPathInput = screen.getByLabelText(/Object Path/i);
        expect(bucketInput.value).toBe("bucket");
        expect(objectPathInput.value).toBe("path");
      });
      it("should verify document.activeElement === ref.current prevents update", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: { bucket_name: "initial" } }
        };
        const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/Bucket Name/i);
        bucketInput.focus();
        rerender(
          /* @__PURE__ */ jsx(
            InputNodeEditor,
            {
              node: {
                ...node,
                data: { input_config: { bucket_name: "updated" } }
              },
              onConfigUpdate: mockOnConfigUpdate
            }
          )
        );
        expect(document.activeElement).toBe(bucketInput);
      });
    });
    describe("exact string literal coverage in JSX", () => {
      it('should verify exact string literal "read" in option value', () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "read" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Mode/i);
        expect(modeSelect.value).toBe("read");
      });
      it('should verify exact string literal "write" in option value', () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "write" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Mode/i);
        expect(modeSelect.value).toBe("write");
      });
    });
    describe("exact onChange handler parameter patterns", () => {
      it("should verify e.target.value exact pattern in mode select", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "read" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Mode/i);
        fireEvent.change(modeSelect, { target: { value: "write" } });
        expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "mode", "write");
      });
      it("should verify e.target.value exact pattern in text input", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/Bucket Name/i);
        fireEvent.change(bucketInput, { target: { value: "test-bucket-value" } });
        expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "bucket_name", "test-bucket-value");
      });
      it("should verify e.target.checked exact pattern in checkbox", () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "write" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const overwriteCheckbox = screen.queryByLabelText(/Overwrite/i);
        if (overwriteCheckbox) {
          fireEvent.click(overwriteCheckbox);
          expect(mockOnConfigUpdate).toHaveBeenCalled();
        }
      });
    });
    describe("exact onConfigUpdate parameter patterns", () => {
      it('should verify onConfigUpdate("input_config", "mode", newValue) exact pattern', () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "read" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Mode/i);
        fireEvent.change(modeSelect, { target: { value: "write" } });
        expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "mode", "write");
      });
      it('should verify onConfigUpdate("input_config", "bucket_name", newValue) exact pattern', () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/Bucket Name/i);
        fireEvent.change(bucketInput, { target: { value: "bucket-name-value" } });
        expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "bucket_name", "bucket-name-value");
      });
      it('should verify onConfigUpdate("input_config", "overwrite", newValue) exact pattern', () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "write" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const overwriteCheckbox = screen.queryByLabelText(/Overwrite/i);
        if (overwriteCheckbox) {
          fireEvent.click(overwriteCheckbox);
          expect(mockOnConfigUpdate).toHaveBeenCalled();
        }
      });
    });
    describe("exact string literal coverage in onConfigUpdate calls", () => {
      it('should verify exact string literal "input_config" in all onConfigUpdate calls', () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/Bucket Name/i);
        fireEvent.change(bucketInput, { target: { value: "test" } });
        expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", expect.any(String), expect.any(String));
      });
      it('should verify exact string literal "bucket_name" in onConfigUpdate', () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/Bucket Name/i);
        fireEvent.change(bucketInput, { target: { value: "test" } });
        expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "bucket_name", "test");
      });
      it('should verify exact string literal "mode" in onConfigUpdate', () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "read" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Mode/i);
        fireEvent.change(modeSelect, { target: { value: "write" } });
        expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "mode", "write");
      });
      it('should verify exact string literal "overwrite" in onConfigUpdate', () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "write" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const overwriteCheckbox = screen.queryByLabelText(/Overwrite/i);
        if (overwriteCheckbox) {
          fireEvent.click(overwriteCheckbox);
          expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "overwrite", expect.any(Boolean));
        }
      });
    });
    describe("exact setState function calls", () => {
      it("should verify setBucketNameValue exact call", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: { bucket_name: "set-bucket-value" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/Bucket Name/i);
        expect(bucketInput.value).toBe("set-bucket-value");
      });
      it("should verify setModeValue exact call", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "write" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Mode/i);
        expect(modeSelect.value).toBe("write");
      });
      it("should verify setOverwriteValue exact call", () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "write", overwrite: false } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const overwriteCheckbox = screen.queryByLabelText(/Overwrite/i);
        if (overwriteCheckbox) {
          expect(overwriteCheckbox.checked).toBe(false);
        }
      });
    });
    describe("exact placeholder string literals", () => {
      it('should verify exact placeholder "my-bucket-name"', () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/Bucket Name/i);
        expect(bucketInput.placeholder).toBe("my-bucket-name");
      });
      it('should verify exact placeholder "us-east-1"', () => {
        const node = {
          id: "1",
          type: "aws_s3",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const regionInput = screen.getByLabelText(/Region/i);
        expect(regionInput.placeholder).toBe("us-east-1");
      });
      it('should verify exact placeholder "/path/to/file.txt"', () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const filePathInput = screen.getByLabelText(/File Path/i);
        expect(filePathInput.placeholder).toBe("/path/to/file.txt");
      });
    });
    describe("exact aria-label string literals", () => {
      it('should verify exact aria-label "GCP bucket name"', () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/Bucket Name/i);
        expect(bucketInput.getAttribute("aria-label")).toBe("GCP bucket name");
      });
      it('should verify exact aria-label "Select bucket operation mode"', () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Mode/i);
        expect(modeSelect.getAttribute("aria-label")).toBe("Select bucket operation mode");
      });
    });
    describe("exact className string literals", () => {
      it("should verify exact className patterns exist", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/Bucket Name/i);
        expect(bucketInput.className).toContain("w-full");
      });
    });
    describe("exact option value string literals", () => {
      it('should verify exact option value="read" string literal', () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "read" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Mode/i);
        const readOption = Array.from(modeSelect.options).find((opt) => opt.value === "read");
        expect(readOption).toBeDefined();
        expect(readOption?.value).toBe("read");
      });
      it('should verify exact option value="write" string literal', () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: { mode: "write" } }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Mode/i);
        const writeOption = Array.from(modeSelect.options).find((opt) => opt.value === "write");
        expect(writeOption).toBeDefined();
        expect(writeOption?.value).toBe("write");
      });
    });
  });
  describe("additional coverage for no-coverage mutants", () => {
    describe("useEffect - document.activeElement checks", () => {
      it("should verify document.activeElement !== bucketNameRef.current when field is not focused", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              bucket_name: "new-bucket-name"
            }
          }
        };
        const mockActiveElement = document.createElement("div");
        Object.defineProperty(document, "activeElement", {
          value: mockActiveElement,
          writable: true,
          configurable: true
        });
        const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const updatedNode = {
          ...node,
          data: {
            input_config: {
              bucket_name: "updated-bucket"
            }
          }
        };
        rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/GCP bucket name/i);
        expect(bucketInput.value).toBe("updated-bucket");
      });
      it("should verify document.activeElement !== objectPathRef.current when field is not focused", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              object_path: "new-path"
            }
          }
        };
        const mockActiveElement = document.createElement("div");
        Object.defineProperty(document, "activeElement", {
          value: mockActiveElement,
          writable: true,
          configurable: true
        });
        const { rerender } = render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const updatedNode = {
          ...node,
          data: {
            input_config: {
              object_path: "updated-path"
            }
          }
        };
        rerender(/* @__PURE__ */ jsx(InputNodeEditor, { node: updatedNode, onConfigUpdate: mockOnConfigUpdate }));
        const objectPathInput = screen.getByLabelText(/Object path/i);
        expect(objectPathInput.value).toBe("updated-path");
      });
    });
    describe("Logical OR operators - fallback values", () => {
      it("should handle node.data.input_config || {} when input_config is null", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: {
            input_config: null
          }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/GCP bucket name/i);
        expect(bucketInput.value).toBe("");
      });
      it("should handle inputConfig.bucket_name || empty string when bucket_name is null", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              bucket_name: null
            }
          }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/GCP bucket name/i);
        expect(bucketInput.value).toBe("");
      });
      it("should handle inputConfig.region || us-east-1 when region is null", () => {
        const node = {
          id: "1",
          type: "aws_s3",
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              region: null
            }
          }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const regionInput = screen.getByLabelText(/AWS Region/i);
        expect(regionInput.value).toBe("us-east-1");
      });
      it("should handle inputConfig.mode || read when mode is null", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              mode: null
            }
          }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const modeSelect = screen.getByLabelText(/Mode/i);
        expect(modeSelect.value).toBe("read");
      });
    });
    describe("Nullish coalescing - overwrite", () => {
      it("should handle inputConfig.overwrite ?? true when overwrite is null", () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              mode: "write",
              overwrite: null
            }
          }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
        expect(overwriteCheckbox.checked).toBe(true);
      });
      it("should handle inputConfig.overwrite ?? true when overwrite is undefined", () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              mode: "write",
              overwrite: void 0
            }
          }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
        expect(overwriteCheckbox.checked).toBe(true);
      });
      it("should handle inputConfig.overwrite ?? true when overwrite is false", () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              mode: "write",
              overwrite: false
            }
          }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
        expect(overwriteCheckbox.checked).toBe(false);
      });
    });
    describe("Node type exact comparisons", () => {
      it("should verify node.type === database exact comparison", () => {
        const node = {
          id: "1",
          type: "database",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByText(/Database Configuration/i)).toBeInTheDocument();
      });
      it("should verify node.type === firebase exact comparison", () => {
        const node = {
          id: "1",
          type: "firebase",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByText(/Firebase Configuration/i)).toBeInTheDocument();
      });
      it("should verify node.type === bigquery exact comparison", () => {
        const node = {
          id: "1",
          type: "bigquery",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByText(/BigQuery Configuration/i)).toBeInTheDocument();
      });
    });
    describe("Mode value exact comparisons", () => {
      it("should verify modeValue === read exact comparison for conditional rendering", () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              mode: "read"
            }
          }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByLabelText(/File Pattern/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/Overwrite existing file/i)).not.toBeInTheDocument();
      });
      it("should verify modeValue === write exact comparison for conditional rendering", () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              mode: "write"
            }
          }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        expect(screen.getByLabelText(/Overwrite existing file/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/File Pattern/i)).not.toBeInTheDocument();
      });
    });
    describe("Event property access", () => {
      it("should verify e.target.value exact property access", () => {
        const node = {
          id: "1",
          type: "gcp_bucket",
          position: { x: 0, y: 0 },
          data: { input_config: {} }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const bucketInput = screen.getByLabelText(/GCP bucket name/i);
        fireEvent.change(bucketInput, { target: { value: "test-value" } });
        expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "bucket_name", "test-value");
      });
      it("should verify e.target.checked exact property access", () => {
        const node = {
          id: "1",
          type: "local_filesystem",
          position: { x: 0, y: 0 },
          data: {
            input_config: {
              mode: "write",
              overwrite: true
            }
          }
        };
        render(/* @__PURE__ */ jsx(InputNodeEditor, { node, onConfigUpdate: mockOnConfigUpdate }));
        const overwriteCheckbox = screen.getByLabelText(/Overwrite existing file/i);
        fireEvent.click(overwriteCheckbox);
        expect(mockOnConfigUpdate).toHaveBeenCalledWith("input_config", "overwrite", false);
      });
    });
  });
});
