"""
Docker Helper Utilities
E2E Phase 1: Docker Compose service management for E2E tests
"""

import subprocess
import time
import requests
from typing import Dict, List, Optional


class DockerComposeHelper:
    """Helper class for managing Docker Compose services in E2E tests."""

    def __init__(self, compose_file: str = "docker-compose.e2e.yml"):
        self.compose_file = compose_file
        self.base_cmd = ["docker-compose", "-f", self.compose_file]

    def up(self, services: Optional[List[str]] = None, detach: bool = True) -> subprocess.CompletedProcess:
        """Start Docker Compose services."""
        cmd = self.base_cmd + ["up"]
        if detach:
            cmd.append("-d")
        if services:
            cmd.extend(services)

        return subprocess.run(cmd, capture_output=True, text=True)

    def down(self, volumes: bool = False) -> subprocess.CompletedProcess:
        """Stop and remove Docker Compose services."""
        cmd = self.base_cmd + ["down"]
        if volumes:
            cmd.append("-v")

        return subprocess.run(cmd, capture_output=True, text=True)

    def logs(self, service: str, tail: int = 50) -> str:
        """Get logs from a specific service."""
        cmd = self.base_cmd + ["logs", "--tail", str(tail), service]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.stdout

    def exec(self, service: str, command: List[str]) -> subprocess.CompletedProcess:
        """Execute a command in a running service container."""
        cmd = self.base_cmd + ["exec", "-T", service] + command
        return subprocess.run(cmd, capture_output=True, text=True)

    def ps(self) -> List[Dict[str, str]]:
        """Get status of all services."""
        cmd = self.base_cmd + ["ps", "--format", "json"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            return []

        import json
        try:
            services = json.loads(result.stdout)
            return services if isinstance(services, list) else [services]
        except json.JSONDecodeError:
            return []

    def wait_for_health(
        self,
        service: str,
        timeout: int = 30,
        interval: int = 2
    ) -> bool:
        """Wait for a service to become healthy."""
        start_time = time.time()

        while time.time() - start_time < timeout:
            services = self.ps()
            for svc in services:
                if svc.get("Service") == service:
                    status = svc.get("Status", "")
                    if "healthy" in status.lower():
                        return True
                    if "unhealthy" in status.lower():
                        print(f"Service {service} is unhealthy: {status}")
                        return False

            time.sleep(interval)

        print(f"Timeout waiting for {service} to become healthy")
        return False

    def wait_for_http(
        self,
        url: str,
        timeout: int = 30,
        interval: int = 2
    ) -> bool:
        """Wait for an HTTP endpoint to become available."""
        start_time = time.time()

        while time.time() - start_time < timeout:
            try:
                response = requests.get(url, timeout=5)
                if response.status_code < 500:  # Accept any non-5xx response
                    return True
            except requests.exceptions.RequestException:
                pass

            time.sleep(interval)

        print(f"Timeout waiting for {url} to become available")
        return False


def wait_for_port(host: str, port: int, timeout: int = 30) -> bool:
    """Wait for a TCP port to become available."""
    import socket
    start_time = time.time()

    while time.time() - start_time < timeout:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((host, port))
            sock.close()

            if result == 0:
                return True
        except socket.error:
            pass

        time.sleep(1)

    print(f"Timeout waiting for {host}:{port} to become available")
    return False


def get_container_logs(container_name: str, tail: int = 50) -> str:
    """Get logs from a Docker container by name."""
    cmd = ["docker", "logs", "--tail", str(tail), container_name]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout


def cleanup_containers(prefix: str = "e2e_"):
    """Clean up all containers with a specific prefix."""
    # List containers
    cmd = ["docker", "ps", "-a", "--filter", f"name={prefix}", "--format", "{{.Names}}"]
    result = subprocess.run(cmd, capture_output=True, text=True)

    containers = result.stdout.strip().split("\n")
    containers = [c for c in containers if c]  # Remove empty strings

    if not containers:
        return

    # Stop and remove containers
    subprocess.run(["docker", "stop"] + containers, capture_output=True)
    subprocess.run(["docker", "rm"] + containers, capture_output=True)


def cleanup_networks(prefix: str = "e2e_"):
    """Clean up all networks with a specific prefix."""
    cmd = ["docker", "network", "ls", "--filter", f"name={prefix}", "--format", "{{.Name}}"]
    result = subprocess.run(cmd, capture_output=True, text=True)

    networks = result.stdout.strip().split("\n")
    networks = [n for n in networks if n and n != "bridge"]  # Keep default bridge

    for network in networks:
        subprocess.run(["docker", "network", "rm", network], capture_output=True)
