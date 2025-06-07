# GitHub Actions 远程桌面控制器

一个用于管理和控制GitHub Actions远程Windows桌面的现代化Web前端应用。

## 🚀 功能特性

- **🔧 GitHub配置管理**: 安全地配置GitHub Personal Access Token和仓库信息
- **🎮 远程控制**: 一键启动/停止GitHub Actions工作流
- **📊 实时状态监控**: 实时显示工作流运行状态和连接信息
- **🔐 连接信息展示**: 显示远程桌面用户名和密码信息
- **💾 配置持久化**: 自动保存配置信息到浏览器
- **📱 响应式设计**: 支持桌面和移动设备
- **🌐 多平台部署**: 支持Vercel和Cloudflare Workers部署

## 🛠️ 技术栈

- **前端框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **状态管理**: React Hooks
- **图标**: Lucide React
- **类型检查**: TypeScript
- **部署平台**: Vercel / Cloudflare Workers

## 📦 安装依赖

```bash
npm install
```

## 🔧 本地开发

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 🚀 部署指南

### Vercel 部署

1. 将代码推送到GitHub仓库
2. 在Vercel控制台导入项目
3. Vercel会自动检测Next.js项目并进行部署
4. 部署完成后访问提供的URL

### Cloudflare Workers 部署

1. 安装Wrangler CLI:
```bash
npm install -g wrangler
```

2. 登录Cloudflare:
```bash
wrangler login
```

3. 构建项目:
```bash
npm run build
```

4. 部署到Cloudflare Workers:
```bash
wrangler publish
```

## ⚙️ 使用说明

### 1. GitHub配置

#### 创建Personal Access Token
1. 访问 GitHub Settings > Developer settings > Personal access tokens
2. 点击 "Generate new token (classic)"
3. 选择以下权限:
   - `repo` (完整仓库访问权限)
   - `actions` (GitHub Actions权限)
4. 复制生成的token

#### 配置仓库信息
- 在前端界面填入GitHub Token
- 填入仓库名称 (格式: `username/repository`)
- 点击"保存配置"

### 2. 控制远程桌面

#### 启动流程
1. 确保GitHub仓库已配置必要的Secrets:
   - `RDP_PASSWORD`: 远程桌面密码 (至少12位，包含大小写字母、数字和特殊字符)
   - `TUNNEL_TOKEN`: Cloudflare Tunnel令牌
2. 点击"启动"按钮
3. 等待2-3分钟让服务初始化
4. 查看连接信息获取用户名和密码

#### 连接远程桌面
- 使用Windows远程桌面连接客户端
- 用户名: `runneradmin`
- 密码: GitHub Secrets中设置的 `RDP_PASSWORD`
- 连接地址: 通过Cloudflare Tunnel提供

### 3. 监控和管理

- **实时状态**: 前端会每30秒自动检查工作流状态
- **手动刷新**: 点击刷新按钮获取最新状态
- **查看日志**: 点击"在GitHub中查看"链接查看详细运行日志
- **停止服务**: 点击"停止"按钮取消运行中的工作流

## 🔒 安全注意事项

1. **Token安全**: 
   - 不要在公共场所暴露GitHub Token
   - 定期更换Token
   - 使用最小权限原则

2. **密码策略**:
   - RDP密码必须足够复杂
   - 定期更换密码
   - 不要使用弱密码

3. **访问控制**:
   - 仅在受信任的网络环境中使用
   - 及时停止不需要的服务
   - 监控GitHub Actions使用量

## 🛠️ 自定义配置

### 修改工作流
- 编辑 `.github/workflows/main.yml` 文件
- 根据需要调整服务配置
- 确保与前端界面的交互保持一致

### 样式定制
- 修改 `tailwind.config.js` 文件调整主题
- 编辑 `app/globals.css` 文件自定义样式
- 修改组件中的类名调整外观

### 功能扩展
- 在 `app/page.tsx` 中添加新功能
- 创建新的React组件
- 扩展GitHub API集成

## 📁 项目结构

```
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── .github/workflows/     # GitHub Actions工作流
│   └── main.yml          # 远程桌面工作流
├── public/               # 静态资源
├── package.json          # 项目配置
├── tailwind.config.js    # Tailwind配置
├── tsconfig.json         # TypeScript配置
├── vercel.json           # Vercel部署配置
├── wrangler.toml         # Cloudflare Workers配置
└── PROJECT_GUIDE.md      # 项目指导文档
```

## 🐛 故障排除

### 常见问题

1. **Token权限不足**
   - 确保Token具有 `repo` 和 `actions` 权限
   - 检查Token是否过期

2. **工作流启动失败**
   - 验证仓库名称格式是否正确
   - 确保工作流文件存在且语法正确
   - 检查GitHub Actions是否启用

3. **连接超时**
   - 等待服务完全初始化 (通常需要2-3分钟)
   - 检查Cloudflare Tunnel配置
   - 验证网络连接

4. **密码验证失败**
   - 确保RDP_PASSWORD符合复杂性要求
   - 检查Secrets配置是否正确
   - 验证密码是否包含特殊字符

### 调试建议

1. 使用浏览器开发者工具查看网络请求
2. 查看GitHub Actions运行日志
3. 检查Cloudflare Tunnel状态
4. 验证所有必需的Secrets是否已设置

## 📞 支持

如有问题或建议，请通过以下方式联系:

- GitHub Issues
- 项目文档
- 社区论坛

## 📄 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。 