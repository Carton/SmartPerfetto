# Testing Rules

## Proportionate Verification

Use the smallest applicable repository-defined tier below. Missing entrypoints
are `NOT CONFIGURED`; missing prerequisites are `NOT AVAILABLE`. Broaden or repeat
checks only for new changes, failures, unresolved risk or a required PR/release
gate. Reuse evidence while its files, dependencies, configuration and execution
environment are unchanged.

Add tests for observable behavior, regression boundaries and maintained
contracts. Avoid tests that only restate literals or implementation layout.
Before removing a case, identify its unique assertions and retain their coverage,
or establish that the feature no longer exists. Model capability is not evidence
that a runtime, privacy or release regression can no longer happen.

Review and simplify the task-owned diff before final validation. Use a scoped
simplification tool only for evident repetition/complexity or when requested;
manual review is sufficient otherwise. Preserve unrelated work and acceptance
evidence; `git diff --check` checks the final diff's whitespace.

## Default PR Gate

Before opening or landing a PR, run from the repository root:

```bash
npm run verify:pr
```

The root and backend `package.json` scripts define its checks: governance,
documentation/i18n, runtime assets, quality, Rust, Skill/Strategy validation,
typecheck/build, CLI packaging, registered test tiers and Trace regression.
Use the actual scripts for the current selection rather than duplicating it here.

## Hosted CI and Local Verification

Local `verify:pr` remains the complete pre-PR/landing gate and keeps every
registered backend suite reachable. GitHub Actions does not repeat that entire
chain on every commit. A local pass is evidence for its exact files, dependency
versions and environment; it does not replace a clean Linux install/build or
native checks on another OS. Never claim hosted acceptance from a local run.

| Where | Selection | Purpose |
| --- | --- | --- |
| Every PR and main push | Root `verify:ci`; backend `verify:ci` | Clean dependency install, governance/docs/i18n/runtime assets, quality, typecheck/build/CLI package, core lifecycle, authentication, privacy and output contracts |
| Relevant paths only | Rust checks, macOS/Windows governance/native helpers, Docker smoke | OS, native dependency, launcher and container boundaries that a local macOS run cannot establish |
| Local pre-PR/landing | Root `verify:pr` and affected owning tiers | Complete deterministic test chain, Trace/SQL accuracy, full runtime adapter suites, source semantic replay and scene regression |
| Manual Actions | `backend-agent-regression-gate.yml` with `full=true` | Hosted full backend gate plus Trace corpus regression and all environment jobs, when Linux reproduction or broader hosted evidence is needed |
| Local feature acceptance | Real-provider, browser/UI and performance checks | Credentials, real model behavior, rendered surfaces and target workloads; run the change-specific commands below |
| Release workflows | npm publication, version-tag Docker gate, exact-archive native smoke | Validate the exact published package/image/archive; local or fast PR evidence cannot replace these gates |

`scripts/ci-change-scope.cjs` reads the event diff and matches
`.github/ci-scopes.json`. The PR uses its test merge tree; push includes all
commits since `before`. Rename sources and destinations both count. Missing
history fails the workflow rather than silently skipping coverage. Manual and
first-push runs select all environments. There are no workflow-level PR path
filters; the stable `gate` aggregates required and optional job outcomes with
`always()` and rejects failures, cancellations and skipped mandatory jobs.
Automatic runs for the same PR/ref supersede earlier runs; manual runs are
independent. Native platform jobs do not repeat the Linux typecheck. Docker
nightly/manual builds use backend `verify:ci`; version-tag builds retain the
full backend `verify:pr` before publication.

Credential-filter functional cases stay in `test:ci-privacy`. The unchanged
large/pathological-input performance cases have their own
`test:secret-patterns:performance` suite, called by local `test:architecture`
and the manual full gate, so default CI does not repeat that stress workload.
CI subsets reuse existing suites; they do not become additional owners in the
local default chain. Keep full registration and fixture preparation intact.
After changing scope or gate wiring, run:

```bash
npm run check:test-registration
npm run verify:ci
npm --prefix backend run verify:ci
```

Compare the local `verify:pr` suite selection before/after. The scope and
workflow-result regressions are owned by root `test:governance`. A workflow edit
is not a hosted result: report local checks and the eventual Actions run
separately.

## Test Ownership and Registration

Every backend suite must be reachable from root `verify:pr`. Register a new
suite in its owning `test:*` tier, reachable from backend `test:gate`; a focused
script outside that chain does not provide default-gate coverage. Prefer one
owning tier per suite in the default chain to avoid repeated execution. Use a
directory-scoped tier when it selects only real suites without overlap; Jest's
`testMatch` also treats `.ts` files under `__tests__/` as suites, so helpers and
fixtures belong outside that pattern.

After adding, moving, deleting or changing test registration:

```bash
npm run check:test-registration
```

Run the owning tier during development. When reorganizing gate scripts, compare
before/after selection to confirm that retained suites stay reachable. The
registration checker recognizes `.test.ts`, `.spec.ts`, `.eval.ts` and
`_unittest.ts` under `backend/src/` and `backend/tests/`; it follows the npm script
chain from root `verify:pr`. `scripts/test-registration-baseline.json` stays
empty; any deliberately accepted debt needs an explicit justification rather
than silently expanding the baseline.

Jest/ts-jest transpiles isolated modules without type-checking. `npm run typecheck`
in `backend/` checks source and tests together via `tsconfig.typecheck.json`,
including unused locals/parameters; build excludes test emit. Use `export type`
for type-only re-exports and `_` for unused framework-required parameters.

