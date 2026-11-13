#include <HTTPClient.h>
#include <WiFiClientSecure.h>
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

// HTTPS is required when the backend is deployed to the internet. For a
// production build, replace setInsecure() with the backend's root CA.
static WiFiClientSecure secureClient;

static void beginRequest(HTTPClient& http, const String& url)
{
    secureClient.setInsecure();
    http.begin(secureClient, url);
    http.setTimeout(5000);
}

static void addDeviceHeaders(HTTPClient& http)
{
    http.addHeader("X-Device-Key", DEVICE_KEY);
    http.addHeader("Content-Type", "application/json");
}

bool getActiveBattery(String& batteryIdOut, float& ratedCapacityOut, float& cutoffVoltageOut)
{
    if (!wifiConnected())
    {
        Serial.println("WiFi not connected. Cannot download active battery.");
        return false;
    }

    HTTPClient http;
    String url = String(API_URL) + "device/battery";
    beginRequest(http, url);
    http.addHeader("X-Device-Key", DEVICE_KEY);

    Serial.println("Downloading Active Battery...");
    int responseCode = http.GET();

    if (responseCode > 0)
    {
        if (responseCode == HTTP_CODE_OK)
        {
            String payload = http.getString();
            if (payload == "null" || payload.length() == 0)
            {
                Serial.println("No Active Battery");
                http.end();
                return false;
            }

            JsonDocument doc;
            DeserializationError err = deserializeJson(doc, payload);
            if (!err && doc["battery_id"].is<const char*>())
            {
                batteryIdOut = doc["battery_id"].as<String>();
                ratedCapacityOut = doc["rated_capacity_mah"].as<float>();
                cutoffVoltageOut = DISCHARGE_CUTOFF_VOLTAGE;
                bool isActive = doc["is_active"].as<bool>();

                if (isActive && batteryIdOut.length() > 0)
                {
                    Serial.println("Battery Selected");
                    Serial.print("Battery ID : ");
                    Serial.println(batteryIdOut);
                    Serial.print("Capacity   : ");
                    Serial.print(ratedCapacityOut);
                    Serial.println(" mAh");
                    ledFlash();
                    http.end();
                    return true;
                }
            }
        }
        else
        {
            Serial.print("HTTP Response Error: ");
            Serial.println(responseCode);
        }
    }
    else
    {
        Serial.print("HTTP Error: ");
        Serial.println(HTTPClient::errorToString(responseCode));
    }

    Serial.println("No Active Battery");
    ledDoubleFlash();
    http.end();
    return false;
}

bool startCycle(const String& batteryId, String& cycleIdOut)
{
    if (!wifiConnected())
    {
        Serial.println("WiFi not connected. Cannot start cycle.");
        return false;
    }

    HTTPClient http;
    String url = String(API_URL) + "device/cycle/start";
    beginRequest(http, url);
    addDeviceHeaders(http);

    JsonDocument doc;
    String json;
    json = "{}";

    Serial.println("Starting Charge Cycle...");
    int responseCode = http.POST(json);

    if (responseCode > 0)
    {
        if (responseCode == HTTP_CODE_OK || responseCode == HTTP_CODE_CREATED)
        {
            String payload = http.getString();
            JsonDocument resDoc;
            DeserializationError err = deserializeJson(resDoc, payload);
            if (!err && resDoc["id"].is<const char*>())
            {
                cycleIdOut = resDoc["id"].as<String>();
            }

            Serial.println("Cycle Started");
            Serial.print("Cycle ID: ");
            Serial.println(cycleIdOut);
            ledFlash();
            http.end();
            return true;
        }
        else
        {
            Serial.print("HTTP Response Error: ");
            Serial.println(responseCode);
        }
    }
    else
    {
        Serial.print("HTTP Error starting cycle: ");
        Serial.println(HTTPClient::errorToString(responseCode));
    }

    ledDoubleFlash();
    http.end();
    return false;
}

bool toggleCyclePhase(const String& phase)
{
    if (!wifiConnected())
    {
        Serial.println("WiFi not connected. Cannot toggle cycle phase.");
        return false;
    }

    HTTPClient http;
    String url = String(API_URL) + "device/cycle/phase";
    beginRequest(http, url);
    http.setTimeout(5000);
    addDeviceHeaders(http);

    JsonDocument doc;
    doc["phase"] = phase;

    String json;
    serializeJson(doc, json);

    Serial.println("Notifying backend: Transitioning Cycle Phase -> " + phase);
    int responseCode = http.POST(json);

    if (responseCode > 0)
    {
        if (responseCode == HTTP_CODE_OK || responseCode == HTTP_CODE_CREATED)
        {
            ledFlash();
            http.end();
            return true;
        }
        else
        {
            Serial.print("HTTP Response Error: ");
            Serial.println(responseCode);
        }
    }
    else
    {
        Serial.print("HTTP Error toggling phase: ");
        Serial.println(HTTPClient::errorToString(responseCode));
    }

    ledDoubleFlash();
    http.end();
    return false;
}

bool stopCycle()
{
    if (!wifiConnected())
    {
        Serial.println("WiFi not connected. Cannot stop cycle.");
        return false;
    }

    HTTPClient http;
    String url = String(API_URL) + "device/cycle/stop";
    beginRequest(http, url);
    http.setTimeout(5000);
    addDeviceHeaders(http);

    Serial.println("Stopping Cycle...");
    int responseCode = http.POST("{}");

    if (responseCode > 0)
    {
        if (responseCode == HTTP_CODE_OK || responseCode == HTTP_CODE_CREATED)
        {
            Serial.println("Cycle Completed");
            ledFlash();
            http.end();
            return true;
        }
        else
        {
            Serial.print("HTTP Response Error: ");
            Serial.println(responseCode);
        }
    }
    else
    {
        Serial.print("HTTP Error stopping cycle: ");
        Serial.println(HTTPClient::errorToString(responseCode));
    }

    ledDoubleFlash();
    http.end();
    return false;
}

bool sendBatteryData(const BatteryData& data)
{
    if (!wifiConnected())
        return false;

    HTTPClient http;

    beginRequest(http, String(API_URL) + TELEMETRY_ENDPOINT);
    addDeviceHeaders(http);

    JsonDocument doc;

    doc["voltage"] = data.voltage;
    doc["current"] = data.current;
    doc["power"] = data.power;
    if (isnan(data.soc))
        doc["soc"] = nullptr;
    else
        doc["soc"] = data.soc;

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

    Serial.println("Sending Telemetry JSON:");
    Serial.println(json);

    int responseCode = http.POST(json);

    if (responseCode > 0)
    {
        if (responseCode == HTTP_CODE_OK || responseCode == HTTP_CODE_CREATED)
        {
            ledFlash();
            http.end();
            return true;
        }
        else
        {
            Serial.print("HTTP Telemetry Response: ");
            Serial.println(responseCode);
        }
    }
    else
    {
        Serial.print("HTTP Telemetry Error: ");
        Serial.println(HTTPClient::errorToString(responseCode));
    }

    ledDoubleFlash();
    http.end();
    return false;
}

bool stopSession()
{
    return stopCycle();
}
