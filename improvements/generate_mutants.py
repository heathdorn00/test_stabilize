#!/usr/bin/env python3
"""
Ada Mutation Testing Script for PolyORB
Generates mutants for polyorb-any memory management testing

Author: @test_stabilize
Date: 2025-11-07 (Day 3)
Context: RDB-004 Task 6 Pre-Work - Mutation Testing Baseline
"""

import re
import os
import sys
import subprocess
import json
from typing import List, Tuple, Dict
from pathlib import Path
import hashlib


class MutationOperator:
    """Base class for mutation operators"""

    def __init__(self, name: str, category: str, priority: str):
        self.name = name
        self.category = category
        self.priority = priority  # CRITICAL, HIGH, MEDIUM, LOW

    def apply(self, source: str) -> List[Tuple[str, str, int]]:
        """
        Apply mutation operator to source code

        Returns: List of (mutant_source, description, line_number)
        """
        raise NotImplementedError


class ArithmeticMutationOperator(MutationOperator):
    """Mutate arithmetic operators: +, -, *, /"""

    def __init__(self):
        super().__init__("Arithmetic", "arithmetic", "MEDIUM")
        self.mutations = [
            (r'(\s+)\+(\s+)', r'\1-\2', '+ → -'),
            (r'(\s+)-(\s+)', r'\1+\2', '- → +'),
            (r'(\s+)\*(\s+)', r'\1/\2', '* → /'),
            (r'(\s+)/(\s+)', r'\1*\2', '/ → *'),
        ]

    def apply(self, source: str) -> List[Tuple[str, str, int]]:
        mutants = []
        lines = source.split('\n')

        for line_num, line in enumerate(lines, 1):
            for pattern, replacement, desc in self.mutations:
                if re.search(pattern, line):
                    mutated_lines = lines.copy()
                    mutated_lines[line_num - 1] = re.sub(
                        pattern, replacement, line, count=1
                    )
                    mutant_source = '\n'.join(mutated_lines)
                    mutants.append((
                        mutant_source,
                        f"Line {line_num}: {desc}",
                        line_num
                    ))

        return mutants


class RelationalMutationOperator(MutationOperator):
    """Mutate relational operators: >, >=, <, <=, =, /="""

    def __init__(self):
        super().__init__("Relational", "relational", "HIGH")
        self.mutations = [
            (r'(\s+)>(\s+)', r'\1>=\2', '> → >='),
            (r'(\s+)>=(\s+)', r'\1>\2', '>= → >'),
            (r'(\s+)<(\s+)', r'\1<=\2', '< → <='),
            (r'(\s+)<=(\s+)', r'\1<\2', '<= → <'),
            (r'(\s+)=(\s+)', r'\1/=\2', '= → /='),
            (r'(\s+)/=(\s+)', r'\1=\2', '/= → ='),
        ]

    def apply(self, source: str) -> List[Tuple[str, str, int]]:
        mutants = []
        lines = source.split('\n')

        for line_num, line in enumerate(lines, 1):
            # Skip variable assignments (use context)
            if ':=' in line:
                continue

            for pattern, replacement, desc in self.mutations:
                if re.search(pattern, line):
                    mutated_lines = lines.copy()
                    mutated_lines[line_num - 1] = re.sub(
                        pattern, replacement, line, count=1
                    )
                    mutant_source = '\n'.join(mutated_lines)
                    mutants.append((
                        mutant_source,
                        f"Line {line_num}: {desc}",
                        line_num
                    ))

        return mutants


