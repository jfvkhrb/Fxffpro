#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
# Run after uploading this project to a GitHub repository.
REPO="${1:-}"
if [[ ! "$REPO" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  echo "Usage: bash install-remote.sh OWNER/REPOSITORY" >&2
  exit 2
fi
DEST="${CRAFTSERVER_DIR:-$HOME/CraftServer}"
if [[ -e "$DEST" ]]; then
  echo "Destination already exists: $DEST" >&2
  echo "Move/backup it first or set CRAFTSERVER_DIR to a new path." >&2
  exit 2
fi
pkg update -y
pkg install git nodejs unzip -y
git clone "https://github.com/$REPO.git" "$DEST"
cd "$DEST/CraftServerWeb" 2>/dev/null || cd "$DEST"
bash install.sh
echo "Installed. Start with: cd '$DEST/CraftServerWeb' && bash start.sh"
