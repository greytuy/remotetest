// This function will be triggered by a GET or POST request to /api/start-rdp
// It triggers the GitHub Action workflow to start the RDP session.

export default async function handler(req, res) {
  const GITHUB_PAT = process.env.GITHUB_PAT;
  // It's good practice to get these from environment variables as well
  // For now, placeholders are used. These should be configured during deployment.
  const REPO_OWNER = process.env.REPO_OWNER || 'your-github-username'; 
  const REPO_NAME = process.env.REPO_NAME || 'your-repo-name';       
  const WORKFLOW_ID = process.env.WORKFLOW_ID || 'main.yml';    
  const BRANCH_REF = process.env.BRANCH_REF || 'main'; // Or 'master', depending on the default branch

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
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: BRANCH_REF }),
    });

    if (response.status === 204) { // HTTP 204 No Content indicates success
      res.status(200).json({ message: 'RDP session starting...' });
    } else {
      const errorData = await response.text(); // Use .text() for potentially non-JSON responses
      console.error('GitHub API Error:', errorData);
      res.status(response.status).json({ error: 'Failed to start RDP session.', details: errorData });
    }
  } catch (error) {
    console.error('Internal Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
