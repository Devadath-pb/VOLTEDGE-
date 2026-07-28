
#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// =====================
// Pin Definitions
// =====================

#define SDA_PIN       21
#define SCL_PIN       22

#define RELAY_PIN     25
#define BUTTON_PIN    27

#define STATUS_LED    2

#define THERMISTOR_PIN      34

// Relay Logic
#define RELAY_ON      LOW
#define RELAY_OFF     HIGH

// WiFi Credentials (defined in config.cpp)
extern const char* WIFI_SSID;
extern const char* WIFI_PASSWORD;

extern const char* API_URL;
extern const char* TELEMETRY_ENDPOINT;
#endif