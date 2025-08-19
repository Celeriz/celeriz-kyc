#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Building API and dependencies..."
npx turbo build --filter=api

echo "API build complete!"