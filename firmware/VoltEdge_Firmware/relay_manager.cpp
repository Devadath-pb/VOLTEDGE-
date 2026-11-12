#include <Arduino.h>
#include "config.h"
#include "relay_manager.h"

static bool currentRelayStatus = false;

static bool lastButtonReading = HIGH;
static bool debouncedButtonState = HIGH;
static unsigned long lastDebounceTime = 0;
static const unsigned long DEBOUNCE_DELAY_MS = 50;

void relayInit()
{
    pinMode(RELAY_PIN, OUTPUT);
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    setRelayState(false);
}

void setRelayState(bool turnOn)
{
    currentRelayStatus = turnOn;
    digitalWrite(RELAY_PIN, turnOn ? RELAY_ON : RELAY_OFF);
}

bool isRelayOn()
{
    return currentRelayStatus;
}

bool checkButtonPressed()
{
    bool reading = digitalRead(BUTTON_PIN);
    bool pressed = false;

    if (reading != lastButtonReading)
    {
        lastDebounceTime = millis();
    }

    if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY_MS)
    {
        if (reading != debouncedButtonState)
        {
            debouncedButtonState = reading;
            if (debouncedButtonState == LOW)
            {
                pressed = true;
            }
        }
    }

    lastButtonReading = reading;
    return pressed;
}

bool isDischarging()
{
    return currentRelayStatus;
}

String getMode()
{
    if (currentRelayStatus)
        return "DISCHARGING";

    return "CHARGING";
}

void stopDischarge()
{
    setRelayState(false);
}