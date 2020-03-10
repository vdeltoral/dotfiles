#!/usr/bin/env python3

import subprocess
import os
import sys
import re

git_ssh_url = subprocess.run("git config --get remote.origin.url", shell=True, capture_output=True).stdout.decode("utf-8")
url_repo = re.match(r"git@.+:(?P<repo>.+).git$", git_ssh_url).group("repo")

git_root_dir = subprocess.run("git rev-parse --show-toplevel", shell=True, capture_output=True).stdout.decode("utf-8")

url_path = os.getcwd()[len(git_root_dir):]
if len(sys.argv) > 1:
	url_path = os.path.join(url_path, sys.argv[1])

print(f"https://github.com/{url_repo}/blob/master/{url_path}")
