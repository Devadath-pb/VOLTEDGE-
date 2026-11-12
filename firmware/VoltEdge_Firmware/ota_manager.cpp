#include <Arduino.h>
#include <ArduinoOTA.h>
#include <WiFi.h>

#include "config.h"
#include "ota_manager.h"
#include "secrets.h"

#ifndef VOLTEDGE_OTA_PASSWORD
#define VOLTEDGE_OTA_PASSWORD DEVICE_KEY
#endif

namespace
{
bool otaStarted = false;
}

void otaInit()
{
    if (otaStarted || WiFi.status() != WL_CONNECTED)
        return;

    String mac = WiFi.macAddress();
    mac.replace(":", "");
    String hostname = "voltedge-" + mac.substring(mac.length() > 6 ? mac.length() - 6 : 0);

    ArduinoOTA.setHostname(hostname.c_str());
    ArduinoOTA.setPassword(VOLTEDGE_OTA_PASSWORD);

    ArduinoOTA.onStart([]() {
        Serial.println("OTA update started");
    });

    ArduinoOTA.onEnd([]() {
        Serial.println("OTA update complete");
    });

    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        Serial.printf("OTA progress: %u%%\r", (progress * 100U) / total);
    });

    ArduinoOTA.onError([](ota_error_t error) {
        Serial.printf("OTA error [%u]\n", error);
    });

    ArduinoOTA.begin();
    otaStarted = true;

    Serial.print("OTA ready: ");
    Serial.println(hostname);
}

void otaLoop()
{
    if (!otaStarted)
        otaInit();

    if (otaStarted && WiFi.status() == WL_CONNECTED)
        ArduinoOTA.handle();
}
