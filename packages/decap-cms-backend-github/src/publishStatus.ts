import type { PublishStatus } from 'decap-cms-lib-util';

export type WorkflowRun = {
  name?: string | null;
  html_url: string;
  status: string | null;
  conclusion: string | null;
  head_sha: string;
  created_at: string;
  event?: string;
};

// How long after publishing to report "pending" while waiting for GitHub to
// create the workflow run(s). After this, no runs means no workflows apply.
export const RUN_START_GRACE_MS = 2 * 60 * 1000;

// Runs started by the push that published a change, or chained off it (e.g. a
// deploy workflow triggered when a build workflow completes). Other runs can
// share the commit, e.g. Dependabot runs against the default branch head.
const PUBLISH_EVENTS = ['push', 'workflow_run'];

export function isPublishRun(run: WorkflowRun) {
  return !run.event || PUBLISH_EVENTS.includes(run.event);
}

const RUNNING = ['queued', 'in_progress', 'waiting', 'requested', 'pending'];
const FAILED = ['failure', 'timed_out', 'startup_failure', 'action_required'];

function toStatus(state: PublishStatus['state'], run: WorkflowRun): PublishStatus {
  return { state, url: run.html_url, name: run.name || undefined };
}

/**
 * Reduces the workflow runs for one commit to a single status. Any running
 * workflow means the publish is still in progress, then any failure wins, so a
 * deploy failing alongside an unrelated passing workflow is still surfaced.
 */
export function summarizeWorkflowRuns(
  runs: WorkflowRun[],
  publishedAt: string | undefined,
  now = Date.now(),
): PublishStatus | null {
  if (runs.length === 0) {
    const recentlyPublished =
      publishedAt && now - new Date(publishedAt).getTime() < RUN_START_GRACE_MS;
    return recentlyPublished ? { state: 'pending' } : null;
  }

  const running = runs.find(run => run.status && RUNNING.includes(run.status));
  if (running) {
    return toStatus('running', running);
  }

  const failed = runs.find(run => run.conclusion && FAILED.includes(run.conclusion));
  if (failed) {
    return toStatus('failure', failed);
  }

  if (runs.every(run => run.conclusion === 'cancelled')) {
    return toStatus('cancelled', runs[0]);
  }

  return toStatus('success', runs.find(run => run.conclusion === 'success') || runs[0]);
}

/**
 * Status of the newest commit's runs among a branch's workflow runs (newest
 * first). Every run on the branch deploys all the changes before it, so this
 * is whether the branch's latest changes are deployed (or deploys are blocked).
 */
export function summarizeLatestRuns(branchRuns: WorkflowRun[]): PublishStatus | null {
  const runs = branchRuns.filter(isPublishRun);
  // A run chained off an older commit's run can start after a newer push's
  // run, so the newest push identifies the newest commit.
  const latest = runs.find(run => run.event === 'push') || runs[0];
  if (!latest) {
    return null;
  }
  return summarizeWorkflowRuns(
    runs.filter(run => run.head_sha === latest.head_sha),
    undefined,
  );
}
