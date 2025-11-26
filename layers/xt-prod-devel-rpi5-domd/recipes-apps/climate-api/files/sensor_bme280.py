#!/usr/bin/env python3
import time
from smbus2 import SMBus

I2C_BUS = 0
ADDR = 0x76

REG_ID        = 0xD0
REG_RESET     = 0xE0
REG_CTRL_H    = 0xF2
REG_STATUS    = 0xF3
REG_CTRL_M    = 0xF4
REG_CONFIG    = 0xF5
REG_PRESS_MSB = 0xF7  # 8 bytes: P[19:12],P[11:4],P[3:0]+T[19:16]...

CALIB_00_25 = 0x88
CALIB_26_41 = 0xE1

RESET_CMD = 0xB6


def make_bme280_reader(bus_id=I2C_BUS, address=ADDR):
    """
    Factory that sets up the BME280 and returns:

        get_data() -> (temp_c, pressure_hpa, humidity_pct)
    """
    bus = SMBus(bus_id)

    def reg_read(reg, length=1):
        if length == 1:
            return bus.read_byte_data(address, reg)
        return bus.read_i2c_block_data(address, reg, length)

    def reg_write(reg, val):
        bus.write_byte_data(address, reg, val)

    def to_signed(val):
        if val & 0x8000:
            return -((~val & 0xFFFF) + 1)
        return val

    cal = {}

    def read_calibration():
        # Temp and pressure calibration
        calib1 = reg_read(CALIB_00_25, 26)
        # Humidity calibration is split
        calib2 = reg_read(CALIB_26_41, 7)

        # Temperature
        cal["dig_T1"] = calib1[1] << 8 | calib1[0]
        cal["dig_T2"] = to_signed(calib1[3] << 8 | calib1[2])
        cal["dig_T3"] = to_signed(calib1[5] << 8 | calib1[4])

        # Pressure
        cal["dig_P1"] = calib1[7] << 8 | calib1[6]
        cal["dig_P2"] = to_signed(calib1[9] << 8 | calib1[8])
        cal["dig_P3"] = to_signed(calib1[11] << 8 | calib1[10])
        cal["dig_P4"] = to_signed(calib1[13] << 8 | calib1[12])
        cal["dig_P5"] = to_signed(calib1[15] << 8 | calib1[14])
        cal["dig_P6"] = to_signed(calib1[17] << 8 | calib1[16])
        cal["dig_P7"] = to_signed(calib1[19] << 8 | calib1[18])
        cal["dig_P8"] = to_signed(calib1[21] << 8 | calib1[20])
        cal["dig_P9"] = to_signed(calib1[23] << 8 | calib1[22])

        # Humidity
        cal["dig_H1"] = calib1[25]
        cal["dig_H2"] = to_signed(calib2[1] << 8 | calib2[0])
        cal["dig_H3"] = calib2[2]
        e4 = calib2[3]
        e5 = calib2[4]
        e6 = calib2[5]
        cal["dig_H4"] = to_signed((e4 << 4) | (e5 & 0x0F))
        cal["dig_H5"] = to_signed((e6 << 4) | (e5 >> 4))
        cal["dig_H6"] = to_signed(calib2[6])

    def configure():
        # Humidity oversampling x1
        reg_write(REG_CTRL_H, 0x01)
        # Temp and pressure oversampling x1, mode normal
        reg_write(REG_CTRL_M, 0x27)
        # Standby 1000 ms, filter off
        reg_write(REG_CONFIG, 0xA0)
        time.sleep(0.1)

    def read_raw():
        data = reg_read(REG_PRESS_MSB, 8)
        adc_p = (data[0] << 12) | (data[1] << 4) | (data[2] >> 4)
        adc_t = (data[3] << 12) | (data[4] << 4) | (data[5] >> 4)
        adc_h = (data[6] << 8) | data[7]
        return adc_t, adc_p, adc_h

    # One time setup
    read_calibration()
    configure()

    def get_data():
        adc_t, adc_p, adc_h = read_raw()

        # Pull calibration into locals
        dig_T1 = cal["dig_T1"]
        dig_T2 = cal["dig_T2"]
        dig_T3 = cal["dig_T3"]

        dig_P1 = cal["dig_P1"]
        dig_P2 = cal["dig_P2"]
        dig_P3 = cal["dig_P3"]
        dig_P4 = cal["dig_P4"]
        dig_P5 = cal["dig_P5"]
        dig_P6 = cal["dig_P6"]
        dig_P7 = cal["dig_P7"]
        dig_P8 = cal["dig_P8"]
        dig_P9 = cal["dig_P9"]

        dig_H1 = cal["dig_H1"]
        dig_H2 = cal["dig_H2"]
        dig_H3 = cal["dig_H3"]
        dig_H4 = cal["dig_H4"]
        dig_H5 = cal["dig_H5"]
        dig_H6 = cal["dig_H6"]

        # Temperature compensation (unchanged)
        var1 = (((adc_t >> 3) - (dig_T1 << 1)) * dig_T2) >> 11
        var2 = (
            (((((adc_t >> 4) - dig_T1) * ((adc_t >> 4) - dig_T1)) >> 12) * dig_T3)
            >> 14
        )
        t_fine = var1 + var2
        temp = (t_fine * 5 + 128) >> 8
        temp_c = temp / 100.0

        # Pressure compensation (unchanged)
        var1_p = t_fine - 128000
        var2_p = var1_p * var1_p * dig_P6
        var2_p = var2_p + ((var1_p * dig_P5) << 17)
        var2_p = var2_p + (dig_P4 << 35)
        var1_p = ((var1_p * var1_p * dig_P3) >> 8) + ((var1_p * dig_P2) << 12)
        var1_p = (((1 << 47) + var1_p) * dig_P1) >> 33

        if var1_p == 0:
            pressure_hpa = 0.0
        else:
            p = 1048576 - adc_p
            p = (((p << 31) - var2_p) * 3125) // var1_p
            var1_p2 = (dig_P9 * (p >> 13) * (p >> 13)) >> 25
            var2_p2 = (dig_P8 * p) >> 19
            p = ((p + var1_p2 + var2_p2) >> 8) + (dig_P7 << 4)
            pressure_hpa = p / 25600.0

        # Humidity compensation
        # This is a direct copy of your original working code, with self. removed
        v_x1_u32r = t_fine - 76800
        v_x1_u32r = (
            (((((adc_h << 14)
                - (dig_H4 << 20)
                - (dig_H5 * v_x1_u32r)) + 16384) >> 15)
             *
             (((((((v_x1_u32r * dig_H6) >> 10)
                  * (((v_x1_u32r * dig_H3) >> 11) + 32768)) >> 10)
                + 2097152) * dig_H2 + 8192) >> 14))
        )
        v_x1_u32r = v_x1_u32r - (
            (((((v_x1_u32r >> 15)
                * (v_x1_u32r >> 15)) >> 7) * dig_H1) >> 4)
        )

        if v_x1_u32r < 0:
            v_x1_u32r = 0
        if v_x1_u32r > 419430400:
            v_x1_u32r = 419430400

        hum = v_x1_u32r >> 12
        humidity = hum / 1024.0

        return temp_c, pressure_hpa, humidity

    return get_data


def read_chip_id(bus_id=I2C_BUS, address=ADDR):
    with SMBus(bus_id) as bus:
        return bus.read_byte_data(address, REG_ID)


def main():
    chip_id = read_chip_id()
    print(f"Chip ID: 0x{chip_id:02X}")
    if chip_id != 0x60:
        print("Warning: unexpected chip ID, expected 0x60 for BME280")

    get_data = make_bme280_reader()
    t, p, h = get_data()
    print(f"Temperature:  {t:6.2f} °C  Pressure:  {p:8.2f} hPa  Humidity: {h:5.2f} %")


if __name__ == "__main__":
    main()
