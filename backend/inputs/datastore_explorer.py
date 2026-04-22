"""Browse BigQuery datasets/tables and Firestore collections for workflow builder pickers."""
from typing import Any, Dict, List

from backend.inputs.gcp_auth import resolve_gcp_service_account_json
from backend.inputs.input_sources import _gcp_storage_client_kwargs


def _require_project_id(config: Dict[str, Any]) -> str:
    raw = config.get("project_id")
    if raw is None or not str(raw).strip():
        raise ValueError("project_id is required")
    return str(raw).strip()


class DatastoreExplorer:
    @staticmethod
    def list_bigquery_datasets(
        config: Dict[str, Any],
        *,
        max_results: int = 1000,
    ) -> List[Dict[str, Any]]:
        try:
            from google.cloud import bigquery
        except ImportError as e:
            raise ImportError(
                "google-cloud-bigquery is required to list BigQuery datasets. "
                "Install with: pip install google-cloud-bigquery"
            ) from e
        _require_project_id(config)
        resolved = resolve_gcp_service_account_json(config.get("credentials"))
        kwargs = _gcp_storage_client_kwargs(config, resolved_json=resolved)
        client = bigquery.Client(**kwargs)
        rows: List[Dict[str, Any]] = []
        for ds in client.list_datasets(max_results=max_results):
            rows.append(
                {
                    "name": ds.dataset_id,
                    "display_name": ds.dataset_id,
                    "size": None,
                    "updated": None,
                }
            )
        return rows

    @staticmethod
    def list_bigquery_tables(
        config: Dict[str, Any],
        *,
        dataset_id: str,
        max_results: int = 1000,
    ) -> List[Dict[str, Any]]:
        try:
            from google.cloud import bigquery
        except ImportError as e:
            raise ImportError(
                "google-cloud-bigquery is required to list BigQuery tables. "
                "Install with: pip install google-cloud-bigquery"
            ) from e
        project = _require_project_id(config)
        ds = (dataset_id or "").strip()
        if not ds:
            raise ValueError("dataset_id is required")
        resolved = resolve_gcp_service_account_json(config.get("credentials"))
        kwargs = _gcp_storage_client_kwargs(config, resolved_json=resolved)
        client = bigquery.Client(**kwargs)
        rows: List[Dict[str, Any]] = []
        dataset_ref = f"{project}.{ds}"
        for table in client.list_tables(dataset_ref, max_results=max_results):
            rows.append(
                {
                    "name": table.table_id,
                    "display_name": table.table_id,
                    "size": None,
                    "updated": None,
                }
            )
        return rows

    @staticmethod
    def list_firestore_root_collections(
        config: Dict[str, Any],
        *,
        max_results: int = 500,
    ) -> List[Dict[str, Any]]:
        try:
            from google.cloud import firestore
        except ImportError as e:
            raise ImportError(
                "google-cloud-firestore is required to list Firestore collections. "
                "Install with: pip install google-cloud-firestore"
            ) from e
        _require_project_id(config)
        resolved = resolve_gcp_service_account_json(config.get("credentials"))
        kwargs = _gcp_storage_client_kwargs(config, resolved_json=resolved)
        client = firestore.Client(**kwargs)
        rows: List[Dict[str, Any]] = []
        for i, coll in enumerate(client.collections()):
            if i >= max_results:
                break
            rows.append(
                {
                    "name": coll.id,
                    "display_name": coll.id,
                    "size": None,
                    "updated": None,
                }
            )
        return rows
