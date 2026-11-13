#ifndef MODELS_H
#define MODELS_H

#include <Arduino.h>

// Firmware State Machine States
enum SystemState
{
    STATE_BOOT,
    STATE_IDLE,
    STATE_CHARGING,
    STATE_DISCHARGING,
    STATE_WAITING
};

// Telemetry Data Structure
struct BatteryData
{
    float voltage;
    float current;
    float power;
    float temperature;
    float soc;

    bool relay;

    String mode;

    unsigned long timestamp;
};

#endif
