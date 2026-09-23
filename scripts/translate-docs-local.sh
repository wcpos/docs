#!/bin/bash
set -euo pipefail

DEFAULT_TRANSLATOR=codex # Local subscription CLI used for translation and review.
CODEX_MODEL=gpt-6-luna # Codex translate pass, mechanical tier.
CLAUDE_MODEL=sonnet # Default model for Claude.
CODEX_REVIEW_MODEL=gpt-6-sol # Default model for Codex review pass.
CLAUDE_REVIEW_MODEL=sonnet # Default model for Claude review pass.
DEFAULT_EFFORT=medium # Codex reasoning effort.
MAX_UNITS=1500 # Units per run; the rest waits for the next run.
CALL_TIMEOUT=1800 # Seconds allowed for each translation or review call.

log() { printf '[translate-docs-local] %s\n' "$*"; }
fail() {
  log "FAILED: $*${WT+ (worktree: $WT, logs: $WT/.translate/logs)}"
  log "FAILED: $*${WT+ (worktree: $WT, logs: $WT/.translate/logs)}" >&2
  exit 1
}
trap 'fail "unexpected error at line $LINENO"' ERR
TRANSLATOR=${TRANSLATE_TRANSLATOR:-$DEFAULT_TRANSLATOR}
MODEL=${TRANSLATE_MODEL:-}
REVIEW_MODEL=${TRANSLATE_REVIEW_MODEL:-}
EFFORT=${TRANSLATE_EFFORT:-$DEFAULT_EFFORT}
BASE=main
DRY_RUN=0
REVIEW=1
WORKLIST_ARGS=(--out .translate/work --plan .translate/plan.json)
ORIGINAL_ARGS=("$@")
while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --no-review) REVIEW=0; shift ;;
    --base) BASE=$2; shift 2 ;;
    --locale) WORKLIST_ARGS+=(--locale "$2"); shift 2 ;;
    --translator) TRANSLATOR=$2; shift 2 ;;
    --model) MODEL=$2; shift 2 ;;
    --review-model) REVIEW_MODEL=$2; shift 2 ;;
    --effort) EFFORT=$2; shift 2 ;;
    --max-units) MAX_UNITS=$2; shift 2 ;;
    *) log "FAILED: unknown argument: $1"; log "FAILED: unknown argument: $1" >&2; exit 1 ;;
  esac
done
case "$TRANSLATOR" in
  codex) MODEL=${MODEL:-$CODEX_MODEL}; REVIEW_MODEL=${REVIEW_MODEL:-$CODEX_REVIEW_MODEL} ;;
  claude) MODEL=${MODEL:-$CLAUDE_MODEL}; REVIEW_MODEL=${REVIEW_MODEL:-$CLAUDE_REVIEW_MODEL} ;;
  *) log "FAILED: unknown translator: $TRANSLATOR"; log "FAILED: unknown translator: $TRANSLATOR" >&2; exit 1 ;;
esac
case "$MAX_UNITS" in
  ''|*[!0-9]*) log "FAILED: max-units must be a positive integer"; log "FAILED: max-units must be a positive integer" >&2; exit 1 ;;
esac
if [ "$MAX_UNITS" -eq 0 ]; then log "FAILED: max-units must be positive"; log "FAILED: max-units must be positive" >&2; exit 1; fi
PATH=/opt/homebrew/bin:$HOME/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH
export PATH
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_ROOT=${TRANSLATE_REPO_ROOT:-}
if [ -z "$REPO_ROOT" ]; then
  COMMON_DIR=$(git -C "$SCRIPT_DIR" rev-parse --path-format=absolute --git-common-dir)
  REPO_ROOT=$(dirname "$COMMON_DIR")
fi
git -C "$REPO_ROOT" fetch --quiet --prune origin
if [ -z "${TRANSLATE_LOCAL_REEXEC+x}" ]; then
  UPDATE=$(mktemp)
  if ! git -C "$REPO_ROOT" show "origin/$BASE:scripts/translate-docs-local.sh" >"$UPDATE" 2>/dev/null; then
    cp "$0" "$UPDATE"
  fi
  # Always use a private copy so mid-run edits cannot corrupt Bash's incremental reads.
  TRANSLATE_LOCAL_REEXEC=1 TRANSLATE_REPO_ROOT="$REPO_ROOT" exec /bin/bash "$UPDATE" ${ORIGINAL_ARGS[@]+"${ORIGINAL_ARGS[@]}"}
