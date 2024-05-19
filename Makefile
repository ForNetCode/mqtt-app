.PHONY: release-mac-x86_64, release-mac-aarch64, release-linux, release-linux-aarch64

name = mproxy
rust_path = agent
release-mac-x86_64:
	mkdir -p release
	cd $(rust_path) && cargo build --release  --target=x86_64-apple-darwin
	strip $(rust_path)/target/x86_64-apple-darwin/release/$(name)
	otool -L $(rust_path)/target/x86_64-apple-darwin/release/$(name)
	cp $(rust_path)/target/x86_64-apple-darwin/release/mproxy ./release/

# brew install wget
release-mac-aarch64:
	mkdir -p release
	cd $(rust_path) && cargo build --release --target=aarch64-apple-darwin
	strip $(rust_path)/target/aarch64-apple-darwin/release/$(name)
	otool -L $(rust_path)/target/aarch64-apple-darwin/release/$(name)
	cp $(rust_path)/target/aarch64-apple-darwin/release/$(name) ./release/

release-linux-aarch64:
	sudo apt-get install -y build-essential
	mkdir release
	cd $(rust_path) && cargo build --release --target=aarch64-unknown-linux-gnu
	strip $(rust_path)/target/aarch64-unknown-linux-gnu/release/$(name)
	cp $(rust_path)/target/aarch64-unknown-linux-gnu/release/$(name) ./release/


release-linux:
	sudo apt-get install -y build-essential
	mkdir release
	cd $(rust_path) && cargo build --release --target=x86_64-unknown-linux-gnu
	strip $(rust_path)/target/x86_64-unknown-linux-gnu/release/$(name)
	cp $(rust_path)/target/x86_64-unknown-linux-gnu/release/$(name) ./release