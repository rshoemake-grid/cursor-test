"""
API usage metrics tracking for monitoring and analytics.
Thread-safe metrics collection compatible with Apigee analytics.
"""
from typing import Dict, Any
from collections import defaultdict
from datetime import datetime, timedelta
import threading
import time

class MetricsCollector:
    """Thread-safe metrics collector for API usage tracking"""
    
    def __init__(self):
        self._lock = threading.Lock()
        self._request_count = 0
        self._error_count = 0
        self._total_latency_ms = 0.0
        self._endpoint_counts: Dict[str, int] = defaultdict(int)
        self._endpoint_errors: Dict[str, int] = defaultdict(int)
        self._status_codes: Dict[int, int] = defaultdict(int)
        self._start_time = datetime.utcnow()
        self._last_reset = datetime.utcnow()
    
    def record_request(self, endpoint: str, status_code: int, latency_ms: float):
        """Record a request metric"""
        with self._lock:
            self._request_count += 1
            self._total_latency_ms += latency_ms
            self._endpoint_counts[endpoint] += 1
            self._status_codes[status_code] += 1
            
            if status_code >= 400:
                self._error_count += 1
                self._endpoint_errors[endpoint] += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics snapshot"""
        with self._lock:
            uptime_seconds = (datetime.utcnow() - self._start_time).total_seconds()
            avg_latency_ms = (
                self._total_latency_ms / self._request_count 
                if self._request_count > 0 
                else 0.0
            )
            
            return {
                "requests_total": self._request_count,
                "errors_total": self._error_count,
                "success_rate": (
                    (self._request_count - self._error_count) / self._request_count * 100
                    if self._request_count > 0
                    else 100.0
                ),
                "average_latency_ms": round(avg_latency_ms, 2),
                "uptime_seconds": round(uptime_seconds, 2),
                "requests_per_second": round(
                    self._request_count / uptime_seconds 
                    if uptime_seconds > 0 
                    else 0.0,
                    2
                ),
                "endpoints": dict(self._endpoint_counts),
                "endpoint_errors": dict(self._endpoint_errors),
                "status_codes": dict(self._status_codes),
                "last_reset": self._last_reset.isoformat(),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def reset(self):
        """Reset metrics (useful for periodic resets)"""
        with self._lock:
            self._request_count = 0
            self._error_count = 0
            self._total_latency_ms = 0.0
            self._endpoint_counts.clear()
            self._endpoint_errors.clear()
            self._status_codes.clear()
            self._last_reset = datetime.utcnow()

# Global metrics instance
metrics_collector = MetricsCollector()
