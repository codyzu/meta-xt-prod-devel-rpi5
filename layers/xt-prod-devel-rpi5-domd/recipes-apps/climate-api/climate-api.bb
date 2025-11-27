SUMMARY = "Simple Flask API exposing BME280 sensor data"
DESCRIPTION = "DomD climate API: Flask service reading BME280 via smbus2"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://sensor_bme280.py;beginline=1;endline=5;md5=a54a32da2a9e2649b9e0bd79c03e5660"

inherit systemd

SRC_URI = " \
    file://sensor_bme280.py \
    file://climate_api.py \
    file://climate-api.service \
"

S = "${WORKDIR}"

# Runtime dependencies: Python core + Flask + smbus2
RDEPENDS:${PN} = " \
    python3-core \
    python3-flask \
    python3-smbus2 \
"

do_install() {
    # Install scripts
    install -d ${D}${bindir}
    install -m 0755 ${WORKDIR}/sensor_bme280.py ${D}${bindir}/sensor_bme280.py
    install -m 0755 ${WORKDIR}/climate_api.py  ${D}${bindir}/climate_api.py

    # Install systemd unit
    install -d ${D}${systemd_system_unitdir}
    install -m 0644 ${WORKDIR}/climate-api.service \
        ${D}${systemd_system_unitdir}/climate-api.service
}

SYSTEMD_SERVICE:${PN} = "climate-api.service"
