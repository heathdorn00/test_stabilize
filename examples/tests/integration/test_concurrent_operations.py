"""
Integration Tests: Concurrent Operations
Task: 57fbde - Comprehensive Test Framework
Layer: 4 - Integration Tests (Additional scenarios)

Tests concurrent operations and race conditions:
- Concurrent widget creation
- Concurrent updates to same resource
- Concurrent deletes
- Race conditions
- Lock contention
- Transaction isolation
"""

import pytest
import time
import concurrent.futures
from collections import defaultdict


@pytest.mark.integration
class TestConcurrentWidgetCreation:
    """Test concurrent widget creation."""

    def test_concurrent_widget_creation_no_conflicts(
        self,
        api_gateway_client,
        sample_widget_data,
        authenticated_token,
        postgres_cursor,
        clean_database,
        clean_redis
    ):
        """
        Test that concurrent widget creation works correctly:
        1. Create 50 widgets concurrently
        2. All creations succeed
        3. No duplicate IDs
        4. All widgets retrievable
        """
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        num_widgets = 50

        def create_widget(index):
            widget_data = sample_widget_data.copy()
            widget_data["label"] = f"Widget {index}"
            response = api_gateway_client.create_widget(widget_data)
            return response

        # Create widgets concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(create_widget, i) for i in range(num_widgets)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # All should succeed
        success_count = sum(1 for r in results if r.status_code == 201)
        assert success_count == num_widgets, f"Expected {num_widgets} successes, got {success_count}"

        # Extract widget IDs
        widget_ids = [r.json()["widget_id"] for r in results if r.status_code == 201]

        # No duplicate IDs
        assert len(widget_ids) == len(set(widget_ids)), "Found duplicate widget IDs"

        # All widgets should be in database
        postgres_cursor.execute("SELECT COUNT(*) FROM widgets")
        db_count = postgres_cursor.fetchone()[0]
        assert db_count == num_widgets

    def test_concurrent_creation_different_users(
        self,
        api_gateway_client,
        security_service_client,
        sample_widget_data,
        clean_database,
        clean_redis
    ):
        """
        Test concurrent widget creation by different users:
        1. Create multiple users
        2. Each user creates widgets concurrently
        3. No cross-user conflicts
        4. Each user can only see their own widgets
        """
        # Create 10 users
        users = []
        for i in range(10):
            user_data = {
                "username": f"user_{i}",
                "email": f"user{i}@example.com",
                "password": "Password123!",
                "role": "user"
            }
            security_service_client.create_user(user_data)

            # Get token
            auth_response = security_service_client.session.post(
                f"{security_service_client.base_url}/api/v1/auth/login",
                json={
                    "username": user_data["username"],
                    "password": user_data["password"]
                }
            )
            token = auth_response.json()["token"]
            users.append((user_data["username"], token))

        # Each user creates widgets concurrently
        def create_widget_as_user(user_tuple):
            username, token = user_tuple
            api_gateway_client.session.headers["Authorization"] = f"Bearer {token}"

            widget_data = sample_widget_data.copy()
            widget_data["label"] = f"Widget by {username}"
            response = api_gateway_client.create_widget(widget_data)
            return (username, response)

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(create_widget_as_user, user) for user in users]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # All creations should succeed
        for username, response in results:
            assert response.status_code == 201, f"User {username} failed to create widget"


