#!/usr/bin/env bash
# Redeploy: builds and force-pushes dist/ to the gh-pages branch (GitHub Pages serves it).
# Usage: npm run deploy     (needs `gh auth login` for the repo owner)
set -euo pipefail
cd "$(dirname "$0")/.."
REPO_URL="$(git remote get-url origin)"
npm run build
TMP="$(mktemp -d)"
cp -r dist/. "$TMP/"
touch "$TMP/.nojekyll"
( cd "$TMP" && git init -q -b gh-pages && git add -A && git -c user.name="${GIT_AUTHOR_NAME:-lantern-night}" -c user.email="${GIT_AUTHOR_EMAIL:-lantern-night@users.noreply.github.com}" commit -q -m "Deploy $(date -u +%FT%TZ)" && git -c credential.helper='!gh auth git-credential' push -q -f "$REPO_URL" gh-pages )
rm -rf "$TMP"
echo "Deployed. Live URL: https://$(gh api user -q .login).github.io/$(basename -s .git "$REPO_URL")/"
