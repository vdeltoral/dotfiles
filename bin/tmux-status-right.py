import sys
import os

sys.path.append(os.path.abspath("/Users/vincent/bin"))


from publicip import get_public_ip
from localip import get_local_ip


public_ip = get_public_ip()
local_ip = get_local_ip()

result = f"{public_ip}:{local_ip}"

print(result)