Trace-dependent evals belong in `test:analysis-accuracy`, which materializes the
corpus. `getTestTracePath` resolves real traces or constructed base-plus-overlay
cases. `describeWithTrace` fails on unknown/missing fixtures. Assert the fixture's
expected result; do not skip absent data or accept both success and failure.

## Production Reachability

A passing suite over unused code is not product acceptance. When removing call
sites, modules or exports, run the owning tests and:

```bash
npm run check:orphaned-modules
npm run check:unused-exports
```

The first checks module reachability from registered production/tool entrypoints,
including orphan-only cycles. Tests cannot keep a module alive; an unregistered
maintainer script is not an entrypoint. Register retained tools explicitly, keep
fixtures under `backend/tests/` and barrels limited to consumed exports.

The second uses production symbol resolution: exports used only by tests are
unused. Test-only exports that expose live internal behavior may use
`@internal`; that does not make an otherwise dead module reachable.
It also checks alignment of backend entrypoints with `knip.json`. Run it again
when orphan deletion changes which exports have live consumers.

The orphan/unused-export baselines record accepted debt, not verified behavior.
Shrink them by restoring production use or deleting dead code and its tests;
growing them requires justification. `test:unit-sweep` owns suites without a
more specific tier; do not also register them in a default-chain focused tier.

## Verification by Change Type

| Change type | Required verification |
| --- | --- |
| Docs-only, not runtime-read | `git diff --check`; use `npm run verify:docs` for maintained doc links/commands, `npm run verify:i18n` for changed bilingual structure, and relevant governance tests when changing rule/adapter contracts |
| Test tier/registration wiring | `npm run check:test-registration`, compare before/after selected suites and preparation/execution dependencies, and run affected owning tiers; apply the relevant fixture or SQL gate when those dependencies or coverage change |
| Removing a call site, an export or a module | `npm run check:orphaned-modules`, `npm run check:unused-exports`, plus the owning `test:*` tier |
| Docs that define commands, release/package workflow, or runtime-read paths | `git diff --check` plus the smallest command/path smoke that proves the doc did not drift |
| Build/type fix | `cd backend && npm run typecheck` plus affected tests |
| Contract/type-only change | `cd backend && npm run typecheck` plus relevant contract tests |
| CRUD-only service, no agent/runtime path | That service's `__tests__/<name>.test.ts` |
| MCP, memory, report, provider, session, or agent runtime | `cd backend && npm run test:scene-trace-regression` |
| HTML report rendering, saved report controls or layout | Owning report tests and `npm run test:e2e:reports`; it builds the backend and uses the pinned Perfetto UI Playwright dependencies plus installed Chrome to check all templates, narrow layouts, CSP downloads, offline reopening and printing. Artifacts are written under `output/playwright/html-reports/` |
| Raw SQL capture units or native processor provenance | `npm --prefix backend run test:raw-sql-provenance` plus affected parser, worker lifecycle, RPC and capture tests; this gate ensures the pinned binary and materializes the Trace fixture |
| Skill YAML | `cd backend && npm run validate:skills` plus scene trace regression |
| Strategy/template Markdown | `cd backend && npm run validate:strategies` plus scene trace regression |
| Trace corpus, Skill/Strategy coverage, or generator | `npm run trace:regression`; it includes `npm run trace:tooling:test` plus generated-corpus build and SQL execution |
| SQL-bearing Skill or SQL regression/preparation gate wiring | `cd backend && npm run trace:sql-regression`; `npm run verify:pr` includes this gate |
| Frontend generated types | `cd backend && npm run generate:frontend-types` plus relevant tests |
| AI plugin UI | Browser verification in `start-dev.sh`, relevant `perfetto/ui` tests/typecheck, then `./scripts/update-frontend.sh` |
| Self-Evolution control plane | `npm --prefix backend run test:self-evolution`, `npm --prefix backend run typecheck`, and scene trace regression; add the AI plugin UI gate when the panel changes. That script covers RBAC/scope isolation, disabled and dependency fail-closed cases, and fixed validation + holdout replay selection. It is wired into `test:gate`, so `npm run verify:pr` runs it too |
| Agent-assisted external issue reporting | `npm --prefix backend run test:external-issue-reporting`, `npm --prefix backend run typecheck`, strategy validation, scene trace regression, AI plugin typecheck/unit tests, browser verification in `start-dev.sh`, and `./scripts/update-frontend.sh`; verify private/security fail-closed and that no GitHub write occurs |
| Perfetto upstream sync, trace processor pin, SQL/stdlib index, or committed UI prebuild | Follow `.claude/rules/perfetto-sync.md`; normally `git diff --check`, `npm run check:frontend-prebuild`, `npm --prefix backend run cli:e2e`, scene trace regression, submodule remote reachability, and Skill/Strategy validation when those files changed |
| Code-aware analysis, codebase registry, source ingestion, symbol resolution, source-use decisions/bindings, or CodeRef report/export | `npm --prefix backend run verify:codebase-aware`, `npm --prefix backend run test:source-claim-contract`, `npm --prefix backend run test:report-contracts`, `npm --prefix backend run verify:code-aware-semantic-delta`, plus `npm run verify:pr` before landing |
| npm CLI package/release | `npm --prefix backend run cli:pack-check` plus isolated install smoke |
| Portable-impacting code or packaging | Focused launcher/packaging tests, shell and Node syntax/static checks, launcher cross-compile, full package build, package manifest verification, and `npm run verify:pr` before landing; exact-archive target-OS runtime smoke is additionally required for a public release |

## npm CLI Release Verification

When changing CLI packaging, bin entrypoints, CLI runtime assets, Node engine
rules, or npm release docs, run:

```bash
npm --prefix backend run cli:pack-check
```

For a public npm release, additionally verify the published package from an
empty temp directory:

