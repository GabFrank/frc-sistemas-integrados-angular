#!/bin/bash
# Run this script to set up commitlint and husky for conventional commits
npm install --save-dev @commitlint/cli @commitlint/config-conventional
npx husky set .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
echo "Commitlint and husky configured successfully."
