#!/bin/bash
set -a  # Automatically export all variables
source .env
set +a  # Stop automatic export

tauri build --bundles app --target universal-apple-darwin
xcrun productbuild --sign "$PRODUCTBUILD_SIGNING_IDENTITY" \
    --component "./src-tauri/target/universal-apple-darwin/release/bundle/macos/Blorp.app" /Applications \
    Blorp.pkg
xcrun notarytool submit Blorp.pkg --key $APPLE_API_KEY_PATH --issuer $APPLE_API_ISSUER --key-id $APPLE_API_KEY --wait
xcrun stapler staple Blorp.pkg
