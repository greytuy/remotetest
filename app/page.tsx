'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Play, 
  Square, 
  Settings, 
  Monitor, 
  Key, 
  GitBranch, 
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react'
import Cookies from 'js-cookie'

interface WorkflowRun {
  id: number
  status: string
  conclusion: string | null
  created_at: string
  html_url: string
}

interface ConnectionInfo {
  username: string
  password: string
  status: string
}

export default function Home() {
  const [githubToken, setGithubToken] = useState('')
  const [repositoryName, setRepositoryName] = useState('')
  const [workflowStatus, setWorkflowStatus] = useState<'idle' | 'running' | 'loading'>('idle')
  const [lastRun, setLastRun] = useState<WorkflowRun | null>(null)
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    username: 'runneradmin',
    password: '使用 GitHub Secrets 中设置的 RDP_PASSWORD',
    status: 'disconnected'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const savedToken = Cookies.get('github_token')
    const savedRepo = Cookies.get('repository_name')
    if (savedToken) setGithubToken(savedToken)
    if (savedRepo) setRepositoryName(savedRepo)
  }, [])

  const saveConfig = () => {
    if (githubToken) {
      Cookies.set('github_token', githubToken, { expires: 30 })
    }
    if (repositoryName) {
      Cookies.set('repository_name', repositoryName, { expires: 30 })
    }
  }

  const fetchWorkflowStatus = useCallback(async () => {
    if (!githubToken || !repositoryName) return

    try {
      const response = await fetch(`https://api.github.com/repos/${repositoryName}/actions/runs?per_page=1`, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.workflow_runs && data.workflow_runs.length > 0) {
          const run = data.workflow_runs[0]
          setLastRun(run)
          
          if (run.status === 'in_progress') {
            setWorkflowStatus('running')
            setConnectionInfo(prev => ({
              ...prev,
              status: 'connecting'
            }))
          } else {
            setWorkflowStatus('idle')
            setConnectionInfo(prev => ({
              ...prev,
              status: 'disconnected'
            }))
          }
        }
      }
    } catch (error) {
      console.error('获取workflow状态失败:', error)
    }
  }, [githubToken, repositoryName])

const startWorkflow = async () => {
    if (!githubToken || !repositoryName) {
      alert('Please configure GitHub Token and repository name first')
      return
    }

    // Validate repository name format
    if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repositoryName)) {
      alert('Invalid repository name format. Use: owner/repository')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`https://api.github.com/repos/${repositoryName}/actions/workflows/main.yml/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: 'main'
        })
      })

      if (response.ok) {
        setWorkflowStatus('running')
        setConnectionInfo(prev => ({
          ...prev,
          status: 'connecting'
        }))
        setTimeout(fetchWorkflowStatus, 3000)
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message || response.statusText}`)
      }
    } catch (error) {
      console.error('启动workflow失败:', error)
      alert('启动workflow失败，请检查Token权限和仓库名称')
    } finally {
      setIsLoading(false)
    }
  }

  const stopWorkflow = async () => {
    if (!lastRun || !githubToken || !repositoryName) return

    setIsLoading(true)
    try {
      const response = await fetch(`https://api.github.com/repos/${repositoryName}/actions/runs/${lastRun.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (response.ok) {
        setWorkflowStatus('idle')
        setConnectionInfo(prev => ({
          ...prev,
          status: 'disconnected'
        }))
        setTimeout(fetchWorkflowStatus, 2000)
      } else {
        throw new Error('停止失败')
      }
    } catch (error) {
      console.error('停止workflow失败:', error)
      alert('停止workflow失败')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  useEffect(() => {
    const interval = setInterval(fetchWorkflowStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchWorkflowStatus])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            GitHub Actions 远程控制器
          </h1>
          <p className="text-blue-200">
            管理和控制您的远程Windows桌面
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 text-blue-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">GitHub 配置</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  需要具有 repo 和 actions 权限
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  <GitBranch className="w-4 h-4 inline mr-1" />
                  仓库名称
                </label>
                <input
                  type="text"
                  value={repositoryName}
                  onChange={(e) => setRepositoryName(e.target.value)}
                  placeholder="username/repository"
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={saveConfig}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                保存配置
              </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <Monitor className="w-5 h-5 text-green-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">远程桌面控制</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-blue-200">状态:</span>
                <span className={`flex items-center ${
                  workflowStatus === 'running' ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {workflowStatus === 'running' ? (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      运行中
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                      已停止
                    </>
                  )}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startWorkflow}
                  disabled={isLoading || workflowStatus === 'running'}
                  className="flex-1 flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  启动
                </button>

                <button
                  onClick={stopWorkflow}
                  disabled={isLoading || workflowStatus !== 'running'}
                  className="flex-1 flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Square className="w-4 h-4 mr-2" />
                  )}
                  停止
                </button>

                <button
                  onClick={fetchWorkflowStatus}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {lastRun && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-sm text-blue-200 mb-1">最后运行:</p>
                  <p className="text-xs text-gray-400">
                    {new Date(lastRun.created_at).toLocaleString('zh-CN')}
                  </p>
                  <a
                    href={lastRun.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs underline"
                  >
                    在GitHub中查看
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <Monitor className="w-5 h-5 text-yellow-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">远程桌面连接信息</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-blue-200">用户名:</span>
                  <div className="flex items-center">
                    <span className="text-white mr-2">{connectionInfo.username}</span>
                    <button
                      onClick={() => copyToClipboard(connectionInfo.username, 'username')}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      {copiedField === 'username' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-blue-200">密码:</span>
                  <div className="flex items-center">
                    <span className="text-white mr-2">
                      {showPassword ? connectionInfo.password : '••••••••••••'}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 hover:bg-white/10 rounded mr-1"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(connectionInfo.password, 'password')}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      {copiedField === 'password' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <h3 className="text-yellow-400 font-medium mb-2">连接说明</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• 启动后等待2-3分钟让服务初始化</li>
                    <li>• 密码需要在GitHub Secrets中设置RDP_PASSWORD</li>
                    <li>• 使用Windows远程桌面客户端连接</li>
                    <li>• Cloudflare Tunnel会提供安全连接</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center text-gray-400 text-sm">
          <p>GitHub Actions 远程桌面控制器 | 支持部署到 Vercel 和 Cloudflare Workers</p>
        </footer>
      </div>
    </div>
  )
} 