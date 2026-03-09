from math import fabs, log, tan, sin, cos
import netCDF4 as nc
import xarray as xr
import numpy as np
import wrf

def get_cone(true_lat1, true_lat2):
    # Taken from https://github.com/NCAR/wrf-python/blob/develop/src/wrf/g_uvmet.py
    radians_per_degree = wrf.Constants.PI/180.0
    if (fabs(true_lat1 - true_lat2) > 0.1) and (fabs(true_lat2 - 90.) > 0.1):
        cone = log(cos(true_lat1*radians_per_degree)) - log(cos(true_lat2*radians_per_degree))
        cone = cone / (log(tan((45.-fabs(true_lat1/2.))*radians_per_degree)) - log(tan((45.-fabs(true_lat2/2.)) * radians_per_degree)))
    else:
        cone = sin(fabs(true_lat1)*radians_per_degree)
    return cone

def sounding(q, wrf_filename):
    lat = float(q["lat"])
    lon = float(q["lon"])
    hmax = float(q["hmax"]) if "hmax" in q and q["hmax"] else 12000
    with nc.Dataset(wrf_filename) as wrf_file_nc:
        y, x = wrf.ll_to_xy(wrf_file_nc, lat, lon, meta=False)
        if x < 0 or y < 0:
            raise IndexError("x or y out of boundary")

        lat_attrs = wrf.extract_global_attrs(wrf_file_nc, attrs=("TRUELAT1", "TRUELAT2"))
        true_lat1 = lat_attrs["TRUELAT1"]
        true_lat2 = lat_attrs["TRUELAT2"]
        lon_attrs = wrf.extract_global_attrs(wrf_file_nc, attrs="STAND_LON")
        cen_lon = lon_attrs["STAND_LON"]
        cone = get_cone(true_lat1, true_lat2)

    with xr.open_dataset(wrf_filename) as wrf_file:
        p = wrf_file["P"][0, :, x, y].values
        pb = wrf_file["PB"][0, :, x, y].values
        ph = wrf_file["PH"][0, :, x, y].values
        phb = wrf_file["PHB"][0, :, x, y].values
        t = wrf_file["T"][0, :, x, y].values
        qvapor = wrf_file["QVAPOR"][0, :, x, y].values
        qvapor[qvapor < 0] = 0
        cldfra = wrf_file["CLDFRA"][0, :, x, y].values
        qcloud = wrf_file["QCLOUD"][0, :, x, y].values
        u = np.reshape(wrf.destagger(wrf_file["U"][0, :, x:x+1, y:y+2].values, -1), (-1, 1, 1))
        v = np.reshape(wrf.destagger(wrf_file["V"][0, :, x:x+2, y:y+1].values, -2), (-1, 1, 1))

    full_t = t + wrf.Constants.T_BASE
    press_Pa = p + pb
    press_hPa = 0.01 * press_Pa
    temp = wrf.tk(press_Pa, full_t, meta=False, units="degC")
    dwpt = wrf.td(press_hPa, qvapor, meta=False, units="degC")
    geopt = ph + phb
    hght = geopt / wrf.Constants.G

    # _uvmet does not work if some dimension has shape == 1. Workaround: pad with identical copies
    u = np.concatenate((u, u), -1)
    u = np.concatenate((u, u), -2)
    v = np.concatenate((v, v), -1)
    v = np.concatenate((v, v), -2)
    umet, vmet = wrf.extension._uvmet(u, v, np.full_like(u, lat), np.full_like(u, lon), cen_lon, cone)
    wspd = wrf.extension._wspd(umet[:, 0, 0], vmet[:, 0, 0])
    wdir = wrf.extension._wdir(umet[:, 0, 0], vmet[:, 0, 0])

    data = {
        "press": press_hPa,
        "hght": hght,
        "temp": temp,
        "dwpt": dwpt,
        "wspd": wspd,
        "wdir": wdir,
        "cldfra": cldfra,
        "qcloud": qcloud,
    }

    # The following should be equivalent but way slower, as getvar performs calculations on the entire volumetric data:

    # data = {}
    # data["press"] = wrf.getvar(wrf_file_nc, "pressure", meta=False)[:, x, y]
    # data["hght"] = wrf.getvar(wrf_file_nc, "height", meta=False)[:, x, y]
    # data["temp"] = wrf.getvar(wrf_file_nc, "tc", meta=False)[:, x, y]
    # data["dwpt"] = wrf.getvar(wrf_file_nc, "td", meta=False)[:, x, y]
    # data["wspd"], data["wdir"] = wrf.getvar(wrf_file_nc, "uvmet_wspd_wdir", meta=False)[:, :, x, y]
    # data["cldfra"] = list(wrf.extract_vars(wrf_file_nc, 0, "CLDFRA", meta=False).values())[0][:, x, y]
    # data["qcloud"] = list(wrf.extract_vars(wrf_file_nc, 0, "QCLOUD", meta=False).values())[0][:, x, y]
    # print(data)

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
    levels = np.rint(np.arange(0, hmax, dh)).astype(int)
    with nc.Dataset(wrf_filename) as wrf_file_nc:
        y_start, x_start = wrf.ll_to_xy(wrf_file_nc, lat_start, lon_start, meta=False)
        y_end, x_end = wrf.ll_to_xy(wrf_file_nc, lat_end, lon_end, meta=False)
        if x_start < 0 or y_start < 0 or x_end < 0 or y_end < 0:
            raise IndexError("x or y of start or end point out of boundary")

        cross_start = wrf.CoordPair(lat=lat_start, lon=lon_start)
        cross_end = wrf.CoordPair(lat=lat_end, lon=lon_end)
        ter = wrf.getvar(wrf_file_nc, "ter")
        ter_line = wrf.interpline(ter, wrfin=wrf_file_nc, start_point=cross_start, end_point=cross_end, meta=False)
        h = wrf.getvar(wrf_file_nc, "height")
        w = wrf.getvar(wrf_file_nc, "wa")
        w_cross = wrf.vertcross(w, h, levels=levels, missing=0, wrfin=wrf_file_nc, start_point=cross_start, end_point=cross_end, meta=False)
        cldfra = list(wrf.extract_vars(wrf_file_nc, 0, "CLDFRA", meta=False).values())[0]
        cldfra_cross = wrf.vertcross(cldfra, h, levels=levels, missing=0, wrfin=wrf_file_nc, start_point=cross_start, end_point=cross_end, meta=False)

    ter_line = np.rint(ter_line).astype(int)
    w_cross *= 100
    w_cross = np.rint(w_cross).astype(int)
    cldfra_cross *= 100
    cldfra_cross = np.rint(cldfra_cross).astype(int)
    return [levels, ter_line, w_cross, cldfra_cross]


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
        document_root = environ.get("DOCUMENT_ROOT", ".")
        wrf_filename = document_root + f"/results/OUT/{model}/{run_date}/{day}/wrfout_d02_{valid_date}_{hour}:{minute}:00"
        if kind == "sounding":
            sounding_data = sounding(q, wrf_filename)
            status = "200 OK"
            response_headers = [("Content-type", "application/json")]
            start_response(status, response_headers)
            return [bytes(str(sounding_data).replace("'", "\""), encoding="utf-8")]
        elif kind == "crosssection":
            levels, terrain, w_cross, cldfra_cross = crosssection(q, wrf_filename)
            result = np.concatenate((np.array(w_cross.shape), levels, terrain, w_cross.flatten(), cldfra_cross.flatten()), dtype=np.int32)
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


