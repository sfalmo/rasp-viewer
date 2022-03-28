import netCDF4 as nc
import wrf
import numpy as np


def crosssection(wrf_filename, lat_start, lon_start, lat_end, lon_end, hmax=None, dh=None):
    if hmax is None:
        hmax = 10000
    if dh is None:
        dh = 200

    wrf_file = nc.Dataset(wrf_filename)
    cross_start = wrf.CoordPair(lat=lat_start, lon=lon_start)
    cross_end = wrf.CoordPair(lat=lat_end, lon=lon_end)

    ter = wrf.getvar(wrf_file, "ter");
    ter_line = wrf.interpline(ter, wrfin=wrf_file, start_point=cross_start, end_point=cross_end, meta=False)
    ter_line = np.rint(ter_line).astype(int)

    h = wrf.getvar(wrf_file, "height")
    levels = np.rint(np.arange(0, hmax, dh)).astype(int)

    w = wrf.getvar(wrf_file, "wa")
    w_cross = wrf.vertcross(w, h, levels=levels, missing=0, wrfin=wrf_file, start_point=cross_start, end_point=cross_end, meta=False)
    w_cross *= 100
    w_cross = np.rint(w_cross).astype(int)
    return [levels, ter_line, w_cross]


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
    valid_date, time = q["datetimeUTC"].split("T")
    hour = time[:2]
    minute = time[3:5]
    lat_start = float(q["lat_start"])
    lon_start = float(q["lon_start"])
    lat_end = float(q["lat_end"])
    lon_end = float(q["lon_end"])
    hmax = float(q["hmax"]) if "hmax" in q and q["hmax"] else None
    dh = float(q["dh"]) if "dh" in q and q["dh"] else None
    wrf_filename = environ["DOCUMENT_ROOT"] + f"/results/OUT/{model}/{run_date}/{day}/wrfout_d02_{valid_date}_{hour}:{minute}:00"

    try:
        levels, terrain, cross = crosssection(wrf_filename, lat_start, lon_start, lat_end, lon_end, hmax, dh)
    except ValueError:
        status = "400 Bad Request"
        response_headers = [("Content-type", "text/plain")]
        start_response(status, response_headers)
        return [b"Could not create cross section."]

    result = np.concatenate((np.array(cross.shape), levels, terrain, cross.flatten()), dtype=np.int32)

    status = "200 OK"
    response_headers = [("Content-type", "application/octet-stream")]
    start_response(status, response_headers)
    return [result.tobytes()]


# For testing
if __name__ == "__main__":
    import matplotlib.pyplot as plt
    levels, terrain, cross = crosssection("../../results/OUT/TIR/2022-03-27/0/wrfout_d02_2022-03-27_13:00:00", 49, 11, 51, 13)
    fig, ax = plt.subplots()
    ax.plot(terrain)
    ax.pcolormesh(np.arange(0, cross.shape[1]), levels, cross)
    plt.show()
