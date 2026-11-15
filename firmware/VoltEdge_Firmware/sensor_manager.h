#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

#include "models.h"

bool sensorInit();

BatteryData readBattery();

float estimateStateOfCharge(float voltage);

// Integrate the device current over time using the active charge/discharge mode.
// The web app receives the resulting SOC; it does not recalculate it.
void updateStateOfCharge(BatteryData& data, float ratedCapacityMah);

#endif
