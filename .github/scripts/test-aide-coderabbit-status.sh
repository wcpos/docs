#!/usr/bin/env bash
set -euo pipefail

WORKFLOW_FILE='.github/workflows/aide-coderabbit-status.yml'

if [[ ! -f "$WORKFLOW_FILE" ]]; then
  echo "Expected guarded Aide CodeRabbit status workflow to exist: $WORKFLOW_FILE" >&2
  exit 1
fi

if ! grep -Fq 'pull_request:' "$WORKFLOW_FILE"; then
  echo "Expected workflow to run on pull_request events for same-repo Aide PRs" >&2
  exit 1
fi

for permission in 'contents: read' 'pull-requests: read' 'statuses: write'; do
  if ! grep -Fq "$permission" "$WORKFLOW_FILE"; then
    echo "Expected $WORKFLOW_FILE to declare permission: $permission" >&2
    exit 1
  fi
done

if ! grep -Fq 'context=CodeRabbit' "$WORKFLOW_FILE"; then
  echo "Expected workflow to publish the required CodeRabbit commit status context" >&2
  exit 1
fi

if grep -Fq 'name: CodeRabbit' "$WORKFLOW_FILE"; then
  echo "Expected workflow to publish a commit status context, not a duplicate Actions check named CodeRabbit" >&2
  exit 1
fi

if ! grep -Fq 'wcpos-bot[bot]' "$WORKFLOW_FILE"; then
  echo "Expected workflow to limit the bypass to WCPOS Bot PRs" >&2
  exit 1
fi

if ! grep -Fq 'feat(aide): update docs translations' "$WORKFLOW_FILE"; then
  echo "Expected workflow to require the automated Aide translation PR title" >&2
  exit 1
fi

if ! grep -Fq 'aide/docs-translations-' "$WORKFLOW_FILE"; then
  echo "Expected workflow to require the automated Aide translation branch prefix" >&2
  exit 1
fi

if ! grep -Fq 'BASE_REF' "$WORKFLOW_FILE" || ! grep -Fq "main" "$WORKFLOW_FILE"; then
  echo "Expected workflow to require main as the PR base branch" >&2
  exit 1
fi

if ! grep -Fq 'i18n/' "$WORKFLOW_FILE"; then
  echo "Expected workflow to limit the bypass to docs translation files under i18n/" >&2
  exit 1
fi

if ! grep -Fq 'publish_status failure' "$WORKFLOW_FILE"; then
  echo "Expected invalid automated PRs to publish a failing CodeRabbit status" >&2
  exit 1
fi

if grep -Fq 'actions/checkout' "$WORKFLOW_FILE"; then
  echo "Expected workflow not to checkout PR code while deciding whether to bypass CodeRabbit" >&2
  exit 1
fi

if grep -Fq '@coderabbitai review' "$WORKFLOW_FILE"; then
  echo "Expected workflow not to rely on bot-authored CodeRabbit comments" >&2
  exit 1
fi

echo "Aide CodeRabbit status workflow is guarded to trusted docs translation PRs only"
