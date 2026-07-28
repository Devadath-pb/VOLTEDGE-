#include <Arduino.h>
#include "config.h"
#include "led_manager.h"

void ledInit()
{
    pinMode(STATUS_LED, OUTPUT);
    digitalWrite(STATUS_LED, LOW);
}

void ledOff()
{
    digitalWrite(STATUS_LED, LOW);
}

void ledOn()
{
    digitalWrite(STATUS_LED, HIGH);
}

void ledFlash()
{
    digitalWrite(STATUS_LED, HIGH);
    delay(100);
    digitalWrite(STATUS_LED, LOW);
}

void ledDoubleFlash()
{
    for(int i=0;i<2;i++)
    {
        digitalWrite(STATUS_LED, HIGH);
        delay(100);

        digitalWrite(STATUS_LED, LOW);
        delay(100);
    }
}

void ledWifiConnecting()
{
    digitalWrite(STATUS_LED,!digitalRead(STATUS_LED));
}

void ledFatalError()
{
    while(true)
    {
        digitalWrite(STATUS_LED,HIGH);
        delay(100);

        digitalWrite(STATUS_LED,LOW);
        delay(100);
    }
}