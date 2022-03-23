from datetime import datetime, timedelta
import wrf
import netCDF4 as nc
import numpy as np
import matplotlib.pyplot as plt


def sounding(wrf_filename, lat, lon, hmax=None):
    if hmax is None:
        hmax = 10000

    wrf_file = nc.Dataset(wrf_filename)
    x, y = wrf.ll_to_xy(wrf_file, lat, lon)

    data = {}
    # GSD Sounding
    data["press"] = np.rint(wrf.getvar(wrf_file, "pressure", meta=False)[:, x, y]).astype(int)
    data["hght"] = np.rint(wrf.getvar(wrf_file, "z", meta=False)[:, x, y]).astype(int)
    data["temp"] = np.rint(wrf.getvar(wrf_file, "tc", meta=False)[:, x, y]).astype(int)
    data["dwpt"] = np.rint(wrf.getvar(wrf_file, "td", meta=False)[:, x, y]).astype(int)
    data["wspd"], data["wdir"] = np.rint(wrf.getvar(wrf_file, "uvmet_wspd_wdir", meta=False)[:, :, x, y]).astype(int)
    # Additional stuff
    data["cldfra"] = list(wrf.extract_vars(wrf_file, 0, "CLDFRA", meta=False).values())[0][:, x, y]
    data["cldfra"] = np.rint(data["cldfra"] * 100).astype(int) # in percent
    data["qcloud"] = list(wrf.extract_vars(wrf_file, 0, "QCLOUD", meta=False).values())[0][:, x, y]
    data["qcloud"] = np.rint(data["qcloud"] * 1000).astype(int) # in g/kg

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

    model = q["model"]
    run_date = q["run_date"]
    day = int(q["day"])
    valid_date = datetime.strftime(datetime.strptime(run_date, "%Y-%m-%d") + timedelta(days=day), "%Y-%m-%d")
    time = q["time"]
    hour = time[:2]
    minute = time[2:]
    lat = float(q["lat"])
    lon = float(q["lon"])
    hmax = float(q["hmax"]) if "hmax" in q and q["hmax"] else None
    wrf_filename = environ["DOCUMENT_ROOT"] + f"/results/OUT/{model}/{run_date}/{day}/wrfout_d02_{valid_date}_{hour}:{minute}:00"

    try:
        sounding_data = sounding(wrf_filename, lat, lon, hmax)
    except ValueError:
        status = "400 Bad Request"
        response_headers = [("Content-type", "text/plain")]
        start_response(status, response_headers)
        return [b"Could not create sounding."]

    status = "200 OK"
    response_headers = [("Content-type", "application/json")]
    start_response(status, response_headers)
    return [bytes(str(sounding_data).replace("'", "\""), encoding="utf-8")]


# For testing
if __name__ == "__main__":
    sounding_data = sounding("../../results/OUT/TIR/2022-03-23/0/wrfout_d02_2022-03-23_13:00:00", 50, 12)
    print(sounding_data)
