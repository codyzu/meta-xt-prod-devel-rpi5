#!/usr/bin/env bash
set -euo pipefail

need() { command -v "$1" >/dev/null 2>&1; }

# Run a command as root: use sudo if needed, or run directly if already root
as_root() {
  if [ "${EUID:-$(id -u)}" -eq 0 ]; then
    "$@"
  elif need sudo; then
    sudo "$@"
  else
    echo "⚠️  Need to run as root or have sudo installed to execute: $*" >&2
    exit 1
  fi
}

install_pkgs() {
  echo "📦 Installing base packages..."
  if need apt-get; then
    as_root apt-get update -y
    # Ignore failures for optional packages so the setup can keep going
    as_root apt-get install -y zsh git curl bat lsd nano || true
    if ! need bat && need batcat; then
      as_root update-alternatives --install /usr/bin/bat bat /usr/bin/batcat 10 || true
    fi
  elif need dnf; then
    as_root dnf install -y zsh git curl bat lsd nano
  elif need yum; then
    as_root yum install -y zsh git curl bat lsd nano
  elif need pacman; then
    as_root pacman -Sy --noconfirm zsh git curl bat lsd nano
  elif need apk; then
    as_root apk add --no-cache zsh git curl bat lsd nano
  elif need zypper; then
    as_root zypper --non-interactive install zsh git curl bat lsd nano
  else
    echo "⚠️  No supported package manager found. Install zsh git curl bat lsd nano manually, then rerun."
    exit 1
  fi
}

RUN_INSTALLS=${MINIMAL_DEV_SHELL_RUN_INSTALLS:-1}
SKIP_CHSH=${MINIMAL_DEV_SHELL_SKIP_CHSH:-0}
USE_MARKER=${MINIMAL_DEV_SHELL_USE_MARKER:-0}
MARKER=${MINIMAL_DEV_SHELL_MARKER:-"${HOME}/.minimal-dev-shell-done"}

if [ "$USE_MARKER" = "1" ] && [ -f "$MARKER" ]; then
  exit 0
fi

if [ "$RUN_INSTALLS" = "1" ]; then
  install_pkgs

  echo "✨ Installing Starship..."
  if ! need starship; then
    curl -sS https://starship.rs/install.sh | sh -s -- -y
  fi

  echo "🧠 Installing Atuin..."
  if ! need atuin; then
    curl --proto '=https' --tlsv1.2 -sSf https://setup.atuin.sh | bash
  fi
fi

ZSHRC="$HOME/.zshrc"
S="# >>> minimal-dev-shell start >>>"
E="# <<< minimal-dev-shell end <<<"

[ -f "$ZSHRC" ] && grep -qF "$S" "$ZSHRC" && sed -i.bak "/$S/,/$E/d" "$ZSHRC"
touch "$ZSHRC"

BAT_BIN=$(
  if need bat; then
    echo bat
  elif need batcat; then
    echo batcat
  else
    echo "\\cat"
  fi
)

LSD_BIN=$(
  if need lsd; then
    echo lsd
  else
    echo "\\ls --color=auto"
  fi
)

cat >>"$ZSHRC" <<EOF
$S
# Minimal dev shell setup - safe to re-run
if command -v starship >/dev/null 2>&1; then
  eval "\$(starship init zsh)"
fi
if command -v atuin >/dev/null 2>&1; then
  eval "\$(atuin init zsh)"
fi
alias cat='${BAT_BIN} --paging=never'
alias ls='${LSD_BIN}'
alias ll='ls -lh'
alias la='ls -lha'
# Automatically list directory contents on cd (interactive shells only)
chpwd() {
  [[ \$- == *i* ]] || return
  [[ -t 1 ]] || return
  [[ -n "\$LS_DISABLE" ]] && return
  if command -v lsd >/dev/null 2>&1; then
    lsd -lha 2>/dev/null || ls -lha
  else
    ls -lha
  fi
}
setopt AUTO_CD
setopt AUTO_PUSHD
setopt PUSHD_IGNORE_DUPS
$E
EOF

chmod 600 "$ZSHRC" || true

if [ "$SKIP_CHSH" != "1" ] && [ "${EUID:-$(id -u)}" -ne 0 ] && need chsh && command -v zsh >/dev/null 2>&1; then
  if [ "${SHELL:-}" != "$(command -v zsh)" ]; then
    echo "🔧 Setting default shell to zsh..."
    as_root chsh -s "$(command -v zsh)" "$(id -un)"
  fi
else
  echo "ℹ️  Skipping chsh (running as root, zsh missing, or chsh not available). You can start zsh with: zsh"
fi

if [ "$USE_MARKER" = "1" ]; then
  mkdir -p "$(dirname "$MARKER")"
  touch "$MARKER"
fi

echo
echo "✅ Done! Open a new terminal or run: exec zsh"
