SUMMARY = "Systemd unit to launch BusyBox httpd for the web DomU"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

SRC_URI = "file://busybox-httpd.service"

S = "${WORKDIR}"

RDEPENDS:${PN} += "busybox"

inherit systemd

SYSTEMD_PACKAGES = "${PN}"
SYSTEMD_SERVICE:${PN} = "busybox-httpd.service"
SYSTEMD_AUTO_ENABLE:${PN} = "enable"

do_install() {
    install -d ${D}${systemd_system_unitdir}
    install -m 0644 ${WORKDIR}/busybox-httpd.service \
        ${D}${systemd_system_unitdir}/busybox-httpd.service
}

FILES:${PN} += "${systemd_system_unitdir}/busybox-httpd.service"
