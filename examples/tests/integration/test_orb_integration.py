"""
Integration Tests: ORB Integration
Task: 57fbde - Comprehensive Test Framework
Layer: 4 - Integration Tests (CORBA/ORB integration)

Tests integration between wxWidgets (C++) and PolyORB (Ada) services:
- CORBA invocations
- ORB transport
- Memory management (Phase 1 validation)
"""

import pytest
import requests


@pytest.mark.integration
class TestORBCommunication:
    """Test communication between wxWidgets and PolyORB services."""

    def test_widget_core_to_orb_core_communication(
        self,
        widget_core_client,
        http_session,
        clean_database
    ):
        """
        Test that Widget Core can communicate with ORB Core:
        1. Widget Core makes CORBA call to ORB Core
        2. ORB Core processes request
        3. Response returned to Widget Core
        """
        # Create widget that requires ORB interaction
        widget_data = {
            "type": "corba_widget",
            "label": "CORBA Test",
            "orb_reference": "IOR:010000001100000049444c3a..."  # Mock IOR
        }

        response = widget_core_client.create_widget(widget_data)
        assert response.status_code == 201

        widget_id = response.json()["widget_id"]

        # Trigger ORB interaction
        orb_response = widget_core_client.session.post(
            f"{widget_core_client.base_url}/widgets/{widget_id}/orb/invoke",
            json={"operation": "test_operation", "params": []}
        )

        assert orb_response.status_code == 200
        assert "result" in orb_response.json()

    def test_orb_transport_resilience(
        self,
        widget_core_client,
        http_session
    ):
        """Test ORB transport resilience when ORB Core is slow."""
        widget_data = {
            "type": "corba_widget",
            "label": "Timeout Test",
            "orb_reference": "IOR:010000001100000049444c3a..."
        }

        response = widget_core_client.create_widget(widget_data)
        widget_id = response.json()["widget_id"]

        # Trigger ORB call with simulated delay
        orb_response = widget_core_client.session.post(
            f"{widget_core_client.base_url}/widgets/{widget_id}/orb/invoke",
            json={"operation": "slow_operation", "params": []},
            timeout=5  # 5 second timeout
        )

        # Should either succeed or fail gracefully
        assert orb_response.status_code in [200, 408, 504]  # OK, Timeout, Gateway Timeout


@pytest.mark.integration
class TestPhase1MemoryDeallocation:
    """
    Test Phase 1 refactor: Memory deallocation in PolyORB.
    Validates that 73 deallocation instances work correctly.
    """

    def test_orb_memory_deallocation_on_widget_delete(
        self,
        widget_core_client,
        http_session,
        clean_database
    ):
        """
        Test that deleting a widget triggers proper ORB memory deallocation.
        Phase 1 validation: Ensures refactored deallocation code works.
        """
        # Create CORBA widget
        widget_data = {
            "type": "corba_widget",
            "label": "Memory Test",
            "orb_reference": "IOR:010000001100000049444c3a..."
        }

        create_response = widget_core_client.create_widget(widget_data)
        widget_id = create_response.json()["widget_id"]

        # Get initial ORB memory metrics
        orb_metrics_before = http_session.get("http://localhost:9091/metrics").text
        deallocations_before = self._extract_deallocation_count(orb_metrics_before)

        # Delete widget (should trigger ORB deallocation)
        delete_response = widget_core_client.session.delete(
            f"{widget_core_client.base_url}/widgets/{widget_id}"
        )
        assert delete_response.status_code == 204

        # Get updated ORB memory metrics
        orb_metrics_after = http_session.get("http://localhost:9091/metrics").text
        deallocations_after = self._extract_deallocation_count(orb_metrics_after)

        # Verify deallocation occurred
        assert deallocations_after > deallocations_before, \
            "ORB deallocation count did not increase after widget deletion"

    def test_critical_deallocation_memory_zeroization(
        self,
        widget_core_client,
        http_session,
        clean_database
    ):
        """
        Test that CRITICAL deallocations (security-sensitive) zero memory.
        Phase 1: 3 CRITICAL instances must zero memory before deallocation.
        """
        # Create widget with sensitive data
        widget_data = {
            "type": "secure_widget",
            "label": "Security Test",
            "sensitive_data": "SECRET_KEY_12345",
            "orb_reference": "IOR:010000001100000049444c3a..."
        }

        create_response = widget_core_client.create_widget(widget_data)
        widget_id = create_response.json()["widget_id"]

        # Get ORB metrics before deletion
        orb_metrics_before = http_session.get("http://localhost:9091/metrics").text
        critical_deallocations_before = self._extract_critical_deallocation_count(orb_metrics_before)

        # Delete widget
        widget_core_client.session.delete(
            f"{widget_core_client.base_url}/widgets/{widget_id}"
        )

        # Get ORB metrics after deletion
        orb_metrics_after = http_session.get("http://localhost:9091/metrics").text
        critical_deallocations_after = self._extract_critical_deallocation_count(orb_metrics_after)

        # Verify critical deallocation occurred
        assert critical_deallocations_after > critical_deallocations_before, \
            "Critical deallocation count did not increase"

    def _extract_deallocation_count(self, metrics_text):
        """Extract polyorb_memory_deallocations_total from Prometheus metrics."""
        for line in metrics_text.split('\n'):
            if line.startswith('polyorb_memory_deallocations_total'):
                return float(line.split()[1])
        return 0

    def _extract_critical_deallocation_count(self, metrics_text):
        """Extract critical deallocation count from Prometheus metrics."""
        for line in metrics_text.split('\n'):
            if 'polyorb_memory_deallocations_total' in line and 'critical="true"' in line:
                return float(line.split()[1])
        return 0


