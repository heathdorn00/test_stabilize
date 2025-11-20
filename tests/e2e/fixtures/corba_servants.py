"""
CORBA Test Fixtures
E2E Phase 1: Test data for CORBA request-response scenarios
"""

from typing import Dict, Any

# Echo Servant - Simple request-response test
ECHO_SERVANT = {
    "name": "EchoServant",
    "interface": "IDL:Echo:1.0",
    "methods": ["echo", "reverse", "uppercase"],
    "ior": "IOR:010000001700000049444c3a4563686f3a312e3000000000010000000000000068000000010102000f0000003139322e3136382e312e313030001b3a0000001c000000000000001a00000000000000010000000000000001000000010000002000000000000000020000000100000020000000000000000100000001000001000000000000000001000000",
    "endpoint": "corbaname::orb-core:2809/Echo",
    "description": "Simple echo servant for smoke testing"
}

# Calculator Servant - Numeric operations test
CALCULATOR_SERVANT = {
    "name": "CalculatorServant",
    "interface": "IDL:Calculator:1.0",
    "methods": ["add", "subtract", "multiply", "divide"],
    "ior": "IOR:010000001d00000049444c3a43616c63756c61746f723a312e3000000001000000000000006c000000010102000f0000003139322e3136382e312e313030001b3b0000001f000000000000001a00000000000000010000000000000001000000010000002000000000000000020000000100000020000000000000000100000001000001000000000000000001000000",
    "endpoint": "corbaname::orb-core:2809/Calculator",
    "description": "Calculator servant for numeric operations"
}

# Lifecycle Servant - Connection/disconnection test
LIFECYCLE_SERVANT = {
    "name": "LifecycleServant",
    "interface": "IDL:Lifecycle:1.0",
    "methods": ["connect", "disconnect", "heartbeat"],
    "ior": "IOR:010000001b00000049444c3a4c6966656379636c653a312e3000000000010000000000000070000000010102000f0000003139322e3136382e312e313030001b3d0000002100000000000000",
    "endpoint": "corbaname::orb-core:2809/Lifecycle",
    "description": "Lifecycle servant for connection management"
}

# Test data for echo operations
ECHO_TEST_DATA = [
    {
        "method": "echo",
        "input": "Hello CORBA",
        "expected": "Hello CORBA",
        "description": "Basic echo test"
    },
    {
        "method": "reverse",
        "input": "PolyORB",
        "expected": "BROyloP",
        "description": "String reversal test"
    },
    {
        "method": "uppercase",
        "input": "polyorb",
        "expected": "POLYORB",
        "description": "String uppercase test"
    }
]

# Test data for calculator operations
CALCULATOR_TEST_DATA = [
    {
        "method": "add",
        "a": 10,
        "b": 5,
        "expected": 15,
        "description": "Addition test"
    },
    {
        "method": "subtract",
        "a": 10,
        "b": 5,
        "expected": 5,
        "description": "Subtraction test"
    },
    {
        "method": "multiply",
        "a": 10,
        "b": 5,
        "expected": 50,
        "description": "Multiplication test"
    },
    {
        "method": "divide",
        "a": 10,
        "b": 5,
        "expected": 2,
        "description": "Division test"
    }
]

# Performance thresholds for E2E tests
PERFORMANCE_THRESHOLDS = {
    "echo_latency_ms": 100,  # Max latency for echo operation
    "calculator_latency_ms": 200,  # Max latency for calculator operation
    "connection_timeout_ms": 5000,  # Max time to establish connection
    "heartbeat_interval_ms": 1000,  # Heartbeat check interval
}

# Health check configuration
HEALTH_CHECK_CONFIG = {
    "interval_seconds": 5,
    "timeout_seconds": 3,
    "retries": 3,
    "command": "polyorb-healthcheck"
}

def get_servant_by_name(name: str) -> Dict[str, Any]:
    """Get servant configuration by name."""
    servants = {
        "Echo": ECHO_SERVANT,
        "Calculator": CALCULATOR_SERVANT,
        "Lifecycle": LIFECYCLE_SERVANT
    }
    return servants.get(name, {})

def get_test_data_for_servant(name: str) -> list:
    """Get test data for a specific servant."""
    test_data = {
        "Echo": ECHO_TEST_DATA,
        "Calculator": CALCULATOR_TEST_DATA
    }
    return test_data.get(name, [])
