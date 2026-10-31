# Unit test agent

## Design

`test-agent/agent.py` is a custom Python agent using the OpenAI Responses API.
Its role is defined in `test-agent/AGENT.md`. Structured output and a read-only
file tool keep the controller small and its actions reviewable.

Reusable skills in `test-agent/skills/` cover change analysis, frontend tests,
backend tests and verification. The controller selects skills by changed paths
and supplies implementation, neighboring tests, types and helpers before generation.
The model can inspect additional files through `read_file`.

## Workflow and prerequisites

Enable GitHub Actions and configure the repository secret `TEST_AGENT_API_KEY`
with an OpenAI API key. The optional variable `TEST_AGENT_MODEL` defaults to
`gpt-4.1`. The controller must exist on the default branch before opening a PR.

`.github/workflows/unit-test-agent.yml` starts automatically for PR changes:

1. `baseline` runs tests and builds the PR code before applying a proposal.
2. `propose` analyzes the diff and proposes test changes or explains a skip.
3. `verify` applies the proposal to the exact PR head and repeats verification.

PR checks provide summaries, test counts and coverage. Artifacts contain logs,
`decision.json`, `proposal.json` and `tests.patch`, retained for seven days.
Generated changes require review and are not committed automatically.
Application and test commands are documented in [README.md](README.md).

## Security and reliability

Controller code and skills come from the PR base commit. The model key is present
only during generation; test execution runs in a separate job without it.
GitHub permissions are read-only and Actions are pinned to commit SHAs.

Path validation restricts writes to unit test files and rejects traversal,
symlinks and configuration changes. Context size, model turns and file reads
are bounded. Repository content and model responses are treated as untrusted data.
Failed checks, zero-test and all-skipped runs cannot pass verification.

## Example run

[PR #1](https://github.com/VitOR4321/cloudfide-rec/pull/1) adds a summary showing
the total, active and completed tasks in the current view.

[Workflow run 41218657257](https://github.com/VitOR4321/cloudfide-rec/actions/runs/41218657257)
used `gpt-4.1` with `analyze-changes`, `frontend-tests` and `verify-tests`.
The controller supplied six context files; no additional file-tool calls were made.

The agent selected `skip`: the corrected counter tests were already committed
before this run and covered counts and loading/error states. It proposed zero
files and produced an empty patch. This demonstrates analysis and a justified
skip, rather than successful generation of new tests.

| Check | Baseline | Verification |
| --- | --- | --- |
| Backend | 56 passed; 100% line coverage | 56 passed; 100% line coverage |
| Frontend | 58 passed; 85% line coverage | 58 passed; 85% line coverage |
| Controller | 21 passed | 21 passed |
| Frontend build | Passed | Passed |

No application tests failed or were skipped. Coverage did not change because
this run introduced no additional tests.

## Assumptions, limitations and production changes

Same-repository contributors are trusted. Fork PRs, drafts and Dependabot receive
baseline checks but skip model generation. Unit tests mock external dependencies;
browser tests require the application and PostgreSQL. Coverage uses the existing
exclusions, including backend models/schemas and the frontend design system.

This example does not demonstrate successful test generation or live backend
generation. Those require separate PRs containing behavior not already covered
by tests. The backend controller also has an offline integration fixture.

Proposals require human review. There is no automatic repair loop or coverage
gate. Production improvements would include isolated execution with egress
limits, spend quotas, transient-error retries, changed-line or mutation checks,
and a bounded repair loop preserving credential isolation.