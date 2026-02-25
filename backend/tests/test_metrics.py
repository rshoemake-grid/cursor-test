"""
Tests for backend/utils/metrics.py
"""
import pytest
import time
from backend.utils.metrics import MetricsCollector, metrics_collector


def test_metrics_collector_init():
    """Test MetricsCollector initialization"""
    collector = MetricsCollector()
    assert collector._request_count == 0
    assert collector._error_count == 0
    assert collector._total_latency_ms == 0.0
    assert collector._endpoint_counts == {}
    assert collector._endpoint_errors == {}
    assert collector._status_codes == {}


def test_record_request_success():
    """Test recording successful request"""
    collector = MetricsCollector()
    collector.record_request("/api/test", 200, 50.5)
    
    assert collector._request_count == 1
    assert collector._error_count == 0
    assert collector._total_latency_ms == 50.5
    assert collector._endpoint_counts["/api/test"] == 1
    assert collector._status_codes[200] == 1


def test_record_request_error():
    """Test recording error request"""
    collector = MetricsCollector()
    collector.record_request("/api/test", 500, 100.0)
    
    assert collector._request_count == 1
    assert collector._error_count == 1
    assert collector._total_latency_ms == 100.0
    assert collector._endpoint_counts["/api/test"] == 1
    assert collector._endpoint_errors["/api/test"] == 1
    assert collector._status_codes[500] == 1


def test_record_request_multiple():
    """Test recording multiple requests"""
    collector = MetricsCollector()
    collector.record_request("/api/test1", 200, 50.0)
    collector.record_request("/api/test2", 201, 75.0)
    collector.record_request("/api/test1", 404, 30.0)
    
    assert collector._request_count == 3
    assert collector._error_count == 1
    assert collector._total_latency_ms == 155.0
    assert collector._endpoint_counts["/api/test1"] == 2
    assert collector._endpoint_counts["/api/test2"] == 1
    assert collector._endpoint_errors["/api/test1"] == 1


def test_get_metrics():
    """Test getting metrics snapshot"""
    collector = MetricsCollector()
    collector.record_request("/api/test", 200, 50.0)
    collector.record_request("/api/test", 500, 100.0)
    
    metrics = collector.get_metrics()
    
    assert metrics["requests_total"] == 2
    assert metrics["errors_total"] == 1
    assert metrics["success_rate"] == 50.0
    assert metrics["average_latency_ms"] == 75.0
    assert metrics["endpoints"]["/api/test"] == 2
    assert metrics["endpoint_errors"]["/api/test"] == 1
    assert metrics["status_codes"][200] == 1
    assert metrics["status_codes"][500] == 1
    assert "uptime_seconds" in metrics
    assert "requests_per_second" in metrics
    assert "last_reset" in metrics
    assert "timestamp" in metrics


def test_get_metrics_no_requests():
    """Test getting metrics with no requests"""
    collector = MetricsCollector()
    metrics = collector.get_metrics()
    
    assert metrics["requests_total"] == 0
    assert metrics["errors_total"] == 0
    assert metrics["success_rate"] == 100.0
    assert metrics["average_latency_ms"] == 0.0
    assert metrics["requests_per_second"] == 0.0


def test_reset():
    """Test resetting metrics"""
    collector = MetricsCollector()
    collector.record_request("/api/test", 200, 50.0)
    collector.record_request("/api/test", 500, 100.0)
    
    collector.reset()
    
    assert collector._request_count == 0
    assert collector._error_count == 0
    assert collector._total_latency_ms == 0.0
    assert len(collector._endpoint_counts) == 0
    assert len(collector._endpoint_errors) == 0
    assert len(collector._status_codes) == 0


def test_global_metrics_collector():
    """Test global metrics_collector instance"""
    assert metrics_collector is not None
    assert isinstance(metrics_collector, MetricsCollector)


def test_thread_safety():
    """Test that metrics collection is thread-safe"""
    import threading
    
    collector = MetricsCollector()
    
    def record_requests():
        for _ in range(100):
            collector.record_request("/api/test", 200, 10.0)
    
    threads = [threading.Thread(target=record_requests) for _ in range(10)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    
    assert collector._request_count == 1000
    assert collector._endpoint_counts["/api/test"] == 1000