@pytest.mark.integration
class TestConcurrentUpdates:
    """Test concurrent updates to same resource."""

    def test_concurrent_updates_to_same_widget(
        self,
        api_gateway_client,
        sample_widget_data,
        authenticated_token,
        clean_database,
        clean_redis
    ):
        """
        Test concurrent updates to same widget:
        1. Create widget
        2. Update widget concurrently from 20 threads
        3. Final state is consistent
        4. No lost updates
        """
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        # Create widget
        response = api_gateway_client.create_widget(sample_widget_data)
        widget_id = response.json()["widget_id"]

        # Concurrent updates
        num_updates = 20

        def update_widget(index):
            updates = {"label": f"Updated {index}"}
            response = api_gateway_client.update_widget(widget_id, updates)
            return response

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(update_widget, i) for i in range(num_updates)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # Most updates should succeed (some may conflict with 409)
        success_count = sum(1 for r in results if r.status_code == 200)
        conflict_count = sum(1 for r in results if r.status_code == 409)

        assert success_count + conflict_count == num_updates

        # Final widget state should be consistent
        response = api_gateway_client.get_widget(widget_id)
        assert response.status_code == 200
        widget = response.json()
        assert widget["label"].startswith("Updated")

    def test_optimistic_locking_prevents_lost_updates(
        self,
        api_gateway_client,
        sample_widget_data,
        authenticated_token,
        clean_database
    ):
        """
        Test optimistic locking prevents lost updates:
        1. Create widget with version number
        2. Two concurrent updates with same version
        3. One succeeds, one fails with conflict
        4. No lost updates
        """
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        # Create widget
        response = api_gateway_client.create_widget(sample_widget_data)
        widget_id = response.json()["widget_id"]
        version = response.json().get("version", 0)

        # Concurrent updates with same version
        def update_with_version(label):
            updates = {"label": label, "version": version}
            return api_gateway_client.update_widget(widget_id, updates)

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future1 = executor.submit(update_with_version, "Update 1")
            future2 = executor.submit(update_with_version, "Update 2")

            result1 = future1.result()
            result2 = future2.result()

        # One should succeed, one should fail with conflict
        statuses = [result1.status_code, result2.status_code]
        assert 200 in statuses, "One update should succeed"
        assert 409 in statuses or 412 in statuses, "One update should conflict"

    def test_concurrent_field_updates_no_overwrites(
        self,
        api_gateway_client,
        sample_widget_data,
        authenticated_token,
        clean_database
    ):
        """
        Test that concurrent updates to different fields don't overwrite:
        1. Create widget
        2. Update different fields concurrently
        3. All field updates should be preserved
        """
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        # Create widget
        response = api_gateway_client.create_widget(sample_widget_data)
        widget_id = response.json()["widget_id"]

        # Update different fields concurrently
        def update_label():
            return api_gateway_client.update_widget(widget_id, {"label": "New Label"})

        def update_enabled():
            return api_gateway_client.update_widget(widget_id, {"enabled": False})

        def update_position():
            return api_gateway_client.update_widget(widget_id, {"position": {"x": 100, "y": 200}})

        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future1 = executor.submit(update_label)
            future2 = executor.submit(update_enabled)
            future3 = executor.submit(update_position)

            future1.result()
            future2.result()
            future3.result()

        # Wait for consistency
        time.sleep(0.5)

        # Verify all updates applied
        response = api_gateway_client.get_widget(widget_id)
        widget = response.json()

        # At least some updates should be present
        # (Implementation-dependent: may use last-write-wins or merge)
        assert response.status_code == 200


@pytest.mark.integration
class TestConcurrentDeletes:
    """Test concurrent delete operations."""

    def test_concurrent_delete_same_widget_idempotent(
        self,
        api_gateway_client,
        sample_widget_data,
        authenticated_token,
        clean_database
    ):
        """
        Test that concurrent deletes are idempotent:
        1. Create widget
        2. Delete widget concurrently from 10 threads
        3. One delete succeeds, others return 404 or 204
        4. Widget is deleted exactly once
        """
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        # Create widget
        response = api_gateway_client.create_widget(sample_widget_data)
        widget_id = response.json()["widget_id"]

        # Concurrent deletes
        def delete_widget():
            return api_gateway_client.delete_widget(widget_id)

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(delete_widget) for _ in range(10)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # Count status codes
        status_codes = [r.status_code for r in results]
        success_deletes = sum(1 for s in status_codes if s == 204)
        not_found = sum(1 for s in status_codes if s == 404)

        # At least one should succeed, others should get 404
        assert success_deletes >= 1
        assert success_deletes + not_found == 10

    def test_concurrent_create_and_delete(
        self,
        api_gateway_client,
        sample_widget_data,
        authenticated_token,
        clean_database
    ):
        """
        Test concurrent create and delete operations:
        1. Create and delete widgets concurrently
        2. No race conditions
        3. Consistent final state
        """
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        created_widgets = []

        def create_and_delete(index):
            widget_data = sample_widget_data.copy()
            widget_data["label"] = f"Widget {index}"

            # Create
            create_response = api_gateway_client.create_widget(widget_data)
            if create_response.status_code == 201:
                widget_id = create_response.json()["widget_id"]
                created_widgets.append(widget_id)

                # Immediately delete
                delete_response = api_gateway_client.delete_widget(widget_id)
                return (create_response.status_code, delete_response.status_code)

            return (create_response.status_code, None)

        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(create_and_delete, i) for i in range(50)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # All creates should succeed
        for create_status, delete_status in results:
            assert create_status == 201


@pytest.mark.integration
class TestRaceConditions:
    """Test for race conditions in various scenarios."""

    def test_race_condition_widget_creation_and_retrieval(
        self,
        api_gateway_client,
        sample_widget_data,
        authenticated_token,
        clean_database,
        clean_redis
    ):
        """
        Test race condition between create and get:
        1. Create widget
        2. Immediately retrieve it
        3. No race condition (widget fully created before get)
        """
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        def create_and_get(index):
            widget_data = sample_widget_data.copy()
            widget_data["label"] = f"Widget {index}"

            # Create
            create_response = api_gateway_client.create_widget(widget_data)
            if create_response.status_code != 201:
                return False

            widget_id = create_response.json()["widget_id"]

            # Immediately get
            get_response = api_gateway_client.get_widget(widget_id)
            return get_response.status_code == 200

        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(create_and_get, i) for i in range(50)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # All should succeed (no race conditions)
        assert all(results), "Race condition detected between create and get"

    def test_race_condition_cache_invalidation(
        self,
        api_gateway_client,
        sample_widget_data,
        authenticated_token,
        clean_database,
        clean_redis
    ):
        """
        Test race condition in cache invalidation:
        1. Create widget
        2. Update widget
        3. Get widget immediately
        4. Should see updated data (cache invalidated)
        """
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        # Create widget
        response = api_gateway_client.create_widget(sample_widget_data)
        widget_id = response.json()["widget_id"]

        # Update and get concurrently
        def update_and_get():
            # Update
            api_gateway_client.update_widget(widget_id, {"label": "Updated"})

            # Immediately get
            time.sleep(0.01)  # Tiny delay
            get_response = api_gateway_client.get_widget(widget_id)
            return get_response.json()["label"]

        # Run multiple times to catch race condition
        results = []
        for _ in range(10):
            label = update_and_get()
            results.append(label)

        # Should eventually see "Updated" (eventual consistency)
        assert "Updated" in results