```bash
npm install @gracker/smartperfetto@<version>
./node_modules/.bin/smp --version
./node_modules/.bin/smartperfetto --help
./node_modules/.bin/smp doctor --format json
```

## Portable Packaging Verification

When changing portable packaging, release scripts, version synchronization,
trace-processor handling, bundled runtime assets, or docs that define
the release process, run:

```bash
bash -n scripts/package-portable.sh scripts/release-portable.sh scripts/package-windows-exe.sh scripts/release-windows-exe.sh
shellcheck -x scripts/package-portable.sh scripts/release-portable.sh scripts/package-windows-exe.sh scripts/release-windows-exe.sh
node --check scripts/sync-version.cjs scripts/verify-portable-package.cjs scripts/verify-windows-package.cjs scripts/smoke-portable-archive.cjs
npm run version:sync -- --check
GO111MODULE=off go test ./scripts/portable-launcher
GO111MODULE=off GOOS=windows GOARCH=amd64 go build -o /tmp/smartperfetto-launcher.exe ./scripts/portable-launcher
GO111MODULE=off GOOS=darwin GOARCH=arm64 go build -o /tmp/SmartPerfetto-macos ./scripts/portable-launcher
GO111MODULE=off GOOS=linux GOARCH=amd64 go build -o /tmp/SmartPerfetto-linux ./scripts/portable-launcher
npm run package:portable
node scripts/verify-portable-package.cjs \
  --asset "dist/portable/smartperfetto-v<version>-windows-x64.zip" \
  --target windows-x64 \
  --version "<version>" \
  --commit "$(git rev-parse HEAD)" \
  --require-clean
node scripts/verify-portable-package.cjs \
  --asset "dist/portable/smartperfetto-v<version>-macos-arm64.zip" \
  --target macos-arm64 \
  --version "<version>" \
  --commit "$(git rev-parse HEAD)" \
  --require-clean
node scripts/verify-portable-package.cjs \
  --asset "dist/portable/smartperfetto-v<version>-linux-x64.tar.gz" \
  --target linux-x64 \
  --version "<version>" \
  --commit "$(git rev-parse HEAD)" \
  --require-clean
```

For a clean public release, the package manifest must contain
`gitDirty: false` and `gitCommit` equal to the release target commit. If testing
the release script without uploading, use a fake `gh` shim or a draft release;
do not rely on `--allow-dirty` for public release validation.
Manifest schema v3 records the pinned `traceProcessor.sourceSha256` separately
from the post-signing packaged `traceProcessor.sha256`; the verifier must bind
the latter to the binary extracted from the exact archive.
The bundled Node runtime version, archive filename, archive SHA-256, and final
executable-content digest must exactly match `scripts/node-runtime-pin.env`.
For macOS, the digest normalizes only code-signature-dependent Mach-O fields
so Developer ID re-signing cannot hide changed executable content. Packaging
must not resolve a moving `latest-v24.x` input.

Cross-compilation, archive verification, and static signature checks do not
prove target-platform startup. During code/PR work, report those results as
contract/package verification. For a public portable release, additionally
apply the exact-asset runtime gate below.

## Exact Portable Archive Runtime Gate

Build once from the exact clean release commit. On Windows, macOS, and Linux,
extract the final archive that will be uploaded into a fresh temporary
directory and test those exact bytes. macOS must use the zip recreated after
notarization and stapling. Do not rebuild an archive after it passes this gate.

Run this command once per target on the matching OS/architecture:

```bash
node scripts/smoke-portable-archive.cjs \
  --asset "<final-archive>" \
  --target "<windows-x64|macos-arm64|linux-x64>" \
  --version "<version>" \
  --commit "<release-commit>" \
  --public-release \
  --output-dir "dist/portable/smoke-evidence/<target>"
```

The command must reject host/target mismatches. Its static phase must reject
absolute paths, traversal, cross-platform name collisions, symlinks, hard
links, non-regular extracted entries, AppleDouble/macOS metadata entries, and
any archive-tool diagnostics before trusting package contents. A Linux
`tar.gz` built on macOS must therefore be free of PAX xattr records as observed
by target-native GNU tar listing and extraction, not merely clean in its
pre-archive staging tree. The verifier must enforce pre-extraction archive
byte/entry/expanded-size/ratio budgets and listing/extraction deadlines.
`--output-dir` must be a fresh path; never overwrite earlier smoke evidence.
For local pre-commit runtime validation only, `--allow-dirty` may omit the
clean-tree requirement. It must be incompatible with `--public-release`, and
its evidence must never be accepted for promotion.

Each target smoke must:

1. Re-verify manifest version, `gitCommit`, `gitDirty: false`, target, and
   bundled Node.js 24 from the extracted archive. Scan every packaged ELF or
   Mach-O and require its GLIBC/minimum-system version to fit the manifest and
   Info.plist declaration.
2. Start the bundled launcher with isolated data/log directories and
   non-conflicting ports.
