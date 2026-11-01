#!/bin/bash
# ─────────────────────────────────────────────────────
# Zenbil — Quick commit and push to GitHub
# Usage:  bash push.sh "your commit message"
# Example: bash push.sh "Add product reviews feature"
# ─────────────────────────────────────────────────────

cd /home/demoz/myweb/zenbil

MESSAGE=${1:-"Update: $(date '+%Y-%m-%d %H:%M')"}

git add .
git commit -m "$MESSAGE"
git push origin main

echo ""
echo "✅ Pushed to GitHub successfully!"
echo "🔗 https://github.com/anchoredinlord/zenbile"
