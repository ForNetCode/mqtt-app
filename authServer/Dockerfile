# -*- mode: dockerfile -*-

# Dockerfile for spa-server

# You can override this `--build-arg BASE_IMAGE=...` to use different
# version of Rust
ARG BASE_IMAGE=rust:alpine

ARG RUNTIME_IMAGE=alpine

ARG APP_NAME=mqtt-auth-server

# Our first FROM statement declares the build environment.
FROM ${BASE_IMAGE} AS builder

# Add our source code.
ADD . .
RUN apk add --no-cache musl-dev

# Build our application.
RUN --mount=type=cache,target=/usr/local/cargo/registry \
     cargo build --release

FROM ${RUNTIME_IMAGE}
RUN apk add --no-cache tini
EXPOSE 5800
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["${APP_NAME}"]

COPY --from=builder ./target/release/${APP_NAME} /usr/bin/
