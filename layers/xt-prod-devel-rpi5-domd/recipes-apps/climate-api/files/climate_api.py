#!/usr/bin/env python3
import time

from flask import Flask, jsonify
from sensor_bme280 import make_bme280_reader

app = Flask(__name__)

# Create the reader once so it can reuse calibration and bus
get_data = make_bme280_reader()


@app.route("/api/sensor", methods=["GET"])
def sensor_api():
    """
    Return a single snapshot from the BME280 sensor.
    """
    t_c, p_hpa, h_pct = get_data()
    return jsonify(
        {
            "temperature_c": t_c,
            "pressure_hpa": p_hpa,
            "humidity_pct": h_pct,
            "timestamp": time.time(),
        }
    )


@app.route("/health", methods=["GET"])
def health():
    """
    Simple health check endpoint for debugging.
    """
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    # Listen on all interfaces so domU can reach it via domD IP
    app.run(host="0.0.0.0", port=5000, debug=False)
