#!/bin/bash
set -a  # Automatically export all variables
source .env
set +a  # Stop automatic export

yarn cap build android
