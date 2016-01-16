#!/bin/bash -ex
read port pid
trap "kill -HUP $pid" EXIT
echo Test server on port $port, pid $pid.

curl -s http://0:$port/
