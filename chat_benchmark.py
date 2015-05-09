import threading
from socketIO_client import SocketIO, LoggingNamespace

def worker():
    with SocketIO('http://104.154.57.24', 8080, LoggingNamespace) as socketIO:
        socketIO.emit('add user', {'username': "python", 'room': "/thasphon"})
        for i in range(500):
            socketIO.emit('new message', 'hello world')
            socketIO.wait(seconds=0.1)
    return


threads = []
for i in range(100):
    t = threading.Thread(target=worker)
    threads.append(t)
    t.start()