class LogicalMutationOperator(MutationOperator):
    """Mutate logical operators: and, or, not"""

    def __init__(self):
        super().__init__("Logical", "logical", "HIGH")
        self.mutations = [
            (r'\band\b', 'or', 'and → or'),
            (r'\bor\b', 'and', 'or → and'),
            (r'\bnot\b', '', 'not → (removed)'),
        ]

    def apply(self, source: str) -> List[Tuple[str, str, int]]:
        mutants = []
        lines = source.split('\n')

        for line_num, line in enumerate(lines, 1):
            for pattern, replacement, desc in self.mutations:
                if re.search(pattern, line):
                    mutated_lines = lines.copy()
                    mutated_lines[line_num - 1] = re.sub(
                        pattern, replacement, line, count=1
                    )
                    mutant_source = '\n'.join(mutated_lines)
                    mutants.append((
                        mutant_source,
                        f"Line {line_num}: {desc}",
                        line_num
                    ))

        return mutants


class AdaAttributeMutationOperator(MutationOperator):
    """Mutate Ada attributes: 'First, 'Last, 'Length"""

    def __init__(self):
        super().__init__("Ada Attribute", "ada_attribute", "MEDIUM")
        self.mutations = [
            (r"'First\b", "'Last", "'First → 'Last"),
            (r"'Last\b", "'First", "'Last → 'First"),
            (r"'Length\b", "'Length - 1", "'Length → 'Length - 1"),
        ]

    def apply(self, source: str) -> List[Tuple[str, str, int]]:
        mutants = []
        lines = source.split('\n')

        for line_num, line in enumerate(lines, 1):
            for pattern, replacement, desc in self.mutations:
                if re.search(pattern, line):
                    mutated_lines = lines.copy()
                    mutated_lines[line_num - 1] = re.sub(
                        pattern, replacement, line, count=1
                    )
                    mutant_source = '\n'.join(mutated_lines)
                    mutants.append((
                        mutant_source,
                        f"Line {line_num}: {desc}",
                        line_num
                    ))

        return mutants


class MemoryManagementMutationOperator(MutationOperator):
    """Mutate memory management operations: Deallocate, new, null"""

    def __init__(self):
        super().__init__("Memory Management", "memory", "CRITICAL")

    def apply(self, source: str) -> List[Tuple[str, str, int]]:
        mutants = []
        lines = source.split('\n')

        for line_num, line in enumerate(lines, 1):
            # Mutation 1: Comment out Deallocate calls
            if re.search(r'\bDeallocate\s*\(', line):
                mutated_lines = lines.copy()
                mutated_lines[line_num - 1] = '      -- ' + line + '  -- MUTANT: Skip deallocation'
                mutant_source = '\n'.join(mutated_lines)
                mutants.append((
                    mutant_source,
                    f"Line {line_num}: Deallocate → (removed) [MEMORY LEAK]",
                    line_num
                ))

            # Mutation 2: new → null
            if re.search(r'\bnew\s+\w+', line):
                mutated_lines = lines.copy()
                mutated_lines[line_num - 1] = re.sub(
                    r'\bnew\s+\w+', 'null  -- MUTANT', line, count=1
                )
                mutant_source = '\n'.join(mutated_lines)
                mutants.append((
                    mutant_source,
                    f"Line {line_num}: new T → null [NULL POINTER]",
                    line_num
                ))

        return mutants


class ReferenceCountingMutationOperator(MutationOperator):
    """Mutate reference counting: +1, -1"""

    def __init__(self):
        super().__init__("Reference Counting", "ref_count", "CRITICAL")

    def apply(self, source: str) -> List[Tuple[str, str, int]]:
        mutants = []
        lines = source.split('\n')

        for line_num, line in enumerate(lines, 1):
            # Mutation 1: +1 → +2 (off-by-one)
            if re.search(r'Ref_Count.*\+\s*1', line):
                mutated_lines = lines.copy()
                mutated_lines[line_num - 1] = re.sub(
                    r'\+\s*1', '+ 2  -- MUTANT', line, count=1
                )
                mutant_source = '\n'.join(mutated_lines)
                mutants.append((
                    mutant_source,
                    f"Line {line_num}: +1 → +2 [REF COUNT ERROR]",
                    line_num
                ))

            # Mutation 2: -1 → -2 (off-by-one)
            if re.search(r'Ref_Count.*-\s*1', line):
                mutated_lines = lines.copy()
                mutated_lines[line_num - 1] = re.sub(
                    r'-\s*1', '- 2  -- MUTANT', line, count=1
                )
                mutant_source = '\n'.join(mutated_lines)
                mutants.append((
                    mutant_source,
                    f"Line {line_num}: -1 → -2 [REF COUNT ERROR]",
                    line_num
                ))

            # Mutation 3: Comment out ref count updates
            if re.search(r'Ref_Count\s*:=', line):
                mutated_lines = lines.copy()
                mutated_lines[line_num - 1] = '      -- ' + line + '  -- MUTANT: Skip ref count'
                mutant_source = '\n'.join(mutated_lines)
                mutants.append((
                    mutant_source,
                    f"Line {line_num}: Ref_Count update → (removed)",
                    line_num
                ))

        return mutants


