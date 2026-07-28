#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <math.h>

#include "config.h"
#include "wifi_manager.h"
#include "led_manager.h"
#include "api_manager.h"

bool apiInit()
{
    return true;
}

bool sendBatteryData(const BatteryData& data)
{
    if (!wifiConnected())
        return false;

    HTTPClient http;

    http.begin(String(API_URL) + TELEMETRY_ENDPOINT);
    http.setTimeout(5000);
    http.addHeader("Content-Type", "application/json");

    JsonDocument doc;

    doc["voltage"] = data.voltage;
    doc["current"] = data.current;
    doc["power"] = data.power;

    if (isnan(data.temperature))
    {
        doc["temperature"] = nullptr;
    }
    else
    {
        doc["temperature"] = data.temperature;
    }

    doc["mode"] = data.mode;
    doc["relay"] = data.relay;
    doc["timestamp"] = data.timestamp;

    String json;

    serializeJson(doc, json);

    Serial.println("Sending JSON:");
    Serial.println(json);

    int responseCode = http.POST(json);

    if (responseCode > 0)
    {
        Serial.println("HTTP Response:");
        Serial.println(responseCode);
        Serial.println(http.getString());

        if (
            responseCode == HTTP_CODE_OK ||
            responseCode == HTTP_CODE_CREATED
        )
        {
            ledFlash();

            http.end();

            return true;
        }
    }
    else
    {
        Serial.println("HTTP Error:");
        Serial.println(responseCode);
        Serial.println(HTTPClient::errorToString(responseCode));
    }

    ledDoubleFlash();

    http.end();

    return false;
}