3. Poll backend and frontend health through explicit
   `http://127.0.0.1:<port>/health`; do not use `localhost` as release evidence.
   The smoke probe must bypass environment proxies through a target-supported
   standard library HTTP client fixed to IPv4 loopback. Windows uses the
   repository-owned Go gate helper built from the immutable gate commit
   by the native job with the workflow-pinned Go toolchain. It is a separate
   gate process, not a release asset. Its `net/http` probe must disable proxies,
   redirects, compression, DNS fallback, and non-loopback dial targets; accept
   only the validated URL and bounded timeout as arguments; and enforce strict
   response-byte and wall-clock limits. The Node gate must validate that the
   configured probe path is an absolute regular non-symlink `.exe`, pass a
   sanitized environment, and terminate the process on cancellation or a hard
   deadline. If direct child termination does not settle, invoke trusted
   `System32\taskkill.exe /T /F` and fail within a second bounded deadline
   unless process closure is confirmed. The same helper must use the native
   Toolhelp32 process snapshot API for descendant evidence; it must not invoke
   PowerShell, CIM, WMI, or release-archive code. Snapshot output must be
   bounded and canonical, include the helper's own PID as a completeness
   sentinel, and fail closed on empty, malformed, duplicate, partial, timed
   out, or non-zero helper results. The Windows native job must test, build,
   and execute the real fixed helper health and process contracts before
   testing the archive.
   macOS and Linux use Node's HTTP client with a private keep-alive agent per
   attempt and destroy the agent, request, response, and socket on every
   terminal path. All clients must enforce strict URL, response-byte,
   process-output, and wall-clock budgets, and cancel and settle the peer
   probe before launcher shutdown after any readiness failure. Record the
   target-required client identifier in schema-v2 evidence and reject evidence
   produced by another client. Do not maintain a release-only HTTP parser that
   diverges from the launcher, browsers, and normal clients.
4. Execute the bundled Node.js, Claude, and OpenCode version commands when
   present, then run a minimal packaged `trace_processor_shell` operation.
5. Use the launcher-supported shutdown control, require a zero/successful and
   non-escalated shutdown receipt with platform containment
   (`windows-job-object` or `service-process-groups`), and verify child
   processes and listening ports are gone. Keep process-tree traversal in the
   Node gate; the Windows helper emits only a strict full PID/PPID snapshot so
   its own gate process cannot be mistaken for a launcher descendant.
6. Preserve launcher/backend/frontend logs on failure.
7. Atomically write a schema-v2 `smoke-summary.json` that binds the target-native host,
   lifecycle receipt, and exact archive name, size, and SHA-256. Public release
   promotion must re-hash the same archive and reject stale or edited evidence.

For hosted smoke, the fixed gate checkout owns and executes the smoke client
and evidence verifier. The immutable draft metadata and downloaded archive
provide the release identity and product bytes; the native job must not create
or execute a release checkout. Preserve the gate SHA and release commit as
separate trust roots throughout planning, native execution, collection,
attestation, and promotion.

For the final macOS archive, also require:

```bash
codesign --verify --deep --strict --verbose=2 SmartPerfetto.app
xcrun stapler validate SmartPerfetto.app
spctl --assess --type execute -vv SmartPerfetto.app
xcrun notarytool info <submission-id> \
  --keychain-profile "$SMARTPERFETTO_MACOS_NOTARY_PROFILE"
```

The notarization result must be `Accepted` and preserved as the minimal
`NOTARIZATION-RECEIPT.json` in the exact final archive, the ticket must be
stapled, Gatekeeper must report `Notarized Developer ID`, and the extracted app
must actually reach both health endpoints. The package verifier must
independently check every Mach-O signature and required Node/Claude JIT
entitlements; signing must not depend on file extension or executable mode.

Use native or hosted target runners when local machines are unavailable. If a
required runner cannot execute the exact archive, keep the GitHub release as a
draft. Publishing with a known gap requires explicit user acceptance and must
name the untested target; static verification is not a substitute.

The hosted entry point is
`.github/workflows/portable-exact-archive-smoke.yml`. Dispatch it only from the
default branch and pass the numeric draft release ID. Its gate checkout is
fixed to the dispatch SHA. The plan separately binds the draft's full target
SHA (or the peeled tag commit once the tag exists), which must be an ancestor
of the gate; the native job does not check out that commit. A fixed-gate
download job fetches each target by immutable asset ID with native binary I/O,
verifies size and digest, then re-fetches and re-binds the release. It
preserves those opaque bytes as a short-lived Actions artifact; only then does
the native smoke job restore and execute them. The smoke matrix must override
default skipped-needs propagation:
one target's failed download may fail that target, but must not suppress native
smoke and diagnostic evidence for targets whose exact asset artifacts exist.
GitHub currently requires `contents: write` for its Actions token to read a
draft release and download draft assets. That grant must remain job-local to
the prepare, download, and collect jobs; checkout must use
`persist-credentials: false`, and `GH_TOKEN` is scoped only to trusted
fixed-gate REST GET/download steps. The native smoke job must have at most
`contents: read` and must never share a job with a write-capable repository
token. A fresh collect job must fetch the unchanged draft before downloading
target evidence, then use the fixed gate commit—without passing it a token—to
validate each public smoke summary, release/asset identity, runner/run
provenance, and prepared workflow context before changing the context to
`verified`. The tested release code must never receive the write credential.

`selection=windows-linux` and single-target selections produce partial
diagnostic evidence and are never promotion evidence. Only a successful
`selection=all` run can set `publicReleaseEligible: true`; it must include the
signed, notarized, stapled macOS final zip. Per-target artifacts keep separate
target roots, and the collect job preserves both failures and a combined
attestation. The combined artifact exposes normalized
`promotion-evidence/<target>/smoke-summary.json` and
`workflow-context.json` only for targets whose release ID, asset ID, summary
digest, runner host, gate SHA, and run identity all match. Hosted promotion
must pass that downloaded `promotion-evidence/`, the sibling
`portable-smoke-attestation.json`, and the producing run ID to
`release:portable`. The promotion verifier re-fetches repository metadata, the
completed Actions run, and the uniquely named combined artifact. It must bind
the repository ID and default branch to GitHub's response, require the run gate
SHA to equal the clean promotion checkout, verify GitHub's artifact SHA-256
against the downloaded zip, and byte-compare the local evidence with the
digest-verified artifact.