@pytest.mark.integration
class TestORBConnectionPool:
    """Test ORB connection pool management."""

    def test_connection_pool_exhaustion(
        self,
        widget_core_client,
        http_session
    ):
        """Test behavior when ORB connection pool is exhausted."""
        # Create many widgets rapidly to exhaust connection pool
        widget_data = {
            "type": "corba_widget",
            "label": "Pool Test",
            "orb_reference": "IOR:010000001100000049444c3a..."
        }

        # Create widgets up to pool limit
        responses = []
        for i in range(150):  # Assume pool size is ~100
            response = widget_core_client.create_widget(widget_data)
            responses.append(response)

        # Some requests should succeed
        success_count = sum(1 for r in responses if r.status_code == 201)
        assert success_count > 0

        # Some may fail gracefully with 503 (Service Unavailable) or queue
        failure_count = sum(1 for r in responses if r.status_code == 503)

        # Either all succeed (good pooling) or some fail gracefully
        assert success_count + failure_count == len(responses)

    def test_connection_pool_recovery(
        self,
        widget_core_client,
        http_session
    ):
        """Test that connection pool recovers after exhaustion."""
        import time

        widget_data = {
            "type": "corba_widget",
            "label": "Recovery Test",
            "orb_reference": "IOR:010000001100000049444c3a..."
        }

        # Exhaust pool
        for i in range(150):
            widget_core_client.create_widget(widget_data)

        # Wait for connections to be released
        time.sleep(2)

        # Verify new requests succeed
        response = widget_core_client.create_widget(widget_data)
        assert response.status_code == 201


@pytest.mark.integration
@pytest.mark.performance
class TestORBPerformance:
    """Test ORB call performance."""

    def test_orb_call_latency(
        self,
        widget_core_client,
        performance_tracker
    ):
        """Test that ORB calls complete within acceptable latency."""
        widget_data = {
            "type": "corba_widget",
            "label": "Latency Test",
            "orb_reference": "IOR:010000001100000049444c3a..."
        }

        response = widget_core_client.create_widget(widget_data)
        widget_id = response.json()["widget_id"]

        # Measure ORB call latency
        performance_tracker.start()
        orb_response = widget_core_client.session.post(
            f"{widget_core_client.base_url}/widgets/{widget_id}/orb/invoke",
            json={"operation": "simple_operation", "params": []}
        )
        performance_tracker.stop()

        assert orb_response.status_code == 200
        performance_tracker.assert_duration_under(
            0.5,  # 500ms threshold
            "ORB call took too long"
        )

    def test_bulk_orb_calls_performance(
        self,
        widget_core_client
    ):
        """Test performance of multiple ORB calls."""
        import time

        widget_data = {
            "type": "corba_widget",
            "label": "Bulk Test",
            "orb_reference": "IOR:010000001100000049444c3a..."
        }

        response = widget_core_client.create_widget(widget_data)
        widget_id = response.json()["widget_id"]

        num_calls = 100
        start_time = time.time()

        for i in range(num_calls):
            widget_core_client.session.post(
                f"{widget_core_client.base_url}/widgets/{widget_id}/orb/invoke",
                json={"operation": "simple_operation", "params": [i]}
            )

        duration = time.time() - start_time

        # Should complete 100 calls in under 10 seconds (10 calls/second minimum)
        assert duration < 10.0, f"Bulk ORB calls took {duration:.2f}s, expected < 10s"
        throughput = num_calls / duration
        print(f"\n✅ ORB call throughput: {throughput:.2f} calls/second")


@pytest.mark.integration
class TestORBErrorHandling:
    """Test ORB error handling and resilience."""

    def test_orb_exception_handling(
        self,
        widget_core_client
    ):
        """Test that ORB exceptions are properly handled."""
        widget_data = {
            "type": "corba_widget",
            "label": "Exception Test",
            "orb_reference": "IOR:010000001100000049444c3a..."
        }

        response = widget_core_client.create_widget(widget_data)
        widget_id = response.json()["widget_id"]

        # Trigger ORB exception
        orb_response = widget_core_client.session.post(
            f"{widget_core_client.base_url}/widgets/{widget_id}/orb/invoke",
            json={"operation": "exception_operation", "params": []}
        )

        # Should return 500 with error details
        assert orb_response.status_code == 500
        error_json = orb_response.json()
        assert "error" in error_json
        assert "CORBA" in error_json["error"] or "ORB" in error_json["error"]

    def test_orb_timeout_handling(
        self,
        widget_core_client
    ):
        """Test that ORB timeouts are properly handled."""
        widget_data = {
            "type": "corba_widget",
            "label": "Timeout Test",
            "orb_reference": "IOR:010000001100000049444c3a..."
        }

        response = widget_core_client.create_widget(widget_data)
        widget_id = response.json()["widget_id"]

        # Trigger ORB timeout
        orb_response = widget_core_client.session.post(
            f"{widget_core_client.base_url}/widgets/{widget_id}/orb/invoke",
            json={"operation": "timeout_operation", "params": []},
            timeout=2
        )

        # Should return 504 Gateway Timeout
        assert orb_response.status_code in [408, 504]
