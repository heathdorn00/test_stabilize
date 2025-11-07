# Week 1 Execution Plan: Testing Infrastructure Foundation

**RDB-002 Testing Infrastructure Modernization**
**Date**: 2025-11-06
**Owner**: @test_stabilize
**Status**: READY FOR EXECUTION
**Confidence**: HIGH (90%)

---

## Overview

Week 1 is the foundation phase for testing infrastructure modernization. All 5 high-priority recommendations from the @test_stabilize review have been integrated.

**Duration**: 5 business days (Mon-Fri)
**Team**: 3 engineers (@code_refactor lead, 2 contributors)
**Hours**: 120 person-hours (3 engineers × 8 hours × 5 days)

---

## Week 1 Objectives

### Primary Deliverables

1. ✅ Install test frameworks: GoogleTest (C++), AUnit (Ada), Jest (TypeScript)
2. ✅ Configure incremental mutation testing (changed files only via git diff)
3. ✅ Implement fast-fail CI gate (<2min for lint/type/critical tests)
4. ✅ Secret scanning integration (TruffleHog + GitLeaks) - **SECURITY BLOCKING**

### Success Criteria

- [ ] All test frameworks running: `npm test`, `make test`, `gnatmake test`
- [ ] Mutation testing executes on changed files in <2min
- [ ] Fast-fail gate catches 80%+ of failures in <2min
- [ ] Secret scanning enabled in CI/CD (0 secrets detected)
- [ ] All configs committed to repo: `configs/stryker.conf.js`, `.mull.yml`, `ci-fast-fail-pipeline.yml`

---

## Daily Breakdown

### Monday (Day 1): Test Framework Installation

**Assigned**: Engineer 1 (TypeScript), Engineer 2 (C++), Engineer 3 (Ada)

#### Tasks

**TypeScript (Jest)** - 3 hours
```bash
# Install Jest
npm install --save-dev jest @types/jest ts-jest

# Create jest.config.js
npx jest --init

# Run first test
npm test

# Validate
npm test -- --coverage
```

**C++ (GoogleTest)** - 4 hours
```bash
# Install GoogleTest
git clone https://github.com/google/googletest.git
cd googletest
mkdir build && cd build
cmake ..
make && sudo make install

# Create CMakeLists.txt for tests
# Add test target
# Run first test
make test
```

**Ada (AUnit)** - 4 hours
```bash
# Install AUnit
gprbuild -p -P aunit.gpr

# Create tests.gpr project file
# Add test harness
# Run first test
gnatmake -P tests.gpr && ./tests/test_runner
```

**Acceptance**: All 3 frameworks run hello-world test successfully.

---

### Tuesday (Day 2): Incremental Mutation Testing Configuration

**Assigned**: Engineer 1 (Stryker), Engineer 2 (Mull), Engineer 3 (Ada POC)

#### Tasks

**Stryker (TypeScript)** - 3 hours
```bash
# Install Stryker
npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner

# Copy config from test_stabilize/configs/stryker.conf.js
cp configs/stryker.conf.js ./

# Run on changed files
git diff --name-only main...HEAD | grep -E '\.(ts|js)$' | tr '\n' ',' | xargs npx stryker run --mutate

# Validate <2min for 10-20 files
```

**Mull (C++)** - 4 hours
```bash
# Install Mull
brew install mull  # macOS
# OR
apt-get install mull-cxx  # Linux

# Copy config from test_stabilize/configs/.mull.yml
cp configs/.mull.yml ./

# Run on changed files
git diff --name-only main...HEAD | grep -E '\.(cpp|cc)$' | tr '\n' ',' | \
  xargs mull-cxx -mutators=all -compdb-path=build/compile_commands.json -include-path

# Validate <2min for 10-20 files
```

**Ada (mutmut POC)** - 4 hours
```bash
# Install mutmut (adapted for Ada)
pip install mutmut

# Copy config from test_stabilize/configs/mutmut_config.py
cp configs/mutmut_config.py ./

# Run POC on 3 Ada files
python mutmut_ada.py --paths-to-mutate src/polyorb/orb_core/sample.adb

# Validate feasibility OR document fallback plan
```

**Acceptance**:
- Stryker runs on changed TypeScript files in <2min ✅
- Mull runs on changed C++ files in <2min ✅
- Ada POC either succeeds OR fallback documented ⚠️

---

### Wednesday (Day 3): Fast-Fail CI Pipeline Implementation

**Assigned**: Engineer 1 (CI/CD), Engineer 2 (Linters), Engineer 3 (Critical Tests)

#### Tasks

