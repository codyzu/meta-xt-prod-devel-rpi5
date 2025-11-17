#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-xtbuilder:latest}"
CONTAINER_WORKDIR="${CONTAINER_WORKDIR:-/home/builder/workspace}"
CONTAINER_BUILD_SCRIPT="${CONTAINER_BUILD_SCRIPT:-./scripts/build-rpi.sh}"
: "${DOCKER_RUN_EXTRA_ARGS:=}"
# shellcheck disable=SC2206  # intentional splitting for docker args
DOCKER_ARGS_ARRAY=(${DOCKER_RUN_EXTRA_ARGS})

echo "🐳 [build] Using image: ${IMAGE_NAME}"
echo "🗂️ [build] Mounting repo into: ${CONTAINER_WORKDIR}"
echo "🚀 [build] Executing inside container: ${CONTAINER_BUILD_SCRIPT}"

docker run --rm \
  -v "$(pwd):${CONTAINER_WORKDIR}" \
  -w "${CONTAINER_WORKDIR}" \
  -e USER_ID="$(id -u)" \
  -e USER_GID="$(id -g)" \
  -e USER_NAME="${USER_NAME:-builder}" \
  "${DOCKER_ARGS_ARRAY[@]}" \
  "${IMAGE_NAME}" \
  /bin/bash -lc "${CONTAINER_BUILD_SCRIPT}"

echo "✅ [build] Build finished."
