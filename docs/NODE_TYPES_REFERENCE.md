# Node Types Reference

Complete reference for all node types, their configuration options, inputs, outputs, and usage examples.

## Table of Contents

1. [Node Types Overview](#node-types-overview)
2. [Agent Nodes](#agent-nodes)
3. [Condition Nodes](#condition-nodes)
4. [Loop Nodes](#loop-nodes)
5. [Storage Nodes](#storage-nodes)
   - [GCP Bucket](#gcp-bucket)
   - [AWS S3](#aws-s3)
   - [Local Filesystem](#local-filesystem)
   - [GCP Pub/Sub](#gcp-pubsub)
6. [Control Flow Nodes](#control-flow-nodes)
   - [Start Node](#start-node)
   - [End Node](#end-node)
7. [Input Mapping](#input-mapping)
8. [Node Configuration Examples](#node-configuration-examples)

---

## Node Types Overview

| Node Type | Purpose | Configuration | Inputs | Outputs |
|-----------|---------|---------------|--------|---------|
| **agent** | LLM-powered agent execution | `agent_config` | Previous node outputs, variables | LLM response (string) |
| **condition** | Conditional branching | `condition_config` | Previous node outputs | Branch selection (`true`/`false`) |
| **loop** | Iterate over items | `loop_config` | Array/list from previous node | Combined outputs |
| **gcp_bucket** | Google Cloud Storage | `input_config` | Previous node output (write) | File content (read) |
| **aws_s3** | AWS S3 Storage | `input_config` | Previous node output (write) | File content (read) |
| **local_filesystem** | Local file system | `input_config` | Previous node output (write) | File content (read) |
| **gcp_pubsub** | GCP Pub/Sub messaging | `input_config` | Previous node output (write) | Messages (read) |
| **start** | Workflow entry point | None | Execution inputs | Execution inputs |
| **end** | Workflow exit point | None | Previous node output | Final result |

---

## Agent Nodes

**Type:** `agent`

**Purpose:** Execute LLM-powered agents that process inputs and generate outputs.

### Configuration (`agent_config`)

```typescript
interface AgentConfig {
  model: string                    // LLM model name (default: "gpt-4o-mini")
  system_prompt?: string          // System prompt for the agent
  temperature?: number            // Temperature (0.0-2.0, default: 0.7)
  max_tokens?: number             // Maximum tokens in response
  tools?: string[]                // List of tool names to enable
}
```

### Supported Models

**OpenAI:**
- `gpt-4o` - Latest GPT-4 model
- `gpt-4o-mini` - Faster, cheaper GPT-4 model (default)
- `gpt-4-turbo` - GPT-4 Turbo
- `gpt-3.5-turbo` - GPT-3.5 Turbo

**Anthropic:**
- `claude-3-5-sonnet-20241022` - Latest Claude 3.5 Sonnet
- `claude-3-opus-20240229` - Claude 3 Opus
- `claude-3-sonnet-20240229` - Claude 3 Sonnet
- `claude-3-haiku-20240307` - Claude 3 Haiku

**Google Gemini:**
- `gemini-1.5-pro` - Gemini 1.5 Pro
- `gemini-1.5-flash` - Gemini 1.5 Flash
- `gemini-pro` - Gemini Pro

### Inputs

Agent nodes receive inputs from:
- Previous node outputs (via `InputMapping`)
- Workflow variables
- Execution inputs

**Input Format:**
```json
{
  "data": "Input text",
  "context": "Additional context",
  "user_input": "User query"
}
```

### Outputs

**Output Format:**
- **String**: LLM response text (most common)
- **JSON**: If LLM returns structured data
- **Base64 Image**: If LLM generates images (data URL format)

**Example:**
```json
{
  "output": "This is the agent's response text."
}
```

### Configuration Examples

**Basic Agent:**
```json
{
  "id": "agent-1",
  "type": "agent",
  "name": "Writer Agent",
  "agent_config": {
    "model": "gpt-4o-mini",
    "system_prompt": "You are a creative writer.",
    "temperature": 0.7
  }
}
```

**Advanced Agent with Tools:**
```json
{
  "id": "agent-2",
  "type": "agent",
  "name": "Research Agent",
  "agent_config": {
    "model": "gpt-4o",
    "system_prompt": "You are a research assistant.",
    "temperature": 0.3,
    "max_tokens": 2000,
    "tools": ["web_search", "calculator"]
  }
}
```

**Agent with Memory:**
```json
{
  "id": "agent-3",
  "type": "agent",
  "name": "Conversational Agent",
  "agent_config": {
    "model": "claude-3-5-sonnet-20241022",
    "system_prompt": "You are a helpful assistant with memory.",
    "temperature": 0.7
  },
  "data": {
    "memory_enabled": true,
    "memory_type": "short_term"
  }
}
```

### Best Practices

1. **System Prompts**: Be specific and clear about the agent's role
2. **Temperature**: Use lower values (0.3-0.5) for factual tasks, higher (0.7-1.0) for creative tasks
3. **Max Tokens**: Set based on expected response length
4. **Tools**: Enable only necessary tools to reduce costs

---

## Condition Nodes

**Type:** `condition`

**Purpose:** Evaluate conditions and route execution to different branches.

### Configuration (`condition_config`)

```typescript
interface ConditionConfig {
  condition_type: string          // Condition operator (default: "equals")
  field: string                   // Field to evaluate (required)
  value?: string                  // Value to compare against
  custom_expression?: string      // Custom expression (for "custom" type)
}
```

### Condition Types

| Type | Description | Example |
|------|-------------|---------|
| `equals` | Field equals value | `status == "completed"` |
| `not_equals` | Field not equals value | `status != "pending"` |
| `contains` | Field contains value | `message.contains("error")` |
| `not_contains` | Field does not contain value | `!message.contains("error")` |
| `greater_than` | Field greater than value | `count > 10` |
| `not_greater_than` | Field not greater than value | `count <= 10` |
| `less_than` | Field less than value | `count < 10` |
| `not_less_than` | Field not less than value | `count >= 10` |
| `empty` | Field is empty/null | `field == null \|\| field == ""` |
| `not_empty` | Field is not empty | `field != null && field != ""` |
| `custom` | Custom expression | Custom JavaScript-like expression |

### Inputs

Condition nodes receive inputs from previous nodes. The `field` in `condition_config` must exist in the inputs.

**Input Format:**
```json
{
  "status": "completed",
  "count": 5,
  "message": "Success"
}
```

### Outputs

**Output Format:**
```json
{
  "branch": "true",    // or "false"
  "field_value": "completed",
  "condition_met": true
}
```

**Branch Selection:**
- `"true"` branch: Condition evaluates to true
- `"false"` branch: Condition evaluates to false
- `"default"` branch: Always executes (fallback)

### Edge Configuration

Edges from condition nodes should specify the branch condition:

```json
{
  "source": "condition-1",
  "target": "node-true",
  "sourceHandle": "true",      // or "source_handle": "true"
  "condition": "true"
}
```

```json
{
  "source": "condition-1",
  "target": "node-false",
  "sourceHandle": "false",
  "condition": "false"
}
```

### Configuration Examples

**Simple Equals Condition:**
```json
{
  "id": "condition-1",
  "type": "condition",
  "name": "Check Status",
  "condition_config": {
    "condition_type": "equals",
    "field": "status",
    "value": "completed"
  }
}
```

**Contains Condition:**
```json
{
  "id": "condition-2",
  "type": "condition",
  "name": "Check for Error",
  "condition_config": {
    "condition_type": "contains",
    "field": "message",
    "value": "error"
  }
}
```

**Nested Field Access:**
```json
{
  "id": "condition-3",
  "type": "condition",
  "name": "Check Nested Field",
  "condition_config": {
    "condition_type": "equals",
    "field": "data.status",      // Dot notation for nested fields
    "value": "active"
  }
}
```

**Custom Expression:**
```json
{
  "id": "condition-4",
  "type": "condition",
  "name": "Complex Condition",
  "condition_config": {
    "condition_type": "custom",
    "custom_expression": "count > 10 && status == 'active'"
  }
}
```

### Best Practices

1. **Field Names**: Use consistent field names across nodes
2. **Nested Fields**: Use dot notation for nested objects (`data.status`)
3. **Default Branch**: Always provide a default branch for error handling
4. **Value Types**: Ensure value types match (string vs number)

---

## Loop Nodes

**Type:** `loop`

**Purpose:** Iterate over arrays and execute child nodes for each item.

### Configuration (`loop_config`)

```typescript
interface LoopConfig {
  loop_type: string              // "for_each", "while", "until" (default: "for_each")
  items_source?: string          // Input field containing items (auto-detected if not set)
  condition?: string             // Condition for while/until loops
  max_iterations?: number        // Maximum iterations (0 = unlimited)
}
```

### Loop Types

**1. For Each (`for_each`):**
- Iterates over an array/list
- Executes child nodes for each item
- Collects outputs from each iteration

**2. While (`while`):**
- Continues while condition is true
- Requires `condition` field

**3. Until (`until`):**
- Continues until condition is true
- Requires `condition` field

### Inputs

Loop nodes receive an array/list from previous nodes.

**Input Format:**
```json
{
  "items": [1, 2, 3, 4, 5],
  "data": ["item1", "item2", "item3"]
}
```

**Auto-Detection:**
If `items_source` is not specified, loop node auto-detects from common keys:
- `items`
- `data`
- `output`
- `results`

### Outputs

**Output Format:**
```json
{
  "items": [
    {"item": 1, "result": "processed"},
    {"item": 2, "result": "processed"},
    {"item": 3, "result": "processed"}
  ],
  "total": 3,
  "completed": true
}
```

### Configuration Examples

**Basic For Each Loop:**
```json
{
  "id": "loop-1",
  "type": "loop",
  "name": "Process Items",
  "loop_config": {
    "loop_type": "for_each",
    "items_source": "items"
  }
}
```

**For Each with Max Iterations:**
```json
{
  "id": "loop-2",
  "type": "loop",
  "name": "Process Limited Items",
  "loop_config": {
    "loop_type": "for_each",
    "items_source": "data",
    "max_iterations": 100
  }
}
```

**While Loop:**
```json
{
  "id": "loop-3",
  "type": "loop",
  "name": "Process Until Complete",
  "loop_config": {
    "loop_type": "while",
    "condition": "status != 'completed'",
    "max_iterations": 50
  }
}
```

**Auto-Detect Items:**
```json
{
  "id": "loop-4",
  "type": "loop",
  "name": "Auto-Detect Loop",
  "loop_config": {
    "loop_type": "for_each"
    // items_source auto-detected from inputs
  }
}
```

### Best Practices

1. **Max Iterations**: Always set `max_iterations` to prevent infinite loops
2. **Items Source**: Explicitly set `items_source` for clarity
3. **Input Format**: Ensure previous node outputs an array/list
4. **Performance**: Consider batch processing for large arrays

---

## Storage Nodes

Storage nodes can read from or write to various storage systems.

### Common Configuration (`input_config`)

All storage nodes share common configuration:

```typescript
interface InputConfig {
  mode?: 'read' | 'write'        // Operation mode (auto-detected if not set)
  // ... provider-specific fields
}
```

**Mode Detection:**
- **Read Mode**: No incoming edges with data, or `mode: "read"`
- **Write Mode**: Has incoming edges with data, or `mode: "write"`

---

### GCP Bucket

**Type:** `gcp_bucket`

**Purpose:** Read from or write to Google Cloud Storage buckets.

#### Configuration (`input_config`)

```typescript
interface GCPBucketConfig {
  mode?: 'read' | 'write'
  bucket_name: string             // GCS bucket name (required)
  object_path?: string            // Object path in bucket
  credentials?: string            // GCP service account JSON (optional)
}
```

#### Read Mode

**Configuration:**
```json
{
  "mode": "read",
  "bucket_name": "my-bucket",
  "object_path": "data/file.json"
}
```

**Output Format:**
```json
{
  "data": "...",                  // File content
  "source": "gcp_bucket"
}
```

**List Objects:**
```json
{
  "mode": "read",
  "bucket_name": "my-bucket"
  // object_path omitted = list all objects
}
```

**Output:** Array of object names

#### Write Mode

**Configuration:**
```json
{
  "mode": "write",
  "bucket_name": "my-bucket",
  "object_path": "output/result.json"
}
```

**Input:** Data from previous node (automatically extracted)

**Output Format:**
```json
{
  "status": "success",
  "bucket": "my-bucket",
  "object_path": "output/result.json"
}
```

#### Authentication

**Option 1: Service Account JSON (Recommended)**
```json
{
  "bucket_name": "my-bucket",
  "object_path": "file.json",
  "credentials": "{\"type\": \"service_account\", \"project_id\": \"...\", ...}"
}
```

**Option 2: Default Credentials**
- Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Or use metadata service (GCP Compute Engine)

#### Examples

**Read JSON File:**
```json
{
  "id": "gcp-read-1",
  "type": "gcp_bucket",
  "name": "Read from GCS",
  "input_config": {
    "mode": "read",
    "bucket_name": "my-data-bucket",
    "object_path": "data/input.json"
  }
}
```

**Write to GCS:**
```json
{
  "id": "gcp-write-1",
  "type": "gcp_bucket",
  "name": "Write to GCS",
  "input_config": {
    "mode": "write",
    "bucket_name": "my-output-bucket",
    "object_path": "results/output.json"
  }
}
```

---

### AWS S3

**Type:** `aws_s3`

**Purpose:** Read from or write to AWS S3 buckets.

#### Configuration (`input_config`)

```typescript
interface AWSS3Config {
  mode?: 'read' | 'write'
  bucket_name: string             // S3 bucket name (required)
  object_key?: string             // Object key in bucket
  region?: string                 // AWS region (default: us-east-1)
  access_key_id?: string          // AWS access key (optional)
  secret_access_key?: string      // AWS secret key (optional)
}
```

#### Read Mode

**Configuration:**
```json
{
  "mode": "read",
  "bucket_name": "my-s3-bucket",
  "object_key": "data/file.txt",
  "region": "us-east-1"
}
```

**Output Format:**
```json
{
  "data": "...",
  "source": "aws_s3"
}
```

#### Write Mode

**Configuration:**
```json
{
  "mode": "write",
  "bucket_name": "my-s3-bucket",
  "object_key": "output/result.json",
  "region": "us-west-2"
}
```

#### Authentication

**Option 1: Explicit Credentials**
```json
{
  "bucket_name": "my-bucket",
  "object_key": "file.json",
  "access_key_id": "AKIA...",
  "secret_access_key": "...",
  "region": "us-east-1"
}
```

**Option 2: Environment Variables**
```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1
```

**Option 3: IAM Role** (EC2/ECS/Lambda)
- No credentials needed if running on AWS with IAM role

#### Examples

**Read from S3:**
```json
{
  "id": "s3-read-1",
  "type": "aws_s3",
  "name": "Read from S3",
  "input_config": {
    "mode": "read",
    "bucket_name": "my-data-bucket",
    "object_key": "data/input.csv",
    "region": "us-east-1"
  }
}
```

**Write to S3:**
```json
{
  "id": "s3-write-1",
  "type": "aws_s3",
  "name": "Write to S3",
  "input_config": {
    "mode": "write",
    "bucket_name": "my-output-bucket",
    "object_key": "results/output.json",
    "region": "us-west-2"
  }
}
```

---

### Local Filesystem

**Type:** `local_filesystem`

**Purpose:** Read from or write to local file system.

#### Configuration (`input_config`)

```typescript
interface LocalFileSystemConfig {
  mode?: 'read' | 'write'
  file_path: string               // File path (required)
  file_pattern?: string           // Glob pattern for multiple files
  encoding?: string               // File encoding (default: utf-8)
  read_mode?: string              // 'full', 'lines', 'batch', 'tail'
  tail_lines?: number             // Lines to read from end (tail mode)
  batch_size?: number             // Batch size for batch mode
  overwrite?: boolean             // Overwrite existing file (write mode)
}
```

#### Read Modes

**1. Full (`full`):**
- Reads entire file
- Default mode

**2. Lines (`lines`):**
- Reads file line by line
- Returns array of lines
- Useful for Loop nodes

**3. Batch (`batch`):**
- Reads file in batches
- Returns array of batches
- Useful for processing large files

**4. Tail (`tail`):**
- Reads from end of file
- Useful for log files

#### Read Mode Examples

**Read Full File:**
```json
{
  "id": "file-read-1",
  "type": "local_filesystem",
  "name": "Read File",
  "input_config": {
    "mode": "read",
    "file_path": "/path/to/file.txt",
    "read_mode": "full"
  }
}
```

**Read Lines (for Loop):**
```json
{
  "id": "file-read-2",
  "type": "local_filesystem",
  "name": "Read Lines",
  "input_config": {
    "mode": "read",
    "file_path": "/path/to/data.csv",
    "read_mode": "lines"
  }
}
```

**Output Format (lines mode):**
```json
{
  "data": ["line1", "line2", "line3"],
  "lines": ["line1", "line2", "line3"],
  "items": ["line1", "line2", "line3"],
  "total_lines": 3,
  "file_path": "/path/to/data.csv",
  "read_mode": "lines",
  "source": "local_filesystem"
}
```

**Read Batch:**
```json
{
  "id": "file-read-3",
  "type": "local_filesystem",
  "name": "Read Batches",
  "input_config": {
    "mode": "read",
    "file_path": "/path/to/large-file.txt",
    "read_mode": "batch",
    "batch_size": 100
  }
}
```

**Read Tail:**
```json
{
  "id": "file-read-4",
  "type": "local_filesystem",
  "name": "Read Tail",
  "input_config": {
    "mode": "read",
    "file_path": "/var/log/app.log",
    "read_mode": "tail",
    "tail_lines": 50
  }
}
```

#### Write Mode

**Configuration:**
```json
{
  "mode": "write",
  "file_path": "/path/to/output.txt",
  "overwrite": true
}
```

**Input:** Data from previous node (automatically extracted)

**Output Format:**
```json
{
  "status": "success",
  "file_path": "/path/to/output.txt",
  "bytes_written": 1024
}
```

#### Path Formats

**Absolute Path:**
```json
{
  "file_path": "/absolute/path/to/file.txt"
}
```

**Relative Path:**
```json
{
  "file_path": "./relative/path/to/file.txt"
}
```

**User Home Path:**
```json
{
  "file_path": "~/Documents/file.txt"
}
```

**Variable Substitution:**
```json
{
  "file_path": "/data/${workflow_id}/output.txt"
}
```

#### Examples

**Read File:**
```json
{
  "id": "file-read-1",
  "type": "local_filesystem",
  "name": "Read Input File",
  "input_config": {
    "mode": "read",
    "file_path": "/data/input.json",
    "encoding": "utf-8"
  }
}
```

**Write File:**
```json
{
  "id": "file-write-1",
  "type": "local_filesystem",
  "name": "Write Output File",
  "input_config": {
    "mode": "write",
    "file_path": "/data/output.json",
    "overwrite": true
  }
}
```

**Read Lines for Loop:**
```json
{
  "id": "file-lines-1",
  "type": "local_filesystem",
  "name": "Read CSV Lines",
  "input_config": {
    "mode": "read",
    "file_path": "/data/items.csv",
    "read_mode": "lines"
  }
}
```

---

### GCP Pub/Sub

**Type:** `gcp_pubsub`

**Purpose:** Publish to or subscribe to GCP Pub/Sub topics.

#### Configuration (`input_config`)

```typescript
interface GCPPubSubConfig {
  mode?: 'read' | 'write'
  project_id: string             // GCP project ID (required)
  topic_name?: string             // Topic name (required for write)
  subscription_name?: string     // Subscription name (required for read)
  credentials?: string           // GCP service account JSON (optional)
}
```

#### Read Mode (Subscribe)

**Configuration:**
```json
{
  "mode": "read",
  "project_id": "my-project",
  "subscription_name": "my-subscription"
}
```

**Output Format:**
```json
{
  "data": [
    {"message": "data1"},
    {"message": "data2"}
  ],
  "source": "gcp_pubsub"
}
```

**Note:** Messages are automatically acknowledged after reading.

#### Write Mode (Publish)

**Configuration:**
```json
{
  "mode": "write",
  "project_id": "my-project",
  "topic_name": "my-topic"
}
```

**Input:** Data from previous node (automatically published)

**Output Format:**
```json
{
  "status": "success",
  "topic": "my-topic",
  "message_id": "1234567890"
}
```

#### Examples

**Subscribe to Messages:**
```json
{
  "id": "pubsub-read-1",
  "type": "gcp_pubsub",
  "name": "Subscribe to Topic",
  "input_config": {
    "mode": "read",
    "project_id": "my-project",
    "subscription_name": "my-subscription"
  }
}
```

**Publish Message:**
```json
{
  "id": "pubsub-write-1",
  "type": "gcp_pubsub",
  "name": "Publish to Topic",
  "input_config": {
    "mode": "write",
    "project_id": "my-project",
    "topic_name": "my-topic"
  }
}
```

---

## Control Flow Nodes

### Start Node

**Type:** `start`

**Purpose:** Workflow entry point. Receives execution inputs.

**Configuration:** None required

**Inputs:** Execution inputs (from `POST /api/workflows/{id}/execute`)

**Outputs:** Execution inputs (passed to next node)

**Example:**
```json
{
  "id": "start-1",
  "type": "start",
  "name": "Start"
}
```

### End Node

**Type:** `end`

**Purpose:** Workflow exit point. Marks workflow completion.

**Configuration:** None required

**Inputs:** Previous node output

**Outputs:** Final workflow result

**Example:**
```json
{
  "id": "end-1",
  "type": "end",
  "name": "End"
}
```

---

## Input Mapping

Nodes can receive inputs from previous nodes or workflow variables via `InputMapping`.

### InputMapping Structure

```typescript
interface InputMapping {
  name: string                    // Input field name
  source_node?: string           // Source node ID (optional)
  source_field?: string           // Field name in source output (default: "output")
}
```

### Mapping Examples

**From Previous Node:**
```json
{
  "inputs": [
    {
      "name": "data",
      "source_node": "agent-1",
      "source_field": "output"
    }
  ]
}
```

**From Workflow Variable:**
```json
{
  "inputs": [
    {
      "name": "user_name",
      "source_field": "user_name"
      // No source_node = from workflow variables
    }
  ]
}
```

**From Nested Field:**
```json
{
  "inputs": [
    {
      "name": "status",
      "source_node": "condition-1",
      "source_field": "data.status"
    }
  ]
}
```

**Multiple Inputs:**
```json
{
  "inputs": [
    {
      "name": "context",
      "source_node": "agent-1",
      "source_field": "output"
    },
    {
      "name": "user_input",
      "source_field": "user_query"
    }
  ]
}
```

### Auto-Population

If a node has no explicit `inputs` but has incoming edges, inputs are auto-populated from the previous node's output.

**Auto-Populated Keys:**
- `data` - Previous node output
- `output` - Previous node output (alias)
- `items` - Previous node output if it's an array

---

## Node Configuration Examples

### Complete Workflow Example

```json
{
  "nodes": [
    {
      "id": "start-1",
      "type": "start",
      "name": "Start"
    },
    {
      "id": "file-read-1",
      "type": "local_filesystem",
      "name": "Read Input File",
      "input_config": {
        "mode": "read",
        "file_path": "/data/input.csv",
        "read_mode": "lines"
      }
    },
    {
      "id": "loop-1",
      "type": "loop",
      "name": "Process Lines",
      "loop_config": {
        "loop_type": "for_each",
        "items_source": "items"
      },
      "inputs": [
        {
          "name": "items",
          "source_node": "file-read-1",
          "source_field": "items"
        }
      ]
    },
    {
      "id": "agent-1",
      "type": "agent",
      "name": "Process Item",
      "agent_config": {
        "model": "gpt-4o-mini",
        "system_prompt": "Process each line of data.",
        "temperature": 0.3
      }
    },
    {
      "id": "condition-1",
      "type": "condition",
      "name": "Check Status",
      "condition_config": {
        "condition_type": "contains",
        "field": "output",
        "value": "error"
      }
    },
    {
      "id": "file-write-1",
      "type": "local_filesystem",
      "name": "Write Results",
      "input_config": {
        "mode": "write",
        "file_path": "/data/output.json"
      }
    },
    {
      "id": "end-1",
      "type": "end",
      "name": "End"
    }
  ],
  "edges": [
    {"source": "start-1", "target": "file-read-1"},
    {"source": "file-read-1", "target": "loop-1"},
    {"source": "loop-1", "target": "agent-1"},
    {"source": "agent-1", "target": "condition-1"},
    {"source": "condition-1", "target": "file-write-1", "sourceHandle": "false"},
    {"source": "file-write-1", "target": "end-1"}
  ]
}
```

### Agent → Condition → Branch Example

```json
{
  "nodes": [
    {
      "id": "agent-1",
      "type": "agent",
      "name": "Analyze Sentiment",
      "agent_config": {
        "model": "gpt-4o-mini",
        "system_prompt": "Analyze sentiment and return 'positive' or 'negative'."
      }
    },
    {
      "id": "condition-1",
      "type": "condition",
      "name": "Check Sentiment",
      "condition_config": {
        "condition_type": "contains",
        "field": "output",
        "value": "positive"
      }
    },
    {
      "id": "agent-positive",
      "type": "agent",
      "name": "Positive Response",
      "agent_config": {
        "model": "gpt-4o-mini",
        "system_prompt": "Generate a positive response."
      }
    },
    {
      "id": "agent-negative",
      "type": "agent",
      "name": "Negative Response",
      "agent_config": {
        "model": "gpt-4o-mini",
        "system_prompt": "Generate a helpful response for negative feedback."
      }
    }
  ],
  "edges": [
    {"source": "agent-1", "target": "condition-1"},
    {"source": "condition-1", "target": "agent-positive", "sourceHandle": "true"},
    {"source": "condition-1", "target": "agent-negative", "sourceHandle": "false"}
  ]
}
```

---

## Best Practices

### Node Configuration

1. **Always Name Nodes**: Use descriptive names for clarity
2. **Set Required Config**: Ensure all required configuration fields are set
3. **Use Consistent Field Names**: Use same field names across nodes
4. **Validate Inputs**: Check that inputs match expected format

### Agent Nodes

1. **Clear System Prompts**: Be specific about agent's role
2. **Appropriate Temperature**: Lower for factual, higher for creative
3. **Set Max Tokens**: Prevent excessive token usage
4. **Enable Tools Sparingly**: Only enable necessary tools

### Condition Nodes

1. **Always Set Field**: Required field must be specified
2. **Provide Default Branch**: Always have a default/fallback path
3. **Test Conditions**: Verify condition logic works as expected
4. **Use Nested Fields**: Use dot notation for nested objects

### Loop Nodes

1. **Set Max Iterations**: Prevent infinite loops
2. **Explicit Items Source**: Set `items_source` for clarity
3. **Verify Input Format**: Ensure previous node outputs array/list
4. **Consider Performance**: Batch process large arrays

### Storage Nodes

1. **Verify Credentials**: Ensure credentials are valid
2. **Check Permissions**: Verify read/write permissions
3. **Use Absolute Paths**: Prefer absolute paths for reliability
4. **Handle Errors**: Implement error handling for file operations

---

## Related Documentation

- [Execution System Architecture](./EXECUTION_SYSTEM_ARCHITECTURE.md) - How nodes execute
- [Configuration Reference](./CONFIGURATION_REFERENCE.md) - Environment configuration
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions
- [API Workflow Execution](./API_WORKFLOW_EXECUTION.md) - API documentation

---

## Summary

**Node Types:**
- **Agent**: LLM-powered processing
- **Condition**: Branching logic
- **Loop**: Iteration over arrays
- **Storage**: Read/write from storage systems
- **Start/End**: Workflow control flow

**Key Configuration:**
- **Agent**: `agent_config` (model, prompt, temperature)
- **Condition**: `condition_config` (field, condition_type, value)
- **Loop**: `loop_config` (loop_type, items_source, max_iterations)
- **Storage**: `input_config` (mode, provider-specific fields)

**Input Sources:**
- Previous node outputs (via `InputMapping`)
- Workflow variables
- Execution inputs
- Auto-population from previous node
