# -*- mode: dockerfile -*-

# Dockerfile for spa-server

# You can override this `--build-arg BASE_IMAGE=...` to use different
# version of Rust
ARG BASE_IMAGE=rust:1.77

ARG RUNTIME_IMAGE=debian:buster-slim

ARG APP_NAME=mqtt-auth-server

# Our first FROM statement declares the build environment.
FROM ${BASE_IMAGE} AS builder

# Add our source code.
ADD . .

# Build our application.
RUN --mount=type=cache,target=/usr/local/cargo/registry \
     cargo build --release

FROM ${RUNTIME_IMAGE}

COPY  ./target/release/${APP_NAME} /usr/bin/

EXPOSE 5800

CMD ["./${APP_NAME}"]