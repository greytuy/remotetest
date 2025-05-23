# RDP Session Controller with Web Interface

## Project Overview

This project enables remote access to a Windows RDP (Remote Desktop Protocol) session that is dynamically provisioned using GitHub Actions. It leverages Cloudflare Tunnel to create a secure connection to the RDP server without needing to expose it directly to the internet or configure complex firewall rules.

The key components are:
1.  **GitHub Actions Workflow**: (Not included in this repository, but assumed to exist) A workflow that, when triggered:
    *   Sets up a Windows environment.
    *   Installs necessary software (e.g., Cloudflare Tunnel client).
    *   Starts the Cloudflare Tunnel to expose the RDP port (3389).
    *   Outputs connection details (like a temporary password if used).
2.  **Cloudflare Tunnel**: Securely connects the RDP port on the GitHub Actions runner to a public hostname on your Cloudflare domain.
3.  **Backend API (Serverless Functions)**:
    *   Located in the `/api` directory.
    *   `start-rdp.js`: Triggers the GitHub Action workflow to start a new RDP session.
    *   `stop-rdp.js`: Attempts to find and cancel the active GitHub Action workflow run, thus stopping the RDP session.
    *   `status-rdp.js`: Checks the current status of the RDP session by querying the GitHub Actions workflow runs.
4.  **Frontend (Web Interface)**:
    *   `index.html` and `assets/js/main.js`.
    *   Provides a user-friendly control panel to start, stop, and check the status of the RDP session via the backend API.

This `README.md` primarily focuses on setting up the Cloudflare Tunnel and deploying the web interface (frontend and backend API). The GitHub Actions workflow for RDP itself needs to be configured separately in the target repository.

## Cloudflare配置步骤

