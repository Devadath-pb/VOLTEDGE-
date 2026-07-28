#include <Arduino.h>
#include "config.h"
#include "relay_manager.h"

bool dischargeMode = false;

bool lastButtonState = HIGH;

unsigned long lastDebounce = 0;

const unsigned long debounceDelay = 50;

void relayInit()
{
    pinMode(RELAY_PIN, OUTPUT);
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    digitalWrite(RELAY_PIN, RELAY_OFF);
}

void relayUpdate()
{
    bool reading = digitalRead(BUTTON_PIN);

    if (reading != lastButtonState)
    {
        lastDebounce = millis();
    }

    if ((millis() - lastDebounce) > debounceDelay)
    {
        static bool buttonState = HIGH;

        if (reading != buttonState)
        {
            buttonState = reading;

            if (buttonState == LOW)
            {
                dischargeMode = !dischargeMode;

                digitalWrite(RELAY_PIN,
                             dischargeMode ? RELAY_ON : RELAY_OFF);

                Serial.println("--------------------------------");

                Serial.print("Mode Changed -> ");

                Serial.println(dischargeMode ?
                               "DISCHARGING" :
                               "CHARGING");
            }
        }
    }

    lastButtonState = reading;
}

bool isDischarging()
{
    return dischargeMode;
}

String getMode()
{
    if(dischargeMode)
        return "DISCHARGING";

    return "CHARGING";
}