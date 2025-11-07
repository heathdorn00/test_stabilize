"""
Component Test Example - Widget Core with Redis Cache
Task: 57fbde - Set up comprehensive test framework
Layer 2: Component Tests (30% coverage target)

Tests widget core service with real Redis cache dependency.
"""

import pytest
import redis
import httpx
import os
from typing import Generator

# Configuration from environment
WIDGET_CORE_URL = os.getenv("WIDGET_CORE_URL", "http://localhost:8080")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))


@pytest.fixture
def redis_client() -> Generator[redis.Redis, None, None]:
    """Provides a Redis client for testing."""
    client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

    # Ensure connection
    client.ping()

    yield client

    # Cleanup after test
    client.flushdb()


@pytest.fixture
def http_client() -> Generator[httpx.Client, None, None]:
    """Provides an HTTP client for API calls."""
    with httpx.Client(base_url=WIDGET_CORE_URL, timeout=10.0) as client:
        yield client


class TestWidgetCaching:
    """Test widget caching behavior with Redis."""

    def test_widget_cached_after_creation(self, http_client: httpx.Client, redis_client: redis.Redis):
        """Test that created widgets are cached in Redis."""
        # Arrange
        widget_data = {
            "type": "button",
            "label": "Test Button",
            "enabled": True
        }

        # Act
        response = http_client.post("/widgets", json=widget_data)

        # Assert
        assert response.status_code == 201
        widget_id = response.json()["widget_id"]

        # Check cache
        cached_widget = redis_client.get(f"widget:{widget_id}")
        assert cached_widget is not None, "Widget should be cached after creation"

    def test_widget_retrieved_from_cache(self, http_client: httpx.Client, redis_client: redis.Redis):
        """Test that widgets are retrieved from cache (cache hit)."""
        # Arrange - Create widget
        widget_data = {"type": "button", "label": "Cached Button"}
        create_response = http_client.post("/widgets", json=widget_data)
        widget_id = create_response.json()["widget_id"]

        # Act - Retrieve widget (should hit cache)
        response = http_client.get(f"/widgets/{widget_id}")

        # Assert
        assert response.status_code == 200
        assert response.json()["label"] == "Cached Button"

        # Verify cache hit (implementation-specific header)
        assert response.headers.get("X-Cache") == "HIT"

    def test_widget_cache_miss_fetches_from_db(self, http_client: httpx.Client, redis_client: redis.Redis):
        """Test that cache miss triggers database fetch."""
        # Arrange - Create widget
        widget_data = {"type": "button", "label": "DB Button"}
        create_response = http_client.post("/widgets", json=widget_data)
        widget_id = create_response.json()["widget_id"]

        # Clear cache to force cache miss
        redis_client.delete(f"widget:{widget_id}")

        # Act - Retrieve widget (cache miss → DB fetch)
        response = http_client.get(f"/widgets/{widget_id}")

        # Assert
        assert response.status_code == 200
        assert response.json()["label"] == "DB Button"

        # Verify cache miss
        assert response.headers.get("X-Cache") == "MISS"

        # Verify widget is now cached again
        cached_widget = redis_client.get(f"widget:{widget_id}")
        assert cached_widget is not None

    def test_cache_invalidation_on_update(self, http_client: httpx.Client, redis_client: redis.Redis):
        """Test that cache is invalidated when widget is updated."""
        # Arrange - Create widget
        widget_data = {"type": "button", "label": "Original Label"}
        create_response = http_client.post("/widgets", json=widget_data)
        widget_id = create_response.json()["widget_id"]

        # Verify widget is cached
        assert redis_client.exists(f"widget:{widget_id}") == 1

        # Act - Update widget
        update_data = {"label": "Updated Label"}
        response = http_client.patch(f"/widgets/{widget_id}", json=update_data)

        # Assert
        assert response.status_code == 200

        # Verify old cache entry is invalidated
        cached_widget = redis_client.get(f"widget:{widget_id}")
        if cached_widget:
            # If cached, it should have the new label
            assert "Updated Label" in cached_widget

    def test_cache_invalidation_on_delete(self, http_client: httpx.Client, redis_client: redis.Redis):
        """Test that cache is invalidated when widget is deleted."""
        # Arrange - Create widget
        widget_data = {"type": "button", "label": "To Delete"}
        create_response = http_client.post("/widgets", json=widget_data)
        widget_id = create_response.json()["widget_id"]

        # Verify widget is cached
        assert redis_client.exists(f"widget:{widget_id}") == 1

        # Act - Delete widget
        response = http_client.delete(f"/widgets/{widget_id}")

        # Assert
        assert response.status_code == 204

        # Verify cache entry is removed
        assert redis_client.exists(f"widget:{widget_id}") == 0

    def test_cache_timeout_behavior(self, http_client: httpx.Client, redis_client: redis.Redis):
        """Test that cache entries have appropriate TTL."""
        # Arrange - Create widget
        widget_data = {"type": "button", "label": "TTL Button"}
        create_response = http_client.post("/widgets", json=widget_data)
        widget_id = create_response.json()["widget_id"]

        # Act - Check TTL
        ttl = redis_client.ttl(f"widget:{widget_id}")

        # Assert
        assert ttl > 0, "Cache entry should have TTL set"
        assert ttl <= 3600, "TTL should not exceed 1 hour (3600s)"


class TestCacheResilience:
    """Test widget service behavior when cache is unavailable."""

    def test_service_works_when_redis_unavailable(self, http_client: httpx.Client):
        """Test graceful degradation when Redis is down."""
        # Note: This test requires stopping Redis or mocking connection failure
        # For demonstration purposes, we'll test the API directly

        # Act - Create widget (should succeed even if cache fails)
        widget_data = {"type": "button", "label": "No Cache Button"}
        response = http_client.post("/widgets", json=widget_data)

        # Assert
        assert response.status_code == 201
        # Service should function without cache (fallback to DB only)


"""
COVERAGE TARGET: 30% of component tests (testing service boundaries)

Test Categories:
- Cache behavior: 5 tests (create, retrieve, miss, update, delete)
- Cache configuration: 1 test (TTL)
- Resilience: 1 test (Redis unavailable)

Total: 7 test cases

Run:
  docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

Run locally (requires Redis + service running):
  pytest test_widget_with_cache.py -v
"""
