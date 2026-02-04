import netCDF4 as nc
import numpy as np
import wrf


def sounding(q, wrf_filename):
    lat = float(q["lat"])
    lon = float(q["lon"])
    hmax = float(q["hmax"]) if "hmax" in q and q["hmax"] else 12000
    wrf_file = nc.Dataset(wrf_filename)
    x, y = wrf.ll_to_xy(wrf_file, lat, lon, meta=False)
    if x < 0 or y < 0:
        raise IndexError("x or y out of boundary")

    data = {}
    # GSD Sounding
    data["press"] = np.copy(wrf.getvar(wrf_file, "pressure", meta=False)[:, x, y])
    data["hght"] = np.copy(wrf.getvar(wrf_file, "height", meta=False)[:, x, y])
    data["temp"] = np.copy(wrf.getvar(wrf_file, "tc", meta=False)[:, x, y])
    data["dwpt"] = np.copy(wrf.getvar(wrf_file, "td", meta=False)[:, x, y])
    data["wspd"], data["wdir"] = np.copy(wrf.getvar(wrf_file, "uvmet_wspd_wdir", meta=False)[:, :, x, y])
    # Additional stuff
    data["cldfra"] = np.copy(list(wrf.extract_vars(wrf_file, 0, "CLDFRA", meta=False).values())[0][:, x, y])
    data["qcloud"] = np.copy(list(wrf.extract_vars(wrf_file, 0, "QCLOUD", meta=False).values())[0][:, x, y])

    values_plain = [vals.tolist() for vals in data.values()]
    sounding = [dict(zip(data.keys(), vals)) for vals in zip(*values_plain)]
    sounding = [s for s in sounding if s["hght"] < hmax]
    return sounding


def crosssection(q, wrf_filename):
    lat_start = float(q["lat_start"])
    lon_start = float(q["lon_start"])
    lat_end = float(q["lat_end"])
    lon_end = float(q["lon_end"])
    hmax = float(q["hmax"]) if "hmax" in q and q["hmax"] else 10000
    dh = float(q["dh"]) if "dh" in q and q["dh"] else 200
    wrf_file = nc.Dataset(wrf_filename)
    x_start, y_start = wrf.ll_to_xy(wrf_file, lat_start, lon_start, meta=False)
    x_end, y_end = wrf.ll_to_xy(wrf_file, lat_end, lon_end, meta=False)
    if x_start < 0 or y_start < 0 or x_end < 0 or y_end < 0:
        raise IndexError("x or y of start or end point out of boundary")

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

    try:
        kind = q["kind"]
        model = q["model"]
        run_date = q["run_date"]
        day = int(q["day"])
        valid_date, time = q["datetimeUTC"].split("T")
        hour = time[:2]
        minute = time[3:5]
        wrf_filename = environ["DOCUMENT_ROOT"] + f"/results/OUT/{model}/{run_date}/{day}/wrfout_d02_{valid_date}_{hour}:{minute}:00"
        if kind == "sounding":
            sounding_data = sounding(q, wrf_filename)
            status = "200 OK"
            response_headers = [("Content-type", "application/json")]
            start_response(status, response_headers)
            return [bytes(str(sounding_data).replace("'", "\""), encoding="utf-8")]
        elif kind == "crosssection":
            levels, terrain, cross = crosssection(q, wrf_filename)
            result = np.concatenate((np.array(cross.shape), levels, terrain, cross.flatten()), dtype=np.int32)
            status = "200 OK"
            response_headers = [("Content-type", "application/octet-stream")]
            start_response(status, response_headers)
            return [result.tobytes()]
        else:
            raise ValueError(f"No such kind: {kind}")
    except Exception as e:
        status = "400 Bad Request"
        response_headers = [("Content-type", "text/plain")]
        start_response(status, response_headers)
        message = f"Could not handle request: {str(e)}"
        return [str.encode(message)]


