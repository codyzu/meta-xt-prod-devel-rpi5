# layers/meta-webdomu/recipes-core/busybox/busybox_%.bbappend

FILESEXTRAPATHS:prepend := "${THISDIR}/${PN}:"

# Bring in our tiny config fragment that enables HTTPD
SRC_URI += "file://httpd.cfg"
