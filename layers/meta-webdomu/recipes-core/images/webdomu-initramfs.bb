SUMMARY = "DomU initramfs with busybox httpd"
DESCRIPTION = "Thin initramfs image that runs BusyBox httpd to serve static content."
LICENSE = "MIT"

require recipes-core/images/core-image-thin-initramfs.bb

IMAGE_INSTALL:append = " \
    web-content \
    busybox-httpd-init \
    busybox-httpd \
    systemd-network-webdomu \
    openssh \
    openssh-sftp-server \
    climate-ui \
"

IMAGE_FSTYPES = "cpio.gz"
