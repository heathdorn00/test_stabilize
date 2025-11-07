"""
Integration Tests: Security Flow
Task: 57fbde - Comprehensive Test Framework
Layer: 4 - Integration Tests (Security workflows)

Tests authentication and authorization across services:
- User creation and authentication
- Token validation
- Authorization checks
- Security service integration
"""

import pytest
import time


@pytest.mark.integration
@pytest.mark.security
class TestAuthenticationFlow:
    """Test authentication workflows across services."""

    def test_user_registration_and_login(
        self,
        security_service_client,
        sample_user_data,
        clean_database
    ):
        """
        Test complete user registration and login flow:
        1. Create user
        2. Authenticate with credentials
        3. Receive JWT token
        4. Verify token is valid
        """
        # Step 1: Create user
        response = security_service_client.create_user(sample_user_data)
        assert response.status_code in [200, 201]

        user_id = response.json().get("user_id")
        assert user_id is not None

        # Step 2: Authenticate
        auth_response = security_service_client.session.post(
            f"{security_service_client.base_url}/api/v1/auth/login",
            json={
                "username": sample_user_data["username"],
                "password": sample_user_data["password"]
            }
        )
        assert auth_response.status_code == 200

        # Step 3: Receive token
        token = auth_response.json().get("token")
        assert token is not None
        assert len(token) > 0

        # Step 4: Verify token
        verify_response = security_service_client.verify_token(token)
        assert verify_response.status_code == 200
        assert verify_response.json()["valid"] is True

    def test_login_with_invalid_credentials(
        self,
        security_service_client,
        sample_user_data,
        clean_database
    ):
        """Test that login fails with invalid credentials."""
        # Create user first
        security_service_client.create_user(sample_user_data)

        # Attempt login with wrong password
        auth_response = security_service_client.session.post(
            f"{security_service_client.base_url}/api/v1/auth/login",
            json={
                "username": sample_user_data["username"],
                "password": "WrongPassword123!"
            }
        )
        assert auth_response.status_code == 401

    def test_token_expiration(
        self,
        security_service_client,
        sample_user_data,
        clean_database
    ):
        """Test that expired tokens are rejected."""
        # Create user and login
        security_service_client.create_user(sample_user_data)
        auth_response = security_service_client.session.post(
            f"{security_service_client.base_url}/api/v1/auth/login",
            json={
                "username": sample_user_data["username"],
                "password": sample_user_data["password"]
            }
        )
        token = auth_response.json()["token"]

        # Simulate token expiration (implementation-dependent)
        # This test assumes short-lived tokens for testing
        # In production, tokens expire after 1 hour
        time.sleep(2)  # Wait for short-lived test token to expire

        # Verify expired token is rejected
        verify_response = security_service_client.verify_token(token)
        # Depending on implementation, may return 401 or 200 with valid=false
        if verify_response.status_code == 200:
            assert verify_response.json()["valid"] is False
        else:
            assert verify_response.status_code == 401


@pytest.mark.integration
@pytest.mark.security
class TestAuthorizationFlow:
    """Test authorization workflows across services."""

    @pytest.fixture
    def admin_user_data(self):
        """Admin user data."""
        return {
            "username": "admin_user",
            "email": "admin@example.com",
            "password": "AdminPassword123!",
            "role": "admin"
        }

    @pytest.fixture
    def regular_user_token(self, security_service_client, sample_user_data, clean_database):
        """Create regular user and return token."""
        security_service_client.create_user(sample_user_data)
        auth_response = security_service_client.session.post(
            f"{security_service_client.base_url}/api/v1/auth/login",
            json={
                "username": sample_user_data["username"],
                "password": sample_user_data["password"]
            }
        )
        return auth_response.json()["token"]

    @pytest.fixture
    def admin_user_token(self, security_service_client, admin_user_data):
        """Create admin user and return token."""
        security_service_client.create_user(admin_user_data)
        auth_response = security_service_client.session.post(
            f"{security_service_client.base_url}/api/v1/auth/login",
            json={
                "username": admin_user_data["username"],
                "password": admin_user_data["password"]
            }
        )
        return auth_response.json()["token"]

    def test_admin_can_access_admin_endpoints(
        self,
        api_gateway_client,
        admin_user_token
    ):
        """Test that admin users can access admin-only endpoints."""
        api_gateway_client.session.headers["Authorization"] = f"Bearer {admin_user_token}"

        response = api_gateway_client.session.get(
            f"{api_gateway_client.base_url}/api/v1/admin/users"
        )
        assert response.status_code == 200

    def test_regular_user_cannot_access_admin_endpoints(
        self,
        api_gateway_client,
        regular_user_token
    ):
        """Test that regular users cannot access admin-only endpoints."""
        api_gateway_client.session.headers["Authorization"] = f"Bearer {regular_user_token}"

        response = api_gateway_client.session.get(
            f"{api_gateway_client.base_url}/api/v1/admin/users"
        )
        assert response.status_code == 403  # Forbidden

    def test_user_can_only_access_own_resources(
        self,
        api_gateway_client,
        security_service_client,
        sample_user_data,
        regular_user_token,
        sample_widget_data,
        clean_database
    ):
        """Test that users can only access their own resources."""
        api_gateway_client.session.headers["Authorization"] = f"Bearer {regular_user_token}"

        # Create widget as first user
        response = api_gateway_client.create_widget(sample_widget_data)
        assert response.status_code == 201
        widget_id = response.json()["widget_id"]

        # Create second user
        second_user_data = {
            "username": "second_user",
            "email": "second@example.com",
            "password": "SecurePassword456!",
            "role": "user"
        }
        security_service_client.create_user(second_user_data)
        auth_response = security_service_client.session.post(
            f"{security_service_client.base_url}/api/v1/auth/login",
            json={
                "username": second_user_data["username"],
                "password": second_user_data["password"]
            }
        )
        second_user_token = auth_response.json()["token"]

        # Try to access first user's widget as second user
        api_gateway_client.session.headers["Authorization"] = f"Bearer {second_user_token}"
        response = api_gateway_client.get_widget(widget_id)
        assert response.status_code in [403, 404]  # Forbidden or Not Found


