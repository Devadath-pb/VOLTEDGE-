#include "config.h"

#include "led_manager.h"
#include "relay_manager.h"
#include "sensor_manager.h"
#include "wifi_manager.h"
#include "api_manager.h"
#include "models.h"

// ===========================
// Global Variables & State
// ===========================

SystemState currentState = STATE_BOOT;

String storedBatteryId = "";
float storedRatedCapacity = 0.0f;
float cutoffVoltage = DISCHARGE_CUTOFF_VOLTAGE;

String activeCycleId = "";

const unsigned long TELEMETRY_INTERVAL = 3000;
unsigned long lastTelemetryTime = 0;
int consecutiveCutoffReadings = 0;

// ===========================
// Setup
// ===========================

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("===========================");
    Serial.println("VoltEdge Firmware Starting...");
    Serial.println("===========================");
    Serial.println("Booting...");

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

    Serial.println("Connecting WiFi...");
    if (!wifiConnect())
    {
        Serial.println("WiFi Connection Failed");
    }
    else
    {
        Serial.println("WiFi Connected");
        Serial.print("IP Address: ");
        Serial.println(getIPAddress());

        Serial.println("Downloading Active Battery...");
        if (getActiveBattery(storedBatteryId, storedRatedCapacity, cutoffVoltage))
        {
            currentState = STATE_IDLE;
            Serial.println("Waiting...");
        }
        else
        {
            currentState = STATE_BOOT;
            Serial.println("No Active Battery");
            Serial.println("Testing Disabled. Please select an active battery in backend.");
        }
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

    // Check Button Inputs & Handle State Transitions
    if (checkButtonPressed())
    {
        if (currentState == STATE_BOOT)
        {
            Serial.println("Retrying Active Battery Download...");
            if (wifiConnected() && getActiveBattery(storedBatteryId, storedRatedCapacity, cutoffVoltage))
            {
                currentState = STATE_IDLE;
                Serial.println("Waiting...");
            }
            else
            {
                Serial.println("No Active Battery");
            }
        }
        else if (currentState == STATE_IDLE || currentState == STATE_WAITING)
        {
            Serial.println("--------------------------------");
            Serial.println("Button Pressed");

            if (storedBatteryId.length() == 0)
            {
                Serial.println("Cannot start cycle: No Active Battery selected.");
            }
            else
            {
                if (startCycle(storedBatteryId, activeCycleId))
                {
                    currentState = STATE_CHARGING;
                    setRelayState(false);
                    Serial.println("Waiting...");
                }
                else
                {
                    Serial.println("Failed to start cycle via API.");
                }
            }
        }
        else if (currentState == STATE_CHARGING)
        {
            Serial.println("--------------------------------");
            Serial.println("Button Pressed");
            Serial.println("Charge Completed");
            Serial.println("Starting Discharge...");

            if (toggleCyclePhase("DISCHARGING"))
            {
                currentState = STATE_DISCHARGING;
                setRelayState(true);
                Serial.println("Discharge Started");
            }
            else
            {
                // Fallback to local state transition if API delayed
                currentState = STATE_DISCHARGING;
                setRelayState(true);
                Serial.println("Discharge Started (Local Fallback)");
            }
        }
    }

    // Telemetry & Automatic Cutoff Loop
    if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL)
    {
        lastTelemetryTime = millis();

        BatteryData battery = readBattery();

        // Map SystemState to mode string & relay state
        switch (currentState)
        {
        case STATE_CHARGING:
            battery.mode = "CHARGING";
            battery.relay = false;
            break;

        case STATE_DISCHARGING:
            battery.mode = "DISCHARGING";
            battery.relay = true;
            break;

        case STATE_WAITING:
            battery.mode = "WAITING";
            battery.relay = false;
            break;

        case STATE_IDLE:
        case STATE_BOOT:
        default:
            battery.mode = "IDLE";
            battery.relay = false;
            break;
        }

        // Automatic Cutoff Logic during Discharge
        if (currentState == STATE_DISCHARGING)
        {
            Serial.print("Voltage ");
            Serial.print(battery.voltage, 2);
            Serial.println("V");

            if (battery.voltage <= cutoffVoltage)
            {
                consecutiveCutoffReadings++;
                if (consecutiveCutoffReadings >= 3)
                {
                    setRelayState(false);
                    battery.relay = false;

                    Serial.println();
                    Serial.println("Battery Cutoff Reached");
                    Serial.println("Stopping Cycle...");

                    stopCycle();

                    activeCycleId = "";
                    consecutiveCutoffReadings = 0;
                    currentState = STATE_WAITING;

                    Serial.println("Waiting For Next Cycle");
                    Serial.println();
                }
            }
            else
            {
                consecutiveCutoffReadings = 0;
            }
        }

        // Print Telemetry Block & Send to Backend
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
            Serial.println("Uploading Telemetry...");
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