**CI/CD Pipeline** - 3 hours
```bash
# Copy pipeline from test_stabilize/configs/ci-fast-fail-pipeline.yml
mkdir -p .github/workflows
cp configs/ci-fast-fail-pipeline.yml .github/workflows/

# Configure concurrency, timeouts
# Test pipeline on feature branch
git checkout -b test/fast-fail-pipeline
git push origin test/fast-fail-pipeline

# Monitor execution time (target: <2min for Stage 1)
```

**Linters Setup** - 2 hours
```bash
# ESLint (TypeScript)
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npx eslint --init

# Pylint (Python)
pip install pylint
pylint src/ --generate-rcfile > .pylintrc

# GNAT Check (Ada)
# Copy gnatcheck.rules
gnatcheck -Ptests.gpr -rules -from=gnatcheck.rules
```

**Critical Unit Tests** - 3 hours
```bash
# Identify critical paths
# - Payment processing
# - Authentication
# - Security validation

# Tag tests with @critical
# Run subset in <1min
npm test -- --testPathPattern="(payment|auth|security)" --maxWorkers=4 --bail
```

**Acceptance**:
- Pipeline runs in <2min for Stage 1 (fast-fail gate) ✅
- 80%+ of failures caught in Stage 1 (validated over 10 PRs) ✅

---

### Thursday (Day 4): Secret Scanning Integration (SECURITY BLOCKING)

**Assigned**: Engineer 1 (TruffleHog), Engineer 2 (GitLeaks), Engineer 3 (Validation)

#### Tasks

**TruffleHog Setup** - 2 hours
```bash
# Add TruffleHog to CI pipeline (already in ci-fast-fail-pipeline.yml)
# Configure verified secrets only (reduce false positives)

# Test on repository
trufflehog git file://. --only-verified --fail

# Validate: 0 secrets detected
```

**GitLeaks Setup** - 2 hours
```bash
# Add GitLeaks to CI pipeline (already in ci-fast-fail-pipeline.yml)
# Create .gitleaks.toml config

# Test on repository
gitleaks detect --source . --verbose --no-git

# Validate: 0 secrets detected
```

**Pre-Commit Hooks** - 2 hours
```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
pre-commit install

# Add TruffleHog + GitLeaks to hooks
# Test on commit with fake secret
```

**Security Baseline Scan** - 2 hours
```bash
# Run full secret scan on entire codebase
trufflehog git file://. --only-verified --json > secret-scan-baseline.json
gitleaks detect --source . --report-path gitleaks-baseline.json

# Document findings
# Rotate any detected credentials
# Add exceptions for false positives
```

**Acceptance**:
- Secret scanning runs in CI/CD (<10s per scan) ✅
- 0 secrets detected in codebase ✅ **BLOCKING**
- Pre-commit hooks prevent future leakage ✅

---

### Friday (Day 5): Validation, Documentation, Retrospective

**Assigned**: All engineers

#### Tasks

**End-to-End Validation** - 3 hours
```bash
# Create test PR with intentional issues:
# 1. Lint error → expect fast-fail at <30s
# 2. Type error → expect fast-fail at <1min
# 3. Secret in code → expect fast-fail at <1.5min
# 4. Critical test failure → expect fast-fail at <2min

# Validate pipeline behavior:
# - Stage 1 catches all 4 issues in <2min
# - Stage 2 never runs (fast-fail works)

# Create clean PR:
# - All checks pass
# - Full suite runs in <5min (aspirational, may be 8-10min in Week 1)
```

**Documentation** - 2 hours
```markdown
# Update README.md
## Testing Infrastructure
- Test frameworks: GoogleTest, AUnit, Jest
- Mutation testing: Stryker, Mull, mutmut (POC)
- CI/CD: Fast-fail pipeline (<2min gate)
- Security: TruffleHog + GitLeaks

## Running Tests
npm test                    # TypeScript unit tests
make test                   # C++ unit tests
gnatmake -P tests.gpr       # Ada unit tests

## Running Mutation Tests
npx stryker run --mutate $(git diff --name-only main...HEAD | grep -E '\.(ts|js)$' | tr '\n' ',')
mull-cxx -mutators=all -compdb-path=build/compile_commands.json -include-path $(git diff --name-only main...HEAD | grep -E '\.(cpp|cc)$' | tr '\n' ',')
```

**Retrospective** - 2 hours
- What went well?
- What could be improved?
- Any blockers for Week 2?
- Update RDB-002 with actual execution metrics

**Week 1 Metrics Report** - 1 hour
```
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Test frameworks installed | 3/3 | ? | ? |
| Mutation testing <2min | Yes | ? | ? |
| Fast-fail gate <2min | Yes | ? | ? |
| Secret scan pass | 100% | ? | ? |
| Coverage baseline | 42% | ? | ? |
```

