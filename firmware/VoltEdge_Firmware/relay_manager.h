#ifndef RELAY_MANAGER_H
#define RELAY_MANAGER_H

#include <Arduino.h>

void relayInit();

bool checkButtonPressed();

void setRelayState(bool turnOn);

bool isRelayOn();

bool isDischarging();

String getMode();

void stopDischarge();

#endif