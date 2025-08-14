# Makefile to replace the bash build script
# Parallelizes platform builds after common steps (yarn install/build)
# Validation is implemented without shell ${...} variables (no $$ needed) using jq+awk.
# Environment inputs are read as Make variables: use $(VAR) form.
#
# Usage:
#   make                # build all (common -> tauri + android + ios in parallel)
#   make -j3 build      # run platform builds in parallel after common steps
#   make validate       # check @tauri-apps plugin versions vs Cargo.lock
#
# Requirements:
# - macOS host with bash, jq, yarn, tauri, xcrun
# - PRODUCTBUILD_SIGNING_IDENTITY, APPLE_API_KEY_PATH, APPLE_API_ISSUER, APPLE_API_KEY in env (Make imports them)

SHELL := /bin/bash
# .ONESHELL:  # not required

# -------- Load .env and export for all recipes --------
ifneq (,$(wildcard .env))
  include .env
  export
endif

# -------- React env --------
REACT_APP_DEFAULT_INSTANCE ?= https://lemmy.zip
REACT_APP_LOCK_TO_DEFAULT_INSTANCE ?= 0
export REACT_APP_DEFAULT_INSTANCE REACT_APP_LOCK_TO_DEFAULT_INSTANCE

# -------- Paths / constants --------
APP_NAME           := Blorp
UNIVERSAL_TARGET   := universal-apple-darwin
BUNDLE_DIR         := src-tauri/target/$(UNIVERSAL_TARGET)/release/bundle/macos
APP_BUNDLE         := $(BUNDLE_DIR)/$(APP_NAME).app
APP_TAR            := $(BUNDLE_DIR)/$(APP_NAME).app.tar.gz
APP_SIG            := $(APP_TAR).sig
RELEASE_DIR        := release
PKG_PATH           := $(RELEASE_DIR)/Mac-Installer.pkg
RELEASE_TAR_OUT    := $(RELEASE_DIR)/Mac-$(APP_NAME).app.tar.gz
ANDROID_AAB_SRC    := android/app/build/outputs/bundle/release/app-release.aab
ANDROID_AAB_OUT    := $(RELEASE_DIR)/android-release.aab
LOCKFILE           := src-tauri/Cargo.lock
PKGJSON            := ./package.json

# Default target
.PHONY: all build
all: build
build: preflight common tauri android ios
	printf "\n✅ Build complete. Artifacts in '%s'\n" "$(RELEASE_DIR)"

# -------- Common steps (run once) --------
.PHONY: preflight common yarn_install yarn_build validate dirs
preflight:
	command -v jq    >/dev/null || { echo "jq not found" >&2; exit 1; }
	command -v yarn  >/dev/null || { echo "yarn not found" >&2; exit 1; }
	command -v tauri >/dev/null || { echo "tauri not found" >&2; exit 1; }
	command -v xcrun >/dev/null || { echo "xcrun not found (macOS only)" >&2; exit 1; }

common: dirs yarn_install yarn_build

dirs:
	rm -rf $(RELEASE_DIR)
	mkdir -p $(RELEASE_DIR)

yarn_install: $(PKGJSON) yarn.lock
	yarn install

yarn_build: validate
	yarn build

# -------- Inline validation (no shell variables) --------
# Compares @tauri-apps/* versions in package.json with tauri-<plugin> versions in Cargo.lock
validate:
	command -v jq >/dev/null || { echo "error: jq is required" >&2; exit 1; }
	[ -f "${LOCKFILE}" ]   || { echo "error: ${LOCKFILE} not found" >&2; exit 1; }
	[ -f "${PKGJSON}" ]    || { echo "error: ${PKGJSON} not found" >&2; exit 1; }
	@while read -r plugin_name pkg_ver_raw; do \
		pkg_ver="$${pkg_ver_raw#[\^~]}"; \
		crate="tauri-$$plugin_name"; \
		lock_ver=$$( \
			awk -v crate="$$crate" ' \
				$$1=="name" { \
					n=$$3; gsub(/"/,"",n); \
					if(n==crate) { \
						if(getline && $$1=="version") { \
							v=$$3; gsub(/"/,"",v); \
							print v; \
							exit; \
						} \
					} \
				} \
			' ${LOCKFILE} \
		); \
		if [[ -z "$$lock_ver" ]]; then \
			echo "❌ $$crate@$$pkg_ver is in package.json but not found in Cargo.lock"; \
			exit 1; \
		elif [[ "$$pkg_ver" != "$$lock_ver" ]]; then \
			echo "❌ version mismatch for $$crate: package.json has $$pkg_ver, Cargo.lock has $$lock_ver"; \
			exit 1; \
		else \
			echo "✅ $$crate @ $$pkg_ver"; \
		fi \
	done < <(jq -r '[(.dependencies // {}), (.devDependencies // {})] | map(select(type=="object")) | add | to_entries[] | select(.key | startswith("@tauri-apps/")) | "\(.key | split("/") | .[1]) \(.value)"' ./package.json)

