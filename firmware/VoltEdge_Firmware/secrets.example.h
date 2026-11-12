#pragma once

// Copy this file to secrets.h and fill in local values.
#ifdef VOLTEDGE_SECRETS_IMPLEMENTATION
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* DEVICE_KEY = "YOUR_DEVICE_KEY";
#else
extern const char* WIFI_SSID;
extern const char* WIFI_PASSWORD;
extern const char* DEVICE_KEY;
#endif

// Optional: define a separate OTA password in secrets.h.
// If omitted, the per-device DEVICE_KEY is used for OTA authentication.
// #define VOLTEDGE_OTA_PASSWORD "replace-with-a-strong-local-password"
