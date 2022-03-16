import wrf
import netCDF4 as nc
import numpy as np
import matplotlib.pyplot as plt


def sounding(wrf_filename, lat, lon, hmax=None):
    if hmax is None:
        hmax = 8000

    wrf_file = nc.Dataset(wrf_filename)
    x, y = wrf.ll_to_xy(wrf_file, lat, lon)

    data = {}
    data["press"] = np.rint(wrf.getvar(wrf_file, "pressure", meta=False)[:, x, y]).astype(int)
    data["hght"] = np.rint(wrf.getvar(wrf_file, "z", meta=False)[:, x, y]).astype(int)
    data["temp"] = np.rint(wrf.getvar(wrf_file, "tc", meta=False)[:, x, y]).astype(int)
    data["dwpt"] = np.rint(wrf.getvar(wrf_file, "td", meta=False)[:, x, y]).astype(int)
    data["wspd"], data["wdir"] = np.rint(wrf.getvar(wrf_file, "uvmet_wspd_wdir", meta=False)[:, :, x, y]).astype(int)

    sounding = [dict(zip(data.keys(), vals)) for vals in zip(*data.values())]
    sounding = [s for s in sounding if s["hght"] < hmax]
    return sounding


def application(environ, start_response):
    q = {}
    for item in environ["QUERY_STRING"].split("&"):
        try:
            key, value = item.split("=")
            q[key] = value
        except ValueError:
            q[item] = None
    if not ("lat" in q and "lon" in q and q["lat"] and q["lon"]):
        status = "400 Bad Request"
        response_headers = [("Content-type", "application/octet-stream")]
        start_response(status, response_headers)
        return [b"At least one of lat or lon is invalid or missing. Cannot compute sounding."]

    lat = float(q["lat"])
    lon = float(q["lon"])
    hmax = float(q["hmax"]) if "hmax" in q and q["hmax"] else None
    wrf_filename = environ["DOCUMENT_ROOT"] + "/results/OUT/TIR/2022-03-15/0/wrfout_d02_2022-03-07_12:00:00"
    sounding_data = sounding(wrf_filename, lat, lon, hmax)

    status = "200 OK"
    response_headers = [("Content-type", "application/json")]
    start_response(status, response_headers)
    return [bytes(str(sounding_data), encoding="utf-8")]


# For testing
if __name__ == "__main__":
    sounding_data = sounding("../../results/OUT/TIR/2022-03-15/0/wrfout_d02_2022-03-07_12:00:00", 50, 12)
    print(sounding_data)
