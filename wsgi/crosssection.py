import numpy as np
import matplotlib.pyplot as plt
import netCDF4 as nc
import wrf


def crosssection(wrf_filename, lat_start, lon_start, lat_end, lon_end, hmax=None, dh=None):
    if hmax is None:
        hmax = 6000
    if dh is None:
        dh = 100

    wrf_file = nc.Dataset(wrf_filename)
    cross_start = wrf.CoordPair(lat=lat_start, lon=lon_start)
    cross_end = wrf.CoordPair(lat=lat_end, lon=lon_end)

    h = wrf.getvar(wrf_file, "height")
    levels = np.rint(np.arange(0, hmax, dh)).astype(int)

    w = wrf.getvar(wrf_file, "wa")
    w_cross = wrf.vertcross(w, h, levels=levels, wrfin=wrf_file, start_point=cross_start, end_point=cross_end, meta=False)
    w_cross *= 100
    w_cross = np.rint(w_cross).astype(int)
    return [levels, w_cross]


def application(environ, start_response):
    q = {}
    for item in environ["QUERY_STRING"].split("&"):
        try:
            key, value = item.split("=")
            q[key] = value
        except ValueError:
            q[item] = None
    if not ("lat_start" in q and "lon_start" in q and "lat_end" in q and "lon_end" in q and q["lat_start"] and q["lon_start"] and q["lat_end"] and q["lon_end"]):
        status = "400 Bad Request"
        response_headers = [("Content-type", "text/plain")]
        start_response(status, response_headers)
        return [b"At least one of lat_start, lon_start, lat_end or lon_end is invalid or missing. Cannot compute cross section."]

    lat_start = float(q["lat_start"])
    lon_start = float(q["lon_start"])
    lat_end = float(q["lat_end"])
    lon_end = float(q["lon_end"])
    hmax = float(q["hmax"]) if "hmax" in q and q["hmax"] else None
    dh = float(q["dh"]) if "dh" in q and q["dh"] else None
    wrf_filename = environ["DOCUMENT_ROOT"] + "/results/OUT/TIR/2022-03-15/0/wrfout_d02_2022-03-07_12:00:00"
    levels, cross = crosssection(wrf_filename, lat_start, lon_start, lat_end, lon_end, hmax, dh)
    result = np.concatenate((np.array(cross.shape), levels, np.flipud(cross).flatten()), dtype=np.int32)

    status = "200 OK"
    response_headers = [("Content-type", "application/octet-stream")]
    start_response(status, response_headers)
    return [result.tobytes()]


# For testing
if __name__ == "__main__":
    levels, cross = crosssection("../../results/OUT/TIR/2022-03-15/0/wrfout_d02_2022-03-07_12:00:00", 49, 11, 51, 13)
    fig, ax = plt.subplots()
    ax.pcolormesh(np.arange(0, cross.shape[1]), levels, cross)
    plt.show()
