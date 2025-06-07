# 🖥️ 浏览器端远程桌面集成指南

## 📋 概述

本指南将帮助你在 GitHub Actions 远程控制器项目中集成浏览器端远程桌面功能，实现在浏览器中直接访问远程 Windows 桌面。

## 🏗️ 技术架构

```
[Next.js 前端] → [noVNC Client] → [WebSocket Proxy] → [Cloudflare Tunnel] → [GitHub Runner VNC]
```

## 🚀 快速开始

### 第一步：设置 noVNC 客户端

```bash
# 运行设置脚本
chmod +x setup-novnc.sh
./setup-novnc.sh

# 或者手动运行
npm run download-novnc
```

### 第二步：修改 GitHub Actions Workflow

更新你的 `.github/workflows/main.yml`：

```yaml
name: Remote Desktop
on:
  workflow_dispatch:

jobs:
  remote-desktop:
    runs-on: windows-latest
    timeout-minutes: 60
    
    steps:
    - name: Enable RDP
      run: |
        Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -name "fDenyTSConnections" -value 0
        Enable-NetFirewallRule -DisplayGroup "Remote Desktop"
        Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp' -name "UserAuthentication" -value 1
    
    - name: Set RDP Password
      run: |
        $password = ConvertTo-SecureString "${{ secrets.RDP_PASSWORD }}" -AsPlainText -Force
        Set-LocalUser -Name "runneradmin" -Password $password
        
    - name: Install and Configure TightVNC
      run: |
        # 下载 TightVNC
        Invoke-WebRequest -Uri "https://www.tightvnc.com/download/2.8.63/tightvnc-2.8.63-gpl-setup-64bit.msi" -OutFile "tightvnc.msi"
        
        # 静默安装
        Start-Process msiexec.exe -Wait -ArgumentList '/I tightvnc.msi /quiet SET_USEVNCAUTH=1 VALUE_OF_USEVNCAUTH=1 SET_PASSWORD=1 VALUE_OF_PASSWORD=${{ secrets.VNC_PASSWORD }} SET_USECONTROLAUTH=1 VALUE_OF_USECONTROLAUTH=1 SET_CONTROLPASSWORD=1 VALUE_OF_CONTROLPASSWORD=${{ secrets.VNC_PASSWORD }}'
        
        # 启动 VNC 服务
        Start-Service tvnserver
        
    - name: Setup Cloudflare Tunnel
      run: |
        # 下载 cloudflared
        Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"
        
        # 认证（需要在 Secrets 中设置 CLOUDFLARE_TUNNEL_TOKEN）
        .\cloudflared.exe tunnel --url tcp://localhost:5900 --metrics localhost:6000
        
    - name: Setup WebSocket Proxy
      run: |
        # 安装 Python 和 websockify
        python -m pip install websockify
        
        # 启动 WebSocket 代理（VNC to WebSocket）
        python -m websockify --web=. 6080 localhost:5900
        
    - name: Wait and Keep Connection
      run: |
        Write-Host "远程桌面已启动！"
        Write-Host "VNC 端口: 5900"
        Write-Host "WebSocket 端口: 6080"
        Write-Host "Cloudflare Tunnel 正在运行..."
        
        # 保持会话活跃
        while ($true) {
          Start-Sleep 30
          Write-Host "Session active at $(Get-Date)"
        }
```

### 第三步：设置 GitHub Secrets

在你的 GitHub 仓库中设置以下 Secrets：

1. `RDP_PASSWORD` - RDP 登录密码
2. `VNC_PASSWORD` - VNC 连接密码
3. `CLOUDFLARE_TUNNEL_TOKEN` - Cloudflare Tunnel 令牌

### 第四步：获取 Cloudflare Tunnel Token

```bash
# 安装 cloudflared
# Windows
winget install --id Cloudflare.cloudflared

# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# 登录并创建隧道
cloudflared tunnel login
cloudflared tunnel create github-rdp
cloudflared tunnel token github-rdp
```

## 🔧 高级配置

### 性能优化

1. **VNC 编码优化**：
```yaml
# 在 workflow 中设置 VNC 质量
- name: Configure VNC Quality
  run: |
    # 设置为高质量模式
    $regPath = "HKLM:\SOFTWARE\TightVNC\Server"
    Set-ItemProperty -Path $regPath -Name "RfbPort" -Value 5900
    Set-ItemProperty -Path $regPath -Name "AcceptRfbConnections" -Value 1
```

2. **WebSocket 压缩**：
```bash
# 启用压缩的 websockify
websockify --web=. --cert=cert.pem --ssl-only 6080 localhost:5900
```

### 安全加固

1. **SSL/TLS 加密**：
```yaml
- name: Generate SSL Certificate
  run: |
    # 生成自签名证书
    openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Org/CN=localhost"
```

2. **访问控制**：
```javascript
// 在 RemoteDesktop 组件中添加认证
const authenticateUser = async () => {
  const token = await getAuthToken()
  return validateToken(token)
}
```

## 🔍 故障排除

### 常见问题

1. **无法连接到 VNC**
   - 检查防火墙设置
   - 确认 VNC 服务已启动
   - 验证端口是否正确

2. **WebSocket 连接失败**
   - 检查 websockify 是否运行
   - 确认端口映射正确
   - 查看浏览器控制台错误

3. **Cloudflare Tunnel 问题**
   - 验证 Token 是否正确
   - 检查网络连接
   - 查看 cloudflared 日志

### 调试技巧

```bash
# 检查 VNC 连接
telnet localhost 5900

# 测试 WebSocket
wscat -c ws://localhost:6080

# 查看 cloudflared 状态
cloudflared tunnel info github-rdp
```

## 📊 监控和日志

### 连接状态监控

```typescript
// 在组件中添加监控
const [connectionMetrics, setConnectionMetrics] = useState({
  latency: 0,
  bandwidth: 0,
  frameRate: 0
})

rfb.addEventListener('fbrect', (e) => {
  // 更新帧率统计
  updateFrameRate()
})
```

### 性能指标

- **延迟**: < 100ms (局域网), < 300ms (广域网)
- **带宽**: 1-10 Mbps (取决于屏幕分辨率和内容)
- **帧率**: 15-30 FPS

## 🎯 最佳实践

1. **连接管理**
   - 实现自动重连机制
   - 添加连接超时处理
   - 优雅地处理断线

2. **用户体验**
   - 显示连接状态指示器
   - 提供键盘快捷键帮助
   - 实现全屏模式

3. **安全性**
   - 使用强密码策略
   - 启用 SSL/TLS 加密
   - 实现会话超时

## 🔗 相关资源

- [noVNC 官方文档](https://github.com/novnc/noVNC)
- [Apache Guacamole](https://guacamole.apache.org/)
- [Cloudflare Tunnel 文档](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [TightVNC](https://www.tightvnc.com/)

## 💡 扩展功能

1. **多显示器支持**
2. **文件传输功能**
3. **剪贴板同步**
4. **音频重定向**
5. **移动端优化**

---

**注意**: 此方案仅用于开发和测试环境。生产环境请确保遵循安全最佳实践。 