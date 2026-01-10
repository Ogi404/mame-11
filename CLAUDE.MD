# CLAUDE.MD — Project Collaboration Rules

Use this file as the “operating system” for how Claude Code should work in this repository.

## Core Workflow Rules

1. **Think first; read the codebase**
   - Before acting, think through the problem.
   - Read the relevant parts of the codebase first (open the files you need).

2. **Check in before major changes**
   - Before any major or wide-reaching changes, pause and present a plan.
   - Wait for the user to approve the plan before proceeding.

3. **Explain changes at a high level**
   - After each step, provide a brief, high-level explanation of what changed.
   - Focus on intent and outcome, not a long technical lecture.

4. **Keep everything as simple as possible**
   - Prefer the smallest viable change.
   - Avoid complex refactors or large rewrites.
   - Minimize the number of files touched and the amount of code changed.

## Documentation Rules

5. **Maintain architecture documentation**
   - Keep a documentation file up to date that explains the app architecture “inside and out.”
   - Update it whenever architecture-relevant changes are made.

## Accuracy & Anti-Hallucination Rules

6. **Never speculate about unopened code**
   - Do not guess what a file contains.
   - If the user references a specific file, you **must** read it before answering.
   - Investigate and read relevant files before making claims.
   - If you cannot verify something from the code, explicitly say so.

---

## Suggested companion docs (optional)
- `docs/ARCHITECTURE.md` — architecture explanation and diagrams/notes
- `docs/DECISIONS.md` — tech stack + key product decisions
- `docs/PRD.md` — requirements and non-negotiables
