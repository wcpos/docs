---
description: "Fill missing WCPOS docs translations and open or update the docs-translate PR"
argument-hint: "[--dry-run] [--locale L]... [--translator codex|claude] [--model M] [--max-units N]"
---

Run the local docs translation pipeline.

```bash
scripts/translate-docs-local.sh $ARGUMENTS
```

The script decides deterministically whether there is anything to do, so do not
translate docs yourself in this session. It works in its own worktree
(`.claude/worktrees/docs-translate`) and never touches this checkout.

1. Run the command from the repository root. With no work it exits 0 after
   "nothing to translate", and there is nothing more to do.
2. Otherwise it delegates each packet to the chosen model CLI (default: Codex
   `gpt-6-luna`, reviewed by `gpt-6-sol`; `--translator claude` uses Claude Sonnet
   for both), applies the results through `scripts/docs-translation/apply.js`,
   commits and validates, then pushes and opens a PR labelled `docs-translate`
   (or comments on the open one). Refresh and state-only work needs no model call.
3. Report back with the PR URL, the applied/rejected/warning counts from the script's
   output, and any rejected units. Rejected units stay untranslated and are
   retried on the next run.
4. On a non-zero exit, show the last 30 lines of output and the packet logs in
   `.claude/worktrees/docs-translate/.translate/logs/`. Do not rerun more than once.

Use `--dry-run` to see the work summary without calling a model.
