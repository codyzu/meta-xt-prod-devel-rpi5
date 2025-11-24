# GCP Builder and GitHub Runner

This document describes how the self-hosted GitHub Actions runner is set up on the GCP builder VM and how to work with it day to day. The goal is simple: cheap and fast builds for the RPi / Yocto project, using a Spot VM with a persistent disk and a runner that comes back to life whenever the VM starts.

---

## Overview

- Builder VM  
  - Machine: GCP `n2-standard-8` Spot instance  
  - OS: Ubuntu 24.04 LTS  
  - Name: `xen-yocto-builder`  
  - Zone: `europe-west1-b`
- Persistent disk  
  - Name: `xen-build-cache`  
  - Size: `200 GB`  
  - Mounted at `/mnt/build`
- Key directories on the VM  
  - `/mnt/build/builder/meta-xt-prod-devel-rpi5` – project repo for builds  
  - `/mnt/build/docker` – Docker data root  
  - `/mnt/build/github-runner` – GitHub Actions runner install
- GitHub runner  
  - Self-hosted runner for this repo  
  - Labels: `self-hosted`, `gcp-builder`  
  - Started automatically by the VM startup script

The GitHub Actions workflow in `.github/workflows/build-rpi.yml` starts the VM, runs the build on the runner, then stops the VM again by default.

---

## One-time runner setup

You should only need to do this when the runner is first created or if it is completely wiped.

1. SSH into the VM:

   ```bash
   gcloud compute ssh xen-yocto-builder --zone=europe-west1-b --project xen-rpi-builder
   ```

2. Make sure the persistent disk is mounted:

   ```bash
   df -h /mnt/build
   ```

3. Create the runner directory on the persistent disk:

   ```bash
   sudo mkdir -p /mnt/build/github-runner
   sudo chown cody:cody /mnt/build/github-runner
   cd /mnt/build/github-runner
   ```

4. Download the latest GitHub Actions runner for Linux (x64). From the repo settings page, GitHub gives you a snippet. It looks like:

   ```bash
   curl -o actions-runner-linux-x64.tar.gz -L https://github.com/actions/runner/releases/download/vXX.YY.ZZ/actions-runner-linux-x64-XX.YY.ZZ.tar.gz
   tar xzf actions-runner-linux-x64.tar.gz
   ```

5. From the repo settings page, create a registration token for a self-hosted runner and configure it:

   ```bash
   ./config.sh \
     --url https://github.com/<OWNER>/<REPO> \
     --token <REGISTRATION_TOKEN> \
     --name xen-yocto-builder \
     --labels gcp-builder \
     --work _work
   ```

6. Install and start the service as user `cody`:

   ```bash
   sudo ./svc.sh install cody
   sudo ./svc.sh start
   ```

Once this is done, the runner is registered with GitHub and the `startup.sh` script on the VM will install and start the service automatically on each boot. Because the runner lives on `/mnt/build/github-runner`, it survives VM recreation and Spot preemptions.

---

## How the workflow uses the runner

The workflow uses:

```yaml
runs-on: [self-hosted, gcp-builder]
```

This targets any runner that is self-hosted and has the `gcp-builder` label. The workflow has three jobs:

- `start-builder` – runs on a GitHub-hosted runner, authenticates to GCP, and starts the VM with `gcloud compute instances start`.
- `build` – runs on the self-hosted runner on the GCP VM and executes the RPi build.
- `stop-builder` – optionally stops the VM at the end using `gcloud compute instances stop`.

There are two easy ways to keep the VM alive after a run:

1. Manual run from the Actions tab with the `keep_vm_alive` input set to `true`.
2. Push with a commit message that contains `[keep-vm]`.

If either is set, the `stop-builder` job is skipped.

---

## Connecting to the builder VM

You can connect directly to the builder VM using `gcloud compute ssh`:

```bash
gcloud compute ssh xen-yocto-builder --zone=europe-west1-b --project xen-rpi-builder
```

For VS Code Remote SSH:

1. Run `gcloud compute config-ssh` on your laptop so it writes host entries into `~/.ssh/config`.
2. In VS Code, use the Remote - SSH extension and connect to the `xen-yocto-builder` host.
3. Open `/mnt/build/builder/meta-xt-prod-devel-rpi5` as your workspace.

---

## Common maintenance tasks

**Check runner status on the VM**

```bash
sudo systemctl status actions.runner.*
sudo journalctl -u actions.runner.* -n 50 --no-pager
```

**Restart the runner service**

```bash
cd /mnt/build/github-runner
sudo ./svc.sh stop
sudo ./svc.sh start
```

**Update the runner version**

Occasionally:

1. Stop the service:

   ```bash
   cd /mnt/build/github-runner
   sudo ./svc.sh stop
   ```

2. Download the new release tarball from the GitHub Actions runner releases page.
3. Extract it over the existing install and then reconfigure:

   ```bash
   ./config.sh --replace \
     --url https://github.com/<OWNER>/<REPO> \
     --token <NEW_REGISTRATION_TOKEN> \
     --name xen-yocto-builder \
     --labels gcp-builder \
     --work _work

   sudo ./svc.sh install cody
   sudo ./svc.sh start
   ```

---

## When something looks wrong

- Runner offline in GitHub? Check `systemctl status actions.runner.*`.
- Runner missing the persistent disk? Confirm `/mnt/build` is mounted.
- Builds fail with “no space left on device”? Run `df -h`, prune old build artifacts, or bump the disk size in GCP/Terraform.
- Workflow stuck on “Waiting for a runner”? Confirm the VM is running, `startup.sh` finished, and the runner has the `gcp-builder` label.

If you decide to move to a different project, region, or machine type, the core idea stays the same: keep the runner and build cache on a persistent disk, use a startup script to rehydrate the VM, and use a self-hosted runner label so GitHub knows where to send jobs.
