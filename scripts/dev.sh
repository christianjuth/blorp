#!/bin/bash

echo "Starting one"

while true; do
  yarn one dev
  echo "Script crashed. Restarting..."
  sleep 1 # Optional: Prevents overwhelming restarts
done
