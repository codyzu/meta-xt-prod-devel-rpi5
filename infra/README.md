# Infrastructure: GCP Spot Builder VM with Terraform

This document explains how to set up, operate, and maintain the Google Cloud Platform (GCP) infrastructure used for your self‑hosted GitHub Actions builder VM. Everything is optimized for low cost, repeatability, and safe teardown.

---

## 1. Overview

This setup provisions:

- A **GCP Spot VM** (preemptible) that only runs during builds  
- A **persistent SSD disk** mounted at `/mnt/build` containing:
  - Yocto build cache
  - Docker persistent storage
  - The GitHub Actions runner installation
- A **startup script** that prepares the VM each time it boots  
- A **GitHub Actions workflow** that:
  - Starts the VM before a build
  - Runs the build on the VM
  - Shuts down the VM when done (unless disabled via env flag)

This keeps monthly costs low while providing fast and reproducible builds.

---

## 2. Repository Structure

```
infra/
  main.tf
  variables.tf
  startup.sh
  README.md   ← this file
.github/
  workflows/
    build.yml  ← starts VM, runs build, stops VM
```

---

## 3. Prerequisites

### Local tools

Install:

```
brew install opentofu
brew install --cask google-cloud-sdk
```

Authenticate:

```
gcloud auth login
gcloud auth application-default login
```

Set your project:

```
gcloud config set project <your-project-id>
```

---

## 4. GCP Resources Created

Terraform provisions:

### **4.1 Spot VM**
- Ubuntu 24.04 LTS
- 8 vCPUs
- 32 GB RAM (adjustable)
- Automatically preempted by Google when capacity is needed
- Auto‑shutdown via GitHub Actions

### **4.2 Persistent SSD**
- Typically 300–500 GB  
- Attached at `/mnt/build`
- Stores:
  - Yocto build directory
  - Docker storage (via daemon.json override)
  - GitHub Actions runner install

### **4.3 Service Account**
Needs only:
- Compute Admin (start/stop instances)
- Service Account User

Store the key JSON as:

```
GCP_SERVICE_ACCOUNT_KEY
```

in GitHub Secrets.

---

## 5. Terraform Usage

### **Initialize**

```
cd infra
tofu init
```

### **Create**

```
tofu apply
```

### **Destroy**

```
tofu destroy
```

---

## 6. VM Startup Behavior

When the VM boots:

1. The persistent disk is mounted at `/mnt/build`
2. Docker is configured to use `/mnt/build/docker`
3. The GitHub Actions runner is installed (if missing)
4. The runner is registered
5. The runner service starts
6. Optional dev tools are installed

This script runs every boot, making Spot VM preemption safe.

---

## 7. GitHub Workflow Integration

Your GitHub workflow:

- Starts the VM using `gcloud compute instances start`
- Runs the build on the runner
- Optionally shuts the VM down using:

```
gcloud compute instances stop
```

You can disable teardown by setting:

```
DISABLE_SHUTDOWN: "true"
```

---

## 8. Connecting to the VM from VS Code

In VS Code:
1. Install **Remote SSH**
2. Add to your SSH config:

```
Host gcp-builder
    HostName <external-ip>
    User cody
    IdentityFile ~/.ssh/id_rsa
```

3. Connect via "Remote‑SSH: Connect to Host..."

Tip: Retrieve the VM’s IP:

```
gcloud compute instances list
```

---

## 9. Troubleshooting

### VM boots but runner doesn't connect
- Ensure token is valid  
- Re-run the startup script manually:
  ```
  sudo /startup.sh
  ```

### Docker fails due to missing directories
Ensure `/mnt/build/docker` exists:
```
sudo mkdir -p /mnt/build/docker
sudo systemctl restart docker
```

### Ops Agent shows authentication errors
The VM must have:
- Default service account attached
- Monitoring + Logging scopes enabled

---

## 10. Cost Management

- VM only runs during builds  
- Persistent disk is the only always‑billed resource  
- Using Spot VM cuts CPU costs by 70–90%  
- Optional: run weekly prune:

```
docker system prune -af
```

---

## 11. When to Resize Resources

Increase VM size if:
- GCC processes saturate CPUs for extended periods
- Yocto OOM‑kills tasks repeatedly

Increase disk size if:
- Yocto or Docker storage exceeds 80%

---

## 12. Maintaining the System

Recommended monthly tasks:
- Update runner:  
  ```
  cd /mnt/build/builder/actions-runner
  ./svc.sh stop
  ./svc.sh uninstall
  ./config.sh --replace
  ```
- Update system packages  
- Manually prune old Yocto tmp directories

---

## 13. Recreating Everything From Scratch

1. Delete VM  
2. Delete persistent disk  
3. Run `tofu apply`  
4. The VM boots, runs startup.sh, and reinstall everything automatically  

This ensures your build infrastructure stays reproducible and low‑friction.

---

## 14. Notes

Back up `/mnt/build` occasionally. It contains:
- Full build cache  
- Runner state  
- Git repositories  
- Toolchains  

A simple approach:
```
rsync -av /mnt/build gs://my-backup-bucket/build/
```
