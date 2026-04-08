"""Unit tests for GCPBucketHandler.list_objects."""
from unittest.mock import MagicMock, patch

import pytest

from backend.inputs.input_sources import GCPBucketHandler


@pytest.mark.skipif(
    not __import__("backend.inputs.input_sources", fromlist=["GCP_AVAILABLE"]).GCP_AVAILABLE,
    reason="google-cloud-storage not installed",
)
def test_list_objects_returns_prefixes_and_objects():
    mock_blob = MagicMock()
    mock_blob.name = "data/hello.txt"
    mock_blob.size = 42
    mock_blob.updated = None

    mock_iter = MagicMock()
    mock_iter.__iter__ = lambda self: iter([mock_blob])
    mock_iter.prefixes = {"incoming/", "outgoing/"}

    mock_bucket = MagicMock()
    mock_bucket.list_blobs.return_value = mock_iter

    mock_client = MagicMock()
    mock_client.bucket.return_value = mock_bucket

    with patch(
        "backend.inputs.input_sources.gcp_client_with_adc_retry",
        return_value=mock_client,
    ):
        prefixes, objects = GCPBucketHandler.list_objects(
            {"bucket_name": "my-bucket", "credentials": None},
            prefix="data/",
            delimiter="/",
            max_results=100,
        )

    mock_bucket.list_blobs.assert_called_once()
    call_kw = mock_bucket.list_blobs.call_args[1]
    assert call_kw["prefix"] == "data/"
    assert call_kw["delimiter"] == "/"
    assert set(prefixes) == {"incoming/", "outgoing/"}
    assert len(objects) == 1
    assert objects[0]["name"] == "data/hello.txt"
