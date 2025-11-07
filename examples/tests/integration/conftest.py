"""
pytest configuration for Layer 4 Integration Tests

Task: 57fbde - Comprehensive Test Framework
Layer: 4 - Integration Tests (15% coverage target)

Fixtures for multi-service testing with real dependencies.
"""

import pytest
import grpc
import psycopg2
import redis
import requests
from typing import Generator
import time
import os


# ============================================================================
# Service Configuration
# ============================================================================

WIDGET_CORE_URL = os.getenv("WIDGET_CORE_URL", "http://localhost:8081")
ORB_CORE_URL = os.getenv("ORB_CORE_URL", "http://localhost:12000")
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://localhost:8080")
SECURITY_SERVICE_URL = os.getenv("SECURITY_SERVICE_URL", "http://localhost:8082")

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "microservices_test")
POSTGRES_USER = os.getenv("POSTGRES_USER", "test_user")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "test_password")

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))


# ============================================================================
# HTTP Client Fixtures
# ============================================================================

@pytest.fixture(scope="session")
def http_session() -> Generator[requests.Session, None, None]:
    """
    HTTP session for API calls.
    Reused across all tests in the session.
    """
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    yield session
    session.close()


@pytest.fixture
def api_gateway_client(http_session):
    """Client for API Gateway service."""
    class APIGatewayClient:
        def __init__(self, session):
            self.session = session
            self.base_url = API_GATEWAY_URL

        def health_check(self):
            return self.session.get(f"{self.base_url}/health")

        def create_widget(self, widget_data):
            return self.session.post(f"{self.base_url}/api/v1/widgets", json=widget_data)

        def get_widget(self, widget_id):
            return self.session.get(f"{self.base_url}/api/v1/widgets/{widget_id}")

        def update_widget(self, widget_id, updates):
            return self.session.patch(f"{self.base_url}/api/v1/widgets/{widget_id}", json=updates)

        def delete_widget(self, widget_id):
            return self.session.delete(f"{self.base_url}/api/v1/widgets/{widget_id}")

        def authenticate(self, credentials):
            return self.session.post(f"{self.base_url}/api/v1/auth/login", json=credentials)

    return APIGatewayClient(http_session)


@pytest.fixture
def widget_core_client(http_session):
    """Client for Widget Core service."""
    class WidgetCoreClient:
        def __init__(self, session):
            self.session = session
            self.base_url = WIDGET_CORE_URL

        def health_check(self):
            return self.session.get(f"{self.base_url}/health")

        def create_widget(self, widget_data):
            return self.session.post(f"{self.base_url}/widgets", json=widget_data)

        def get_widget(self, widget_id):
            return self.session.get(f"{self.base_url}/widgets/{widget_id}")

        def render_widget(self, widget_id):
            return self.session.post(f"{self.base_url}/widgets/{widget_id}/render")

    return WidgetCoreClient(http_session)


@pytest.fixture
def security_service_client(http_session):
    """Client for Security Service."""
    class SecurityServiceClient:
        def __init__(self, session):
            self.session = session
            self.base_url = SECURITY_SERVICE_URL

        def health_check(self):
            return self.session.get(f"{self.base_url}/health")

        def verify_token(self, token):
            return self.session.post(
                f"{self.base_url}/api/v1/verify",
                headers={"Authorization": f"Bearer {token}"}
            )

        def create_user(self, user_data):
            return self.session.post(f"{self.base_url}/api/v1/users", json=user_data)

    return SecurityServiceClient(http_session)


# ============================================================================
# Database Fixtures
# ============================================================================

@pytest.fixture(scope="session")
def postgres_connection():
    """
    PostgreSQL connection for integration tests.
    Shared across session.
    """
    conn = psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )
    yield conn
    conn.close()


@pytest.fixture
def postgres_cursor(postgres_connection):
    """
    PostgreSQL cursor for test queries.
    Rolls back after each test.
    """
    cursor = postgres_connection.cursor()
    yield cursor
    postgres_connection.rollback()
    cursor.close()


