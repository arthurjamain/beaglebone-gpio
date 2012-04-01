#!/usr/bin/env python

import select
import sys
import httplib
from time import sleep

if (len(sys.argv) < 2):
    print "missing filename"
elif (len(sys.argv) < 3):
    print "missing method"
elif (len(sys.argv) < 4):
    print "missing port"
else:

    gpio = open(sys.argv[1], 'rb')
    print gpio.read()

    poll = select.poll()
    poll.register(gpio, select.POLLPRI)
    
    conn = httplib.HTTPConnection("localhost:"+sys.argv[3])
    
while True:
    poll.poll()
    sleep(0.05);
    gpio.seek(0);
    conn.request("GET", "/"+sys.argv[2]+"?val="+gpio.read())
    conn.close()