fi
mkdir -p "$REPO_ROOT/.claude"
LOCK="$REPO_ROOT/.claude/docs-translate.lock"
exec 9>"$LOCK"
if ! /usr/bin/lockf -s -t 0 9; then log "already running"; exit 0; fi

WT="$REPO_ROOT/.claude/worktrees/docs-translate"
if ! git -C "$REPO_ROOT" worktree list --porcelain | grep -Fxq "worktree $WT"; then
  git -C "$REPO_ROOT" worktree add --detach "$WT" "origin/$BASE"
fi
cd "$WT"
git reset --hard --quiet
git clean -fdq
rm -rf .translate
PR=$(gh pr list -R wcpos/docs --state open --base "$BASE" --label docs-translate --json number,headRefName,url,isCrossRepository --jq 'map(select(.isCrossRepository == false and (.headRefName | startswith("docs-translate/")))) | .[0] // empty')
if [ -n "$PR" ]; then
  BRANCH=$(printf '%s' "$PR" | jq -r .headRefName)
  PR_NUMBER=$(printf '%s' "$PR" | jq -r .number)
  PR_URL=$(printf '%s' "$PR" | jq -r .url)
  git checkout -q -B "$BRANCH" "origin/$BRANCH"
  if ! git merge -q --no-edit "origin/$BASE"; then
    git merge --abort
    fail "merge failed for PR $PR_NUMBER ($PR_URL)"
  fi
else
  BRANCH="docs-translate/$(date -u +%Y%m%d-%H%M%S)"
  git checkout -q -B "$BRANCH" "origin/$BASE"
fi
pnpm install --prefer-offline --silent
pnpm write-translations --locale en >/dev/null
node scripts/sync-translations.js --clean >/dev/null
SUMMARY=$(node scripts/docs-translation/worklist.js "${WORKLIST_ARGS[@]}" --max-units "$MAX_UNITS")
PLAN_SUM=$(shasum -a 256 .translate/plan.json | cut -d' ' -f1)
git add -A i18n
TOTAL=$(printf '%s' "$SUMMARY" | jq -r .total)
if [ "$DRY_RUN" -eq 1 ]; then printf '%s\n' "$SUMMARY"; exit 0; fi

run_with_timeout() {
  local pid watchdog status=0
  set -m
  "$@" &
  pid=$!
  ( sleep "$CALL_TIMEOUT"; kill -KILL -- "-$pid" 2>/dev/null || true ) &
  watchdog=$!
  set +m
  wait "$pid" || status=$?
  kill -KILL -- "-$watchdog" 2>/dev/null || true
  wait "$watchdog" 2>/dev/null || true
  return "$status"
}
if [ "$TRANSLATOR" = codex ]; then
  COMMAND=(codex exec -m "$MODEL" -c "model_reasoning_effort=\"$EFFORT\"" -c 'approval_policy="never"' -s workspace-write -C "$WT" -)
  REVIEW_COMMAND=(codex exec -m "$REVIEW_MODEL" -c "model_reasoning_effort=\"$EFFORT\"" -c 'approval_policy="never"' -s workspace-write -C "$WT" -)
else
  COMMAND=(claude -p --model "$MODEL" --permission-mode acceptEdits --allowedTools "Read,Write,Glob,Grep")
  REVIEW_COMMAND=(claude -p --model "$REVIEW_MODEL" --permission-mode acceptEdits --allowedTools "Read,Write,Glob,Grep")
