#!/usr/bin/env python3


from platform import system
import subprocess


def get_local_ip():
    if system() == "Linux":
        command = ["hostname", "-I"]
    else:
        command = ["ipconfig", "getifaddr", "en0"]

    result = subprocess.run(command, stdout=subprocess.PIPE)
    return result.stdout.decode("utf-8").strip()


if __name__ == "__main__":
    print(get_local_ip())
