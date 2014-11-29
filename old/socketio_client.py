# Relay socket.io messages to the Arduinp controller

import serial, time
from socketIO_client import SocketIO

server = 'http://192.168.1.145/'
port = 8080

ser = serial.Serial('/dev/ttyAMA0', 9600)
# can only send 1 byte at a time

ser.write( chr(255) )
time.sleep(0.5)
print 'result: ', ser.readline()
print



#
lenr = 10;
lenc = 15;
colorArr = ['000000'] * (lenr*lenc)
socketIO = SocketIO(server, port)


def send_data(data):
    # send data over serial in 4 bytes
    # max number of LEDs - 255
    index = int(data[0:3])
    #ser.write( chr(index) )

    # convert color bytes from hex to int
    cbyte1 = int('0x' + data[5:7], 16)
    #ser.write( chr(cbyte1) )
    cbyte2 = int('0x' + data[7:9], 16)
    #ser.write( chr(cbyte2) )
    cbyte3 = int('0x' + data[9:11], 16)
    #ser.write( chr(cbyte3) )

    # update array
    colorArr[index] = data[5:11]
    print 'Data: ', index, cbyte1, cbyte2, cbyte3

def on_remote_update(*args):
    # '012:#AAFF22'
    send_data( str(args) )
    print 'remote_update', str(args)

def on_remote_updates(*args):
    # '012:#AAFF22,....'
    elems = str(args).split(',')
    for elem in elems:
        send_data( elem )
    print 'remote_updates', str(args)

def on_disconnect(*args):
    print 'disconnected:', str(args)

def on_error(*args):
    print 'error:', str(args)

if socketIO.connected:
    socketIO.on('remote_update', on_remote_update)
    socketIO.on('remote_updates', on_remote_updates)
    socketIO.on('disconnect', on_disconnect)
    socketIO.on('error', on_error)
    socketIO.emit('initial_state', None)
    socketIO.wait(seconds=1)

