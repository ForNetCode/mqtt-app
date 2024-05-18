#!/usr/bin/env bash
docker run -d --name rmqtt  -p 1883:1883 -p 8080:8080 \
-v ./rmqtt/rmqtt.toml:/app/rmqtt/rmqtt.toml \
-v ./rmqtt/plugin:/app/rmqtt/plugin  \
rmqtt/rmqtt:latest



