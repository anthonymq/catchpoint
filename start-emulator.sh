#!/bin/bash
AVD_NAME="${1:-Medium_Phone_API_36.1}"
EMULATOR_PATH="/Users/antmarqu3/Library/Android/sdk/emulator/emulator"
echo "Starting Android emulator: $AVD_NAME"
$EMULATOR_PATH -avd "$AVD_NAME" &
# Wait for device to be ready
echo "Waiting for emulator to boot..."
adb wait-for-device
echo "Emulator is ready!"
