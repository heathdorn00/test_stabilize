#!/usr/bin/env python3
"""
Performance Baseline Comparison Script
Task: 57fbde - Comprehensive Test Framework / RDB-002
Purpose: Compare current performance against baseline

This script compares performance metrics between baseline and current snapshots,
identifying regressions and improvements.

Usage:
    python baseline_compare.py baselines/baseline.json baselines/current.json
    python baseline_compare.py --baseline baselines/baseline.json --current baselines/current.json --threshold 10
"""

import argparse
import json
from typing import Dict, List, Tuple
from dataclasses import dataclass
from enum import Enum

# ==============================================================================
# Comparison Enums
# ==============================================================================

class ChangeType(Enum):
    IMPROVEMENT = "improvement"
    REGRESSION = "regression"
    NEUTRAL = "neutral"

class Severity(Enum):
    CRITICAL = "critical"    # > 25% regression
    HIGH = "high"            # 15-25% regression
    MEDIUM = "medium"        # 10-15% regression
    LOW = "low"              # 5-10% regression
    NONE = "none"            # < 5% regression

# ==============================================================================
# Comparison Data Classes
# ==============================================================================

@dataclass
class LatencyComparison:
    endpoint: str
    baseline_p95: float
    current_p95: float
    baseline_p99: float
    current_p99: float
    p95_change_pct: float
    p99_change_pct: float
    change_type: ChangeType
    severity: Severity

@dataclass
class ThroughputComparison:
    service: str
    baseline_rps: float
    current_rps: float
    change_pct: float
    change_type: ChangeType
    severity: Severity

@dataclass
class MemoryComparison:
    service: str
    baseline_rss_mb: float
    current_rss_mb: float
    change_pct: float
    change_type: ChangeType
    severity: Severity

@dataclass
class ComparisonReport:
    baseline_timestamp: str
    current_timestamp: str
    latency_comparisons: List[LatencyComparison]
    throughput_comparisons: List[ThroughputComparison]
    memory_comparisons: List[MemoryComparison]
    regressions_count: int
    improvements_count: int
    critical_issues: List[str]

# ==============================================================================
# Baseline Comparison Class
# ==============================================================================

