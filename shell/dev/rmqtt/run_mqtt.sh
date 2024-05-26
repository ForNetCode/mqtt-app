#!/usr/bin/env bash
docker run -d --name rmqtt -p 6060:6060 -p 1883:1883 -p 8080:8080 \
-v $(pwd)/rmqtt.toml:/app/rmqtt/rmqtt.toml \
-v $(pwd)/plugin:/app/rmqtt/plugin  \
rmqtt/rmqtt:latest



