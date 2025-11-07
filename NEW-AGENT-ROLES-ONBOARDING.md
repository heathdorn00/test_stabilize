# New Agent Roles - Onboarding & Task Specifications

**Project**: RDB-002 Testing Infrastructure Modernization & RDB-003 PolyORB Refactoring
**Created by**: @test_stabilize
**Date**: November 6, 2025
**Purpose**: Shift from planning to execution mode by adding 6 specialist roles

---

## TIER 1: CRITICAL ROLES (Add Week 1 - Immediate Priority)

---

### 1. @DevOps_Engineer

#### Role Overview

**Purpose**: Hands-on Docker, Kubernetes, and CI/CD pipeline implementation and deployment

**Why Critical**: 138 K8s manifests exist but are unvalidated. RDB-002 specifies CI/CD fast-fail gates but they're not implemented. Infrastructure work is currently falling on architects who should be designing, not deploying.

**Reports to**: @test_stabilize (for Week 1 testing infrastructure), @code_architect (for K8s deployment strategy)

**Collaborates with**: @Test_Automation_Engineer, @Implementation_Coordinator, @Security_Automation_Specialist

---

#### Skills & Expertise Required

**Core Technical Skills**:
- Docker containerization (Dockerfile creation, multi-stage builds, image optimization)
- Kubernetes (manifests, deployments, services, ConfigMaps, Secrets)
- Helm chart development and templating
- Kustomize overlays (dev/staging/prod environments)
- Istio service mesh configuration
- CI/CD pipelines (GitHub Actions preferred, GitLab CI acceptable)
- Infrastructure as Code principles
- Linux system administration

**Secondary Skills**:
- Grafana/Prometheus monitoring setup
- Container security (non-root users, read-only filesystems)
- Network policies and RBAC
- Load balancing and traffic management
- Troubleshooting containerized applications

**Nice to Have**:
- Experience with legacy application containerization
- Ada/C++/TypeScript build system knowledge
- Experience with microservices architecture (16+ services)

---

#### Onboarding Materials

**Pre-Reading (Complete before Day 1)** - 2 hours:
1. **Architecture Overview**: `RDB-002-Testing-Infrastructure-Modernization.md` (focus on Week 1-2)
2. **K8s Infrastructure**: `K8S_DEPLOYMENT_README.md` (138 manifests overview)
3. **CI/CD Requirements**: `configs/ci-fast-fail-pipeline.yml` (fast-fail gate specification)
4. **Docker Environment**: `DOCKER-TEST-ENVIRONMENT.md` (test environment setup)

**Day 1 Onboarding Call** - 1 hour:
- **Attendees**: @code_architect, @test_stabilize, @Implementation_Coordinator
- **Agenda**:
  - 16 microservices architecture walkthrough (20 min)
  - K8s manifest structure and deployment strategy (20 min)
  - Week 1 priorities and success criteria (10 min)
  - Q&A and environment access setup (10 min)

**Access & Credentials** (Setup before Day 1):
- GitHub repository (write access to `refactor/*` branches)
- Kubernetes dev cluster (namespace: `refactor-dev`)
- Docker registry credentials
- CI/CD runner access (GitHub Actions)
- Grafana instance (admin access)
- Slack: #testing-infrastructure-modernization

**Dev Environment Setup** - Complete Day 1:
```bash
# Clone repository
git clone https://github.com/org/polyorb-refactor.git
cd polyorb-refactor

# Install tools
brew install kubernetes-cli helm kustomize
brew install --cask docker

# Verify access
kubectl config use-context refactor-dev
kubectl get namespaces

# Validate K8s manifests
cd k8s/base
kubectl apply --dry-run=client -f .

# Verify Docker
docker --version
docker login <registry>
```

---

#### Week 1 Tasks (Priority Order)

**Monday (Day 1): Environment Setup & Validation** - 6 hours

**Task 1.1**: Dev environment setup (2 hours)
- Install Docker, kubectl, helm, kustomize
- Configure access to K8s dev cluster
- Clone repository and validate K8s manifest syntax
- **Acceptance**: All manifests pass `kubectl apply --dry-run=client`

**Task 1.2**: Manifest review and triage (2 hours)
- Review 138 K8s files in `k8s/`, `helm/`, `istio/` directories
- Identify any syntax errors or missing dependencies
- Validate ConfigMaps reference correct environment variables
- **Acceptance**: Create triage document with findings (if any issues found)