For changes to this gate, run at minimum:

```bash
node --check scripts/portable-release-smoke-workflow.cjs
node --check scripts/download-portable-release-asset.cjs
node --check scripts/verify-portable-smoke-attestation.cjs
node --check scripts/smoke-portable-archive.cjs
GO111MODULE=off go test ./scripts/portable-health-probe
GO111MODULE=off GOOS=windows GOARCH=amd64 go build -trimpath \
  -ldflags="-s -w" -o /tmp/smartperfetto-windows-gate-helper.exe \
  ./scripts/portable-health-probe
node --test scripts/__tests__/portable-release-smoke-workflow.test.mjs \
  scripts/__tests__/smoke-portable-archive.test.mjs \
  scripts/__tests__/verify-portable-smoke-evidence.test.mjs \
  scripts/__tests__/release-portable.test.mjs
bash -n scripts/release-portable.sh
shellcheck scripts/release-portable.sh
```

## Canonical Scene Regression

Run:

```bash
cd backend
npm run test:scene-trace-regression
```

The regression uses 6 canonical traces:

| Scene | Trace |
| --- | --- |
| Heavy launch | `lacunh_heavy.pftrace` |
| Light launch | `launch_light.pftrace` |
| Standard scrolling | `scroll_Standard-AOSP-App-Without-PreAnimation.pftrace` |
| Customer scrolling | `scroll-demo-customer-scroll.pftrace` |
| Flutter TextureView | `Scroll-Flutter-327-TextureView.pftrace` |
| Flutter SurfaceView | `Scroll-Flutter-SurfaceView-Wechat-Wenyiwen.pftrace` |

The aliases above resolve through `Trace/catalog.json`; maintained source must not add paths to the retired flat fixture directory. The default backend gate runs `trace:sql-regression`, which materializes committed overlays without the Perfetto source submodule and executes every discovered Skill SQL contract through the production path, explicit read-only/context probes, or isolated state-changing branch probes, and runs every exact unit (each `exact_sql`, and the own SQL of each target step that binds the UPID through `native_upid` or `effective_target_processes`, from `executableSqlUnits`, in every Skill the executor admits to an exact run) through the production path under the exact UPID of a uniquely named process its expectation binds (`exact_scope`), checking that its rows depend on that UPID alone (`.claude/rules/skills.md`). Skipped or unavailable SQL, and an exact unit with no binding, fail the gate. Full generator/release verification is `npm run trace:regression`. It runs the registered Trace tooling tests before generated-corpus build and SQL execution. Its report keeps source-column-backed positive semantic coverage, expected-empty negative coverage, deferred prerequisites, execution-only composition, definition-only contracts, and exact_sql semantic versus execution-only units separate; inventory assignment alone is not an execution or semantic pass.

## HTTP Test Listeners

Use `backend/tests/helpers/loopbackServer.ts` for owned Supertest HTTP servers.
Await `fixture.listen(app)` before passing the returned server to Supertest,
then await `fixture.close()` after stopping owned streams/sessions and before
restoring environment variables or removing fixture directories. Inline application factories
must also await listener readiness. Preserve explicit native WebSocket/TCP
listeners and their existing cleanup.

Do not pass an unbound Express application directly to Supertest. Its implicit
`app.listen(0)` can bind IPv6 while its client always connects to `127.0.0.1`.
On macOS, an existing IPv4 listener can own that same port and receive the
request. The shared fixture binds IPv4 explicitly and rejects occupied ports;
its registered regression also verifies response identity and port release.

## Test Data Isolation

Persistence fixtures must use an owned temporary directory and the relevant
database/data-path overrides. Never delete or clear the default user database.
Set overrides before importing modules that capture paths or create stores;
declare singleton variables during collection and initialize them in hooks.
Stop owned sessions/streams and close owned listeners and database stores before
restoring the environment and removing the fixture directory. If cleanup fails,
keep the directory rather than deleting files held by a live connection.

## Focused Unit Tests

Useful focused suites:

```bash
cd backend
npx jest src/agentRuntime/__tests__/runtimeSelection.test.ts
npx jest src/agentOpenAI/__tests__/openAiConfig.test.ts src/agentOpenAI/__tests__/openAiRuntime.test.ts src/agentOpenAI/__tests__/openAiToolAdapter.test.ts
npx jest src/assistant/application/__tests__/agentAnalyzeSessionService.test.ts
npx jest src/services/__tests__/canonicalAnalysisResult.test.ts src/services/__tests__/finalResultQualityGate.test.ts
npx jest src/services/verifier/__tests__/claimVerificationRunner.test.ts src/services/__tests__/analysisResultSnapshotStore.test.ts
npx jest src/cli-user/services/__tests__/cliAnalyzeService.runTurn.test.ts src/cli-user/services/__tests__/cliAnalyzeService.test.ts
npx jest src/services/providerManager/__tests__/providerService.test.ts src/services/providerManager/__tests__/providerRoutes.test.ts
npm run test:runtime-resilience
```

Use the result-quality suites when changing final report contract enforcement,
result canonicalization, evidence/claim verification, identity resolution,
analysis-result snapshots, CLI turn persistence, or visible-vs-report
projection behavior.

## Runtime Concurrency And Latency Admission

Concurrency changes must prove the serial default and each explicitly admitted
branch. Run the focused default-off/admitted-on gate from `backend/`:

