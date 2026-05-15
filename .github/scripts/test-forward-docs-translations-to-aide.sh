#!/usr/bin/env bash
set -euo pipefail

WORKFLOW_FILE='.github/workflows/forward-docs-translations-to-aide.yml'

if [ ! -f "$WORKFLOW_FILE" ]; then
  echo "Expected workflow to exist: $WORKFLOW_FILE" >&2
  exit 1
fi

if grep -Fq 'wait-for-openclaw-task.js' "$WORKFLOW_FILE"; then
  echo "Docs forwarding workflow must not poll Aide tasks; docs translations are long-running AI work." >&2
  exit 1
fi

if grep -Fq 'TRANSLATION_STATUS_TOKEN' "$WORKFLOW_FILE"; then
  echo "Docs forwarding workflow should not require the status polling token." >&2
  exit 1
fi

if ! grep -Fq 'OpenClaw accepted docs translation job' "$WORKFLOW_FILE"; then
  echo "Docs forwarding workflow should validate and print the accepted OpenClaw job id." >&2
  exit 1
fi

echo "Docs forwarding workflow dispatches to Aide without polling timeouts"
