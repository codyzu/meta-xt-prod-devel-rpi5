SUMMARY = "Climate dashboard UI"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://LICENSE;md5=c9274ade510cdb6e4b50c72d373ebfe4"

inherit npm

SRC_URI = "file://src/ \
    file://LICENSE \
"

S = "${WORKDIR}/src"

do_compile() {
    npm install
    npm run build
}

do_install() {
    install -d ${D}/var/www
    cp -r dist/* ${D}/var/www/
}

FILES:${PN} += "/var/www"
