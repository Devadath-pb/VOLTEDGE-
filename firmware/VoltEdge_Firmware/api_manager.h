#ifndef API_MANAGER_H
#define API_MANAGER_H

#include "models.h"

bool apiInit();

bool sendBatteryData(const BatteryData& data);

#endif