class ExceptionMutationOperator(MutationOperator):
    """Mutate exception handling: raise, exception handlers"""

    def __init__(self):
        super().__init__("Exception", "exception", "HIGH")

    def apply(self, source: str) -> List[Tuple[str, str, int]]:
        mutants = []
        lines = source.split('\n')

        for line_num, line in enumerate(lines, 1):
            # Mutation 1: Comment out raise statements
            if re.search(r'\braise\s+\w+', line):
                mutated_lines = lines.copy()
                mutated_lines[line_num - 1] = '      -- ' + line + '  -- MUTANT: Exception suppressed'
                mutant_source = '\n'.join(mutated_lines)
                mutants.append((
                    mutant_source,
                    f"Line {line_num}: raise → (removed) [ERROR MASKING]",
                    line_num
                ))

            # Mutation 2: Change exception type
            if 'raise Constraint_Error' in line:
                mutated_lines = lines.copy()
                mutated_lines[line_num - 1] = line.replace(
                    'Constraint_Error', 'Program_Error  -- MUTANT'
                )
                mutant_source = '\n'.join(mutated_lines)
                mutants.append((
                    mutant_source,
                    f"Line {line_num}: Constraint_Error → Program_Error",
                    line_num
                ))

        return mutants


class ConstantMutationOperator(MutationOperator):
    """Mutate constants: 0, 1, null"""

    def __init__(self):
        super().__init__("Constant", "constant", "MEDIUM")

    def apply(self, source: str) -> List[Tuple[str, str, int]]:
        mutants = []
        lines = source.split('\n')

        for line_num, line in enumerate(lines, 1):
            # Mutation 1: 0 → 1
            if re.search(r'[=<>]\s*0\b', line):
                mutated_lines = lines.copy()
                mutated_lines[line_num - 1] = re.sub(
                    r'([=<>]\s*)0\b', r'\g<1>1  -- MUTANT', line, count=1
                )
                mutant_source = '\n'.join(mutated_lines)
                mutants.append((
                    mutant_source,
                    f"Line {line_num}: 0 → 1",
                    line_num
                ))

            # Mutation 2: 1 → 0
            if re.search(r'[=<>]\s*1\b', line):
                mutated_lines = lines.copy()
                mutated_lines[line_num - 1] = re.sub(
                    r'([=<>]\s*)1\b', r'\g<1>0  -- MUTANT', line, count=1
                )
                mutant_source = '\n'.join(mutated_lines)
                mutants.append((
                    mutant_source,
                    f"Line {line_num}: 1 → 0",
                    line_num
                ))

        return mutants