```bash
npm run test:runtime-registry
npx jest --runInBand --forceExit \
  src/scripts/__tests__/runQuickAgentE2eWrapper.test.ts \
  src/agentRuntime/__tests__/runtimeCandidateAdmission.test.ts \
  src/agentRuntime/__tests__/runtimeToolConcurrency.test.ts \
  src/agentRuntime/__tests__/runtimeToolConcurrencyAdapters.test.ts \
  src/agentv3/__tests__/claudeRuntimeRuntimeSnapshots.test.ts \
  src/agentOpenAI/__tests__/openAiRuntime.test.ts \
  src/agentRuntime/__tests__/piAgentCoreRuntime.test.ts \
  src/agentRuntime/__tests__/openCodeRuntime.test.ts \
  src/agentRuntime/engines/qoder/__tests__/qoderRuntime.test.ts \
  src/scripts/__tests__/benchmarkAgentRuntimeLatency.test.ts
npx jest --runInBand --forceExit \
  src/services/__tests__/traceProcessorLeaseProcessorRouting.test.ts \
  src/services/__tests__/traceProcessorSqlWorker.test.ts \
  src/services/__tests__/workingTraceProcessor.enterpriseIsolation.test.ts
npm run typecheck
npm run build
```

These suites must cover absent/invalid admission, admitted behavior,
cancellation/late settle, cache failure retry, same-processor SQL serialization,
tool fallback receipts, and all five adapter projections. Also run
`npm run test:analysis-accuracy`; before a PR use the normal `npm run verify:pr`
gate rather than substituting this focused list.

`SMARTPERFETTO_ADMITTED_RUNTIME_CANDIDATES` admits only `task4` through `task9`
and defaults to none. Unknown, duplicate, whitespace-bearing, empty, or malformed
values must fail closed as a whole. `SMARTPERFETTO_SAFE_TOOL_CONCURRENCY=false`
may roll admitted `task5` back to exclusive execution but must not activate it.
Keep tools exclusive by default and same-trace/processor SQL on one worker.

For an admissible real benchmark, a reviewed lifecycle controller must provide
two distinct loopback targets, separate fresh data roots/sessions, target
identity/config/source hashes, pair reset receipts, cold/warm ordering, a
candidate fingerprint, and an output nonce. The output path must be new and
inside the Git-ignored `backend/test-output/runtime-concurrency/` tree:

```bash
npm run benchmark:agent-latency -- \
  --base-url http://127.0.0.1:10000 \
  --candidate-url http://127.0.0.1:10001 \
  --runtime openai-agents-sdk \
  --candidate task6 \
  --candidate-config-fingerprint <lowercase-hex-fingerprint> \
  --output-run-nonce <lowercase-hex-nonce> \
  --output-dir test-output/runtime-concurrency/<fresh-run> \
  --lifecycle-receipt /absolute/path/to/lifecycle-receipt.json
```

Omitting `--candidate`, its fingerprint, nonce, and lifecycle receipt is an
availability diagnostic only. It makes no target calls, produces no admission,
and exits non-successfully for admission. A run without the verified lifecycle
receipt remains serial/inconclusive. Targets must be explicit `http` loopback
origins with ports; redirects, credentials, remote hosts, reused output, and
symlinked output paths fail closed.

Admission requires no semantic/evidence/identity/quality-gate regression plus
either at least 15% median total improvement or at least 30% improvement in the
candidate's mapped target phase. A latency regression is material only when it
is both greater than 5% and greater than 250 ms. Real measurement uses three
paired repetitions and treats p95 as inconclusive; deterministic p95 requires
30 genuine-adapter repetitions. Synthetic scorer fixtures are non-admissible.

The internal `RunManifest.performance` receipt is not public SSE. Current SSE
does not provide admission-grade model, provider snapshot, usage, or performance
fields, so bounded real-provider admission remains `INCONCLUSIVE` until a
reviewed harness supplies them. Record missing real credentials/runtime as
`NOT AVAILABLE` or missing harness/configuration as `NOT CONFIGURED`; never
equate deterministic gates with authenticated E2E. Qoder BYOK also requires a
PAT or locally authenticated `qodercli`.

## Agent SSE E2E

Run Agent SSE e2e when changing startup, scrolling, Flutter, strategy prompt,
verifier, MCP tools, or scene-critical Skills.

Startup:

```bash
cd backend
npx tsx src/scripts/verifyAgentSseScrolling.ts \
  --trace ../Trace/real/android-startup-heavy/trace.pftrace \
  --query "分析启动性能" \
  --output test-output/e2e-startup.json \
  --keep-session
```

GLM Coding Plan native runtime startup final-report gate:

```bash
cd backend
GLM_API_KEY=... npm run verify:e2e:glm-startup
```

Qoder GLM Coding Plan BYOK startup gate (requires both the GLM Coding Plan provider key and
Qoder PAT or local `qodercli` login; BYOK does not replace Qoder auth):

```bash
cd backend
npm run qoder:install -- --accept-terms
GLM_API_KEY=... QODER_PERSONAL_ACCESS_TOKEN=... \
  npm run verify:e2e:qoder-glm-startup
```

When Qoder auth is unavailable, record this real-provider gate as unavailable;
do not treat unit/type/build/PR checks as an authenticated Qoder E2E result.

Agent SSE release validation uses the subscribed GLM Coding Plan. The canonical
wrapper is `backend/scripts/run-glm-agent-e2e.cjs`; it loads `backend/.env`, uses
`GLM_API_KEY` (compatible aliases: `GLM_CODING_API_KEY`, `ZAI_CODING_CN_API_KEY`),
and passes `--provider-id env` to ignore active Provider Manager profiles.
It never falls back to DeepSeek or a generic `OPENAI_API_KEY`.

- `GLM_BASE_URL=https://open.bigmodel.cn/api/coding/paas/v4`; the generic paid
  `/api/paas/v4` and other endpoint origins are refused.
