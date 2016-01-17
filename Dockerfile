FROM node:5
MAINTAINER Mikael Brockman <mikael@brockman.se>
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
ENV NODE_PATH /tmp/node_modules
WORKDIR /app
ADD . /app