**Acceptance**:
- All deliverables complete ✅
- Retrospective documented ✅
- Week 2 kickoff scheduled ✅

---

## Configuration Files Delivered

All configuration files are ready in `test_stabilize/configs/`:

1. ✅ **stryker.conf.js** - Stryker mutation testing for TypeScript
2. ✅ **.mull.yml** - Mull mutation testing for C++
3. ✅ **mutmut_config.py** - mutmut adapted for Ada (POC)
4. ✅ **ci-fast-fail-pipeline.yml** - GitHub Actions fast-fail pipeline

---

## Risk Mitigation

### Risk 1: Ada Mutation Testing POC Fails (Probability: 40%)
**Mitigation**:
- Documented fallback plan in `mutmut_config.py`
- Skip Ada mutation testing for Week 1-24
- Manual code review for Ada (interim solution)
- Custom tooling development post-Week 24

### Risk 2: Fast-Fail Gate Exceeds 2min (Probability: 30%)
**Mitigation**:
- Profile each step (lint, type-check, secret scan, critical tests)
- Parallelize where possible
- Cache dependencies (npm, pip)
- Reduce critical test suite to top 10 tests only

### Risk 3: Secret Scanning False Positives (Probability: 25%)
**Mitigation**:
- Use `--only-verified` flag (TruffleHog)
- Create `.gitleaks.toml` with exceptions
- Review findings with @security_verification
- Document exceptions in security baseline

---

## Dependencies

### External Dependencies
- [ ] CI/CD runner access (GitHub Actions or self-hosted)
- [ ] Docker for TestContainers (Week 2, not Week 1)
- [ ] Pact Broker deployment (Week 2)

### Internal Dependencies
- [ ] @code_refactor: 3 engineers available Week 1
- [ ] @security_verification: Available for secret scan review (2 hours, Day 4)

---

## Communication Plan

**Daily Standup**: 9:00 AM (15 min)
- What did you complete yesterday?
- What will you work on today?
- Any blockers?

**Mid-Week Checkpoint**: Wednesday 3:00 PM (30 min)
- Review progress on fast-fail pipeline
- Triage any blockers
- Adjust timeline if needed

**End-of-Week Retrospective**: Friday 4:00 PM (1 hour)
- Review Week 1 metrics
- Document lessons learned
- Kickoff Week 2 planning

**Slack Channel**: #testing-infrastructure-modernization
- Real-time updates
- Blocker escalation
- Daily progress reports

---

## Next Steps (Week 2)

### Week 2 Preview (Nov 13-17)
1. Deploy Pact Broker with OAuth 2.0 authentication (**SECURITY BLOCKING**)
2. Create first 10 Pact contracts
3. Implement k6 performance baselines
4. Run baseline mutation tests (full scan, nightly)

### Prerequisites for Week 2
- [ ] Week 1 all deliverables complete ✅
- [ ] Test frameworks validated ✅
- [ ] Fast-fail pipeline proven (<2min) ✅
- [ ] Secret scanning baseline clean ✅

---

## Sign-Off

**Prepared by**: @test_stabilize (2025-11-06)
**Reviewed by**: _Pending_ (@code_refactor, @security_verification)
**Approved for execution**: _Pending_ (@heathdorn00)

**Status**: ✅ READY FOR EXECUTION

**Kickoff Meeting**: Monday 9:00 AM (Week 1, Day 1)

---

## Appendix: Quick Reference Commands

### Test Frameworks
```bash
# TypeScript (Jest)
npm test
npm test -- --coverage
npm test -- --watch

# C++ (GoogleTest)
make test
./build/tests/test_runner --gtest_filter=*

# Ada (AUnit)
gnatmake -P tests.gpr
./tests/test_runner
```

### Mutation Testing
```bash
# TypeScript (Stryker)
npx stryker run
npx stryker run --mutate src/payment/**/*.ts

# C++ (Mull)
mull-cxx -mutators=all -compdb-path=build/compile_commands.json
mull-cxx -mutators=all -include-path src/widget_core/

# Ada (mutmut - POC)
python mutmut_ada.py --paths-to-mutate src/polyorb/
```

### CI/CD Pipeline
```bash
# Test fast-fail gate locally
act -W .github/workflows/ci-fast-fail-pipeline.yml

# Monitor pipeline
gh run watch

# View logs
gh run view --log
```

### Secret Scanning
```bash
# TruffleHog
trufflehog git file://. --only-verified --fail

# GitLeaks
gitleaks detect --source . --verbose --no-git

# Pre-commit hook
pre-commit run --all-files
```

---

**End of Week 1 Execution Plan**
