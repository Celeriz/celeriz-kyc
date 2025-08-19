#!/bin/bash
set -e

echo "Installing dependencies..."
pnpm install

echo "Building API and dependencies..."
pnpx turbo build --filter=api

echo "API build complete!"