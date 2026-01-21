"""More tests for GCP and AWS input source handlers"""
import pytest
from unittest.mock import Mock, patch
import json

from backend.inputs.input_sources import (
    GCPBucketHandler,
    AWSS3Handler,
    GCPPubSubHandler
)


class TestGCPBucketHandlerMore:
    """More tests for GCPBucketHandler"""
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    @patch("backend.inputs.input_sources.storage")
    def test_read_object_text(self, mock_storage):
        """Test reading text object from GCP bucket"""
        mock_client = Mock()
        mock_bucket = Mock()
        mock_blob = Mock()
        mock_blob.download_as_text.return_value = "Plain text content"
        
        mock_storage.Client.return_value = mock_client
        mock_client.bucket.return_value = mock_bucket
        mock_bucket.blob.return_value = mock_blob
        
        config = {
            "bucket_name": "test-bucket",
            "object_path": "test/file.txt"
        }
        
        result = GCPBucketHandler.read(config)
        assert result == "Plain text content"
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    @patch("backend.inputs.input_sources.storage")
    def test_read_object_list(self, mock_storage):
        """Test listing objects in GCP bucket"""
        mock_client = Mock()
        mock_bucket = Mock()
        mock_blob1 = Mock()
        mock_blob1.name = "file1.txt"
        mock_blob2 = Mock()
        mock_blob2.name = "file2.txt"
        mock_bucket.list_blobs.return_value = [mock_blob1, mock_blob2]
        
        mock_storage.Client.return_value = mock_client
        mock_client.bucket.return_value = mock_bucket
        
        config = {
            "bucket_name": "test-bucket",
            "object_path": ""
        }
        
        result = GCPBucketHandler.read(config)
        assert isinstance(result, list)
        assert len(result) == 2
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    @patch("backend.inputs.input_sources.storage")
    def test_write_object_list(self, mock_storage):
        """Test writing list data to GCP bucket"""
        mock_client = Mock()
        mock_bucket = Mock()
        mock_blob = Mock()
        
        mock_storage.Client.return_value = mock_client
        mock_client.bucket.return_value = mock_bucket
        mock_bucket.blob.return_value = mock_blob
        
        config = {
            "bucket_name": "test-bucket",
            "object_path": "test/data.json"
        }
        
        data = [1, 2, 3, {"key": "value"}]
        result = GCPBucketHandler.write(config, data)
        assert result["status"] == "success"
        mock_blob.upload_from_string.assert_called_once()


class TestAWSS3HandlerMore:
    """More tests for AWSS3Handler"""
    
    @patch("backend.inputs.input_sources.AWS_AVAILABLE", True)
    def test_read_object_text(self):
        """Test reading text object from S3"""
        try:
            import boto3
        except ImportError:
            pytest.skip("boto3 not installed")
        
        with patch("boto3.client") as mock_boto_client:
            mock_client = Mock()
            mock_response = Mock()
            mock_response['Body'].read.return_value = b'Plain text content'
            mock_client.get_object.return_value = mock_response
            mock_boto_client.return_value = mock_client
            
            config = {
                "bucket_name": "test-bucket",
                "object_key": "test/file.txt"
            }
            
            result = AWSS3Handler.read(config)
            assert result == "Plain text content"
    
    @patch("backend.inputs.input_sources.AWS_AVAILABLE", True)
    def test_read_object_not_found(self):
        """Test reading non-existent object from S3"""
        try:
            import boto3
        except ImportError:
            pytest.skip("boto3 not installed")
        
        with patch("boto3.client") as mock_boto_client:
            mock_client = Mock()
            mock_client.exceptions.NoSuchKey = Exception
            mock_client.get_object.side_effect = mock_client.exceptions.NoSuchKey()
            mock_boto_client.return_value = mock_client
            
            config = {
                "bucket_name": "test-bucket",
                "object_key": "nonexistent.txt"
            }
            
            with pytest.raises(FileNotFoundError):
                AWSS3Handler.read(config)
    
    @patch("backend.inputs.input_sources.AWS_AVAILABLE", True)
    def test_write_object_list(self):
        """Test writing list data to S3"""
        try:
            import boto3
        except ImportError:
            pytest.skip("boto3 not installed")
        
        with patch("boto3.client") as mock_boto_client:
            mock_client = Mock()
            mock_boto_client.return_value = mock_client
            
            config = {
                "bucket_name": "test-bucket",
                "object_key": "test/data.json"
            }
            
            data = [1, 2, 3]
            result = AWSS3Handler.write(config, data)
            assert result["status"] == "success"
            mock_client.put_object.assert_called_once()


class TestGCPPubSubHandlerMore:
    """More tests for GCPPubSubHandler"""
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    def test_read_multiple_messages(self):
        """Test reading multiple messages from Pub/Sub"""
        pytest.importorskip("google.cloud.pubsub_v1")
        
        with patch("backend.inputs.input_sources.pubsub_v1") as mock_pubsub:
            mock_subscriber = Mock()
            mock_response = Mock()
            mock_message1 = Mock()
            mock_message1.message.data = b'{"key1": "value1"}'
            mock_message1.ack_id = "ack_1"
            mock_message2 = Mock()
            mock_message2.message.data = b'{"key2": "value2"}'
            mock_message2.ack_id = "ack_2"
            mock_response.received_messages = [mock_message1, mock_message2]
            mock_subscriber.pull.return_value = mock_response
            mock_pubsub.SubscriberClient.return_value = mock_subscriber
        
            config = {
                "project_id": "test-project",
                "subscription_name": "test-subscription"
            }
            
            result = GCPPubSubHandler.read(config)
            assert isinstance(result, list)
            assert len(result) == 2
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    def test_read_no_messages(self):
        """Test reading when no messages available"""
        pytest.importorskip("google.cloud.pubsub_v1")
        
        with patch("backend.inputs.input_sources.pubsub_v1") as mock_pubsub:
            mock_subscriber = Mock()
            mock_response = Mock()
            mock_response.received_messages = []
            mock_subscriber.pull.return_value = mock_response
            mock_pubsub.SubscriberClient.return_value = mock_subscriber
            
            config = {
                "project_id": "test-project",
                "subscription_name": "test-subscription"
            }
            
            result = GCPPubSubHandler.read(config)
            assert result is None
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    def test_write_list_data(self):
        """Test writing list data to Pub/Sub"""
        pytest.importorskip("google.cloud.pubsub_v1")
        
        with patch("backend.inputs.input_sources.pubsub_v1") as mock_pubsub:
            mock_publisher = Mock()
            mock_future = Mock()
            mock_future.result.return_value = "msg_123"
            mock_publisher.publish.return_value = mock_future
            mock_pubsub.PublisherClient.return_value = mock_publisher
            
            config = {
                "project_id": "test-project",
                "topic_name": "test-topic"
            }
            
            data = [1, 2, 3]
            result = GCPPubSubHandler.write(config, data)
            assert result["status"] == "success"
            mock_publisher.publish.assert_called_once()
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    def test_read_missing_config(self):
        """Test reading from Pub/Sub with missing config"""
        config = {
            "project_id": "test-project"
            # Missing subscription_name
        }
        
        with pytest.raises(ValueError, match="project_id and subscription_name are required"):
            GCPPubSubHandler.read(config)
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    def test_write_missing_config(self):
        """Test writing to Pub/Sub with missing config"""
        config = {
            "project_id": "test-project"
            # Missing topic_name
        }
        
        with pytest.raises(ValueError, match="project_id and topic_name are required"):
            GCPPubSubHandler.write(config, {"key": "value"})