# -------- Tauri (macOS) pipeline --------
.PHONY: tauri tauri_build tauri_pkg tauri_notarize tauri_staple tauri_release_files

tauri: tauri_build tauri_pkg tauri_notarize tauri_staple tauri_release_files
	printf "\n✅ Tauri pipeline complete\n"

tauri_build: yarn_build | $(RELEASE_DIR)
	tauri build --bundles app --target $(UNIVERSAL_TARGET)

tauri_pkg: tauri_build | $(RELEASE_DIR)
	xcrun productbuild --sign "$(PRODUCTBUILD_SIGNING_IDENTITY)" \
	    --component "$(APP_BUNDLE)" /Applications \
	    "$(PKG_PATH)"

tauri_notarize: tauri_pkg
	xcrun notarytool submit "$(PKG_PATH)" \
	    --key "$(APPLE_API_KEY_PATH)" --issuer "$(APPLE_API_ISSUER)" --key-id "$(APPLE_API_KEY)" --wait

tauri_staple: tauri_notarize
	xcrun stapler staple "$(PKG_PATH)"

tauri_release_files: tauri_staple
	version=$$(jq -r .version $(PKGJSON))
	sig=$$(< "$(APP_SIG)")
	cat > "$(RELEASE_DIR)/latest.json" <<EOF
	{
	  "version": "$$version",
	  "platforms": {
	    "darwin-aarch64": {
	      "signature": "$$sig",
	      "url": "https://github.com/christianjuth/blorp/releases/download/v$$version/Mac-$(APP_NAME).app.tar.gz"
	    },
	    "darwin-x86_64": {
	      "signature": "$$sig",
	      "url": "https://github.com/christianjuth/blorp/releases/download/v$$version/Mac-$(APP_NAME).app.tar.gz"
	    }
	  }
	}
	EOF
	cp "$(APP_TAR)" "$(RELEASE_TAR_OUT)"

# -------- Android pipeline (placeholder) --------
.PHONY: android
android: yarn_build | $(RELEASE_DIR)
	pushd android >/dev/null
	./gradlew bundleRelease
	popd >/dev/null
	cp "$(ANDROID_AAB_SRC)" "$(ANDROID_AAB_OUT)"
	printf "\n✅ Android AAB copied to %s\n" "$(ANDROID_AAB_OUT)"

# -------- iOS pipeline (placeholder) --------
.PHONY: ios
ios: yarn_build | $(RELEASE_DIR)
	# TODO: replace with your real iOS build steps (fastlane/xcodebuild/etc.)
	# Example: xcodebuild -workspace ios/App.xcworkspace -scheme App -configuration Release -archivePath build/App.xcarchive archive
	#          xcodebuild -exportArchive -archivePath build/App.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath $(RELEASE_DIR)
	echo "(iOS placeholder)" > $(RELEASE_DIR)/ios-build.txt
	printf "\nℹ️ iOS placeholder artifact at %s\n" "$(RELEASE_DIR)/ios-build.txt"

# -------- Maintenance --------
.PHONY: clean showenv help
clean:
	rm -rf $(RELEASE_DIR) src-tauri/target android/app/build
	printf "🧹 Cleaned build artifacts\n"

showenv:
	@echo "REACT_APP_DEFAULT_INSTANCE=$(REACT_APP_DEFAULT_INSTANCE)"
	@echo "REACT_APP_LOCK_TO_DEFAULT_INSTANCE=$(REACT_APP_LOCK_TO_DEFAULT_INSTANCE)"

help:
	@echo "Targets:" \
	&& echo "  build (default)  - common -> [tauri android ios] in parallel" \
	&& echo "  tauri            - macOS app: build, pkg, notarize, staple, release files" \
	&& echo "  android          - Android AAB bundle (placeholder copies to release)" \
	&& echo "  ios              - iOS placeholder" \
	&& echo "  validate         - check @tauri-apps plugin versions vs Cargo.lock" \
	&& echo "  clean            - remove artifacts" \
	&& echo "Variables imported from env:" \
	&& echo "  PRODUCTBUILD_SIGNING_IDENTITY, APPLE_API_KEY_PATH, APPLE_API_ISSUER, APPLE_API_KEY" \
	&& echo "Notes:" \
	&& echo "  Run with -j to parallelize independent platform targets after common steps." \
	&& echo "  Example: make -j3 build"
