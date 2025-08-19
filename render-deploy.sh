#!/bin/bash
set -e

echo "Installing dependencies..."
pnpm install

echo "Generating Prisma client..."
npx turbo db:generate

echo "Building API and dependencies..."
pnpx turbo build --filter=api

echo "API build complete!"