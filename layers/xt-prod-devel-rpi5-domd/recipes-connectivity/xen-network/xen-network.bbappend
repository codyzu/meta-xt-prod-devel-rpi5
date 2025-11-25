FILESEXTRAPATHS:prepend := "${THISDIR}/files:"

SRC_URI += " \
    file://60-eth0-xenbr0.network \
    file://60-vif-xenbr0.network \
    file://50-xenbr0.network \
"

FILES:${PN} += " \
    ${sysconfdir}/systemd/network/60-eth0-xenbr0.network \
    ${sysconfdir}/systemd/network/60-vif-xenbr0.network \
"
