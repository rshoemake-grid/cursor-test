"""
Input source handlers for reading from various data sources.
Supports GCP Buckets, AWS S3, GCP Pub/Sub, and Local File System.
"""
import json
import os
import io
import mimetypes
import time
import base64
from typing import Dict, Any, Optional, List
from pathlib import Path
import glob

# Optional imports for cloud services
try:
    from google.cloud import storage
    from google.cloud import pubsub_v1
    from google.oauth2 import service_account
    GCP_AVAILABLE = True
except ImportError:
    GCP_AVAILABLE = False

try:
    import boto3
    AWS_AVAILABLE = True
except ImportError:
    AWS_AVAILABLE = False


class InputSourceHandler:
    """Base class for input source handlers"""
    
    @staticmethod
    def read(config: Dict[str, Any]) -> Any:
        """Read data from the input source"""
        raise NotImplementedError
    
    @staticmethod
    def write(config: Dict[str, Any], data: Any) -> Any:
        """Write data to the input source"""
        raise NotImplementedError


class GCPBucketHandler(InputSourceHandler):
    """Handler for reading from Google Cloud Storage buckets"""
    
    @staticmethod
    def read(config: Dict[str, Any]) -> Any:
        if not GCP_AVAILABLE:
            raise ImportError("google-cloud-storage not installed. Install with: pip install google-cloud-storage")
        
        bucket_name = config.get('bucket_name')
        object_path = config.get('object_path', '')
        credentials_json = config.get('credentials')
        
        if not bucket_name:
            raise ValueError("bucket_name is required for GCP Bucket input")
        
        # Initialize GCS client
        if credentials_json:
            try:
                credentials_info = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_info)
                client = storage.Client(credentials=credentials)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON credentials for GCP")
        else:
            # Use default credentials (from environment or metadata service)
            client = storage.Client()
        
        bucket = client.bucket(bucket_name)
        
        if object_path:
            # Read specific object
            blob = bucket.blob(object_path)
            if not blob.exists():
                raise FileNotFoundError(f"Object {object_path} not found in bucket {bucket_name}")
            
            content = blob.download_as_text()
            
            # Try to parse as JSON, otherwise return as text
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return content
        else:
            # List all objects in bucket
            blobs = bucket.list_blobs()
            return [blob.name for blob in blobs]
    
    @staticmethod
    def write(config: Dict[str, Any], data: Any) -> Any:
        """Write data to GCP Bucket"""
        if not GCP_AVAILABLE:
            raise ImportError("google-cloud-storage not installed. Install with: pip install google-cloud-storage")
        
        bucket_name = config.get('bucket_name')
        object_path = config.get('object_path', '')
        credentials_json = config.get('credentials')
        
        if not bucket_name:
            raise ValueError("bucket_name is required for GCP Bucket write")
        if not object_path:
            raise ValueError("object_path is required for GCP Bucket write")
        
        # Initialize GCS client
        if credentials_json:
            try:
                credentials_info = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_info)
                client = storage.Client(credentials=credentials)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON credentials for GCP")
        else:
            client = storage.Client()
        
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(object_path)
        
        # Convert data to string (JSON if dict/list, otherwise string)
        if isinstance(data, (dict, list)):
            content = json.dumps(data, indent=2)
            blob.upload_from_string(content, content_type='application/json')
        else:
            blob.upload_from_string(str(data), content_type='text/plain')
        
        return {"status": "success", "bucket": bucket_name, "object": object_path}


