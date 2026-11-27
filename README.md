# User Guide
## You will need to upgrade your Petoi robot (with BiBoard) to use this WiFi interface:
https://guide.petoi.com/petoi-web-coding-blocks/get-started-create-your-first-block-program

## For NyBoard, you will need an extra step to configure its WiFi module:
https://docs.petoi.com/web-block-base-programming/petoi-web-coding-blocks/setup-on-nyboard

## Web editor release level

Set `APP_RELEASE_LEVEL` in [main.html](main.html) and reload the editor.

- `release` shows the version date by itself. Quick Connect → Bluetooth opens Chrome's BLE device picker directly.
- `internal` adds the Internal Debug label. Quick Connect → Bluetooth offers Bluetooth BLE and Bluetooth Serial.

The Debug button is available in both versions. Detailed debug output starts off and can be turned on with the button.
