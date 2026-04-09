"""Tests for GCP Pub/Sub project id normalization (list topics/subscriptions, paths)."""

import pytest

from backend.inputs.input_sources import _normalize_gcp_pubsub_project_id


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("", ""),
        ("   ", ""),
        ("my-proj", "my-proj"),
        ("projects/my-proj", "my-proj"),
        ("projects/my-proj/topics/t1", "my-proj"),
        ("projects/my-proj/subscriptions/s1", "my-proj"),
    ],
)
def test_normalize_gcp_pubsub_project_id(raw, expected):
    assert _normalize_gcp_pubsub_project_id(raw) == expected
