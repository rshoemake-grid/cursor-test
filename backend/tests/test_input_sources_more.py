"""More comprehensive tests for input source handlers"""
import pytest
from unittest.mock import Mock, patch
import tempfile
import os
import json
from pathlib import Path

from backend.inputs.input_sources import (
    LocalFileSystemHandler,
    GCPBucketHandler,
    AWSS3Handler,
    GCPPubSubHandler,
    read_from_input_source,
    write_to_input_source
)


@pytest.fixture
def temp_dir():
    """Create a temporary directory for file system tests"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


class TestInputSourceHelpers:
    """Tests for input source helper functions"""
    
    def test_read_from_input_source_local(self, temp_dir):
        """Test read_from_input_source with local filesystem"""
        test_file = os.path.join(temp_dir, "test.txt")
        with open(test_file, "w") as f:
            f.write("test content")
        
        config = {
            "file_path": test_file
        }
        
        result = read_from_input_source("local_filesystem", config)
        assert result == "test content"
    
    def test_read_from_input_source_invalid_type(self):
        """Test read_from_input_source with invalid type"""
        with pytest.raises(ValueError, match="Unknown input source type"):
            read_from_input_source("invalid_type", {})
    
    def test_write_to_input_source_local(self, temp_dir):
        """Test write_to_input_source with local filesystem"""
        test_file = os.path.join(temp_dir, "output.txt")
        
        config = {
            "file_path": test_file
        }
        
        result = write_to_input_source("local_filesystem", config, "test data")
        assert result["status"] == "success"
        assert os.path.exists(test_file)
    
    def test_write_to_input_source_invalid_type(self):
        """Test write_to_input_source with invalid type"""
        with pytest.raises(ValueError, match="Unknown input source type"):
            write_to_input_source("invalid_type", {}, "data")


class TestLocalFileSystemHandlerMore:
    """More tests for LocalFileSystemHandler"""
    
    def test_read_file_with_encoding(self, temp_dir):
        """Test reading file with specific encoding"""
        test_file = os.path.join(temp_dir, "test.txt")
        with open(test_file, "w", encoding="utf-8") as f:
            f.write("test content with émojis 🎉")
        
        config = {
            "file_path": test_file,
            "encoding": "utf-8"
        }
        
        result = LocalFileSystemHandler.read(config)
        assert "émojis" in result
        assert "🎉" in result
    
    def test_read_file_not_found(self, temp_dir):
        """Test reading non-existent file"""
        config = {
            "file_path": os.path.join(temp_dir, "nonexistent.txt")
        }
        
        with pytest.raises(FileNotFoundError):
            LocalFileSystemHandler.read(config)
    
    def test_write_file_with_encoding(self, temp_dir):
        """Test writing file with specific encoding"""
        test_file = os.path.join(temp_dir, "output.txt")
        
        config = {
            "file_path": test_file,
            "encoding": "utf-8"
        }
        
        LocalFileSystemHandler.write(config, "test content with émojis 🎉")
        
        with open(test_file, "r", encoding="utf-8") as f:
            assert "émojis" in f.read()
    
    def test_write_json_data(self, temp_dir):
        """Test writing JSON data"""
        test_file = os.path.join(temp_dir, "data.json")
        
        config = {
            "file_path": test_file
        }
        
        data = {"key": "value", "number": 42}
        LocalFileSystemHandler.write(config, data)
        
        with open(test_file, "r") as f:
            result = json.load(f)
            assert result == data
    
    def test_write_list_data(self, temp_dir):
        """Test writing list data"""
        test_file = os.path.join(temp_dir, "data.json")
        
        config = {
            "file_path": test_file
        }
        
        data = [1, 2, 3, {"nested": "value"}]
        LocalFileSystemHandler.write(config, data)
        
        with open(test_file, "r") as f:
            result = json.load(f)
            assert result == data
    
    def test_read_file_with_json_parse(self, temp_dir):
        """Test reading file and parsing as JSON"""
        test_file = os.path.join(temp_dir, "data.json")
        with open(test_file, "w") as f:
            json.dump({"key": "value"}, f)
        
        config = {
            "file_path": test_file
        }
        
        result = LocalFileSystemHandler.read(config)
        assert isinstance(result, dict)
        assert result["key"] == "value"


class TestGCPBucketHandlerMore:
    """More tests for GCPBucketHandler"""
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    @patch("backend.inputs.input_sources.storage")
    @patch("google.oauth2.service_account")
    def test_read_object_with_credentials(self, mock_service_account, mock_storage):
        """Test reading object with credentials"""
        # Import service_account into the module namespace for patching
        import backend.inputs.input_sources as input_sources_module
        input_sources_module.service_account = mock_service_account
        
        mock_credentials = Mock()
        mock_service_account.Credentials.from_service_account_info = Mock(return_value=mock_credentials)
        
        mock_client = Mock()
        mock_bucket = Mock()
        mock_blob = Mock()
        mock_blob.download_as_text.return_value = '{"key": "value"}'
        
        mock_storage.Client.return_value = mock_client
        mock_client.bucket.return_value = mock_bucket
        mock_bucket.blob.return_value = mock_blob
        
        config = {
            "bucket_name": "test-bucket",
            "object_path": "test/object.json",
            "credentials": json.dumps({"type": "service_account"})
        }
        
        result = GCPBucketHandler.read(config)
        assert result == {"key": "value"}
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    @patch("backend.inputs.input_sources.storage")
    @patch("google.oauth2.service_account")
    def test_write_object_with_credentials(self, mock_service_account, mock_storage):
        """Test writing object with credentials"""
        # Import service_account into the module namespace for patching
        import backend.inputs.input_sources as input_sources_module
        input_sources_module.service_account = mock_service_account
        
        mock_credentials = Mock()
        mock_service_account.Credentials.from_service_account_info = Mock(return_value=mock_credentials)
        
        mock_client = Mock()
        mock_bucket = Mock()
        mock_blob = Mock()
        
        mock_storage.Client.return_value = mock_client
        mock_client.bucket.return_value = mock_bucket
        mock_bucket.blob.return_value = mock_blob
        
        config = {
            "bucket_name": "test-bucket",
            "object_path": "test/object.json",
            "credentials": json.dumps({"type": "service_account"})
        }
        
        result = GCPBucketHandler.write(config, {"key": "value"})
        assert result["status"] == "success"
        mock_blob.upload_from_string.assert_called_once()


class TestAWSS3HandlerMore:
    """More tests for AWSS3Handler"""
    
    @patch("backend.inputs.input_sources.AWS_AVAILABLE", True)
    def test_read_object_with_region(self):
        """Test reading object with specific region"""
        try:
            import boto3
        except ImportError:
            pytest.skip("boto3 not installed")
        
        with patch("boto3.client") as mock_boto_client:
            mock_client = Mock()
            mock_response = Mock()
            mock_response['Body'].read.return_value = b'{"key": "value"}'
            mock_client.get_object.return_value = mock_response
            mock_boto_client.return_value = mock_client
            
            config = {
                "bucket_name": "test-bucket",
                "object_key": "test/object.json",
                "aws_region": "us-west-2"
            }
            
            result = AWSS3Handler.read(config)
            assert result == {"key": "value"}
    
    @patch("backend.inputs.input_sources.AWS_AVAILABLE", True)
    def test_write_object_with_region(self):
        """Test writing object with specific region"""
        try:
            import boto3
        except ImportError:
            pytest.skip("boto3 not installed")
        
        with patch("boto3.client") as mock_boto_client:
            mock_client = Mock()
            mock_boto_client.return_value = mock_client
            
            config = {
                "bucket_name": "test-bucket",
                "object_key": "test/object.json",
                "aws_region": "us-west-2"
            }
            
            result = AWSS3Handler.write(config, {"key": "value"})
            assert result["status"] == "success"
            mock_client.put_object.assert_called_once()


class TestGCPPubSubHandlerMore:
    """More tests for GCPPubSubHandler"""
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    def test_read_with_credentials(self):
        """Test reading from Pub/Sub with credentials"""
        # Mock both pubsub_v1 and service_account at module level
        mock_pubsub_module = Mock()
        mock_service_account = Mock()
        
        # Import modules into namespace for patching
        import backend.inputs.input_sources as input_sources_module
        input_sources_module.service_account = mock_service_account
        input_sources_module.pubsub_v1 = mock_pubsub_module
        
        mock_credentials = Mock()
        mock_service_account.Credentials.from_service_account_info = Mock(return_value=mock_credentials)
        
        mock_subscriber = Mock()
        mock_response = Mock()
        mock_message = Mock()
        mock_message.message.data = b'{"key": "value"}'
        mock_message.ack_id = "ack_123"
        mock_response.received_messages = [mock_message]
        mock_subscriber.pull.return_value = mock_response
        mock_subscriber.subscription_path = Mock(return_value="projects/test-project/subscriptions/test-subscription")
        mock_pubsub_module.SubscriberClient.return_value = mock_subscriber
        
        config = {
            "project_id": "test-project",
            "subscription_name": "test-subscription",
            "credentials": json.dumps({"type": "service_account"})
        }
        
        result = GCPPubSubHandler.read(config)
        assert result == {"key": "value"}
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    def test_write_with_credentials(self):
        """Test writing to Pub/Sub with credentials"""
        # Mock both pubsub_v1 and service_account at module level
        mock_pubsub_module = Mock()
        mock_service_account = Mock()
        
        # Import modules into namespace for patching
        import backend.inputs.input_sources as input_sources_module
        input_sources_module.service_account = mock_service_account
        input_sources_module.pubsub_v1 = mock_pubsub_module
        
        mock_credentials = Mock()
        mock_service_account.Credentials.from_service_account_info = Mock(return_value=mock_credentials)
        
        mock_publisher = Mock()
        mock_publisher.topic_path = Mock(return_value="projects/test-project/topics/test-topic")
        mock_pubsub_module.PublisherClient.return_value = mock_publisher
        
        config = {
            "project_id": "test-project",
            "topic_name": "test-topic",
            "credentials": json.dumps({"type": "service_account"})
        }
        
        result = GCPPubSubHandler.write(config, {"key": "value"})
        assert result["status"] == "success"
        mock_publisher.publish.assert_called_once()