@pytest.fixture
def clean_database(postgres_cursor):
    """
    Clean database state before test.
    Truncates all test tables.
    """
    tables = ["widgets", "users", "sessions", "audit_logs"]
    for table in tables:
        try:
            postgres_cursor.execute(f"TRUNCATE TABLE {table} CASCADE")
        except psycopg2.Error:
            pass  # Table might not exist


# ============================================================================
# Redis Fixtures
# ============================================================================

@pytest.fixture(scope="session")
def redis_client():
    """
    Redis client for cache testing.
    Shared across session.
    """
    client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    yield client
    client.close()


@pytest.fixture
def clean_redis(redis_client):
    """
    Clean Redis cache before test.
    Flushes test database.
    """
    redis_client.flushdb()


# ============================================================================
# Service Health Check Fixtures
# ============================================================================

@pytest.fixture(scope="session", autouse=True)
def wait_for_services():
    """
    Wait for all services to be healthy before running tests.
    Auto-used at session start.
    """
    services = {
        "API Gateway": API_GATEWAY_URL,
        "Widget Core": WIDGET_CORE_URL,
        "Security Service": SECURITY_SERVICE_URL,
    }

    max_retries = 30
    retry_delay = 2

    print("\n🔍 Waiting for services to be ready...")

    for service_name, service_url in services.items():
        for attempt in range(max_retries):
            try:
                response = requests.get(f"{service_url}/health", timeout=2)
                if response.status_code == 200:
                    print(f"✅ {service_name} is ready")
                    break
            except requests.RequestException:
                pass

            if attempt == max_retries - 1:
                pytest.fail(f"❌ {service_name} not ready after {max_retries * retry_delay}s")

            time.sleep(retry_delay)

    print("✅ All services ready\n")


# ============================================================================
# Test Data Fixtures
# ============================================================================

@pytest.fixture
def sample_widget_data():
    """Sample widget data for testing."""
    return {
        "type": "button",
        "label": "Test Button",
        "enabled": True,
        "position": {"x": 10, "y": 20},
        "size": {"width": 100, "height": 30}
    }


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "username": "test_user",
        "email": "test@example.com",
        "password": "SecurePassword123!",
        "role": "user"
    }


@pytest.fixture
def authenticated_token(security_service_client, sample_user_data):
    """
    Create user and return authentication token.
    Used for tests requiring authentication.
    """
    # Create user
    response = security_service_client.create_user(sample_user_data)
    assert response.status_code in [200, 201]

    # Authenticate
    auth_response = security_service_client.session.post(
        f"{SECURITY_SERVICE_URL}/api/v1/auth/login",
        json={
            "username": sample_user_data["username"],
            "password": sample_user_data["password"]
        }
    )
    assert auth_response.status_code == 200

    token = auth_response.json()["token"]
    return token


# ============================================================================
# Performance Tracking Fixtures
# ============================================================================

@pytest.fixture
def performance_tracker():
    """
    Track test execution time and validate performance thresholds.
    """
    class PerformanceTracker:
        def __init__(self):
            self.start_time = None
            self.end_time = None

        def start(self):
            self.start_time = time.time()

        def stop(self):
            self.end_time = time.time()

        def duration(self):
            if self.start_time and self.end_time:
                return self.end_time - self.start_time
            return None

        def assert_duration_under(self, max_seconds, message=""):
            duration = self.duration()
            assert duration is not None, "Performance tracking not started/stopped"
            assert duration < max_seconds, \
                f"{message} Took {duration:.2f}s, expected < {max_seconds}s"

    return PerformanceTracker()


# ============================================================================
# Pytest Configuration
# ============================================================================

def pytest_configure(config):
    """Configure pytest markers."""
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "slow: mark test as slow running")
    config.addinivalue_line("markers", "security: mark test as security-related")
    config.addinivalue_line("markers", "performance: mark test as performance-related")


def pytest_collection_modifyitems(config, items):
    """Auto-mark all tests in this directory as integration tests."""
    for item in items:
        if "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
