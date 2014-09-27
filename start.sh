
NAME=mysocketio
PORT=8002
USER=babraham
MAINFILE=socketio_server.js
LOGFILE=/var/log/forever/$NAME.log
OUTFILE=/var/log/forever/$NAME_stdout.log
ERRFILE=/var/log/forever/$NAME_stderr.log
LOGDIR=$(dirname $LOGFILE)
MIN_UPTIME=5000
SPIN_SLEEP_TIME=2000

test -d $LOGDIR || mkdir -p $LOGDIR
cd /home/$USER/$NAME

forever -a -l $LOGFILE -o $OUTFILE -e $ERRFILE \
      --minUptime $MIN_UPTIME --spinSleepTime $SPIN_SLEEP_TIME \
      start $MAINFILE --port $PORT

forever list

