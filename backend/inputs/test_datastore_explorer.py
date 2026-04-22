"""Unit tests for DatastoreExplorer (BigQuery / Firestore listing)."""
from unittest.mock import MagicMock, patch

import pytest

from backend.inputs.datastore_explorer import DatastoreExplorer


def test_list_bigquery_datasets_maps_dataset_ids():
    mock_ds = MagicMock()
    mock_ds.dataset_id = "warehouse"
    mock_client = MagicMock()
    mock_client.list_datasets.return_value = [mock_ds]
    with patch("google.cloud.bigquery.Client", return_value=mock_client):
        rows = DatastoreExplorer.list_bigquery_datasets(
            {"project_id": "proj-1", "credentials": None},
            max_results=10,
        )
    assert rows == [
        {
            "name": "warehouse",
            "display_name": "warehouse",
            "size": None,
            "updated": None,
        },
    ]
    mock_client.list_datasets.assert_called_once_with(max_results=10)


def test_list_bigquery_tables_maps_table_ids():
    mock_table = MagicMock()
    mock_table.table_id = "events"
    mock_client = MagicMock()
    mock_client.list_tables.return_value = [mock_table]
    with patch("google.cloud.bigquery.Client", return_value=mock_client):
        rows = DatastoreExplorer.list_bigquery_tables(
            {"project_id": "proj-1", "credentials": None},
            dataset_id="warehouse",
            max_results=20,
        )
    assert rows[0]["name"] == "events"
    mock_client.list_tables.assert_called_once_with("proj-1.warehouse", max_results=20)


def test_list_bigquery_datasets_requires_project():
    with pytest.raises(ValueError, match="project_id"):
        DatastoreExplorer.list_bigquery_datasets({"project_id": "", "credentials": None})


def test_list_bigquery_tables_requires_dataset():
    with pytest.raises(ValueError, match="dataset_id"):
        DatastoreExplorer.list_bigquery_tables(
            {"project_id": "p", "credentials": None},
            dataset_id="  ",
        )


def test_list_firestore_root_collections_maps_ids():
    mock_coll = MagicMock()
    mock_coll.id = "users"
    mock_client = MagicMock()
    mock_client.collections.return_value = iter([mock_coll])
    with patch("google.cloud.firestore.Client", return_value=mock_client):
        rows = DatastoreExplorer.list_firestore_root_collections(
            {"project_id": "proj-1", "credentials": None},
            max_results=100,
        )
    assert rows == [
        {"name": "users", "display_name": "users", "size": None, "updated": None},
    ]
