import json
import time

import requests


def unduh(url, params=None, coba=3):
    for i in range(coba):
        try:
            r = requests.get(url, params=params, timeout=20,
                             headers={"User-Agent": "Mozilla/5.0 (bmkg-sync)"})
            r.raise_for_status()
            return r.content
        except Exception:
            if i == coba - 1:
                raise
            time.sleep(2 * (i + 1))


def unduh_json(url, params=None):
    return json.loads(unduh(url, params))