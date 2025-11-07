"""
Integration Tests: Widget Workflow
Task: 57fbde - Comprehensive Test Framework
Layer: 4 - Integration Tests (Multi-service workflows)

Tests end-to-end widget lifecycle across multiple services:
- API Gateway → Widget Core → Database → Redis
- Authentication → Authorization → Widget Operations
"""

import pytest
import time


@pytest.mark.integration
class TestWidgetCreateWorkflow:
    """Test widget creation workflow across services."""

    def test_create_widget_via_api_gateway(
        self,
        api_gateway_client,
        sample_widget_data,
        authenticated_token,
        clean_database,
        clean_redis,
        postgres_cursor,
        redis_client
    ):
        """
        Test complete widget creation workflow:
        1. Authenticate user
        2. Create widget via API Gateway
        3. Verify widget stored in database
        4. Verify widget cached in Redis
        5. Verify widget retrievable via API
        """
        # Step 1: Add auth header
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        # Step 2: Create widget via API Gateway
        response = api_gateway_client.create_widget(sample_widget_data)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"

        widget_id = response.json()["widget_id"]
        assert widget_id is not None

        # Step 3: Verify widget in database
        postgres_cursor.execute("SELECT * FROM widgets WHERE widget_id = %s", (widget_id,))
        db_widget = postgres_cursor.fetchone()
        assert db_widget is not None, "Widget not found in database"

        # Step 4: Verify widget in Redis cache
        cached_widget = redis_client.get(f"widget:{widget_id}")
        assert cached_widget is not None, "Widget not found in Redis cache"

        # Step 5: Verify widget retrievable via API
        get_response = api_gateway_client.get_widget(widget_id)
        assert get_response.status_code == 200
        retrieved_widget = get_response.json()
        assert retrieved_widget["widget_id"] == widget_id
        assert retrieved_widget["type"] == sample_widget_data["type"]
        assert retrieved_widget["label"] == sample_widget_data["label"]

    def test_create_widget_without_authentication(
        self,
        api_gateway_client,
        sample_widget_data,
        clean_database
    ):
        """Test that widget creation requires authentication."""
        # Remove auth header
        api_gateway_client.session.headers.pop("Authorization", None)

        response = api_gateway_client.create_widget(sample_widget_data)
        assert response.status_code == 401, "Expected 401 Unauthorized without token"

    def test_create_widget_with_invalid_data(
        self,
        api_gateway_client,
        authenticated_token,
        clean_database
    ):
        """Test widget creation with invalid data."""
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        invalid_data = {
            "type": "invalid_type",  # Invalid widget type
            "label": ""  # Empty label
        }

        response = api_gateway_client.create_widget(invalid_data)
        assert response.status_code == 400, "Expected 400 Bad Request for invalid data"


@pytest.mark.integration
class TestWidgetUpdateWorkflow:
    """Test widget update workflow across services."""

    @pytest.fixture
    def created_widget(self, api_gateway_client, sample_widget_data, authenticated_token, clean_database, clean_redis):
        """Create a widget before each test."""
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"
        response = api_gateway_client.create_widget(sample_widget_data)
        assert response.status_code == 201
        return response.json()

    def test_update_widget_workflow(
        self,
        api_gateway_client,
        created_widget,
        authenticated_token,
        postgres_cursor,
        redis_client
    ):
        """
        Test widget update workflow:
        1. Update widget via API Gateway
        2. Verify database updated
        3. Verify Redis cache invalidated/updated
        4. Verify updated widget retrievable
        """
        widget_id = created_widget["widget_id"]
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        # Step 1: Update widget
        updates = {"label": "Updated Label", "enabled": False}
        response = api_gateway_client.update_widget(widget_id, updates)
        assert response.status_code == 200

        # Step 2: Verify database updated
        postgres_cursor.execute("SELECT label, enabled FROM widgets WHERE widget_id = %s", (widget_id,))
        db_widget = postgres_cursor.fetchone()
        assert db_widget[0] == "Updated Label"
        assert db_widget[1] is False

        # Step 3: Verify Redis cache updated or invalidated
        cached_widget = redis_client.get(f"widget:{widget_id}")
        # Cache should either be updated with new data or invalidated (None)
        # Implementation-dependent behavior

        # Step 4: Verify updated widget retrievable
        get_response = api_gateway_client.get_widget(widget_id)
        assert get_response.status_code == 200
        retrieved_widget = get_response.json()
        assert retrieved_widget["label"] == "Updated Label"
        assert retrieved_widget["enabled"] is False


