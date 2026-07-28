#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

#include "models.h"

bool sensorInit();

BatteryData readBattery();

#endif