import { summarizeLatestRuns, summarizeWorkflowRuns, RUN_START_GRACE_MS } from '../publishStatus';

function run(overrides) {
  return {
    name: 'Deploy',
    html_url: 'https://github.com/owner/repo/actions/runs/1',
    status: 'completed',
    conclusion: 'success',
    head_sha: 'sha',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('summarizeWorkflowRuns', () => {
  const publishedAt = '2026-01-01T00:00:00Z';
  const publishedMs = new Date(publishedAt).getTime();

  it('should be pending while waiting for runs to start after publishing', () => {
    expect(summarizeWorkflowRuns([], publishedAt, publishedMs + 1000)).toEqual({
      state: 'pending',
    });
  });

  it('should be null when no runs started within the grace period', () => {
    expect(summarizeWorkflowRuns([], publishedAt, publishedMs + RUN_START_GRACE_MS + 1)).toBeNull();
    expect(summarizeWorkflowRuns([], undefined)).toBeNull();
  });

  it('should report running when any workflow is still in progress', () => {
    const inProgress = run({
      name: 'Build',
      status: 'in_progress',
      conclusion: null,
      html_url: 'running-url',
    });
    expect(
      summarizeWorkflowRuns([run({ conclusion: 'failure' }), inProgress], publishedAt),
    ).toEqual({ state: 'running', url: 'running-url', name: 'Build' });
  });

  it('should report a failure even when other workflows passed', () => {
    const failed = run({ name: 'Deploy', conclusion: 'failure', html_url: 'failed-url' });
    expect(summarizeWorkflowRuns([run({ name: 'Lint' }), failed], publishedAt)).toEqual({
      state: 'failure',
      url: 'failed-url',
      name: 'Deploy',
    });
  });

  it('should report cancelled only when every run was cancelled', () => {
    expect(summarizeWorkflowRuns([run({ conclusion: 'cancelled' })], publishedAt).state).toBe(
      'cancelled',
    );
    expect(
      summarizeWorkflowRuns(
        [run({ conclusion: 'cancelled' }), run({ conclusion: 'skipped' })],
        publishedAt,
      ).state,
    ).toBe('success');
  });

  it('should report success when all runs completed without failing', () => {
    expect(summarizeWorkflowRuns([run({ conclusion: 'skipped' }), run()], publishedAt)).toEqual({
      state: 'success',
      url: 'https://github.com/owner/repo/actions/runs/1',
      name: 'Deploy',
    });
  });
});

describe('summarizeLatestRuns', () => {
  function branchRun(head_sha, event, conclusion, html_url) {
    return run({ name: undefined, head_sha, event, conclusion, html_url });
  }

  it('should return null when the branch has no runs', () => {
    expect(summarizeLatestRuns([])).toBeNull();
  });

  it("should summarize only the newest commit's runs", () => {
    expect(
      summarizeLatestRuns([
        branchRun('new', 'push', 'success', 'new-url'),
        branchRun('old', 'push', 'failure', 'old-url'),
      ]),
    ).toEqual({ state: 'success', url: 'new-url' });
  });

  it('should include runs chained off the newest commit', () => {
    expect(
      summarizeLatestRuns([
        branchRun('new', 'workflow_run', 'failure', 'deploy-url'),
        branchRun('new', 'push', 'success', 'build-url'),
      ]),
    ).toEqual({ state: 'failure', url: 'deploy-url' });
  });

  it("should pick the newest push over an older commit's later chained run", () => {
    expect(
      summarizeLatestRuns([
        branchRun('old', 'workflow_run', 'failure', 'old-deploy-url'),
        branchRun('new', 'push', 'success', 'new-url'),
        branchRun('old', 'push', 'success', 'old-build-url'),
      ]),
    ).toEqual({ state: 'success', url: 'new-url' });
  });

  it('should ignore runs not triggered by a push', () => {
    expect(
      summarizeLatestRuns([
        branchRun('new', 'dynamic', 'failure', 'dependabot-url'),
        branchRun('new', 'push', 'success', 'push-url'),
      ]),
    ).toEqual({ state: 'success', url: 'push-url' });
  });
});
