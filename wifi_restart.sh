#!/bin/bash
# nohup /home/pi/socket_controller/wifi_restart.sh > /dev/null 2>&1 &

while true ; do
   if ifconfig wlan0 | grep -q "inet addr:" ; then
      sleep 5
   else
      echo "Network connection down! Attempting reconnection."
      ifdown --force wlan0
      sleep 10
      ifup --force wlan0
      sleep 10
    fi
done