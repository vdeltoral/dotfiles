#!/usr/bin/env bash

speedfile=""
if [[ -f "/home/pi/gdrive/api/speed.csv" ]] ; then
    speedfile="/home/pi/gdrive/api/speed.csv"
elif [[ -f "/home/vincent/vincent/Google Drive/api/speed.csv" ]] ; then
    speedfile="/home/vincent/vincent/Google Drive/api/speed.csv"
elif [[ -f "/Users/vincent.deltoral/TODO" ]] ; then
    speedfile=""
fi

if [[ ! -z "${speedfile}" ]] ; then
    speed=$(tail -n 1 "${speedfile}" | cut -d',' -f 3)
    [ ! -z "$speed" ] && echo "${speed}Mb/s"
fi