class MutationTester:
    """Main mutation testing engine"""

    def __init__(self, source_file: str, output_dir: str = "mutants"):
        self.source_file = Path(source_file)
        self.output_dir = Path(output_dir)
        self.operators: List[MutationOperator] = [
            MemoryManagementMutationOperator(),
            ReferenceCountingMutationOperator(),
            ExceptionMutationOperator(),
            RelationalMutationOperator(),
            LogicalMutationOperator(),
            AdaAttributeMutationOperator(),
            ArithmeticMutationOperator(),
            ConstantMutationOperator(),
        ]
        self.results = []

    def load_source(self) -> str:
        """Load source file"""
        with open(self.source_file, 'r', encoding='utf-8') as f:
            return f.read()

    def generate_mutants(self) -> List[Dict]:
        """Generate all mutants"""
        source = self.load_source()
        mutants = []
        mutant_id = 1

        for operator in self.operators:
            operator_mutants = operator.apply(source)
            for mutant_source, description, line_num in operator_mutants:
                # Generate unique hash for mutant
                mutant_hash = hashlib.md5(mutant_source.encode()).hexdigest()[:8]

                mutants.append({
                    'id': mutant_id,
                    'hash': mutant_hash,
                    'operator': operator.name,
                    'category': operator.category,
                    'priority': operator.priority,
                    'description': description,
                    'line_number': line_num,
                    'source': mutant_source,
                })
                mutant_id += 1

        return mutants

    def save_mutants(self, mutants: List[Dict]):
        """Save mutants to disk"""
        self.output_dir.mkdir(exist_ok=True)

        for mutant in mutants:
            mutant_file = self.output_dir / f"mutant_{mutant['id']:03d}_{mutant['hash']}.adb"
            with open(mutant_file, 'w', encoding='utf-8') as f:
                f.write(mutant['source'])

        # Save mutant metadata
        metadata_file = self.output_dir / "mutants_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump([
                {k: v for k, v in m.items() if k != 'source'}
                for m in mutants
            ], f, indent=2)

    def compile_mutant(self, mutant_file: Path, build_dir: Path) -> Tuple[bool, str]:
        """
        Compile a mutant

        Returns: (success, error_message)
        """
        try:
            result = subprocess.run(
                ['gprbuild', '-Ptest_polyorb.gpr'],
                cwd=build_dir,
                capture_output=True,
                text=True,
                timeout=60
            )
            return result.returncode == 0, result.stderr
        except subprocess.TimeoutExpired:
            return False, "Compilation timeout"
        except Exception as e:
            return False, str(e)

    def run_tests(self, build_dir: Path) -> Tuple[bool, str]:
        """
        Run test suite

        Returns: (all_passed, output)
        """
        try:
            result = subprocess.run(
                ['./test_runner'],
                cwd=build_dir,
                capture_output=True,
                text=True,
                timeout=120
            )
            return result.returncode == 0, result.stdout
        except subprocess.TimeoutExpired:
            return False, "Test timeout"
        except Exception as e:
            return False, str(e)

    def test_mutant(self, mutant: Dict, build_dir: Path) -> str:
        """
        Test a single mutant

        Returns: 'KILLED', 'SURVIVED', 'COMPILE_ERROR', 'TIMEOUT'
        """
        # Copy mutant to source location
        mutant_file = self.output_dir / f"mutant_{mutant['id']:03d}_{mutant['hash']}.adb"
        original_source = build_dir / self.source_file.name
        backup_source = build_dir / f"{self.source_file.name}.backup"

        try:
            # Backup original
            if original_source.exists():
                import shutil
                shutil.copy2(original_source, backup_source)

            # Copy mutant
            import shutil
            shutil.copy2(mutant_file, original_source)

            # Compile
            compile_success, compile_error = self.compile_mutant(mutant_file, build_dir)
            if not compile_success:
                return 'COMPILE_ERROR'

            # Test
            tests_passed, test_output = self.run_tests(build_dir)

            return 'SURVIVED' if tests_passed else 'KILLED'

        finally:
            # Restore original
            if backup_source.exists():
                import shutil
                shutil.copy2(backup_source, original_source)
                backup_source.unlink()

    def run_mutation_testing(self, build_dir: str = None, max_mutants: int = None):
        """Run full mutation testing"""
        print("=" * 80)
        print("Ada Mutation Testing for PolyORB")
        print("=" * 80)

        # Generate mutants
        print(f"\n[1/4] Generating mutants from {self.source_file}...")
        mutants = self.generate_mutants()

        if max_mutants:
            mutants = mutants[:max_mutants]

        print(f"      Generated {len(mutants)} mutants")

        # Save mutants
        print(f"\n[2/4] Saving mutants to {self.output_dir}...")
        self.save_mutants(mutants)
        print(f"      Saved {len(mutants)} mutant files")

        # Summary by category
        print("\n[3/4] Mutant Distribution:")
        category_counts = {}
        for mutant in mutants:
            cat = mutant['category']
            category_counts[cat] = category_counts.get(cat, 0) + 1

        for category, count in sorted(category_counts.items()):
            print(f"      {category:20s}: {count:3d} mutants")

        # Testing (if build directory provided)
        if build_dir:
            print(f"\n[4/4] Testing mutants against test suite...")
            build_path = Path(build_dir)

            for mutant in mutants:
                status = self.test_mutant(mutant, build_path)
                mutant['status'] = status
                self.results.append(mutant)

                symbol = {
                    'KILLED': '✓',
                    'SURVIVED': '✗',
                    'COMPILE_ERROR': '⚠',
                    'TIMEOUT': '⏱'
                }[status]

                print(f"      Mutant {mutant['id']:3d} [{mutant['category']:12s}] {symbol} {status:15s} - {mutant['description']}")

            self.print_summary()
        else:
            print(f"\n[4/4] Skipping testing (no build directory provided)")

    def print_summary(self):
        """Print mutation testing summary"""
        if not self.results:
            return

        killed = sum(1 for r in self.results if r['status'] == 'KILLED')
        survived = sum(1 for r in self.results if r['status'] == 'SURVIVED')
        compile_errors = sum(1 for r in self.results if r['status'] == 'COMPILE_ERROR')
        timeouts = sum(1 for r in self.results if r['status'] == 'TIMEOUT')

        total_valid = killed + survived
        mutation_score = (killed / total_valid * 100) if total_valid > 0 else 0

        print("\n" + "=" * 80)
        print("MUTATION TESTING SUMMARY")
        print("=" * 80)
        print(f"Total Mutants:       {len(self.results)}")
        print(f"Killed:              {killed:3d} ({killed/len(self.results)*100:.1f}%)")
        print(f"Survived:            {survived:3d} ({survived/len(self.results)*100:.1f}%) ⚠️")
        print(f"Compile Errors:      {compile_errors:3d}")
        print(f"Timeouts:            {timeouts:3d}")
        print(f"\n{'='*80}")
        print(f"MUTATION SCORE:      {mutation_score:.1f}% ({killed}/{total_valid})")
        print(f"{'='*80}\n")

        # Surviving mutants
        surviving = [r for r in self.results if r['status'] == 'SURVIVED']
        if surviving:
            print("\n⚠️  SURVIVING MUTANTS (Test Quality Gaps):")
            for mutant in surviving:
                print(f"   Mutant {mutant['id']:3d}: {mutant['description']}")
                print(f"              Category: {mutant['category']}, Priority: {mutant['priority']}")

        # Save detailed report
        report_file = self.output_dir / "mutation_report.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, default=str)

        print(f"\nDetailed report saved to: {report_file}")


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Ada Mutation Testing for PolyORB'
    )
    parser.add_argument(
        'source_file',
        help='Ada source file to mutate'
    )
    parser.add_argument(
        '-o', '--output',
        default='mutants',
        help='Output directory for mutants (default: mutants)'
    )
    parser.add_argument(
        '-b', '--build-dir',
        help='Build directory for compilation and testing (optional)'
    )
    parser.add_argument(
        '-n', '--max-mutants',
        type=int,
        help='Maximum number of mutants to generate (optional)'
    )

    args = parser.parse_args()

    # Check source file exists
    if not Path(args.source_file).exists():
        print(f"Error: Source file not found: {args.source_file}")
        sys.exit(1)

    # Run mutation testing
    tester = MutationTester(args.source_file, args.output)
    tester.run_mutation_testing(args.build_dir, args.max_mutants)


if __name__ == '__main__':
    main()