**Task 1.3**: Deploy first service to dev (2 hours)
- Choose widget-core service (simplest, TypeScript-based)
- Create Dockerfile for widget-core (if doesn't exist)
- Deploy to `refactor-dev` namespace using Kustomize overlay
- Verify pod starts and health checks pass
- **Acceptance**: `kubectl get pods -n refactor-dev` shows widget-core running

---

**Tuesday (Day 2): CI/CD Fast-Fail Pipeline** - 8 hours

**Task 2.1**: Fast-fail pipeline setup (4 hours)
- Copy `configs/ci-fast-fail-pipeline.yml` to `.github/workflows/`
- Configure GitHub Actions runners
- Set up caching for npm/pip dependencies
- Configure concurrency and 2-minute timeout
- **Acceptance**: Pipeline runs on test branch, Stage 1 completes in <2 min

**Task 2.2**: Integrate linters into pipeline (2 hours)
- Add ESLint for TypeScript (target: <30s execution)
- Add Pylint for Python helpers (target: <20s execution)
- Configure GNAT Check for Ada (target: <40s execution)
- **Acceptance**: Linting completes in <90s total

**Task 2.3**: Critical tests subset (2 hours)
- Identify top 10 critical tests (payment, auth, security modules)
- Configure to run in Stage 1 of pipeline
- Optimize for <1 minute execution time
- **Acceptance**: Critical tests run in <60s, catch basic regressions

---

**Wednesday (Day 3): Jest & Test Framework Deployment** - 8 hours

**Task 3.1**: Jest installation on widget-core (3 hours)
- Work with @Test_Automation_Engineer on Jest setup
- Create Dockerfile that includes test dependencies
- Configure jest.config.js for containerized testing
- **Acceptance**: `npm test` runs successfully in Docker container

**Task 3.2**: Test execution in CI (3 hours)
- Add test execution to fast-fail pipeline
- Configure test result reporting (JUnit XML)
- Set up code coverage collection (Istanbul)
- **Acceptance**: Tests run in CI, coverage report generated

**Task 3.3**: Docker image optimization (2 hours)
- Implement multi-stage build (reduce image size)
- Add .dockerignore for faster builds
- Configure layer caching for CI
- **Acceptance**: Image build time <3 min, size <500MB

---

**Thursday (Day 4): Grafana Dashboard Deployment** - 8 hours

**Task 4.1**: Grafana instance setup (3 hours)
- Deploy Grafana to K8s dev cluster (if not already deployed)
- Configure Prometheus data source
- Set up initial dashboards directory
- **Acceptance**: Grafana accessible at `https://grafana.refactor-dev.local`

**Task 4.2**: Import RDB-002 dashboard (3 hours)
- Import dashboard spec from `GRAFANA-DASHBOARD-SPEC.md`
- Configure 13 panels across 6 rows
- Connect to Prometheus, Elasticsearch, PostgreSQL data sources
- **Acceptance**: Dashboard displays (may show "No Data" until metrics flowing)

**Task 4.3**: Alert rules configuration (2 hours)
- Configure 9 alert rules from spec
- Set up notification channels (Slack webhook)
- Test alert firing with mock data
- **Acceptance**: Alerts configured, test alert fires correctly

---

**Friday (Day 5): Validation & Documentation** - 8 hours

**Task 5.1**: End-to-end validation (4 hours)
- Create test PR with intentional issues:
  - Lint error (expect fast-fail at <30s)
  - Type error (expect fast-fail at <1min)
  - Test failure (expect fast-fail at <2min)
- Validate pipeline catches all issues in Stage 1
- Create clean PR and validate full pipeline runs
- **Acceptance**: Fast-fail catches issues in <2min, clean PR passes

**Task 5.2**: Documentation updates (2 hours)
- Update README.md with Docker deployment instructions
- Document CI/CD pipeline usage
- Create troubleshooting guide for common issues
- **Acceptance**: New team member can deploy using README alone

**Task 5.3**: Week 1 retrospective preparation (2 hours)
- Compile metrics: build times, test execution times, deployment success rate
- Document what worked well and what needs improvement
- Prepare 5-min demo for Friday retrospective
- **Acceptance**: Metrics report ready, demo rehearsed

---

#### Success Metrics (Week 1)

**Primary Metrics**:
- [ ] widget-core service deployed to K8s dev cluster (running, healthy)
- [ ] CI/CD fast-fail pipeline operational (<2 min for Stage 1)
- [ ] Jest tests running in CI with coverage reporting
- [ ] Grafana dashboard deployed (visible, even if no data yet)
- [ ] At least ONE concrete deliverable demonstrated

**Secondary Metrics**:
- Pipeline success rate: >90%
- Docker image build time: <3 minutes
- Test execution time: <2 minutes for critical subset
- Manifest validation: 100% of 138 files pass dry-run

**Confidence Level**: By end of Week 1, team confidence in K8s deployment should increase from 70% → 85%

---

#### Week 2+ Roadmap

**Week 2 Focus**:
- Deploy remaining 15 microservices to K8s dev
- Integrate Pact Broker for contract testing
- Set up k6 load testing infrastructure
- Implement Istio traffic management rules

**Ongoing Responsibilities**:
- Maintain CI/CD pipelines (optimize build times)
- Monitor K8s cluster health
- Troubleshoot deployment issues
- Optimize resource limits based on actual usage data

---

#### Key Relationships

**Works closely with**:
- @Test_Automation_Engineer: Jest/GoogleTest containerization
- @Security_Automation_Specialist: Secret scanning, security CI gates
- @Implementation_Coordinator: Task dependencies, blocker escalation
- @code_architect: K8s architecture questions, manifest design

**Escalation Path**:
- Technical blockers: @code_architect
- CI/CD access issues: @Implementation_Coordinator
- Security concerns: @Security_Automation_Specialist
- Urgent issues: @test_stabilize (project owner)

---

### 2. @Implementation_Coordinator

#### Role Overview

**Purpose**: Project management, dependency tracking, task routing, and team coordination to ensure work flows smoothly from design → implementation → testing

**Why Critical**: Currently no one is tracking "who's doing what," unblocking dependencies, or ensuring handoffs happen correctly. This creates the biggest risk: "The Stall" - planning paralysis where work doesn't execute.

**Reports to**: @heathdorn00 (executive sponsor), collaborates with @test_stabilize (project owner)

**Coordinates**: All team members (architects, engineers, security, testers)

---

#### Skills & Expertise Required

**Core Management Skills**:
- Agile project management (Scrum/Kanban)
- Dependency mapping and critical path analysis
- Task routing and workload balancing
- Blocker escalation and resolution
- Status reporting and stakeholder communication
- Risk management and mitigation planning

**Technical Understanding** (not hands-on coding):
- Familiarity with software development lifecycle
- Understanding of CI/CD pipelines
- Basic knowledge of microservices architecture
- Ability to read RDBs and understand technical dependencies

**Tools Expertise**:
- Linear/Jira/Asana (task tracking)
- Miro/Lucidchart (dependency mapping)
- Slack (team communication)
- GitHub (PR tracking, project boards)
- Grafana/dashboards (progress visualization)

**Soft Skills**:
- Clear, concise communication
- Proactive problem-solving
- Ability to work with technical and non-technical stakeholders
- Strong organizational skills
- Comfortable with ambiguity and changing priorities

---

#### Onboarding Materials

**Pre-Reading (Complete before Day 1)** - 3 hours:
1. **RDB-002**: Testing Infrastructure Modernization (24-week timeline)
2. **RDB-003**: Phase 1 Deallocation Strategy (16-20 week timeline)
3. **WEEK-1-EXECUTION-PLAN.md**: Detailed 5-day breakdown
4. **WEEK-1-KICKOFF-MEETING-MINUTES.md**: Team context, confidence levels, decisions
5. **Team Retrospective Summary**: Posted to Refactor Cell (understand team dynamics)

**Day 1 Onboarding Call** - 90 minutes:
- **Attendees**: @heathdorn00, @test_stabilize, @code_architect, @security_verification, @refactor_agent
- **Agenda**:
  - Project overview and business context (15 min)
  - Team introductions and role clarity (15 min)
  - Current status: what's planned vs. what's executed (20 min)
  - Dependency map walkthrough (20 min)
  - Communication rhythm and expectations (10 min)
  - Q&A (10 min)

**Access & Tools** (Setup before Day 1):
- Linear workspace (admin access to "RDB-002" and "RDB-003" projects)
- Slack: #testing-infrastructure-modernization (admin)
- GitHub: Read access to all repos, projects, and PRs
- Google Drive: Access to all RDB/ADR documents
- Grafana: View access to dashboards
- Calendar: Ability to schedule team meetings

**Communication Channels Setup**:
- Daily standup thread in Slack (automated at 9:00 AM)
- Weekly sync meeting (Fridays 2:00-2:30 PM)
- Blocker escalation DM channel with @test_stabilize and @code_architect

---

#### Week 1 Tasks (Priority Order)

**Monday (Day 1): Assessment & Setup** - 8 hours

**Task 1.1**: Team assessment and dependency mapping (3 hours)
- Meet 1:1 with each team member (15 min each):
  - @code_architect: Understand design work, current bottlenecks
  - @test_stabilize: Week 1 priorities, success criteria
  - @security_verification: Security checkpoint requirements
  - @refactor_agent: Current tasks, blockers
  - @DevOps_Engineer (new): Week 1 plan, access needs
  - @Test_Automation_Engineer (new): Week 1 plan, collaboration needs
- Document findings: Who's doing what? What's blocked?
- **Acceptance**: Team assessment document with current state

**Task 1.2**: Dependency map creation (3 hours)
- Map all Week 1 dependencies in Miro/Lucidchart:
  - Test frameworks → Mutation testing
  - Linters → CI pipeline
  - Secret scanning → Security checkpoint (Thursday)
  - Docker → K8s deployment
  - Jest setup → Test execution in CI
- Identify critical path (longest dependency chain)
- Flag tasks with no dependencies (can start immediately)
- **Acceptance**: Visual dependency map shared with team

**Task 1.3**: Linear project setup (2 hours)
- Create "Week 1 - Testing Infrastructure Foundation" epic
- Break down into daily tasks (Monday-Friday)
- Assign tasks to correct team members based on specialties
- Set up automation: GitHub PR → Linear task linking
- Configure views: Kanban board, timeline view, team workload
- **Acceptance**: Linear shows all Week 1 tasks, assigned, with dependencies

---

**Tuesday (Day 2): Execution Cadence & Monitoring** - 8 hours

**Task 2.1**: Daily standup process (2 hours)
- Create Slack standup automation (Geekbot or manual template)
- Format: "Yesterday I... / Today I will... / Blockers..."
- Set up daily reminder at 9:00 AM
- Create first standup thread manually, demonstrate format
- **Acceptance**: All team members post standup by 10:00 AM Tuesday

**Task 2.2**: Progress dashboard creation (3 hours)
- Set up Linear dashboard with key metrics:
  - Tasks completed vs. planned (daily)
  - Current blockers (red flag any task blocked >1 day)
  - Team workload (hours assigned per person)
  - Week 1 deliverables status (4 primary deliverables)
- Embed Grafana panels if available
- Share dashboard link in Slack (pinned message)
- **Acceptance**: Dashboard visible to all, updates in real-time

**Task 2.3**: Task routing and handoffs (3 hours)
- Review all incoming tasks from @code_architect (architecture decisions)
- Route correctly:
  - Infrastructure → @DevOps_Engineer
  - Test framework setup → @Test_Automation_Engineer
  - Security validation → @security_verification
  - Code refactoring → @refactor_agent
- Document routing rules for future automation
- **Acceptance**: Zero tasks misassigned today (per retrospective feedback)

---

**Wednesday (Day 3): Mid-Week Checkpoint** - 8 hours

**Task 3.1**: Mid-week checkpoint meeting (30 min)
- **Time**: Wednesday 3:00 PM
- **Attendees**: All team members
- **Agenda**:
  - Progress review: Are we on track for Week 1 deliverables?
  - Blocker triage: What's blocking progress?
  - Risk assessment: Any new risks emerged?
  - Adjustments: Do we need to deprioritize anything?
- Take notes, share summary in Slack afterward
- **Acceptance**: Meeting held, notes posted within 1 hour

**Task 3.2**: Dependency unblocking (4 hours)
- Review all blocked tasks in Linear
- For each blocker:
  - Is it waiting on another team member? → Ping them with urgency
  - Is it waiting on external access? → Escalate to @heathdorn00
  - Is it waiting on a decision? → Schedule quick sync with @code_architect
- Track time-to-unblock for each blocker
- **Acceptance**: All blockers >24 hours old have action plans

**Task 3.3**: Week 1 risk assessment (2 hours)
- Review Week 1 success criteria:
  - All 3 test frameworks running? (Status: ?)
  - Mutation testing <2 min? (Status: ?)
  - Fast-fail gate <2 min? (Status: ?)
  - Secret scanning enabled? (Status: ?)
- Identify at-risk deliverables
- Create contingency plans (e.g., if Jest setup delayed, extend to Monday Week 2)
- **Acceptance**: Risk report shared with @test_stabilize and @code_architect

---

**Thursday (Day 4): Security Checkpoint Coordination** - 8 hours

**Task 4.1**: Security checkpoint preparation (2 hours)
- Coordinate with @security_verification for 2:00-4:00 PM checkpoint
- Ensure all required artifacts ready:
  - TruffleHog baseline scan results
  - GitLeaks baseline scan results
  - Pre-commit hooks tested
  - CI pipeline integration validated
- Prepare agenda and send to attendees (all engineers + security)
- **Acceptance**: Checkpoint starts on time with all materials ready

**Task 4.2**: Security checkpoint facilitation (2 hours)
- Facilitate meeting (keep on time, track action items)
- Document decisions and approvals
- Capture any exceptions or clarifications needed
- Assign follow-up tasks if security findings require remediation
- **Acceptance**: Meeting ends on time, notes posted within 30 min

**Task 4.3**: Week 1 completion tracking (4 hours)
- Review Friday's tasks across all team members
- Identify which deliverables will be DONE by EOD Friday
- Identify which might slip to Week 2 (flag early)
- Prepare metrics for Friday retrospective:
  - Tasks completed vs. planned
  - Blockers resolved vs. unresolved
  - Deliverables on track vs. at risk
- **Acceptance**: Friday retrospective prep complete

---

**Friday (Day 5): Retrospective & Week 2 Planning** - 8 hours

**Task 5.1**: Week 1 retrospective facilitation (2 hours)
- **Time**: Friday 2:00-4:00 PM
- **Attendees**: All team members
- **Agenda**:
  - Metrics review: What did we accomplish?
  - What went well? (celebrate wins!)
  - What could be improved? (no blame, focus on process)
  - Action items for Week 2
  - Confidence vote for Week 2 readiness
- Use retrospective format: Start/Stop/Continue
- Document findings and share
- **Acceptance**: Retrospective held, notes posted, action items assigned

**Task 5.2**: Week 1 metrics report (2 hours)
- Compile final metrics:
  - Deliverables: X/4 complete
  - Tasks: Y/Z completed
  - Blockers: A resolved, B escalated
  - Team velocity: C tasks/person/day
  - Confidence: Week 1 kickoff (86%) → Week 1 end (?)
- Create visual report (charts, graphs)
- Share with @heathdorn00 and team
- **Acceptance**: Metrics report published

**Task 5.3**: Week 2 planning kickoff (4 hours)
- Review RDB-002 Week 2 priorities:
  - Pact Broker deployment
  - First 10 Pact contracts
  - k6 performance baselines
  - Baseline mutation tests
- Create Week 2 epic in Linear
- Break down into daily tasks
- Assign to team members (include 3 new Tier 2 agents)
- Identify dependencies and critical path
- **Acceptance**: Week 2 plan ready, communicated to team

---

#### Success Metrics (Week 1)

**Primary Metrics**:
- [ ] Daily standup participation: 100% (all team members post daily)
- [ ] Mid-week checkpoint held on Wednesday (on time)
- [ ] Security checkpoint held on Thursday (all artifacts ready)
- [ ] Week 1 retrospective held on Friday (90%+ attendance)
- [ ] Progress dashboard visible and updated in real-time

**Coordination Metrics**:
- Task misassignment rate: <5% (down from ~30% based on retrospective)
- Blocker resolution time: <24 hours average
- Dependency-blocked tasks: <10% of total tasks
- Team workload balance: No team member >120% capacity

**Communication Metrics**:
- Response time to blocker escalations: <2 hours
- Meeting start time adherence: 100% (all meetings start on time)
- Documentation lag: All meeting notes posted within 1 hour

**Confidence Level**: By end of Week 1, team confidence in execution should increase from 30% → 85%

---

#### Week 2+ Roadmap

**Ongoing Responsibilities**:
- Daily standup facilitation (ongoing)
- Weekly sync meetings every Friday
- Dependency tracking and unblocking
- Task routing and workload balancing
- Risk identification and mitigation
- Stakeholder communication (weekly status to @heathdorn00)

**Process Improvements** (Week 2-4):
- Implement automated task routing based on tags
- Create runbooks for common blockers
- Set up Slack alerts for tasks blocked >1 day
- Develop velocity metrics and predictive timeline updates

---

#### Key Relationships

**Primary Stakeholder**: @heathdorn00 (weekly status reports)

**Coordinates with (Daily)**:
- @test_stabilize: Project priorities, success criteria
- @code_architect: Architecture decisions, design dependencies
- @DevOps_Engineer: Infrastructure progress, deployment blockers
- @Test_Automation_Engineer: Test framework progress
- All team members: Task assignments, blocker resolution

**Escalation Path**:
- Technical decisions: @code_architect
- Project scope/priority: @test_stabilize
- Resource/access issues: @heathdorn00
- Security concerns: @security_verification

---

### 3. @Test_Automation_Engineer

#### Role Overview

**Purpose**: Hands-on implementation of test frameworks (Jest, GoogleTest, AUnit, Pact), mutation testing tools, and test automation infrastructure

**Why Critical**: RDB-002 has comprehensive test strategy plans but no one executing the actual implementation. @test_stabilize is stuck in planning mode and needs hands-on execution support.

**Reports to**: @test_stabilize (test strategy and acceptance criteria)

**Collaborates with**: @DevOps_Engineer (CI/CD integration), @Performance_Engineer (performance test setup)

---

#### Skills & Expertise Required

**Core Testing Skills**:
- **JavaScript/TypeScript**: Jest, Stryker (mutation testing)
- **C++**: GoogleTest, Google Mock, Mull (mutation testing)
- **Ada**: AUnit (basic familiarity acceptable)
- Test-driven development (TDD) practices
- Contract testing with Pact
- Mutation testing principles and tools
- Code coverage analysis (Istanbul, gcov, gnatcov)

**CI/CD Integration**:
- GitHub Actions / GitLab CI pipeline configuration
- Test result reporting (JUnit XML)
- Coverage reporting and threshold enforcement
- Test parallelization and optimization

**Additional Skills**:
- Property-based testing (JSVerify, Hypothesis)
- Snapshot testing
- Test data factory patterns (FactoryBot-style)
- Test doubles (mocks, stubs, fakes)

**Nice to Have**:
- Visual regression testing (Playwright, Cypress)
- Chaos testing (Chaos Mesh)
- Contract-first development experience
- Legacy codebase testing experience

---

#### Onboarding Materials

**Pre-Reading (Complete before Day 1)** - 2 hours:
1. **RDB-002**: Testing Infrastructure Modernization (focus on Week 1-2 test framework setup)
2. **ADR-004**: Test Framework Selection and Strategy
3. **Test Framework Architecture**: `TEST-FRAMEWORK-ARCHITECTURE.md`
4. **Week 1 Configs**:
   - `configs/stryker.conf.js` (TypeScript mutation testing)
   - `configs/.mull.yml` (C++ mutation testing)
   - `configs/mutmut_config.py` (Ada POC)
5. **Setup Guides**:
   - `WEEK1-JEST-SETUP.md`
   - `WEEK1-GOOGLETEST-SETUP.md`
   - `WEEK1-AUNIT-SETUP.md`

**Day 1 Onboarding Call** - 1 hour:
- **Attendees**: @test_stabilize, @code_architect, @DevOps_Engineer
- **Agenda**:
  - Testing strategy overview and zero-regression goals (15 min)
  - 16 microservices architecture and test surfaces (15 min)
  - Week 1 test framework priorities (15 min)
  - Collaboration with @DevOps_Engineer for CI integration (10 min)
  - Q&A (5 min)

**Access & Credentials** (Setup before Day 1):
- GitHub repository (write access)
- CI/CD runner access (GitHub Actions)
- Codecov or Coveralls account (coverage reporting)
- Pact Broker access (Week 2, but set up early)
- Slack: #testing-infrastructure-modernization

**Dev Environment Setup** - Complete Day 1:
```bash
# Clone repository
git clone https://github.com/org/polyorb-refactor.git
cd polyorb-refactor

# Install test frameworks
npm install --save-dev jest @types/jest ts-jest @stryker-mutator/core

# C++ testing (macOS)
brew install googletest llvm  # LLVM for Mull

# Ada testing
gprbuild -p -P aunit.gpr

# Verify installations
npm test -- --version
gtest-config --version
gnatmake --version

# Run existing tests (if any)
npm test
make test
```

---

#### Week 1 Tasks (Priority Order)

**Monday (Day 1): Jest Installation & Configuration** - 8 hours

**Task 1.1**: Jest setup for widget-core service (3 hours)
- Navigate to `services/widget-core/` (TypeScript service)
- Install Jest dependencies:
  ```bash
  npm install --save-dev jest @types/jest ts-jest
  ```
- Create `jest.config.js`:
  ```javascript
  module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    testMatch: ['**/__tests__/**/*.test.ts'],
  };
  ```
- Create hello-world test: `__tests__/hello.test.ts`
- **Acceptance**: `npm test` runs successfully, coverage report generated

**Task 1.2**: Jest tests for core modules (3 hours)
- Identify 3-5 core modules in widget-core (e.g., `src/payment/`, `src/auth/`)
- Write unit tests covering:
  - Happy path scenarios
  - Error handling
  - Edge cases
- Target: 60%+ coverage on tested modules
- **Acceptance**: 10-15 tests written, all passing

**Task 1.3**: Jest documentation (2 hours)
- Update `services/widget-core/README.md` with:
  - How to run tests (`npm test`)
  - How to run tests in watch mode (`npm test -- --watch`)
  - How to view coverage (`npm test -- --coverage`)
  - How to run specific test file
- Add example test showing best practices
- **Acceptance**: New developer can run tests using README alone

---

**Tuesday (Day 2): Mutation Testing Setup** - 8 hours

**Task 2.1**: Stryker installation (2 hours)
- Install Stryker for TypeScript:
  ```bash
  npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner
  ```
- Copy config from `configs/stryker.conf.js`
- Customize mutators (arithmetic, conditional, logical)
- **Acceptance**: `npx stryker run` executes successfully

**Task 2.2**: Incremental mutation testing (3 hours)
- Configure Stryker for changed files only:
  ```bash
  git diff --name-only main...HEAD | grep -E '\.(ts|js)$' | \
    tr '\n' ',' | xargs npx stryker run --mutate
  ```
- Test on 3 sample files from widget-core
- Measure execution time (target: <2 min for 10-20 files)
- Optimize if needed (reduce mutators, parallelize)
- **Acceptance**: Mutation testing runs in <2 min for changed files

**Task 2.3**: Mutation score baseline (3 hours)
- Run full mutation test suite on widget-core
- Document baseline mutation score (likely 40-60% initially)
- Identify files with low mutation scores (<50%)
- Create improvement plan for Week 2+
- **Acceptance**: Baseline mutation score documented, shared with @test_stabilize

---

**Wednesday (Day 3): GoogleTest Setup for C++** - 8 hours

**Task 3.1**: GoogleTest installation for PolyORB (4 hours)
- Navigate to `services/orb-core/` (C++ service)
- Install GoogleTest:
  ```bash
  git clone https://github.com/google/googletest.git
  cd googletest
  mkdir build && cd build
  cmake ..
  make && sudo make install
  ```
- Create `tests/CMakeLists.txt`:
  ```cmake
  find_package(GTest REQUIRED)
  include_directories(${GTEST_INCLUDE_DIRS})

  add_executable(test_runner
    test_orb_core.cpp
    test_giop.cpp
  )
  target_link_libraries(test_runner ${GTEST_LIBRARIES} pthread)
  ```
- Create hello-world test: `tests/test_orb_core.cpp`
- **Acceptance**: `make test` runs successfully

**Task 3.2**: GoogleTest for core C++ modules (3 hours)
- Identify 3 core C++ modules (e.g., `orb-core/`, `giop-protocol/`)
- Write unit tests with Google Mock for dependencies
- Test memory management (no leaks with Valgrind spot-check)
- **Acceptance**: 5-10 C++ tests written, all passing

**Task 3.3**: Mull (mutation testing) POC (1 hour)
- Attempt Mull installation:
  ```bash
  brew install mull  # macOS
  ```
- Copy config from `configs/.mull.yml`
- Run on 1 sample C++ file
- Document feasibility (may be complex, defer deep dive to Week 2)
- **Acceptance**: Mull POC attempted, findings documented

---

**Thursday (Day 4): AUnit Setup for Ada** - 8 hours

**Task 4.1**: AUnit installation for PolyORB (4 hours)
- Navigate to `polyorb/` directory
- Install AUnit:
  ```bash
  gprbuild -p -P aunit.gpr
  ```
- Create `tests.gpr` project file
- Create test harness: `tests/test_runner.adb`
- Create hello-world test for one PolyORB module
- **Acceptance**: `gnatmake -P tests.gpr && ./tests/test_runner` runs

**Task 4.2**: AUnit tests for Ada modules (3 hours)
- Identify 2-3 Ada modules to test
- Write basic unit tests (setup/teardown, assertions)
- Focus on deterministic tests (no I/O, no time dependencies)
- **Acceptance**: 5+ Ada tests written, all passing

**Task 4.3**: mutmut Ada POC (1 hour)
- Attempt mutmut for Ada (experimental):
  ```bash
  pip install mutmut
  python configs/mutmut_config.py --paths-to-mutate src/polyorb/sample.adb
  ```
- Document findings: Does it work? Execution time? Mutation score?
- **Decision point**: Continue with Ada mutation or defer to manual review?
- **Acceptance**: POC results documented, decision made (go/no-go)

---

**Friday (Day 5): CI Integration & Documentation** - 8 hours

**Task 5.1**: Test CI pipeline integration (4 hours)
- Work with @DevOps_Engineer to add tests to CI pipeline
- Configure test execution in GitHub Actions:
  ```yaml
  - name: Run Jest tests
    run: npm test -- --ci --coverage
  - name: Run GoogleTest
    run: make test
  - name: Run AUnit tests
    run: gnatmake -P tests.gpr && ./tests/test_runner
  ```
- Set up test result reporting (JUnit XML format)
- Configure coverage thresholds (fail if <60% for new code)
- **Acceptance**: All tests run in CI, results visible in PR

**Task 5.2**: Coverage reporting (2 hours)
- Integrate with Codecov or Coveralls
- Configure coverage badges for README
- Set up diff coverage (only check coverage on changed lines)
- **Acceptance**: Coverage reports visible on PRs, badges display

**Task 5.3**: Week 1 test summary (2 hours)
- Compile Week 1 testing metrics:
  - Test frameworks installed: 3/3 ✓
  - Total tests written: X unit tests
  - Coverage baseline: Y% (widget-core), Z% (orb-core)
  - Mutation score baseline: M% (widget-core)
  - CI integration: ✓ Tests run on every PR
- Document gaps and Week 2 priorities
- Prepare 5-min demo for retrospective
- **Acceptance**: Test summary report shared with @test_stabilize

---

#### Success Metrics (Week 1)

**Primary Metrics**:
- [ ] All 3 test frameworks installed and running (Jest, GoogleTest, AUnit)
- [ ] Mutation testing configured for TypeScript (Stryker <2 min)
- [ ] Tests running in CI/CD pipeline (every PR)
- [ ] Coverage reporting integrated (Codecov/Coveralls)
- [ ] 20-30 total tests written across all frameworks

**Coverage Baselines**:
- widget-core (TypeScript): >60% line coverage
- orb-core (C++): >40% line coverage (C++ harder to test initially)
- PolyORB (Ada): >30% line coverage (exploratory week 1)

**Mutation Score Baselines**:
- widget-core: Document baseline (likely 40-60%)
- C++/Ada: Defer to Week 2+ (focus on unit tests first)

**Confidence Level**: By end of Week 1, confidence in test infrastructure should increase to 80%+

---

#### Week 2+ Roadmap

**Week 2 Focus**:
- Expand test coverage: Target 80%+ on changed modules
- Pact contract testing: Create first 10 contracts
- Test data factories: FactoryBot-style generators
- Performance tests: Work with @Performance_Engineer on k6 integration

**Ongoing Responsibilities**:
- Write tests for new features (pair with developers)
- Maintain test frameworks and dependencies
- Optimize test execution time (target: <5 min full suite)
- Reduce flaky tests (target: <1% flaky rate)
- Train team on testing best practices

---

#### Key Relationships

**Works closely with**:
- @test_stabilize: Test strategy, acceptance criteria, zero-regression validation
- @DevOps_Engineer: CI/CD integration, containerized test execution
- @refactor_agent: Test coverage for refactored code
- @Performance_Engineer (Week 2): k6 performance test integration

**Escalation Path**:
- Test strategy questions: @test_stabilize
- CI/CD issues: @DevOps_Engineer
- Framework/tool selection: @test_stabilize + @code_architect
- Urgent blockers: @Implementation_Coordinator

---

## TIER 2: HIGH VALUE ROLES (Add Week 2)

---

### 4. @Ada_Language_Expert

#### Role Overview

**Purpose**: Provide Ada language expertise for Phase 2 GIOP/TypeCode refactoring (~20K LoC Ada code) and advise on Ada-specific memory management, concurrency, and GNAT compiler optimizations

**Why Needed**: Phase 2 involves complex Ada code with unique challenges (tasking, generics, elaboration order). Current team lacks deep Ada expertise and would Google/GPT their way through, leading to slow progress and potential bugs.

**Reports to**: @code_architect (architecture decisions), @refactor_agent (code review support)

**Advises**: All team members working with Ada code

---

#### Skills & Expertise Required

**Core Ada Expertise**:
- **Ada 2012 language** (expression functions, conditional expressions, aspects)
- **Ada tasking**: Rendezvous, protected types, select statements, abort handling
- **Ada generics**: Instantiation, elaboration order, generic contracts
- **Access types and controlled types**: Finalization, memory management
- **GNAT compiler**: Runtime internals, secondary stack, optimization flags
- **Ada exceptions**: Propagation mechanics, exception contracts

**CORBA/PolyORB Domain Knowledge**:
- CORBA architecture and concepts
- GIOP 1.2 wire protocol
- CDR marshalling/unmarshalling
- POA (Portable Object Adapter) interactions
- ORB request handling

**Code Quality**:
- Ada coding standards (AdaCore style guide)
- Performance profiling (gprof, GNAT Studio profiler)
- Memory leak detection in Ada (gnatmem, Valgrind)
- Static analysis (GNAT Check, AdaControl)

**Nice to Have**:
- Distributed systems experience
- Real-time Ada (Ravenscar profile)
- SPARK formal verification
- Legacy code modernization experience

---

#### Onboarding Materials

**Pre-Reading (Complete before Day 1)** - 3 hours:
1. **RDB-003**: Phase 1 Deallocation Strategy (understand memory management context)
2. **PolyORB Architecture**: Internal documentation or external PolyORB papers
3. **Phase 2 Preview**: GIOP and TypeCode modules (source code review)
4. **Compilation Results**: `task7_compilation_report.md` (Phase 1 findings)

**Day 1 Onboarding Call** - 90 minutes:
- **Attendees**: @code_architect, @refactor_agent, @test_stabilize
- **Agenda**:
  - PolyORB architecture deep dive (30 min)
  - Phase 1 deallocation review and Ada patterns used (20 min)
  - Phase 2 GIOP/TypeCode scope and challenges (20 min)
  - Team's current Ada knowledge gaps (10 min)
  - Q&A (10 min)

**Access & Credentials**:
- GitHub repository (write access for code reviews)
- GNAT FSF 13 compiler access
- PolyORB build environment
- Ada documentation library
- Slack: #testing-infrastructure-modernization

**Dev Environment Setup**:
```bash
# Clone repository
git clone https://github.com/org/polyorb-refactor.git
cd polyorb

# Install GNAT FSF 13
# (Installation varies by platform - use existing team setup)

# Build PolyORB
./configure --with-corba
make

# Run existing tests
make check

# Verify Ada compilation
gnatmake --version
```

---

#### Week 2 Tasks (Phase 1 Review Focus)

**Monday-Tuesday (Days 1-2): Phase 1 Code Review** - 16 hours total

**Task 1.1**: Review Phase 1 deallocation changes (8 hours)
- Review all 114 refactored files from `refactor/phase1-deallocation-migration` branch
- Focus on Ada-specific patterns:
  - Controlled types and finalization
  - Access type usage and deallocation
  - Exception handling during cleanup
  - Tasking and protected type cleanup
- Identify potential issues:
  - Memory leaks (missed deallocations)
  - Double-free risks
  - Finalization order problems
  - Race conditions in cleanup
- **Acceptance**: Code review completed, findings documented

**Task 1.2**: Ada best practices recommendations (4 hours)
- Document Ada 2012 idioms that could improve code
- Identify Ada 83-style patterns that should be modernized
- Suggest GNAT optimization flags for production
- Create Ada coding standards guide for team
- **Acceptance**: Best practices document shared with team

**Task 1.3**: Memory leak pattern analysis (4 hours)
- Review AddressSanitizer findings from Phase 1
- Identify common Ada memory leak patterns in codebase
- Create checklist for developers: "Ada memory safety review"
- Suggest additional tooling (gnatmem configuration)
- **Acceptance**: Memory leak patterns documented, checklist created

---

**Wednesday-Thursday (Days 3-4): Phase 2 GIOP/TypeCode Analysis** - 16 hours total

**Task 2.1**: GIOP protocol analysis (6 hours)
- Review `polyorb/src/giop/` modules (~12K LoC)
- Document protocol flow and request handling
- Identify tasking complexity:
  - Where are tasks created?
  - What are the rendezvous patterns?
  - Are there select statements with delays?
  - How is abort handling implemented?
- Identify refactoring risks (high-risk areas)
- **Acceptance**: GIOP analysis document created

**Task 2.2**: TypeCode module analysis (4 hours)
- Review `polyorb/src/corba/typecode/` modules (~8K LoC)
- Document generic instantiation patterns
- Identify elaboration order dependencies
- Review CDR marshalling complexity
- **Acceptance**: TypeCode analysis document created

**Task 2.3**: Phase 2 refactoring strategy (6 hours)
- Propose incremental refactoring approach for GIOP/TypeCode
- Break into smaller milestones (2-3 week chunks)
- Identify which modules can be refactored independently
- Flag modules that have complex dependencies (refactor last)
- Create risk mitigation strategies specific to Ada
- **Acceptance**: Phase 2 strategy document shared with @code_architect

---

**Friday (Day 5): Team Training & Recommendations** - 8 hours

**Task 3.1**: Ada training session (2 hours)
- Conduct live training for team on Ada-specific topics:
  - Controlled types and finalization (30 min)
  - Ada tasking basics (30 min)
  - Generic instantiation and elaboration (30 min)
  - Common pitfalls and how to avoid them (30 min)
- Record session for future reference
- **Acceptance**: Training delivered, recording shared

**Task 3.2**: GNAT compiler optimization (2 hours)
- Review current GNAT compiler flags used in build
- Recommend optimizations for production builds
- Document debug vs. release build configurations
- Test optimization impact on PolyORB performance
- **Acceptance**: GNAT optimization guide created

**Task 3.3**: Week 2 Ada summary (4 hours)
- Compile Week 2 Ada findings:
  - Phase 1 code review findings (X issues found)
  - Phase 2 analysis complete (GIOP + TypeCode documented)
  - Refactoring strategy proposed
  - Team training delivered
- Recommendations for Week 3+ Ada work
- Prepare demo for retrospective
- **Acceptance**: Ada summary report shared with @code_architect and @test_stabilize

---

#### Success Metrics (Week 2)

**Primary Metrics**:
- [ ] Phase 1 code review completed (114 files reviewed)
- [ ] Phase 2 GIOP/TypeCode analysis complete
- [ ] Phase 2 refactoring strategy proposed (approved by @code_architect)
- [ ] Team Ada training delivered
- [ ] Ada best practices guide published

**Code Quality Metrics**:
- Code review findings: Document severity (critical/medium/low)
- Memory leak patterns identified: X patterns documented
- Ada 2012 modernization opportunities: Y recommendations

**Knowledge Transfer**:
- Team members trained: 100% attendance at training session
- Documentation published: Ada guide, GNAT optimization, Phase 2 strategy

---

#### Week 3+ Roadmap

**Ongoing Responsibilities**:
- Code review for all Ada changes (pair with @refactor_agent)
- Advisory role during Phase 2 GIOP/TypeCode refactoring
- Performance profiling and optimization
- Memory leak investigation and resolution
- Ada-specific test strategy (work with @Test_Automation_Engineer)

**Phase 2 Involvement** (Weeks 3-10):
- Hands-on refactoring of complex Ada modules
- Tasking refactoring (protect against race conditions)
- Generic refactoring (maintain elaboration order)
- GNAT runtime optimization

---

#### Key Relationships

**Works closely with**:
- @code_architect: Phase 2 refactoring strategy, architecture decisions
- @refactor_agent: Code review, pair programming on complex Ada modules
- @Test_Automation_Engineer: Ada test strategy, AUnit best practices
- @Performance_Engineer: Ada performance profiling, optimization validation

**Escalation Path**:
- Ada compiler/runtime issues: GNAT community or AdaCore support
- CORBA protocol questions: @code_architect (PolyORB architecture)
- Urgent blockers: @Implementation_Coordinator

---

### 5. @Performance_Engineer

#### Role Overview

**Purpose**: Establish performance baselines, validate RDB-002/RDB-003 performance goals (↓30% complexity, ↓20% latency), and implement performance regression detection

**Why Needed**: Current K8s resource limits are guesses (70% confidence). RDB success depends on performance validation but no baseline data exists. Performance regression detection is critical for zero-regression guarantee.

**Reports to**: @test_stabilize (performance validation as part of zero-regression)

**Collaborates with**: @DevOps_Engineer (K8s metrics), @Test_Automation_Engineer (performance test integration)

---

#### Skills & Expertise Required

**Core Performance Skills**:
- Load testing tools: **k6** (preferred), Locust, JMeter
- Application profiling: perf, gprof, Valgrind, GNAT profiler
- Benchmarking and metrics collection
- Performance analysis and bottleneck identification
- Latency analysis (P50, P95, P99 percentiles)
- Throughput testing (requests/sec, transactions/sec)

**Monitoring & APM**:
- Prometheus metrics and PromQL queries
- Grafana dashboard creation
- Distributed tracing (Jaeger, Zipkin)
- APM tools (New Relic, Datadog, or open-source alternatives)

**Infrastructure Knowledge**:
- Kubernetes resource management (CPU, memory limits)
- Linux performance tuning
- Network performance analysis
- Database query optimization

**Statistical Analysis**:
- Performance regression detection algorithms
- Statistical significance testing
- Outlier detection
- Trend analysis

**Nice to Have**:
- Chaos engineering (stress testing)
- Capacity planning
- Cache optimization
- Microservices performance patterns

---

#### Onboarding Materials

**Pre-Reading (Complete before Day 1)** - 2 hours:
1. **RDB-002**: Performance goals (test suite <5 min, P95/P99 latency targets)
2. **RDB-003**: Performance success criteria (↓30% complexity, ↓20% latency)
3. **K8s Manifests**: Resource limits in `k8s/base/` (current guesses)
4. **Grafana Dashboard Spec**: `GRAFANA-DASHBOARD-SPEC.md` (performance panels)

**Day 1 Onboarding Call** - 1 hour:
- **Attendees**: @test_stabilize, @code_architect, @DevOps_Engineer
- **Agenda**:
  - Performance goals and success criteria (15 min)
  - 16 microservices architecture and critical paths (20 min)
  - Current performance unknowns (resource usage, latency) (15 min)
  - Week 2 priorities: baselines and k6 setup (10 min)

**Access & Credentials**:
- Kubernetes dev cluster (metrics access)
- Prometheus instance
- Grafana (edit access for performance dashboards)
- GitHub repository (write access for k6 scripts)
- Slack: #testing-infrastructure-modernization

**Dev Environment Setup**:
```bash
# Install k6
brew install k6  # macOS
# OR
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Install profiling tools
brew install valgrind  # macOS (limited support)
sudo apt-get install valgrind linux-tools-generic  # Linux

# Clone repository
git clone https://github.com/org/polyorb-refactor.git
cd polyorb-refactor

# Verify k6 installation
k6 version
```

---

#### Week 2 Tasks (Priority Order)

**Monday (Day 1): Baseline Metrics Collection** - 8 hours

**Task 1.1**: Identify critical performance paths (2 hours)
- Review 16 microservices and identify top 5 critical paths:
  - User authentication flow
  - Payment processing
  - Widget rendering
  - GIOP request handling
  - TypeCode marshalling
- Document expected usage patterns (requests/sec, concurrency)
- **Acceptance**: Critical paths documented with usage estimates

**Task 1.2**: Deploy services to K8s dev (2 hours)
- Work with @DevOps_Engineer to ensure services deployed
- Verify health checks passing
- Check Prometheus scraping metrics from all services
- **Acceptance**: All 16 services running, metrics visible in Prometheus

**Task 1.3**: Establish current baseline (4 hours)
- Use Prometheus to collect current metrics:
  - CPU usage per service (avg, P95, P99)
  - Memory usage per service (avg, max)
  - Request latency (P50, P95, P99)
  - Throughput (requests/sec)
  - Error rate (%)
- Document baseline in spreadsheet/dashboard
- **Acceptance**: Baseline metrics documented for all 16 services

---

**Tuesday (Day 2): k6 Load Testing Setup** - 8 hours

**Task 2.1**: k6 installation and basic script (2 hours)
- Install k6 on local machine and CI environment
- Create first k6 script for widget-core service:
  ```javascript
  import http from 'k6/http';
  import { check, sleep } from 'k6';

  export let options = {
    vus: 10,  // Virtual users
    duration: '30s',
  };

  export default function () {
    let res = http.get('http://widget-core.refactor-dev.svc.cluster.local:50051/health');
    check(res, { 'status was 200': (r) => r.status == 200 });
    sleep(1);
  }
  ```
- Run script locally and validate
- **Acceptance**: k6 script runs successfully, results displayed

**Task 2.2**: k6 scripts for critical paths (4 hours)
- Create k6 script for each of 5 critical paths
- Include realistic scenarios:
  - Ramp-up pattern (0 → 100 users over 2 min)
  - Sustained load (100 users for 5 min)
  - Spike test (100 → 500 users suddenly)
- Define success criteria (P95 latency < X ms, error rate < Y%)
- **Acceptance**: 5 k6 scripts created, tested locally

**Task 2.3**: k6 results analysis (2 hours)
- Run k6 scripts against dev environment
- Analyze results:
  - Identify bottlenecks (which service is slowest?)
  - Find resource constraints (CPU/memory maxed out?)
  - Detect errors or timeouts
- Document findings
- **Acceptance**: k6 results analyzed, bottlenecks identified

---

**Wednesday (Day 3): Resource Limit Validation** - 8 hours

**Task 3.1**: Load test with current resource limits (4 hours)
- Run k6 load tests with current K8s resource limits
- Monitor Prometheus during load:
  - Are services hitting CPU limits?
  - Are services hitting memory limits?
  - Are pods being OOMKilled?
  - Are HPA scaling rules triggered correctly?
- Document findings
- **Acceptance**: Resource limit validation complete, issues documented

**Task 3.2**: Optimize resource limits (3 hours)
- Based on load test results, recommend new resource limits:
  - CPU: increase/decrease for each service
  - Memory: increase/decrease for each service
  - HPA thresholds: adjust based on actual usage
- Update K8s manifests with data-driven limits
- **Acceptance**: Updated manifests with optimized resource limits

**Task 3.3**: Re-test with new limits (1 hour)
- Deploy services with new resource limits
- Re-run k6 load tests
- Validate improvements (better performance, no OOMKills)
- **Acceptance**: Services perform better with optimized limits

---

**Thursday (Day 4): Performance Regression Detection** - 8 hours

**Task 4.1**: Define regression thresholds (2 hours)
- Based on RDB-002/RDB-003 goals, define regression thresholds:
  - P95 latency increase: ≤+10% (fail if higher)
  - P99 latency increase: ≤+15% (fail if higher)
  - Throughput decrease: ≤-5% (fail if lower)
  - Error rate increase: ≤+1% (fail if higher)
- Document thresholds in CI configuration
- **Acceptance**: Regression thresholds defined and documented

**Task 4.2**: CI integration for k6 (4 hours)
- Work with @DevOps_Engineer to add k6 to CI pipeline:
  ```yaml
  - name: Run k6 performance tests
    run: k6 run --out json=results.json tests/k6/widget-core.js
  - name: Check performance regression
    run: python scripts/check_regression.py results.json baseline.json
  ```
- Create regression check script (compare current vs. baseline)
- Fail CI if regression detected
- **Acceptance**: k6 runs in CI, regression detection working

**Task 4.3**: Performance regression alerts (2 hours)
- Set up Grafana alerts for performance degradation:
  - P95 latency exceeds baseline by 10%
  - Memory usage exceeds 90% of limit
  - Error rate exceeds 1%
- Connect alerts to Slack (#testing-infrastructure-modernization)
- **Acceptance**: Alerts configured and tested (trigger test alert)

---

**Friday (Day 5): Documentation & Week 2 Summary** - 8 hours

**Task 5.1**: Performance dashboard creation (3 hours)
- Create Grafana dashboard for performance metrics:
  - Latency trends (P50, P95, P99) over time
  - Throughput trends (requests/sec)
  - Resource usage (CPU, memory) per service
  - Error rate trends
  - Comparison: current vs. baseline
- **Acceptance**: Dashboard created, accessible to team

**Task 5.2**: Performance testing guide (3 hours)
- Document how to:
  - Run k6 tests locally
  - Interpret k6 results
  - Update baseline after approved changes
  - Investigate performance regressions
- Include examples and troubleshooting tips
- **Acceptance**: Guide published, shared with team

**Task 5.3**: Week 2 performance summary (2 hours)
- Compile Week 2 performance metrics:
  - Baseline established: ✓ (16 services documented)
  - k6 load tests created: ✓ (5 critical paths)
  - Resource limits optimized: ✓ (data-driven adjustments)
  - Regression detection: ✓ (CI integration complete)
  - Confidence level: 70% → 90%
- Recommendations for Week 3+
- Prepare demo for retrospective
- **Acceptance**: Performance summary shared with @test_stabilize

---

#### Success Metrics (Week 2)

**Primary Metrics**:
- [ ] Performance baseline established for all 16 services
- [ ] k6 load tests created for 5 critical paths
- [ ] K8s resource limits optimized (data-driven)
- [ ] Performance regression detection in CI
- [ ] Performance dashboard deployed in Grafana

**Performance Baselines Documented**:
- Latency: P50, P95, P99 for each service
- Throughput: Requests/sec for each service
- Resource usage: CPU/memory actual vs. limits
- Error rates: Baseline error rates under load

**Confidence Improvement**:
- K8s resource limit confidence: 70% → 90%
- Performance goal confidence (↓20% latency): Baseline established, ready to measure

---

#### Week 3+ Roadmap

**Ongoing Responsibilities**:
- Monitor performance trends (weekly review)
- Investigate performance regressions (within 24 hours of detection)
- Optimize slow services (target P95 latency reductions)
- Capacity planning (predict resource needs for production)
- Performance testing for new features

**Phase 2 Validation** (Weeks 5-12):
- Validate ↓30% complexity goal (cyclomatic complexity reduction)
- Validate ↓20% latency goal (P95 latency comparison)
- Validate memory leak elimination (long-running load tests with Valgrind)

---

#### Key Relationships

**Works closely with**:
- @test_stabilize: Performance validation as part of zero-regression guarantee
- @DevOps_Engineer: K8s metrics, resource optimization, CI integration
- @Test_Automation_Engineer: Performance test integration with test suite
- @code_architect: Performance goals and architecture optimization

**Escalation Path**:
- Performance goal clarification: @test_stabilize, @code_architect
- CI/CD integration issues: @DevOps_Engineer
- Infrastructure constraints: @DevOps_Engineer
- Urgent performance regressions: @Implementation_Coordinator

---

### 6. @Security_Automation_Specialist

#### Role Overview

**Purpose**: Implement automated security tooling including memory safety pre-commit hooks, SAST/DAST scanners, secret scanning automation, and security CI/CD gates

**Why Needed**: @code_architect identified memory safety pre-commit hook as highest ROI automation (100x faster feedback). Week 1 specifies secret scanning but needs hands-on implementation. Security automation shifts security left (catch issues before they reach production).

**Reports to**: @security_verification (security strategy), @test_stabilize (Week 1 execution)

**Collaborates with**: @DevOps_Engineer (CI/CD integration), @code_architect (security requirements)

---

#### Skills & Expertise Required

**Core Security Automation Skills**:
- **Memory safety tools**: AddressSanitizer, Valgrind, ThreadSanitizer
- **Secret scanning**: TruffleHog, GitLeaks, detect-secrets
- **SAST tools**: Semgrep, CodeQL, Bandit (Python), ESLint security plugins
- **DAST tools**: OWASP ZAP, Burp Suite (scriptable)
- **Container security**: Trivy, Grype, Docker Bench Security
- **Pre-commit hooks**: pre-commit framework, custom hook development

**CI/CD Security Integration**:
- GitHub Actions security workflows
- GitLab CI security scanning
- Security gate policies (fail builds on critical issues)
- Security reporting and dashboarding

**Additional Skills**:
- Security baseline management
- False positive triage and exception management
- Security metrics and KPI tracking
- Compliance scanning (OWASP, CWE, CVE)

**Nice to Have**:
- Infrastructure as Code security (Checkov, tfsec)
- Supply chain security (SBOM, dependency scanning)
- Runtime security monitoring (Falco)
- Security training and awareness

---

#### Onboarding Materials

**Pre-Reading (Complete before Day 1)** - 2 hours:
1. **RDB-002 Week 1**: Secret scanning requirements (TruffleHog + GitLeaks)
2. **Security Checkpoint**: `SRN-002_RDB-002_Week4_Checkpoint.md` (Week 4 validation)
3. **Security Config**: `security/` directory (TruffleHog, GitLeaks configs)
4. **CI Pipeline**: `configs/ci-fast-fail-pipeline.yml` (secret scanning integration points)

**Day 1 Onboarding Call** - 1 hour:
- **Attendees**: @security_verification, @test_stabilize, @DevOps_Engineer
- **Agenda**:
  - Security goals and compliance requirements (15 min)
  - Week 1 secret scanning priorities (15 min)
  - Memory safety pre-commit hook (highest ROI) (15 min)
  - Week 4 security checkpoint prerequisites (10 min)
  - Q&A (5 min)

**Access & Credentials**:
- GitHub repository (write access for security configs)
- CI/CD runner access (GitHub Actions)
- Secret scanning tools (TruffleHog, GitLeaks API access if applicable)
- Trivy for container scanning
- Slack: #testing-infrastructure-modernization

**Dev Environment Setup**:
```bash
# Clone repository
git clone https://github.com/org/polyorb-refactor.git
cd polyorb-refactor

# Install security tools
brew install trufflesecurity/trufflehog/trufflehog
brew install gitleaks
brew install trivy
pip install pre-commit detect-secrets

# Install AddressSanitizer (usually part of compiler)
# Clang/LLVM includes ASan
clang --version  # Verify Clang installed

# Verify installations
trufflehog --version
gitleaks version
trivy --version
pre-commit --version
```

---

#### Week 2 Tasks (Priority Order)

**Monday (Day 1): Secret Scanning Baseline** - 8 hours

**Task 1.1**: TruffleHog baseline scan (3 hours)
- Run TruffleHog on entire repository:
  ```bash
  trufflehog git file://. --only-verified --json > trufflehog-baseline.json
  ```
- Review findings:
  - How many secrets detected?
  - Are they true positives or false positives?
  - Which secrets need rotation?
- Document findings in `security/trufflehog-baseline-report.md`
- **Acceptance**: Baseline scan complete, report documented

**Task 1.2**: GitLeaks baseline scan (3 hours)
- Run GitLeaks on entire repository:
  ```bash
  gitleaks detect --source . --report-path gitleaks-baseline.json
  ```
- Review findings and compare with TruffleHog
- Create `.gitleaks.toml` config with exceptions for false positives
- **Acceptance**: Baseline scan complete, config created

**Task 1.3**: Secret rotation (if needed) (2 hours)
- If any real secrets detected:
  - Rotate immediately (work with @security_verification)
  - Document rotation in security log
  - Verify new secrets not in repository
- If no secrets: Document "0 secrets detected" baseline
- **Acceptance**: All real secrets rotated, baseline clean

---

**Tuesday (Day 2): Secret Scanning CI Integration** - 8 hours

**Task 2.1**: TruffleHog CI integration (3 hours)
- Add TruffleHog to CI pipeline (already in `ci-fast-fail-pipeline.yml`):
  ```yaml
  - name: TruffleHog Secret Scan
    run: |
      trufflehog git file://. --only-verified --fail
  ```
- Configure to run in fast-fail Stage 1 (target: <10s)
- Test on branch with fake secret (should fail)
- **Acceptance**: TruffleHog runs in CI, blocks PRs with secrets

**Task 2.2**: GitLeaks CI integration (3 hours)
- Add GitLeaks to CI pipeline:
  ```yaml
  - name: GitLeaks Secret Scan
    run: |
      gitleaks detect --source . --verbose --no-git --config .gitleaks.toml
  ```
- Configure to use `.gitleaks.toml` (exceptions for false positives)
- Test on branch with fake secret
- **Acceptance**: GitLeaks runs in CI, respects exceptions

**Task 2.3**: Secret scanning documentation (2 hours)
- Document secret scanning process:
  - How to add exceptions for false positives
  - How to rotate secrets if detected
  - Escalation path if secrets found
- Update README with secret scanning section
- **Acceptance**: Documentation complete and shared

---

**Wednesday (Day 3): Pre-Commit Hooks** - 8 hours

**Task 3.1**: Pre-commit framework setup (2 hours)
- Install pre-commit framework in repository:
  ```bash
  pip install pre-commit
  pre-commit install
  ```
- Create `.pre-commit-config.yaml`:
  ```yaml
  repos:
    - repo: https://github.com/trufflesecurity/trufflehog
      rev: v3.63.0
      hooks:
        - id: trufflehog
          args: ['--only-verified']
    - repo: https://github.com/gitleaks/gitleaks
      rev: v8.18.0
      hooks:
        - id: gitleaks
  ```
- **Acceptance**: Pre-commit hooks installed and configured

**Task 3.2**: Test pre-commit hooks (2 hours)
- Create test commit with fake secret
- Verify pre-commit hook blocks commit
- Test with legitimate code (should allow commit)
- Document pre-commit hook behavior
- **Acceptance**: Hooks block secrets, allow clean code

**Task 3.3**: Team pre-commit rollout (4 hours)
- Document pre-commit setup instructions for team
- Create onboarding guide: "How to set up pre-commit hooks"
- Post announcement in Slack
- Help team members install hooks (pair sessions if needed)
- **Acceptance**: All team members have pre-commit hooks installed

---

**Thursday (Day 4): Memory Safety Pre-Commit Hook (HIGH ROI)** - 8 hours

**Task 4.1**: AddressSanitizer local script (4 hours)
- Create pre-commit hook script: `.git/hooks/pre-commit-asan.sh`
  ```bash
  #!/bin/bash
  # Get changed C++ files
  CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(cpp|cc|c)$')

  if [ -z "$CHANGED_FILES" ]; then
    exit 0  # No C++ files changed
  fi

  # Compile with AddressSanitizer
  for FILE in $CHANGED_FILES; do
    echo "Running AddressSanitizer on $FILE..."
    clang++ -fsanitize=address -g -O1 -fno-omit-frame-pointer $FILE -o /tmp/asan_test
    if [ $? -ne 0 ]; then
      echo "AddressSanitizer detected issues in $FILE"
      exit 1
    fi
  done

  echo "AddressSanitizer: No issues detected"
  exit 0
  ```
- Test on sample C++ files (with and without memory issues)
- Optimize for speed (target: <30 seconds)
- **Acceptance**: ASan hook works, blocks memory issues

**Task 4.2**: Integrate ASan with pre-commit framework (2 hours)
- Add ASan hook to `.pre-commit-config.yaml`:
  ```yaml
  - repo: local
    hooks:
      - id: addresssanitizer
        name: AddressSanitizer (C++)
        entry: .git/hooks/pre-commit-asan.sh
        language: script
        files: \.(cpp|cc|c)$
  ```
- Test on C++ changes
- **Acceptance**: ASan runs automatically on C++ commits

**Task 4.3**: ASan documentation and rollout (2 hours)
- Document ASan pre-commit hook:
  - What it does (catches memory issues pre-commit)
  - How to interpret errors
  - How to fix common memory issues
- Share with team, especially C++ developers
- **Acceptance**: Documentation complete, team aware

---

**Friday (Day 5): Container Security & Week 2 Summary** - 8 hours

**Task 5.1**: Trivy container scanning (3 hours)
- Add Trivy to CI pipeline for Docker images:
  ```yaml
  - name: Trivy Container Scan
    run: |
      trivy image --severity HIGH,CRITICAL myregistry/widget-core:latest
  ```
- Scan existing Docker images
- Document findings (CVEs, vulnerable dependencies)
- Create remediation plan for critical/high vulnerabilities
- **Acceptance**: Trivy scans containers in CI, reports vulnerabilities

**Task 5.2**: Security metrics dashboard (3 hours)
- Create Grafana dashboard for security metrics:
  - Secrets detected over time (should be 0)
  - Memory issues caught by ASan (pre-commit + CI)
  - Container vulnerabilities (critical/high/medium/low)
  - Security scan execution time
- **Acceptance**: Dashboard created, visible to team

**Task 5.3**: Week 2 security summary (2 hours)
- Compile Week 2 security metrics:
  - Secret scanning: ✓ (TruffleHog + GitLeaks in CI)
  - Pre-commit hooks: ✓ (secrets + ASan)
  - Container scanning: ✓ (Trivy in CI)
  - Security baseline: ✓ (0 secrets detected)
  - Memory safety feedback: 20 min (CI) → 30 sec (pre-commit) = 40x improvement
- Recommendations for Week 3+
- Prepare demo for retrospective
- **Acceptance**: Security summary shared with @security_verification

---

#### Success Metrics (Week 2)

**Primary Metrics**:
- [ ] Secret scanning in CI (TruffleHog + GitLeaks)
- [ ] Pre-commit hooks deployed (secrets + ASan)
- [ ] Memory safety pre-commit hook (ASan) operational
- [ ] Container scanning (Trivy) in CI
- [ ] Security baseline established (0 secrets)

**Security Automation Coverage**:
- Secret detection: 100% of commits scanned
- Memory safety: 100% of C++ commits checked
- Container vulnerabilities: 100% of Docker images scanned
- False positive rate: <10% (well-tuned exceptions)

**Feedback Speed Improvement**:
- Memory issues: 20 min (CI) → 30 sec (pre-commit) = **40x faster**
- Secret detection: Prevented pre-commit (not post-push)

---

#### Week 3+ Roadmap

**Ongoing Responsibilities**:
- Maintain security scanning tools (update signatures)
- Triage false positives (refine exceptions)
- Monitor security metrics dashboard
- Investigate security findings within 24 hours
- Security awareness training for team

**Additional Security Automation** (Weeks 3-8):
- SAST integration (Semgrep for code quality + security)
- Dependency scanning (Dependabot, Renovate)
- Infrastructure as Code security (Checkov for K8s manifests)
- Runtime security monitoring (Falco for K8s)
- Compliance reporting (OWASP, CWE, CVE tracking)

---

#### Key Relationships

**Works closely with**:
- @security_verification: Security strategy, compliance requirements, findings triage
- @DevOps_Engineer: CI/CD integration, container security
- @code_architect: Security requirements in RDBs
- All developers: Pre-commit hook support, security awareness

**Escalation Path**:
- Critical security findings: @security_verification (immediate)
- False positives: @security_verification (within 24 hours)
- CI/CD integration issues: @DevOps_Engineer
- Urgent blockers: @Implementation_Coordinator

---

## Summary: All 6 Agent Roles

### Tier 1 (Add Week 1 - Immediate Priority)

1. **@DevOps_Engineer**: Docker, K8s, CI/CD implementation - Unblocks infrastructure execution
2. **@Implementation_Coordinator**: Project management, dependency tracking - Prevents "The Stall"
3. **@Test_Automation_Engineer**: Jest, GoogleTest, Pact implementation - Executes test strategy

### Tier 2 (Add Week 2 - High Value)

4. **@Ada_Language_Expert**: Phase 2 GIOP/TypeCode expertise - Prevents Ada-specific bugs
5. **@Performance_Engineer**: Baselines, k6, regression detection - Validates performance goals
6. **@Security_Automation_Specialist**: ASan hooks, secret scanning, SAST/DAST - Shifts security left

### Expected Impact

**With all 6 agents**:
- Team velocity: **3x improvement**
- Execution confidence: 30% → 85%
- Zero-regression confidence: 65% → 90%
- K8s resource confidence: 70% → 90%

### Total Investment

**Week 1**: 3 agents × 40 hours = 120 hours
**Week 2**: 3 agents × 40 hours = 120 hours
**Total Week 1-2**: 240 hours of specialist work

**Return on Investment**:
- Shift from planning to execution mode
- Prevent "The Stall" (weeks of planning paralysis)
- Data-driven decisions (baselines, metrics)
- Automated quality gates (security, performance, tests)
- Team confidence increase: 30% → 85%

---

**Next Steps**: Review agent specifications, approve for onboarding, and begin Tier 1 recruitment (Week 1 starts immediately)

---

**Document prepared by**: @test_stabilize
**Date**: November 6, 2025
**Status**: READY FOR APPROVAL
**Approval needed from**: @heathdorn00