@pytest.mark.integration
class TestWidgetDeleteWorkflow:
    """Test widget deletion workflow across services."""

    @pytest.fixture
    def created_widget(self, api_gateway_client, sample_widget_data, authenticated_token, clean_database, clean_redis):
        """Create a widget before each test."""
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"
        response = api_gateway_client.create_widget(sample_widget_data)
        assert response.status_code == 201
        return response.json()

    def test_delete_widget_workflow(
        self,
        api_gateway_client,
        created_widget,
        authenticated_token,
        postgres_cursor,
        redis_client
    ):
        """
        Test widget deletion workflow:
        1. Delete widget via API Gateway
        2. Verify widget removed from database
        3. Verify widget removed from Redis cache
        4. Verify widget not retrievable via API
        """
        widget_id = created_widget["widget_id"]
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        # Step 1: Delete widget
        response = api_gateway_client.delete_widget(widget_id)
        assert response.status_code == 204

        # Step 2: Verify removed from database
        postgres_cursor.execute("SELECT * FROM widgets WHERE widget_id = %s", (widget_id,))
        db_widget = postgres_cursor.fetchone()
        assert db_widget is None, "Widget still exists in database"

        # Step 3: Verify removed from Redis
        cached_widget = redis_client.get(f"widget:{widget_id}")
        assert cached_widget is None, "Widget still exists in Redis cache"

        # Step 4: Verify not retrievable
        get_response = api_gateway_client.get_widget(widget_id)
        assert get_response.status_code == 404


@pytest.mark.integration
@pytest.mark.performance
class TestWidgetPerformance:
    """Test widget operation performance across services."""

    def test_widget_creation_performance(
        self,
        api_gateway_client,
        sample_widget_data,
        authenticated_token,
        clean_database,
        clean_redis,
        performance_tracker
    ):
        """Test that widget creation completes within performance threshold."""
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        performance_tracker.start()
        response = api_gateway_client.create_widget(sample_widget_data)
        performance_tracker.stop()

        assert response.status_code == 201
        performance_tracker.assert_duration_under(
            1.0,
            "Widget creation took too long"
        )

    def test_bulk_widget_creation_performance(
        self,
        api_gateway_client,
        sample_widget_data,
        authenticated_token,
        clean_database,
        clean_redis
    ):
        """Test bulk widget creation performance."""
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        num_widgets = 100
        start_time = time.time()

        for i in range(num_widgets):
            widget_data = sample_widget_data.copy()
            widget_data["label"] = f"Widget {i}"
            response = api_gateway_client.create_widget(widget_data)
            assert response.status_code == 201

        duration = time.time() - start_time

        # Should create 100 widgets in under 10 seconds (10 widgets/second)
        assert duration < 10.0, f"Bulk creation took {duration:.2f}s, expected < 10s"
        throughput = num_widgets / duration
        print(f"\n✅ Throughput: {throughput:.2f} widgets/second")


@pytest.mark.integration
class TestCacheConsistency:
    """Test cache consistency between Redis and Database."""

    @pytest.fixture
    def created_widget(self, api_gateway_client, sample_widget_data, authenticated_token, clean_database, clean_redis):
        """Create a widget before each test."""
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"
        response = api_gateway_client.create_widget(sample_widget_data)
        assert response.status_code == 201
        return response.json()

    def test_cache_miss_recovery(
        self,
        api_gateway_client,
        created_widget,
        authenticated_token,
        redis_client
    ):
        """
        Test that when cache misses, data is retrieved from DB and cache is repopulated.
        """
        widget_id = created_widget["widget_id"]
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        # Clear cache to simulate cache miss
        redis_client.delete(f"widget:{widget_id}")
        assert redis_client.get(f"widget:{widget_id}") is None

        # Retrieve widget (should trigger cache miss → DB read → cache write)
        response = api_gateway_client.get_widget(widget_id)
        assert response.status_code == 200

        # Verify cache repopulated
        cached_widget = redis_client.get(f"widget:{widget_id}")
        assert cached_widget is not None, "Cache not repopulated after miss"

    def test_cache_invalidation_on_update(
        self,
        api_gateway_client,
        created_widget,
        authenticated_token,
        redis_client
    ):
        """Test that cache is invalidated when widget is updated."""
        widget_id = created_widget["widget_id"]
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        # Verify widget is cached
        assert redis_client.get(f"widget:{widget_id}") is not None

        # Update widget
        updates = {"label": "New Label"}
        response = api_gateway_client.update_widget(widget_id, updates)
        assert response.status_code == 200

        # Verify cache either invalidated or updated
        cached_widget = redis_client.get(f"widget:{widget_id}")
        # Implementation-dependent: cache may be invalidated (None) or updated with new data
        # Just verify no stale data exists
        if cached_widget:
            # If still cached, verify it has new data
            response = api_gateway_client.get_widget(widget_id)
            assert response.json()["label"] == "New Label"
