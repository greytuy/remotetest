@echo off
chcp 65001 >nul

echo 🚀 GitHub Actions 远程控制器 - 快速启动
echo ========================================

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装，请先安装 Node.js 18+ 版本
    pause
    exit /b 1
)

REM 检查npm是否安装
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm 未安装，请先安装 npm
    pause
    exit /b 1
)

echo ✅ Node.js 和 npm 已安装

REM 安装依赖
echo 📦 正在安装依赖...
npm install

if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo ✅ 依赖安装完成

REM 启动开发服务器
echo 🚀 启动开发服务器...
echo 🌐 服务器将在 http://localhost:3000 启动
echo 按 Ctrl+C 停止服务器
echo.

npm run dev

pause 