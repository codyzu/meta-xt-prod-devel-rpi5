#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

CONFIG_FILE="${MOULIN_CONFIG:-rpi5.yaml}"
BUILD_FILE="${MOULIN_BUILD_FILE:-build.ninja}"
STATE_DIR="${MOULIN_STATE_DIR:-.ci-cache}"
MOULIN_ARGS_FILE="${STATE_DIR}/moulin-args.txt"

mkdir -p "${STATE_DIR}"

MOULIN_ARGS=("$@")
if [ "${#MOULIN_ARGS[@]}" -eq 0 ]; then
  MOULIN_SIGNATURE="__no_args__"
else
  MOULIN_SIGNATURE="$(printf '%q ' "${MOULIN_ARGS[@]}")"
fi

needs_moulin=0
if [ ! -f "${BUILD_FILE}" ]; then
  echo "📄 [build] ${BUILD_FILE} missing; running moulin."
  needs_moulin=1
elif [ "${CONFIG_FILE}" -nt "${BUILD_FILE}" ]; then
  echo "♻️ [build] ${CONFIG_FILE} is newer than ${BUILD_FILE}; regenerating."
  needs_moulin=1
fi

if [ ! -f "${MOULIN_ARGS_FILE}" ]; then
  needs_moulin=1
elif [ "${MOULIN_SIGNATURE}" != "$(cat "${MOULIN_ARGS_FILE}")" ]; then
  echo "🔁 [build] Moulin arguments changed; regenerating build graph."
  needs_moulin=1
fi

if [ "${needs_moulin}" -eq 1 ]; then
  moulin_cmd=(moulin "${CONFIG_FILE}")
  if [ "${#MOULIN_ARGS[@]}" -gt 0 ]; then
    moulin_cmd+=("${MOULIN_ARGS[@]}")
  fi
  echo "🛠️ [build] ${moulin_cmd[*]}"
  "${moulin_cmd[@]}"
  printf '%s\n' "${MOULIN_SIGNATURE}" > "${MOULIN_ARGS_FILE}"
else
  echo "✅ [build] Reusing existing ${BUILD_FILE} (inputs unchanged)."
fi

IFS=' ' read -r -a ninja_targets <<< "${NINJA_TARGETS:-full.img rootfs.img}"
if [ "${#ninja_targets[@]}" -eq 0 ]; then
  echo "⚠️ [build] No ninja targets configured via NINJA_TARGETS." >&2
  exit 1
fi

ninja_cmd=(ninja "${ninja_targets[@]}")
echo "🎯 [build] ${ninja_cmd[*]}"

artifacts_to_clean=()
for target in "${ninja_targets[@]}"; do
  if [ -e "${target}" ]; then
    artifacts_to_clean+=("${target}")
  fi
done

if [ "${#artifacts_to_clean[@]}" -gt 0 ]; then
  echo "🧹 [build] Removing stale target(s): ${artifacts_to_clean[*]}"
  rm -f -- "${artifacts_to_clean[@]}"
fi

"${ninja_cmd[@]}"

echo "🎉 [build] Done."
