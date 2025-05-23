// This function will be triggered by a GET request to /api/status-rdp
// It checks the status of the GitHub Action workflow for the RDP session.

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
    // Fetch recent workflow runs, GitHub API sorts by created_at descending by default
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/runs?per_page=5`, {
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('GitHub API Error (List Runs for Status):', errorData);
      return res.status(response.status).json({ error: 'Failed to fetch workflow status.', details: errorData });
    }

    const data = await response.json();
    
    // Find the first run that is 'in_progress' or 'queued'
    const currentRun = data.workflow_runs.find(run => run.status === 'in_progress' || run.status === 'queued');

    if (currentRun) {
      res.status(200).json({ 
        status: currentRun.status, // 'in_progress' or 'queued'
        run_id: currentRun.id, 
        html_url: currentRun.html_url, 
        created_at: currentRun.created_at,
        message: 'RDP session is currently active or starting.'
      });
    } else {
      // If no active run, provide status of the latest run if available
      const latestRun = data.workflow_runs.length > 0 ? data.workflow_runs[0] : null;
      res.status(200).json({ 
        status: 'inactive', 
        last_run_status: latestRun ? latestRun.conclusion : 'none', // e.g., success, failure, cancelled
        last_run_id: latestRun ? latestRun.id : null,
        message: 'No active RDP session. Check last run status for details.'
      });
    }
  } catch (error) {
    console.error('Internal Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
