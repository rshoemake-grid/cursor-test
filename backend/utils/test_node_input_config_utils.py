"""Tests for get_node_input_config (dict payloads and data merge)."""

from backend.models.schemas import Node, NodeType
from backend.utils.node_input_config_utils import get_node_input_config


def test_dict_node_with_top_level_input_config():
    node = {
        "id": "n1",
        "type": "gcp_bucket",
        "input_config": {
            "bucket_name": "sysco-smarter-catalog-ce-batch-job-dev",
            "mode": "read",
        },
    }
    cfg = get_node_input_config(node)
    assert cfg["bucket_name"] == "sysco-smarter-catalog-ce-batch-job-dev"
    assert cfg.get("mode") == "read"


def test_dict_node_merges_data_then_top_level():
    node = {
        "id": "n1",
        "data": {
            "input_config": {"bucket_name": "from-data", "mode": "read"},
        },
        "input_config": {"bucket_name": "from-top"},
    }
    cfg = get_node_input_config(node)
    assert cfg["bucket_name"] == "from-top"
    assert cfg["mode"] == "read"


def test_pydantic_node_top_level_input_config_only():
    """Execution uses Pydantic Node; API JSON has input_config at top level (matches frontend save)."""
    node = Node(
        id="gcp-1",
        type=NodeType.GCP_BUCKET,
        input_config={
            "bucket_name": "sysco-smarter-catalog-ce-batch-job-dev",
            "object_path": "path/in/bucket.txt",
            "mode": "read",
        },
    )
    cfg = get_node_input_config(node)
    assert cfg["bucket_name"] == "sysco-smarter-catalog-ce-batch-job-dev"
    assert cfg["object_path"] == "path/in/bucket.txt"


def test_pydantic_node_data_input_config_merged_with_top_level():
    node = Node(
        id="gcp-2",
        type=NodeType.GCP_BUCKET,
        data={
            "label": "GCP Bucket",
            "input_config": {
                "bucket_name": "from-data-bucket",
                "mode": "read",
            },
        },
        input_config={"bucket_name": "from-top-bucket"},
    )
    cfg = get_node_input_config(node)
    assert cfg["bucket_name"] == "from-top-bucket"
    assert cfg["mode"] == "read"
