#!/usr/bin/env bash
#-p 6060:6060 -p 1883:1883
docker run -d --name rmqtt --network=host \
-v $(pwd)/rmqtt/rmqtt.toml:/app/rmqtt/rmqtt.toml \
-v $(pwd)/rmqtt/plugin:/app/rmqtt/plugin  \
-v $(pwd)/rmqtt/log:/var/log/rmqtt \
rmqtt/rmqtt:latest
