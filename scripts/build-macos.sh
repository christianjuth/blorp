#!/bin/bash
set -a  # Automatically export all variables
source .env
set +a  # Stop automatic export

tauri build --bundles app --target universal-apple-darwin
xcrun productbuild --sign "$PRODUCTBUILD_SIGNING_IDENTITY" --component "./src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Blorp.app" /Applications "Blorp.pkg"
