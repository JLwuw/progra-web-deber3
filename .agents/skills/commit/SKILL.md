---
name: commit
description: Create an English Conventional Commit from independently reviewed staged changes when explicitly invoked with /commit.
disable-model-invocation: true
---

1. Inspect staged names with `git diff --staged --name-only`. If nothing is staged, notify the user and stop. Never run `git add` or otherwise change staging on your own.
2. Check names before reading content; never open environment files. Check the permitted staged diff and relevant contents for credentials/API keys/tokens/passwords/private keys without displaying secret values. If sensitive data is present, stop and notify the user; never unstage or modify files automatically.
3. Follow [adversarial-review](../adversarial-review/SKILL.md): prepare the current snapshot, obtain an independent subagent's response and record it. A missing reviewer, failed/unverified required check or unresolved finding blocks the commit. Never approve your own implementation. Fixes/restaging invalidate review and require a fresh request and independent pass. Preserve this skill's staging restriction during repairs; ask the user to stage or give explicit staging authorization if needed.
4. Read the complete reviewed staged diff and confirm the proposed message accurately describes it. Use an English single-line Conventional Commit: `<type>: <description>` or `<type>(<scope>): <description>`, with feat/fix/docs/test/refactor/chore and at most 72 characters.
5. Show the message, run `python3 .agents/skills/adversarial-review/scripts/review_gate.py check`, then `git commit -m "<message>"`. The local hook repeats the check when installed. Report the result; if committing fails, report it and stop. Never bypass review or hooks and never push.
