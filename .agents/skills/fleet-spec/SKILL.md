---
name: fleet-spec
description: Turn an engineering request into an implementation-ready Linear contract without changing code.
---

# Fleet Spec

## Purpose

Produce or refine an engineering contract that a builder can execute without guessing.

Linear is the authoritative contract layer.

This workflow does not implement code.

## Required inputs

- target Linear team/project;
- engineering request or existing issue;
- relevant repository;
- current product/architecture context.

## Workflow

1. Read the existing Linear issue if one exists.
2. Inspect relevant repository context before making architectural claims.
3. Identify ambiguity, dependencies, risks, and conflicts.
4. Define the smallest coherent implementation scope.
5. Write explicit acceptance criteria.
6. Write explicit non-goals.
7. Identify required verification.
8. Identify any human-only actions such as deployment or destructive migration.
9. Do not mark work `agent-ready` while material ambiguity remains.

## Acceptance criteria requirements

Acceptance criteria must be:

- observable;
- testable;
- specific enough that a reviewer can determine pass/fail;
- limited to the approved scope.

Avoid criteria such as:

- "works well";
- "improve UX";
- "clean up code";
- "make it robust"

unless they are made objectively testable.

## Non-goals

State what the builder must deliberately not change.

Non-goals are part of the contract, not suggestions.

## Scope conflicts

If current repository reality conflicts with the requested change:

- describe the conflict;
- propose the smallest resolution;
- require clarification before making an irreversible assumption.

## Output

A contract suitable for Linear containing:

- Summary
- Context
- Acceptance Criteria
- Non-goals
- Technical constraints
- Verification requirements
- Dependencies / blockers
- Human-only actions, if any

Do not implement code.