class BaselineComparison:
    """Compare baseline snapshots"""

    def __init__(self, baseline_path: str, current_path: str, threshold: float = 10.0):
        """
        Initialize comparison

        Args:
            baseline_path: Path to baseline snapshot
            current_path: Path to current snapshot
            threshold: Regression threshold percentage (default: 10%)
        """
        self.threshold = threshold

        with open(baseline_path, 'r') as f:
            self.baseline = json.load(f)

        with open(current_path, 'r') as f:
            self.current = json.load(f)

    def compare(self) -> ComparisonReport:
        """Run complete comparison"""
        latency_comparisons = self._compare_latency()
        throughput_comparisons = self._compare_throughput()
        memory_comparisons = self._compare_memory()

        # Count regressions and improvements
        regressions = sum(1 for c in latency_comparisons if c.change_type == ChangeType.REGRESSION)
        regressions += sum(1 for c in throughput_comparisons if c.change_type == ChangeType.REGRESSION)
        regressions += sum(1 for c in memory_comparisons if c.change_type == ChangeType.REGRESSION)

        improvements = sum(1 for c in latency_comparisons if c.change_type == ChangeType.IMPROVEMENT)
        improvements += sum(1 for c in throughput_comparisons if c.change_type == ChangeType.IMPROVEMENT)
        improvements += sum(1 for c in memory_comparisons if c.change_type == ChangeType.IMPROVEMENT)

        # Find critical issues
        critical_issues = []
        for c in latency_comparisons:
            if c.severity in [Severity.CRITICAL, Severity.HIGH]:
                critical_issues.append(
                    f"Latency regression in {c.endpoint}: P95 +{c.p95_change_pct:.1f}%, P99 +{c.p99_change_pct:.1f}%"
                )
        for c in throughput_comparisons:
            if c.severity in [Severity.CRITICAL, Severity.HIGH]:
                critical_issues.append(
                    f"Throughput regression in {c.service}: {c.change_pct:.1f}%"
                )
        for c in memory_comparisons:
            if c.severity in [Severity.CRITICAL, Severity.HIGH]:
                critical_issues.append(
                    f"Memory regression in {c.service}: +{c.change_pct:.1f}%"
                )

        return ComparisonReport(
            baseline_timestamp=self.baseline['timestamp'],
            current_timestamp=self.current['timestamp'],
            latency_comparisons=latency_comparisons,
            throughput_comparisons=throughput_comparisons,
            memory_comparisons=memory_comparisons,
            regressions_count=regressions,
            improvements_count=improvements,
            critical_issues=critical_issues
        )

    def _compare_latency(self) -> List[LatencyComparison]:
        """Compare latency metrics"""
        comparisons = []

        # Build baseline lookup
        baseline_latency = {l['endpoint']: l for l in self.baseline['latency']}

        for current in self.current['latency']:
            endpoint = current['endpoint']

            if endpoint not in baseline_latency:
                continue  # New endpoint, skip comparison

            baseline = baseline_latency[endpoint]

            # Calculate P95/P99 changes
            p95_change_pct = self._calculate_change_pct(baseline['p95'], current['p95'])
            p99_change_pct = self._calculate_change_pct(baseline['p99'], current['p99'])

            # Determine change type and severity (use P95 as primary indicator)
            change_type, severity = self._classify_change(p95_change_pct, is_latency=True)

            comparisons.append(LatencyComparison(
                endpoint=endpoint,
                baseline_p95=baseline['p95'],
                current_p95=current['p95'],
                baseline_p99=baseline['p99'],
                current_p99=current['p99'],
                p95_change_pct=p95_change_pct,
                p99_change_pct=p99_change_pct,
                change_type=change_type,
                severity=severity
            ))

        return comparisons

    def _compare_throughput(self) -> List[ThroughputComparison]:
        """Compare throughput metrics"""
        comparisons = []

        baseline_throughput = {t['service']: t for t in self.baseline['throughput']}

        for current in self.current['throughput']:
            service = current['service']

            if service not in baseline_throughput:
                continue

            baseline = baseline_throughput[service]

            # Calculate change (throughput: higher is better)
            change_pct = self._calculate_change_pct(baseline['requests_per_second'],
                                                      current['requests_per_second'])

            # For throughput: negative change is regression
            change_type, severity = self._classify_change(-change_pct, is_latency=False)

            comparisons.append(ThroughputComparison(
                service=service,
                baseline_rps=baseline['requests_per_second'],
                current_rps=current['requests_per_second'],
                change_pct=change_pct,
                change_type=change_type,
                severity=severity
            ))

        return comparisons

    def _compare_memory(self) -> List[MemoryComparison]:
        """Compare memory metrics"""
        comparisons = []

        baseline_memory = {m['service']: m for m in self.baseline['memory']}

        for current in self.current['memory']:
            service = current['service']

            if service not in baseline_memory:
                continue

            baseline = baseline_memory[service]

            # Calculate change (memory: higher is worse)
            change_pct = self._calculate_change_pct(baseline['rss_mb'], current['rss_mb'])

            change_type, severity = self._classify_change(change_pct, is_latency=False)

            comparisons.append(MemoryComparison(
                service=service,
                baseline_rss_mb=baseline['rss_mb'],
                current_rss_mb=current['rss_mb'],
                change_pct=change_pct,
                change_type=change_type,
                severity=severity
            ))

        return comparisons

    def _calculate_change_pct(self, baseline: float, current: float) -> float:
        """Calculate percentage change"""
        if baseline == 0:
            return 0 if current == 0 else 100

        return ((current - baseline) / baseline) * 100

    def _classify_change(self, change_pct: float, is_latency: bool) -> Tuple[ChangeType, Severity]:
        """
        Classify change as improvement, regression, or neutral

        Args:
            change_pct: Percentage change
            is_latency: True if metric is latency (higher is worse)

        Returns:
            Tuple of (ChangeType, Severity)
        """
        # For latency: positive change is regression
        # For throughput/memory: positive change is regression

        abs_change = abs(change_pct)

        # Determine severity
        if abs_change >= 25:
            severity = Severity.CRITICAL
        elif abs_change >= 15:
            severity = Severity.HIGH
        elif abs_change >= 10:
            severity = Severity.MEDIUM
        elif abs_change >= 5:
            severity = Severity.LOW
        else:
            severity = Severity.NONE

        # Determine change type
        if abs_change < 5:
            change_type = ChangeType.NEUTRAL
        elif change_pct > 0:
            # Positive change
            change_type = ChangeType.REGRESSION
        else:
            # Negative change
            change_type = ChangeType.IMPROVEMENT

        return change_type, severity

# ==============================================================================
# Report Formatting
# ==============================================================================

