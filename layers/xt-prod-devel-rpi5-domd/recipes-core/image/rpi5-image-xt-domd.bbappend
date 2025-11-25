PACKAGE_INSTALL:append = " \
    kernel-modules \
"

WIFI_PACKAGES = "			\
    wpa-supplicant			\
    iw					\
    wireless-regdb-static		\
    linux-firmware-rpidistro-bcm43455	\
    kernel-module-brcmfmac		\
"

CAN_PACKAGES = "			\
    iproute2				\
    can-utils				\
"

GFX_PACKAGES = "                       \
    mesa                                \
    libdrm                              \
    kmscube                             \
"

IMAGE_INSTALL:append = "	\
    optee-test			\
    xen-tools-vchan		\
    ${@bb.utils.contains("MACHINE_FEATURES", "domd_wifi", "${WIFI_PACKAGES}", "" ,d)} \
    ${@bb.utils.contains("MACHINE_FEATURES", "domd_can", "${CAN_PACKAGES}", "" ,d)}   \
    ${@bb.utils.contains("MACHINE_FEATURES", "domd_hdmi", "${GFX_PACKAGES}", "" ,d)} \
    i2c-tools \
    openssh \
    openssh-sftp-server \
    python3 \
    python3-smbus2 \
    python3-flask \
    curl \
"

# rootfs have to be 8 GiB, expressed in KiB
IMAGE_ROOTFS_SIZE = "8388608"
