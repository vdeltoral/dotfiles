#!/usr/bin/env python3

import sys
from requests import get
from os import path


def get_public_ip():
    try:
        resp = get("https://ifconfig.me")
    except Exception:
        return

    if resp.status_code == 200:
        return resp.content.decode("utf-8").strip()
    return None


if __name__ == "__main__":
    ip = get_public_ip()
    if ip:
        if "-f" in sys.argv:
            filename = path.join(path.expanduser("~"), ".publicip")
            with open(filename, "w") as f:
                f.write(ip)
        else:
            print(ip)
