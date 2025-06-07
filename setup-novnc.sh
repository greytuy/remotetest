#!/bin/bash

# 下载并设置 noVNC
echo "正在下载 noVNC..."

# 创建 public 目录（如果不存在）
mkdir -p public

# 下载 noVNC
if [ ! -d "public/novnc" ]; then
    curl -L https://github.com/novnc/noVNC/archive/refs/tags/v1.6.0.tar.gz | tar -xz -C public
    mv public/noVNC-1.6.0 public/novnc
    echo "noVNC 下载完成！"
else
    echo "noVNC 已存在，跳过下载"
fi

# 设置权限
chmod -R 755 public/novnc

echo "noVNC 设置完成！"
echo "现在可以在应用中使用浏览器端远程桌面功能了。" 