fi
mkdir -p .translate/results .translate/logs
REVIEW_USED=skipped
if [ "$TOTAL" -gt 0 ]; then
  for PACKET in .translate/work/*.json; do
    [ -f "$PACKET" ] || continue
    PACKET=$(basename "$PACKET" .json)
    cat scripts/docs-translation/translate-prompt.md > .translate/prompt
    printf '\n- .translate/work/%s.json -> .translate/results/%s.json\n' "$PACKET" "$PACKET" >> .translate/prompt
    if ! run_with_timeout "${COMMAND[@]}" < .translate/prompt > ".translate/logs/$PACKET.log" 2>&1; then
      log "packet $PACKET failed or timed out; continuing"
    fi
    if [ "$REVIEW" -eq 1 ] && [ -f ".translate/results/$PACKET.json" ]; then
      REVIEW_USED=$REVIEW_MODEL
      cat scripts/docs-translation/review-prompt.md > .translate/prompt
      printf '\n- .translate/work/%s.json -> .translate/results/%s.json\n' "$PACKET" "$PACKET" >> .translate/prompt
      if ! run_with_timeout "${REVIEW_COMMAND[@]}" < .translate/prompt > ".translate/logs/review-$PACKET.log" 2>&1; then
        log "review $PACKET failed or timed out; continuing"
      fi
    fi
  done
fi
git checkout -- .
git clean -fdq
[ "$PLAN_SUM" = "$(shasum -a 256 .translate/plan.json | cut -d' ' -f1)" ] || fail "plan.json changed during model calls"
node scripts/docs-translation/apply.js --plan .translate/plan.json --failed-state .translate/failed-state.json
APPLY_SUMMARY=$(node scripts/docs-translation/apply.js --plan .translate/plan.json --results .translate/results --report .translate/report.json --report-md .translate/report.md)
log "$APPLY_SUMMARY"
if [ -z "$(git status --porcelain -- i18n)" ]; then
  if [ "$TOTAL" -eq 0 ]; then log "nothing to translate"; exit 0; fi
  fail "no translations accepted"
fi
APPLIED=$(printf '%s' "$APPLY_SUMMARY" | jq -r .applied)
N_FILES=$(printf '%s' "$APPLY_SUMMARY" | jq -r .files)
DEFERRED_UNITS=$(printf '%s' "$SUMMARY" | jq -r .deferred_units)
git add i18n
LOCALES=$(git diff --cached --name-only -- i18n | jq -Rsr '[split("\n")[] | split("/") | select(length > 2 and .[1] != "en") | .[1]] | unique | join(", ")')
git commit -m "docs(i18n): translate $APPLIED units in $N_FILES files"
publish() {
  if [ "$BRANCH" = main ] || [ "$BRANCH" = "$BASE" ]; then fail "refusing to push to $BRANCH"; fi
  git push --quiet -u origin "$BRANCH"
  if [ -n "$PR" ]; then
    gh pr comment "$PR_NUMBER" --body-file .translate/pr-body.md > /dev/null
  else
    gh label create docs-translate --color 1d76db --description "Automated local docs translation run" 2>/dev/null || true
    PR_URL=$(gh pr create -R wcpos/docs --base "$BASE" --head "$BRANCH" --label docs-translate --title "docs(i18n): automated docs translations $(date -u +%Y-%m-%d)" --body-file .translate/pr-body.md)
  fi
}
if ! BASE_REF="origin/$BASE" node scripts/validate-frontmatter.js --check --changed ||
    ! BASE_REF="origin/$BASE" node scripts/check-translation-completeness.js --changed ||
    ! BASE_REF="origin/$BASE" node scripts/check-translation-safety.js; then
  FAILED_COMMIT=$(git rev-parse --short HEAD)
  git reset --hard --quiet HEAD~1
  cp .translate/failed-state.json i18n/translation-state.json
  git add i18n/translation-state.json
  if git diff --cached --quiet; then fail "validation failed (commit $FAILED_COMMIT)"; fi
  git commit --quiet -m "docs(i18n): record failed translation attempts"
  printf 'Validation failed for %s; its translations were not pushed. This commit records the failed attempts in i18n/translation-state.json so the retry cap applies.\n' "$FAILED_COMMIT" > .translate/pr-body.md
  publish
  fail "validation failed (commit $FAILED_COMMIT); attempts recorded on $BRANCH"
fi
{
  printf 'Applied %s units in %s files (%s); translator: %s (%s); review: %s; deferred: %s units.\n\n' "$APPLIED" "$N_FILES" "$LOCALES" "$TRANSLATOR" "$MODEL" "$REVIEW_USED" "$DEFERRED_UNITS"
  cat .translate/report.md
  printf '\nGenerated by scripts/translate-docs-local.sh at %s.\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
} > .translate/pr-body.md
publish
log "$PR_URL"
exit 0
