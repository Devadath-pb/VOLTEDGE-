#include <WiFi.h>

#include "config.h"
#include "wifi_manager.h"
#include "led_manager.h"

bool wifiConnect()
{
    Serial.println("Connecting to WiFi...");

    WiFi.mode(WIFI_STA);
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

            return false;
        }
    }

    Serial.println();
    Serial.println("WiFi Connected");

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

    Serial.println("WiFi Lost... Reconnecting");

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