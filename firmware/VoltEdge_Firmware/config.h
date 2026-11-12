#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// =====================
// Pin Definitions
// =====================

// ESP32-C3 SuperMini pin assignment.
// GPIO9 is reserved for BOOT; GPIO18/19 are reserved for native USB.
#define SDA_PIN       6
#define SCL_PIN       7

#define RELAY_PIN     10
#define BUTTON_PIN    3

// Common ESP32-C3 SuperMini onboard LED.
#define STATUS_LED    8

// ADC-capable input for the thermistor divider.
#define THERMISTOR_PIN      0

// Relay Logic
#define RELAY_ON      LOW
#define RELAY_OFF     HIGH

// Configurable Discharge Cutoff Voltage (Volts)
#define DISCHARGE_CUTOFF_VOLTAGE 3.0f

// WiFi Credentials (defined in config.cpp)
extern const char* WIFI_SSID;
extern const char* WIFI_PASSWORD;

// API Configuration (defined in config.cpp)
extern const char* API_URL;
extern const char* TELEMETRY_ENDPOINT;
extern const char* DEVICE_KEY;

#endif