class AWSS3Handler(InputSourceHandler):
    """Handler for reading from AWS S3 buckets"""
    
    @staticmethod
    def read(config: Dict[str, Any]) -> Any:
        if not AWS_AVAILABLE:
            raise ImportError("boto3 not installed. Install with: pip install boto3")
        
        bucket_name = config.get('bucket_name')
        object_key = config.get('object_key', '')
        access_key_id = config.get('access_key_id')
        secret_access_key = config.get('secret_access_key')
        region = config.get('region', 'us-east-1')
        
        if not bucket_name:
            raise ValueError("bucket_name is required for AWS S3 input")
        
        # Initialize S3 client
        if access_key_id and secret_access_key:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
                region_name=region
            )
        else:
            # Use default credentials (from environment or IAM role)
            s3_client = boto3.client('s3', region_name=region)
        
        if object_key:
            # Read specific object
            try:
                response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
                content = response['Body'].read().decode('utf-8')
                
                # Try to parse as JSON, otherwise return as text
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    return content
            except s3_client.exceptions.NoSuchKey:
                raise FileNotFoundError(f"Object {object_key} not found in bucket {bucket_name}")
        else:
            # List all objects in bucket
            response = s3_client.list_objects_v2(Bucket=bucket_name)
            if 'Contents' in response:
                return [obj['Key'] for obj in response['Contents']]
            return []
    
    @staticmethod
    def write(config: Dict[str, Any], data: Any) -> Any:
        """Write data to AWS S3"""
        if not AWS_AVAILABLE:
            raise ImportError("boto3 not installed. Install with: pip install boto3")
        
        bucket_name = config.get('bucket_name')
        object_key = config.get('object_key', '')
        access_key_id = config.get('access_key_id')
        secret_access_key = config.get('secret_access_key')
        region = config.get('region', 'us-east-1')
        
        if not bucket_name:
            raise ValueError("bucket_name is required for AWS S3 write")
        if not object_key:
            raise ValueError("object_key is required for AWS S3 write")
        
        # Initialize S3 client
        if access_key_id and secret_access_key:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
                region_name=region
            )
        else:
            s3_client = boto3.client('s3', region_name=region)
        
        # Convert data to bytes (JSON if dict/list, otherwise string)
        if isinstance(data, (dict, list)):
            content = json.dumps(data, indent=2).encode('utf-8')
            content_type = 'application/json'
        else:
            content = str(data).encode('utf-8')
            content_type = 'text/plain'
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=object_key,
            Body=content,
            ContentType=content_type
        )
        
        return {"status": "success", "bucket": bucket_name, "key": object_key}


class GCPPubSubHandler(InputSourceHandler):
    """Handler for reading from GCP Pub/Sub"""
    
    @staticmethod
    def read(config: Dict[str, Any]) -> Any:
        if not GCP_AVAILABLE:
            raise ImportError("google-cloud-pubsub not installed. Install with: pip install google-cloud-pubsub")
        
        project_id = config.get('project_id')
        topic_name = config.get('topic_name')
        subscription_name = config.get('subscription_name')
        credentials_json = config.get('credentials')
        
        if not project_id or not subscription_name:
            raise ValueError("project_id and subscription_name are required for GCP Pub/Sub input")
        
        # Initialize Pub/Sub client
        if credentials_json:
            try:
                credentials_info = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_info)
                subscriber = pubsub_v1.SubscriberClient(credentials=credentials)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON credentials for GCP")
        else:
            subscriber = pubsub_v1.SubscriberClient()
        
        subscription_path = subscriber.subscription_path(project_id, subscription_name)
        
        # Pull messages (non-blocking, gets available messages)
        # For workflow execution, we'll pull a batch of messages
        messages = []
        try:
            response = subscriber.pull(
                request={"subscription": subscription_path, "max_messages": 10}
            )
            
            for received_message in response.received_messages:
                message_data = received_message.message.data.decode('utf-8')
                try:
                    messages.append(json.loads(message_data))
                except json.JSONDecodeError:
                    messages.append(message_data)
                
                # Acknowledge the message
                subscriber.acknowledge(
                    request={"subscription": subscription_path, "ack_ids": [received_message.ack_id]}
                )
        except Exception as e:
            # If no messages available, return empty list
            if "not found" in str(e).lower():
                return []
            raise
        
        return messages if len(messages) > 1 else (messages[0] if messages else None)
    
    @staticmethod
    def write(config: Dict[str, Any], data: Any) -> Any:
        """Publish data to GCP Pub/Sub topic"""
        if not GCP_AVAILABLE:
            raise ImportError("google-cloud-pubsub not installed. Install with: pip install google-cloud-pubsub")
        
        project_id = config.get('project_id')
        topic_name = config.get('topic_name')
        credentials_json = config.get('credentials')
        
        if not project_id or not topic_name:
            raise ValueError("project_id and topic_name are required for GCP Pub/Sub publish")
        
        # Initialize Pub/Sub client
        if credentials_json:
            try:
                credentials_info = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_info)
                publisher = pubsub_v1.PublisherClient(credentials=credentials)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON credentials for GCP")
        else:
            publisher = pubsub_v1.PublisherClient()
        
        topic_path = publisher.topic_path(project_id, topic_name)
        
        # Convert data to bytes (JSON if dict/list, otherwise string)
        if isinstance(data, (dict, list)):
            message_data = json.dumps(data).encode('utf-8')
        else:
            message_data = str(data).encode('utf-8')
        
        # Publish message
        future = publisher.publish(topic_path, message_data)
        message_id = future.result()
        
        return {"status": "success", "topic": topic_name, "message_id": message_id}