- `GLM_MODEL=glm-5.3` and `GLM_LIGHT_MODEL=glm-5.3-flash`.
- CLI selections: `--provider zai-coding-cn --base-url <coding-plan URL>
  --model <GLM model> --light-model <GLM light model>`.
- OpenAI receives explicit `OPENAI_*` model/endpoint pins and
  `OPENAI_AGENTS_PROTOCOL=chat_completions`. Pi uses the installed
  `zai-coding-cn` catalog's native capabilities; OpenCode receives pinned GLM
  model JSON. Conflicting model JSON overrides are refused. A Pi override may
  add only an explicit top-level `thinkingLevel` to the complete pinned model
  JSON; the installed SDK's public supported-level list validates it. For
  example, `low` is accepted only when that model supports it. Provider, model,
  Coding Plan endpoint, credential variable and every catalog capability must
  remain identical. Omitting the field keeps provider-default main reasoning;
  the runner never selects `low` or `off` automatically.
- Provider-default main reasoning and native output limits remain unchanged.
  There is no implicit main-answer output cap; an explicit
  `OPENAI_MAX_OUTPUT_TOKENS` must be a positive safe integer.
- `all`/`all-glm` selects OpenAI, Pi and OpenCode for normal suites. Runs are
  sequential; when coordinating separate runs, use at most two runtimes at
  once to avoid subscription throttling.

The wrapper's `--timeout-ms` controls the outer SSE observation, not each model
request or the native run budget; its default remains 1200000 ms. Set an
explicit observation timeout that covers the actual configured run and its
finalization. OpenAI's progress-aware run can use up to
`OPENAI_MAX_RUN_TIMEOUT_MS` (default 3600000 ms), whereas Pi's fixed native
`SMARTPERFETTO_PI_AGENT_CORE_REQUEST_TIMEOUT_MS` / `AGENT_FULL_REQUEST_TIMEOUT_MS`
defaults to 1200000 ms. A longer observation changes neither native budget nor
strict acceptance; it cannot make a partial or timed-out result pass.

OpenCode also uses a fixed native deadline: full mode honors an explicit
`SMARTPERFETTO_OPENCODE_PROMPT_TIMEOUT_MS`, with 1200000 ms as the default.
Quick mode uses the smaller of that configured timeout and its existing
turn-count times `OPENCODE_QUICK_PER_TURN_MS` budget. The original absolute
deadline also bounds finalization; a longer full-mode configuration needs an
outer `--timeout-ms` that covers it without changing turn or proof requirements.

Keep keys in shell variables or ignored local env files. The old DeepSeek CLI
and npm names stop with a migration message; they never silently run GLM.
`npm run verify:e2e:openai-startup` selects the OpenAI adapter with GLM.

Scrolling:

```bash
cd backend
GLM_API_KEY=... npm run verify:e2e:glm-scrolling
```

Flagship startup + scrolling gate:

```bash
cd backend
GLM_API_KEY=... npm run verify:e2e:glm-flagship          # diagnostic, writes summaries
GLM_API_KEY=... npm run verify:e2e:glm-flagship:strict   # complete acceptance
```

Their expectations live in `backend/tests/e2e/flagship/*.expectation.json`
(passed as `--expectation-json @<path>`, never inline in the wrapper); facts
compare against independent trace oracles, `startup_type` included.
The startup-type oracle checks the platform's original classification. A
reclassifying Skill retains it as `original_type`; that explicit alias must
still match the oracle's value, startup time and process, not the Skill's
corrected category.
Strict startup acceptance requires its `captured.cell` proposition to be
verified, with complete coverage and matching proof anchors/reference cells.
The matcher reads original semantic subject references for both numeric and
categorical proof; `reference_only` remains a deliberately unproved value check.
The verifier separates three questions, so a report never reads "wrong" when
it means "unproved":