1. 登录Cloudflare Zero Trust控制台 (https://dash.teams.cloudflare.com/)

2. 创建Tunnel:
   - 进入`Access > Tunnels`
   - 点击`Create a tunnel`
   - 输入Tunnel名称（例如：windows-rdp）
   - 保存生成的Tunnel Token

3. 配置GitHub Secrets:
   - 在GitHub仓库设置中找到`Secrets and variables > Actions`
   - 创建新的secret，名称为`TUNNEL_TOKEN`
   - 值设置为之前保存的Tunnel Token

4. 配置Public Hostname:
   - 在Tunnel详情页面，点击`Configure`
   - 添加新的Public Hostname
   - 设置Subdomain（例如：rdp）
   - 选择你的Cloudflare域名
   - Service类型选择`TCP`
   - URL设置为`localhost:3389`
   - 保存配置

## 使用方法

1. 在GitHub Actions页面手动触发workflow
2. 等待workflow运行完成
3. 使用Windows远程桌面客户端连接
   - 地址：你配置的Cloudflare域名
   - 用户名：runner
   - 密码：在GitHub Actions日志中查看

## 安全提示

- 定期更改访问密码
- 使用强密码策略
- 及时关闭不使用的Tunnel
- 定期检查访问日志

## Web Interface Deployment & Usage

The web interface provides a user-friendly way to manage your RDP sessions. It consists of a static frontend (`index.html`, `assets/js/main.js`) and serverless backend API functions (`/api/*.js`).

### Deployment (Vercel/Netlify)

Most modern hosting platforms like Vercel or Netlify offer a streamlined process for deploying projects directly from GitHub.

1.  **Connect your GitHub Account:** Sign up or log in to Vercel/Netlify and connect your GitHub account.
2.  **Import Repository:**
    *   Select the option to import an existing project/repository.
    *   Choose the GitHub repository where you have this RDP control panel code.
3.  **Build Settings:**
    *   **Framework Preset:** Often, these platforms auto-detect that you are deploying a project with Serverless Functions (in the `api` directory) and a static frontend (`index.html`). If manual selection is needed, choose "Other" or the most appropriate static site/Node.js option.
    *   **Build Command:** For this project, if it's just static HTML and JavaScript API routes, a build command might not be strictly necessary. However, if you were using a framework or needed a build step, you'd specify it here (e.g., `npm run build`).
    *   **Output Directory:** Typically `public` or `dist` for many frameworks. For this project, if it's serving `index.html` from the root and API routes from `api`, this might be the root directory or not applicable if the platform handles it automatically.
    *   **Serverless Functions:** Ensure the platform is configured to deploy the JavaScript files in the `api` directory as serverless functions. Vercel and Netlify usually handle this automatically if the `api` directory is at the root.

### Required Environment Variables

For the backend API functions (`start-rdp.js`, `stop-rdp.js`, `status-rdp.js`) to work correctly, you must configure the following environment variables in your Vercel/Netlify project settings:

*   **`GITHUB_PAT`**:
    *   **Description**: A GitHub Personal Access Token. This token is used to authenticate with the GitHub API to trigger and manage workflow runs.
    *   **Security**: Treat this token like a password. It's highly sensitive.
    *   **Required Scopes**:
        *   `repo`: Grants full control of private repositories (needed to dispatch workflows and list runs).
        *   `workflow`: Grants permission to add and modify GitHub Actions workflow files and trigger workflow runs.
    *   **Recommendation**: Create a fine-grained PAT if possible, or a classic PAT with only the necessary scopes. Set an expiration date for the PAT.

*   **`REPO_OWNER`**:
    *   **Description**: The username of the GitHub account or the name of the GitHub organization that owns the repository.
    *   **Example**: `your-github-username`

*   **`REPO_NAME`**:
    *   **Description**: The name of the GitHub repository where the RDP control workflow is located.
    *   **Example**: `your-rdp-controller-repo`

*   **`WORKFLOW_ID`**:
    *   **Description**: The filename of the GitHub Actions workflow that starts/manages the RDP session. This is typically the `.yml` or `.yaml` file name.
    *   **Example**: `main.yml` or `rdp_workflow.yaml`

*   **`BRANCH_REF`**:
    *   **Description**: The name of the branch on which the workflow should be dispatched. Usually `main` or `master`.
    *   **Example**: `main`

### Using the Web Interface

Once your frontend and API are deployed (e.g., on Vercel or Netlify):

1.  **Accessing the Interface**:
    *   Open the URL provided by your deployment platform (e.g., `your-project-name.vercel.app`) in your web browser.
    *   You should see the "RDP Session Control" panel.

2.  **Controls**:
    *   **Start RDP Session**:
        *   **Function**: Clicking this button sends a request to the `/api/start-rdp` endpoint. This, in turn, triggers the configured GitHub Actions workflow to begin provisioning the RDP server and establishing the Cloudflare Tunnel.
        *   **Feedback**: A message will indicate that the session is starting. It may take a few moments for the session to become active.
    *   **Stop RDP Session**:
        *   **Function**: This button sends a request to `/api/stop-rdp`. The backend will attempt to find the currently active or queued GitHub Actions workflow run for the RDP session and request its cancellation.
        *   **Feedback**: A message will confirm that the stop request has been sent.
    *   **Refresh Status**:
        *   **Function**: Clicking this button, or when the page initially loads, sends a request to `/api/status-rdp`. This fetches the current status of the RDP session by checking the GitHub Actions workflow.
        *   **Feedback**: The status box will update with the latest information.

3.  **Interpreting Status Messages**:
    *   The status box provides information about the RDP session. Key states include:
        *   `in_progress`: The GitHub Actions workflow is currently running, and the RDP session is being set up or is active. Details like the Run ID and start time are usually displayed.
        *   `queued`: The GitHub Actions workflow has been triggered but is waiting for a runner to become available.
        *   `inactive`: There is no currently active or queued RDP session. The interface might also show the status of the last run (e.g., `success`, `failure`, `cancelled`).
        *   `Error`: If there's an issue communicating with the API or the GitHub API itself, an error message will be displayed.
    *   You can often click on the "View Workflow Run Details" link (if available) to go directly to the GitHub Actions run page for more detailed logs and information.

**Important**: Ensure all environment variables listed in the "Required Environment Variables" section are correctly configured in your deployment platform's settings for the API and web interface to function correctly.

### Code Obfuscation (Optional)

The frontend JavaScript code is now located in `assets/js/main.js`.

-   **Automatic Minification**: Most modern deployment platforms (like Vercel, Netlify, etc.) automatically minify JavaScript files when you deploy your project for production. Minification makes the code smaller and harder to read, providing a basic level of obfuscation.
-   **Advanced Obfuscation**: If you require a higher level of obfuscation to make it significantly more difficult to understand or reverse-engineer the frontend code, you can use dedicated JavaScript obfuscation tools.
    -   One popular tool is **JavaScript Obfuscator** (available at [https://obfuscator.io/](https://obfuscator.io/) or as an npm package `javascript-obfuscator`).
    -   **Usage**: You would typically run such a tool on the `assets/js/main.js` file, and the tool would output an obfuscated version. You would then replace the original `assets/js/main.js` with this obfuscated version before committing and deploying your code.
    -   **Note**: Obfuscation can sometimes make debugging harder. It's often a step done for production builds rather than during development.
