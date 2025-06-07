import { useEffect, useRef, useState } from 'react'
import { Monitor, Loader2, AlertCircle } from 'lucide-react'

interface RemoteDesktopProps {
  tunnelUrl?: string
  isConnected: boolean
  onConnectionChange: (connected: boolean) => void
}

declare global {
  interface Window {
    RFB?: any
  }
}

export default function RemoteDesktop({ 
  tunnelUrl, 
  isConnected, 
  onConnectionChange 
}: RemoteDesktopProps) {
  const displayRef = useRef<HTMLDivElement>(null)
  const rfbRef = useRef<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // 动态加载 noVNC 脚本
    const loadNoVNC = async () => {
      if (typeof window !== 'undefined' && !window.RFB) {
        const script = document.createElement('script')
        script.src = '/novnc/core/rfb.js'
        script.onload = () => {
          console.log('noVNC loaded successfully')
        }
        document.head.appendChild(script)
      }
    }

    loadNoVNC()
  }, [])

  const connectToDesktop = async () => {
    if (!tunnelUrl || !displayRef.current || !window.RFB) {
      setError('无法建立连接：缺少必要组件')
      return
    }

    try {
      setConnectionStatus('connecting')
      setError('')

      // 清理之前的连接
      if (rfbRef.current) {
        rfbRef.current.disconnect()
      }

      // 创建 noVNC 连接
      const rfb = new window.RFB(displayRef.current, tunnelUrl, {
        credentials: { password: '' }, // 如果需要密码
        wsProtocols: ['binary']
      })

      // 事件监听
      rfb.addEventListener('connect', () => {
        setConnectionStatus('connected')
        onConnectionChange(true)
      })

      rfb.addEventListener('disconnect', (e: any) => {
        setConnectionStatus('disconnected')
        onConnectionChange(false)
        if (e.detail.clean === false) {
          setError('连接异常断开')
        }
      })

      rfb.addEventListener('credentialsrequired', () => {
        setError('需要认证凭据')
        setConnectionStatus('failed')
      })

      rfb.addEventListener('securityfailure', (e: any) => {
        setError(`安全验证失败: ${e.detail.reason}`)
        setConnectionStatus('failed')
      })

      rfbRef.current = rfb

    } catch (err) {
      setError(`连接失败: ${err instanceof Error ? err.message : '未知错误'}`)
      setConnectionStatus('failed')
    }
  }

  const disconnect = () => {
    if (rfbRef.current) {
      rfbRef.current.disconnect()
      rfbRef.current = null
    }
  }

  useEffect(() => {
    if (isConnected && tunnelUrl && connectionStatus === 'disconnected') {
      connectToDesktop()
    } else if (!isConnected && connectionStatus !== 'disconnected') {
      disconnect()
    }
  }, [isConnected, tunnelUrl])

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Monitor className="w-5 h-5 text-blue-400 mr-2" />
          <h2 className="text-xl font-semibold text-white">远程桌面</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
            connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
            connectionStatus === 'failed' ? 'bg-red-400' : 'bg-gray-400'
          }`} />
          <span className="text-sm text-gray-300 capitalize">{connectionStatus}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center">
          <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
          <span className="text-red-200 text-sm">{error}</span>
        </div>
      )}

      <div className="relative">
        {connectionStatus === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10">
            <div className="flex items-center space-x-3 text-white">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>正在连接远程桌面...</span>
            </div>
          </div>
        )}

        <div 
          ref={displayRef}
          className={`
            w-full bg-black rounded-lg overflow-hidden
            ${connectionStatus === 'connected' ? 'min-h-[600px]' : 'h-64 flex items-center justify-center'}
          `}
          style={{ aspectRatio: connectionStatus === 'connected' ? 'auto' : '16/9' }}
        >
          {connectionStatus === 'disconnected' && !error && (
            <div className="text-gray-400 text-center">
              <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>等待远程桌面连接...</p>
            </div>
          )}
        </div>
      </div>

      {connectionStatus === 'connected' && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            提示：使用 Ctrl+Alt+Shift 释放鼠标焦点
          </div>
          <button
            onClick={disconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            断开连接
          </button>
        </div>
      )}
    </div>
  )
} 