#!/usr/bin/env bash

speedfile=""
if [[ -f "/home/pi/gdrive/api/speed.csv" ]] ; then
    speedfile="/home/pi/gdrive/api/speed.csv"
elif [[ -f "/home/vincent/vincent/Google Drive/api/speed.csv" ]] ; then
    speedfile="/home/vincent/vincent/Google Drive/api/speed.csv"
elif [[ -f "/Users/vincent.deltoral/TODO" ]] ; then
    speedfile=""
fi
[[ -z "${speedfile}" ]] && exit


speed=$(tail -n 1 "${speedfile}" | cut -d',' -f 3)
[[ -z "${speed}" ]] && exit

speed_int=$(echo "${speed}" | cut -d'.' -f 1)

if (( ( $(($speed_int)) < 40 ) )) ; then
    echo "#[fg=#ff0000] ${speed_int}Mb/s"
else
    echo "${speed_int}Mb/s"
fi
