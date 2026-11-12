# Page scores

`page-scores.json` holds the judged score of every 2.x docs page. The `page-scores` workflow runs
`scripts/check-page-scores.js` on each pull request. Before 2026-11-16 it only warns; from that date it fails.

## What the gate checks

- **Floor.** A page passes with a mean of at least 8.0 and no category below 7.0.
- **R1.** A new page must clear the floor.
- **R2.** A changed entry must clear the floor, and its mean may drop at most 0.3 below its previous record.
- **R3.** A passing page made stale by an edit warns for 7 days, then fails until it is scored again.
  The stale-since date follows the files the page referenced at each point in history, not only today's.
- **Shape.** Every entry needs a hash, all seven categories (plus `admin setup` on the terminal gateway pages, and
  no other score) from 0 to 10, and a mean that equals its scores. A malformed `page-scores.json` or entry fails on
  any date, whether or not the pull request changed it. When the base branch's file is malformed, the gate warns
  and compares with the newest earlier commit whose file is well formed.
- **Integrity.** Each changed entry must have a climb and round, and a judged commit in the branch's history. Its page hashes must match that commit. Its scores must equal
  the per-category minimum of the two Opus judge transcripts committed under `page-scores/runs/`, and those
  transcripts must match the sha256 recorded in the entry. The climb must be the page's own (`a/b/c` gives
  `a__b__c`; a group uses its key). Each stored transcript starts with a header line naming the entry's doc or
  group, climb, round and judge, so another page's transcripts copied byte for byte fail. The recorded column must
  be the transcript's first score column. A changed, deleted or renamed-away transcript fails its entry even when
  `page-scores.json` is unchanged. An entry may not be removed while its page exists. A carry must keep the old
  entry's scores and judge run. It needs the old page gone (a copy is not a rename) and the destination unscored
  on the base, and every hash input must have identical content: the source, each import by its path relative to
  the source, and each image. When a transcript's table has an `admin setup` row, the entry must carry that
  score, so a low optional score cannot be dropped. A page deleted in the same pull request is not evaluated; its
  entry's integrity checks still run.
- **Gate-file guard.** A pull request that edits anything under `scripts/` or `.github/workflows/page-scores.yml`
  fails unless it has the score exception below. The translation tooling the pipeline edits weekly is exempt: the
  files in `TRANSLATION_TOOLING`, `scripts/docs-translation/`, and `scripts/__tests__/docs-translation-*.test.js`.
  The changed-file list is taken without rename detection, so a moved file counts at its old path too.

## Recording a score

Climb the page with the docs climb kit, in the climb folder named after the page (for example
`hardware__printers__setup-wizard`; the error-code template uses `error-codes`). Then record the gate result and the round's two judge transcripts.
`--run` names the round's folder, which must hold `opus-a.md` and `opus-b.md`. `--commit` is the commit that was
judged.

```sh
# One page
node scripts/record-page-score.js --doc <doc> --gate <gate.json> --climb <folder> --run <judge run dir> --commit <judged commit>

# The error-code pages share one template score
node scripts/record-page-score.js --group error-codes --gate <gate.json> --climb <folder> --run <judge run dir> \
  --sample <10 judged pages, comma-separated> --commit <judged commit>

# A renamed page keeps its score
node scripts/record-page-score.js --carry <old doc> --doc <new doc> --commit <commit with the rename>

# Drop entries whose pages are gone
node scripts/record-page-score.js --prune
```

The recorder refuses a `--climb` that is not the page's. It reads each transcript's first score column, where the
judges put the page under review, and refuses a transcript whose first column is missing or a Baseline. It checks
that the transcripts give the same scores as the gate file, copies them behind a header line to
`page-scores/runs/<climb>/r<round>/opus-a.md` and `opus-b.md`, and records their path, sha256 (of the stored file,
header included) and column in the entry. It refuses gate scores that leave out an `admin setup` row the
transcripts carry. Commit the copied transcripts with `page-scores.json`.

## Exceptions

- Only kilbot applies the `score-exception` label. Each use is valid for 24 hours from when the label was applied.
- The pull request body needs a `## Score exception` section that names an open wcpos/docs tracking issue.
- The gate reads the label events from the GitHub API, never from a file in the pull request.
- An exception waives failing pages and gate-file edits. It does not waive integrity errors.

## What can still be faked

- The gate proves that an entry's scores equal its committed transcripts, that the transcripts are unchanged since
  they were recorded, and that the page hashes match the judged commit.
- It cannot prove that an Opus judge wrote the transcripts. Someone can write a transcript by hand, header line
  included, or reorder a table so an anchor page's column comes first. Only a reviewer reading the diff under
  `page-scores/runs/` catches that.
- Entries recorded before this binding are marked `seeded: true` and have no transcripts. They are grandfathered
  until they change.
- A seeded entry's `judges` field says `opus-a`, but 111 of the 135 seeded entries were judged by GPT-6 Astra in the
  climb kit (an `astra.md` transcript). Treat a seeded entry's `judges` as unverified. Recording the page again with
  `--run` replaces it.
- If a carried page is copied again and the original then deleted, both copies keep the score. This is a known
  limit, not yet fixed.

## Limit: the workflow runs from the pull request

- The workflow and the gate's scripts are checked out from the pull request branch, so a pull request can edit them
  to pass its own run.
- The gate-file guard fails such a pull request without the kilbot exception, but the guard runs from the same
  edited files.
- Only a required workflow or ruleset that runs the base branch's copy closes this gap. The front desk is handling
  that separately.
