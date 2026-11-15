#include <Arduino.h>
#include "config.h"
#include "relay_manager.h"

static bool currentRelayStatus = false;

// The main loop performs network requests that can take several seconds.
// A polling-only button handler can miss a short press while that work is
// running, so latch the press in an interrupt and consume it from loop().
static volatile bool buttonEventPending = false;
static volatile unsigned long lastButtonInterruptMicros = 0;
static const unsigned long BUTTON_DEBOUNCE_US = 75000;

void IRAM_ATTR handleButtonInterrupt()
{
    const unsigned long now = micros();
    if ((unsigned long)(now - lastButtonInterruptMicros) >= BUTTON_DEBOUNCE_US)
    {
        buttonEventPending = true;
        lastButtonInterruptMicros = now;
    }
}

void relayInit()
{
    pinMode(RELAY_PIN, OUTPUT);
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    setRelayState(false);

    buttonEventPending = false;
    lastButtonInterruptMicros = micros();
    attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), handleButtonInterrupt, FALLING);
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
    noInterrupts();
    const bool pressed = buttonEventPending;
    buttonEventPending = false;
    interrupts();
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
