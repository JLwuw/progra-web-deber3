---
name: commit
description: Create an English Conventional Commit from staged changes when explicitly invoked with /commit.
disable-model-invocation: true
---

1. Read all staged changes with `git diff --staged` and inspect staged file names with `git diff --staged --name-only`.
2. If nothing is staged, notify the user and stop. Never run `git add` or otherwise change the staging area on your own.
3. Check staged file names and contents for sensitive data, including `.env`, `.env-local`, other environment files, credentials, API keys, tokens, passwords, and private keys. If any sensitive data is included, stop and notify the user without displaying secret values. Do not unstage or modify files automatically.
4. Write a single-line commit message in English using Conventional Commits: `<type>: <description>` or `<type>(<scope>): <description>`. Use only `feat`, `fix`, `docs`, `test`, `refactor`, or `chore`. Keep the entire message at most 72 characters and describe the staged changes accurately.
5. Show the message to the user, then run `git commit -m "<message>"`. Report the result. If the commit fails, report the failure and stop. Never push.