@pytest.mark.integration
@pytest.mark.security
class TestSecurityIntegration:
    """Test security service integration with other services."""

    def test_api_gateway_validates_tokens_with_security_service(
        self,
        api_gateway_client,
        security_service_client,
        sample_user_data,
        sample_widget_data,
        clean_database
    ):
        """
        Test that API Gateway validates tokens with Security Service:
        1. User logs in (Security Service issues token)
        2. User makes request to API Gateway with token
        3. API Gateway validates token with Security Service
        4. Request proceeds if valid
        """
        # Step 1: Create user and login
        security_service_client.create_user(sample_user_data)
        auth_response = security_service_client.session.post(
            f"{security_service_client.base_url}/api/v1/auth/login",
            json={
                "username": sample_user_data["username"],
                "password": sample_user_data["password"]
            }
        )
        token = auth_response.json()["token"]

        # Step 2 & 3: Make request with token (API Gateway validates with Security Service)
        api_gateway_client.session.headers["Authorization"] = f"Bearer {token}"
        response = api_gateway_client.create_widget(sample_widget_data)

        # Step 4: Request succeeds
        assert response.status_code == 201

    def test_invalid_token_rejected_by_api_gateway(
        self,
        api_gateway_client,
        sample_widget_data,
        clean_database
    ):
        """Test that invalid tokens are rejected by API Gateway."""
        api_gateway_client.session.headers["Authorization"] = "Bearer invalid_token_12345"

        response = api_gateway_client.create_widget(sample_widget_data)
        assert response.status_code == 401

    def test_missing_token_rejected_by_api_gateway(
        self,
        api_gateway_client,
        sample_widget_data,
        clean_database
    ):
        """Test that requests without tokens are rejected."""
        api_gateway_client.session.headers.pop("Authorization", None)

        response = api_gateway_client.create_widget(sample_widget_data)
        assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.security
class TestAuditLogging:
    """Test audit logging for security-sensitive operations."""

    def test_authentication_attempts_logged(
        self,
        security_service_client,
        sample_user_data,
        postgres_cursor,
        clean_database
    ):
        """Test that authentication attempts are logged."""
        # Create user
        security_service_client.create_user(sample_user_data)

        # Successful login
        security_service_client.session.post(
            f"{security_service_client.base_url}/api/v1/auth/login",
            json={
                "username": sample_user_data["username"],
                "password": sample_user_data["password"]
            }
        )

        # Failed login
        security_service_client.session.post(
            f"{security_service_client.base_url}/api/v1/auth/login",
            json={
                "username": sample_user_data["username"],
                "password": "WrongPassword"
            }
        )

        # Check audit logs
        postgres_cursor.execute(
            "SELECT event_type, success FROM audit_logs WHERE username = %s ORDER BY timestamp",
            (sample_user_data["username"],)
        )
        logs = postgres_cursor.fetchall()

        assert len(logs) >= 2
        assert any(log[0] == "login" and log[1] is True for log in logs)
        assert any(log[0] == "login" and log[1] is False for log in logs)

    def test_widget_operations_logged(
        self,
        api_gateway_client,
        sample_widget_data,
        authenticated_token,
        postgres_cursor,
        clean_database
    ):
        """Test that widget operations are logged."""
        api_gateway_client.session.headers["Authorization"] = f"Bearer {authenticated_token}"

        # Create widget
        response = api_gateway_client.create_widget(sample_widget_data)
        widget_id = response.json()["widget_id"]

        # Update widget
        api_gateway_client.update_widget(widget_id, {"label": "Updated"})

        # Delete widget
        api_gateway_client.delete_widget(widget_id)

        # Check audit logs
        postgres_cursor.execute(
            "SELECT operation FROM audit_logs WHERE resource_id = %s ORDER BY timestamp",
            (widget_id,)
        )
        logs = postgres_cursor.fetchall()

        operations = [log[0] for log in logs]
        assert "create" in operations
        assert "update" in operations
        assert "delete" in operations
