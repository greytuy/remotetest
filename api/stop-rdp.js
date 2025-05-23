// This function will be triggered by a GET or POST request to /api/stop-rdp
// It finds and cancels the active GitHub Action workflow run for the RDP session.

export default async function handler(req, res) {
  const GITHUB_PAT = process.env.GITHUB_PAT;
  const REPO_OWNER = process.env.REPO_OWNER || 'your-github-username';
  const REPO_NAME = process.env.REPO_NAME || 'your-repo-name';
  const WORKFLOW_ID = process.env.WORKFLOW_ID || 'main.yml';

  if (!GITHUB_PAT) {
    return res.status(500).json({ error: 'GITHUB_PAT environment variable not set.' });
  }
  if (!REPO_OWNER || REPO_OWNER === 'your-github-username') {
    return res.status(500).json({ error: 'REPO_OWNER environment variable not set or is placeholder.' });
  }
  if (!REPO_NAME || REPO_NAME === 'your-repo-name') {
    return res.status(500).json({ error: 'REPO_NAME environment variable not set or is placeholder.' });
  }

  try {
    // 1. List active workflow runs (in_progress or queued)
    const runsResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/runs?status=in_progress,queued`, {
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!runsResponse.ok) {
      const errorData = await runsResponse.text();
      console.error('GitHub API Error (List Runs):', errorData);
      return res.status(runsResponse.status).json({ error: 'Failed to list workflow runs.', details: errorData });
    }

    const runsData = await runsResponse.json();
    // Filter for 'in_progress' or 'queued' as the API might return completed ones if queried without explicit status,
    // or if the combined status query isn't supported as expected.
    const activeRuns = runsData.workflow_runs.filter(run => run.status === 'in_progress' || run.status === 'queued');


    if (activeRuns.length === 0) {
      return res.status(404).json({ message: 'No active RDP session found to stop.' });
    }

    // Stop the most recent active or queued run.
    const runToCancel = activeRuns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

    // 2. Cancel the identified workflow run
    const cancelResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runToCancel.id}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (cancelResponse.status === 202) { // HTTP 202 Accepted indicates success for cancel
      res.status(200).json({ message: `RDP session (run ID: ${runToCancel.id}) stopping request accepted.` });
    } else {
      const errorData = await cancelResponse.text();
      console.error('GitHub API Error (Cancel Run):', errorData);
      res.status(cancelResponse.status).json({ error: 'Failed to stop RDP session.', details: errorData });
    }
  } catch (error) {
    console.error('Internal Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
