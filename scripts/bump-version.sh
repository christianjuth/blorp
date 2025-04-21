#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <old_version> <new_version> [<root_path>]"
  exit 1
fi

OLD_VER=$1
NEW_VER=$2
ROOT=${3:-.}

echo "Bumping version from $OLD_VER → $NEW_VER in $ROOT …"

# 1) JSON files (package.json, capacitor.config.json)
for f in package.json capacitor.config.json src-tauri/tauri.conf.json; do
  if [ -f "$ROOT/$f" ]; then
    sed -i.bak -E "s/\"version\": \"$OLD_VER\"/\"version\": \"$NEW_VER\"/g" "$ROOT/$f"
    echo "  ✔ $f"
  fi
done

# 3) Gradle files (any *.gradle under android/)
ANDROID_GRADLE="$ROOT/android/app/build.gradle"
if [ -f "$ANDROID_GRADLE" ]; then
  sed -i.bak -E "s/versionName \"$OLD_VER\"/versionName \"$NEW_VER\"/g" "$ANDROID_GRADLE"
  echo "  ✔ Gradle"
fi

# 4) Xcode project MARKETING_VERSION
PBXPROJ="$ROOT/ios/App/App.xcodeproj/project.pbxproj"
if [ -f "$PBXPROJ" ]; then
  sed -i.bak -E \
    "s/(MARKETING_VERSION = )$OLD_VER;/\1$NEW_VER;/g" \
    "$PBXPROJ"
  echo "  ✔ project.pbxproj (MARKETING_VERSION)"
fi

# 5) Tauri
TAURI="$ROOT/src-tauri/Cargo.toml"
if [ -f "$TAURI" ]; then
  sed -i.bak -E "s/version = \"$OLD_VER\"/version = \"$NEW_VER\"/g" "$TAURI"
  echo "  ✔ Tuari"
fi

# 5) Cleanup .bak files
find "$ROOT" -type f -name "*.bak" -delete

echo "✅ Done!"
