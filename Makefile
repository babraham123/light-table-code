BOARD_TAG     = uno
ARDUINO_PORT  = /dev/ttyACM0
ARDUINO_LIBS = FastSPI_LED2
# USER_LIB_PATH = ~/light-table-code/libraries
USER_LIB_PATH = /home/babraham/light-table-code/libraries

MONITOR_BAUDRATE = 9600
MONITOR_PORT  = /dev/ttyACM0

# ARCHITECTURE  = avr
# BOARD_SUB     = atmega328

include /usr/share/arduino/Arduino.mk

