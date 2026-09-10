---
name: fleet-build
description: Implement one agent-ready Linear engineering contract, verify it, and open a pull request without merging.
---

# Fleet Build

## Purpose

Implement exactly one approved Linear engineering contract.

The builder writes code. It does not redefine scope and never merges.

## Preconditions

Before changing code:

1. Fetch the referenced Linear issue.
2. Confirm it is `agent-ready`.
3. Confirm it is not `blocked`.
4. Read all acceptance criteria and non-goals.
5. Inspect the current repository.
6. Ensure the base repository is clean.
7. Fetch current `origin/main`.
8. Create or use an isolated issue branch/worktree.

If any precondition fails, stop.

## Scope discipline

Implement only what is required to satisfy the contract.

Do not:

- opportunistically refactor unrelated code;
- rename unrelated files;
- upgrade unrelated dependencies;
- rewrite architecture for preference;
- add features not requested;
- silently resolve ambiguous scope.

If ambiguity affects behavior or architecture, block and escalate.

## Execution environment

Codex owns code inspection and editing only. Run Codex with the
`workspace-write` sandbox. Codex must not invoke Docker, access the Docker
daemon, use `danger-full-access`, or bypass its sandbox.

The Hermes builder wrapper owns project execution. It runs dependency
installation, project code, tests, linting, and builds inside the approved
isolated Docker environment.

Do not execute untrusted project code directly against the host when an isolated environment is available.

Project execution, tests, linting, and builds run with network egress disabled
by default (`--network none`).

Dependency acquisition is a separate phase. Prefer cached/offline dependencies.
If dependency acquisition requires network access, use only the repo's
human-approved dependency-fetch policy. Do not silently enable network access.
If no approved policy permits the required access, block and escalate.

After dependency acquisition, perform verification in a fresh network-disabled
project execution environment.

## Implementation loop

1. Inspect relevant code.
2. Make the smallest coherent change.
3. Run targeted verification.
4. Fix failures caused by the implementation.
5. Repeat until the contract is satisfied.

## Verification

Use the repository's actual scripts and tooling.

Where applicable, run:

- type checking;
- linting;
- relevant tests;
- production build.

Never report a check as passed unless it ran successfully.

Do not hide failing checks.

## Git

- Work only on the issue branch/worktree.
- Keep commits relevant to the issue.
- Push the issue branch.
- Open a pull request.
- Never merge.

## Pull request scope ledger

The PR must map every acceptance criterion to evidence.

Format:

### Contract

Linear: `<ISSUE-ID>`

### Acceptance criteria

- AC1 — PASS/FAIL
  - Evidence:
- AC2 — PASS/FAIL
  - Evidence:

### Non-goals

- NG1 — preserved
- NG2 — preserved

### Verification

- `<command>` — PASS/FAIL
- `<command>` — PASS/FAIL

### Files / architecture

Concise summary of material changes.

### Known limitations

List any remaining limitation, or `None`.

## Review handoff

Record the exact PR head SHA.

That SHA is the object the reviewer must inspect.

If the SHA changes after review feedback, review must run again.
