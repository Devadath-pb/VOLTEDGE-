#include <Arduino.h>
#include <WiFi.h>

#include "config.h"
#include "wifi_manager.h"
#include "led_manager.h"

bool wifiConnect()
{
    Serial.println("Connecting to WiFi...");

    WiFi.disconnect(true, true);   // Clear previous connection
    delay(500);

    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true);
    WiFi.persistent(false);

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long start = millis();

    while (WiFi.status() != WL_CONNECTED)
    {
        ledWifiConnecting();

        delay(500);
        Serial.print(".");

        if (millis() - start > 15000)
        {
            Serial.println("\nWiFi Timeout");

            Serial.print("WiFi Status: ");
            Serial.println(WiFi.status());

            return false;
        }
    }

    Serial.println();
    Serial.println("WiFi Connected");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    Serial.print("RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");

    ledOff();

    return true;
}

void wifiLoop()
{
    static unsigned long lastAttempt = 0;

    if (WiFi.status() == WL_CONNECTED)
        return;

    if (millis() - lastAttempt < 10000)
        return;

    lastAttempt = millis();

    Serial.println("WiFi Lost... Reconnecting...");

    wifiConnect();
}

bool wifiConnected()
{
    return WiFi.status() == WL_CONNECTED;
}

String getIPAddress()
{
    if (!wifiConnected())
        return "";

    return WiFi.localIP().toString();
}