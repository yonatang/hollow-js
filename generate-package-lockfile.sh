#!/bin/sh

echo "Generating pnpm-lock.yaml using Node.js 24 (linux/amd64) in Docker..."

docker run --rm \
  --platform linux/amd64 \
  -v "$PWD":/app \
  -w /app \
  node:24 \
  sh -c "npm install -g pnpm@9 && rm -rf node_modules pnpm-lock.yaml && pnpm install"

echo "✅ pnpm-lock.yaml generated successfully"!