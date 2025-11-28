SUMMARY = "Climate dashboard UI"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://LICENSE;md5=<your license hash>"

inherit npm

SRC_URI = "file://src/"

S = "${WORKDIR}/src"

do_compile() {
    npm install
    npm run build
}

do_install() {
    install -d ${D}/var/www
    cp -r dist/* ${D}/var/www/
}
