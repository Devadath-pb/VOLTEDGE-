#ifndef MODELS_H
#define MODELS_H

struct BatteryData
{
    float voltage;
    float current;
    float power;
    float temperature;

    bool relay;

    String mode;

    unsigned long timestamp;
};

#endif