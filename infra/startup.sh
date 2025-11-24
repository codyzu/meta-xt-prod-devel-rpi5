#!/usr/bin/env bash
set -euxo pipefail

DISK_ID="/dev/disk/by-id/google-xen-build-cache"
BUILD_MOUNT="/mnt/build"
DOCKER_ROOT="${BUILD_MOUNT}/docker"
DEV_SCRIPT_URL="https://gist.githubusercontent.com/codyzu/552372e4a9331c9109915ee53bafe908/raw/setup-dev-shell.sh"
GITHUB_RUNNER_DIR="${BUILD_MOUNT}/builder/actions-runner"

setup_base_packages() {
  apt-get update

  # Core tools, Docker, BuildKit plugin, shell stuff, and GCP guest agents
  apt-get install -y \
    docker.io \
    docker-buildx \
    wget \
    zsh \
    curl \
    jq \
    google-compute-engine \
    google-osconfig-agent \
    google-compute-engine-oslogin \
    google-guest-agent

  # Install Ops Agent (modern replacement for google-fluentd)
  curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
  bash add-google-cloud-ops-agent-repo.sh --also-install || true
}

mount_build_disk() {
  mkdir -p "${BUILD_MOUNT}"

  if ! grep -q "xen-build-cache" /etc/fstab; then
    echo "${DISK_ID} ${BUILD_MOUNT} ext4 defaults 0 2" >> /etc/fstab
  fi

  # Will succeed once the disk has been formatted manually the first time
  mount -a || true
}

configure_docker() {
  # Persistent Docker data on the build disk
  mkdir -p "${DOCKER_ROOT}"
  chown root:root "${DOCKER_ROOT}"
  chmod 755 "${DOCKER_ROOT}"

  mkdir -p /etc/docker
  cat >/etc/docker/daemon.json <<JSON
{
  "data-root": "${DOCKER_ROOT}",
  "features": {
    "buildkit": true
  }
}
JSON

  # Docker still expects this temp dir on the root disk in some code paths
  mkdir -p /var/lib/docker/tmp

  systemctl daemon-reload || true
  systemctl enable docker || true
  systemctl restart docker || true
}

setup_users() {
  # Ensure cody exists and uses zsh
  if ! id "cody" >/dev/null 2>&1; then
    useradd -m -s /usr/bin/zsh cody
  else
    chsh -s /usr/bin/zsh cody || true
  fi

  # Add cody to docker group
  usermod -aG docker cody || true

  # Also add ubuntu to docker group if it exists
  if id "ubuntu" >/dev/null 2>&1; then
    usermod -aG docker ubuntu || true
  fi
}

run_dev_setup() {
  # Avoid zsh first run wizard
  sudo -u cody touch /home/cody/.zshrc
  chown cody:cody /home/cody/.zshrc

  # Run your dev shell setup as cody (non interactive)
  su - cody -c "wget -qO- ${DEV_SCRIPT_URL} | bash" || true
}

start_github_runner() {
  # Assumes you have already:
  #   - downloaded the runner into ${GITHUB_RUNNER_DIR}
  #   - run ./config.sh once manually (as cody) to register it
  # This function just reinstalls and starts the service each boot.

  if [ -d "${GITHUB_RUNNER_DIR}" ]; then
    cd "${GITHUB_RUNNER_DIR}"

    # Make sure files belong to cody
    chown -R cody:cody "${GITHUB_RUNNER_DIR}"

    # Install and start the runner service
    ./svc.sh install cody || true
    ./svc.sh start || true
  fi
}

main() {
  setup_base_packages
  mount_build_disk
  configure_docker
  setup_users
  run_dev_setup
  start_github_runner
}

main "$@"