class LocalFileSystemHandler(InputSourceHandler):
    """Handler for reading from local file system"""
    
    @staticmethod
    def read(config: Dict[str, Any]) -> Any:
        file_path = config.get('file_path')
        file_pattern = config.get('file_pattern', '')
        encoding = config.get('encoding', 'utf-8')
        
        if not file_path or file_path.strip() == '':
            raise ValueError("file_path is required for Local File System input. Please configure the file_path in the node's input_config or pass it as an execution input (e.g., {'file_path': '/path/to/file'}) before executing the workflow.")
        
        # Expand user path (~) and resolve absolute path
        file_path = os.path.expanduser(file_path)
        path = Path(file_path).resolve()
        
        # Check if file exists
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}. Please check that the file exists and the path is correct.")
        
        if path.is_file():
            # Check for read mode
            read_mode = config.get('read_mode', 'full')  # 'full', 'lines', 'batch', or 'tail'
            
            if read_mode == 'tail':
                # Tail mode: read from end of file (useful for files being written to)
                num_lines = config.get('tail_lines', 10)  # Number of lines to read from end
                follow = config.get('tail_follow', False)  # Follow file like tail -f
                wait_timeout = config.get('tail_wait_timeout', 5.0)  # Seconds to wait for new content
                parse_json = config.get('parse_json_lines', True)  # Auto-parse JSON lines
                
                lines = []
                
                # Read last N lines from file
                # Use a buffer approach to efficiently read from end
                with open(path, 'r', encoding=encoding) as f:
                    # Seek to end
                    f.seek(0, io.SEEK_END)
                    file_size = f.tell()
                    
                    if file_size == 0:
                        # Empty file
                        return {
                            'lines': [],
                            'total_lines': 0,
                            'file_path': str(path),
                            'read_mode': 'tail',
                            'tail_lines': num_lines,
                            'follow': follow
                        }
                    
                    # Read backwards in chunks to find last N lines
                    chunk_size = min(8192, file_size)
                    position = file_size
                    buffer = ''
                    lines_found = []
                    
                    while position > 0 and len(lines_found) < num_lines:
                        # Read chunk
                        read_size = min(chunk_size, position)
                        position -= read_size
                        f.seek(position)
                        chunk = f.read(read_size) + buffer
                        
                        # Split into lines
                        chunk_lines = chunk.split('\n')
                        buffer = chunk_lines[0]  # First part might be incomplete
                        
                        # Add complete lines (in reverse order)
                        for line in reversed(chunk_lines[1:]):
                            if line.strip():  # Skip empty lines
                                lines_found.insert(0, line)
                                if len(lines_found) >= num_lines:
                                    break
                    
                    # Add remaining buffer if we have space
                    if buffer.strip() and len(lines_found) < num_lines:
                        lines_found.insert(0, buffer)
                    
                    # Process lines (parse JSON if configured)
                    for idx, line in enumerate(lines_found[-num_lines:]):  # Take last N lines
                        line = line.rstrip('\n\r')
                        if parse_json:
                            try:
                                parsed = json.loads(line)
                                lines.append({
                                    'line_number': len(lines_found) - num_lines + idx + 1,
                                    'content': parsed,
                                    'raw': line
                                })
                            except json.JSONDecodeError:
                                lines.append({
                                    'line_number': len(lines_found) - num_lines + idx + 1,
                                    'content': line,
                                    'raw': line
                                })
                        else:
                            lines.append({
                                'line_number': len(lines_found) - num_lines + idx + 1,
                                'content': line,
                                'raw': line
                            })
                
                # If follow mode, wait for new content
                if follow:
                    initial_size = file_size
                    start_time = time.time()
                    
                    while time.time() - start_time < wait_timeout:
                        time.sleep(0.5)  # Check every 500ms
                        current_size = path.stat().st_size
                        
                        if current_size > initial_size:
                            # New content available, read it
                            with open(path, 'r', encoding=encoding) as f:
                                f.seek(initial_size)
                                new_content = f.read()
                                
                                # Parse new lines
                                for new_line in new_content.split('\n'):
                                    new_line = new_line.rstrip('\n\r')
                                    if new_line:
                                        if parse_json:
                                            try:
                                                parsed = json.loads(new_line)
                                                lines.append({
                                                    'line_number': len(lines) + 1,
                                                    'content': parsed,
                                                    'raw': new_line,
                                                    'is_new': True
                                                })
                                            except json.JSONDecodeError:
                                                lines.append({
                                                    'line_number': len(lines) + 1,
                                                    'content': new_line,
                                                    'raw': new_line,
                                                    'is_new': True
                                                })
                                        else:
                                            lines.append({
                                                'line_number': len(lines) + 1,
                                                'content': new_line,
                                                'raw': new_line,
                                                'is_new': True
                                            })
                            
                            # Update initial size for next iteration
                            initial_size = current_size
                            start_time = time.time()  # Reset timeout when new content arrives
                
                return {
                    'lines': lines,
                    'total_lines': len(lines),
                    'file_path': str(path),
                    'read_mode': 'tail',
                    'tail_lines': num_lines,
                    'follow': follow,
                    'file_size': file_size
                }
            
            elif read_mode == 'lines':
                # Read file line by line (memory efficient for large files)
                skip_empty = config.get('skip_empty_lines', True)
                parse_json = config.get('parse_json_lines', True)  # Auto-parse JSON lines
                max_lines = config.get('max_lines')  # Optional limit
                
                lines = []
                line_count = 0
                with open(path, 'r', encoding=encoding) as f:
                    for line in f:
                        line = line.rstrip('\n\r')  # Remove trailing newline
                        
                        # Skip empty lines if configured
                        if skip_empty and not line:
                            continue
                        
                        # Apply max_lines limit if set
                        if max_lines and line_count >= max_lines:
                            break
                        
                        # Try to parse each line as JSON (e.g., JSONL format)
                        if parse_json:
                            try:
                                parsed = json.loads(line)
                                lines.append({
                                    'line_number': line_count + 1,
                                    'content': parsed,
                                    'raw': line
                                })
                            except json.JSONDecodeError:
                                # If not JSON, keep as string
                                lines.append({
                                    'line_number': line_count + 1,
                                    'content': line,
                                    'raw': line
                                })
                        else:
                            lines.append({
                                'line_number': line_count + 1,
                                'content': line,
                                'raw': line
                            })
                        
                        line_count += 1
                
                # Return with metadata
                return {
                    'lines': lines,
                    'total_lines': line_count,
                    'file_path': str(path),
                    'read_mode': 'lines'
                }
            
            elif read_mode == 'batch':
                # Read file in batches (for very large files)
                batch_size = config.get('batch_size', 1000)
                skip_empty = config.get('skip_empty_lines', True)
                parse_json = config.get('parse_json_lines', True)
                start_line = config.get('start_line', 0)  # Resume from line number
                
                batches = []
                current_batch = []
                line_count = 0
                batch_number = 0
                
                with open(path, 'r', encoding=encoding) as f:
                    # Skip to start_line if resuming
                    for _ in range(start_line):
                        try:
                            next(f)
                        except StopIteration:
                            break
                    
                    for line in f:
                        line = line.rstrip('\n\r')
                        
                        # Skip empty lines if configured
                        if skip_empty and not line:
                            continue
                        
                        # Parse JSON if configured
                        if parse_json:
                            try:
                                parsed = json.loads(line)
                                current_batch.append({
                                    'line_number': start_line + line_count + 1,
                                    'content': parsed,
                                    'raw': line
                                })
                            except json.JSONDecodeError:
                                current_batch.append({
                                    'line_number': start_line + line_count + 1,
                                    'content': line,
                                    'raw': line
                                })
                        else:
                            current_batch.append({
                                'line_number': start_line + line_count + 1,
                                'content': line,
                                'raw': line
                            })
                        
                        line_count += 1
                        
                        # Yield batch when full
                        if len(current_batch) >= batch_size:
                            batches.append({
                                'batch_number': batch_number,
                                'start_line': start_line + (batch_number * batch_size),
                                'end_line': start_line + line_count,
                                'lines': current_batch
                            })
                            batch_number += 1
                            current_batch = []
                
                # Add final batch if any remaining lines
                if current_batch:
                    batches.append({
                        'batch_number': batch_number,
                        'start_line': start_line + (batch_number * batch_size),
                        'end_line': start_line + line_count,
                        'lines': current_batch
                    })
                
                return {
                    'batches': batches,
                    'total_batches': len(batches),
                    'total_lines': line_count,
                    'batch_size': batch_size,
                    'file_path': str(path),
                    'read_mode': 'batch'
                }
            else:
                # Read entire file (default behavior)
                with open(path, 'r', encoding=encoding) as f:
                    content = f.read()
                
                # Try to parse as JSON, otherwise return as text
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    return content
        
        elif path.is_dir():
            # Read directory with optional pattern
            if file_pattern:
                # Handle pattern matching
                pattern = str(path / file_pattern)
                files = glob.glob(pattern, recursive=True)
                if not files:
                    # Try without the directory prefix if pattern already includes it
                    files = glob.glob(file_pattern, recursive=True)
            else:
                files = [str(p) for p in path.iterdir() if p.is_file()]
            
            if not files:
                raise FileNotFoundError(f"No files found in directory {file_path}" + (f" matching pattern '{file_pattern}'" if file_pattern else ""))
            
            # Read all matching files
            results = []
            for file in files:
                try:
                    with open(file, 'r', encoding=encoding) as f:
                        content = f.read()
                        try:
                            results.append(json.loads(content))
                        except json.JSONDecodeError:
                            results.append(content)
                except Exception as e:
                    raise IOError(f"Error reading file {file}: {str(e)}")
            
            return results
        
        else:
            # Provide helpful error message
            if not path.exists():
                raise FileNotFoundError(
                    f"Path {file_path} does not exist. "
                    f"Resolved to: {path}. "
                    f"Please check that the path exists on the server where the workflow is executing."
                )
            else:
                raise ValueError(f"Path {file_path} exists but is neither a file nor a directory")
    
    @staticmethod
    def write(config: Dict[str, Any], data: Any) -> Any:
        """Write data to local file system"""
        file_path = config.get('file_path')
        file_pattern = config.get('file_pattern', '')
        encoding = config.get('encoding', 'utf-8')
        overwrite = config.get('overwrite', True)  # Default to True for backward compatibility
        # Handle string "true"/"false" from JSON
        if isinstance(overwrite, str):
            overwrite = overwrite.lower() in ('true', '1', 'yes')
        print(f"LocalFileSystemHandler.write: overwrite={overwrite} (type: {type(overwrite)}), config keys: {list(config.keys())}, full config: {config}")
        
        if not file_path or file_path.strip() == '':
            raise ValueError("file_path is required for Local File System write. Please configure the file_path in the node's input_config or pass it as an execution input (e.g., {'file_path': '/path/to/file'}) before executing the workflow.")
        
        # Expand user path (~) and resolve absolute path
        file_path = os.path.expanduser(file_path)
        path = Path(file_path).resolve()
        
        # If path is a directory and file_pattern is provided, combine them
        if path.is_dir() and file_pattern:
            path = path / file_pattern
        elif path.is_dir():
            # If it's a directory without a pattern, use a default filename
            raise ValueError(f"file_path '{file_path}' is a directory. Please provide a file_pattern or use a full file path.")
        
        # If overwrite is False and file exists, increment the filename
        if not overwrite and path.exists():
            # Split path into stem and suffix (e.g., "image.jpg" -> stem="image", suffix=".jpg")
            stem = path.stem
            suffix = path.suffix
            parent = path.parent
            
            # Try to find the next available number
            counter = 1
            while True:
                # Create new filename with counter (e.g., "image_1.jpg")
                new_name = f"{stem}_{counter}{suffix}"
                new_path = parent / new_name
                if not new_path.exists():
                    path = new_path
                    print(f"File exists, using incremented filename: {path}")
                    break
                counter += 1
                # Safety check to prevent infinite loop
                if counter > 10000:
                    raise ValueError(f"Could not find available filename after 10000 attempts. Please clean up files or enable overwrite.")
        
        # Create parent directory if it doesn't exist
        path.parent.mkdir(parents=True, exist_ok=True)
        
        # Detect if data is an image (base64, URL, or binary)
        is_image = False
        image_data = None
        detected_mimetype = None
        
        # Check if data is a base64-encoded image
        if isinstance(data, str):
            # Check for data URL format: data:image/png;base64,...
            if data.startswith('data:image/'):
                # Extract base64 data and mimetype
                try:
                    header, base64_data = data.split(',', 1)
                    mimetype_part = header.split(';')[0]  # data:image/png
                    detected_mimetype = mimetype_part.split(':')[1]  # image/png
                    image_data = base64.b64decode(base64_data)
                    is_image = True
                except Exception as e:
                    print(f"Warning: Failed to decode base64 image data: {e}")
            
            # Check if it's a long base64 string (might be image without data URL prefix)
            elif len(data) > 1000 and all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r' for c in data[:1000]):
                # Might be base64 image - try to decode
                try:
                    decoded = base64.b64decode(data)
                    # Check if decoded data looks like an image (PNG/JPEG magic bytes)
                    if decoded[:4] == b'\x89PNG' or decoded[:2] == b'\xff\xd8':
                        image_data = decoded
                        is_image = True
                        detected_mimetype = 'image/png' if decoded[:4] == b'\x89PNG' else 'image/jpeg'
                except Exception:
                    pass
        
        # Check if data is binary (bytes)
        elif isinstance(data, bytes):
            # Check if it's an image by magic bytes
            if data[:4] == b'\x89PNG':
                is_image = True
                image_data = data
                detected_mimetype = 'image/png'
            elif data[:2] == b'\xff\xd8':
                is_image = True
                image_data = data
                detected_mimetype = 'image/jpeg'
            elif data[:4] == b'GIF8':
                is_image = True
                image_data = data
                detected_mimetype = 'image/gif'
            elif data[:8] == b'\x89\x50\x4E\x47\x0D\x0A\x1A\x0A':  # PNG alternative
                is_image = True
                image_data = data
                detected_mimetype = 'image/png'
        
        # Check if data is a dict with image information
        elif isinstance(data, dict):
            # Check for common image keys
            if 'image' in data:
                image_value = data['image']
                if isinstance(image_value, str) and image_value.startswith('data:image/'):
                    try:
                        header, base64_data = image_value.split(',', 1)
                        mimetype_part = header.split(';')[0]
                        detected_mimetype = mimetype_part.split(':')[1]
                        image_data = base64.b64decode(base64_data)
                        is_image = True
                    except Exception:
                        pass
                elif isinstance(image_value, bytes):
                    image_data = image_value
                    is_image = True
            elif 'image_data' in data:
                image_value = data['image_data']
                if isinstance(image_value, str):
                    try:
                        image_data = base64.b64decode(image_value)
                        is_image = True
                    except Exception:
                        pass
                elif isinstance(image_value, bytes):
                    image_data = image_value
                    is_image = True
        
        # If it's an image, write binary data
        if is_image and image_data:
            # Detect mimetype from file extension if not already detected
            if not detected_mimetype:
                detected_mimetype, _ = mimetypes.guess_type(str(path))
                if not detected_mimetype:
                    ext = path.suffix.lower()
                    if ext in ['.png']:
                        detected_mimetype = 'image/png'
                    elif ext in ['.jpg', '.jpeg']:
                        detected_mimetype = 'image/jpeg'
                    elif ext == '.gif':
                        detected_mimetype = 'image/gif'
                    elif ext == '.webp':
                        detected_mimetype = 'image/webp'
                    else:
                        detected_mimetype = 'image/jpeg'  # Default to JPEG
            
            # Log what we're writing
            print(f"Writing image to {path}: {len(image_data)} bytes, mimetype: {detected_mimetype}")
            
            # Write binary data
            with open(path, 'wb') as f:
                f.write(image_data)
            
            return {"status": "success", "file_path": str(path), "mimetype": detected_mimetype, "type": "image"}
        
        # Otherwise, convert to string (JSON if dict/list, otherwise string)
        if data is None:
            content = ""
        elif isinstance(data, (dict, list)):
            content = json.dumps(data, indent=2)
        else:
            content = str(data)
        
        # Detect mimetype from file extension
        mimetype, _ = mimetypes.guess_type(str(path))
        if not mimetype:
            # Fallback for common extensions not in mimetypes
            ext = path.suffix.lower()
            if ext == '.jsonl':
                mimetype = 'application/x-ndjson'  # Newline-delimited JSON
            elif ext == '.json':
                mimetype = 'application/json'
            elif ext == '.txt':
                mimetype = 'text/plain'
            elif ext == '.csv':
                mimetype = 'text/csv'
            else:
                mimetype = 'application/octet-stream'
        
        # Log what we're writing for debugging
        print(f"Writing to {path}: {len(content)} characters, data type: {type(data)}, mimetype: {mimetype}")
        
        # Write to file
        with open(path, 'w', encoding=encoding) as f:
            f.write(content)
        
        return {"status": "success", "file_path": str(path), "mimetype": mimetype}


