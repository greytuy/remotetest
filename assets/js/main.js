const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const statusButton = document.getElementById('statusButton');
const statusBox = document.getElementById('statusBox');
const loader = document.getElementById('loader');

function showLoader() { loader.style.display = 'block'; }
function hideLoader() { loader.style.display = 'none'; }

async function apiCall(endpoint, method = 'POST', body = null) {
    showLoader();
    // Clear previous specific messages but keep a generic processing one
    statusBox.innerHTML = '<p class="info-message">Processing your request...</p>'; 
    try {
        const options = { method };
        if (body) { // Only add Content-Type if there's a body
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(body);
        } else {
            options.headers = {}; // Ensure headers object exists
        }
        // Add a cache-buster for GET requests to ensure fresh data
        if (method === 'GET') {
            options.cache = 'no-store'; 
        }

        const response = await fetch(endpoint, options);
        const data = await response.json(); // Try to parse JSON regardless of response.ok

        if (!response.ok) {
            // Use error message from API if available, otherwise use a generic one
            const errorMessage = data.details || data.error || `Request failed with status ${response.status}`;
            throw new Error(errorMessage);
        }
        return data;
    } catch (error) {
        console.error(`Error calling ${endpoint}:`, error);
        // Display the error in the status box
        statusBox.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
        return { error: error.message }; // Return error structure for consistent handling
    } finally {
        hideLoader();
    }
}

startButton.addEventListener('click', async () => {
    const result = await apiCall('/api/start-rdp', 'POST');
    if (result.error) {
        // Error is already displayed by apiCall's catch block
    } else {
        statusBox.innerHTML = `<p class="success-message">${result.message}</p><p>The RDP session is being initiated. It may take a few moments to become active. Click "Refresh Status" to check.</p>`;
    }
});

stopButton.addEventListener('click', async () => {
    const result = await apiCall('/api/stop-rdp', 'POST');
    if (result.error) {
        // Error is already displayed by apiCall's catch block
    } else {
        statusBox.innerHTML = `<p class="info-message">${result.message}</p><p>The RDP session is being terminated. Click "Refresh Status" to check.</p>`;
    }
});

statusButton.addEventListener('click', async () => {
    const result = await apiCall('/api/status-rdp', 'GET');
    if (result.error) {
        // Error is already displayed by apiCall's catch block. 
        // We can add a generic message if needed, or rely on the one from apiCall.
        // statusBox.innerHTML = `<p class="error-message">Could not retrieve status: ${result.error}</p>`;
    } else {
        let statusHTML = '';
        if (result.status === 'in_progress' || result.status === 'queued') {
            statusHTML += `<p class="info-message"><strong>Status:</strong> ${result.status} <span style="font-weight:normal;">(${result.message || 'Session is active or starting.'})</span></p>`;
            statusHTML += `<p><strong>Run ID:</strong> ${result.run_id}</p>`;
            statusHTML += `<p><strong>Initiated:</strong> ${new Date(result.created_at).toLocaleString()}</p>`;
            if (result.html_url) {
                statusHTML += `<p><a href="${result.html_url}" target="_blank">View Workflow Run Details</a></p>`;
            }
        } else if (result.status === 'inactive') {
            statusHTML += `<p class="info-message"><strong>Status:</strong> Inactive</p>`;
            statusHTML += `<p>${result.message || 'No active RDP session.'}</p>`;
            if(result.last_run_id) {
                statusHTML += `<p><strong>Last Session ID:</strong> ${result.last_run_id}</p>`;
                statusHTML += `<p><strong>Last Session Outcome:</strong> ${result.last_run_status || 'N/A'}</p>`;
            }
        } else {
             statusHTML += `<p><strong>Status:</strong> ${result.status || 'Unknown'}</p>`;
             if (result.message) statusHTML += `<p>${result.message}</p>`;
        }
        statusBox.innerHTML = statusHTML;
    }
});

// Automatically refresh status when the page loads
document.addEventListener('DOMContentLoaded', () => {
    statusButton.click();
});
