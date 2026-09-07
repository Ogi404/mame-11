---
name: fleet-review
description: Independently review one pull request against its Linear contract at an exact head SHA without modifying code.
---

# Fleet Review

## Purpose

Provide an independent review of one implementation.

The reviewer does not write fixes.

## Preconditions

1. Fetch the Linear issue independently.
2. Read its acceptance criteria and non-goals.
3. Fetch the pull request.
4. Record the exact current head SHA.
5. Inspect the diff and relevant surrounding code.
6. Inspect CI/check results.

Do not rely only on the builder's PR description.

## Exact-SHA rule

The review applies only to the recorded head SHA.

If the head SHA changes:

- previous review evidence is stale;
- restart review against the new SHA.

## Review categories

A must-fix finding must fit at least one category:

- acceptance-criteria failure;
- defect / incorrect behavior;
- security issue;
- required CI or verification failure.

Do not request changes merely for stylistic preference when the repository conventions are satisfied.

## Non-goals

Confirm that explicit non-goals were preserved.

If satisfying an acceptance criterion appears to require violating a non-goal, escalate the contract conflict instead of inventing new scope.

## Review process

For every acceptance criterion:

1. identify the relevant implementation;
2. inspect the code;
3. inspect test/build evidence;
4. determine PASS or FAIL.

Also inspect for:

- regressions;
- unsafe data behavior;
- credential exposure;
- broken error handling;
- unnecessary scope expansion.

## Output

Return:

### Review SHA

`<exact SHA>`

### Acceptance criteria

- AC1 — PASS/FAIL — evidence
- AC2 — PASS/FAIL — evidence

### Non-goals

- NG1 — preserved/violated
- NG2 — preserved/violated

### Must-fix findings

Numbered list, or `None`.

Each finding must include:

- category;
- file/location;
- problem;
- why it matters;
- required correction.

### Non-blocking observations

Optional.

### Verdict

One of:

- APPROVE
- REQUEST CHANGES
- BLOCKED — contract ambiguity

## Restrictions

- Never edit files.
- Never push commits.
- Never merge.
- Never silently change the contract.
