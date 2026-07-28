#include "config.h"

#include "led_manager.h"
#include "relay_manager.h"
#include "sensor_manager.h"
#include "wifi_manager.h"
#include "api_manager.h"

// ===========================
// Configuration
// ===========================

const unsigned long TELEMETRY_INTERVAL = 3000;
unsigned long lastTelemetryTime = 0;

// ===========================
// Setup
// ===========================

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("===========================");
    Serial.println("VoltEdge Starting...");
    Serial.println("===========================");

    ledInit();

    relayInit();

    if (!sensorInit())
    {
        Serial.println("INA219 NOT FOUND");

        ledFatalError();

        while (true)
        {
            delay(1000);
        }
    }

    if (!wifiConnect())
    {
        Serial.println("WiFi Connection Failed");
    }
    else
    {
        Serial.println("WiFi Connected");
        Serial.print("IP Address: ");
        Serial.println(getIPAddress());
    }

    apiInit();

    Serial.println("System Ready");
}

// ===========================
// Main Loop
// ===========================

void loop()
{
    // Keep WiFi alive
    wifiLoop();

    // Handle relay/button
    relayUpdate();

    // Send telemetry every TELEMETRY_INTERVAL milliseconds
    if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL)
    {
        lastTelemetryTime = millis();

        BatteryData battery = readBattery();

        Serial.println("-----------------------------------");

        Serial.print("Voltage     : ");
        Serial.println(battery.voltage);

        Serial.print("Current     : ");
        Serial.println(battery.current);

        Serial.print("Power       : ");
        Serial.println(battery.power);

        Serial.print("Temperature : ");

        if (isnan(battery.temperature))
            Serial.println("N/A");
        else
            Serial.println(battery.temperature);

        Serial.print("Mode        : ");
        Serial.println(battery.mode);

        Serial.print("Relay       : ");
        Serial.println(battery.relay ? "ON" : "OFF");

        Serial.print("Timestamp   : ");
        Serial.println(battery.timestamp);

        Serial.print("WiFi        : ");

        if (wifiConnected())
        {
            Serial.println("Connected");

            if (sendBatteryData(battery))
            {
                Serial.println("Telemetry uploaded successfully.");
            }
            else
            {
                Serial.println("Failed to upload telemetry.");
            }
        }
        else
        {
            Serial.println("Disconnected");
        }

        Serial.println("-----------------------------------");
        Serial.println();
    }
}