# Registry of input source handlers
INPUT_HANDLERS = {
    'gcp_bucket': GCPBucketHandler,
    'aws_s3': AWSS3Handler,
    'gcp_pubsub': GCPPubSubHandler,
    'local_filesystem': LocalFileSystemHandler,
}


def read_from_input_source(node_type: str, config: Dict[str, Any]) -> Any:
    """
    Read data from an input source node.
    
    Args:
        node_type: Type of input source (gcp_bucket, aws_s3, gcp_pubsub, local_filesystem)
        config: Configuration dictionary for the input source
    
    Returns:
        Data read from the input source (dict, list, or string)
    """
    if node_type not in INPUT_HANDLERS:
        raise ValueError(f"Unknown input source type: {node_type}")
    
    handler = INPUT_HANDLERS[node_type]
    return handler.read(config)


def write_to_input_source(node_type: str, config: Dict[str, Any], data: Any) -> Any:
    """
    Write data to an input source node.
    
    Args:
        node_type: Type of input source (gcp_bucket, aws_s3, gcp_pubsub, local_filesystem)
        config: Configuration dictionary for the input source
        data: Data to write (dict, list, or string)
    
    Returns:
        Result of write operation (dict with status and details)
    """
    if node_type not in INPUT_HANDLERS:
        raise ValueError(f"Unknown input source type: {node_type}")
    
    handler = INPUT_HANDLERS[node_type]
    return handler.write(config, data)