def print_report(report: ComparisonReport):
    """Print comparison report"""
    print("\n" + "="*80)
    print("PERFORMANCE BASELINE COMPARISON REPORT")
    print("="*80)

    print(f"\nBaseline: {report.baseline_timestamp}")
    print(f"Current:  {report.current_timestamp}")

    print(f"\nSummary:")
    print(f"  Regressions: {report.regressions_count}")
    print(f"  Improvements: {report.improvements_count}")

    if report.critical_issues:
        print(f"\n⚠️  CRITICAL ISSUES ({len(report.critical_issues)}):")
        for issue in report.critical_issues:
            print(f"  • {issue}")

    # Latency comparison
    print("\n" + "-"*80)
    print("LATENCY COMPARISON (P95/P99)")
    print("-"*80)
    print(f"{'Endpoint':<40} {'Baseline P95':>12} {'Current P95':>12} {'Change':>10} {'Status':>12}")
    print("-"*80)

    for comp in report.latency_comparisons:
        status_icon = "⚠️" if comp.change_type == ChangeType.REGRESSION else \
                      "✓" if comp.change_type == ChangeType.IMPROVEMENT else "→"

        print(f"{comp.endpoint:<40} " +
              f"{comp.baseline_p95:>11.2f}ms " +
              f"{comp.current_p95:>11.2f}ms " +
              f"{comp.p95_change_pct:>9.1f}% " +
              f"{status_icon} {comp.change_type.value}")

    # Throughput comparison
    print("\n" + "-"*80)
    print("THROUGHPUT COMPARISON")
    print("-"*80)
    print(f"{'Service':<30} {'Baseline RPS':>15} {'Current RPS':>15} {'Change':>10} {'Status':>12}")
    print("-"*80)

    for comp in report.throughput_comparisons:
        status_icon = "⚠️" if comp.change_type == ChangeType.REGRESSION else \
                      "✓" if comp.change_type == ChangeType.IMPROVEMENT else "→"

        print(f"{comp.service:<30} " +
              f"{comp.baseline_rps:>14.2f} " +
              f"{comp.current_rps:>14.2f} " +
              f"{comp.change_pct:>9.1f}% " +
              f"{status_icon} {comp.change_type.value}")

    # Memory comparison
    print("\n" + "-"*80)
    print("MEMORY COMPARISON (RSS)")
    print("-"*80)
    print(f"{'Service':<30} {'Baseline MB':>15} {'Current MB':>15} {'Change':>10} {'Status':>12}")
    print("-"*80)

    for comp in report.memory_comparisons:
        status_icon = "⚠️" if comp.change_type == ChangeType.REGRESSION else \
                      "✓" if comp.change_type == ChangeType.IMPROVEMENT else "→"

        print(f"{comp.service:<30} " +
              f"{comp.baseline_rss_mb:>14.1f} " +
              f"{comp.current_rss_mb:>14.1f} " +
              f"{comp.change_pct:>9.1f}% " +
              f"{status_icon} {comp.change_type.value}")

    print("="*80)

    # Return exit code based on regressions
    if report.critical_issues:
        print("\n❌ CRITICAL PERFORMANCE REGRESSIONS DETECTED")
        return 1
    elif report.regressions_count > 0:
        print(f"\n⚠️  {report.regressions_count} performance regression(s) detected")
        return 1
    else:
        print("\n✅ NO PERFORMANCE REGRESSIONS DETECTED")
        return 0

# ==============================================================================
# Main
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(description='Compare performance baselines')
    parser.add_argument('--baseline', type=str, required=True,
                        help='Path to baseline snapshot')
    parser.add_argument('--current', type=str, required=True,
                        help='Path to current snapshot')
    parser.add_argument('--threshold', type=float, default=10.0,
                        help='Regression threshold percentage (default: 10.0)')
    parser.add_argument('--output', type=str, default=None,
                        help='Output report to JSON file')
    args = parser.parse_args()

    # Run comparison
    comparison = BaselineComparison(args.baseline, args.current, args.threshold)
    report = comparison.compare()

    # Print report
    exit_code = print_report(report)

    # Save report if requested
    if args.output:
        report_dict = {
            'baseline_timestamp': report.baseline_timestamp,
            'current_timestamp': report.current_timestamp,
            'regressions_count': report.regressions_count,
            'improvements_count': report.improvements_count,
            'critical_issues': report.critical_issues,
            'latency_comparisons': [
                {
                    'endpoint': c.endpoint,
                    'baseline_p95': c.baseline_p95,
                    'current_p95': c.current_p95,
                    'p95_change_pct': c.p95_change_pct,
                    'change_type': c.change_type.value,
                    'severity': c.severity.value,
                }
                for c in report.latency_comparisons
            ],
            'throughput_comparisons': [
                {
                    'service': c.service,
                    'baseline_rps': c.baseline_rps,
                    'current_rps': c.current_rps,
                    'change_pct': c.change_pct,
                    'change_type': c.change_type.value,
                    'severity': c.severity.value,
                }
                for c in report.throughput_comparisons
            ],
            'memory_comparisons': [
                {
                    'service': c.service,
                    'baseline_rss_mb': c.baseline_rss_mb,
                    'current_rss_mb': c.current_rss_mb,
                    'change_pct': c.change_pct,
                    'change_type': c.change_type.value,
                    'severity': c.severity.value,
                }
                for c in report.memory_comparisons
            ],
        }

        with open(args.output, 'w') as f:
            json.dump(report_dict, f, indent=2)

        print(f"\n✓ Report saved to {args.output}")

    return exit_code

if __name__ == '__main__':
    exit(main())
