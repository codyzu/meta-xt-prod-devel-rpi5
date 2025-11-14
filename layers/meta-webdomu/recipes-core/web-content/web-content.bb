SUMMARY = "Static HTML content for the web DomU"
LICENSE = "CLOSED"

SRC_URI = "file://index.html"

S = "${WORKDIR}"

do_install() {
    install -d ${D}/var/www
    install -m 0644 ${WORKDIR}/index.html ${D}/var/www/index.html
}

FILES:${PN} = "/var/www/index.html"