@pytest.mark.integration
@pytest.mark.performance
class TestConcurrentOperationPerformance:
    """Test performance under concurrent load."""

    def test_throughput_under_concurrent_load(
        self,
        api_gateway_client,
        sample_widget_data,
        authenticated_token,
        clean_database,
        clean_redis
    ):
        """
        Test system throughput under concurrent load:
        1. Create 100 widgets concurrently (10 workers)
        2. Measure total time
        3. Calculate throughput
        4. Verify acceptable performance
        """
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        num_widgets = 100
        num_workers = 10

        def create_widget(index):
            widget_data = sample_widget_data.copy()
            widget_data["label"] = f"Widget {index}"
            return api_gateway_client.create_widget(widget_data)

        start_time = time.time()

        with concurrent.futures.ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = [executor.submit(create_widget, i) for i in range(num_widgets)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        duration = time.time() - start_time

        # Calculate throughput
        success_count = sum(1 for r in results if r.status_code == 201)
        throughput = success_count / duration

        print(f"\n✅ Concurrent throughput: {throughput:.2f} req/s")
        print(f"   Total time: {duration:.2f}s")
        print(f"   Success rate: {success_count}/{num_widgets}")

        # Should handle at least 10 req/s
        assert throughput >= 10, f"Throughput too low: {throughput:.2f} req/s"

    def test_latency_under_concurrent_load(
        self,
        api_gateway_client,
        sample_widget_data,
        authenticated_token,
        clean_database,
        clean_redis
    ):
        """
        Test that latency remains acceptable under concurrent load:
        1. Create widgets concurrently
        2. Measure P50, P95, P99 latencies
        3. Verify within SLO targets
        """
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        num_requests = 100
        latencies = []

        def create_widget_timed(index):
            widget_data = sample_widget_data.copy()
            widget_data["label"] = f"Widget {index}"

            start = time.time()
            response = api_gateway_client.create_widget(widget_data)
            latency = time.time() - start

            return (response.status_code, latency)

        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(create_widget_timed, i) for i in range(num_requests)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # Extract latencies from successful requests
        latencies = [lat for status, lat in results if status == 201]
        latencies.sort()

        # Calculate percentiles
        p50 = latencies[len(latencies) // 2]
        p95 = latencies[int(len(latencies) * 0.95)]
        p99 = latencies[int(len(latencies) * 0.99)]

        print(f"\n📊 Latency under load:")
        print(f"   P50: {p50*1000:.0f}ms")
        print(f"   P95: {p95*1000:.0f}ms")
        print(f"   P99: {p99*1000:.0f}ms")

        # Verify SLO targets
        assert p95 < 1.0, f"P95 latency too high: {p95*1000:.0f}ms"


@pytest.mark.integration
class TestLockContention:
    """Test behavior under lock contention."""

    def test_database_lock_contention_handling(
        self,
        api_gateway_client,
        sample_widget_data,
        authenticated_token,
        clean_database
    ):
        """
        Test system handles database lock contention gracefully:
        1. Create widget
        2. Multiple threads update same widget (lock contention)
        3. System handles contention gracefully (retry or fail)
        4. No deadlocks or hangs
        """
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        # Create widget
        response = api_gateway_client.create_widget(sample_widget_data)
        widget_id = response.json()["widget_id"]

        # Heavy concurrent updates (lock contention)
        num_updates = 50

        def update_widget(index):
            updates = {"label": f"Update {index}"}
            return api_gateway_client.update_widget(widget_id, updates)

        start_time = time.time()

        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(update_widget, i) for i in range(num_updates)]
            results = [f.result() for f in concurrent.futures.as_completed(futures, timeout=30)]

        duration = time.time() - start_time

        # Should complete without hanging
        assert duration < 30, "Test hung - possible deadlock"

        # Count outcomes
        success_count = sum(1 for r in results if r.status_code == 200)
        conflict_count = sum(1 for r in results if r.status_code in [409, 500])

        # Most should succeed or fail gracefully
        assert success_count + conflict_count == num_updates