- `checkGroups.value`: is the answer right and delivered as a completed
  answer (intent, fact value bound to its cited cell and the oracle, claims
  and source not contradicted by this run's own finalization).
- `checkGroups.delivery`: did the run and report finish (completed event,
  non-partial, report not failed; a passed report only for report
  deliverables).
- `checkGroups.proof`: did the verification chain prove it
  (`originalClaimsVerified`, verified claims/source, `fact:<id>:proved`,
  claim-verifier checks).

Each fact records `tier: proved | value | none`. `semanticAcceptance` is
`FAILED` on any value or delivery failure, `INCONCLUSIVE` when only proof is
missing (`uncoveredFacets` names each unproved fact and proof check), and
`PASSED` only when all three hold. Without `--strict` the exit code follows
value, delivery, the hard flags (`--require-claim-verifier-ok`,
`--require-non-partial`) and the other observed checks; a proof gap alone
does not fail it. `--strict` requires `semanticAcceptance: PASSED` and every
hard flag. It measures complete verification acceptance; it does not decide
whether a readable analysis may be delivered. Ordinary PR/release acceptance
uses the applicable repository gates and exercises native completion, readable
body/report delivery and preserved, honestly labelled verification annotations
across the affected surfaces. Missing proof or a failed semantic review is
recorded separately and must never be reported as a strict pass. Real lifecycle,
authorization and privacy failures still fail their own gates. The flat `checks`
map stays the union of the groups plus
the earlier key names, so existing readers keep their meaning. A run with no
judged report (stream timeout, lifecycle failure, or a verifier whose loop
drained before a verdict, which exits 1 with `verification_unsettled`) is
undelivered: its flagship summary is `FAILED`, with the failure artifact's
`phase` and `errorCode` as `verificationFailure`.

Each flagship run writes `backend/test-output/e2e-baselines/<suite>[-<runtime>].json`
with a fingerprint (suite, runtime, trace SHA-256, query, expectation hash,
provider origin, model, commit, gate and claim-verifier schema versions,
trace-processor revision or binary hash, stdlib revision). `--delta-baseline
<summary.json|dir>` compares a new run against such a summary: every key but
the commit must match, and a missing, corrupt, incomplete or mismatched
baseline refuses the comparison and exits non-zero. A compared delta lists new
failures, fixes and unchanged checks, fact tier changes and the acceptance
change, marks a baseline older than 14 days as stale, and fails only on new
failures. It is regression evidence, never acceptance.

M10 Agent-assisted external issue triage:

```bash
cd backend
GLM_API_KEY=... npm run verify:e2e:glm-external-issue
```

This suite requires a persisted source-run provider snapshot, an actionable
deterministic signal, a validated live-Agent review, and either an unsubmitted
GitHub draft or an Agent decision that intentionally blocks public drafting.
The verifier creates that deterministic signal inside its isolated user-data
root by posting a negative conclusion rating through the production feedback
API before requesting the opportunity; it does not inject a synthetic signal
or write to GitHub.
Also verify in browser that a durable public thumbs-down refreshes the same
message into an explicit Agent-triage opportunity without invoking the Agent
or opening GitHub automatically. It never calls the GitHub API.

Complete real-provider matrix:

```bash
cd backend
GLM_API_KEY=... npm run verify:e2e:glm
```

There is no automated real-provider Agent E2E workflow. Run the subscribed GLM
Coding Plan gate locally with ignored credentials; local results and GitHub
checks are separate evidence.

`npm --prefix backend run verify:e2e:stop-semantics -- --base-url http://127.0.0.1:<port>`
checks drafts, the provisional answer, review-only/full/forced stops and the
stored history and replay on both the agent route and the conversation API;
each check is `pass`, `legal_race`, `not_exercised` or `fail`. It starts
nothing: run it against a separately started isolated backend (own ports and
data/log/upload dirs) with a real provider.

Flutter TextureView and SurfaceView must be verified separately because their
rendering pipelines differ:

```bash
cd backend
npx tsx src/scripts/verifyAgentSseScrolling.ts \
  --trace "../Trace/real/flutter-scroll-texture-view/trace.pftrace" \
  --query "分析 Flutter 滑动性能" \
  --output test-output/e2e-flutter-textureview.json \
  --keep-session

npx tsx src/scripts/verifyAgentSseScrolling.ts \
  --trace "../Trace/real/flutter-scroll-surface-view/trace.pftrace" \
  --query "分析 Flutter 滑动性能" \
  --output test-output/e2e-flutter-surfaceview.json \
  --keep-session
```

Fast/full mode:

```bash
cd backend
npx tsx src/scripts/verifyAgentSseScrolling.ts \
  --mode fast \
  --trace ../Trace/real/android-scroll-customer/trace.pftrace \
  --query "这个 trace 的应用包名和主要进程是什么？" \
  --output test-output/e2e-fast.json

npx tsx src/scripts/verifyAgentSseScrolling.ts \
  --mode full \
  --trace ../Trace/real/android-scroll-customer/trace.pftrace \
  --query "分析滑动性能" \
  --output test-output/e2e-full.json
```

After e2e runs, inspect:

- `backend/test-output/e2e-*.json`
- `backend/logs/sessions/session_*.jsonl`
- SSE terminal event counts and error events
- Whether the final conclusion is supported by Skill/SQL evidence

`answerTokenCount` counts streamed SSE answer chunks, not provider tokens. The
current cross-runtime E2E artifact does not provide a common provider-reported
input/output/cache/reasoning-token, TTFT, or cost receipt. Treat mode/model cost
comparison as `NOT CONFIGURED` until those fields and the actual selected model
are recorded; a 21/21 functional matrix is not an accuracy or token benchmark.
For the Claude runtime alone, `npm --prefix backend run metrics:session-baseline --
--stage <label> --since-mins <n> --out <path>` aggregates the per-session
metrics it writes under `backend/logs/metrics/` (turns, tool calls, input and
cache-read tokens, reported cost) so two builds can be compared on the same
queries; other runtimes write no such file.

## Code-Aware Semantic Delta

The registered deterministic gate is:

```bash
npm --prefix backend run verify:code-aware-semantic-delta
```

It materializes the constructed source-analysis trace, runs the real trace
processor, exercises production registration/audit, on-demand and indexed
handlers, and verifies A0–A4 plus source-claim bindings. Its default artifact is
`backend/test-output/code-aware-semantic-delta/deterministic-summary.json`.
This is local deterministic evidence, not provider acceptance.

The command prepares the fixture and runs the semantic-delta replay.
`test:source-claim-contract` owns source-result attachment tests;
`test:report-contracts` owns source provenance across output surfaces. Run those
owning tiers when their contracts change; the default `test:gate` already runs
all three without repeating their suites.

With credentials safely available, run the separate repeated provider matrix:

```bash
node backend/scripts/run-glm-agent-e2e.cjs \
  --suite code-aware-semantic-delta \
  --runtime all-glm \
  --repeat 5
```

Report the subscribed GLM OpenAI, Pi and OpenCode results independently.
Claude and Qoder require explicit separate runs and authentication. Missing auth must
remain `REAL PROVIDER NOT AVAILABLE`; never replace it with a unit, fixture, or
deterministic five-runtime execution result.

## Eval Fixtures

Every skill-eval trace is a Trace corpus case: committed under `Trace/real/`, or
materialized from a committed overlay by `npm run trace:materialize`. There is
no optional fixture. `describeWithTrace(...)` fails, rather than skips, a suite
whose case is unknown or whose trace is missing; add a constructed case through
`Trace/tools` when an eval needs data no case carries.
